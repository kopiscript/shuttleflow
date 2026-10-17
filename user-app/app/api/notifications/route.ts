import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  sendAlertNotification,
  sendAnnouncement,
  sendInfo,
} from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { title, message, type = "info" } = await request.json();

    if (
      typeof title !== "string" ||
      typeof message !== "string" ||
      !title.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 },
      );
    }

    let notification;

    switch (type) {
      case "announcement":
        notification = await sendAnnouncement(title.trim(), message.trim());
        break;

      case "info":
        notification = await sendInfo(title.trim(), message.trim());
        break;

      case "alert":
        notification = await sendAlertNotification(
          title.trim(),
          message.trim(),
        );
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Use announcement, info, or alert for this endpoint",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Notification creation failed:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 },
    );
  }
}

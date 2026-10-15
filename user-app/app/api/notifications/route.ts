// admin-app/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 }
      );
    }

    // Save to DB
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || "info",
      },
    });

    // Broadcast to all connected clients via Pusher
    await pusherServer.trigger("notifications", "new-notification", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });

    console.log(`📡 Broadcasted notification: ${notification.title}`);

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
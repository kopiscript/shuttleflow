import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Pusher from "pusher";

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type } = body;

    // Save to database
    const notification = await prisma.notification.create({
      data: {
        title: title,
        message: message,
        type: type || "info",
      }
    });

    // 🚀 BROADCAST TO ALL CONNECTED CLIENTS
    await pusher.trigger("notifications", "new-notification", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });

    console.log("📡 Broadcasted to all clients");

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
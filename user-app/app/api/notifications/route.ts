import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerNotificationPopup } from "@/lib/popup";

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({ 
      success: true, 
      notifications 
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch notifications" 
      },
      { status: 500 }
    );
  }
}

// ✅ ADD THIS POST METHOD
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type } = body;
    
    console.log("📝 Creating notification:", { title, message, type });
    
    // Save to database
    const notification = await prisma.notification.create({
      data: {
        title: title,
        message: message,
        type: type || "info",
      }
    });
    
    console.log("✅ Notification saved to database:", notification);
    
    // Trigger popup
    triggerNotificationPopup(title, message, type);
    
    return NextResponse.json({ 
      success: true, 
      notification,
      message: "Notification created and popup triggered!"
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create notification" 
      },
      { status: 500 }
    );
  }
}
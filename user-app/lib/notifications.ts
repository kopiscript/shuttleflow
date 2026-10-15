import { prisma } from "./prisma";
import { pusherServer } from "./pusher-server";

// Broadcast a notification in real-time to all connected clients via Pusher.
// This works from server-side code (API routes), unlike the old
// window.dispatchEvent-based popup trigger, which only worked in the browser.
async function broadcastNotification(notification: {
  id: number;
  title: string;
  message: string;
  type: string;
}) {
  try {
    await pusherServer.trigger("notifications", "new-notification", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });
    console.log(`📡 Broadcasted notification: ${notification.title}`);
  } catch (error) {
    console.error("Failed to broadcast notification via Pusher:", error);
  }
}

// Send email to all verified subscribers
async function sendEmailsToSubscribers(
  title: string,
  message: string,
  type: string,
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/notifications/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, type }),
    });

    if (!response.ok) {
      throw new Error(`Notification email API failed: HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Notification email API failed");
    }

    console.log("Notification email result:", {
      emailsAccepted: result.emailsSent,
      message: result.message,
    });

    return result;
  } catch (error) {
    console.error("Failed to send email notifications:", error);
    // Don't throw - email failure shouldn't break the notification
  }
}

export async function sendDelayNotification(
  busName: string,
  delayMinutes: number,
  reason: string,
) {
  const notification = await prisma.notification.create({
    data: {
      type: "delay",
      title: `${busName} Bus Delay`,
      message: `${busName} is delayed by ${delayMinutes} minutes due to ${reason}.`,
    },
  });

  console.log(`📢 Delay notification sent for ${busName}`);

  await broadcastNotification(notification);

  // 🚀 Send emails to subscribers
  await sendEmailsToSubscribers(
    notification.title,
    notification.message,
    notification.type,
  );

  return notification;
}

export async function sendAlertNotification(title: string, message: string) {
  const notification = await prisma.notification.create({
    data: {
      type: "alert",
      title: title,
      message: message,
    },
  });

  console.log(`⚠️ Alert notification sent: ${title}`);

  await broadcastNotification(notification);

  // 🚀 Send emails to subscribers
  await sendEmailsToSubscribers(
    notification.title,
    notification.message,
    notification.type,
  );

  return notification;
}

export async function sendAnnouncement(title: string, message: string) {
  const notification = await prisma.notification.create({
    data: {
      type: "announcement",
      title: title,
      message: message,
    },
  });

  console.log(`📢 Announcement sent: ${title}`);

  await broadcastNotification(notification);

  // 🚀 Send emails to subscribers
  await sendEmailsToSubscribers(
    notification.title,
    notification.message,
    notification.type,
  );

  return notification;
}

export async function sendInfo(title: string, message: string) {
  const notification = await prisma.notification.create({
    data: {
      type: "info",
      title: title,
      message: message,
    },
  });

  console.log(`ℹ️ Info notification sent: ${title}`);

  await broadcastNotification(notification);

  // 🚀 Send emails to subscribers
  await sendEmailsToSubscribers(
    notification.title,
    notification.message,
    notification.type,
  );

  return notification;
}

/** Send proximity alert when bus is near the PICKUP point */
export async function sendProximityAlert(
  routeName: string,
  pickupStop: string,
  distance: number,
) {
  const title = `🚌 ${routeName} is arriving!`;
  const message = `The bus is ${distance} meters from ${pickupStop}. Please be ready at the pickup point.`;

  const notification = await prisma.notification.create({
    data: {
      type: "alert",
      title: title,
      message: message,
    },
  });

  console.log(`Pickup proximity alert saved: ${title}`);

  await broadcastNotification(notification);

  console.log(`Broadcast sent for: ${title}`);

  await sendEmailsToSubscribers(
    notification.title,
    notification.message,
    notification.type,
  );

  return notification;
}

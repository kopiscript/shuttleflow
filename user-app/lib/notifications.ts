import { prisma } from './prisma';
import { pusherServer } from './pusher-server';

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

export async function sendDelayNotification(busName: string, delayMinutes: number, reason: string) {
  const notification = await prisma.notification.create({
    data: {
      type: "delay",
      title: `${busName} Bus Delay`,
      message: `${busName} is delayed by ${delayMinutes} minutes due to ${reason}.`,
    }
  });

  console.log(`📢 Delay notification sent for ${busName}`);

  await broadcastNotification(notification);

  return notification;
}

export async function sendAlertNotification(title: string, message: string) {
  const notification = await prisma.notification.create({
    data: {
      type: "alert",
      title: title,
      message: message,
    }
  });

  console.log(`⚠️ Alert notification sent: ${title}`);

  await broadcastNotification(notification);

  return notification;
}

export async function sendAnnouncement(title: string, message: string) {
  const notification = await prisma.notification.create({
    data: {
      type: "announcement",
      title: title,
      message: message,
    }
  });

  console.log(`📢 Announcement sent: ${title}`);

  await broadcastNotification(notification);

  return notification;
}

export async function sendInfo(title: string, message: string) {
  const notification = await prisma.notification.create({
    data: {
      type: "info",
      title: title,
      message: message,
    }
  });

  console.log(`ℹ️ Info notification sent: ${title}`);

  await broadcastNotification(notification);

  return notification;
}

/** Send proximity alert when bus is near destination */
export async function sendProximityAlert(
  routeName: string,
  destination: string,
  distance: number
) {
  const title = `🚌 ${routeName} Approaching!`;
  const message = `The bus is ${distance} meters from ${destination}. Please prepare to alight.`;

  // Save to database
  const notification = await prisma.notification.create({
    data: {
      type: "alert",
      title: title,
      message: message,
    }
  });

  console.log(`📍 Proximity alert saved: ${title}`);

  // Broadcast real-time popup via Pusher (works server-side, unlike the old
  // window-event based trigger which silently no-op'd on the server)
  await broadcastNotification(notification);

  console.log(`🔔 Broadcast sent for: ${title}`);

  return notification;
}
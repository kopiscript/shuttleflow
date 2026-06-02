import { prisma } from './prisma';
import { triggerNotificationPopup } from './popup';

export async function sendDelayNotification(busName: string, delayMinutes: number, reason: string) {
  const notification = await prisma.notification.create({
    data: {
      type: "delay",
      title: `${busName} Bus Delay`,
      message: `${busName} is delayed by ${delayMinutes} minutes due to ${reason}.`,
    }
  });
  
  console.log(`📢 Delay notification sent for ${busName}`);
  
  // Trigger popup
  triggerNotificationPopup(
    `${busName} Bus Delay`,
    `${busName} is delayed by ${delayMinutes} minutes due to ${reason}.`,
    "delay"
  );
  
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
  
  // Trigger popup
  triggerNotificationPopup(title, message, "alert");
  
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
  
  // Trigger popup
  triggerNotificationPopup(title, message, "announcement");
  
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
  
  // Trigger popup
  triggerNotificationPopup(title, message, "info");
  
  return notification;
}
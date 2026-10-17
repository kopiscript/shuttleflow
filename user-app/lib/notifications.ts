import { prisma } from "./prisma";
import { pusherServer } from "./pusher-server";
import { Resend } from "resend";

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
function escapeEmailHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

async function sendEmailsToSubscribers(
  title: string,
  message: string,
  type: string,
) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const userAppUrl = process.env.USER_APP_URL;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is missing in the admin app");
    }

    if (!userAppUrl) {
      throw new Error("USER_APP_URL is missing in the admin app");
    }

    const resend = new Resend(apiKey);

    const subscribers = await prisma.email_subscribers.findMany({
      where: { verified: true },
      select: {
        id: true,
        email: true,
      },
    });

    console.log("Starting notification emails:", {
      type,
      subscriberCount: subscribers.length,
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = new URL("/api/unsubscribe", userAppUrl);
        unsubscribeUrl.searchParams.set("email", subscriber.email);

        const { data, error } = await resend.emails.send({
          from: "ShuttleFlow <noreply@shuttleflow.azmiproductions.com>",
          to: subscriber.email,
          subject: `🚌 ShuttleFlow Alert: ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #99121A;">ShuttleFlow Alert</h2>
              <h3>${escapeEmailHtml(title)}</h3>
              <p style="white-space: pre-wrap;">${escapeEmailHtml(message)}</p>
              <hr style="margin: 20px 0;" />
              <p style="color: #666; font-size: 12px;">
                You received this because you subscribed to ShuttleFlow alerts.
                <br />
                <a href="${escapeEmailHtml(unsubscribeUrl.toString())}">
                  Unsubscribe
                </a>
              </p>
            </div>
          `,
        });

        if (error || !data?.id) {
          emailsFailed++;

          console.error("Notification email failed:", {
            subscriberId: subscriber.id,
            error: error ?? "No email ID returned",
          });
        } else {
          emailsSent++;

          console.log("Notification email accepted:", {
            subscriberId: subscriber.id,
            emailId: data.id,
          });
        }
      } catch (error) {
        emailsFailed++;

        console.error("Notification email request failed:", {
          subscriberId: subscriber.id,
          error,
        });
      }

      // Space out requests for this small subscriber-list test.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const result = {
      success: emailsFailed === 0,
      emailsSent,
      emailsFailed,
    };

    console.log("Notification email result:", result);

    return result;
  } catch (error) {
    console.error("Failed to send email notifications:", error);

    // Keep website notifications working if email fails.
    return {
      success: false,
      emailsSent: 0,
      error: "Could not complete email sending",
    };
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

import webpush from "web-push";
import type { Repositories, Notification } from "../types";

// VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

// Initialize web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("[web-push] VAPID details configured successfully");
} else {
  console.warn(
    "[web-push] VAPID keys not configured. Push notifications will not work.",
  );
}

/**
 * Send a push notification to a user
 * @param repos - Repositories instance
 * @param userId - Target user ID
 * @param notification - Notification data to send
 */
export async function sendPushNotification(
  repos: Repositories,
  userId: string,
  notification: Notification,
): Promise<void> {
  // Skip if VAPID keys are not configured
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[web-push] Skipping push notification - VAPID keys not configured");
    return;
  }

  try {
    // Get all push subscriptions for this user
    const subscriptions = await repos.pushSubscriptions.findByUserId(userId);

    if (subscriptions.length === 0) {
      console.log(`[web-push] No push subscriptions found for user ${userId}`);
      return;
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.detail,
      icon: notification.photo || "/logo.png",
      badge: "/logo.png",
      tag: notification._id,
      notificationId: notification._id,
      url: `/notifications/${notification._id}`,
    });

    // Send push to all subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        );
        console.log(`[web-push] Push sent to ${sub.endpoint.slice(0, 50)}...`);
      } catch (error) {
        // If the subscription is no longer valid, delete it
        const webPushError = error as { statusCode?: number };
        if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
          console.log(
            `[web-push] Subscription expired, deleting: ${sub.endpoint.slice(0, 50)}...`,
          );
          await repos.pushSubscriptions.deleteByEndpoint(sub.endpoint);
        } else {
          console.error(`[web-push] Failed to send push:`, error);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("[web-push] Error sending push notification:", error);
  }
}

/**
 * Get VAPID public key for frontend subscription
 */
export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}

/**
 * Check if web-push is properly configured
 */
export function isWebPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

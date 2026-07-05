import { Hono } from "hono";
import type { Repositories, Id } from "../types";
import { requireAuth, type AppEnv } from "../middleware/auth";
import { getVapidPublicKey, isWebPushConfigured } from "../utils/web-push";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

export function createPushSubscriptionsRoutes(repos: Repositories) {
  const app = new Hono<AppEnv>();

  // Public endpoint to get VAPID public key (needed for frontend subscription)
  app.get("/vapid-public-key", (c) => {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      throw new AppError(ErrorCode.PUSH_NOT_CONFIGURED, 503);
    }
    return c.json({ publicKey, configured: isWebPushConfigured() });
  });

  // Apply authentication middleware to all other routes
  app.use("*", requireAuth(repos));

  // Register a new push subscription
  app.post("/", async (c) => {
    try {
      const userId = c.get("auth").user._id;
      const body = await c.req.json();

      // Validate required fields
      if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
        throw new AppError(ErrorCode.MISSING_FIELD, 400, { fields: "endpoint, keys.p256dh, keys.auth" });
      }

      // Check if subscription already exists for this endpoint
      const existing = await repos.pushSubscriptions.findByEndpoint(
        body.endpoint,
      );
      if (existing) {
        // Update the userId if the subscription exists but belongs to a different user
        // (e.g., user logged in with different account on same device)
        if (existing.userId !== userId) {
          await repos.pushSubscriptions.deleteByEndpoint(body.endpoint);
        } else {
          // Subscription already exists for this user
          return c.json({ success: true, message: "Subscription already exists" });
        }
      }

      // Create new subscription
      const subscription = await repos.pushSubscriptions.create({
        userId: userId as Id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      });

      return c.json({ success: true, subscription }, 201);
    } catch (error) {
      console.error("Error creating push subscription:", error);
      throw new AppError(ErrorCode.CREATE_PUSH_SUBSCRIPTION_FAILED, 500);
    }
  });

  // Delete a push subscription (unsubscribe)
  app.delete("/", async (c) => {
    try {
      const body = await c.req.json();

      if (!body.endpoint) {
        throw new AppError(ErrorCode.MISSING_FIELD, 400, { field: "endpoint" });
      }

      const deleted = await repos.pushSubscriptions.deleteByEndpoint(
        body.endpoint,
      );

      if (!deleted) {
        throw new AppError(ErrorCode.PUSH_SUBSCRIPTION_NOT_FOUND, 404);
      }

      return c.json({ success: true, message: "Subscription deleted" });
    } catch (error) {
      console.error("Error deleting push subscription:", error);
      throw new AppError(ErrorCode.DELETE_PUSH_SUBSCRIPTION_FAILED, 500);
    }
  });

  // Get all push subscriptions for the authenticated user
  app.get("/", async (c) => {
    try {
      const userId = c.get("auth").user._id;
      const subscriptions = await repos.pushSubscriptions.findByUserId(userId);
      return c.json({ subscriptions });
    } catch (error) {
      console.error("Error fetching push subscriptions:", error);
      throw new AppError(ErrorCode.FETCH_PUSH_SUBSCRIPTIONS_FAILED, 500);
    }
  });

  return app;
}

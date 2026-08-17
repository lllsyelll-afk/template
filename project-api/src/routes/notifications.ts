import { Hono } from "hono";
import type { Repositories, Id, Notification } from "../types";
import { requireAuth, type AppEnv } from "../middleware/auth";
import { wsServer } from "../websocket";
import { enqueueJob } from "../queue";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

export function createNotificationsRoutes(repos: Repositories) {
  const app = new Hono<AppEnv>();

  // Apply authentication middleware to all routes
  app.use("*", requireAuth(repos));

  // Get a single notification by ID
  app.get("/:id", async (c) => {
    try {
      const notificationId = c.req.param("id") as Id;
      const userId = c.get("auth").user._id;

      const notification = await repos.notifications.findById(notificationId);

      if (!notification || notification.userId !== userId) {
        throw new AppError(ErrorCode.NOTIFICATION_NOT_FOUND, 404);
      }

      return c.json(notification);
    } catch (error) {
      console.error("Error fetching notification:", error);
      throw new AppError(ErrorCode.FETCH_NOTIFICATION_FAILED, 500);
    }
  });

  // Get notifications for the authenticated user with filtering
  app.get("/", async (c) => {
    try {
      const userId = c.get("auth").user._id;

      // Parse query parameters
      const readed =
        c.req.query("readed") === "true"
          ? true
          : c.req.query("readed") === "false"
            ? false
            : undefined;
      const limitQuery = c.req.query("limit");
      const limit = limitQuery ? parseInt(limitQuery) : undefined;
      const offsetQuery = c.req.query("offset");
      const offset = offsetQuery ? parseInt(offsetQuery) : undefined;

      // Use optimized backend filtering
      const result = await repos.notifications.findByUserIdWithFilters(userId, {
        readed,
        limit,
        offset,
      });

      return c.json(result);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw new AppError(ErrorCode.FETCH_NOTIFICATIONS_FAILED, 500);
    }
  });

  // Mark a specific notification as read
  app.patch("/:id/read", async (c) => {
    try {
      const notificationId = c.req.param("id") as Id;
      const userId = c.get("auth").user._id;

      const notification = await repos.notifications.findById(notificationId);

      if (!notification || notification.userId !== userId) {
        throw new AppError(ErrorCode.NOTIFICATION_NOT_FOUND, 404);
      }

      const updatedNotification = await repos.notifications.update(
        notificationId,
        {
          readed: true,
          updatedAt: new Date(),
        },
      );

      return c.json(updatedNotification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new AppError(ErrorCode.MARK_NOTIFICATION_FAILED, 500);
    }
  });

  // Mark all notifications as read for the user
  app.patch("/mark-all-read", async (c) => {
    try {
      const userId = c.get("auth").user._id;

      await repos.notifications.markAllAsRead(userId);

      return c.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new AppError(ErrorCode.MARK_ALL_NOTIFICATIONS_FAILED, 500);
    }
  });

  // Create a new notification (internal use)
  app.post("/", async (c) => {
    try {
      const body = await c.req.json();

      const notification: Omit<Notification, "_id"> = {
        userId: body.userId,
        title: body.title,
        detail: body.detail,
        photo: body.photo || null,
        readed: false,
        meta: body.meta || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdNotification =
        await repos.notifications.create(notification);

      // Send real-time notification via WebSocket
      wsServer.sendToUser(createdNotification.userId, {
        type: "notification",
        data: createdNotification,
      });

      // Offload WebPush dispatch asynchronously to the job queue
      enqueueJob("push:send", {
        userId: createdNotification.userId,
        notification: createdNotification,
      }).catch((err) => {
        console.warn("[notifications] Failed to enqueue push job:", err);
      });

      return c.json(createdNotification);
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new AppError(ErrorCode.CREATE_NOTIFICATION_FAILED, 500);
    }
  });

  return app;
}

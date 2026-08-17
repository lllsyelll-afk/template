import { Job } from "../types";
import { Notification, Repositories } from "../../types";
import { sendPushNotification } from "../../utils/web-push";

export interface PushJobData {
  userId: string;
  notification: Notification;
}

export function createPushJobHandler(repos: Repositories) {
  return async function processPushJob(job: Job<PushJobData>): Promise<void> {
    const { userId, notification } = job.data;
    if (!userId || !notification) {
      throw new Error("Invalid push job data: 'userId' and 'notification' are required");
    }

    await sendPushNotification(repos, userId, notification);
    console.log(`[queue:push] Dispatched push notification to user ${userId}`);
  };
}

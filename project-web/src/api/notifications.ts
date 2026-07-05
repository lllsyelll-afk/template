import { api } from "@utils/client";
import type { Notification } from "app-types";

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total?: number;
}

export async function getNotification(
  notificationId: string,
): Promise<Notification> {
  return api.get<Notification>(`/notifications/${notificationId}`);
}

export async function getNotifications(options?: {
  readed?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotificationsResponse> {
  const params = new URLSearchParams();

  if (options?.readed !== undefined) {
    params.append("readed", options.readed.toString());
  }
  if (options?.limit !== undefined) {
    params.append("limit", options.limit.toString());
  }
  if (options?.offset !== undefined) {
    params.append("offset", options.offset.toString());
  }

  const query = params.toString();
  const url = query ? `/notifications?${query}` : "/notifications";

  return api.get<NotificationsResponse>(url);
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  return api.patch<Notification>(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  return api.patch<void>("/notifications/mark-all-read");
}

export async function createNotification(data: {
  userId: string;
  title: string;
  detail: string;
  photo?: string;
}): Promise<Notification> {
  return api.post<Notification>("/notifications", data);
}

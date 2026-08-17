import { z } from "zod";

export const IdSchema = z.string();
export type Id = z.infer<typeof IdSchema>;

export const UserSchema = z.object({
  _id: IdSchema,
  name: z.string(),
  photo: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string(),
  passwordHash: z.string().optional(),
  googleId: z.string().nullable().optional(),
  facebookId: z.string().nullable().optional(),
  blocked: z.boolean(),
  permissions: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  failedLoginAttempts: z.number().optional(),
  lockedUntil: z.string().nullable().optional(),
  lastFailedLoginAt: z.string().nullable().optional(),
  tokenVersion: z.number().optional(),
  totpSecret: z.string().nullable().optional(),
  twoFactorEnabled: z.boolean().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const NotificationSchema = z.object({
  _id: IdSchema,
  userId: IdSchema,
  title: z.string(),
  detail: z.string(),
  photo: z.string().nullable().optional(),
  readed: z.boolean(),
  meta: z.record(z.union([z.array(z.string()), z.number(), z.string(), z.boolean()])).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const PushSubscriptionSchema = z.object({
  _id: IdSchema,
  userId: IdSchema,
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;

export const InvoiceSchema = z.object({
  _id: IdSchema,
  photo: z.string(),
  description: z.string(),
  amount: z.number(),
  approvalLink: z.string(),
  createdBy: IdSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const InvoiceWithCreatorSchema = InvoiceSchema.extend({
  creator: z.object({
    _id: IdSchema,
    name: z.string(),
    photo: z.string().nullable().optional(),
  }),
});
export type InvoiceWithCreator = z.infer<typeof InvoiceWithCreatorSchema>;

export const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  unreadCount: z.number(),
  total: z.number().optional(),
});
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;

export const InfiniteNotificationsDataSchema = z.object({
  pages: z.array(NotificationsResponseSchema),
  pageParams: z.array(z.number()),
});
export type InfiniteNotificationsData = z.infer<typeof InfiniteNotificationsDataSchema>;

export const AdminUserSchema = z.object({
  _id: IdSchema,
  name: z.string(),
  photo: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string(),
  blocked: z.boolean(),
  verified: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

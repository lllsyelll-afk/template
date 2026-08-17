// Shared API types. The repository layer abstracts MongoDB so we can also
// run with an in-memory fallback when no MONGODB_URI is provided.

export type Id = string;

export interface User {
  _id: Id;
  name: string;
  photo?: string | null;
  email?: string | null;
  phone: string;
  passwordHash: string;
  googleId?: string | null;
  facebookId?: string | null;
  blocked: boolean;
  permissions?: string[];
  verified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Account lockout fields
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  lastFailedLoginAt?: Date | null;
  tokenVersion?: number;
  totpSecret?: string | null;
  twoFactorEnabled?: boolean;
}

export interface OtpRecord {
  _id: Id;
  identifier: string; // phone or email
  code: string;
  purpose: "register" | "login" | "email_change" | "phone_change" | "forgot_password";
  used: boolean;
  failedAttempts: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface Notification {
  _id: Id;
  userId: Id;
  title: string;
  detail: string;
  photo?: string | null;
  readed: boolean;
  meta?: Record<string, string[] | number | string | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushSubscription {
  _id: Id;
  userId: Id;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  _id: Id;
  adminId: Id;
  adminName: string;
  action: string;
  method: string;
  path: string;
  resource: string;
  targetId?: string;
  body?: unknown;
  status: number;
  ip: string;
  createdAt: Date;
}

export interface Repositories {
  users: {
    create(data: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<User>;
    findById(id: Id): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    findByFacebookId(facebookId: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    findPaginated(page: number, limit: number): Promise<User[]>;
    count(): Promise<number>;
    search(query: string, limit?: number): Promise<User[]>;
    update(id: Id, patch: Partial<User>): Promise<User | null>;
    delete(id: Id): Promise<boolean>;
    // Account lockout methods
    getLockoutStatus(id: Id): Promise<{ locked: boolean; lockedUntil?: Date; failedAttempts: number }>;
    recordFailedLogin(id: Id): Promise<{ locked: boolean; lockedUntil?: Date }>;
    resetFailedLogins(id: Id): Promise<void>;
    incrementTokenVersion(id: Id): Promise<User | null>;
  };
  otps: {
    create(
      data: Omit<OtpRecord, "_id" | "createdAt" | "used" | "failedAttempts">,
    ): Promise<OtpRecord>;
    findActive(
      identifier: string,
      code: string,
      purpose: OtpRecord["purpose"],
    ): Promise<OtpRecord | null>;
    markUsed(id: Id): Promise<void>;
    recordFailedAttempt(
      identifier: string,
      purpose: OtpRecord["purpose"],
    ): Promise<number>;
    invalidateByIdentifier(
      identifier: string,
      purpose: OtpRecord["purpose"],
    ): Promise<void>;
    deleteByIdentifier(identifier: string): Promise<number>;
  };
  notifications: {
    create(
      data: Omit<Notification, "_id" | "createdAt" | "updatedAt">,
    ): Promise<Notification>;
    findById(id: Id): Promise<Notification | null>;
    findByUserId(userId: Id): Promise<Notification[]>;
    findByUserIdWithFilters(
      userId: Id,
      options?: {
        readed?: boolean;
        limit?: number;
        offset?: number;
      },
    ): Promise<{
      notifications: Notification[];
      unreadCount: number;
      total: number;
    }>;
    update(id: Id, patch: Partial<Notification>): Promise<Notification | null>;
    markAllAsRead(userId: Id): Promise<void>;
    delete(id: Id): Promise<boolean>;
    deleteByUser(userId: Id): Promise<number>;
  };
  auditLogs: {
    create(
      data: Omit<AuditLog, "_id" | "createdAt">,
    ): Promise<AuditLog>;
    findPaginated(
      page: number,
      limit: number,
      filters?: { adminId?: Id; action?: string; resource?: string },
    ): Promise<{ logs: AuditLog[]; total: number }>;
  };
  pushSubscriptions: {
    create(
      data: Omit<PushSubscription, "_id" | "createdAt" | "updatedAt">,
    ): Promise<PushSubscription>;
    findByUserId(userId: Id): Promise<PushSubscription[]>;
    findByEndpoint(endpoint: string): Promise<PushSubscription | null>;
    deleteByEndpoint(endpoint: string): Promise<boolean>;
    deleteByUserId(userId: Id): Promise<number>;
  };
}

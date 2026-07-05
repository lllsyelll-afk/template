// MongoDB native-driver repository. Uses ObjectId on the wire but exposes
// string ids to the rest of the application for portability.
import {
  Collection,
  Db,
  MongoClient,
  MongoClientOptions,
  ObjectId,
  type WithId,
} from "mongodb";
import {
  sanitizeRegex,
  isValidObjectId,
  sanitizeSearchQuery,
} from "../utils/sanitize";
import type {
  OtpRecord,
  Repositories,
  User,
  Notification,
  PushSubscription,
  AuditLog,
} from "../types";

interface MongoUser extends Omit<User, "_id"> {
  _id: ObjectId;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  lastFailedLoginAt?: Date | null;
  tokenVersion?: number;
}
interface MongoOtp extends Omit<OtpRecord, "_id"> {
  _id: ObjectId;
}
interface MongoNotification extends Omit<Notification, "_id" | "userId"> {
  _id: ObjectId;
  userId: ObjectId;
}
interface MongoPushSubscription extends Omit<
  PushSubscription,
  "_id" | "userId"
> {
  _id: ObjectId;
  userId: ObjectId;
}
interface MongoAuditLog extends Omit<AuditLog, "_id" | "adminId"> {
  _id: ObjectId;
  adminId: ObjectId;
}

function toId(id: string): ObjectId {
  if (!isValidObjectId(id)) {
    return new ObjectId("000000000000000000000000");
  }
  try {
    return new ObjectId(id);
  } catch {
    return new ObjectId("000000000000000000000000");
  }
}

async function ensureIndexes(
  usersCol: Collection<MongoUser>,
  otpsCol: Collection<MongoOtp>,
  notificationsCol: Collection<MongoNotification>,
  pushSubscriptionsCol: Collection<MongoPushSubscription>,
  auditLogsCol: Collection<MongoAuditLog>,
): Promise<void> {
  // Users collection indexes
  await usersCol.createIndex({ phone: 1 }, { unique: true });
  await usersCol.createIndex({ email: 1 }, { unique: true, sparse: true });
  await usersCol.createIndex({ googleId: 1 }, { unique: true, sparse: true });
  await usersCol.createIndex({ facebookId: 1 }, { unique: true, sparse: true });
  await usersCol.createIndex({ createdAt: -1 });

  // OTPs collection indexes
  await otpsCol.createIndex({
    identifier: 1,
    code: 1,
    purpose: 1,
    used: 1,
    expiresAt: 1,
  });
  await otpsCol.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  // Notifications collection indexes
  await notificationsCol.createIndex({ userId: 1, createdAt: -1 });
  await notificationsCol.createIndex({ userId: 1, readed: 1, createdAt: -1 });
  await notificationsCol.createIndex({ createdAt: -1 });

  // Push subscriptions collection indexes
  await pushSubscriptionsCol.createIndex({ userId: 1 });
  await pushSubscriptionsCol.createIndex({ endpoint: 1 }, { unique: true });

  // Audit logs collection indexes
  await auditLogsCol.createIndex({ adminId: 1, createdAt: -1 });
  await auditLogsCol.createIndex({ createdAt: -1 });
  await auditLogsCol.createIndex({ resource: 1, createdAt: -1 });
}

function mapUser(u: WithId<MongoUser> | null): User | null {
  if (!u) return null;
  return { ...u, _id: u._id.toHexString() };
}

function mapNotification(
  n: WithId<MongoNotification> | null,
): Notification | null {
  if (!n) return null;
  return {
    ...n,
    _id: n._id.toHexString(),
    userId: n.userId.toHexString(),
  };
}

function mapPushSubscription(
  ps: WithId<MongoPushSubscription> | null,
): PushSubscription | null {
  if (!ps) return null;
  return {
    ...ps,
    _id: ps._id.toHexString(),
    userId: ps.userId.toHexString(),
  };
}

function mapAuditLog(al: WithId<MongoAuditLog> | null): AuditLog | null {
  if (!al) return null;
  return {
    ...al,
    _id: al._id.toHexString(),
    adminId: al.adminId.toHexString(),
  };
}

export async function createMongoRepositories(
  uri: string,
  dbName: string,
): Promise<{ repos: Repositories; close: () => Promise<void> }> {
  let options: MongoClientOptions = {
    retryWrites: true,
    w: "majority",
  };

  const client = new MongoClient(uri, options);
  await client.connect();
  const db: Db = client.db(dbName);
  const usersCol: Collection<MongoUser> = db.collection("users");
  const otpsCol: Collection<MongoOtp> = db.collection("otps");
  const notificationsCol: Collection<MongoNotification> = db.collection("notifications");
  const pushSubscriptionsCol: Collection<MongoPushSubscription> = db.collection("push_subscriptions");
  const auditLogsCol: Collection<MongoAuditLog> = db.collection("audit_logs");

  await ensureIndexes(
    usersCol,
    otpsCol,
    notificationsCol,
    pushSubscriptionsCol,
    auditLogsCol,
  );

  const repos: Repositories = {
    users: {
      async create(data) {
        const now = new Date();
        const doc: MongoUser = {
          _id: new ObjectId(),
          createdAt: now,
          updatedAt: now,
          tokenVersion: 0,
          ...data,
        };
        await usersCol.insertOne(doc);
        return mapUser(doc as WithId<MongoUser>)!;
      },
      async findById(id) {
        return mapUser(await usersCol.findOne({ _id: toId(id) }));
      },
      async findByPhone(phone) {
        return mapUser(await usersCol.findOne({ phone }));
      },
      async findByEmail(email) {
        return mapUser(await usersCol.findOne({ email }));
      },
      async findByGoogleId(googleId) {
        return mapUser(await usersCol.findOne({ googleId }));
      },
      async findAll() {
        const docs = await usersCol.find({}).sort({ createdAt: -1 }).toArray();
        return docs.map((d) => mapUser(d)!);
      },
      async findPaginated(page, limit) {
        const skip = (page - 1) * limit;
        const docs = await usersCol
          .find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        return docs.map((d) => mapUser(d)!);
      },
      async count() {
        return await usersCol.countDocuments();
      },
      async search(query, limit = 20) {
        const sanitizedQuery = sanitizeSearchQuery(query);
        if (!sanitizedQuery) {
          return [];
        }
        const regex = new RegExp(sanitizeRegex(sanitizedQuery), "i");
        const docs = await usersCol
          .find({
            $or: [{ name: { $regex: regex } }, { phone: { $regex: regex } }],
          })
          .limit(limit)
          .toArray();
        return docs.map((d) => mapUser(d)!);
      },
      async update(id, patch) {
        const { _id: _omit, ...rest } = patch as User;
        const result = await usersCol.findOneAndUpdate(
          { _id: toId(id) },
          { $set: { ...rest, updatedAt: new Date() } },
          { returnDocument: "after" },
        );
        return mapUser(result as WithId<MongoUser> | null);
      },
      async delete(id) {
        const r = await usersCol.deleteOne({ _id: toId(id) });
        return r.deletedCount === 1;
      },
      async getLockoutStatus(id: string): Promise<{
        locked: boolean;
        lockedUntil?: Date;
        failedAttempts: number;
      }> {
        const user = await usersCol.findOne(
          { _id: toId(id) },
          { projection: { failedLoginAttempts: 1, lockedUntil: 1 } },
        );
        if (!user) return { locked: false, failedAttempts: 0 };

        const now = new Date();
        const lockedUntil = user.lockedUntil;
        const isLocked = lockedUntil && lockedUntil > now;

        return {
          locked: !!isLocked,
          lockedUntil: isLocked ? lockedUntil : undefined,
          failedAttempts: user.failedLoginAttempts || 0,
        };
      },
      async recordFailedLogin(
        id: string,
      ): Promise<{ locked: boolean; lockedUntil?: Date }> {
        const now = new Date();
        const maxAttempts = 5;
        const lockoutDurationMs = 30 * 60 * 1000; // 30 minutes

        const user = await usersCol.findOne(
          { _id: toId(id) },
          { projection: { failedLoginAttempts: 1 } },
        );

        const currentAttempts = (user?.failedLoginAttempts || 0) + 1;

        if (currentAttempts >= maxAttempts) {
          const lockedUntil = new Date(now.getTime() + lockoutDurationMs);
          await usersCol.updateOne(
            { _id: toId(id) },
            {
              $set: {
                failedLoginAttempts: currentAttempts,
                lockedUntil: lockedUntil,
                lastFailedLoginAt: now,
                updatedAt: now,
              },
            },
          );
          return { locked: true, lockedUntil };
        } else {
          await usersCol.updateOne(
            { _id: toId(id) },
            {
              $set: {
                failedLoginAttempts: currentAttempts,
                lastFailedLoginAt: now,
                updatedAt: now,
              },
            },
          );
          return { locked: false };
        }
      },
      async resetFailedLogins(id: string): Promise<void> {
        await usersCol.updateOne(
          { _id: toId(id) },
          {
            $set: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              updatedAt: new Date(),
            },
          },
        );
      },
      async incrementTokenVersion(id: string): Promise<User | null> {
        const result = await usersCol.findOneAndUpdate(
          { _id: toId(id) },
          { $inc: { tokenVersion: 1 }, $set: { updatedAt: new Date() } },
          { returnDocument: "after" },
        );
        return mapUser(result as WithId<MongoUser> | null);
      },
    },
    otps: {
      async create(data) {
        const doc: MongoOtp = {
          _id: new ObjectId(),
          used: false,
          failedAttempts: 0,
          createdAt: new Date(),
          ...data,
        };
        await otpsCol.insertOne(doc);
        return { ...doc, _id: doc._id.toHexString() };
      },
      async findActive(identifier, code, purpose) {
        const found = await otpsCol.findOne({
          identifier,
          code,
          purpose,
          used: false,
          expiresAt: { $gt: new Date() },
        });
        if (!found) return null;
        return { ...found, _id: found._id.toHexString() };
      },
      async markUsed(id) {
        await otpsCol.updateOne({ _id: toId(id) }, { $set: { used: true } });
      },
      async recordFailedAttempt(identifier, purpose) {
        const since = new Date(Date.now() - 10 * 60 * 1000);
        const result = await otpsCol.findOneAndUpdate(
          {
            identifier,
            purpose,
            used: false,
            expiresAt: { $gt: new Date() },
            createdAt: { $gt: since },
          },
          { $inc: { failedAttempts: 1 } },
          { sort: { createdAt: -1 }, returnDocument: "after" },
        );
        return result?.failedAttempts ?? 1;
      },
      async invalidateByIdentifier(identifier, purpose) {
        await otpsCol.updateMany(
          { identifier, purpose, used: false },
          { $set: { used: true } },
        );
      },
      async deleteByIdentifier(identifier) {
        const result = await otpsCol.deleteMany({ identifier });
        return result.deletedCount;
      },
    },
    notifications: {
      async create(data) {
        const doc: MongoNotification = {
          _id: new ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          userId: toId(data.userId),
        };
        await notificationsCol.insertOne(doc);
        return mapNotification(doc as WithId<MongoNotification>)!;
      },
      async findById(id) {
        return mapNotification(await notificationsCol.findOne({ _id: toId(id) }));
      },
      async findByUserId(userId) {
        const docs = await notificationsCol
          .find({ userId: toId(userId) })
          .sort({ createdAt: -1 })
          .toArray();
        return docs.map((d) => mapNotification(d)!);
      },
      async findByUserIdWithFilters(userId, options = {}) {
        const filter: any = { userId: toId(userId) };
        if (options.readed !== undefined) {
          filter.readed = options.readed;
        }

        const limit = options.limit || 50;
        const offset = options.offset || 0;

        const [docs, unreadCount, total] = await Promise.all([
          notificationsCol
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .toArray(),
          notificationsCol.countDocuments({
            userId: toId(userId),
            readed: false,
          }),
          notificationsCol.countDocuments(filter),
        ]);

        return {
          notifications: docs.map((d) => mapNotification(d)!),
          unreadCount,
          total,
        };
      },
      async update(id, patch) {
        const { _id: _omit, userId, ...rest } = patch as Notification;
        const updateDoc: any = { ...rest, updatedAt: new Date() };
        if (userId) {
          updateDoc.userId = toId(userId);
        }
        const result = await notificationsCol.findOneAndUpdate(
          { _id: toId(id) },
          { $set: updateDoc },
          { returnDocument: "after" },
        );
        return mapNotification(result as WithId<MongoNotification> | null);
      },
      async markAllAsRead(userId) {
        await notificationsCol.updateMany(
          { userId: toId(userId), readed: false },
          { $set: { readed: true, updatedAt: new Date() } },
        );
      },
      async delete(id) {
        const r = await notificationsCol.deleteOne({ _id: toId(id) });
        return r.deletedCount === 1;
      },
      async deleteByUser(userId) {
        const r = await notificationsCol.deleteMany({ userId: toId(userId) });
        return r.deletedCount;
      },
    },
    auditLogs: {
      async create(data) {
        const doc: MongoAuditLog = {
          _id: new ObjectId(),
          createdAt: new Date(),
          ...data,
          adminId: toId(data.adminId),
        };
        await auditLogsCol.insertOne(doc);
        return mapAuditLog(doc as WithId<MongoAuditLog>)!;
      },
      async findPaginated(page, limit, filters) {
        const skip = (page - 1) * limit;
        const query: any = {};
        
        if (filters) {
          if (filters.adminId) query.adminId = toId(filters.adminId);
          if (filters.action) query.action = filters.action;
          if (filters.resource) query.resource = filters.resource;
        }

        const [docs, total] = await Promise.all([
          auditLogsCol
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
          auditLogsCol.countDocuments(query)
        ]);

        return {
          logs: docs.map((d) => mapAuditLog(d)!),
          total
        };
      }
    },
    pushSubscriptions: {
      async create(data) {
        const now = new Date();
        const doc: MongoPushSubscription = {
          _id: new ObjectId(),
          ...data,
          userId: toId(data.userId),
          createdAt: now,
          updatedAt: now,
        };
        await pushSubscriptionsCol.insertOne(doc);
        return mapPushSubscription(doc as WithId<MongoPushSubscription>)!;
      },
      async findByUserId(userId) {
        const docs = await pushSubscriptionsCol
          .find({ userId: toId(userId) })
          .toArray();
        return docs.map((d) => mapPushSubscription(d)!);
      },
      async findByEndpoint(endpoint) {
        return mapPushSubscription(
          await pushSubscriptionsCol.findOne({ endpoint }),
        );
      },
      async deleteByEndpoint(endpoint) {
        const result = await pushSubscriptionsCol.deleteOne({ endpoint });
        return result.deletedCount > 0;
      },
      async deleteByUserId(userId) {
        const result = await pushSubscriptionsCol.deleteMany({
          userId: toId(userId),
        });
        return result.deletedCount;
      },
    },
  };

  return {
    repos,
    close: async () => {
      await client.close();
    },
  };
}

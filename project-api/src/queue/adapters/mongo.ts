import {
  Collection,
  Db,
  MongoClient,
  ObjectId,
  type WithId,
} from "mongodb";
import {
  Job,
  JobStatus,
  QueueAdapter,
  EnqueueOptions,
  QueueStats,
} from "../types";

interface MongoJobDoc {
  _id: ObjectId;
  name: string;
  data: unknown;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  priority: number;
  scheduledAt: Date;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  failedAt?: Date | null;
  failedReason?: string | null;
}

function mapJob<T = unknown>(doc: WithId<MongoJobDoc> | null): Job<T> | null {
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id.toHexString(),
    data: doc.data as T,
  };
}

export class MongoQueueAdapter implements QueueAdapter {
  private collection: Collection<MongoJobDoc> | null = null;
  private workerId = `mongo-worker-${Math.random().toString(36).substring(2, 9)}`;
  private lockTimeoutMs = 5 * 60 * 1000; // 5 minutes

  constructor(
    private uri?: string,
    private dbName?: string,
    private existingDb?: Db,
  ) {}

  private async getCollection(): Promise<Collection<MongoJobDoc>> {
    if (this.collection) return this.collection;

    let db: Db;
    if (this.existingDb) {
      db = this.existingDb;
    } else {
      const uri = this.uri || process.env.MONGODB_URI;
      const dbName = this.dbName || process.env.MONGODB_DB || "template_db";
      if (!uri) {
        throw new Error("MONGODB_URI is required for MongoQueueAdapter");
      }
      const client = new MongoClient(uri, { retryWrites: true, w: "majority" });
      await client.connect();
      db = client.db(dbName);
    }

    this.collection = db.collection<MongoJobDoc>("jobs");

    // Ensure Indexes
    await Promise.all([
      this.collection.createIndex(
        { status: 1, scheduledAt: 1, priority: -1 },
        { background: true },
      ),
      this.collection.createIndex(
        { name: 1, status: 1 },
        { background: true },
      ),
      this.collection.createIndex(
        { lockedAt: 1 },
        { background: true },
      ),
    ]);

    return this.collection;
  }

  async enqueue<T = unknown>(
    name: string,
    data: T,
    options: EnqueueOptions = {},
  ): Promise<Job<T>> {
    const col = await this.getCollection();
    const now = new Date();
    const scheduledAt = options.delayMs
      ? new Date(now.getTime() + options.delayMs)
      : now;

    const doc: MongoJobDoc = {
      _id: new ObjectId(),
      name,
      data,
      status: "pending",
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      priority: options.priority ?? 0,
      scheduledAt,
      lockedAt: null,
      lockedBy: null,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc);
    return mapJob(doc as WithId<MongoJobDoc>) as Job<T>;
  }

  async dequeue(limit: number = 1): Promise<Job[]> {
    const col = await this.getCollection();
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - this.lockTimeoutMs);
    const dequeued: Job[] = [];

    for (let i = 0; i < limit; i++) {
      // Atomically claim the next due pending job or stale locked job
      const doc = await col.findOneAndUpdate(
        {
          $or: [
            { status: "pending", scheduledAt: { $lte: now } },
            { status: "processing", lockedAt: { $lte: staleCutoff } },
          ],
        },
        {
          $set: {
            status: "processing",
            lockedAt: now,
            lockedBy: this.workerId,
            updatedAt: now,
          },
          $inc: { attempts: 1 },
        },
        {
          sort: { priority: -1, scheduledAt: 1 },
          returnDocument: "after",
        },
      );

      if (doc) {
        const mapped = mapJob(doc);
        if (mapped) dequeued.push(mapped);
      } else {
        // No more pending jobs available right now
        break;
      }
    }

    return dequeued;
  }

  async complete(jobId: string): Promise<boolean> {
    const col = await this.getCollection();
    const now = new Date();
    let oid: ObjectId;
    try {
      oid = new ObjectId(jobId);
    } catch {
      return false;
    }

    const res = await col.updateOne(
      { _id: oid },
      {
        $set: {
          status: "completed",
          lockedAt: null,
          lockedBy: null,
          completedAt: now,
          updatedAt: now,
        },
      },
    );

    return res.modifiedCount > 0;
  }

  async fail(
    jobId: string,
    error: Error,
    retryable: boolean = true,
  ): Promise<boolean> {
    const col = await this.getCollection();
    const now = new Date();
    let oid: ObjectId;
    try {
      oid = new ObjectId(jobId);
    } catch {
      return false;
    }

    const job = await col.findOne({ _id: oid });
    if (!job) return false;

    const failedReason = error.message || "Unknown error";

    if (retryable && job.attempts < job.maxAttempts) {
      // Exponential backoff: 2s, 4s, 8s, 16s... up to 1 hour
      const backoffMs = Math.min(
        1000 * Math.pow(2, job.attempts),
        60 * 60 * 1000,
      );
      const nextRun = new Date(now.getTime() + backoffMs);

      const res = await col.updateOne(
        { _id: oid },
        {
          $set: {
            status: "pending",
            scheduledAt: nextRun,
            lockedAt: null,
            lockedBy: null,
            failedReason,
            updatedAt: now,
          },
        },
      );
      return res.modifiedCount > 0;
    } else {
      const res = await col.updateOne(
        { _id: oid },
        {
          $set: {
            status: "failed",
            lockedAt: null,
            lockedBy: null,
            failedReason,
            failedAt: now,
            updatedAt: now,
          },
        },
      );
      return res.modifiedCount > 0;
    }
  }

  async getStats(): Promise<QueueStats> {
    const col = await this.getCollection();
    const [counts, total] = await Promise.all([
      col
        .aggregate<{ _id: JobStatus; count: number }>([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        .toArray(),
      col.countDocuments(),
    ]);

    const stats: QueueStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total,
    };

    for (const item of counts) {
      if (item._id in stats) {
        stats[item._id] = item.count;
      }
    }

    return stats;
  }

  async getJobs(
    status?: JobStatus,
    limit: number = 50,
    skip: number = 0,
  ): Promise<Job[]> {
    const col = await this.getCollection();
    const query = status ? { status } : {};
    const docs = await col
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return docs.map((d) => mapJob(d)!);
  }

  async retryFailed(limit: number = 100): Promise<number> {
    const col = await this.getCollection();
    const now = new Date();
    const failedDocs = await col
      .find({ status: "failed" })
      .limit(limit)
      .project<{ _id: ObjectId }>({ _id: 1 })
      .toArray();

    if (failedDocs.length === 0) return 0;

    const ids = failedDocs.map((d) => d._id);
    const res = await col.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: "pending",
          attempts: 0,
          scheduledAt: now,
          failedReason: null,
          failedAt: null,
          updatedAt: now,
        },
      },
    );

    return res.modifiedCount;
  }

  async clearCompleted(
    olderThanMs: number = 24 * 60 * 60 * 1000,
  ): Promise<number> {
    const col = await this.getCollection();
    const cutoff = new Date(Date.now() - olderThanMs);
    const res = await col.deleteMany({
      status: "completed",
      completedAt: { $lt: cutoff },
    });
    return res.deletedCount;
  }

  async check(): Promise<boolean> {
    try {
      const col = await this.getCollection();
      await col.findOne({}, { projection: { _id: 1 } });
      return true;
    } catch {
      return false;
    }
  }
}

export enum QueueProvider {
  LOCAL = "local",
  MEMORY = "memory",
  MONGO = "mongo",
}

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job<T = unknown> {
  _id: string;
  name: string;
  data: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  priority?: number; // Higher number = higher priority
  scheduledAt: Date;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  failedAt?: Date | null;
  failedReason?: string | null;
}

export interface EnqueueOptions {
  delayMs?: number; // Delay in milliseconds before job becomes available
  maxAttempts?: number; // Number of retries before failing permanently (default: 3)
  priority?: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export interface QueueAdapter {
  enqueue<T = unknown>(
    name: string,
    data: T,
    options?: EnqueueOptions,
  ): Promise<Job<T>>;

  dequeue(limit?: number): Promise<Job[]>;

  complete(jobId: string): Promise<boolean>;

  fail(jobId: string, error: Error, retryable?: boolean): Promise<boolean>;

  getStats(): Promise<QueueStats>;

  getJobs(status?: JobStatus, limit?: number, skip?: number): Promise<Job[]>;

  retryFailed(limit?: number): Promise<number>;

  clearCompleted(olderThanMs?: number): Promise<number>;

  check(): Promise<boolean>;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;

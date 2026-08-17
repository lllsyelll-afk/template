import {
  Job,
  JobStatus,
  QueueAdapter,
  EnqueueOptions,
  QueueStats,
} from "../types";

export class MemoryQueueAdapter implements QueueAdapter {
  private jobs: Job[] = [];
  private idCounter = 1;
  private workerId = `mem-worker-${Math.random().toString(36).substring(2, 9)}`;
  private lockTimeoutMs = 5 * 60 * 1000; // 5 minutes

  async enqueue<T = unknown>(
    name: string,
    data: T,
    options: EnqueueOptions = {},
  ): Promise<Job<T>> {
    const now = new Date();
    const scheduledAt = options.delayMs
      ? new Date(now.getTime() + options.delayMs)
      : now;

    const job: Job<T> = {
      _id: `mem_job_${this.idCounter++}_${Date.now()}`,
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

    this.jobs.push(job as Job);
    return job;
  }

  async dequeue(limit: number = 1): Promise<Job[]> {
    const now = new Date();
    const candidates = this.jobs.filter((j) => {
      // Pending jobs that are scheduled to run now or in the past
      const isDue = j.status === "pending" && j.scheduledAt <= now;
      // Stale locked jobs (worker died/timed out)
      const isStaleLock =
        j.status === "processing" &&
        j.lockedAt &&
        now.getTime() - j.lockedAt.getTime() > this.lockTimeoutMs;

      return isDue || isStaleLock;
    });

    // Sort by priority descending, then scheduledAt ascending
    candidates.sort((a, b) => {
      const pDiff = (b.priority ?? 0) - (a.priority ?? 0);
      if (pDiff !== 0) return pDiff;
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });

    const dequeued: Job[] = [];
    for (const job of candidates.slice(0, limit)) {
      job.status = "processing";
      job.lockedAt = now;
      job.lockedBy = this.workerId;
      job.attempts += 1;
      job.updatedAt = now;
      dequeued.push({ ...job });
    }

    return dequeued;
  }

  async complete(jobId: string): Promise<boolean> {
    const job = this.jobs.find((j) => j._id === jobId);
    if (!job) return false;

    const now = new Date();
    job.status = "completed";
    job.lockedAt = null;
    job.lockedBy = null;
    job.completedAt = now;
    job.updatedAt = now;
    return true;
  }

  async fail(
    jobId: string,
    error: Error,
    retryable: boolean = true,
  ): Promise<boolean> {
    const job = this.jobs.find((j) => j._id === jobId);
    if (!job) return false;

    const now = new Date();
    job.failedReason = error.message || "Unknown error";
    job.lockedAt = null;
    job.lockedBy = null;
    job.updatedAt = now;

    if (retryable && job.attempts < job.maxAttempts) {
      // Exponential backoff: 2s, 4s, 8s, 16s...
      const backoffMs = Math.min(
        1000 * Math.pow(2, job.attempts),
        60 * 60 * 1000,
      );
      job.status = "pending";
      job.scheduledAt = new Date(now.getTime() + backoffMs);
    } else {
      job.status = "failed";
      job.failedAt = now;
    }

    return true;
  }

  async getStats(): Promise<QueueStats> {
    const stats: QueueStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: this.jobs.length,
    };

    for (const j of this.jobs) {
      stats[j.status] += 1;
    }

    return stats;
  }

  async getJobs(
    status?: JobStatus,
    limit: number = 50,
    skip: number = 0,
  ): Promise<Job[]> {
    let filtered = this.jobs;
    if (status) {
      filtered = filtered.filter((j) => j.status === status);
    }
    return filtered
      .slice()
      .reverse()
      .slice(skip, skip + limit);
  }

  async retryFailed(limit: number = 100): Promise<number> {
    const now = new Date();
    const failedJobs = this.jobs
      .filter((j) => j.status === "failed")
      .slice(0, limit);

    for (const job of failedJobs) {
      job.status = "pending";
      job.attempts = 0;
      job.scheduledAt = now;
      job.failedReason = null;
      job.failedAt = null;
      job.updatedAt = now;
    }

    return failedJobs.length;
  }

  async clearCompleted(
    olderThanMs: number = 24 * 60 * 60 * 1000,
  ): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);
    const initialLength = this.jobs.length;
    this.jobs = this.jobs.filter((j) => {
      if (j.status === "completed" && j.completedAt && j.completedAt < cutoff) {
        return false;
      }
      return true;
    });
    return initialLength - this.jobs.length;
  }

  async check(): Promise<boolean> {
    return true;
  }
}

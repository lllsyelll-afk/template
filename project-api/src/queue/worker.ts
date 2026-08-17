import { Job, JobHandler, QueueAdapter } from "./types";

export interface WorkerOptions {
  concurrency?: number;
  pollIntervalMs?: number;
  batchSize?: number;
}

export class QueueWorker {
  private handlers = new Map<string, JobHandler>();
  private isRunning = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private activeJobs = new Set<string>();
  private concurrency: number;
  private pollIntervalMs: number;
  private batchSize: number;

  constructor(
    private adapter: QueueAdapter,
    options: WorkerOptions = {},
  ) {
    this.concurrency = options.concurrency ?? 5;
    this.pollIntervalMs = options.pollIntervalMs ?? 1000;
    this.batchSize = options.batchSize ?? this.concurrency;
  }

  register<T = unknown>(jobName: string, handler: JobHandler<T>): this {
    this.handlers.set(jobName, handler as JobHandler);
    return this;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(
      `[queue:worker] Started worker (concurrency: ${this.concurrency}, poll: ${this.pollIntervalMs}ms)`,
    );
    this.scheduleNextPoll(0);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    console.log(
      `[queue:worker] Stopping worker... Waiting for ${this.activeJobs.size} active jobs to finish.`,
    );

    const checkInterval = 100;
    const maxWaitMs = 15000;
    const start = Date.now();

    while (this.activeJobs.size > 0 && Date.now() - start < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    console.log("[queue:worker] Worker stopped cleanly.");
  }

  private scheduleNextPoll(delayMs: number = this.pollIntervalMs): void {
    if (!this.isRunning) return;
    this.pollTimer = setTimeout(() => {
      this.poll().catch((err) => {
        console.error("[queue:worker] Polling loop error:", err);
        this.scheduleNextPoll();
      });
    }, delayMs);
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    const availableSlots = this.concurrency - this.activeJobs.size;
    if (availableSlots <= 0) {
      this.scheduleNextPoll();
      return;
    }

    try {
      const jobs = await this.adapter.dequeue(Math.min(availableSlots, this.batchSize));
      if (jobs.length === 0) {
        this.scheduleNextPoll();
        return;
      }

      for (const job of jobs) {
        this.processJob(job);
      }

      // If we got jobs, check again immediately for more pending work
      if (this.activeJobs.size < this.concurrency) {
        this.scheduleNextPoll(50);
      } else {
        this.scheduleNextPoll();
      }
    } catch (error) {
      console.error("[queue:worker] Error during dequeue:", error);
      this.scheduleNextPoll();
    }
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);
    this.activeJobs.add(job._id);

    if (!handler) {
      console.warn(
        `[queue:worker] No handler registered for job "${job.name}" (ID: ${job._id})`,
      );
      await this.adapter.fail(
        job._id,
        new Error(`No handler registered for job: ${job.name}`),
        false,
      );
      this.activeJobs.delete(job._id);
      return;
    }

    try {
      await handler(job);
      await this.adapter.complete(job._id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[queue:worker] Job "${job.name}" (ID: ${job._id}) failed (Attempt ${job.attempts}/${job.maxAttempts}):`,
        error.message,
      );
      await this.adapter.fail(job._id, error, true);
    } finally {
      this.activeJobs.delete(job._id);
    }
  }

  getActiveCount(): number {
    return this.activeJobs.size;
  }
}

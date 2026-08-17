import {
  QueueAdapter,
  QueueProvider,
  EnqueueOptions,
  Job,
} from "./types";
import { MemoryQueueAdapter } from "./adapters/memory";
import { MongoQueueAdapter } from "./adapters/mongo";
import { QueueWorker } from "./worker";
import { processEmailJob } from "./handlers/email";
import { processSmsJob } from "./handlers/sms";
import { createPushJobHandler } from "./handlers/push";
import type { Repositories } from "../types";

let activeAdapter: QueueAdapter | null = null;
let activeWorker: QueueWorker | null = null;

export function createQueueAdapter(
  providerName?: string,
): QueueAdapter {
  const provider = (
    providerName || process.env.QUEUE_PROVIDER || "mongo"
  ).toLowerCase();

  switch (provider) {
    case QueueProvider.MEMORY:
    case QueueProvider.LOCAL:
      return new MemoryQueueAdapter();
    case QueueProvider.MONGO:
    default:
      return new MongoQueueAdapter();
  }
}

export function getQueue(): QueueAdapter {
  if (!activeAdapter) {
    activeAdapter = createQueueAdapter();
  }
  return activeAdapter;
}

export function getWorker(): QueueWorker {
  if (!activeWorker) {
    const concurrency = Number(process.env.QUEUE_CONCURRENCY || 5);
    activeWorker = new QueueWorker(getQueue(), { concurrency });
  }
  return activeWorker;
}

export async function initQueue(repos?: Repositories): Promise<{
  queue: QueueAdapter;
  worker: QueueWorker;
}> {
  const queue = getQueue();
  const worker = getWorker();

  // Register standard built-in handlers
  worker.register("email:send", processEmailJob);
  worker.register("sms:send", processSmsJob);

  if (repos) {
    worker.register("push:send", createPushJobHandler(repos));
  }

  // Start background processing
  worker.start();

  return { queue, worker };
}

/**
 * Convenient helper to enqueue a job directly from anywhere in the codebase.
 */
export async function enqueueJob<T = unknown>(
  name: string,
  data: T,
  options?: EnqueueOptions,
): Promise<Job<T>> {
  return getQueue().enqueue(name, data, options);
}

export * from "./types";
export * from "./worker";
export { MemoryQueueAdapter } from "./adapters/memory";
export { MongoQueueAdapter } from "./adapters/mongo";

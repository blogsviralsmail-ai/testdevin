/**
 * BullMQ + Redis queue infrastructure.
 *
 * If REDIS_URL is set we use a real Redis-backed queue, which lets us
 * scale workers horizontally, retry failed jobs, and schedule delayed
 * jobs (follow-up reminders, Razorpay-related deferred work).
 *
 * If REDIS_URL is missing we fall back to running jobs inline so the
 * app keeps working in single-server / dev setups without Redis. Job
 * payloads must be JSON-serialisable so the inline path matches Bull
 * semantics.
 */
import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis, { type Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "";

let connection: Redis | null = null;
function getConnection(): Redis | null {
  if (!REDIS_URL) return null;
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // BullMQ requirement
      enableReadyCheck: false,
    });
    // Don't crash the parent on transient connection errors.
    connection.on("error", () => {});
  }
  return connection;
}

const queues = new Map<string, Queue>();
const workers = new Map<string, Worker>();

export function getQueue(name: string): Queue | null {
  const conn = getConnection();
  if (!conn) return null;
  const existing = queues.get(name);
  if (existing) return existing;
  const q = new Queue(name, { connection: conn });
  queues.set(name, q);
  return q;
}

export type JobHandler<T = unknown> = (payload: T) => Promise<void> | void;

const inlineHandlers = new Map<string, JobHandler>();

/** Register a job handler. The worker runs in this process (the same Node app). For multi-worker scaling, point a separate process at the same Redis. */
export function registerWorker<T = unknown>(name: string, handler: JobHandler<T>): void {
  inlineHandlers.set(name, handler as JobHandler);
  const conn = getConnection();
  if (!conn) return;
  if (workers.has(name)) return;
  const w = new Worker(
    name,
    async (job) => {
      await (handler as JobHandler<T>)(job.data as T);
    },
    { connection: conn },
  );
  w.on("error", () => {});
  workers.set(name, w);
}

/**
 * Enqueue a job. If no Redis is configured, runs the handler inline
 * (after `delayMs` if specified). Returns true if the job was queued
 * or executed, false if there's no registered handler in inline mode.
 */
export async function enqueue<T = unknown>(
  name: string,
  payload: T,
  opts?: { delayMs?: number } & JobsOptions,
): Promise<boolean> {
  const q = getQueue(name);
  if (q) {
    const { delayMs, ...rest } = opts ?? {};
    await q.add(name, payload, { delay: delayMs, ...rest });
    return true;
  }
  // Inline fallback.
  const handler = inlineHandlers.get(name);
  if (!handler) return false;
  const run = async () => {
    try {
      await handler(payload);
    } catch {
      // Inline-mode errors are swallowed; a real queue would retry.
    }
  };
  if (opts?.delayMs && opts.delayMs > 0) {
    setTimeout(() => {
      void run();
    }, opts.delayMs);
  } else {
    await run();
  }
  return true;
}

export function isQueueBacked(): boolean {
  return Boolean(getConnection());
}

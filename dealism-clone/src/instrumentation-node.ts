/**
 * Node-only init: Sentry + background-job worker registration. This file
 * is intentionally separate from instrumentation.ts so the edge bundler
 * never sees Node-only deps (Baileys, BullMQ, Sentry SDK).
 */
import { getSetting } from "./lib/settings";
import { registerJobs } from "./lib/jobs";

async function initSentry() {
  const dsn =
    process.env.SENTRY_DSN ||
    (await getSetting("sentry_dsn").catch(() => null)) ||
    "";
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || "development",
    });
  } catch {
    // sentry init failure must never crash the app
  }
}

void initSentry();
registerJobs();

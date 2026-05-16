// Sentry initialization — set NEXT_PUBLIC_SENTRY_DSN in .env to enable
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initSentry() {
  if (initialized || !dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    environment: process.env.NODE_ENV || "production",
    enabled: !!dsn,
  });
  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!dsn) {
    console.error("[Error]", error, context);
    return;
  }
  initSentry();
  if (context) {
    Sentry.setContext("extra", context);
  }
  Sentry.captureException(error);
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!dsn) {
    console.log(`[${level}]`, message);
    return;
  }
  initSentry();
  Sentry.captureMessage(message, level);
}

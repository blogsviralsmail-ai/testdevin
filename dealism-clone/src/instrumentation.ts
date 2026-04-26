/**
 * Next.js boots a separate runtime per route group (Node vs Edge). The
 * edge runtime can't load Baileys / BullMQ / Sentry server SDKs, so we
 * split the actual init into instrumentation-node.ts and only import it
 * when running on Node. Webpack treats the dynamic import as a separate
 * chunk and never tries to bundle it for edge.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}

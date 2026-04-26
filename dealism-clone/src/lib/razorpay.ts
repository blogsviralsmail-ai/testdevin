/**
 * Razorpay integration helpers — keys live in the admin Settings table
 * so we don't depend on env vars in production. We support the standard
 * Order + Checkout flow (one-shot payment unlocks a plan) and webhook
 * signature verification for subscription events.
 */
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { getSetting } from "./settings";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export async function getRazorpayConfig(): Promise<RazorpayConfig | null> {
  const keyId = await getSetting("razorpay_key_id");
  const keySecret = await getSetting("razorpay_key_secret");
  const webhookSecret = (await getSetting("razorpay_webhook_secret")) || "";
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, webhookSecret };
}

export async function getRazorpayClient(): Promise<{
  client: Razorpay;
  config: RazorpayConfig;
} | null> {
  const config = await getRazorpayConfig();
  if (!config) return null;
  const client = new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  });
  return { client, config };
}

/** Verify the signature returned by Razorpay Checkout after payment success. */
export function verifyOrderSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", opts.keySecret)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest("hex");
  // Constant-time compare to avoid timing oracles.
  return safeEqual(expected, opts.signature);
}

/** Verify the X-Razorpay-Signature header on webhook requests. */
export function verifyWebhookSignature(opts: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", opts.webhookSecret)
    .update(opts.rawBody)
    .digest("hex");
  return safeEqual(expected, opts.signature);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

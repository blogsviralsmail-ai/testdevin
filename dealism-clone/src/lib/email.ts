/**
 * Lightweight email helper using Resend's HTTP API directly (no extra
 * dependency needed). When the admin hasn't configured a Resend key the
 * helpers no-op silently — call sites don't need to know whether email
 * is enabled.
 *
 * Templates live inline so admins can rebrand by changing the brand_name
 * setting without redeploying.
 */
import { getBrandName, getSetting } from "./settings";

const RESEND_API = "https://api.resend.com/emails";

interface SendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendRaw(input: SendInput): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = await getSetting("resend_api_key");
  const from = (await getSetting("email_from")) || "";
  if (!apiKey || !from) return { ok: false, reason: "Email not configured" };

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, reason: body || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "send failed" };
  }
}

function wrap(brandName: string, body: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
      <h1 style="font-size:22px;margin:0 0 16px;color:#ea580c;">${brandName}</h1>
      ${body}
      <hr style="margin:32px 0 16px;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#888;margin:0;">Sent by ${brandName}. If you didn't expect this email, you can ignore it.</p>
    </div>
  `;
}

export async function sendWelcomeEmail(opts: { to: string; name?: string | null }) {
  const brandName = await getBrandName();
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi there,";
  const html = wrap(
    brandName,
    `
      <p>${greeting}</p>
      <p>Welcome to ${brandName}! Your account is ready. You can sign in to your dashboard and start building your AI sales agent.</p>
      <p>Get started:</p>
      <ol>
        <li>Create your first agent</li>
        <li>Upload your knowledge base (FAQs, product docs, website URL)</li>
        <li>Connect a channel — WhatsApp via QR scan, or Telegram via bot token</li>
      </ol>
      <p>Need help? Just reply to this email.</p>
    `,
  );
  return sendRaw({ to: opts.to, subject: `Welcome to ${brandName}`, html });
}

export async function sendQuotaWarningEmail(opts: {
  to: string;
  used: number;
  quota: number;
  pct: number;
}) {
  const brandName = await getBrandName();
  const html = wrap(
    brandName,
    `
      <p>You&rsquo;ve used <strong>${opts.used} / ${opts.quota}</strong> conversations (${opts.pct}%) this billing period.</p>
      <p>When you reach 100%, your AI will pause auto-replies until your quota resets or you upgrade your plan.</p>
      <p><a href="/dashboard/billing" style="color:#ea580c;">Upgrade your plan →</a></p>
    `,
  );
  const subject =
    opts.pct >= 100 ? `${brandName}: quota exhausted` : `${brandName}: ${opts.pct}% of quota used`;
  return sendRaw({ to: opts.to, subject, html });
}

export async function sendPasswordResetEmail(opts: { to: string; resetUrl: string }) {
  const brandName = await getBrandName();
  const html = wrap(
    brandName,
    `
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <p style="margin:24px 0;">
        <a href="${opts.resetUrl}" style="background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Reset password</a>
      </p>
      <p style="font-size:12px;color:#666;">If you didn&rsquo;t request this, ignore this email — your password will stay the same.</p>
    `,
  );
  return sendRaw({ to: opts.to, subject: `Reset your ${brandName} password`, html });
}

/**
 * Idempotent helper: emit a warning email when a user's usage crosses a
 * threshold (default 80%). Uses the Setting table to dedupe per
 * (userId, quotaValue) so quota changes naturally re-arm the warning.
 */
export async function maybeSendQuotaWarning(opts: {
  userId: string;
  email: string;
  used: number;
  quota: number;
  threshold?: number;
}) {
  const threshold = opts.threshold ?? 0.8;
  if (opts.quota <= 0) return;
  const pct = Math.floor((opts.used / opts.quota) * 100);
  if (opts.used / opts.quota < threshold) return;
  const dedupeKey = `quota_warned_${opts.userId}_${opts.quota}_${pct >= 100 ? "100" : "80"}`;
  const { setSetting, getSetting } = await import("./settings");
  if (await getSetting(dedupeKey)) return;
  await sendQuotaWarningEmail({ to: opts.email, used: opts.used, quota: opts.quota, pct });
  await setSetting(dedupeKey, new Date().toISOString(), "internal");
}

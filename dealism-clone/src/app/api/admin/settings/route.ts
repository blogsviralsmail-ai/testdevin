import { NextRequest, NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mirrors the SECRET_KEYS list in src/app/admin/settings/page.tsx.
 * Empty submissions for these keys are skipped server-side so the
 * admin can leave the input blank to preserve the existing value.
 */
const SECRET_KEYS = new Set<string>([
  "ai_api_key",
  "openai_api_key",
  "embedding_api_key",
  "razorpay_key_secret",
  "razorpay_webhook_secret",
  "telegram_default_bot_token",
  "resend_api_key",
  "backup_s3_secret_key",
  "backup_s3_access_key",
  "sentry_dsn",
]);

export async function POST(req: NextRequest) {
  try {
    await apiRequireAdmin();
    const body = await req.json();
    const entries: Array<{ key: string; value: string; category?: string }> = body.settings ?? [];
    for (const e of entries) {
      // Skip empty submissions across the board. The form sends every
      // field on every save (including non-secret ones it pre-fills from
      // provider defaults), so accepting "" here would overwrite any
      // value the admin had previously customised. Treat empty as
      // "unchanged" — there is no UI to deliberately blank a setting,
      // so we don't lose any functionality.
      if (e.value === "" || e.value == null) continue;
      await prisma.setting.upsert({
        where: { key: e.key },
        update: { value: e.value, category: e.category ?? "general" },
        create: { key: e.key, value: e.value, category: e.category ?? "general" },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function GET() {
  try {
    await apiRequireAdmin();
    const settings = await prisma.setting.findMany();
    // Never return secret values to the browser. Replace with a sentinel
    // so the form can show a "saved" hint without exposing the value.
    const safe = settings.map((s) =>
      SECRET_KEYS.has(s.key) ? { ...s, value: s.value ? "" : "", isSet: Boolean(s.value) } : s,
    );
    return NextResponse.json({ settings: safe });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

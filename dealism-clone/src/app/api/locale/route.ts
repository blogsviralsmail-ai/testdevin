import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";

/**
 * Sets the `locale` cookie. Called by the language picker in
 * /dashboard/settings. The cookie is read on every server render
 * via lib/i18n.ts → getLocale().
 */
export async function POST(req: NextRequest) {
  const { locale } = (await req.json()) as { locale?: string };
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set("locale", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}

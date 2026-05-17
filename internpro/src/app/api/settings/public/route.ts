import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const publicKeys = [
    "whatsapp_number", "whatsapp_message", "homepage_video_url", "homepage_video_enabled",
    "company_name", "company_logo", "company_phone", "company_email",
    "company_address", "google_maps_lat", "google_maps_lng",
    "site_url", "letterhead_company_name",
    "social_facebook", "social_instagram", "social_twitter", "social_linkedin",
    "social_youtube", "social_telegram", "social_pinterest", "social_whatsapp_channel",
    "adsense_ad_head", "adsense_ad_before", "adsense_ad_after",
    "cash_payment_enabled",
  ];
  const settings = await prisma.setting.findMany({
    where: { key: { in: publicKeys } },
  });
  const result: Record<string, string> = {};
  settings.forEach((s) => { result[s.key] = s.value; });
  return NextResponse.json(result);
}

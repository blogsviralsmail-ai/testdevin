import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const publicKeys = [
    "whatsapp_number", "whatsapp_message", "homepage_video_url", "homepage_video_enabled",
    "company_name", "company_logo", "company_phone", "company_email",
    "company_address", "google_maps_lat", "google_maps_lng",
    "site_url", "letterhead_company_name",
  ];
  const settings = await prisma.setting.findMany({
    where: { key: { in: publicKeys } },
  });
  const result: Record<string, string> = {};
  settings.forEach((s) => { result[s.key] = s.value; });
  return NextResponse.json(result);
}

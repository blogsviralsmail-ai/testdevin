import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEO_KEYS = [
  "ga_measurement_id",
  "gtm_id",
  "adsense_publisher_id",
  "adsense_auto_ads",
  "adsense_ad_head",
  "adsense_ad_before",
  "adsense_ad_after",
  "google_site_verification",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "seo_canonical_url",
  "og_title",
  "og_description",
  "og_image",
  "custom_head_code",
];

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: SEO_KEYS } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return NextResponse.json(map, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({});
  }
}

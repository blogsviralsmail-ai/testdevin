import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const revalidate = 60;

async function getHomeData() {
  const [programs, settingsRows, siteContent] = await Promise.all([
    prisma.program.findMany({
      where: { isPublished: true },
      include: {
        organization: { select: { name: true, logo: true } },
        batches: {
          select: {
            id: true,
            name: true,
            isActive: true,
            _count: { select: { enrollments: true } },
          },
        },
        _count: { select: { batches: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.setting.findMany({
      where: {
        key: {
          in: [
            "whatsapp_number",
            "whatsapp_message",
            "homepage_video_url",
            "homepage_video_enabled",
            "company_name",
            "company_logo",
            "company_phone",
            "company_email",
            "company_address",
            "google_maps_lat",
            "google_maps_lng",
            "site_url",
            "letterhead_company_name",
            "social_facebook",
            "social_instagram",
            "social_twitter",
            "social_linkedin",
            "social_youtube",
            "social_telegram",
            "social_pinterest",
            "social_whatsapp_channel",
            "adsense_ad_head",
            "adsense_ad_before",
            "adsense_ad_after",
          ],
        },
      },
    }),
    prisma.siteContent.findUnique({ where: { slug: "homepage" } }),
  ]);

  const settings: Record<string, string> = {};
  settingsRows.forEach((s) => {
    settings[s.key] = s.value;
  });

  let cms = {};
  if (siteContent?.isPublished && siteContent.content) {
    try {
      cms = JSON.parse(siteContent.content);
    } catch {}
  }

  return {
    programs: JSON.parse(JSON.stringify(programs)),
    settings,
    cms,
  };
}

export default async function Home() {
  const { programs, settings, cms } = await getHomeData();

  return (
    <HomeClient
      initialPrograms={programs}
      initialSettings={settings}
      initialCms={cms}
    />
  );
}

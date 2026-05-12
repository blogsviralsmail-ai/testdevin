import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let robotsContent = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Sitemap: https://internship.kkhsmedia.com/sitemap.xml`;

  try {
    const setting = await prisma.setting.findUnique({ where: { key: "robots_txt" } });
    if (setting?.value) {
      robotsContent = setting.value;
    }
  } catch {
    // Use default
  }

  return new NextResponse(robotsContent, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

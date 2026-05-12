import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const baseUrl = "https://internship.kkhsmedia.com";

  // Check if sitemap is enabled
  const enabledSetting = await prisma.setting.findUnique({ where: { key: "sitemap_enabled" } });
  if (enabledSetting?.value === "false") {
    return new NextResponse("Sitemap disabled", { status: 404 });
  }

  // Get all published programs
  const programs = await prisma.program.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true },
  });

  // Get published openings/jobs
  let jobs: { id: string; updatedAt: Date }[] = [];
  try {
    jobs = await prisma.jobPosting.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    });
  } catch {
    // JobPosting table might not exist
  }

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/about", priority: "0.8", changefreq: "monthly" },
    { url: "/programs", priority: "0.9", changefreq: "weekly" },
    { url: "/openings", priority: "0.9", changefreq: "weekly" },
    { url: "/contact", priority: "0.7", changefreq: "monthly" },
    { url: "/team", priority: "0.6", changefreq: "monthly" },
    { url: "/register", priority: "0.8", changefreq: "monthly" },
    { url: "/login", priority: "0.5", changefreq: "monthly" },
  ];

  const now = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Program pages
  for (const prog of programs) {
    xml += `  <url>
    <loc>${baseUrl}/programs/${prog.id}</loc>
    <lastmod>${prog.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  // Job/Opening pages
  for (const job of jobs) {
    xml += `  <url>
    <loc>${baseUrl}/openings/${job.id}</loc>
    <lastmod>${job.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

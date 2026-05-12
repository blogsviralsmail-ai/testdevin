import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

  // Get published blog posts
  let blogs: { slug: string; updatedAt: Date; state: string | null; city: string | null }[] = [];
  try {
    blogs = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, state: true, city: true },
    });
  } catch (e) {
    console.error("Sitemap: BlogPost query failed:", e);
  }

  // Get unique states and cities for category pages
  const statesSet = new Set<string>();
  const citiesSet = new Set<string>();
  for (const b of blogs) {
    if (b.state) statesSet.add(b.state);
    if (b.city) citiesSet.add(b.city);
  }

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/about", priority: "0.8", changefreq: "monthly" },
    { url: "/programs", priority: "0.9", changefreq: "weekly" },
    { url: "/vacancies", priority: "0.9", changefreq: "weekly" },
    { url: "/blog", priority: "0.8", changefreq: "daily" },
    { url: "/blog/best-internships-india-2026", priority: "0.9", changefreq: "weekly" },
    { url: "/contact", priority: "0.7", changefreq: "monthly" },
    { url: "/team", priority: "0.6", changefreq: "monthly" },
    { url: "/register", priority: "0.8", changefreq: "monthly" },
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

  // State category pages
  for (const state of statesSet) {
    const slug = state.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    xml += `  <url>
    <loc>${baseUrl}/blog/state/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // City category pages
  for (const city of citiesSet) {
    const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    xml += `  <url>
    <loc>${baseUrl}/blog/city/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Blog post pages
  for (const blog of blogs) {
    xml += `  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${blog.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
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

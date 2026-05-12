import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

interface PageProps {
  params: Promise<{ city: string }>;
}

const citySlugToName: Record<string, string> = {
  "jaipur": "Jaipur", "lucknow": "Lucknow", "ahmedabad": "Ahmedabad", "bengaluru": "Bengaluru",
  "bhopal": "Bhopal", "chennai": "Chennai", "mumbai": "Mumbai", "gurugram": "Gurugram",
  "kolkata": "Kolkata", "dehradun": "Dehradun", "new-delhi": "New Delhi", "patna": "Patna",
  "visakhapatnam": "Visakhapatnam", "chandigarh": "Chandigarh", "bhubaneswar": "Bhubaneswar",
  "raipur": "Raipur", "hyderabad": "Hyderabad", "shimla": "Shimla", "ranchi": "Ranchi",
  "kochi": "Kochi", "guwahati": "Guwahati", "itanagar": "Itanagar", "shillong": "Shillong",
  "jammu---kashmir": "Jammu & Kashmir", "imphal": "Imphal", "gangtok": "Gangtok",
  "srinagar": "Srinagar", "kohima": "Kohima", "puducherry": "Puducherry",
  "agartala": "Agartala", "rohtak": "Rohtak", "panaji": "Panaji", "manipal": "Manipal",
  "aizawl": "Aizawl",
};

function getCityName(slug: string): string | null {
  return citySlugToName[slug] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const cityName = getCityName(citySlug);
  if (!cityName) return { title: "City Not Found | KKHS Media" };

  return {
    title: `Best Internships in ${cityName} 2026 — University Guide | KKHS Media`,
    description: `Find paid internship programs for university students in ${cityName}. Video Editing, Digital Marketing, Web Development internships at KKHS Media.`,
    keywords: `internship ${cityName} 2026, paid internship ${cityName}, ${cityName} university internship, KKHS Media`,
    openGraph: {
      title: `Best Internships in ${cityName} 2026`,
      description: `Paid internship programs for students in ${cityName}. Apply now at KKHS Media.`,
      url: `https://internship.kkhsmedia.com/blog/city/${citySlug}`,
      siteName: "KKHS Media",
      type: "website",
    },
    alternates: {
      canonical: `https://internship.kkhsmedia.com/blog/city/${citySlug}`,
    },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city: citySlug } = await params;
  const cityName = getCityName(citySlug);
  if (!cityName) notFound();

  const articles = await prisma.blogPost.findMany({
    where: { isPublished: true, city: cityName },
    select: { title: true, slug: true, excerpt: true, coverImage: true, state: true, city: true, views: true, createdAt: true, tags: true },
    orderBy: { views: "desc" },
  });

  if (articles.length === 0) notFound();

  const stateName = articles[0].state || "";
  const stateSlug = stateName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Get other cities in same state
  const otherCities = await prisma.blogPost.groupBy({
    by: ["city"],
    where: { isPublished: true, state: stateName, city: { not: cityName } },
    _count: true,
    orderBy: { _count: { city: "desc" } },
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://internship.kkhsmedia.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://internship.kkhsmedia.com/blog" },
      { "@type": "ListItem", position: 3, name: "India 2026", item: "https://internship.kkhsmedia.com/blog/best-internships-india-2026" },
      { "@type": "ListItem", position: 4, name: stateName, item: `https://internship.kkhsmedia.com/blog/state/${stateSlug}` },
      { "@type": "ListItem", position: 5, name: cityName },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)" }}>
      <PublicNavbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link> /
          <Link href="/blog" className="hover:text-cyan-400 transition-colors">Blog</Link> /
          <Link href="/blog/best-internships-india-2026" className="hover:text-cyan-400 transition-colors">India 2026</Link> /
          <Link href={`/blog/state/${stateSlug}`} className="hover:text-cyan-400 transition-colors">{stateName}</Link> /
          <span className="text-slate-300">{cityName}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Best Internships in {cityName} 2026
          </h1>
          <p className="text-slate-400 text-lg">
            {articles.length} university internship guides available for students in {cityName}, {stateName}.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Articles Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <Link key={article.slug} href={`/blog/${article.slug}`}
                  className="group rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {article.coverImage && (
                    <div className="aspect-video overflow-hidden">
                      <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {article.views > 0 && (
                        <span className="text-xs text-slate-500">{article.views} views</span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">{article.title}</h2>
                    <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0">
            <div className="rounded-xl p-5 sticky top-24" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-bold text-white mb-4">More in {stateName}</h3>

              <Link href={`/blog/state/${stateSlug}`}
                className="block py-2 px-2 rounded-lg text-sm text-cyan-400 hover:bg-white/5 transition-all mb-2">
                All {stateName} articles →
              </Link>

              {otherCities.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 uppercase tracking-wider mt-4 mb-2">Other Cities</p>
                  {otherCities.map((c) => (
                    <Link key={c.city} href={`/blog/city/${(c.city || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="flex items-center justify-between py-2 px-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      <span>{c.city}</span>
                      <span className="text-xs text-slate-600">{c._count}</span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <Link href="/register"
                  className="block text-center px-4 py-3 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back links */}
        <div className="flex items-center justify-center gap-6 mt-12 text-sm">
          <Link href={`/blog/state/${stateSlug}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">
            ← All {stateName} Internships
          </Link>
          <Link href="/blog/best-internships-india-2026" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            ← All India Guide
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

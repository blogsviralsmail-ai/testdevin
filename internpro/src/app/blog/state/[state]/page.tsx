import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

interface PageProps {
  params: Promise<{ state: string }>;
}

const stateSlugToName: Record<string, string> = {
  "rajasthan": "Rajasthan", "uttar-pradesh": "Uttar Pradesh", "gujarat": "Gujarat",
  "karnataka": "Karnataka", "madhya-pradesh": "Madhya Pradesh", "tamil-nadu": "Tamil Nadu",
  "maharashtra": "Maharashtra", "haryana": "Haryana", "west-bengal": "West Bengal",
  "uttarakhand": "Uttarakhand", "delhi": "Delhi", "bihar": "Bihar",
  "andhra-pradesh": "Andhra Pradesh", "punjab": "Punjab", "odisha": "Odisha",
  "telangana": "Telangana", "chhattisgarh": "Chhattisgarh", "jharkhand": "Jharkhand",
  "himachal-pradesh": "Himachal Pradesh", "kerala": "Kerala", "assam": "Assam",
  "arunachal-pradesh": "Arunachal Pradesh", "meghalaya": "Meghalaya", "manipur": "Manipur",
  "jammu---kashmir": "Jammu & Kashmir", "jammu-and-kashmir": "Jammu and Kashmir",
  "sikkim": "Sikkim", "nagaland": "Nagaland", "tripura": "Tripura",
  "puducherry": "Puducherry", "chandigarh": "Chandigarh", "mizoram": "Mizoram", "goa": "Goa",
};

function getStateName(slug: string): string | null {
  return stateSlugToName[slug] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateName = getStateName(stateSlug);
  if (!stateName) return { title: "State Not Found | KKHS Media" };

  return {
    title: `Best Internships in ${stateName} 2026 — University-wise Guide | KKHS Media`,
    description: `Find the best paid internship programs for university students in ${stateName}. Video Editing, Digital Marketing, Web Development internships at KKHS Media.`,
    keywords: `internship ${stateName} 2026, paid internship ${stateName}, ${stateName} university internship, KKHS Media`,
    openGraph: {
      title: `Best Internships in ${stateName} 2026`,
      description: `Paid internship programs for students in ${stateName}. Apply now at KKHS Media.`,
      url: `https://internship.kkhsmedia.com/blog/state/${stateSlug}`,
      siteName: "KKHS Media",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Internships in ${stateName} 2026`,
      description: `Paid internship programs for students in ${stateName}. Apply now at KKHS Media.`,
    },
    alternates: {
      canonical: `https://internship.kkhsmedia.com/blog/state/${stateSlug}`,
    },
  };
}

export default async function StatePage({ params }: PageProps) {
  const { state: stateSlug } = await params;
  const stateName = getStateName(stateSlug);
  if (!stateName) notFound();

  const articles = await prisma.blogPost.findMany({
    where: { isPublished: true, state: stateName },
    select: { title: true, slug: true, excerpt: true, coverImage: true, city: true, views: true, createdAt: true, tags: true },
    orderBy: { views: "desc" },
  });

  if (articles.length === 0) notFound();

  // Get unique cities
  const cities = [...new Set(articles.map((a) => a.city).filter(Boolean) as string[])].sort();

  // Get all states for sidebar
  const allStates = await prisma.blogPost.groupBy({
    by: ["state"],
    where: { isPublished: true, state: { not: null } },
    _count: true,
    orderBy: { _count: { state: "desc" } },
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://internship.kkhsmedia.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://internship.kkhsmedia.com/blog" },
      { "@type": "ListItem", position: 3, name: "Best Internships India 2026", item: "https://internship.kkhsmedia.com/blog/best-internships-india-2026" },
      { "@type": "ListItem", position: 4, name: stateName },
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
          <span className="text-slate-300">{stateName}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Best Internships in {stateName} 2026
          </h1>
          <p className="text-slate-400 text-lg">
            {articles.length} university internship guides available for students in {stateName}.
            {cities.length > 1 && ` Covering cities: ${cities.join(", ")}.`}
          </p>
        </div>

        {/* City filter chips */}
        {cities.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {cities.map((c) => (
              <Link key={c} href={`/blog/city/${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="px-4 py-2 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all">
                {c}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content - Articles Grid */}
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
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {article.city && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">{article.city}</span>
                      )}
                      {article.views > 0 && (
                        <span className="text-xs text-slate-500 ml-auto">{article.views} views</span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">{article.title}</h2>
                    <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar - Other States */}
          <div className="lg:w-72 shrink-0">
            <div className="rounded-xl p-5 sticky top-24" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-bold text-white mb-4">Other States</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {allStates.filter(s => s.state && s.state !== stateName).map((s) => (
                  <Link key={s.state} href={`/blog/state/${(s.state || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="flex items-center justify-between py-2 px-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                    <span>{s.state}</span>
                    <span className="text-xs text-slate-600">{s._count}</span>
                  </Link>
                ))}
              </div>

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

        {/* Back to pillar */}
        <div className="text-center mt-12">
          <Link href="/blog/best-internships-india-2026" className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
            ← Back to Best Internships in India 2026
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Internships in India 2026 — State-wise Guide | KKHS Media",
  description:
    "Complete guide to the best paid internship programs across all Indian states in 2026. Find internships near your university in Video Editing, Digital Marketing, Web Development & more at KKHS Media.",
  keywords:
    "best internships India 2026, paid internship India, internship programs 2026, state wise internship, KKHS Media internship, video editing internship, digital marketing internship, web development internship",
  openGraph: {
    title: "Best Internships in India 2026 — State-wise Guide",
    description:
      "Find paid internship programs near your university across 33 states and 1000+ universities. Video Editing, Digital Marketing, Web Development & more.",
    url: "https://internship.kkhsmedia.com/blog/best-internships-india-2026",
    siteName: "KKHS Media",
    type: "article",
  },
  alternates: {
    canonical: "https://internship.kkhsmedia.com/blog/best-internships-india-2026",
  },
};

interface StateData {
  state: string;
  count: number;
  city: string;
  slug: string;
  articles: { title: string; slug: string; city: string | null }[];
}

export default async function PillarPage() {
  // Get all published articles grouped by state
  const articles = await prisma.blogPost.findMany({
    where: { isPublished: true, state: { not: null } },
    select: { title: true, slug: true, state: true, city: true },
    orderBy: { state: "asc" },
  });

  // Group by state
  const stateMap = new Map<string, { count: number; city: string; articles: { title: string; slug: string; city: string | null }[] }>();
  for (const a of articles) {
    if (!a.state) continue;
    const existing = stateMap.get(a.state);
    if (existing) {
      existing.count++;
      existing.articles.push({ title: a.title, slug: a.slug, city: a.city });
    } else {
      stateMap.set(a.state, {
        count: 1,
        city: a.city || "",
        articles: [{ title: a.title, slug: a.slug, city: a.city }],
      });
    }
  }

  const states: StateData[] = Array.from(stateMap.entries())
    .map(([state, data]) => ({
      state,
      count: data.count,
      city: data.city,
      slug: state.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      articles: data.articles.slice(0, 5),
    }))
    .sort((a, b) => b.count - a.count);

  const totalArticles = articles.length;
  const totalStates = states.length;

  const pillarJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Best Internships in India 2026 — Complete State-wise Guide",
    description: "Comprehensive guide to paid internship programs across 33 Indian states covering 1000+ universities.",
    author: { "@type": "Organization", name: "KKHS Media", url: "https://internship.kkhsmedia.com" },
    publisher: {
      "@type": "Organization",
      name: "KKHS Media",
      logo: { "@type": "ImageObject", url: "https://internship.kkhsmedia.com/logo-kkhs.png" },
    },
    datePublished: "2026-05-12",
    dateModified: new Date().toISOString().split("T")[0],
    mainEntityOfPage: "https://internship.kkhsmedia.com/blog/best-internships-india-2026",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://internship.kkhsmedia.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://internship.kkhsmedia.com/blog" },
      { "@type": "ListItem", position: 3, name: "Best Internships in India 2026" },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)" }}>
      <PublicNavbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pillarJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link> /
          <Link href="/blog" className="hover:text-cyan-400 transition-colors">Blog</Link> /
          <span className="text-slate-300">Best Internships in India 2026</span>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-400 mb-4">
            Pillar Guide — Updated May 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Best Internships in India 2026
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Complete state-wise guide to paid internship programs across {totalStates} states and {totalArticles}+ universities.
            Find the perfect internship near your college in Video Editing, Digital Marketing, Web Development & more.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "States Covered", value: `${totalStates}` },
            { label: "Universities", value: `${totalArticles}+` },
            { label: "Programs", value: "5+" },
            { label: "Students Trained", value: "500+" },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-2xl font-bold text-cyan-400">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* TOC */}
        <div className="rounded-xl p-6 mb-12" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-xl font-bold text-white mb-4">Table of Contents — States</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {states.map((s) => (
              <a key={s.state} href={`#${s.slug}`} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors py-1">
                {s.state} <span className="text-slate-600">({s.count})</span>
              </a>
            ))}
          </div>
        </div>

        {/* Intro Section */}
        <div className="prose prose-invert prose-lg max-w-none mb-12" style={{ color: "#cbd5e1" }}>
          <h2>Why Do You Need an Internship in 2026?</h2>
          <p>
            According to the All India Survey on Higher Education (AISHE) 2023-24, over <strong>4.33 crore students</strong> are enrolled
            in higher education across India. With this massive competition, just a degree is not enough. Companies like Google, TCS,
            Infosys, and startups across India want candidates with <strong>practical skills and real project experience</strong>.
          </p>
          <p>
            NASSCOM reports that <strong>78% of hiring managers</strong> prefer candidates with internship experience. A certified paid
            internship from a recognized organization like <strong>KKHS Media</strong> gives you the edge you need — industry skills,
            a verifiable certificate, portfolio-ready projects, and mentorship from experts.
          </p>

          <h2>Available Internship Programs</h2>
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Video Editing</td><td>1-3 Months</td><td>Online/Offline</td><td>Yes (Verifiable)</td></tr>
              <tr><td>Digital Marketing</td><td>1-3 Months</td><td>Online/Offline</td><td>Yes (Verifiable)</td></tr>
              <tr><td>Web Development</td><td>2-3 Months</td><td>Online/Offline</td><td>Yes (Verifiable)</td></tr>
              <tr><td>Graphic Design</td><td>1-3 Months</td><td>Online/Offline</td><td>Yes (Verifiable)</td></tr>
              <tr><td>Content & SEO Writing</td><td>1-2 Months</td><td>Online</td><td>Yes (Verifiable)</td></tr>
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="text-center mb-12">
          <Link href="/register"
            className="inline-block px-8 py-4 rounded-xl text-lg font-bold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
            style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
            Apply Now for Internship
          </Link>
        </div>

        {/* State Sections */}
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          State-wise Internship Guide
        </h2>

        <div className="space-y-8">
          {states.map((s) => (
            <section key={s.state} id={s.slug} className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Internships in {s.state}
                </h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300">
                  {s.count} universities
                </span>
              </div>

              {/* Top articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {s.articles.map((a) => (
                  <Link key={a.slug} href={`/blog/${a.slug}`}
                    className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                    <span className="text-cyan-500 group-hover:text-cyan-400">→</span>
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors line-clamp-1">{a.title}</span>
                  </Link>
                ))}
              </div>

              {/* View all link */}
              <Link href={`/blog/state/${s.slug}`}
                className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                View all {s.count} internship articles in {s.state} →
              </Link>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Your Internship Journey?</h2>
          <p className="text-slate-400 mb-6">Join 500+ students who have already transformed their careers with KKHS Media internship programs.</p>
          <Link href="/register"
            className="inline-block px-8 py-4 rounded-xl text-lg font-bold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
            style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
            Apply Now — Free Registration
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

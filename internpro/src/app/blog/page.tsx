import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import BlogListClient from "./BlogListClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | Internship Tips, Career Guides & University Resources",
  description: "Read 1000+ articles on internships, career development, university guides, and skill-building tips. State-wise and city-wise internship resources for students across India.",
  keywords: "internship blog, career tips, university internship guide, internship in India 2026, student career resources, KKHS Media blog, state wise internship, paid internship tips",
  openGraph: {
    title: "Blog | Internship Tips & Career Guides | KKHS Media",
    description: "1000+ articles on internships, career development, and university resources for students across India.",
    url: "https://internship.kkhsmedia.com/blog",
    siteName: "KKHS Media",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Internship Tips & Career Guides | KKHS Media",
    description: "1000+ articles on internships, career development, and university resources for students across India.",
  },
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogPage() {
  const blogs = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      author: true,
      category: true,
      tags: true,
      state: true,
      city: true,
      views: true,
      createdAt: true,
    },
  });

  const totalCount = await prisma.blogPost.count({ where: { isPublished: true } });

  const serializedBlogs = blogs.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)" }}>
      <PublicNavbar />
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Blog</h1>
          <p className="text-slate-400 text-lg">Insights, tips, and updates on internships, careers, and skill development</p>
          <Link href="/blog/best-internships-india-2026"
            className="inline-block mt-4 px-6 py-2.5 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all">
            Best Internships in India 2026 — Complete State-wise Guide &rarr;
          </Link>
        </div>

        <BlogListClient initialBlogs={serializedBlogs} totalCount={totalCount} />
      </main>
      <PublicFooter />
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import BlogListClient from "./BlogListClient";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const blogs = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
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

  // Serialize dates for client component
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

        <BlogListClient initialBlogs={serializedBlogs} />
      </main>
      <PublicFooter />
    </div>
  );
}

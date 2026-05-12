"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string;
  category: string;
  tags: string | null;
  createdAt: string;
  views: number;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ published: "true" });
    if (category) params.set("category", category);
    fetch(`/api/blogs?${params}`)
      .then((r) => r.json())
      .then((data) => { setBlogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  const categories = [...new Set(blogs.map((b) => b.category))];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)" }}>
      <PublicNavbar />
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Blog</h1>
          <p className="text-slate-400 text-lg">Insights, tips, and updates on internships, careers, and skill development</p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button onClick={() => setCategory("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!category ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
              All
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === c ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 py-20">Loading...</div>
        ) : blogs.length === 0 ? (
          <div className="text-center text-slate-400 py-20">No blog posts yet. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/10"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {blog.coverImage && (
                  <div className="aspect-video overflow-hidden">
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                {!blog.coverImage && (
                  <div className="aspect-video flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}>
                    <span className="text-5xl opacity-30">📝</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">{blog.category}</span>
                    <span className="text-xs text-slate-500">{new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3">{blog.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">By {blog.author}</span>
                    <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition-transform">Read More →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}

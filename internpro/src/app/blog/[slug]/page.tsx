"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string | null;
  author: string;
  category: string;
  tags: string | null;
  createdAt: string;
  views: number;
}

export default function BlogPostPage() {
  const params = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [adSettings, setAdSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((data) => setAdSettings(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!params.slug) return;
    fetch(`/api/blogs?published=true`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.find((b: Blog) => b.slug === params.slug);
        setBlog(found || null);
        setLoading(false);
        if (found) {
          fetch(`/api/blogs`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: found.id, views: (found.views || 0) + 1 }) }).catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0e1a" }}>
      <p className="text-slate-400">Loading...</p>
    </div>
  );

  if (!blog) return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <PublicNavbar />
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Blog Post Not Found</h1>
        <Link href="/blog" className="text-cyan-400 hover:underline">← Back to Blog</Link>
      </div>
      <PublicFooter />
    </div>
  );

  const adBeforeContent = adSettings.adsense_ad_before || "";
  const adAfterContent = adSettings.adsense_ad_after || "";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)" }}>
      <PublicNavbar />
      <article className="max-w-4xl mx-auto px-6 py-20">
        <Link href="/blog" className="text-cyan-400 hover:underline text-sm mb-6 inline-block">← Back to Blog</Link>

        {blog.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video">
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Ad Before Content */}
        {adBeforeContent && (
          <div className="my-6 text-center" dangerouslySetInnerHTML={{ __html: adBeforeContent }} />
        )}

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">{blog.category}</span>
          <span className="text-sm text-slate-500">{new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="text-sm text-slate-500">•</span>
          <span className="text-sm text-slate-500">By {blog.author}</span>
          <span className="text-sm text-slate-500">•</span>
          <span className="text-sm text-slate-500">{blog.views} views</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{blog.title}</h1>

        {blog.tags && (
          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags.split(",").map((tag) => (
              <span key={tag.trim()} className="px-2 py-0.5 text-xs rounded bg-white/5 text-slate-400">#{tag.trim()}</span>
            ))}
          </div>
        )}

        <div className="prose prose-invert prose-lg max-w-none blog-content"
          style={{ color: "#cbd5e1" }}
          dangerouslySetInnerHTML={{ __html: blog.content }} />

        {/* Ad After Content */}
        {adAfterContent && (
          <div className="my-6 text-center" dangerouslySetInnerHTML={{ __html: adAfterContent }} />
        )}

        <div className="mt-12 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/blog" className="text-cyan-400 hover:underline">← Back to All Posts</Link>
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}

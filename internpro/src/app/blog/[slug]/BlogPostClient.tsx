"use client";

import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import TableOfContents from "@/components/TableOfContents";
import AuthorBox from "@/components/AuthorBox";
import SocialShare from "@/components/SocialShare";

interface BlogData {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string | null;
  author: string;
  category: string;
  tags: string | null;
  state: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
}

interface RelatedArticle {
  title: string;
  slug: string;
  state: string | null;
  city: string | null;
}

interface Props {
  blog: BlogData;
  adBefore: string;
  adAfter: string;
  relatedArticles: RelatedArticle[];
}

export default function BlogPostClient({ blog, adBefore, adAfter, relatedArticles }: Props) {
  const articleUrl = `https://internship.kkhsmedia.com/blog/${blog.slug}`;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)" }}>
      <PublicNavbar />
      <article className="max-w-4xl mx-auto px-6 py-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-cyan-400 transition-colors">Blog</Link>
          {blog.state && (
            <>
              <span>/</span>
              <Link href={`/blog?state=${encodeURIComponent(blog.state)}`} className="hover:text-cyan-400 transition-colors">{blog.state}</Link>
            </>
          )}
          {blog.city && (
            <>
              <span>/</span>
              <Link href={`/blog?city=${encodeURIComponent(blog.city)}`} className="hover:text-cyan-400 transition-colors">{blog.city}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-400 truncate max-w-[200px]">{blog.title}</span>
        </nav>

        {blog.coverImage && (
          <Link href="/register" className="block rounded-2xl overflow-hidden mb-8 aspect-video group cursor-pointer">
            <img
              src={blog.coverImage}
              alt={`${blog.title} - KKHS Media Internship`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </Link>
        )}

        {/* Ad Before Content */}
        {adBefore && (
          <div className="my-6 text-center" dangerouslySetInnerHTML={{ __html: adBefore }} />
        )}

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">{blog.category}</span>
          {blog.state && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">{blog.state}</span>
          )}
          {blog.city && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">{blog.city}</span>
          )}
          <span className="text-sm text-slate-500">{new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="text-sm text-slate-500">•</span>
          <span className="text-sm text-slate-500">By {blog.author}</span>
          <span className="text-sm text-slate-500">•</span>
          <span className="text-sm text-slate-500">{blog.views} views</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{blog.title}</h1>

        {/* Last Updated Badge */}
        <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last Updated: {new Date(blog.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </div>

        {blog.tags && (
          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags.split(",").map((tag) => (
              <span key={tag.trim()} className="px-2 py-0.5 text-xs rounded bg-white/5 text-slate-400">#{tag.trim()}</span>
            ))}
          </div>
        )}

        {/* Table of Contents */}
        <TableOfContents content={blog.content} />

        {/* Article Content - images are clickable to register */}
        <div
          className="prose prose-invert prose-lg max-w-none blog-content"
          style={{ color: "#cbd5e1" }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              e.preventDefault();
              window.location.href = '/register';
            }
          }}
        />

        {/* Ad After Content */}
        {adAfter && (
          <div className="my-6 text-center" dangerouslySetInnerHTML={{ __html: adAfter }} />
        )}

        {/* Social Share Buttons */}
        <SocialShare url={articleUrl} title={blog.title} />

        {/* Author Box */}
        <AuthorBox />

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-xl font-bold text-white mb-4">Related Internships</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="rounded-xl p-4 transition-all hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <h3 className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors line-clamp-2">{article.title}</h3>
                  <div className="flex gap-2 mt-2">
                    {article.state && <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">{article.state}</span>}
                    {article.city && <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">{article.city}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/blog" className="text-cyan-400 hover:underline">← Back to All Posts</Link>
        </div>
      </article>
      <PublicFooter />
    </div>
  );
}

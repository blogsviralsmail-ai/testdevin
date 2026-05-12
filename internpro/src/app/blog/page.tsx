"use client";

import { useEffect, useState, useMemo } from "react";
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
  state: string | null;
  city: string | null;
  createdAt: string;
  views: number;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "oldest">("latest");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    fetch(`/api/blogs?published=true`)
      .then((r) => r.json())
      .then((data) => { setBlogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => [...new Set(blogs.map((b) => b.category))].sort(), [blogs]);
  const states = useMemo(() => [...new Set(blogs.map((b) => b.state).filter(Boolean) as string[])].sort(), [blogs]);
  const cities = useMemo(() => {
    const filtered = state ? blogs.filter((b) => b.state === state) : blogs;
    return [...new Set(filtered.map((b) => b.city).filter(Boolean) as string[])].sort();
  }, [blogs, state]);

  const filteredBlogs = useMemo(() => {
    let result = blogs;

    if (category) result = result.filter((b) => b.category === category);
    if (state) result = result.filter((b) => b.state === state);
    if (city) result = result.filter((b) => b.city === city);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        (b.excerpt && b.excerpt.toLowerCase().includes(q)) ||
        (b.tags && b.tags.toLowerCase().includes(q)) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.state && b.state.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q))
      );
    }

    if (sortBy === "latest") {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "popular") {
      result = [...result].sort((a, b) => b.views - a.views);
    }

    return result;
  }, [blogs, category, state, city, search, sortBy]);

  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);
  const paginatedBlogs = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredBlogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBlogs, page, ITEMS_PER_PAGE]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [category, state, city, search, sortBy]);

  const hasActiveFilters = search || category || state || city;

  const clearAllFilters = () => {
    setSearch("");
    setCategory("");
    setState("");
    setCity("");
  };

  const selectStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0a0e1a 100%)" }}>
      <PublicNavbar />
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Blog</h1>
          <p className="text-slate-400 text-lg">Insights, tips, and updates on internships, careers, and skill development</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search articles by university, state, city, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="rounded-xl p-4 mb-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* State & City Dropdowns + Sort */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* State Filter */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                value={state}
                onChange={(e) => { setState(e.target.value); setCity(""); }}
                className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                style={selectStyle}
              >
                <option value="">All States</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                style={selectStyle}
                disabled={cities.length === 0}
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "latest" | "popular" | "oldest")}
                className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                style={selectStyle}
              >
                <option value="latest">Latest First</option>
                <option value="popular">Most Popular</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategory("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!category ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25" : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"}`}>
              All Categories
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === c ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25" : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Active filters + Clear */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xs text-slate-500">Active:</span>
              {state && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
                  {state}
                  <button onClick={() => { setState(""); setCity(""); }} className="hover:text-white">&times;</button>
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300">
                  {city}
                  <button onClick={() => setCity("")} className="hover:text-white">&times;</button>
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300">
                  {category}
                  <button onClick={() => setCategory("")} className="hover:text-white">&times;</button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300">
                  &quot;{search}&quot;
                  <button onClick={() => setSearch("")} className="hover:text-white">&times;</button>
                </span>
              )}
              <button onClick={clearAllFilters}
                className="ml-auto text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-6 text-sm text-slate-500">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredBlogs.length)} of {filteredBlogs.length} articles
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Loading articles...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-slate-400 text-lg mb-2">
              {hasActiveFilters ? "No articles match your filters" : "No blog posts yet"}
            </p>
            <p className="text-slate-500 text-sm">
              {hasActiveFilters ? "Try different filters or clear all" : "Check back soon!"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters}
                className="mt-4 px-6 py-2 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all">
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/10"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {blog.coverImage ? (
                  <div className="aspect-video overflow-hidden">
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}>
                    <span className="text-5xl opacity-30">📝</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">{blog.category}</span>
                    {blog.state && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">{blog.state}</span>
                    )}
                    {blog.city && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">{blog.city}</span>
                    )}
                    <span className="text-xs text-slate-500">{new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {blog.views > 0 && (
                      <span className="text-xs text-slate-500 ml-auto">{blog.views} views</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3">{blog.excerpt}</p>
                  {blog.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {blog.tags.split(",").slice(0, 3).map((tag) => (
                        <span key={tag.trim()} className="px-2 py-0.5 text-xs rounded bg-white/5 text-slate-500">#{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">By {blog.author}</span>
                    <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition-transform">Read More →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              ← Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    page === p ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              Next →
            </button>
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}

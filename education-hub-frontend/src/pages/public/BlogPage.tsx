import { useState, useEffect } from "react";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr.replace(" ", "T"));
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
};

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.get("/api/blog?status=published").then(r => setPosts(r.data || [])).catch(() => {});
  }, []);

  const imgSrc = (p: string) => { if (!p) return ""; if (p.startsWith("http")) return p; return API + p; };
  const categories = [...new Set(posts.map(p => p.category))];
  const filtered = filter ? posts.filter(p => p.category === filter) : posts;

  if (selected) {
    return (
      <div>
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <button onClick={() => setSelected(null)} className="text-indigo-200 hover:text-white mb-4 text-sm">&larr; Back to Blog</button>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{selected.title}</h1>
            <div className="flex items-center gap-4 text-indigo-200 text-sm">
              <span className="flex items-center gap-1"><User className="h-4 w-4" /> {selected.author}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(selected.created_at)}</span>
              <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {selected.category}</span>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-10">
          {selected.image && <img src={imgSrc(selected.image)} alt={selected.title} className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8" loading="eager" fetchPriority="high" decoding="async" />}
          <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: selected.content || selected.excerpt || "" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEO
        title="Blog & Insights - Education News & Tips"
        description="Latest news, tips, and insights about education, university admissions, career guidance, and student success stories from Education Hub."
        keywords="education blog, admission tips, career guidance, university news, student tips, education insights India"
        canonical="/blog"
      />
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Blog & Insights</h1>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto">Latest news, tips, and insights about education, admissions, and career guidance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {categories.length > 0 && (
          <div className="flex gap-2 mb-8 flex-wrap">
            <button onClick={() => setFilter("")} className={`px-4 py-2 rounded-full text-sm font-medium ${!filter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === c ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{c}</button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelected(p)}>
              {p.image ? <img src={imgSrc(p.image)} alt={p.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" loading="lazy" decoding="async" /> :
                <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center"><Tag className="h-12 w-12 text-indigo-300" /></div>}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{p.category}</span>
                  <span className="text-xs text-gray-400">{formatDate(p.created_at)}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{p.excerpt || p.content?.substring(0, 120)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><User className="h-3 w-3" /> {p.author}</span>
                  <span className="text-indigo-600 text-sm font-medium flex items-center gap-1">Read More <ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No blog posts yet</h3>
            <p className="text-gray-400">Check back soon for new articles and insights!</p>
          </div>
        )}
      </div>
    </div>
  );
}

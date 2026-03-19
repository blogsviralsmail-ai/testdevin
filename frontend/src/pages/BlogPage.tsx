import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Calendar, Eye, Share2 } from "lucide-react";
import { getBlog } from "../api";
import { Blog } from "../types";
import AdBanner from "../components/AdBanner";

export default function BlogPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [related, setRelated] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getBlog(slug)
      .then((r) => { setBlog(r.data); setRelated(r.related || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-100 rounded w-3/4 animate-pulse mb-4" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800">लेख नहीं मिला</h1>
        <Link to="/blog" className="text-yellow-700 mt-4 inline-block">वापस जाएं</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{blog.title_hi || blog.title} | आभूषण बाज़ार</title>
        <meta name="description" content={blog.excerpt_hi || blog.title_hi || blog.title} />
        <meta property="og:title" content={blog.title_hi || blog.title} />
        <meta property="og:image" content={blog.image_url} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-yellow-700">होम</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-yellow-700">ब्लॉग</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-800 font-medium line-clamp-1">{blog.title_hi}</span>
        </nav>

        <article>
          <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-medium">
            {blog.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mt-4 mb-2">
            {blog.title_hi || blog.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(blog.created_at).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" /> {blog.views} views
            </span>
            <button
              onClick={() => navigator.share?.({ title: blog.title_hi, url: window.location.href })}
              className="flex items-center gap-1 text-yellow-700 hover:text-yellow-800"
            >
              <Share2 className="w-4 h-4" /> शेयर
            </button>
          </div>

          {blog.image_url && (
            <img
              src={blog.image_url}
              alt={blog.title_hi}
              className="w-full rounded-2xl mb-8 shadow-md"
            />
          )}

          <AdBanner slot="blog-content-top" />

          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (blog.content_hi || blog.content || "").replace(/\n/g, "<br/>") }}
          />

          {blog.tags && (
            <div className="mt-8 flex flex-wrap gap-2">
              {blog.tags.split(",").map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </article>

        <AdBanner slot="blog-content-bottom" className="mt-8" />

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">संबंधित लेख</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="group flex gap-4 bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition border border-gray-100"
                >
                  <img
                    src={r.image_url || "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200"}
                    alt={r.title_hi}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-yellow-700 transition line-clamp-2">
                      {r.title_hi || r.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(r.created_at).toLocaleDateString("hi-IN")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

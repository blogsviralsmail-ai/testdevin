import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getBlogs } from "../api";
import { Blog } from "../types";
import AdBanner from "../components/AdBanner";
import { Eye, Calendar } from "lucide-react";

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBlogs(1, 12)
      .then((r) => { setBlogs(r.data); setTotal(r.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadMore = () => {
    const next = page + 1;
    getBlogs(next, 12).then((r) => {
      setBlogs((p) => [...p, ...r.data]);
      setPage(next);
    });
  };

  return (
    <>
      <Helmet>
        <title>ज्वेलरी ब्लॉग - सोने चांदी की जानकारी | आभूषण बाज़ार</title>
        <meta name="description" content="ज्वेलरी खरीदने के टिप्स, सोने की शुद्धता की पहचान, मंगलसूत्र डिज़ाइन गाइड, ब्राइडल ज्वेलरी गाइड और बहुत कुछ।" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ज्वेलरी ब्लॉग</h1>
          <p className="text-gray-500 mt-1">Jewellery Blog — सोने-चांदी और ज्वेलरी से जुड़ी जानकारी</p>
        </div>

        <AdBanner slot="blog-top" />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-gray-500 text-center py-12">अभी कोई लेख उपलब्ध नहीं है।</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition border border-gray-100"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={blog.image_url || "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"}
                      alt={blog.title_hi}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium">
                      {blog.category}
                    </span>
                    <h2 className="font-bold text-gray-800 mt-2 group-hover:text-yellow-700 transition line-clamp-2">
                      {blog.title_hi || blog.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {blog.excerpt_hi || ""}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(blog.created_at).toLocaleDateString("hi-IN")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {blog.views}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {blogs.length < total && (
              <div className="text-center">
                <button onClick={loadMore} className="bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-yellow-700 transition">
                  और लेख देखें
                </button>
              </div>
            )}
          </>
        )}

        <AdBanner slot="blog-bottom" />
      </div>
    </>
  );
}

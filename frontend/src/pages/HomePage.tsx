import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Sparkles, Star, TrendingUp } from "lucide-react";
import GoldRateWidget from "../components/GoldRateWidget";
import DesignCard from "../components/DesignCard";
import AdBanner from "../components/AdBanner";
import { getCategories, getFeaturedDesigns, getRecentBlogs } from "../api";
import { Category, Design, Blog } from "../types";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Design[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(() => {});
    getFeaturedDesigns().then((r) => setFeatured(r.data)).catch(() => {});
    getRecentBlogs().then((r) => setBlogs(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <Helmet>
        <title>आभूषण बाज़ार - सोने चांदी के भाव, ज्वेलरी डिज़ाइन | Aabhooshan Bazaar</title>
        <meta name="description" content="आज का सोने का भाव जयपुर, नवीनतम ज्वेलरी डिज़ाइन, मंगलसूत्र, बालियां, अंगूठी, नेकलेस डिज़ाइन कीमत और वजन के साथ। Gold Rate Today Jaipur." />
        <meta name="keywords" content="सोने का भाव, gold rate today, जयपुर सोने का भाव, मंगलसूत्र डिज़ाइन, gold jewellery design, ज्वेलरी डिज़ाइन" />
        <link rel="canonical" href="https://aabhooshanbazaar.com" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-800 via-yellow-700 to-amber-800 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <span className="text-yellow-300 text-sm font-medium">भारत का प्रमुख ज्वेलरी डिज़ाइन पोर्टल</span>
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              नवीनतम <span className="text-yellow-300">ज्वेलरी डिज़ाइन</span> और
              <br />आज का <span className="text-yellow-300">सोने का भाव</span>
            </h1>
            <p className="text-yellow-200 text-base md:text-lg mb-8">
              मंगलसूत्र, बालियां, अंगूठी, नेकलेस, कंगन — सभी डिज़ाइन कीमत और वजन के साथ
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/categories" className="bg-white text-yellow-800 px-6 py-3 rounded-full font-semibold hover:bg-yellow-100 transition">
                ज्वेलरी देखें
              </Link>
              <Link to="/gold-rate" className="border-2 border-yellow-300 text-yellow-300 px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 hover:text-yellow-900 transition">
                सोने का भाव
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Gold Rate Widget */}
        <GoldRateWidget />

        <AdBanner slot="home-top" />

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">ज्वेलरी कैटेगरी</h2>
              <p className="text-sm text-gray-500">Jewellery Categories</p>
            </div>
            <Link to="/categories" className="text-yellow-700 hover:text-yellow-800 text-sm font-medium flex items-center gap-1">
              सभी देखें <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-gray-100"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={cat.image_url}
                    alt={cat.name_hi}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-2 text-center">
                  <h3 className="font-semibold text-gray-800 text-sm">{cat.name_hi}</h3>
                  <p className="text-[10px] text-gray-500">{cat.name} ({cat.design_count})</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <AdBanner slot="home-mid" />

        {/* Featured Designs */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">लोकप्रिय डिज़ाइन</h2>
                  <p className="text-sm text-gray-500">Featured Designs</p>
                </div>
              </div>
              <Link to="/categories" className="text-yellow-700 hover:text-yellow-800 text-sm font-medium flex items-center gap-1">
                सभी देखें <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featured.slice(0, 12).map((design) => (
                <DesignCard key={design.id} design={design} />
              ))}
            </div>
          </section>
        )}

        <AdBanner slot="home-bottom" />

        {/* Recent Blogs */}
        {blogs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">नवीनतम लेख</h2>
                  <p className="text-sm text-gray-500">Latest Articles</p>
                </div>
              </div>
              <Link to="/blog" className="text-yellow-700 hover:text-yellow-800 text-sm font-medium flex items-center gap-1">
                सभी देखें <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogs.slice(0, 3).map((blog) => (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition border border-gray-100"
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
                    <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">{blog.category}</span>
                    <h3 className="font-semibold text-gray-800 mt-2 group-hover:text-yellow-700 transition line-clamp-2">
                      {blog.title_hi || blog.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(blog.created_at).toLocaleDateString("hi-IN")}
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

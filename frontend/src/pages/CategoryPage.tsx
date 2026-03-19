import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight } from "lucide-react";
import { getDesigns, getCategory } from "../api";
import { Design, Category } from "../types";
import DesignCard from "../components/DesignCard";
import GoldRateWidget from "../components/GoldRateWidget";
import AdBanner from "../components/AdBanner";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getCategory(slug).then((r) => setCategory(r.data)).catch(() => {});
    getDesigns(1, 24, slug)
      .then((r) => { setDesigns(r.data); setTotal(r.total || 0); setPage(1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const loadMore = () => {
    if (!slug) return;
    const nextPage = page + 1;
    getDesigns(nextPage, 24, slug).then((r) => {
      setDesigns((prev) => [...prev, ...r.data]);
      setPage(nextPage);
    });
  };

  return (
    <>
      <Helmet>
        <title>{category ? `${category.name_hi} डिज़ाइन - ${category.name}` : "ज्वेलरी डिज़ाइन"} | आभूषण बाज़ार</title>
        <meta name="description" content={category?.description_hi || "नवीनतम ज्वेलरी डिज़ाइन कीमत और वजन के साथ"} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <GoldRateWidget />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-yellow-700">होम</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/categories" className="hover:text-yellow-700">कैटेगरी</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-800 font-medium">{category?.name_hi || slug}</span>
        </nav>

        {category && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
            <h1 className="text-3xl font-bold text-gray-800">{category.name_hi} डिज़ाइन</h1>
            <p className="text-gray-600 mt-1">{category.name} Designs — {category.description_hi}</p>
            <p className="text-sm text-yellow-700 mt-2 font-medium">कुल {total} डिज़ाइन</p>
          </div>
        )}

        <AdBanner slot="cat-detail-top" />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">इस कैटेगरी में अभी कोई डिज़ाइन नहीं है।</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {designs.map((d, i) => (
                <div key={d.id}>
                  <DesignCard design={d} />
                  {(i + 1) % 12 === 0 && <AdBanner slot={`cat-mid-${i}`} className="col-span-full" />}
                </div>
              ))}
            </div>
            {designs.length < total && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  className="bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-yellow-700 transition"
                >
                  और डिज़ाइन देखें
                </button>
              </div>
            )}
          </>
        )}

        <AdBanner slot="cat-detail-bottom" />
      </div>
    </>
  );
}

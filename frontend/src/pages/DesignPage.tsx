import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Scale, Gem, Eye, Share2, ChevronLeft } from "lucide-react";
import { getDesign } from "../api";
import { Design } from "../types";
import DesignCard from "../components/DesignCard";
import AdBanner from "../components/AdBanner";

export default function DesignPage() {
  const { slug } = useParams<{ slug: string }>();
  const [design, setDesign] = useState<Design | null>(null);
  const [related, setRelated] = useState<Design[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setActiveImg(0);
    getDesign(slug)
      .then((r) => { setDesign(r.data); setRelated(r.related || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
            <div className="h-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800">डिज़ाइन नहीं मिला</h1>
        <Link to="/categories" className="text-yellow-700 mt-4 inline-block">वापस जाएं</Link>
      </div>
    );
  }

  const images = design.images && design.images.length > 0
    ? design.images
    : ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800"];

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Helmet>
        <title>{design.title_hi} - {design.title} | आभूषण बाज़ार</title>
        <meta name="description" content={`${design.title_hi} - ${design.description_hi || design.description}। कीमत: ${design.price_range}, वजन: ${design.weight_grams}g, शुद्धता: ${design.purity}`} />
        <meta property="og:title" content={`${design.title_hi} | आभूषण बाज़ार`} />
        <meta property="og:image" content={images[0]} />
        <meta property="og:type" content="product" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-yellow-700">होम</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/category/${design.category_slug}`} className="hover:text-yellow-700">
            {design.category_name_hi || design.category_name}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-800 font-medium line-clamp-1">{design.title_hi}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
              <img
                src={images[activeImg]}
                alt={design.title_hi}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white shadow"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImg((p) => (p + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white shadow"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${i === activeImg ? "border-yellow-500" : "border-gray-200"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Design Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{design.title_hi}</h1>
            <p className="text-gray-500 mt-1">{design.title}</p>

            {design.price_range && (
              <p className="text-2xl font-bold text-yellow-700 mt-4">{design.price_range}</p>
            )}

            <div className="grid grid-cols-3 gap-4 mt-6">
              {design.weight_grams > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <Scale className="w-5 h-5 text-yellow-600 mx-auto" />
                  <p className="text-lg font-bold text-gray-800 mt-1">{design.weight_grams}g</p>
                  <p className="text-xs text-gray-500">वजन</p>
                </div>
              )}
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <Gem className="w-5 h-5 text-yellow-600 mx-auto" />
                <p className="text-lg font-bold text-gray-800 mt-1">{design.purity}</p>
                <p className="text-xs text-gray-500">शुद्धता</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <Eye className="w-5 h-5 text-yellow-600 mx-auto" />
                <p className="text-lg font-bold text-gray-800 mt-1">{design.views}</p>
                <p className="text-xs text-gray-500">व्यूज़</p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold text-gray-800 mb-2">विवरण</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {design.description_hi || design.description}
              </p>
            </div>

            {design.tags && (
              <div className="mt-4 flex flex-wrap gap-2">
                {design.tags.split(",").map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => navigator.share?.({ title: design.title_hi, url: shareUrl })}
              className="mt-6 flex items-center gap-2 text-yellow-700 hover:text-yellow-800 text-sm font-medium"
            >
              <Share2 className="w-4 h-4" /> शेयर करें
            </button>
          </div>
        </div>

        <AdBanner slot="design-mid" className="mt-8" />

        {/* Related Designs */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              इसी कैटेगरी के और डिज़ाइन
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {related.map((d) => (
                <DesignCard key={d.id} design={d} />
              ))}
            </div>
          </section>
        )}

        <AdBanner slot="design-bottom" className="mt-8" />
      </div>
    </>
  );
}

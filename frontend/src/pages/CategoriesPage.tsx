import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getCategories } from "../api";
import { Category } from "../types";
import GoldRateWidget from "../components/GoldRateWidget";
import AdBanner from "../components/AdBanner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then((r) => setCategories(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>ज्वेलरी कैटेगरी - सोने चांदी के गहने | आभूषण बाज़ार</title>
        <meta name="description" content="मंगलसूत्र, बालियां, अंगूठी, नेकलेस, कंगन, मांग टीका, पायल, ब्राइडल सेट — सभी ज्वेलरी कैटेगरी डिज़ाइन देखें।" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <GoldRateWidget />

        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ज्वेलरी कैटेगरी</h1>
          <p className="text-gray-500">Jewellery Categories — सभी प्रकार के सोने-चांदी के गहने</p>
        </div>

        <AdBanner slot="cat-top" />

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={cat.image_url}
                    alt={cat.name_hi}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 text-center">
                  <h2 className="text-lg font-bold text-gray-800 group-hover:text-yellow-700 transition">
                    {cat.name_hi}
                  </h2>
                  <p className="text-sm text-gray-500">{cat.name}</p>
                  <p className="text-xs text-yellow-700 mt-1 font-medium">{cat.design_count} डिज़ाइन</p>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{cat.description_hi}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <AdBanner slot="cat-bottom" />
      </div>
    </>
  );
}

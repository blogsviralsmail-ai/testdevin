import { Link } from "react-router-dom";
import { Eye, Scale, Gem } from "lucide-react";
import { Design } from "../types";

export default function DesignCard({ design }: { design: Design }) {
  const img = design.images && design.images.length > 0
    ? design.images[0]
    : "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400";

  return (
    <Link
      to={`/design/${design.slug}`}
      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative overflow-hidden aspect-square">
        <img
          src={img}
          alt={design.title_hi || design.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {design.is_featured === 1 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-medium">
            Featured
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-yellow-700 transition">
          {design.title_hi || design.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{design.title}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {design.weight_grams > 0 && (
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3" /> {design.weight_grams}g
            </span>
          )}
          <span className="flex items-center gap-1">
            <Gem className="w-3 h-3" /> {design.purity}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {design.views}
          </span>
        </div>
        {design.price_range && (
          <p className="text-yellow-700 font-bold text-sm mt-2">{design.price_range}</p>
        )}
      </div>
    </Link>
  );
}

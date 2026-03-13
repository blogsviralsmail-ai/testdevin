import { useState, useEffect } from "react";
import { Image, X, Building2, Camera, Users, PartyPopper, ChevronDown, Filter, Search } from "lucide-react";
import api from "../../lib/api";
import SEO from "../../components/SEO";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface University { id: number; name: string; }

export default function GalleryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [uniFilter, setUniFilter] = useState("");
  const [lightbox, setLightbox] = useState<any>(null);
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const [uniSearch, setUniSearch] = useState("");

  useEffect(() => {
    api.get("/api/gallery").then(r => setImages(r.data || [])).catch(() => {});
    api.get("/api/universities").then(r => setUniversities(r.data || [])).catch(() => {});
  }, []);

  const imgSrc = (p: string) => { if (!p) return ""; if (p.startsWith("http")) return p; return API + p; };
  const categories = ["Campus", "Events", "Team"];
  
  // Get unique universities from gallery data (dynamic - new universities auto-appear)
  const galleryUnis = [...new Set(images.map(i => i.university).filter(Boolean))].sort();
  // Also include universities from API that might not have gallery images yet
  const allUniNames = [...new Set([...galleryUnis, ...universities.map(u => u.name)])].sort();
  
  const filtered = images.filter(i => {
    const matchCategory = !categoryFilter || i.category === categoryFilter;
    const matchUni = !uniFilter || i.university === uniFilter;
    return matchCategory && matchUni;
  });

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case "Campus": return <Camera className="h-4 w-4" />;
      case "Events": return <PartyPopper className="h-4 w-4" />;
      case "Team": return <Users className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  const getCategoryCount = (cat: string) => {
    return images.filter(i => {
      const matchCat = !cat || i.category === cat;
      const matchUni = !uniFilter || i.university === uniFilter;
      return matchCat && matchUni;
    }).length;
  };

  return (
    <div>
      <SEO
        title="Photo Gallery - Campus & Events"
        description="Browse photos from Education Hub events, campus visits, seminars, celebrations, and student activities across top universities."
        keywords="education hub gallery, campus photos, education events, student activities, seminar photos, university campus, campus tour"
        canonical="/gallery"
      />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-900 via-purple-800 to-pink-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Photo Gallery</h1>
          <p className="text-lg text-pink-200 max-w-2xl mx-auto">Glimpses of our events, campus visits, seminars, and celebrations across {galleryUnis.length}+ universities</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-700">Filter Gallery</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* University Dropdown Filter */}
            <div className="flex-1 relative">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> Select University
              </label>
              <button
                onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className={uniFilter ? "text-indigo-700" : "text-gray-500"}>
                  {uniFilter || "All Universities"}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${uniDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {uniDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setUniDropdownOpen(false); setUniSearch(""); }} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-80 overflow-hidden flex flex-col">
                    {/* Search Box */}
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search university..."
                          value={uniSearch}
                          onChange={(e) => setUniSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-64">
                    <button
                      onClick={() => { setUniFilter(""); setUniDropdownOpen(false); setUniSearch(""); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${!uniFilter ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"}`}
                    >
                      All Universities ({images.length} photos)
                    </button>
                    {allUniNames.filter(u => !uniSearch || u.toLowerCase().includes(uniSearch.toLowerCase())).map(u => {
                      const count = images.filter(i => i.university === u).length;
                      return (
                        <button
                          key={u}
                          onClick={() => { setUniFilter(u); setUniDropdownOpen(false); setUniSearch(""); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between ${uniFilter === u ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"}`}
                        >
                          <span className="truncate mr-2">{u}</span>
                          {count > 0 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">{count}</span>}
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Category Filter Buttons */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCategoryFilter("")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${!categoryFilter ? "bg-pink-600 text-white shadow-md" : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  <Image className="h-3.5 w-3.5" /> All ({getCategoryCount("")})
                </button>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${categoryFilter === c ? "bg-pink-600 text-white shadow-md" : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                  >
                    {getCategoryIcon(c)} {c} ({getCategoryCount(c)})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filter Badge */}
          {(uniFilter || categoryFilter) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Active filters:</span>
              {uniFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                  <Building2 className="h-3 w-3" /> {uniFilter}
                  <button onClick={() => setUniFilter("")} className="ml-1 hover:text-indigo-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">
                  {getCategoryIcon(categoryFilter)} {categoryFilter}
                  <button onClick={() => setCategoryFilter("")} className="ml-1 hover:text-pink-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              <button
                onClick={() => { setUniFilter(""); setCategoryFilter(""); }}
                className="text-xs text-gray-400 hover:text-red-500 ml-auto"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{filtered.length}</span> photos
            {uniFilter && <span> from <span className="font-semibold text-indigo-600">{uniFilter}</span></span>}
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(g => (
            <div key={g.id} className="group cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white border border-gray-100" onClick={() => setLightbox(g)}>
              <div className="relative">
                <img src={imgSrc(g.image)} alt={g.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                  <div className="w-full p-3 bg-gradient-to-t from-black/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-medium line-clamp-1">{g.title || "Gallery"}</p>
                    <p className="text-white/70 text-xs mt-0.5">{g.category}{g.university ? ` - ${g.university}` : ""}</p>
                  </div>
                </div>
                {/* Category Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${
                    g.category === "Campus" ? "bg-blue-500/80 text-white" :
                    g.category === "Events" ? "bg-orange-500/80 text-white" :
                    g.category === "Team" ? "bg-green-500/80 text-white" :
                    "bg-gray-500/80 text-white"
                  }`}>
                    {g.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No images found</h3>
            <p className="text-gray-400">{categoryFilter || uniFilter ? "Try changing the filter" : "Gallery coming soon!"}</p>
            {(categoryFilter || uniFilter) && (
              <button
                onClick={() => { setUniFilter(""); setCategoryFilter(""); }}
                className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-6 w-6" /></button>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={imgSrc(lightbox.image)} alt={lightbox.title} className="w-full max-h-[80vh] object-contain rounded-xl" loading="eager" decoding="async" />
            <div className="text-center mt-4">
              {lightbox.title && <p className="text-white text-lg font-medium">{lightbox.title}</p>}
              {lightbox.description && <p className="text-white/70 text-sm mt-1">{lightbox.description}</p>}
              <div className="flex items-center justify-center gap-3 mt-2">
                {lightbox.category && (
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    lightbox.category === "Campus" ? "bg-blue-500/20 text-blue-300" :
                    lightbox.category === "Events" ? "bg-orange-500/20 text-orange-300" :
                    "bg-green-500/20 text-green-300"
                  }`}>
                    {lightbox.category}
                  </span>
                )}
                {lightbox.university && (
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-medium flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {lightbox.university}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import SEO from "../../components/SEO";
import { Search, Loader2, Filter, MapPin, Globe, ArrowRight } from "lucide-react";

interface University {
  id: number;
  name: string;
  code: string;
  logo: string | null;
  description: string;
  website: string;
  address: string;
  status: string;
}

export default function Universities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get("/api/universities");
      setUniversities(res.data || []);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  const filtered = universities.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.code.toLowerCase().includes(s) || u.address?.toLowerCase().includes(s);
  });

  const gradients = [
    "from-blue-600 to-indigo-700",
    "from-purple-600 to-violet-700",
    "from-emerald-600 to-teal-700",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-cyan-600 to-blue-700",
    "from-amber-500 to-orange-600",
    "from-green-600 to-emerald-700",
    "from-indigo-500 to-purple-600",
    "from-red-500 to-pink-600",
    "from-teal-500 to-cyan-600",
    "from-violet-500 to-indigo-600",
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div>
      <SEO
        title="Our Universities - 30+ Top Indian Universities"
        description="Explore 30+ top Indian universities partnered with A Step For Future Education Hub. GLA, LPU, Chandigarh University, Amity, NMIMS, Manipal and more. UGC recognized, NAAC accredited universities."
        keywords="Indian universities, top universities India, GLA University, LPU, Chandigarh University, Amity University, NMIMS, Manipal University, UGC recognized, NAAC accredited"
        canonical="/universities"
      />

      {/* Hero Banner */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://www.itm.edu/assets/institute-banner-img/b-school-desktop-banner.webp" alt="University campus" className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-blue-900/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-semibold rounded-full mb-4 border border-white/20">OUR PARTNER UNIVERSITIES</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">Top Universities Across India</h1>
          <p className="text-blue-200 max-w-2xl mx-auto text-lg">Choose from {universities.length}+ UGC recognized and NAAC accredited universities for your bright future.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10 -mt-12 relative z-10">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Search universities by name, code, or location..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">{filtered.length} universities found</p>
            {search && (
              <button onClick={() => setSearch("")} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Clear search</button>
            )}
          </div>
        </div>

        {/* Universities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((uni, idx) => {
            const gradient = gradients[idx % gradients.length];
            return (
              <Link key={uni.id} to={`/courses?university=${uni.id}`} className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uni.logo ? (
                      <img src={uni.logo.startsWith("http") ? uni.logo : `https://asffeducationhub.com${uni.logo}?v=2`} alt={uni.name} className="h-20 w-20 object-contain bg-white rounded-xl p-2 shadow-lg" loading="lazy" decoding="async" />
                    ) : (
                      <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                        <span className="text-2xl font-extrabold text-white">{uni.code}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-xs px-3 py-1 rounded-full font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/20">
                      {uni.code}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors text-base leading-snug line-clamp-2">{uni.name}</h3>
                  {uni.address && (
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1 line-clamp-1"><MapPin className="h-3 w-3 flex-shrink-0" /> {uni.address}</p>
                  )}
                  {uni.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{uni.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {uni.website && (
                      <a href={uni.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium">
                        <Globe className="h-3.5 w-3.5" /> Website
                      </a>
                    )}
                    <span className="flex items-center gap-1 text-blue-600 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                      View Courses <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Filter className="h-10 w-10 text-gray-300" /></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No universities found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

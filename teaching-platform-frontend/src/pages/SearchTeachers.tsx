import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { teacherAPI, subjectAPI } from '../services/api';
import { Search, MapPin, Star, IndianRupee, BookOpen, X, ChevronLeft, ChevronRight, SlidersHorizontal, Users } from 'lucide-react';

interface Teacher {
  user_id: number;
  teacher_id: number;
  full_name: string;
  city: string;
  state: string;
  avatar: string | null;
  is_verified: boolean;
  bio: string;
  experience_years: number;
  hourly_rate: number;
  languages: string[];
  qualification: string;
  rating: number;
  total_reviews: number;
  total_classes: number;
  subjects: { name: string; class_levels: string[] }[];
}

interface Subject { id: number; name: string; }

const CITIES = [
  'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner',
  'Bhilwara', 'Alwar', 'Sikar', 'Pali', 'Bharatpur', 'Sri Ganganagar',
  'Tonk', 'Kishangarh', 'Beawar', 'Hanumangarh', 'Chittorgarh',
  'Baran', 'Rajsamand', 'Mount Abu', 'Nagaur', 'Barmer', 'Jaisalmer', 'Pushkar'
];

const CLASS_LEVELS = ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'College', 'Professional', 'Competitive Exams'];

export default function SearchTeachers() {
  const [searchParams] = useSearchParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    subject: searchParams.get('subject') || '',
    city: '', class_level: '',
    min_price: '', max_price: '', min_rating: '', language: ''
  });

  useEffect(() => {
    subjectAPI.list().then(setSubjects).catch(() => {});
    searchTeachers();
  }, []);

  useEffect(() => { searchTeachers(); }, [page]);

  const searchTeachers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 12 };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await teacherAPI.search(params);
      setTeachers(data.teachers);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); searchTeachers(); };
  const clearFilters = () => {
    setFilters({ subject: '', city: '', class_level: '', min_price: '', max_price: '', min_rating: '', language: '' });
    setPage(1);
    setTimeout(searchTeachers, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[104px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex-1 flex gap-2">
              <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white">
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white">
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSearch} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 shadow-sm">
                <Search size={16} /> Search
              </button>
              <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all border ${showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <SlidersHorizontal size={16} /> Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-3">
              <select value={filters.class_level} onChange={(e) => setFilters({ ...filters, class_level: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                <option value="">Class Level</option>
                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input type="number" placeholder="Min Price" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              <input type="number" placeholder="Max Price" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              <select value={filters.min_rating} onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                <option value="">Min Rating</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
              <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                <option value="">Language</option>
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Rajasthani">Rajasthani</option>
                <option value="Sanskrit">Sanskrit</option>
              </select>
              <button onClick={clearFilters} className="px-3 py-2 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-1 hover:bg-red-100 transition col-span-2 md:col-span-1 justify-center">
                <X size={14} /> Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">{total} teachers found</h2>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4 text-sm">Finding teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Search size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No teachers found</h3>
            <p className="text-gray-400 mt-1 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {teachers.map(t => (
                <Link to={`/teacher-profile/${t.teacher_id}`} key={t.teacher_id}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  {/* Card header with gradient */}
                  <div className="h-20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 relative">
                    <div className="absolute -bottom-6 left-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg ring-4 ring-white">
                        {t.full_name.charAt(0)}
                      </div>
                    </div>
                    {t.is_verified && (
                      <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">Verified</span>
                    )}
                  </div>
                  <div className="pt-8 px-5 pb-5">
                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">{t.full_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin size={12} /> {t.city}, {t.state}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 mt-2.5 leading-relaxed">{t.bio}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {t.subjects.slice(0, 3).map((s, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 rounded-md font-medium">{s.name}</span>
                      ))}
                      {t.subjects.length > 3 && <span className="bg-gray-50 text-gray-400 text-[11px] px-2 py-0.5 rounded-md">+{t.subjects.length - 3}</span>}
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-amber-400" fill="currentColor" />
                        <span className="font-semibold text-sm text-gray-900">{t.rating}</span>
                        <span className="text-gray-400 text-xs">({t.total_reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <BookOpen size={12} /> {t.experience_years}y exp
                      </div>
                      <div className="flex items-center gap-0.5 text-emerald-600 font-bold text-sm">
                        <IndianRupee size={13} />{t.hourly_rate}/hr
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 5) {
                      if (page <= 3) p = i + 1;
                      else if (page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = page - 2 + i;
                    }
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page === p ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <ChevronRight size={18} />
                </button>
                <span className="text-sm text-gray-400 ml-2">of {totalPages} pages</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

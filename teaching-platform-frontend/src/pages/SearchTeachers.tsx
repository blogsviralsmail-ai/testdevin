import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherAPI, subjectAPI } from '../services/api';
import { Search, MapPin, Star, IndianRupee, BookOpen, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface Subject {
  id: number;
  name: string;
}

const CITIES = [
  'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner',
  'Bhilwara', 'Alwar', 'Sikar', 'Pali', 'Bharatpur', 'Sri Ganganagar',
  'Tonk', 'Kishangarh', 'Beawar', 'Hanumangarh', 'Chittorgarh',
  'Baran', 'Rajsamand', 'Mount Abu', 'Nagaur', 'Barmer', 'Jaisalmer', 'Pushkar'
];

const CLASS_LEVELS = ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'College', 'Professional', 'Competitive Exams'];

export default function SearchTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    subject: '', city: '', class_level: '',
    min_price: '', max_price: '', min_rating: '', language: ''
  });

  useEffect(() => {
    subjectAPI.list().then(setSubjects).catch(() => {});
    searchTeachers();
  }, []);

  useEffect(() => {
    searchTeachers();
  }, [page]);

  const searchTeachers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 12 };
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const data = await teacherAPI.search(params);
      setTeachers(data.teachers);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    searchTeachers();
  };

  const clearFilters = () => {
    setFilters({ subject: '', city: '', class_level: '', min_price: '', max_price: '', min_rating: '', language: '' });
    setPage(1);
    setTimeout(searchTeachers, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Find Your Perfect Teacher</h1>
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 md:w-64"
            >
              <option value="" className="text-gray-800">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.name} className="text-gray-800">{s.name}</option>)}
            </select>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 md:w-48"
            >
              <option value="" className="text-gray-800">All Cities</option>
              {CITIES.map(c => <option key={c} value={c} className="text-gray-800">{c}</option>)}
            </select>
            <button onClick={handleSearch} className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-medium hover:bg-indigo-50 transition flex items-center gap-2">
              <Search size={20} /> Search
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-medium hover:bg-white/20 transition flex items-center gap-2">
              <Filter size={20} /> Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white/10 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filters.class_level}
                onChange={(e) => setFilters({ ...filters, class_level: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              >
                <option value="" className="text-gray-800">Class Level</option>
                {CLASS_LEVELS.map(l => <option key={l} value={l} className="text-gray-800">{l}</option>)}
              </select>
              <input
                type="number"
                placeholder="Min Price (Rs)"
                value={filters.min_price}
                onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 text-sm"
              />
              <input
                type="number"
                placeholder="Max Price (Rs)"
                value={filters.max_price}
                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 text-sm"
              />
              <select
                value={filters.min_rating}
                onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              >
                <option value="" className="text-gray-800">Min Rating</option>
                <option value="4" className="text-gray-800">4+ Stars</option>
                <option value="4.5" className="text-gray-800">4.5+ Stars</option>
                <option value="3" className="text-gray-800">3+ Stars</option>
              </select>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              >
                <option value="" className="text-gray-800">Language</option>
                <option value="Hindi" className="text-gray-800">Hindi</option>
                <option value="English" className="text-gray-800">English</option>
                <option value="Rajasthani" className="text-gray-800">Rajasthani</option>
                <option value="Sanskrit" className="text-gray-800">Sanskrit</option>
              </select>
              <button onClick={clearFilters} className="px-3 py-2 bg-red-500/30 border border-red-400/30 rounded-lg text-sm flex items-center gap-1 hover:bg-red-500/50 transition">
                <X size={16} /> Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{total} Teachers Found</h2>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">Searching teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-600">No teachers found</h3>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map(t => (
                <Link
                  to={`/teacher-profile/${t.teacher_id}`}
                  key={t.teacher_id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {t.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition truncate">{t.full_name}</h3>
                        {t.is_verified && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">Verified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin size={14} /> {t.city}, {t.state}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">{t.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.subjects.slice(0, 3).map((s, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                        {s.name}
                      </span>
                    ))}
                    {t.subjects.length > 3 && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-lg">+{t.subjects.length - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={16} fill="currentColor" />
                      <span className="font-bold text-sm">{t.rating}</span>
                      <span className="text-gray-400 text-xs">({t.total_reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <BookOpen size={14} /> {t.experience_years}y exp
                    </div>
                    <div className="flex items-center gap-0.5 text-green-600 font-bold">
                      <IndianRupee size={14} />{t.hourly_rate}/hr
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

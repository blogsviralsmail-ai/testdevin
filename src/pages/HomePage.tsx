import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { Search, MapPin, Star, Zap, ChevronRight, Filter, Heart, Tag, Gift, Trophy, Clock, Shield, Users, ArrowRight } from 'lucide-react';

interface Ground {
  id: number; name: string; address: string; city: string;
  weekday_price: number; weekend_price: number; rating: number;
  rating_count: number; total_bookings: number; amenities: string;
  ground_type: string; sport_type: string; owner_name: string;
  is_featured?: boolean; slug?: string;
}

const groundImages: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=250&fit=crop',
  2: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=250&fit=crop',
  3: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400&h=250&fit=crop',
  4: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&h=250&fit=crop',
  5: 'https://images.unsplash.com/photo-1594470117722-de4b9a02ebed?w=400&h=250&fit=crop',
  6: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=400&h=250&fit=crop',
  7: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=250&fit=crop',
  8: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=250&fit=crop',
};
const sportImages: Record<string, string> = {
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=250&fit=crop',
  football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop',
  swimming: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=250&fit=crop',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=250&fit=crop',
  table_tennis: 'https://images.unsplash.com/photo-1611251135345-18c56206b863?w=400&h=250&fit=crop',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=250&fit=crop',
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=250&fit=crop',
  kabaddi: 'https://images.unsplash.com/photo-1461896836934-bd45ba48c710?w=400&h=250&fit=crop',
};
const typeImages: Record<string, string> = {
  turf: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=250&fit=crop',
  box: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=250&fit=crop',
  open: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400&h=250&fit=crop',
};

const sportCategories = [
  { id: 'cricket', label: 'Cricket', emoji: '\u{1F3CF}', color: 'from-green-500 to-emerald-600' },
  { id: 'football', label: 'Football', emoji: '\u26BD', color: 'from-blue-500 to-indigo-600' },
  { id: 'badminton', label: 'Badminton', emoji: '\u{1F3F8}', color: 'from-purple-500 to-violet-600' },
  { id: 'tennis', label: 'Tennis', emoji: '\u{1F3BE}', color: 'from-yellow-500 to-orange-500' },
  { id: 'swimming', label: 'Swimming', emoji: '\u{1F3CA}', color: 'from-cyan-500 to-blue-500' },
  { id: 'basketball', label: 'Basketball', emoji: '\u{1F3C0}', color: 'from-orange-500 to-red-500' },
  { id: 'volleyball', label: 'Volleyball', emoji: '\u{1F3D0}', color: 'from-pink-500 to-rose-500' },
  { id: 'table_tennis', label: 'Table Tennis', emoji: '\u{1F3D3}', color: 'from-teal-500 to-green-500' },
  { id: 'kabaddi', label: 'Kabaddi', emoji: '\u{1F93C}', color: 'from-red-500 to-pink-600' },
];

const sportLabels: Record<string, string> = {
  cricket: 'Cricket', football: 'Football', swimming: 'Swimming', tennis: 'Tennis',
  table_tennis: 'Table Tennis', badminton: 'Badminton', basketball: 'Basketball',
  volleyball: 'Volleyball', kabaddi: 'Kabaddi',
};

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showOffers, setShowOffers] = useState(false);
  const [offers, setOffers] = useState<Array<Record<string, unknown>>>([]);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('rating');
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  // Clear search when navigating back to homepage (e.g. clicking logo/Home)
  useEffect(() => {
    setSearch('');
    setFilter('all');
  }, [location.key]);

  useEffect(() => {
    setHeroVisible(true);
    // Load customize settings for social links
    (async () => { try { const res = await fetch((import.meta as unknown as Record<string,Record<string,string>>).env?.VITE_API_URL + '/api/settings/public'); const all = await res.json(); const cs: Record<string,string> = {}; for (const [k,v] of Object.entries(all)) { if (k.startsWith('customize_')) cs[k.replace('customize_','')] = String(v); } setSiteSettings(cs); } catch { /* ignore */ } })();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => { /* user denied location */ }
      );
    }
  }, []);

  useEffect(() => { loadGrounds(); }, [filter, sortBy, userLat]);

  const loadGrounds = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      // Sport type filters
      const sportTypes = ['cricket','football','swimming','tennis','table_tennis','badminton','basketball','volleyball','kabaddi'];
      if (filter !== 'all' && sportTypes.includes(filter)) {
        params.sport_type = filter;
      } else if (filter !== 'all') {
        params.ground_type = filter;
      }
      if (search) params.search = search;
      if (userLat && userLng) { params.lat = String(userLat); params.lng = String(userLng); }
      if (sortBy === 'nearest') params.sort = 'nearest';
      const data = await api.getGrounds(params);
      setGrounds(data);
    } catch { /* demo fallback */ }
    setLoading(false);
  };

  const loadOffers = async () => {
    try {
      const data = await api.getOffers();
      setOffers(data);
    } catch {
      setOffers([
        { code: 'WELCOME100', discount_type: 'flat', discount_value: 100, description: 'Rs.100 off on first booking' },
        { code: 'CRICKET20', discount_type: 'percentage', discount_value: 20, description: '20% off on all bookings' },
        { code: 'WEEKEND50', discount_type: 'flat', discount_value: 50, description: 'Rs.50 off on weekend bookings' },
      ]);
    }
    setShowOffers(true);
  };

  const amenityIcons: Record<string, string> = {
    'Floodlights': '\u{1F4A1}', 'Parking': '\u{1F17F}\uFE0F', 'Washroom': '\u{1F6BB}', 'Water': '\u{1F4A7}',
    'Changing Room': '\u{1F455}', 'Canteen': '\u{1F355}', 'WiFi': '\u{1F4F6}', 'CCTV': '\u{1F4F9}',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-10 right-20 text-5xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>{'\u{1F3CF}'}</div>
          <div className="absolute bottom-10 left-20 text-4xl opacity-15 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>{'\u26BD'}</div>
          <div className="absolute top-20 left-1/3 text-3xl opacity-10 animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}>{'\u{1F3BE}'}</div>
          <div className="absolute bottom-20 right-1/3 text-4xl opacity-15 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>{'\u{1F3C0}'}</div>
        </div>
        <div className={`page-container py-16 md:py-24 relative z-10 transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <Trophy size={16} className="text-yellow-400" />
              <span className="text-green-100 text-sm font-medium">{"India's #1 Sports Ground Booking Platform"}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
              Book Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">Dream Ground</span> Instantly
            </h1>
            <p className="text-green-100/80 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Cricket, Football, Badminton, Tennis & more. Book in seconds, pay online or cash. Get cashback on every booking!
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="search-3d flex items-center bg-white rounded-2xl px-5 py-4 shadow-2xl shadow-black/20 border border-white/50">
              <Search size={22} className="text-gray-400 mr-3 flex-shrink-0" />
              <input type="text" placeholder="Search by ground name, area, sport..." className="flex-1 outline-none text-base md:text-lg"
                value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadGrounds()} />
              <button onClick={loadGrounds} className="btn-3d bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/30 ml-2 flex-shrink-0">Search</button>
            </div>
          </div>
          {!search && (
          <div className="max-w-3xl mx-auto mt-8 grid grid-cols-3 gap-4">
            <div className="stat-3d bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-green-200 text-xs">Grounds Listed</p>
            </div>
            <div className="stat-3d bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/10" style={{transitionDelay:'0.1s'}}>
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="text-green-200 text-xs">Happy Players</p>
            </div>
            <div className="stat-3d bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/10" style={{transitionDelay:'0.2s'}}>
              <p className="text-2xl font-bold text-white">50+</p>
              <p className="text-green-200 text-xs">Cities Covered</p>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Sport Categories - hide when searching */}
      {!search && (
      <div className="page-container -mt-8 relative z-20">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {sportCategories.map((cat, i) => (
            <button key={cat.id} onClick={() => setFilter(filter === cat.id ? 'all' : cat.id)}
              className={`sport-cat-3d group relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-300 ${filter === cat.id ? `bg-gradient-to-br ${cat.color} text-white shadow-lg scale-105` : 'bg-white text-gray-700 shadow-md'}`}
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">{cat.emoji}</div>
              <p className={`text-xs font-semibold ${filter === cat.id ? 'text-white' : 'text-gray-600'}`}>{cat.label}</p>
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="page-container py-8">
        {/* Promo Banners - only show when NOT searching */}
        {!search && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="promo-3d group relative bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white flex items-center gap-4 cursor-pointer" onClick={() => grounds.length > 0 && navigate(`/ground/${grounds[0]?.id || 1}`)}>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Zap size={28} /></div>
            <div className="flex-1"><span className="font-bold text-lg">Rs.100 Cashback!</span><p className="text-sm opacity-90">On your first booking</p></div>
            <ArrowRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="promo-3d group relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white flex items-center gap-4 cursor-pointer" onClick={loadOffers}>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Tag size={28} /></div>
            <div className="flex-1"><span className="font-bold text-lg">View All Offers</span><p className="text-sm opacity-90">Promo codes & discounts</p></div>
            <ArrowRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="promo-3d group relative bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white flex items-center gap-4 cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Gift size={28} /></div>
            <div className="flex-1"><span className="font-bold text-lg">Refer & Earn Rs.50</span><p className="text-sm opacity-90">Share with friends</p></div>
            <ArrowRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
        )}

        {/* Offers Modal */}
        {showOffers && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowOffers(false)}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Tag size={20} className="text-green-600" /> Available Offers</h2>
              <div className="space-y-3">
                {offers.map((o, i) => (
                  <div key={i} className="border-2 rounded-2xl p-4 hover:border-green-400 hover:bg-green-50/50 transition-all cursor-pointer" onClick={() => { navigator.clipboard.writeText(String(o.code)); setShowOffers(false); }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">{String(o.code)}</span>
                      <span className="text-green-600 font-bold">{o.discount_type === 'percentage' ? `${o.discount_value}% OFF` : `Rs.${o.discount_value} OFF`}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{String(o.description || '')}</p>
                    <p className="text-xs text-gray-400 mt-1">Click to copy code</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowOffers(false)} className="w-full mt-4 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition">Close</button>
            </div>
          </div>
        )}

        {/* Filter & Sort */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{filter === 'all' ? 'All Sports' : sportLabels[filter] || filter}</span>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg hover:bg-red-100 transition">Clear</button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select className="text-sm border-2 rounded-xl px-4 py-2.5 bg-white font-medium focus:border-green-500 outline-none transition" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="rating">Sort: Rating</option>
              <option value="nearest">Sort: Nearest</option>
              <option value="price">Sort: Price</option>
            </select>
            <span className="text-sm text-gray-500 font-medium">{grounds.length} grounds</span>
          </div>
        </div>

        {/* Grounds Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Finding best grounds for you...</p>
          </div>
        ) : grounds.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">{'\u{1F3DF}\uFE0F'}</div>
            <p className="text-gray-400 text-lg">No grounds found</p>
            <button onClick={() => setFilter('all')} className="mt-3 text-green-600 font-medium hover:underline">Show all grounds</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {grounds.map((g, idx) => (
              <div key={g.id} onClick={() => navigate(`/ground/${g.slug || g.id}`)}
                className="card-3d bg-white rounded-2xl overflow-hidden cursor-pointer group"
                style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="h-48 relative overflow-hidden">
                  <img src={groundImages[g.id] || sportImages[g.sport_type] || typeImages[g.ground_type] || typeImages.box} alt={g.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-white/95 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-full font-semibold capitalize shadow-sm">{sportLabels[g.sport_type] || g.ground_type}</span>
                    {g.is_featured && <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm">Featured</span>}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 font-medium">
                      <Star size={11} fill="currentColor" className="text-yellow-400" /> {g.rating}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <span className="text-white font-bold text-2xl">Rs.{g.weekday_price}</span>
                      <span className="text-white/70 text-sm ml-1">/hr</span>
                    </div>
                    <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition shadow-lg" onClick={e => { e.stopPropagation(); const icon = e.currentTarget.querySelector('svg'); if (icon) { icon.classList.toggle('text-red-500'); icon.classList.toggle('text-gray-400'); icon.setAttribute('fill', icon.classList.contains('text-red-500') ? 'currentColor' : 'none'); } }}>
                      <Heart size={16} className="text-gray-400 transition" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-base mb-1.5 group-hover:text-green-700 transition">{g.name}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5 mb-1"><MapPin size={13} className="text-green-600 flex-shrink-0" /> {g.address}</p>
                                    {(g as unknown as Record<string, unknown>).distance_km != null && (
                                      <p className="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-1">
                                        <Clock size={11} /> {String((g as unknown as Record<string, unknown>).distance_km)} km away
                                      </p>
                                    )}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {g.amenities?.split(',').slice(0, 4).map(a => (
                      <span key={a} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg font-medium">{amenityIcons[a.trim()] || ''} {a.trim()}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users size={11} /> {g.total_bookings}+ booked</span>
                      <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500" /> {g.rating} ({g.rating_count})</span>
                    </div>
                    <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 group-hover:bg-green-600 group-hover:text-white transition">
                      Book <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Why Choose Us */}
        <div className="mt-16 mb-8 section-3d">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Why Choose <span className="text-green-600">BookAGround</span>?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-3d bg-white rounded-2xl p-6 text-center group" style={{animationDelay:'0s'}}>
              <div className="icon-3d w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition">
                <Clock size={24} className="text-green-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">Instant Booking</h3>
              <p className="text-xs text-gray-500">Book in seconds, play in minutes</p>
            </div>
            <div className="card-3d bg-white rounded-2xl p-6 text-center group" style={{animationDelay:'0.1s'}}>
              <div className="icon-3d w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 transition">
                <Shield size={24} className="text-blue-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">Secure Payments</h3>
              <p className="text-xs text-gray-500">100% safe online & cash options</p>
            </div>
            <div className="card-3d bg-white rounded-2xl p-6 text-center group" style={{animationDelay:'0.2s'}}>
              <div className="icon-3d w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-500 transition">
                <Zap size={24} className="text-yellow-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">Cashback Rewards</h3>
              <p className="text-xs text-gray-500">Earn on every booking</p>
            </div>
            <div className="card-3d bg-white rounded-2xl p-6 text-center group" style={{animationDelay:'0.3s'}}>
              <div className="icon-3d w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600 transition">
                <Trophy size={24} className="text-purple-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">Verified Grounds</h3>
              <p className="text-xs text-gray-500">Quality checked venues only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12" style={{perspective:'1000px'}}>
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand + Social */}
            <div>
              <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2"><span className="float-3d inline-block" style={{animationDuration:'5s'}}>&#127951;</span> {siteSettings.site_name || 'BookAGround'}</h3>
              <p className="text-sm mb-5">{siteSettings.site_tagline || "India's Most Trusted Sports Ground Booking Platform"}</p>
              {/* Floating Social Media Icons */}
              <div className="flex gap-3">
                <a href={siteSettings.social_facebook || '#'} target="_blank" rel="noopener noreferrer" className="social-3d float-3d w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition" style={{animationDuration:'4s',animationDelay:'0s'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
                <a href={siteSettings.social_instagram || '#'} target="_blank" rel="noopener noreferrer" className="social-3d float-3d w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white hover:opacity-90 transition" style={{animationDuration:'5s',animationDelay:'0.3s'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
                <a href={siteSettings.social_twitter || '#'} target="_blank" rel="noopener noreferrer" className="social-3d float-3d w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition border border-gray-700" style={{animationDuration:'4.5s',animationDelay:'0.6s'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href={siteSettings.social_youtube || '#'} target="_blank" rel="noopener noreferrer" className="social-3d float-3d w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition" style={{animationDuration:'5.5s',animationDelay:'0.9s'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
                <a href={`https://wa.me/${siteSettings.whatsapp_button_number || '919782005500'}?text=${encodeURIComponent(siteSettings.whatsapp_button_message || 'Hi! I want to book a sports ground on BookAGround.')}`} target="_blank" rel="noopener noreferrer" className="social-3d float-3d w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-400 transition" style={{animationDuration:'4.8s',animationDelay:'1.2s'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
              </div>
            </div>
            {/* Quick Menu - All Pages */}
            <div>
              <h4 className="text-white font-medium mb-3">Quick Links</h4>
              <div className="flex flex-col gap-2 text-sm">
                <a href="/" className="footer-btn-3d px-3 py-2 rounded-lg transition inline-flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg> Home</a>
                <a href="/about" className="footer-btn-3d px-3 py-2 rounded-lg transition inline-flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> About Us</a>
                <a href="/contact" className="footer-btn-3d px-3 py-2 rounded-lg transition inline-flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> Contact Us</a>
                <a href="/privacy-policy" className="footer-btn-3d px-3 py-2 rounded-lg transition inline-flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Privacy Policy</a>
                <a href="/refund-policy" className="footer-btn-3d px-3 py-2 rounded-lg transition inline-flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> Refund Policy</a>
                <a href="/terms" className="footer-btn-3d px-3 py-2 rounded-lg transition inline-flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Terms &amp; Conditions</a>
              </div>
            </div>
            {/* Sports */}
            <div>
              <h4 className="text-white font-medium mb-3">Sports</h4>
              <div className="flex flex-col gap-2 text-sm">
                <span className="footer-btn-3d px-3 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2" onClick={() => setFilter('cricket')}>&#127951; Cricket</span>
                <span className="footer-btn-3d px-3 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2" onClick={() => setFilter('football')}>&#9917; Football</span>
                <span className="footer-btn-3d px-3 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2" onClick={() => setFilter('badminton')}>&#127944; Badminton</span>
                <span className="footer-btn-3d px-3 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2" onClick={() => setFilter('tennis')}>&#127934; Tennis</span>
                <span className="footer-btn-3d px-3 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2" onClick={() => setFilter('swimming')}>&#127946; Swimming</span>
                <span className="footer-btn-3d px-3 py-2 rounded-lg cursor-pointer inline-flex items-center gap-2" onClick={() => setFilter('basketball')}>&#127936; Basketball</span>
              </div>
            </div>
            {/* Contact */}
            <div>
              <h4 className="text-white font-medium mb-3">Contact Us</h4>
              <div className="flex flex-col gap-2 text-sm">
                {siteSettings.contact_email && <p className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> {siteSettings.contact_email}</p>}
                {siteSettings.contact_phone && <p className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> {siteSettings.contact_phone}</p>}
                <a href="/owner" className="footer-btn-3d inline-flex items-center gap-2 px-4 py-2 rounded-lg text-green-400 mt-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> List Your Ground</a>
                <a href="/login" className="footer-btn-3d inline-flex items-center gap-2 px-4 py-2 rounded-lg text-blue-400 mt-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg> Login / Sign Up</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-xs text-gray-500">{siteSettings.footer_text || '\u00A9 2026 BookAGround. All rights reserved.'}</p>
            <p className="text-xs text-gray-600 mt-1">A product of KKHS Media Private Limited | 190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
            <p className="text-xs text-gray-600">GSTIN: 08AAICK3853C1ZL | Phone: +91 9782005500</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${siteSettings.whatsapp_button_number || '919782005500'}?text=${encodeURIComponent(siteSettings.whatsapp_button_message || 'Hi! I want to book a sports ground on BookAGround. Please help me.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 float-3d"
        style={{animationDuration:'3s'}}
      >
        <div className="relative">
          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 transition-all hover:scale-110" style={{boxShadow:'0 4px 15px rgba(37,211,102,0.5)'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></span>
        </div>
      </a>
    </div>
  );
}

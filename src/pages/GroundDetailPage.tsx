import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Star, MapPin, Clock, Phone, Navigation, ChevronRight, ArrowLeft, Heart, Share2, ChevronLeft } from 'lucide-react';

interface Ground {
  id: number; name: string; address: string; city: string; latitude: number; longitude: number;
  weekday_price: number; weekend_price: number; evening_extra: number; rating: number;
  rating_count: number; total_bookings: number; amenities: string; ground_type: string;
  sport_type: string; description: string; owner_name: string; owner_phone: string | null;
  opening_time: string; closing_time: string;
  reviews: Array<{ id: number; rating: number; review_text: string; reviewer_name: string; created_at: string }>;
}

const groundPhotos: Record<number, string[]> = {
  1: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=400&fit=crop','https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop','https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&h=400&fit=crop'],
  2: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop','https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=400&fit=crop','https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&h=400&fit=crop'],
  3: ['https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&h=400&fit=crop','https://images.unsplash.com/photo-1594470117722-de4b9a02ebed?w=800&h=400&fit=crop','https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800&h=400&fit=crop'],
};
const defaultPhotos = ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=400&fit=crop','https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop','https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&h=400&fit=crop'];

const demoLocations: Record<number, {lat:number,lng:number}> = {
  1:{lat:26.9124,lng:75.7873},2:{lat:26.8498,lng:75.8070},3:{lat:26.8947,lng:75.8283},
  4:{lat:26.9196,lng:75.7280},5:{lat:26.8780,lng:75.7592},6:{lat:26.9055,lng:75.8483},
  7:{lat:26.8635,lng:75.7840},8:{lat:26.8890,lng:75.7500},
};

export default function GroundDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ground, setGround] = useState<Ground | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [equipment, setEquipment] = useState<Array<Record<string, unknown>>>([]);
  const [showEquipmentBuy, setShowEquipmentBuy] = useState<Record<string, unknown> | null>(null);
  const [equipHours, setEquipHours] = useState(1);

  // Generate slug from name and city (must match backend logic)
  const generateSlug = (name: string, city: string) => {
    return `${name} ${city}`.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  useEffect(() => {
    if (id) {
      const isNumeric = /^\d+$/.test(id);
      if (isNumeric) {
        // Old numeric URL - fetch ground and redirect to slug URL
        api.getGround(parseInt(id)).then((g: Ground) => {
          setGround(g);
          const slug = (g as Ground & { slug?: string }).slug || generateSlug(g.name, g.city);
          if (slug) {
            navigate(`/ground/${slug}`, { replace: true });
          }
        }).catch(() => navigate('/')).finally(() => setLoading(false));
        api.getGroundEquipment(parseInt(id)).then(setEquipment).catch(() => setEquipment([]));
      } else {
        // Slug-based URL - try backend slug endpoint first, fallback to client-side resolution
        api.getGroundBySlug(id).then((g: Ground) => {
          setGround(g);
          api.getGroundEquipment(g.id).then(setEquipment).catch(() => setEquipment([]));
        }).catch(() => {
          // Fallback: fetch all grounds and match slug client-side
          api.getGrounds().then((grounds: Ground[]) => {
            const match = grounds.find((g: Ground) => {
              const slug = (g as Ground & { slug?: string }).slug || generateSlug(g.name, g.city);
              return slug === id;
            });
            if (match) {
              api.getGround(match.id).then((g: Ground) => {
                setGround(g);
                api.getGroundEquipment(g.id).then(setEquipment).catch(() => setEquipment([]));
              }).catch(() => navigate('/'));
            } else {
              navigate('/');
            }
          }).catch(() => navigate('/'));
        }).finally(() => setLoading(false));
      }
    }
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!ground) return null;

  const photos = groundPhotos[ground.id] || defaultPhotos;
  const loc = demoLocations[ground.id] || {lat: ground.latitude || 26.9124, lng: ground.longitude || 75.7873};

  const amenityIcons: Record<string, string> = {
    'Floodlights': '\u{1F4A1}', 'Parking': '\u{1F17F}\uFE0F', 'Washroom': '\u{1F6BB}', 'Water': '\u{1F4A7}',
    'Changing Room': '\u{1F455}', 'Canteen': '\u{1F355}', 'WiFi': '\u{1F4F6}', 'CCTV': '\u{1F4F9}',
    'Coaching': '\u{1F3CF}', 'First Aid': '\u{1F3E5}', 'Scoreboard': '\u{1F4CA}', 'Equipment': '\u{1F3CF}',
    'Nets': '\u{1F945}', 'Multiple Pitches': '\u{1F3DF}\uFE0F', 'Garden': '\u{1F33F}',
  };

  const openMap = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank');
  const shareGround = () => {
    const text = `Check out ${ground.name} on BookAGround! Book now at ${window.location.href}`;
    if (navigator.share) navigator.share({ title: ground.name, text, url: window.location.href });
    else { navigator.clipboard.writeText(text); alert('Link copied!'); }
  };
  const toggleFav = async () => {
    try { await api.toggleFavourite(ground.id); setIsFav(!isFav); } catch { setIsFav(!isFav); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate('/')} className="hover:text-green-600 flex items-center gap-1"><ArrowLeft size={14} /> Home</button>
          <span>/</span><span className="text-gray-800">{ground.name}</span>
        </div>
      </div>

      <div className="page-container pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Photo Gallery */}
            <div className="h-64 md:h-80 rounded-xl overflow-hidden relative mb-6 group">
              <img src={photos[photoIdx]} alt={ground.name} className="w-full h-full object-cover transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(p => p > 0 ? p-1 : photos.length-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><ChevronLeft size={20}/></button>
                  <button onClick={() => setPhotoIdx(p => p < photos.length-1 ? p+1 : 0)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><ChevronRight size={20}/></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => <span key={i} className={`w-2 h-2 rounded-full ${i === photoIdx ? 'bg-white' : 'bg-white/50'}`}/>)}
                  </div>
                </>
              )}
              <span className="absolute top-4 left-4 bg-white/90 text-gray-700 text-sm px-3 py-1 rounded-full font-medium capitalize">{ground.sport_type ? ground.sport_type.replace('_',' ') : ground.ground_type}</span>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={toggleFav} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${isFav ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:text-red-500'}`}>
                  <Heart size={16} fill={isFav ? 'white' : 'none'} />
                </button>
                <button onClick={shareGround} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:text-green-600 transition">
                  <Share2 size={16} />
                </button>
              </div>
              <span className="absolute bottom-3 right-3 bg-yellow-500 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Star size={13} fill="white" /> {ground.rating} ({ground.rating_count} reviews)
              </span>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{ground.name}</h1>
              <p className="text-gray-500 flex items-center gap-1 mb-3"><MapPin size={16} /> {ground.address}, {ground.city}</p>
              <p className="text-gray-600 mb-4">{ground.description}</p>
              <div className="flex items-center gap-3">
                <button onClick={openMap} className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition">
                  <Navigation size={16} /> Get Directions
                </button>
                {ground.owner_phone ? (
                  <a href={`tel:${ground.owner_phone}`} className="flex-1 bg-green-50 text-green-600 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-100 transition">
                    <Phone size={16} /> Call Owner
                  </a>
                ) : (
                  <div className="flex-1 bg-gray-50 text-gray-400 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 cursor-not-allowed" title="Book this ground to get owner contact details">
                    <Phone size={16} /> Book to get number
                  </div>
                )}
                <button onClick={shareGround} className="flex-1 bg-purple-50 text-purple-600 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-purple-100 transition">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Amenities</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {ground.amenities?.split(',').map(a => (
                  <div key={a} className="bg-gray-50 text-center py-3 px-2 rounded-lg border">
                    <div className="text-xl mb-1">{amenityIcons[a.trim()] || '\u2713'}</div>
                    <div className="text-xs text-gray-600">{a.trim()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment for Rent */}
            {equipment.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4">Equipment for Rent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equipment.map(eq => (
                    <div key={eq.id as number} className="border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition">
                      <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-2xl">{'\u{1F3CF}'}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{eq.name as string}</h4>
                        <p className="text-sm text-gray-500">Rs.{eq.price_per_hour as number}/hr | Qty: {eq.quantity as number} available</p>
                      </div>
                      <button onClick={() => { if (!localStorage.getItem('token')) { localStorage.setItem('redirectAfterLogin', window.location.pathname); navigate('/login'); return; } setShowEquipmentBuy(eq); setEquipHours(1); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Rent Now</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Rent Modal */}
            {showEquipmentBuy && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEquipmentBuy(null)}>
                <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Rent Equipment</h3>
                  <div className="bg-green-50 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-gray-800">{showEquipmentBuy.name as string}</h4>
                    <p className="text-sm text-gray-600">Rs.{showEquipmentBuy.price_per_hour as number}/hr</p>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-600">Hours</label>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={() => setEquipHours(h => Math.max(1, h-1))} className="w-10 h-10 border-2 rounded-lg font-bold text-lg">-</button>
                      <span className="text-xl font-bold w-12 text-center">{equipHours}</span>
                      <button onClick={() => setEquipHours(h => h+1)} className="w-10 h-10 border-2 rounded-lg font-bold text-lg">+</button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-xl font-bold text-green-600">Rs.{(showEquipmentBuy.price_per_hour as number) * equipHours}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowEquipmentBuy(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                    <button onClick={async () => { try { alert(`Equipment "${showEquipmentBuy.name}" rented for ${equipHours} hour(s)! Total: Rs.${(showEquipmentBuy.price_per_hour as number) * equipHours}. Payment will be collected at the ground.`); setShowEquipmentBuy(null); } catch { alert('Failed'); } }} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700">Pay & Rent</button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {ground.reviews && ground.reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4">Reviews ({ground.rating_count})</h3>
                <div className="space-y-4">
                  {ground.reviews.slice(0, 5).map(r => (
                    <div key={r.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-sm font-bold">{r.reviewer_name[0]}</div>
                        <div>
                          <p className="font-medium">{r.reviewer_name}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className={i < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-2 ml-12">{r.review_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                <h3 className="font-bold text-gray-800 text-lg mb-4">Pricing</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Weekday (Mon-Fri)</span>
                    <span className="font-bold text-green-600 text-lg">Rs.{ground.weekday_price}/hr</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Weekend (Sat-Sun)</span>
                    <span className="font-bold text-green-600 text-lg">Rs.{ground.weekend_price}/hr</span>
                  </div>
                  {ground.evening_extra > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Evening Extra (5 PM+)</span>
                      <span className="font-bold text-orange-500">+Rs.{ground.evening_extra}/hr</span>
                    </div>
                  )}
                </div>
                <div className="bg-green-50 rounded-lg p-3 mt-3 text-sm text-green-700 font-medium text-center">
                  Token Amount: 30% of total booking
                </div>
                <div className="flex items-center gap-1 mt-3 text-sm text-gray-400">
                  <Clock size={14} /> Open: {ground.opening_time} - {ground.closing_time}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-sm">Starting from</span>
                  <span className="text-2xl font-bold text-green-600">Rs.{ground.weekday_price}<span className="text-sm font-normal text-gray-400">/hr</span></span>
                </div>
                <div className="text-sm text-gray-500 mb-4 flex items-center justify-between">
                  <span>{ground.total_bookings}+ bookings</span>
                  <span>Owner: {ground.owner_name}{ground.owner_phone ? ` (${ground.owner_phone})` : ''}</span>
                </div>
                <button
                  onClick={() => {
                    if (!localStorage.getItem('token')) { { localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search); navigate('/login'); }; return; }
                    navigate(`/book/${ground.id}`);
                  }}
                  className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition"
                >
                  Book Now <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

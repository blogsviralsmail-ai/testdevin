import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Heart, MapPin, Star, IndianRupee, Trash2 } from 'lucide-react';

interface FavGround {
  id: number; ground_id: number; ground_name: string; ground_address: string;
  ground_city: string; weekday_price: number; weekend_price: number;
  rating: number; ground_type: string; sport_type: string;
}

export default function FavouritesPage() {
  const navigate = useNavigate();
  const [favs, setFavs] = useState<FavGround[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    loadFavs();
  }, []);

  const loadFavs = async () => {
    setLoading(true);
    try { const data = await api.getMyFavourites(); setFavs(data); }
    catch { setFavs([]); }
    setLoading(false);
  };

  const removeFav = async (groundId: number) => {
    try { await api.toggleFavourite(groundId); loadFavs(); }
    catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart size={28} className="text-red-500 fill-red-500" />
          <h1 className="text-2xl font-bold text-gray-800">My Favourites</h1>
          <span className="text-sm text-gray-500">({favs.length} grounds)</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading favourites...</div>
        ) : favs.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No favourite grounds yet</p>
            <button onClick={() => navigate('/')} className="mt-3 text-green-600 font-medium hover:underline">Browse Grounds</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favs.map(f => (
              <div key={f.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
                <div className="h-36 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-5xl">{f.sport_type === 'football' ? '\u26BD' : f.sport_type === 'badminton' ? '\uD83C\uDFF8' : '\uD83C\uDFCF'}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-lg">{f.ground_name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={13} /> {f.ground_address}, {f.ground_city}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {f.rating > 0 && <span className="flex items-center gap-1 text-sm text-yellow-600"><Star size={14} fill="currentColor" /> {f.rating}</span>}
                    <span className="text-sm text-gray-500 capitalize">{f.ground_type} | {f.sport_type}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-green-600 font-bold">
                    <IndianRupee size={14} /> {f.weekday_price} - {f.weekend_price}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => navigate('/book/' + f.ground_id)} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700">Book Now</button>
                    <button onClick={() => removeFav(f.ground_id)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

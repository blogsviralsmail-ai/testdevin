import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { GitCompare, MapPin, Star, IndianRupee, Plus, X, Check } from 'lucide-react';

interface Ground {
  id: number; name: string; address: string; city: string;
  weekday_price: number; weekend_price: number; rating: number;
  rating_count: number; amenities: string; ground_type: string;
  sport_type: string; opening_time: string; closing_time: string;
}

export default function ComparisonPage() {
  const navigate = useNavigate();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [selected, setSelected] = useState<Ground[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    api.getGrounds({}).then(setGrounds).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addGround = (g: Ground) => {
    if (selected.length < 4 && !selected.find(s => s.id === g.id)) {
      setSelected([...selected, g]);
    }
    setShowPicker(false);
  };

  const removeGround = (id: number) => setSelected(selected.filter(s => s.id !== id));

  const compareFields = [
    { label: 'City', key: 'city' },
    { label: 'Type', key: 'ground_type' },
    { label: 'Sport', key: 'sport_type' },
    { label: 'Weekday Price', key: 'weekday_price', prefix: 'Rs.' },
    { label: 'Weekend Price', key: 'weekend_price', prefix: 'Rs.' },
    { label: 'Rating', key: 'rating' },
    { label: 'Reviews', key: 'rating_count' },
    { label: 'Hours', key: 'opening_time', suffix: 'closing_time' },
    { label: 'Amenities', key: 'amenities' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <GitCompare size={28} className="text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Compare Grounds</h1>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          {selected.map(g => (
            <div key={g.id} className="bg-white rounded-xl shadow-sm p-4 w-48 relative">
              <button onClick={() => removeGround(g.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={16} /></button>
              <p className="font-bold text-gray-800 text-sm truncate">{g.name}</p>
              <p className="text-xs text-gray-500 truncate">{g.city}</p>
            </div>
          ))}
          {selected.length < 4 && (
            <button onClick={() => setShowPicker(true)} className="w-48 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:border-green-400 hover:text-green-500 transition">
              <Plus size={20} /> Add Ground
            </button>
          )}
        </div>

        {selected.length >= 2 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-600 w-32">Feature</th>
                  {selected.map(g => (
                    <th key={g.id} className="p-3 text-center font-bold text-gray-800">{g.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareFields.map(f => (
                  <tr key={f.key} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-600">{f.label}</td>
                    {selected.map(g => {
                      const val = g[f.key as keyof Ground];
                      let display = String(val || '-');
                      if (f.prefix) display = f.prefix + val;
                      if (f.suffix && f.key === 'opening_time') display = `${g.opening_time} - ${g.closing_time}`;
                      if (f.key === 'amenities') {
                        return (
                          <td key={g.id} className="p-3 text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {String(val || '').split(',').filter(Boolean).map(a => (
                                <span key={a} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check size={10} /> {a.trim()}
                                </span>
                              ))}
                            </div>
                          </td>
                        );
                      }
                      if (f.key === 'rating') {
                        return (
                          <td key={g.id} className="p-3 text-center">
                            <span className="flex items-center justify-center gap-1 text-yellow-600"><Star size={14} fill="currentColor" /> {val || '0'}</span>
                          </td>
                        );
                      }
                      return <td key={g.id} className="p-3 text-center">{display}</td>;
                    })}
                  </tr>
                ))}
                <tr className="border-t bg-green-50">
                  <td className="p-3 font-bold text-green-700">Book</td>
                  {selected.map(g => (
                    <td key={g.id} className="p-3 text-center">
                      <button onClick={() => navigate('/book/' + g.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Book Now</button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selected.length < 2 && (
          <div className="text-center py-12 text-gray-400">
            <GitCompare size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-lg">Select at least 2 grounds to compare</p>
          </div>
        )}

        {showPicker && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[70vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-gray-800 text-lg mb-4">Select a Ground</h3>
              {loading ? <p className="text-gray-400">Loading...</p> : (
                <div className="space-y-2">
                  {grounds.filter(g => !selected.find(s => s.id === g.id)).map(g => (
                    <button key={g.id} onClick={() => addGround(g)}
                      className="w-full text-left p-3 rounded-lg border hover:border-green-400 hover:bg-green-50 transition flex items-center gap-3">
                      <MapPin size={16} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{g.name}</p>
                        <p className="text-xs text-gray-500">{g.city} | {g.sport_type} | Rs.{g.weekday_price}</p>
                      </div>
                      <IndianRupee size={14} className="text-green-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Clock, Calendar, Trash2, Bell } from 'lucide-react';

interface WaitlistEntry {
  id: number; ground_id: number; ground_name: string; date: string;
  preferred_time: string; status: string; position: number; created_at: string;
  notified: boolean;
}

export default function WaitlistPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    loadWaitlist();
  }, []);

  const loadWaitlist = async () => {
    setLoading(true);
    try { const data = await api.getMyWaitlist(); setEntries(data); }
    catch { setEntries([]); }
    setLoading(false);
  };

  const handleLeave = async (id: number) => {
    if (!confirm('Leave this waitlist?')) return;
    try { await api.leaveWaitlist(id); loadWaitlist(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const statusColors: Record<string, string> = {
    waiting: 'bg-yellow-100 text-yellow-700',
    notified: 'bg-blue-100 text-blue-700',
    booked: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Clock size={28} className="text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-800">My Waitlist</h1>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Bell size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 font-medium">How Waitlist Works</p>
            <p className="text-xs text-blue-600 mt-1">When a booked slot gets cancelled, you will be notified automatically. You can then book the slot before others. Position #1 gets notified first.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <Clock size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No waitlist entries</p>
            <p className="text-sm text-gray-400 mt-1">When slots are full, you can join the waitlist from the booking page</p>
            <button onClick={() => navigate('/')} className="mt-3 text-green-600 font-medium hover:underline">Browse Grounds</button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(e => (
              <div key={e.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800">{e.ground_name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[e.status] || 'bg-gray-100'}`}>{e.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {e.date}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {e.preferred_time}</span>
                      <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs font-medium">Position #{e.position}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Joined: {(e.created_at || '').split('T')[0]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.status === 'notified' && (
                      <button onClick={() => navigate('/book/' + e.ground_id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Book Now</button>
                    )}
                    {e.status === 'waiting' && (
                      <button onClick={() => handleLeave(e.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></button>
                    )}
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

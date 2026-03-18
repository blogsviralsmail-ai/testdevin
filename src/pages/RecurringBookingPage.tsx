import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { RotateCcw, Clock, Trash2, Plus, CreditCard, Wallet, Banknote, IndianRupee, CalendarDays } from 'lucide-react';

interface RecurringBooking {
  id: number; ground_id: number; ground_name: string; day_of_week: string;
  start_time: string; end_time: string; frequency: string; status: string;
  created_at: string; next_booking: string;
}

interface Ground { id: number; name: string; city: string; sport_type: string; }

export default function RecurringBookingPage() {
  const navigate = useNavigate();
  const [recurring, setRecurring] = useState<RecurringBooking[]>([]);
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ground_id: 0, day_of_week: 'Monday', start_time: '18:00', end_time: '19:00', frequency: 'weekly' });
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash' | 'online'>('wallet');

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try { const data = await api.getMyRecurringBookings(); setRecurring(data); } catch { setRecurring([]); }
    try { const data = await api.getGrounds({}); setGrounds(data); } catch { /* */ }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.ground_id) { alert('Select a ground'); return; }
    try {
      await api.createRecurringBooking({ ...form, payment_mode: paymentMethod });
      alert('Recurring booking created! Payment will be charged ' + form.frequency + ' via ' + paymentMethod + '.');
      setShowForm(false);
      setForm({ ground_id: 0, day_of_week: 'Monday', start_time: '18:00', end_time: '19:00', frequency: 'weekly' });
      loadData();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const getEstimatedPrice = () => {
    const g = grounds.find(g => g.id === form.ground_id);
    if (!g) return 0;
    const isWeekend = form.day_of_week === 'Saturday' || form.day_of_week === 'Sunday';
    return isWeekend ? 1000 : 800;
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this recurring booking?')) return;
    try { await api.cancelRecurringBooking(id); loadData(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const dayColors: Record<string, string> = {
    Monday: 'bg-blue-100 text-blue-700', Tuesday: 'bg-green-100 text-green-700',
    Wednesday: 'bg-purple-100 text-purple-700', Thursday: 'bg-orange-100 text-orange-700',
    Friday: 'bg-red-100 text-red-700', Saturday: 'bg-yellow-100 text-yellow-700',
    Sunday: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RotateCcw size={28} className="text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Recurring Bookings</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
            <Plus size={16} /> New Recurring
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : recurring.length === 0 ? (
          <div className="text-center py-20">
            <RotateCcw size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No recurring bookings yet</p>
            <p className="text-sm text-gray-400 mt-1">Set up automatic weekly/monthly bookings for your regular game sessions</p>
            <button onClick={() => setShowForm(true)} className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">Create Your First Recurring Booking</button>
          </div>
        ) : (
          <div className="space-y-4">
            {recurring.map(r => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800">{r.ground_name}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${dayColors[r.day_of_week] || 'bg-gray-100'}`}>{r.day_of_week}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {r.start_time} - {r.end_time}</span>
                      <span className="capitalize text-indigo-600 font-medium">{r.frequency}</span>
                      <span className="flex items-center gap-1 text-green-600 font-bold"><IndianRupee size={14} /> Auto-deducted</span>
                    </div>
                    {r.next_booking && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><CalendarDays size={12} /> Next booking: {r.next_booking}</p>}
                  </div>
                  {r.status === 'active' && (
                    <button onClick={() => handleCancel(r.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Create Recurring Booking</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Ground</label>
                  <select className="w-full border rounded-lg px-3 py-2 mt-1" value={form.ground_id} onChange={e => setForm({...form, ground_id: parseInt(e.target.value)})}>
                    <option value={0}>Select Ground</option>
                    {grounds.map(g => <option key={g.id} value={g.id}>{g.name} - {g.city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Day of Week</label>
                  <select className="w-full border rounded-lg px-3 py-2 mt-1" value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})}>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Start Time</label>
                    <input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">End Time</label>
                    <input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Frequency</label>
                  <select className="w-full border rounded-lg px-3 py-2 mt-1" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button onClick={() => setPaymentMethod('wallet')}
                      className={`p-2.5 rounded-lg border-2 text-xs font-medium flex flex-col items-center gap-1 ${paymentMethod === 'wallet' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200'}`}>
                      <Wallet size={16} /> Wallet
                    </button>
                    <button onClick={() => setPaymentMethod('cash')}
                      className={`p-2.5 rounded-lg border-2 text-xs font-medium flex flex-col items-center gap-1 ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200'}`}>
                      <Banknote size={16} /> Cash
                    </button>
                    <button onClick={() => setPaymentMethod('online')}
                      className={`p-2.5 rounded-lg border-2 text-xs font-medium flex flex-col items-center gap-1 ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>
                      <CreditCard size={16} /> Online
                    </button>
                  </div>
                </div>
                {form.ground_id > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-indigo-800">Estimated per slot: Rs.{getEstimatedPrice()}</p>
                    <p className="text-xs text-indigo-600 mt-0.5">Payment will be auto-charged {form.frequency} via {paymentMethod}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowForm(false)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                <button onClick={handleCreate} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700">Create Recurring Booking</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

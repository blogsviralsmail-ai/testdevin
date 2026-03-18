import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Crown, Check, Star, Calendar, Zap, Wallet, CreditCard, Banknote } from 'lucide-react';

interface Plan {
  id: number; name: string; price: number; duration_days: number; benefits: string;
  discount_percent: number; priority_booking: boolean; free_cancellations: number;
  max_bookings: number; status: string;
}

interface MyMembership {
  id: number; plan_name: string; status: string; start_date: string; end_date: string;
  bookings_used: number; max_bookings: number;
}

export default function MembershipPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [myMemberships, setMyMemberships] = useState<MyMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribingPlan, setSubscribingPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash' | 'online'>('wallet');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const data = await api.getMemberships(); setPlans(data); } catch { setPlans([]); }
    if (localStorage.getItem('token')) {
      try { const data = await api.getMyMemberships(); setMyMemberships(data); } catch { /* */ }
    }
    setLoading(false);
  };

  const handleSubscribe = async (planId: number) => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    try {
      await api.subscribeMembership(planId);
      alert('Membership activated! Payment via ' + paymentMethod + '. Enjoy your benefits.');
      setSubscribingPlan(null);
      loadData();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const tierColors = ['from-gray-400 to-gray-600', 'from-blue-500 to-indigo-600', 'from-yellow-400 to-orange-500', 'from-purple-500 to-pink-600'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown size={28} className="text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-800">Membership Plans</h1>
        </div>
        <p className="text-gray-500 mb-8">Get exclusive benefits, discounts, and priority bookings with our membership plans</p>

        {/* Active Memberships */}
        {myMemberships.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 text-lg mb-3">Your Active Memberships</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myMemberships.map(m => (
                <div key={m.id} className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2"><Crown size={20} /> <span className="font-bold text-lg">{m.plan_name}</span></div>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <span><Calendar size={14} className="inline mr-1" /> {m.start_date} - {m.end_date}</span>
                    <span>{m.bookings_used}/{m.max_bookings} bookings used</span>
                  </div>
                  <span className={`mt-2 inline-block text-xs px-2 py-1 rounded-full ${m.status === 'active' ? 'bg-white/20' : 'bg-white/10'}`}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <Crown size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No membership plans available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden">
                <div className={`bg-gradient-to-r ${tierColors[i % tierColors.length]} p-6 text-white text-center`}>
                  <Crown size={32} className="mx-auto mb-2" />
                  <h3 className="font-bold text-xl">{p.name}</h3>
                  <p className="text-3xl font-extrabold mt-2">Rs.{p.price}<span className="text-sm font-normal opacity-80">/{p.duration_days} days</span></p>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500" /> <span>{p.discount_percent}% discount on all bookings</span></div>
                    {p.priority_booking && <div className="flex items-center gap-2 text-sm"><Zap size={16} className="text-yellow-500" /> <span>Priority slot booking</span></div>}
                    <div className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500" /> <span>{p.free_cancellations} free cancellations</span></div>
                    <div className="flex items-center gap-2 text-sm"><Check size={16} className="text-green-500" /> <span>Up to {p.max_bookings} bookings</span></div>
                    {p.benefits && p.benefits.split(',').map(b => (
                      <div key={b} className="flex items-center gap-2 text-sm"><Star size={16} className="text-blue-500" /> <span>{b.trim()}</span></div>
                    ))}
                  </div>
                  <button onClick={() => { if (!localStorage.getItem('token')) { navigate('/login'); return; } setSubscribingPlan(p); }}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2"><CreditCard size={18} /> Subscribe Now - Rs.{p.price}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribe Payment Modal */}
      {subscribingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSubscribingPlan(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><Crown size={20} className="text-yellow-500" /> Subscribe to {subscribingPlan.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Choose how you want to pay for your membership</p>
            <div className="bg-green-50 rounded-xl p-4 mb-4 text-center">
              <p className="text-3xl font-extrabold text-green-700">Rs.{subscribingPlan.price}</p>
              <p className="text-sm text-green-600">for {subscribingPlan.duration_days} days</p>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => setPaymentMethod('wallet')}
                className={`p-3 rounded-lg border-2 text-sm font-medium flex flex-col items-center gap-1 transition ${paymentMethod === 'wallet' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                <Wallet size={18} /> Wallet
              </button>
              <button onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 text-sm font-medium flex flex-col items-center gap-1 transition ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                <Banknote size={18} /> Cash
              </button>
              <button onClick={() => setPaymentMethod('online')}
                className={`p-3 rounded-lg border-2 text-sm font-medium flex flex-col items-center gap-1 transition ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                <CreditCard size={18} /> Online
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSubscribingPlan(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
              <button onClick={() => handleSubscribe(subscribingPlan.id)} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700">Pay & Subscribe</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

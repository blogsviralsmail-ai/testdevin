import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Users, MapPin, Calendar, Clock, Plus, Minus, CreditCard, Wallet, Banknote } from 'lucide-react';

interface Ground { id: number; name: string; address: string; city: string; weekday_price: number; weekend_price: number; sport_type: string; }
interface Slot { id: number; date: string; start_time: string; end_time: string; price: number; status: string; }

export default function GroupBookingPage() {
  const navigate = useNavigate();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [selectedGround, setSelectedGround] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [playerCount, setPlayerCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash' | 'online'>('online');
  const [paymentGateway, setPaymentGateway] = useState('razorpay');

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    api.getGrounds({}).then(setGrounds).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedGround) {
      api.getSlots(selectedGround, selectedDate).then(setSlots).catch(() => setSlots([]));
    }
  }, [selectedGround, selectedDate]);

  const toggleSlot = (id: number) => {
    const s = new Set(selectedSlots);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelectedSlots(s);
  };

  const selectedSlotsList = slots.filter(s => selectedSlots.has(s.id));
  const totalPrice = selectedSlotsList.reduce((sum, s) => sum + s.price, 0);

  const handleGroupBook = async () => {
    if (!selectedGround || selectedSlots.size === 0) { alert('Select ground and slots'); return; }
    setLoading(true);
    try {
      await api.createBooking({
        ground_id: selectedGround,
        slot_id: selectedSlotsList[0]?.id,
        slot_ids: Array.from(selectedSlots),
        payment_type: 'token',
        payment_gateway: paymentMethod === 'online' ? paymentGateway : paymentMethod,
        payment_mode: paymentMethod,
        group_size: playerCount,
      });
      alert('Group booking created! ' + selectedSlots.size + ' slots booked for ' + playerCount + ' players.');
      navigate('/my-bookings');
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Booking failed'); }
    setLoading(false);
  };

  const getDates = () => {
    const d = [];
    for (let i = 0; i < 7; i++) { const dt = new Date(); dt.setDate(dt.getDate() + i); d.push(dt.toISOString().split('T')[0]); }
    return d;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Users size={28} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Group Booking</h1>
        </div>
        <p className="text-gray-500 mb-6">Book multiple slots together for your team or group. Get multiple consecutive time slots in one booking.</p>

        <div className="space-y-6">
          {/* Ground Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={18} /> Select Ground</h3>
            <select className="w-full border-2 rounded-lg px-4 py-3 text-sm" value={selectedGround || ''} onChange={e => setSelectedGround(parseInt(e.target.value))}>
              <option value="">Choose a ground...</option>
              {grounds.map(g => <option key={g.id} value={g.id}>{g.name} - {g.city} ({g.sport_type})</option>)}
            </select>
          </div>

          {/* Player Count */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Users size={18} /> Number of Players</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => setPlayerCount(Math.max(2, playerCount - 1))} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Minus size={18} /></button>
              <span className="text-3xl font-bold text-blue-600 w-16 text-center">{playerCount}</span>
              <button onClick={() => setPlayerCount(Math.min(50, playerCount + 1))} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Plus size={18} /></button>
            </div>
          </div>

          {/* Date & Slots */}
          {selectedGround && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Calendar size={18} /> Select Date & Slots</h3>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {getDates().map(d => (
                  <button key={d} onClick={() => setSelectedDate(d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${d === selectedDate ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {new Date(d).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-3">Select multiple consecutive slots for your group:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {slots.map(s => (
                  <button key={s.id} disabled={s.status !== 'available'}
                    onClick={() => toggleSlot(s.id)}
                    className={`p-3 rounded-lg text-sm font-medium border-2 transition ${
                      s.status !== 'available' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
                      selectedSlots.has(s.id) ? 'bg-blue-50 text-blue-700 border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                    }`}>
                    <Clock size={14} className="inline mr-1" /> {s.start_time} - {s.end_time}
                    <p className="text-xs mt-1">Rs.{s.price}</p>
                  </button>
                ))}
                {slots.length === 0 && <p className="text-gray-400 col-span-4 text-center py-4">No slots available for this date</p>}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedSlots.size > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><CreditCard size={18} /> Payment & Summary</h3>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium flex flex-col items-center gap-1 transition ${paymentMethod === 'wallet' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}>
                    <Wallet size={18} /> Wallet
                  </button>
                  <button onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium flex flex-col items-center gap-1 transition ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                    <Banknote size={18} /> Cash
                  </button>
                  <button onClick={() => setPaymentMethod('online')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium flex flex-col items-center gap-1 transition ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                    <CreditCard size={18} /> Online
                  </button>
                </div>
                {paymentMethod === 'online' && (
                  <select className="w-full border rounded-lg px-3 py-2 mt-2 text-sm" value={paymentGateway} onChange={e => setPaymentGateway(e.target.value)}>
                    <option value="razorpay">Razorpay</option>
                    <option value="phonepe">PhonePe</option>
                    <option value="paytm">Paytm</option>
                    <option value="upi">UPI</option>
                  </select>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Slots Selected</span><span className="font-medium">{selectedSlots.size} slots</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Players</span><span className="font-medium">{playerCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Per Player Cost</span><span className="font-medium">Rs.{Math.round(totalPrice / playerCount)}</span></div>
                <div className="flex justify-between border-t pt-2 text-lg"><span className="font-bold">Total</span><span className="font-bold text-green-600">Rs.{totalPrice}</span></div>
              </div>
              <button onClick={handleGroupBook} disabled={loading}
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Booking...' : 'Confirm Group Booking'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

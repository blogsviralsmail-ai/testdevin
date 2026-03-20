import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Calendar, Clock, CreditCard, Tag, Check, ChevronRight, Share2, Navigation, Wallet } from 'lucide-react';

interface Slot { id: number; date: string; start_time: string; end_time: string; price: number; status: string; }
interface Ground { id: number; name: string; address: string; weekday_price: number; weekend_price: number; }
interface Gateway { id: number; name: string; display_name: string; }

const demoLocations: Record<number, {lat:number,lng:number}> = {
  1:{lat:26.9124,lng:75.7873},2:{lat:26.8498,lng:75.8070},3:{lat:26.8947,lng:75.8283},
  4:{lat:26.9196,lng:75.7280},5:{lat:26.8780,lng:75.7592},6:{lat:26.9055,lng:75.8483},
  7:{lat:26.8635,lng:75.7840},8:{lat:26.8890,lng:75.7500},
};

export default function BookingPage() {
  const { groundId } = useParams();
  const navigate = useNavigate();
  const [ground, setGround] = useState<Ground | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [paymentType, setPaymentType] = useState('token');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState('razorpay');
  const [step, setStep] = useState<'slots' | 'payment' | 'confirmed'>('slots');
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  useEffect(() => {
    if (groundId) {
      api.getGround(parseInt(groundId)).then(setGround);
      api.getPaymentGateways().then(setGateways);
      api.getPublicSettings().then(setSettings);
      api.getWallet().then(w => setWalletBalance(w.balance || 0)).catch(() => {});
    }
    // Capture user GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => { /* user denied or error - proceed without location */ },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [groundId]);

  useEffect(() => {
    if (groundId) api.getSlots(parseInt(groundId), selectedDate).then(setSlots).catch(() => {});
  }, [groundId, selectedDate]);

  const getDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() + i); dates.push(d.toISOString().split('T')[0]); }
    return dates;
  };

  const formatDate = (ds: string) => {
    const d = new Date(ds);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), date: d.getDate(), month: d.toLocaleDateString('en', { month: 'short' }) };
  };

  const tokenPct = parseInt(settings.token_percentage || '30');

  const toggleSlot = (slotId: number) => {
    const newSet = new Set(selectedSlots);
    if (newSet.has(slotId)) newSet.delete(slotId);
    else newSet.add(slotId);
    setSelectedSlots(newSet);
  };

  const selectedSlotsList = slots.filter(s => selectedSlots.has(s.id));
  const totalPrice = selectedSlotsList.reduce((sum, s) => sum + s.price, 0);
  const finalAmount = Math.max(totalPrice - promoDiscount, 0);
  // Fix: Calculate token amount first, then apply wallet to appropriate amount
  const rawTokenAmount = Math.round(finalAmount * tokenPct / 100);
  // For token payment: wallet deducts from token amount only
  // For full/cash payment: wallet deducts from full amount
  const payTarget = paymentType === 'token' ? rawTokenAmount : finalAmount;
  const walletDeduction = useWallet ? Math.min(walletBalance, payTarget) : 0;
  const payableAmount = finalAmount - (paymentType !== 'token' ? walletDeduction : 0);
  const tokenAmount = paymentType === 'token' ? Math.max(rawTokenAmount - walletDeduction, 0) : Math.round(payableAmount * tokenPct / 100);
  const availableSlots = slots.filter(s => s.status === 'available').length;
  const bookedSlots = slots.filter(s => s.status === 'booked').length;

  const applyPromo = async () => {
    if (!promoCode || selectedSlots.size === 0) return;
    try {
      const res = await api.validatePromo(promoCode, totalPrice);
      if (res.valid) { setPromoDiscount(res.calculated_discount); setPromoMsg(res.message); }
      else { setPromoDiscount(0); setPromoMsg(res.message); }
    } catch { setPromoMsg('Invalid promo code'); }
  };

  const openRazorpayCheckout = (orderData: Record<string, unknown>) => {
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const win = window as unknown as Record<string, unknown>;
      if (!win.Razorpay) { reject(new Error('Razorpay SDK not loaded. Please refresh and try again.')); return; }
      const options = {
        key: orderData.key_id as string,
        amount: orderData.amount as number,
        currency: orderData.currency as string || 'INR',
        name: 'BookAGround',
        description: `Booking: ${(orderData.notes as Record<string, string>)?.ground_name || 'Ground Booking'}`,
        order_id: orderData.order_id as string,
        prefill: orderData.prefill as Record<string, string> || {},
        notes: orderData.notes as Record<string, string> || {},
        theme: orderData.theme as Record<string, string> || { color: '#16a34a' },
        handler: function(response: Record<string, string>) { resolve(response); },
        modal: { ondismiss: function() { reject(new Error('Payment cancelled by user')); } },
      };
      const rzp = new (win.Razorpay as new (opts: unknown) => { open: () => void })(options);
      rzp.open();
    });
  };

  const handleBook = async () => {
    if (!localStorage.getItem('token')) { navigate('/login', { state: { from: '/book/' + groundId } }); return; }
    if (selectedSlots.size === 0 || !groundId) return;
    setLoading(true);
    try {
      const slotId = selectedSlotsList[0]?.id;
      // Calculate actual pay now amount
      const payNow = paymentType === 'token' ? tokenAmount : payableAmount;

      // CASH payment - direct booking (no Razorpay)
      if (paymentType === 'cash') {
        const res = await api.createBooking({
          ground_id: parseInt(groundId), slot_id: slotId,
          payment_type: 'full', payment_gateway: 'cash', payment_mode: 'cash',
          promo_code: promoCode || undefined, use_wallet: useWallet,
          slot_ids: Array.from(selectedSlots),
          user_latitude: userLat ?? undefined, user_longitude: userLng ?? undefined,
        });
        setBooking(res); setStep('confirmed'); setLoading(false); return;
      }

      // WALLET covers full amount - direct booking (no Razorpay)
      if (payNow === 0 && useWallet) {
        const res = await api.createBooking({
          ground_id: parseInt(groundId), slot_id: slotId,
          payment_type: paymentType, payment_gateway: 'wallet', payment_mode: 'wallet',
          promo_code: promoCode || undefined, use_wallet: useWallet,
          slot_ids: Array.from(selectedSlots),
          user_latitude: userLat ?? undefined, user_longitude: userLng ?? undefined,
        });
        setBooking(res); setStep('confirmed'); setLoading(false); return;
      }

      // ONLINE PAYMENT via Razorpay
      // Step 1: Create Razorpay order on backend
      const orderData = await api.createRazorpayOrder({
        ground_id: parseInt(groundId), slot_id: slotId,
        payment_type: paymentType, promo_code: promoCode || undefined,
        use_wallet: useWallet,
        user_latitude: userLat ?? undefined, user_longitude: userLng ?? undefined,
      });

      // Step 2: Open Razorpay checkout popup
      try {
        const paymentResponse = await openRazorpayCheckout(orderData);

        // Step 3: Verify payment on backend
        const verifyRes = await api.verifyRazorpayPayment({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        });
        setBooking(verifyRes); setStep('confirmed');
      } catch (payErr: unknown) {
        // Payment failed or cancelled - release slot
        const errMsg = payErr instanceof Error ? payErr.message : 'Payment failed';
        if (orderData.order_id) {
          await api.razorpayPaymentFailed({ razorpay_order_id: orderData.order_id }).catch(() => {});
        }
        if (errMsg !== 'Payment cancelled by user') {
          alert('Payment failed: ' + errMsg);
        } else {
          alert('Payment was cancelled. Your slot has been released.');
        }
      }
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Booking failed'); }
    setLoading(false);
  };

  if (!ground) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const loc = demoLocations[ground.id] || {lat:26.9124,lng:75.7873};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => step === 'slots' ? navigate(-1) : setStep('slots')} className="hover:text-green-600 flex items-center gap-1">
            <ArrowLeft size={14} /> {step === 'confirmed' ? 'Done' : step === 'payment' ? 'Back to Slots' : 'Back'}
          </button>
          <span>/</span>
          <span className="text-gray-800">{step === 'confirmed' ? 'Confirmed' : step === 'payment' ? 'Payment' : 'Select Slots'} - {ground.name}</span>
        </div>
      </div>
      <div className="page-container pb-8">
        {step === 'confirmed' && booking ? (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={40} className="text-green-600" /></div>
              <h2 className="text-2xl font-bold text-green-600 mb-1">Booking Confirmed!</h2>
              <p className="text-gray-500 text-sm mb-2">Booking ID</p>
              <p className="text-xl font-bold text-gray-800 mb-4 bg-gray-50 py-2 px-4 rounded-lg inline-block">{String(booking.booking_id || 'BMG-2026-XXXXX')}</p>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl inline-block mb-4 border-2 border-gray-100">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(String(booking.booking_id || 'BMG-0000'))}`} alt="QR Code" className="w-48 h-48 mx-auto" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%23f3f4f6" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">QR Code</text></svg>'); }} />
              </div>
              <p className="text-xs text-gray-400 mb-4">Show this QR at the ground for verification</p>

              <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Ground</span><span className="font-medium">{String(booking.ground_name || ground.name)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{String(booking.date || selectedDate)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{String(booking.time || selectedSlotsList.map(s => s.start_time).join(', '))}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Slots</span><span className="font-medium">{selectedSlots.size} slot(s)</span></div>
                <div className="flex justify-between border-t pt-3"><span className="text-gray-500">Total</span><span className="font-medium">Rs.{Number(booking.total_amount || totalPrice)}</span></div>
                {Number(booking.discount || 0) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-Rs.{Number(booking.discount)}</span></div>}
                {Number(booking.cashback || 0) > 0 && <div className="flex justify-between text-orange-500"><span>Cashback</span><span>+Rs.{Number(booking.cashback)} to wallet</span></div>}
                <div className="flex justify-between border-t pt-3"><span className="text-gray-500">Paid</span><span className="font-bold text-green-600 text-lg">Rs.{Number(booking.token_paid || tokenAmount)}</span></div>
                {Number(booking.remaining || 0) > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="text-orange-700 font-medium text-sm">Balance Rs.{Number(booking.remaining)} to pay online before your slot</p>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Status</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${String(booking.status) === 'pending_cash' ? 'bg-orange-100 text-orange-700' : Number(booking.remaining || 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {String(booking.status) === 'pending_cash' ? 'Pending Cash Verification' : Number(booking.remaining || 0) > 0 ? 'Token Paid' : 'Fully Paid'}
                  </span>
                </div>
              </div>

              {/* Notification info */}
              <div className="bg-blue-50 rounded-lg p-3 mt-4 text-sm text-blue-700 flex items-center gap-2">
                <span>Confirmation sent via SMS, WhatsApp & Email</span>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => {
                  const text = `Booked ${ground.name} on BookAGround! ID: ${String(booking.booking_id)}`;
                  if (navigator.share) navigator.share({title:'Booking',text});
                  else { navigator.clipboard.writeText(text); alert('Copied!'); }
                }} className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50">
                  <Share2 size={16}/> Share
                </button>
                <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank')}
                  className="flex-1 border-2 border-blue-500 text-blue-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-50">
                  <Navigation size={16}/> Directions
                </button>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={() => navigate('/my-bookings')} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">My Bookings</button>
                <button onClick={() => navigate('/')} className="flex-1 border-2 border-green-600 text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50">Home</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 'payment' ? (
                <>
                  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2"><Tag size={18} /> Promo Code</h3>
                    <div className="flex gap-3">
                      <input type="text" placeholder="Enter promo code" className="flex-1 border rounded-lg px-4 py-2.5" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} />
                      <button onClick={applyPromo} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700">Apply</button>
                    </div>
                    {promoMsg && <p className={`text-sm mt-2 ${promoDiscount > 0 ? 'text-green-600' : 'text-red-500'}`}>{promoMsg}</p>}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {['CRICKET20', 'WELCOME100', 'WEEKEND50', 'JAIPUR25', 'SUPER500'].map(c => (
                        <button key={c} onClick={() => setPromoCode(c)} className="text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-200 hover:bg-green-100">{c}</button>
                      ))}
                    </div>
                  </div>

                  {/* Wallet */}
                  {walletBalance > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={useWallet} onChange={() => setUseWallet(!useWallet)} className="w-5 h-5 accent-green-600" />
                        <div><p className="font-medium">Use Wallet Balance</p><p className="text-sm text-gray-500">Available: Rs.{walletBalance}</p></div>
                        {useWallet && <span className="ml-auto text-green-600 font-bold">-Rs.{walletDeduction}</span>}
                      </label>
                    </div>
                  )}

                  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h3 className="font-bold text-gray-800 text-lg mb-3">Payment Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer ${paymentType === 'token' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                        <input type="radio" name="ptype" checked={paymentType === 'token'} onChange={() => setPaymentType('token')} className="mr-3 accent-green-600" />
                        <div className="flex-1"><p className="font-medium">Token ({tokenPct}%)</p><p className="text-sm text-gray-500">Pay Rs.{tokenAmount} now</p></div>
                        <span className="font-bold text-green-600 text-lg">Rs.{tokenAmount}</span>
                      </label>
                      <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer ${paymentType === 'full' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                        <input type="radio" name="ptype" checked={paymentType === 'full'} onChange={() => setPaymentType('full')} className="mr-3 accent-green-600" />
                        <div className="flex-1"><p className="font-medium">Full Amount</p><p className="text-sm text-gray-500">Pay complete now</p></div>
                        <span className="font-bold text-green-600 text-lg">Rs.{payableAmount}</span>
                      </label>
                      {/* Cash Payment - only show if admin has enabled it */}
                      {settings.cash_payment_enabled !== '0' && (
                      <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer ${paymentType === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                        <input type="radio" name="ptype" checked={paymentType === 'cash'} onChange={() => setPaymentType('cash')} className="mr-3 accent-orange-600" />
                        <div className="flex-1"><p className="font-medium">Pay on Ground (COD)</p><p className="text-sm text-gray-500">Pay cash at ground</p></div>
                        <span className="font-bold text-orange-600 text-lg">Rs.{finalAmount}</span>
                      </label>
                      )}
                    </div>
                  </div>
                  {/* Payment Gateway Section */}
                  {paymentType !== 'cash' && (paymentType === 'token' ? tokenAmount : payableAmount) > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2"><CreditCard size={18} /> Payment Gateway</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {gateways.map(gw => (
                        <button key={gw.id} onClick={() => setSelectedGateway(gw.name)} className={`p-3 rounded-xl border-2 text-center ${selectedGateway === gw.name ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                          <p className="text-sm font-medium">{gw.display_name}</p>
                          {gw.name === selectedGateway && <Check size={14} className="text-green-600 mx-auto mt-1" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}
                  {/* Wallet covers full amount - no gateway needed */}
                  {paymentType !== 'cash' && (paymentType === 'token' ? tokenAmount : payableAmount) === 0 && useWallet && (
                    <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                      <h3 className="font-bold text-green-800 text-lg mb-2 flex items-center gap-2"><Wallet size={18} /> Wallet Payment</h3>
                      <p className="text-sm text-green-700">Your wallet balance covers the full amount. No additional payment gateway needed.</p>
                    </div>
                  )}
                  {/* Cash payment info */}
                  {paymentType === 'cash' && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2"><CreditCard size={18} /> Payment Gateway</h3>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        <button className="p-3 rounded-xl border-2 text-center border-orange-500 bg-orange-50">
                          <p className="text-sm font-medium text-orange-700">Cash</p>
                          <Check size={14} className="text-orange-600 mx-auto mt-1" />
                        </button>
                      </div>
                      <p className="text-sm text-orange-700 mt-3">Pay the full amount at the ground. Booking confirmed after owner/admin verifies cash payment.</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Calendar size={18} /> Select Date</h3>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {getDates().map(d => { const f = formatDate(d); return (
                        <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlots(new Set()); }}
                          className={`flex flex-col items-center px-5 py-3 rounded-xl min-w-16 transition ${selectedDate === d ? 'bg-green-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border'}`}>
                          <span className="text-xs">{f.day}</span><span className="text-xl font-bold">{f.date}</span><span className="text-xs">{f.month}</span>
                        </button>); })}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Clock size={18} /> Available Slots</h3>
                      <div className="flex gap-3 text-sm">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-100 border-2 border-green-500 rounded"></span> Available ({availableSlots})</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-100 border-2 border-red-400 rounded"></span> Booked ({bookedSlots})</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-600 rounded"></span> Selected ({selectedSlots.size})</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {slots.filter(slot => {
                        // Filter out past time slots for today
                        if (selectedDate === new Date().toISOString().split('T')[0]) {
                          const now = new Date();
                          const [h, m] = (slot.start_time || '').split(':').map(Number);
                          if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) return false;
                        }
                        return true;
                      }).map(slot => (
                        <button key={slot.id} disabled={slot.status !== 'available'}
                          onClick={() => toggleSlot(slot.id)}
                          className={`p-3 rounded-xl text-center border-2 transition ${selectedSlots.has(slot.id) ? 'bg-green-600 text-white border-green-600 shadow-md' : slot.status === 'available' ? 'bg-green-50 border-green-200 text-green-700 hover:border-green-400' : 'bg-red-50 border-red-200 text-red-400 line-through opacity-60 cursor-not-allowed'}`}>
                          <div className="font-bold">{slot.start_time}</div>
                          <div className="text-xs mt-0.5 opacity-80">{slot.end_time}</div>
                          <div className="text-xs mt-1 font-medium">Rs.{slot.price}</div>
                        </button>
                      ))}
                    </div>
                    {selectedSlots.size > 0 && (
                      <div className="mt-4 bg-green-50 rounded-lg p-3 text-sm text-green-700">
                        Selected {selectedSlots.size} slot(s) | Total: Rs.{totalPrice}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-gray-800 text-lg mb-4">Booking Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Ground</span><span className="font-medium text-right ml-2">{ground.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{selectedDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Slots</span><span className="font-medium">{selectedSlots.size} selected</span></div>
                    {selectedSlots.size > 0 && (<>
                      <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium text-right">{selectedSlotsList.map(s => s.start_time).join(', ')}</span></div>
                      <div className="flex justify-between border-t pt-3"><span className="text-gray-500">Price</span><span className="font-medium">Rs.{totalPrice}</span></div>
                      {promoDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-Rs.{promoDiscount}</span></div>}
                      {walletDeduction > 0 && <div className="flex justify-between text-purple-600"><span>Wallet</span><span>-Rs.{walletDeduction}</span></div>}
                      <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Total</span><span className="text-green-600">Rs.{payableAmount}</span></div>
                      {step === 'payment' && <div className="flex justify-between text-sm"><span className="text-gray-500">Pay now</span><span className="font-bold text-green-600">Rs.{paymentType === 'token' ? tokenAmount : payableAmount}</span></div>}
                    </>)}
                  </div>
                  {selectedSlots.size > 0 && step === 'slots' && (
                    <button onClick={() => setStep('payment')} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 mt-6">Continue <ChevronRight size={20} /></button>
                  )}
                  {step === 'payment' && (<>
                    <button onClick={handleBook} disabled={loading} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 mt-6">
                      {loading ? 'Processing...' : `Pay Rs.${paymentType === 'token' ? tokenAmount : payableAmount}`}
                    </button>
                  </>)}
                  {selectedSlots.size === 0 && step === 'slots' && <p className="text-center text-gray-400 text-sm mt-4">Select slot(s) to continue</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

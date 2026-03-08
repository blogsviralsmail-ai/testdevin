import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI, studentAPI, gatewayAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star, IndianRupee, BookOpen, Clock, Heart, ArrowLeft, Languages, Award, Calendar, X, Video, CheckCircle, CreditCard, Shield, Users, AlertCircle, QrCode, Smartphone, Zap, Wallet, Banknote } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    subject_id: 0, scheduled_date: '', scheduled_time: '10:00',
    duration_minutes: 60, class_type: 'one-on-one', message: '',
    card_number: '', card_expiry: '', card_cvv: '', card_name: ''
  });
  const [paymentStep, setPaymentStep] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState('');
  const [availableGateways, setAvailableGateways] = useState<any[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<any>(null);

  useEffect(() => {
    gatewayAPI.getAvailable().then(gws => {
      setAvailableGateways(gws || []);
      const primary = (gws || []).find((g: any) => g.is_primary);
      if (primary) setSelectedGateway(primary);
      else if (gws && gws.length > 0) setSelectedGateway(gws[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      teacherAPI.getProfile(Number(id)).then(data => {
        setTeacher(data);
        if (data.subjects?.length > 0) {
          setBookingForm(prev => ({ ...prev, subject_id: data.subjects[0].subject_id || data.subjects[0].id }));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (user?.role === 'student') {
      studentAPI.getFavourites().then(favs => {
        setIsFav(favs.some((f: any) => f.teacher_id === Number(id)));
      }).catch(() => {});
    }
  }, [user, id]);

  // Get available time slots for selected date based on teacher's availability
  const getAvailableTimeSlots = () => {
    if (!bookingForm.scheduled_date || !teacher?.availability?.length) return [];
    const selectedDate = new Date(bookingForm.scheduled_date + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay(); // 0=Sunday in JS
    // Convert JS day (0=Sun) to Python day (0=Mon)
    const pythonDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const dayAvail = teacher.availability.find((a: any) => a.day_of_week === pythonDay);
    if (!dayAvail) return [];
    const startHour = parseInt(dayAvail.start_time.split(':')[0]);
    const endHour = parseInt(dayAvail.end_time.split(':')[0]);
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const isDayAvailable = () => {
    if (!bookingForm.scheduled_date || !teacher?.availability?.length) return true;
    const selectedDate = new Date(bookingForm.scheduled_date + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay();
    const pythonDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return teacher.availability.some((a: any) => a.day_of_week === pythonDay);
  };

  const availableSlots = getAvailableTimeSlots();
  const dayIsAvailable = isDayAvailable();

  const toggleFav = async () => {
    if (!user) return navigate('/register');
    try {
      if (isFav) await studentAPI.removeFavourite(Number(id));
      else await studentAPI.addFavourite(Number(id));
      setIsFav(!isFav);
    } catch (err) { console.error(err); }
  };

  const handleProceedToPayment = () => {
    if (!user) return navigate('/register');
    if (user.role !== 'student') return;
    if (!bookingForm.subject_id || !bookingForm.scheduled_date || !bookingForm.scheduled_time) {
      setBookingError('Please fill all required fields');
      return;
    }
    // Validate slot availability
    if (bookingForm.scheduled_date && !dayIsAvailable) {
      setBookingError('Teacher is not available on this day. Please select another date.');
      return;
    }
    if (bookingForm.scheduled_date && availableSlots.length > 0 && !availableSlots.includes(bookingForm.scheduled_time)) {
      setBookingError('Selected time is not within teacher\'s available hours.');
      return;
    }
    setBookingError('');
    setPaymentStep(true);
  };

  const isCashGateway = selectedGateway?.gateway_type === 'cash';
  const isUpiGateway = selectedGateway && (selectedGateway.gateway_type === 'custom_upi' || (selectedGateway.supports_upi && selectedGateway.upi_intent));

  const handleBooking = async () => {
    // Skip card validation for Cash and UPI gateways
    if (!isCashGateway && !isUpiGateway) {
      if (!bookingForm.card_number || bookingForm.card_number.replace(/\s/g, '').length < 16) {
        setBookingError('Please enter a valid 16-digit card number'); return;
      }
      if (!bookingForm.card_expiry || !/^\d{2}\/\d{2}$/.test(bookingForm.card_expiry)) {
        setBookingError('Please enter expiry in MM/YY format'); return;
      }
      if (!bookingForm.card_cvv || bookingForm.card_cvv.length < 3) {
        setBookingError('Please enter a valid CVV'); return;
      }
      if (!bookingForm.card_name) {
        setBookingError('Please enter cardholder name'); return;
      }
    }
    setBookingLoading(true);
    setBookingError('');
    setProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessingPayment(false);
    try {
      const result = await studentAPI.bookTeacher({
        teacher_id: Number(id),
        subject_id: bookingForm.subject_id,
        scheduled_date: bookingForm.scheduled_date,
        scheduled_time: bookingForm.scheduled_time,
        duration_minutes: bookingForm.duration_minutes,
        class_type: bookingForm.class_type,
        message: bookingForm.message || undefined,
        card_number: bookingForm.card_number.replace(/\s/g, ''),
        card_expiry: bookingForm.card_expiry,
        card_cvv: bookingForm.card_cvv,
        card_name: bookingForm.card_name
      });
      setBookingSuccess(result);
    } catch (err: any) {
      setBookingError(err.message || 'Booking failed. Please try again.');
    } finally { setBookingLoading(false); }
  };

  const formatCardNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
  };
  const formatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };
  const getMinDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );
  if (!teacher) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center"><p className="text-slate-400 text-lg">Teacher not found</p>
        <button onClick={() => navigate('/search')} className="mt-3 text-emerald-400 font-medium hover:underline">Browse Teachers</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* Profile Header */}
      <div className="bg-slate-900/50 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 mb-6 text-sm font-medium transition">
            <ArrowLeft size={16} /> Back to results
          </button>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-500/30 flex-shrink-0 animate-float">
              {teacher.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-white">{teacher.full_name}</h1>
                {teacher.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-500/20">
                    <CheckCircle size={12} /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-400 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={14} /> {teacher.city}, {teacher.state}</span>
                <span className="flex items-center gap-1"><BookOpen size={14} /> {teacher.experience_years} years exp</span>
                <span className="flex items-center gap-1"><Award size={14} /> {teacher.qualification}</span>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                  <Star size={16} className="text-amber-400" fill="currentColor" />
                  <span className="font-bold text-white">{teacher.rating}</span>
                  <span className="text-slate-400 text-sm">({teacher.total_reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <IndianRupee size={15} className="text-emerald-400" />
                  <span className="font-bold text-emerald-400">{teacher.hourly_rate}</span>
                  <span className="text-emerald-400/70 text-sm">/hour</span>
                </div>
                <div className="flex items-center gap-1 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                  <Users size={15} className="text-cyan-400" />
                  <span className="font-bold text-cyan-400">{teacher.total_classes}</span>
                  <span className="text-cyan-400/70 text-sm">classes</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {user?.role === 'student' && (
                <button onClick={toggleFav} className={`p-3 rounded-xl transition border ${isFav ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'glass border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/20'}`}>
                  <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              )}
              {(!user || user.role === 'student') && (
                <button onClick={() => user ? setShowBooking(true) : navigate('/register')}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center gap-2 hover:scale-105 transform">
                  <Video size={18} /> Book Class
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">About</h2>
              <p className="text-slate-400 leading-relaxed">{teacher.bio || 'No bio available'}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Subjects & Class Levels</h2>
              <div className="space-y-3">
                {teacher.subjects.map((s: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="font-bold text-emerald-400 mb-2">{s.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.class_levels.map((l: string, j: number) => (
                        <span key={j} className="bg-white/5 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-white/10">{l}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Reviews ({teacher.total_reviews})</h2>
              {teacher.reviews?.length > 0 ? (
                <div className="space-y-4">
                  {teacher.reviews.map((r: any) => (
                    <div key={r.id} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white text-sm">{r.student_name}</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                        </div>
                      </div>
                      {r.comment && <p className="text-slate-400 text-sm leading-relaxed">{r.comment}</p>}
                      <p className="text-xs text-slate-600 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No reviews yet</p>}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {(!user || user.role === 'student') && (
              <div className="glass rounded-2xl p-6 animate-glow">
                <div className="text-center mb-4">
                  <div className="text-3xl font-black text-white">Rs {teacher.hourly_rate}<span className="text-base font-normal text-slate-400">/hr</span></div>
                </div>
                <button onClick={() => user ? setShowBooking(true) : navigate('/register')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 hover:scale-105 transform">
                  <Video size={18} /> Book a Class
                </button>
                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2"><Shield size={12} className="text-emerald-400" /> Escrow payment protection</div>
                  <div className="flex items-center gap-2"><Video size={12} className="text-cyan-400" /> Free Jitsi Meet video call</div>
                  <div className="flex items-center gap-2"><CheckCircle size={12} className="text-purple-400" /> Verified teacher profile</div>
                </div>
              </div>
            )}

            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Languages size={16} className="text-emerald-400" /> Languages</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.languages.map((l: string, i: number) => (
                  <span key={i} className="bg-white/5 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">{l}</span>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Calendar size={16} className="text-emerald-400" /> Availability</h3>
              {teacher.availability?.length > 0 ? (
                <div className="space-y-2">
                  {teacher.availability.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center p-2.5 bg-white/5 rounded-lg text-sm border border-white/5">
                      <span className="font-medium text-slate-300">{DAYS[a.day_of_week]}</span>
                      <span className="text-slate-500 flex items-center gap-1"><Clock size={12} /> {a.start_time} - {a.end_time}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No availability set</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-dark rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10">
            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Booking Confirmed!</h3>
                <p className="text-slate-400 mb-6">Your class has been booked successfully.</p>
                <div className="bg-white/5 rounded-xl p-4 text-left space-y-2 mb-6 border border-white/5">
                  <div className="flex justify-between"><span className="text-slate-400 text-sm">Date & Time</span><span className="font-medium text-white text-sm">{bookingSuccess.scheduled_at}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 text-sm">Price</span><span className="font-bold text-emerald-400 text-sm">Rs {bookingSuccess.price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 text-sm">Payment</span><span className="text-amber-400 font-medium text-sm">In Escrow</span></div>
                </div>
                {bookingSuccess.meeting_link && (
                  <a href={bookingSuccess.meeting_link} target="_blank" rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition mb-3">
                    <Video size={18} className="inline mr-2" /> Join Meeting Link
                  </a>
                )}
                <button onClick={() => { setShowBooking(false); setBookingSuccess(null); navigate('/student'); }}
                  className="w-full bg-white/5 text-slate-300 py-3 rounded-xl font-medium hover:bg-white/10 transition border border-white/10">Go to My Bookings</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <div><h3 className="text-lg font-bold text-white">Book a Class</h3><p className="text-sm text-slate-400">with {teacher.full_name}</p></div>
                  <button onClick={() => { setShowBooking(false); setBookingError(''); setPaymentStep(false); }} className="p-2 hover:bg-white/5 rounded-xl transition text-white"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject *</label>
                    <select value={bookingForm.subject_id} onChange={e => setBookingForm({ ...bookingForm, subject_id: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white">
                      {teacher.subjects.map((s: any) => <option key={s.subject_id || s.id} value={s.subject_id || s.id} className="bg-slate-900">{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Date *</label>
                    <input type="date" min={getMinDate()} value={bookingForm.scheduled_date} onChange={e => setBookingForm({ ...bookingForm, scheduled_date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white cursor-pointer" />
                    {!bookingForm.scheduled_date && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Calendar size={10} /> Click to open calendar and select date</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Time *</label>
                    {bookingForm.scheduled_date && !dayIsAvailable ? (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                        <AlertCircle size={16} />
                        Teacher is not available on {new Date(bookingForm.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}. Please select another date.
                      </div>
                    ) : bookingForm.scheduled_date && availableSlots.length > 0 ? (
                      <select value={bookingForm.scheduled_time} onChange={e => setBookingForm({ ...bookingForm, scheduled_time: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white">
                        {availableSlots.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                      </select>
                    ) : (
                      <select value={bookingForm.scheduled_time} onChange={e => setBookingForm({ ...bookingForm, scheduled_time: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white">
                        {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                      </select>
                    )}
                    {bookingForm.scheduled_date && availableSlots.length > 0 && (
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><Clock size={10} /> Available: {teacher?.availability?.find((a: any) => a.day_of_week === (new Date(bookingForm.scheduled_date + 'T00:00:00').getDay() === 0 ? 6 : new Date(bookingForm.scheduled_date + 'T00:00:00').getDay() - 1))?.start_time} - {teacher?.availability?.find((a: any) => a.day_of_week === (new Date(bookingForm.scheduled_date + 'T00:00:00').getDay() === 0 ? 6 : new Date(bookingForm.scheduled_date + 'T00:00:00').getDay() - 1))?.end_time}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration</label>
                      <select value={bookingForm.duration_minutes} onChange={e => setBookingForm({ ...bookingForm, duration_minutes: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white">
                        <option value={30} className="bg-slate-900">30 min</option><option value={60} className="bg-slate-900">1 hour</option><option value={90} className="bg-slate-900">1.5 hours</option><option value={120} className="bg-slate-900">2 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Class Type</label>
                      <select value={bookingForm.class_type} onChange={e => setBookingForm({ ...bookingForm, class_type: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white">
                        <option value="one-on-one" className="bg-slate-900">One-on-One</option><option value="demo" className="bg-slate-900">Demo (Free)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Message (optional)</label>
                    <textarea value={bookingForm.message} onChange={e => setBookingForm({ ...bookingForm, message: e.target.value })}
                      placeholder="Topics you want to cover?" rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none text-sm text-white placeholder-slate-500" />
                  </div>

                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-400">Rate</span><span className="font-medium text-white">Rs {teacher.hourly_rate}/hr</span></div>
                    <div className="flex justify-between items-center mt-1 text-sm"><span className="text-slate-400">Duration</span><span className="font-medium text-white">{bookingForm.duration_minutes} min</span></div>
                    <div className="border-t border-emerald-500/20 mt-2 pt-2 flex justify-between items-center">
                      <span className="font-bold text-white">Total</span>
                      <span className="font-bold text-xl text-emerald-400">Rs {Math.round(teacher.hourly_rate * (bookingForm.duration_minutes / 60))}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Shield size={10} /> Payment held in escrow until class completion</p>
                  </div>

                  {paymentStep && (
                    <div className="space-y-4">
                      {/* Gateway Selection */}
                      {availableGateways.length > 0 && (
                        <div className="border-2 border-cyan-500/20 rounded-xl p-4 bg-cyan-500/5">
                          <div className="flex items-center gap-2 mb-3">
                            <Wallet size={16} className="text-cyan-400" />
                            <h4 className="font-bold text-white text-sm">Choose Payment Method</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {availableGateways.map(gw => (
                              <button key={gw.id} onClick={() => setSelectedGateway(gw)}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition text-left w-full ${
                                  selectedGateway?.id === gw.id
                                    ? 'border-emerald-500/40 bg-emerald-500/10'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                }`}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
                                  {gw.gateway_type === 'razorpay' ? <CreditCard size={16} className="text-blue-400" /> :
                                   gw.gateway_type === 'phonepe' ? <Smartphone size={16} className="text-purple-400" /> :
                                   gw.gateway_type === 'custom_upi' ? <QrCode size={16} className="text-emerald-400" /> :
                                   gw.gateway_type === 'cashfree' ? <Wallet size={16} className="text-cyan-400" /> :
                                   gw.gateway_type === 'payu' ? <IndianRupee size={16} className="text-amber-400" /> :
                                   gw.gateway_type === 'cash' ? <Banknote size={16} className="text-green-400" /> :
                                   <Zap size={16} className="text-pink-400" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">{gw.display_name}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {gw.supports_upi ? 'UPI ' : ''}{gw.supports_cards ? 'Cards ' : ''}{gw.supports_netbanking ? 'NetBanking ' : ''}{gw.upi_intent ? '(Intent)' : ''}
                                  </p>
                                </div>
                                {selectedGateway?.id === gw.id && <CheckCircle size={16} className="text-emerald-400" />}
                                {gw.is_primary && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">PRIMARY</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Payment Details - Card form for card-supporting gateways */}
                      <div className="border-2 border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5">
                        <div className="flex items-center gap-2 mb-4">
                          <CreditCard size={18} className="text-emerald-400" />
                          <h4 className="font-bold text-white text-sm">Payment Details</h4>
                          <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Secure</span>
                        </div>

                        {/* Show Cash payment info */}
                        {selectedGateway && selectedGateway.gateway_type === 'cash' ? (
                          <div className="text-center py-4">
                            <Banknote size={48} className="text-green-400 mx-auto mb-3" />
                            <p className="text-white font-medium text-sm">Cash Payment</p>
                            <p className="text-xs text-slate-400 mt-2">Pay directly to teacher in cash before or after the class</p>
                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <p className="text-green-400 text-xs font-medium">Amount: Rs {Math.round(teacher.hourly_rate * (bookingForm.duration_minutes / 60))}</p>
                              <p className="text-slate-500 text-[10px] mt-1">Payment will be marked as pending until confirmed</p>
                            </div>
                          </div>
                        ) : selectedGateway && (selectedGateway.gateway_type === 'custom_upi' || (selectedGateway.supports_upi && selectedGateway.upi_intent)) ? (
                          <div className="text-center py-4">
                            <QrCode size={48} className="text-emerald-400 mx-auto mb-3" />
                            <p className="text-white font-medium text-sm">Pay via UPI</p>
                            {selectedGateway.custom_upi_id && (
                              <p className="text-emerald-400 text-xs mt-1 font-mono">{selectedGateway.custom_upi_id}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-2">You will be redirected to complete UPI payment</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Card Number</label>
                              <input type="text" value={bookingForm.card_number} onChange={e => setBookingForm({ ...bookingForm, card_number: formatCardNumber(e.target.value) })}
                                placeholder="4111 1111 1111 1111" maxLength={19}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-sm tracking-wider text-white placeholder-slate-500" />
                              <p className="text-xs text-slate-600 mt-1">Test: 4111 1111 1111 1111 (Visa) or 5500 0000 0000 0004 (MC)</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Expiry (MM/YY)</label>
                                <input type="text" value={bookingForm.card_expiry} onChange={e => setBookingForm({ ...bookingForm, card_expiry: formatExpiry(e.target.value) })}
                                  placeholder="12/28" maxLength={5}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-sm text-white placeholder-slate-500" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">CVV</label>
                                <input type="password" value={bookingForm.card_cvv} onChange={e => setBookingForm({ ...bookingForm, card_cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                  placeholder="123" maxLength={4}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-sm text-white placeholder-slate-500" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Cardholder Name</label>
                              <input type="text" value={bookingForm.card_name} onChange={e => setBookingForm({ ...bookingForm, card_name: e.target.value })}
                                placeholder="RAJESH KUMAR"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm uppercase text-white placeholder-slate-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {bookingError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{bookingError}</div>}
                  {processingPayment && (
                    <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /> Processing payment...
                    </div>
                  )}

                  {!paymentStep ? (
                    <button onClick={handleProceedToPayment}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transform">
                      <CreditCard size={18} /> Proceed to Payment
                    </button>
                  ) : (
                    <button onClick={handleBooking} disabled={bookingLoading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
                      {bookingLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={18} /> {isCashGateway ? `Book & Pay Cash Rs ${Math.round(teacher.hourly_rate * (bookingForm.duration_minutes / 60))}` : `Pay Rs ${Math.round(teacher.hourly_rate * (bookingForm.duration_minutes / 60))} & Confirm`}</>}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

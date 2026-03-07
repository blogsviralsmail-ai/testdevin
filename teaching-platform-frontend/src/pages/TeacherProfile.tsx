import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI, studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star, IndianRupee, BookOpen, Clock, Heart, ArrowLeft, Languages, Award, Calendar, X, Video, CheckCircle, CreditCard } from 'lucide-react';

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
    subject_id: 0,
    scheduled_date: '',
    scheduled_time: '10:00',
    duration_minutes: 60,
    class_type: 'one-on-one',
    message: '',
    card_number: '',
    card_expiry: '',
    card_cvv: '',
    card_name: ''
  });
  const [paymentStep, setPaymentStep] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState('');

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

  const toggleFav = async () => {
    if (!user) return navigate('/login');
    try {
      if (isFav) {
        await studentAPI.removeFavourite(Number(id));
      } else {
        await studentAPI.addFavourite(Number(id));
      }
      setIsFav(!isFav);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProceedToPayment = () => {
    if (!user) return navigate('/login');
    if (user.role !== 'student') return;
    if (!bookingForm.subject_id || !bookingForm.scheduled_date || !bookingForm.scheduled_time) {
      setBookingError('Please fill all required fields');
      return;
    }
    setBookingError('');
    setPaymentStep(true);
  };

  const handleBooking = async () => {
    if (!bookingForm.card_number || bookingForm.card_number.replace(/\s/g, '').length < 16) {
      setBookingError('Please enter a valid 16-digit card number');
      return;
    }
    if (!bookingForm.card_expiry || !/^\d{2}\/\d{2}$/.test(bookingForm.card_expiry)) {
      setBookingError('Please enter expiry in MM/YY format');
      return;
    }
    if (!bookingForm.card_cvv || bookingForm.card_cvv.length < 3) {
      setBookingError('Please enter a valid CVV');
      return;
    }
    if (!bookingForm.card_name) {
      setBookingError('Please enter cardholder name');
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    setProcessingPayment(true);

    // Simulate payment processing delay
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
    } finally {
      setBookingLoading(false);
    }
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
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!teacher) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Teacher not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-indigo-200 hover:text-white mb-4 transition">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {teacher.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{teacher.full_name}</h1>
                {teacher.is_verified && (
                  <span className="bg-green-400/20 text-green-200 text-xs px-3 py-1 rounded-full font-medium border border-green-400/30">
                    Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-indigo-200 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={16} /> {teacher.city}, {teacher.state}</span>
                <span className="flex items-center gap-1"><BookOpen size={16} /> {teacher.experience_years} years exp</span>
                <span className="flex items-center gap-1"><Award size={16} /> {teacher.qualification}</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg">
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                  <span className="font-bold">{teacher.rating}</span>
                  <span className="text-indigo-200 text-sm">({teacher.total_reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg">
                  <IndianRupee size={16} />
                  <span className="font-bold">{teacher.hourly_rate}</span>
                  <span className="text-indigo-200 text-sm">/hour</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {user?.role === 'student' && (
                <button
                  onClick={toggleFav}
                  className={`p-3 rounded-xl transition ${isFav ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <Heart size={22} fill={isFav ? 'white' : 'none'} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book Now Button */}
      {(!user || user.role === 'student') && (
        <div className="max-w-4xl mx-auto px-4 -mt-5">
          <button
            onClick={() => user ? setShowBooking(true) : navigate('/login')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-3"
          >
            <Video size={22} />
            Book a Class - Rs {teacher.hourly_rate}/hour
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">{teacher.bio || 'No bio available'}</p>
            </div>

            {/* Subjects */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Subjects & Class Levels</h2>
              <div className="space-y-3">
                {teacher.subjects.map((s: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl">
                    <div className="font-medium text-indigo-700 mb-2">{s.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.class_levels.map((l: string, j: number) => (
                        <span key={j} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-lg">{l}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Reviews ({teacher.total_reviews})</h2>
              {teacher.reviews?.length > 0 ? (
                <div className="space-y-4">
                  {teacher.reviews.map((r: any) => (
                    <div key={r.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">{r.student_name}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-gray-500 text-sm">{r.comment}</p>}
                      <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No reviews yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Languages */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Languages size={18} /> Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {teacher.languages.map((l: string, i: number) => (
                  <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">{l}</span>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={18} /> Availability
              </h3>
              {teacher.availability?.length > 0 ? (
                <div className="space-y-2">
                  {teacher.availability.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="font-medium text-gray-700">{DAYS[a.day_of_week]}</span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {a.start_time} - {a.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No availability set</p>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-3">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Classes</span>
                  <span className="font-bold text-gray-800">{teacher.total_classes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-bold text-gray-800">{teacher.experience_years} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rating</span>
                  <span className="font-bold text-amber-500">{teacher.rating} / 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-500 mb-6">Your class has been booked successfully.</p>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date & Time</span>
                    <span className="font-medium">{bookingSuccess.scheduled_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-bold text-green-600">Rs {bookingSuccess.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="text-amber-600 font-medium">In Escrow</span>
                  </div>
                </div>
                {bookingSuccess.meeting_link && (
                  <a
                    href={bookingSuccess.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition mb-3"
                  >
                    <Video size={18} className="inline mr-2" /> Join Meeting Link
                  </a>
                )}
                <button
                  onClick={() => { setShowBooking(false); setBookingSuccess(null); navigate('/student'); }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Go to My Bookings
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Book a Class</h3>
                    <p className="text-sm text-gray-500">with {teacher.full_name}</p>
                  </div>
                  <button onClick={() => { setShowBooking(false); setBookingError(''); }} className="p-2 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <select
                      value={bookingForm.subject_id}
                      onChange={e => setBookingForm({ ...bookingForm, subject_id: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {teacher.subjects.map((s: any) => (
                        <option key={s.subject_id || s.id} value={s.subject_id || s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      min={getMinDate()}
                      value={bookingForm.scheduled_date}
                      onChange={e => setBookingForm({ ...bookingForm, scheduled_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <select
                      value={bookingForm.scheduled_time}
                      onChange={e => setBookingForm({ ...bookingForm, scheduled_time: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <select
                      value={bookingForm.duration_minutes}
                      onChange={e => setBookingForm({ ...bookingForm, duration_minutes: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                    <select
                      value={bookingForm.class_type}
                      onChange={e => setBookingForm({ ...bookingForm, class_type: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="one-on-one">One-on-One</option>
                      <option value="demo">Demo (Free Trial)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                    <textarea
                      value={bookingForm.message}
                      onChange={e => setBookingForm({ ...bookingForm, message: e.target.value })}
                      placeholder="Any specific topics you want to cover?"
                      rows={3}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rate</span>
                      <span className="font-medium">Rs {teacher.hourly_rate}/hr</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{bookingForm.duration_minutes} min</span>
                    </div>
                    <div className="border-t border-indigo-200 mt-2 pt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="font-bold text-xl text-indigo-700">
                        Rs {Math.round(teacher.hourly_rate * (bookingForm.duration_minutes / 60))}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Payment will be held in escrow until class is completed</p>
                  </div>

                  {/* Payment Step - Fake CC Gateway */}
                  {paymentStep && (
                    <div className="border-2 border-indigo-200 rounded-xl p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard size={20} className="text-indigo-600" />
                        <h4 className="font-bold text-gray-800">Payment Details</h4>
                        <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Secure</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Card Number</label>
                          <input
                            type="text"
                            value={bookingForm.card_number}
                            onChange={e => setBookingForm({ ...bookingForm, card_number: formatCardNumber(e.target.value) })}
                            placeholder="4111 1111 1111 1111"
                            maxLength={19}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm tracking-wider"
                          />
                          <p className="text-xs text-gray-400 mt-1">Test: 4111 1111 1111 1111 (Visa) or 5500 0000 0000 0004 (MC)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              value={bookingForm.card_expiry}
                              onChange={e => setBookingForm({ ...bookingForm, card_expiry: formatExpiry(e.target.value) })}
                              placeholder="12/28"
                              maxLength={5}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                            <input
                              type="password"
                              value={bookingForm.card_cvv}
                              onChange={e => setBookingForm({ ...bookingForm, card_cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                              placeholder="123"
                              maxLength={4}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Cardholder Name</label>
                          <input
                            type="text"
                            value={bookingForm.card_name}
                            onChange={e => setBookingForm({ ...bookingForm, card_name: e.target.value })}
                            placeholder="RAJESH KUMAR"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {bookingError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      {bookingError}
                    </div>
                  )}

                  {processingPayment && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      Processing payment... Please wait
                    </div>
                  )}

                  {!paymentStep ? (
                    <button
                      onClick={handleProceedToPayment}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl font-bold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} />
                      Proceed to Payment
                    </button>
                  ) : (
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {bookingLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Pay Rs {Math.round(teacher.hourly_rate * (bookingForm.duration_minutes / 60))} & Confirm
                        </>
                      )}
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

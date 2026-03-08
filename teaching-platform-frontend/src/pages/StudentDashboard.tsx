import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI, paymentAPI } from '../services/api';
import { BookOpen, Calendar, IndianRupee, Search, Heart, Clock, Video, Star, ArrowRight, User, Bell, AlertCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [favourites, setFavourites] = useState<any[]>([]);
  const [tab, setTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [waitMessage, setWaitMessage] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  // Poll for notifications every 15 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/notifications/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const classStarted = data.filter((n: any) => n.type === 'class_started' && !n.is_read);
          setNotifications(classStarted);
        }
      } catch (err) { /* ignore */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, f] = await Promise.all([studentAPI.getBookings(), studentAPI.getFavourites()]);
      setBookings(b);
      setFavourites(f);
    } catch (err) { console.error(err); }
    try {
      const p = await paymentAPI.list();
      setPayments(p);
    } catch (err) { console.error('Failed to load payments:', err); }
    setLoading(false);
  };

  const upcomingClasses = bookings.filter(b => b.class_status === 'scheduled');
  const completedClasses = bookings.filter(b => b.class_status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-5 left-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl animate-float-slow"></div>
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse3d">
                <User size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white">Welcome, {user?.full_name}!</h1>
                <p className="text-slate-400 text-sm">Find teachers, book classes, and start learning</p>
              </div>
            </div>
            <Link to="/search" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 text-sm hover:scale-105 transform">
              <Search size={16} /> Find Teachers <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {waitMessage && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 animate-pulse">
            <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 font-medium text-sm">{waitMessage}</span>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mb-4 space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-emerald-300 text-sm">{n.title}</p>
                  <p className="text-emerald-400/70 text-xs">{n.message}</p>
                </div>
                <Video size={18} className="text-emerald-400 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Calendar size={20} />, num: upcomingClasses.length, label: 'Upcoming', color: 'text-cyan-400 bg-cyan-500/10', border: 'border-cyan-500/20' },
            { icon: <BookOpen size={20} />, num: completedClasses.length, label: 'Completed', color: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/20' },
            { icon: <IndianRupee size={20} />, num: payments.length, label: 'Payments', color: 'text-purple-400 bg-purple-500/10', border: 'border-purple-500/20' },
            { icon: <Heart size={20} />, num: favourites.length, label: 'Favourites', color: 'text-rose-400 bg-rose-500/10', border: 'border-rose-500/20' },
          ].map((s, i) => (
            <div key={i} className={`card-3d glass rounded-xl p-4 border ${s.border}`}>
              <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
              <div className="text-2xl font-black text-white">{s.num}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['bookings', 'payments', 'favourites'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-bold transition capitalize whitespace-nowrap text-sm ${
                tab === t ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20' : 'glass text-slate-400 hover:bg-white/10 border border-white/10'
              }`}>{t}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <>
            {tab === 'bookings' && (
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <div className="text-center py-16 glass rounded-2xl">
                    <Calendar size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">No bookings yet</p>
                    <Link to="/search" className="text-emerald-400 font-medium hover:underline mt-2 inline-block text-sm">Find Teachers</Link>
                  </div>
                ) : bookings.map(b => (
                  <div key={b.id} className="glass rounded-xl p-5 hover:bg-white/10 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-white">{b.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{b.subject_name} &middot; {b.teacher_name} &middot; {b.class_type}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Clock size={13} /> {new Date(b.scheduled_at).toLocaleString()}</span>
                          <span>{b.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          b.class_status === 'scheduled' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          b.class_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          b.class_status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-slate-400'
                        }`}>{b.class_status}</span>
                        {b.payment_status && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            b.payment_status === 'escrow' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            b.payment_status === 'released' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>{b.payment_status}</span>
                        )}
                        {b.meeting_link && (b.class_status === 'scheduled' || b.class_status === 'in_progress') && (
                          <button onClick={() => {
                            const scheduledTime = new Date(b.scheduled_at);
                            const now = new Date();
                            const diffMinutes = (scheduledTime.getTime() - now.getTime()) / 60000;
                            if (b.class_status === 'in_progress' || diffMinutes <= 5) {
                              window.open(b.meeting_link, '_blank');
                            } else {
                              const timeStr = scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                              setWaitMessage(`Wait till ${timeStr} to join this class`);
                              setTimeout(() => setWaitMessage(null), 5000);
                            }
                          }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              b.class_status === 'in_progress' ? 'bg-emerald-500 text-white hover:bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400'
                            }`}>
                            <Video size={13} /> {b.class_status === 'in_progress' ? 'Join Now!' : 'Join'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'payments' && (
              <div className="glass rounded-2xl overflow-hidden">
                {payments.length === 0 ? (
                  <div className="text-center py-16">
                    <IndianRupee size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">No payments yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5 border-b border-white/5">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Class</th>
                          <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Teacher</th>
                          <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Amount</th>
                          <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                          <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {payments.map(p => (
                          <tr key={p.id} className="hover:bg-white/5 transition">
                            <td className="px-5 py-3.5 text-sm font-medium text-white">{p.class_title}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-400">{p.teacher_name}</td>
                            <td className="px-5 py-3.5 text-sm font-bold text-emerald-400">Rs. {p.amount}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                p.status === 'escrow' ? 'bg-amber-500/10 text-amber-400' :
                                p.status === 'released' ? 'bg-emerald-500/10 text-emerald-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>{p.status}</span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'favourites' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favourites.length === 0 ? (
                  <div className="col-span-full text-center py-16 glass rounded-2xl">
                    <Heart size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">No favourites yet</p>
                  </div>
                ) : favourites.map(f => (
                  <Link to={`/teacher-profile/${f.teacher_id}`} key={f.teacher_id}
                    className="card-3d glass rounded-xl p-5 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                        {f.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{f.full_name}</h3>
                        <p className="text-xs text-slate-500">{f.city}, {f.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star size={14} fill="currentColor" /> <span className="text-sm font-medium">{f.rating}</span>
                      </div>
                      <div className="text-emerald-400 font-bold text-sm">Rs. {f.hourly_rate}/hr</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

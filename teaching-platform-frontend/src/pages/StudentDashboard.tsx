import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI, paymentAPI } from '../services/api';
import { BookOpen, Calendar, IndianRupee, Search, Heart, Clock, Video, Star } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [favourites, setFavourites] = useState<any[]>([]);
  const [tab, setTab] = useState('bookings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, p, f] = await Promise.all([
        studentAPI.getBookings(),
        paymentAPI.list(),
        studentAPI.getFavourites()
      ]);
      setBookings(b);
      setPayments(p);
      setFavourites(f);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingClasses = bookings.filter(b => b.class_status === 'scheduled');
  const completedClasses = bookings.filter(b => b.class_status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-8">
          <h1 className="text-2xl font-bold">Welcome, {user?.full_name}!</h1>
          <p className="text-indigo-200 mt-1">Find teachers, book classes, and start learning</p>
          <Link to="/search" className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-white text-indigo-700 rounded-xl font-medium hover:bg-indigo-50 transition">
            <Search size={18} /> Find Teachers
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Calendar size={22} />, num: upcomingClasses.length, label: 'Upcoming', color: 'bg-blue-50 text-blue-600' },
            { icon: <BookOpen size={22} />, num: completedClasses.length, label: 'Completed', color: 'bg-green-50 text-green-600' },
            { icon: <IndianRupee size={22} />, num: payments.length, label: 'Payments', color: 'bg-purple-50 text-purple-600' },
            { icon: <Heart size={22} />, num: favourites.length, label: 'Favourites', color: 'bg-red-50 text-red-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4">
              <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{s.num}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['bookings', 'payments', 'favourites'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-medium transition capitalize whitespace-nowrap ${
                tab === t ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Bookings Tab */}
            {tab === 'bookings' && (
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                    <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No bookings yet</p>
                    <Link to="/search" className="text-indigo-600 font-medium hover:underline mt-2 inline-block">Find Teachers</Link>
                  </div>
                ) : (
                  bookings.map(b => (
                    <div key={b.id} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-800">{b.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {b.subject_name} | {b.teacher_name} | {b.class_type}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Clock size={14} /> {new Date(b.scheduled_at).toLocaleString()}</span>
                            <span>{b.duration_minutes} min</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            b.class_status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            b.class_status === 'completed' ? 'bg-green-100 text-green-700' :
                            b.class_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {b.class_status}
                          </span>
                          {b.payment_status && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              b.payment_status === 'escrow' ? 'bg-amber-100 text-amber-700' :
                              b.payment_status === 'released' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {b.payment_status}
                            </span>
                          )}
                          {b.meeting_link && b.class_status === 'scheduled' && (
                            <a
                              href={b.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                            >
                              <Video size={14} /> Join
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Payments Tab */}
            {tab === 'payments' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <IndianRupee size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No payments yet</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Class</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Teacher</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.class_title}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.teacher_name}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-800">Rs. {p.amount}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              p.status === 'escrow' ? 'bg-amber-100 text-amber-700' :
                              p.status === 'released' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>{p.status}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Favourites Tab */}
            {tab === 'favourites' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favourites.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm">
                    <Heart size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No favourites yet</p>
                  </div>
                ) : (
                  favourites.map(f => (
                    <Link to={`/teacher-profile/${f.teacher_id}`} key={f.teacher_id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg">
                          {f.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{f.full_name}</h3>
                          <p className="text-sm text-gray-500">{f.city}, {f.state}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={14} fill="currentColor" /> {f.rating}
                        </div>
                        <div className="text-green-600 font-bold text-sm">Rs. {f.hourly_rate}/hr</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

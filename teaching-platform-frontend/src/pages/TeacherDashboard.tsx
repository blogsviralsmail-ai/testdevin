import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI, classAPI, subjectAPI } from '../services/api';
import { BookOpen, Calendar, Clock, Video, Plus, X, Users, Star, TrendingUp, GraduationCap } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('classes');
  const [classes, setClasses] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [classForm, setClassForm] = useState({
    subject_id: '', title: '', description: '', class_type: 'one-on-one',
    scheduled_at: '', duration_minutes: 60, max_students: 1, price: 0
  });

  const profile = user?.teacher_profile;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cls, earn, subj] = await Promise.all([
        teacherAPI.getMyClasses(), teacherAPI.getEarnings(), subjectAPI.list()
      ]);
      setClasses(cls); setEarnings(earn); setSubjects(subj);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await classAPI.create({
        ...classForm, subject_id: Number(classForm.subject_id),
        price: Number(classForm.price), duration_minutes: Number(classForm.duration_minutes),
        max_students: Number(classForm.max_students)
      });
      setShowCreate(false);
      setClassForm({ subject_id: '', title: '', description: '', class_type: 'one-on-one', scheduled_at: '', duration_minutes: 60, max_students: 1, price: 0 });
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to create class'); }
    finally { setCreating(false); }
  };

  const updateClassStatus = async (classId: number, status: string) => {
    try { await classAPI.updateStatus(classId, status); loadData(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  const upcomingClasses = classes.filter(c => c.status === 'scheduled');
  const completedClasses = classes.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <GraduationCap size={22} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Teacher Dashboard</h1>
                <p className="text-slate-400 text-sm">Welcome, {user?.full_name}</p>
                {profile && !profile.is_approved && (
                  <span className="mt-1 inline-block bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full text-xs font-medium">Pending approval</span>
                )}
              </div>
            </div>
            {profile?.is_approved && (
              <button onClick={() => setShowCreate(true)}
                className="mt-4 md:mt-0 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 text-sm">
                <Plus size={16} /> Create Class
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Calendar size={20} />, num: upcomingClasses.length, label: 'Upcoming', color: 'text-blue-600 bg-blue-50', border: 'border-blue-100' },
            { icon: <BookOpen size={20} />, num: completedClasses.length, label: 'Completed', color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' },
            { icon: <TrendingUp size={20} />, num: `Rs ${earnings?.total_earned || 0}`, label: 'Total Earned', color: 'text-purple-600 bg-purple-50', border: 'border-purple-100' },
            { icon: <Star size={20} />, num: profile?.rating || 0, label: 'Rating', color: 'text-amber-600 bg-amber-50', border: 'border-amber-100' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 border ${s.border}`}>
              <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.num}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['classes', 'earnings', 'profile'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-medium transition capitalize whitespace-nowrap text-sm ${
                tab === t ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>{t}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div></div>
        ) : (
          <>
            {/* Classes Tab */}
            {tab === 'classes' && (
              <div className="space-y-3">
                {classes.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <BookOpen size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">No classes yet</p>
                    {profile?.is_approved && (
                      <button onClick={() => setShowCreate(true)} className="text-emerald-600 font-medium hover:underline mt-2 text-sm">Create your first class</button>
                    )}
                  </div>
                ) : classes.map(c => (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{c.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{c.subject_name} &middot; {c.class_type} &middot; Rs. {c.price}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1"><Clock size={13} /> {new Date(c.scheduled_at).toLocaleString()}</span>
                          <span>{c.duration_minutes} min</span>
                          <span className="flex items-center gap-1"><Users size={13} /> {c.booked_count}/{c.max_students}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          c.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          c.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          c.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>{c.status}</span>
                        {c.status === 'scheduled' && (
                          <>
                            <button onClick={() => updateClassStatus(c.id, 'in_progress')} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition">Start</button>
                            <button onClick={() => updateClassStatus(c.id, 'cancelled')} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition">Cancel</button>
                          </>
                        )}
                        {c.status === 'in_progress' && (
                          <button onClick={() => updateClassStatus(c.id, 'completed')} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition">Complete</button>
                        )}
                        {c.meeting_link && (
                          <a href={c.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition">
                            <Video size={13} /> Join
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Earnings Tab */}
            {tab === 'earnings' && earnings && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-emerald-100 p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Earned</div>
                    <div className="text-3xl font-bold text-emerald-600">Rs. {earnings.total_earned}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-amber-100 p-6">
                    <div className="text-sm text-gray-500 mb-1">Pending (Escrow)</div>
                    <div className="text-3xl font-bold text-amber-600">Rs. {earnings.pending_amount}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-blue-100 p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Classes</div>
                    <div className="text-3xl font-bold text-blue-600">{earnings.total_classes}</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Transaction History</h3>
                  {earnings.transactions.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 text-sm">No transactions yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Your Share</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {earnings.transactions.map((t: any) => (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition">
                              <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{t.class_title}</td>
                              <td className="px-5 py-3.5 text-sm text-gray-600">{t.student_name}</td>
                              <td className="px-5 py-3.5 text-sm text-gray-800">Rs. {t.amount}</td>
                              <td className="px-5 py-3.5 text-sm font-bold text-emerald-600">Rs. {t.teacher_amount}</td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  t.status === 'escrow' ? 'bg-amber-50 text-amber-700' :
                                  t.status === 'released' ? 'bg-emerald-50 text-emerald-700' :
                                  'bg-red-50 text-red-700'
                                }`}>{t.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {tab === 'profile' && profile && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Teacher Profile</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {[
                      { label: 'Qualification', value: profile.qualification || 'Not set' },
                      { label: 'Experience', value: `${profile.experience_years} years` },
                      { label: 'Hourly Rate', value: `Rs. ${profile.hourly_rate}`, cls: 'text-emerald-600 font-semibold' },
                      { label: 'Languages', value: profile.languages.join(', ') || 'Not set' },
                      { label: 'Rating', value: `${profile.rating} (${profile.total_reviews} reviews)`, cls: 'text-amber-600 font-semibold' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-gray-500 text-sm">{item.label}</span>
                        <span className={`font-medium text-sm ${item.cls || 'text-gray-900'}`}>{item.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500 text-sm">Status</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${profile.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {profile.is_approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 text-sm">Subjects</h4>
                    {profile.subjects.length > 0 ? (
                      <div className="space-y-2">
                        {profile.subjects.map((s: any) => (
                          <div key={s.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="font-medium text-emerald-700 text-sm">{s.subject_name}</span>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {s.class_levels.map((l: string, i: number) => (
                                <span key={i} className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded border border-gray-200">{l}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-400 text-sm">No subjects added</p>}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-gray-500 text-sm">Bio</span>
                  <p className="mt-1 text-gray-700 text-sm leading-relaxed">{profile.bio || 'No bio set'}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <select required value={classForm.subject_id} onChange={(e) => setClassForm({ ...classForm, subject_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white text-sm">
                    <option value="">Select Subject</option>
                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input required value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm" placeholder="Class title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none" rows={2} placeholder="What will you teach?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Type</label>
                    <select value={classForm.class_type} onChange={(e) => setClassForm({ ...classForm, class_type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm">
                      <option value="one-on-one">One-on-One</option><option value="group">Group</option><option value="demo">Demo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time</label>
                    <input type="datetime-local" required value={classForm.scheduled_at} onChange={(e) => setClassForm({ ...classForm, scheduled_at: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                    <select value={classForm.duration_minutes} onChange={(e) => setClassForm({ ...classForm, duration_minutes: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm">
                      <option value={30}>30 min</option><option value={60}>1 hr</option><option value={90}>1.5 hr</option><option value={120}>2 hr</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Students</label>
                    <input type="number" min={1} value={classForm.max_students} onChange={(e) => setClassForm({ ...classForm, max_students: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (Rs)</label>
                    <input type="number" min={0} value={classForm.price} onChange={(e) => setClassForm({ ...classForm, price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={creating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/25">
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Create Class</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

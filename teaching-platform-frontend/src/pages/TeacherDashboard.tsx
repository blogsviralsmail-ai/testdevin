import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI, classAPI, subjectAPI } from '../services/api';
import { BookOpen, Calendar, Clock, Video, Plus, X, Users, Star, TrendingUp, GraduationCap, Save } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('classes');
  const [classes, setClasses] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<{day_of_week: number; start_time: string; end_time: string}[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityMsg, setAvailabilityMsg] = useState('');
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

  const toggleAvailabilityDay = (dayIdx: number) => {
    const exists = availabilitySlots.find(s => s.day_of_week === dayIdx);
    if (exists) {
      setAvailabilitySlots(prev => prev.filter(s => s.day_of_week !== dayIdx));
    } else {
      setAvailabilitySlots(prev => [...prev, { day_of_week: dayIdx, start_time: '09:00', end_time: '18:00' }]);
    }
  };

  const updateSlotTime = (dayIdx: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailabilitySlots(prev => prev.map(s => s.day_of_week === dayIdx ? { ...s, [field]: value } : s));
  };

  const saveAvailability = async () => {
    setSavingAvailability(true);
    setAvailabilityMsg('');
    try {
      await teacherAPI.setAvailability(availabilitySlots);
      setAvailabilityMsg('Availability saved successfully!');
      setTimeout(() => setAvailabilityMsg(''), 3000);
    } catch (err) {
      setAvailabilityMsg('Failed to save availability');
    } finally {
      setSavingAvailability(false);
    }
  };

  const upcomingClasses = classes.filter(c => c.status === 'scheduled');
  const completedClasses = classes.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-5 left-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl animate-float-slow"></div>
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse3d">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white">Teacher Dashboard</h1>
                <p className="text-slate-400 text-sm">Welcome, {user?.full_name}</p>
                {profile && !profile.is_approved && (
                  <span className="mt-1 inline-block bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full text-xs font-bold">Pending approval</span>
                )}
              </div>
            </div>
            {profile?.is_approved && (
              <button onClick={() => setShowCreate(true)}
                className="mt-4 md:mt-0 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 text-sm hover:scale-105 transform">
                <Plus size={16} /> Create Class
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Calendar size={20} />, num: upcomingClasses.length, label: 'Upcoming', color: 'text-cyan-400 bg-cyan-500/10', border: 'border-cyan-500/20' },
            { icon: <BookOpen size={20} />, num: completedClasses.length, label: 'Completed', color: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/20' },
            { icon: <TrendingUp size={20} />, num: `Rs ${earnings?.total_earned || 0}`, label: 'Total Earned', color: 'text-purple-400 bg-purple-500/10', border: 'border-purple-500/20' },
            { icon: <Star size={20} />, num: profile?.rating || 0, label: 'Rating', color: 'text-amber-400 bg-amber-500/10', border: 'border-amber-500/20' },
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
          {['classes', 'earnings', 'availability', 'profile'].map(t => (
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
            {tab === 'classes' && (
              <div className="space-y-3">
                {classes.length === 0 ? (
                  <div className="text-center py-16 glass rounded-2xl">
                    <BookOpen size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">No classes yet</p>
                    {profile?.is_approved && (
                      <button onClick={() => setShowCreate(true)} className="text-emerald-400 font-medium hover:underline mt-2 text-sm">Create your first class</button>
                    )}
                  </div>
                ) : classes.map(c => (
                  <div key={c.id} className="glass rounded-xl p-5 hover:bg-white/10 transition">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{c.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{c.subject_name} &middot; {c.class_type} &middot; Rs. {c.price}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Clock size={13} /> {new Date(c.scheduled_at).toLocaleString()}</span>
                          <span>{c.duration_minutes} min</span>
                          <span className="flex items-center gap-1"><Users size={13} /> {c.booked_count}/{c.max_students}</span>
                        </div>
                        {c.students && c.students.length > 0 && (
                          <div className="mt-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                            <p className="text-xs font-bold text-cyan-400 mb-1.5 flex items-center gap-1"><Users size={12} /> Booked Students:</p>
                            <div className="space-y-1">
                              {c.students.map((s: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                                    {s.full_name?.charAt(0) || '?'}
                                  </div>
                                  <span className="font-medium text-white">{s.full_name}</span>
                                  <span className="text-slate-500 text-xs">({s.email})</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    s.booking_status === 'booked' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400'
                                  }`}>{s.booking_status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          c.status === 'scheduled' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          c.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          c.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>{c.status}</span>
                        {c.status === 'scheduled' && (
                          <>
                            <button onClick={() => updateClassStatus(c.id, 'in_progress')} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-400 transition">Start</button>
                            <button onClick={() => updateClassStatus(c.id, 'cancelled')} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-400 transition">Cancel</button>
                          </>
                        )}
                        {c.status === 'in_progress' && (
                          <button onClick={() => updateClassStatus(c.id, 'completed')} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-400 transition">Complete</button>
                        )}
                        {c.meeting_link && (
                          <a href={c.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-bold hover:from-emerald-400 hover:to-teal-400 transition">
                            <Video size={13} /> Join
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'earnings' && earnings && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="glass rounded-xl border border-emerald-500/20 p-6">
                    <div className="text-sm text-slate-400 mb-1">Total Earned</div>
                    <div className="text-3xl font-black text-emerald-400">Rs. {earnings.total_earned}</div>
                  </div>
                  <div className="glass rounded-xl border border-amber-500/20 p-6">
                    <div className="text-sm text-slate-400 mb-1">Pending (Escrow)</div>
                    <div className="text-3xl font-black text-amber-400">Rs. {earnings.pending_amount}</div>
                  </div>
                  <div className="glass rounded-xl border border-cyan-500/20 p-6">
                    <div className="text-sm text-slate-400 mb-1">Total Classes</div>
                    <div className="text-3xl font-black text-cyan-400">{earnings.total_classes}</div>
                  </div>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-4">Transaction History</h3>
                  {earnings.transactions.length === 0 ? (
                    <p className="text-slate-500 text-center py-8 text-sm">No transactions yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/5">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Class</th>
                            <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Student</th>
                            <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Total</th>
                            <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Your Share</th>
                            <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {earnings.transactions.map((t: any) => (
                            <tr key={t.id} className="hover:bg-white/5 transition">
                              <td className="px-5 py-3.5 text-sm font-medium text-white">{t.class_title}</td>
                              <td className="px-5 py-3.5 text-sm text-slate-400">{t.student_name}</td>
                              <td className="px-5 py-3.5 text-sm text-slate-300">Rs. {t.amount}</td>
                              <td className="px-5 py-3.5 text-sm font-bold text-emerald-400">Rs. {t.teacher_amount}</td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  t.status === 'escrow' ? 'bg-amber-500/10 text-amber-400' :
                                  t.status === 'released' ? 'bg-emerald-500/10 text-emerald-400' :
                                  'bg-red-500/10 text-red-400'
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

            {tab === 'availability' && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Manage Availability</h3>
                    <p className="text-sm text-slate-400">Set your available days and time slots for students to book</p>
                  </div>
                  <button onClick={saveAvailability} disabled={savingAvailability}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center gap-2 disabled:opacity-50">
                    {savingAvailability ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Save Availability
                  </button>
                </div>
                {availabilityMsg && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-bold ${
                    availabilityMsg.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>{availabilityMsg}</div>
                )}
                <div className="space-y-3">
                  {DAYS.map((day, idx) => {
                    const slot = availabilitySlots.find(s => s.day_of_week === idx);
                    const isActive = !!slot;
                    return (
                      <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition ${
                        isActive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'
                      }`}>
                        <button onClick={() => toggleAvailabilityDay(idx)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition ${
                            isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/10'
                          }`}>
                          {isActive ? '✓' : ''}
                        </button>
                        <span className={`font-medium w-24 text-sm ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>{day}</span>
                        {isActive && slot && (
                          <div className="flex items-center gap-2">
                            <input type="time" value={slot.start_time}
                              onChange={e => updateSlotTime(idx, 'start_time', e.target.value)}
                              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                            <span className="text-slate-500 text-sm">to</span>
                            <input type="time" value={slot.end_time}
                              onChange={e => updateSlotTime(idx, 'end_time', e.target.value)}
                              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                          </div>
                        )}
                        {!isActive && <span className="text-slate-600 text-sm">Not available</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'profile' && profile && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Your Teacher Profile</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {[
                      { label: 'Qualification', value: profile.qualification || 'Not set' },
                      { label: 'Experience', value: `${profile.experience_years} years` },
                      { label: 'Hourly Rate', value: `Rs. ${profile.hourly_rate}`, cls: 'text-emerald-400 font-bold' },
                      { label: 'Languages', value: profile.languages.join(', ') || 'Not set' },
                      { label: 'Rating', value: `${profile.rating} (${profile.total_reviews} reviews)`, cls: 'text-amber-400 font-bold' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-slate-400 text-sm">{item.label}</span>
                        <span className={`font-medium text-sm ${item.cls || 'text-white'}`}>{item.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-400 text-sm">Status</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${profile.is_approved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {profile.is_approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-300 mb-2 text-sm">Subjects</h4>
                    {profile.subjects.length > 0 ? (
                      <div className="space-y-2">
                        {profile.subjects.map((s: any) => (
                          <div key={s.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="font-medium text-emerald-400 text-sm">{s.subject_name}</span>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {s.class_levels.map((l: string, i: number) => (
                                <span key={i} className="bg-white/5 text-slate-400 text-xs px-2 py-0.5 rounded border border-white/10">{l}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-500 text-sm">No subjects added</p>}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <span className="text-slate-400 text-sm">Bio</span>
                  <p className="mt-1 text-slate-300 text-sm leading-relaxed">{profile.bio || 'No bio set'}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-dark rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Class</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/5 rounded-xl transition text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
                  <select required value={classForm.subject_id} onChange={(e) => setClassForm({ ...classForm, subject_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Class Title</label>
                  <input required value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                    placeholder="e.g. Advanced Physics Chapter 5"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    rows={2} placeholder="Brief description..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none text-sm text-white placeholder-slate-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
                    <select value={classForm.class_type} onChange={(e) => setClassForm({ ...classForm, class_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white">
                      <option value="one-on-one">One-on-One</option>
                      <option value="group">Group Class</option>
                      <option value="demo">Demo (Free Trial)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Schedule</label>
                    <input required type="datetime-local" value={classForm.scheduled_at}
                      onChange={(e) => setClassForm({ ...classForm, scheduled_at: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration (min)</label>
                    <input type="number" value={classForm.duration_minutes} min={15} max={180}
                      onChange={(e) => setClassForm({ ...classForm, duration_minutes: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Students</label>
                    <input type="number" value={classForm.max_students} min={1} max={50}
                      onChange={(e) => setClassForm({ ...classForm, max_students: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Price (Rs.)</label>
                  <input required type="number" value={classForm.price} min={0}
                    onChange={(e) => setClassForm({ ...classForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm text-white" />
                </div>
                <button type="submit" disabled={creating}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50 text-sm hover:scale-105 transform">
                  {creating ? 'Creating...' : 'Create Class'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

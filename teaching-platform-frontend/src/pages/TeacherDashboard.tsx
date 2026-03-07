import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI, classAPI, subjectAPI } from '../services/api';
import { BookOpen, Calendar, IndianRupee, Clock, Video, Plus, X, Users, Star } from 'lucide-react';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cls, earn, subj] = await Promise.all([
        teacherAPI.getMyClasses(),
        teacherAPI.getEarnings(),
        subjectAPI.list()
      ]);
      setClasses(cls);
      setEarnings(earn);
      setSubjects(subj);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await classAPI.create({
        ...classForm,
        subject_id: Number(classForm.subject_id),
        price: Number(classForm.price),
        duration_minutes: Number(classForm.duration_minutes),
        max_students: Number(classForm.max_students)
      });
      setShowCreate(false);
      setClassForm({ subject_id: '', title: '', description: '', class_type: 'one-on-one', scheduled_at: '', duration_minutes: 60, max_students: 1, price: 0 });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const updateClassStatus = async (classId: number, status: string) => {
    try {
      await classAPI.updateStatus(classId, status);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const upcomingClasses = classes.filter(c => c.status === 'scheduled');
  const completedClasses = classes.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-emerald-200 mt-1">Welcome, {user?.full_name}</p>
              {profile && !profile.is_approved && (
                <p className="mt-2 bg-yellow-500/20 text-yellow-200 px-3 py-1 rounded-lg text-sm inline-block">
                  Profile pending approval by admin
                </p>
              )}
            </div>
            {profile?.is_approved && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 md:mt-0 px-5 py-2.5 bg-white text-emerald-700 rounded-xl font-medium hover:bg-emerald-50 transition flex items-center gap-2"
              >
                <Plus size={18} /> Create Class
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Calendar size={22} />, num: upcomingClasses.length, label: 'Upcoming', color: 'bg-blue-50 text-blue-600' },
            { icon: <BookOpen size={22} />, num: completedClasses.length, label: 'Completed', color: 'bg-green-50 text-green-600' },
            { icon: <IndianRupee size={22} />, num: `${earnings?.total_earned || 0}`, label: 'Total Earned', color: 'bg-purple-50 text-purple-600' },
            { icon: <Star size={22} />, num: profile?.rating || 0, label: 'Rating', color: 'bg-amber-50 text-amber-600' },
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
          {['classes', 'earnings', 'profile'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl font-medium transition capitalize whitespace-nowrap ${
                tab === t ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >{t}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Classes Tab */}
            {tab === 'classes' && (
              <div className="space-y-4">
                {classes.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                    <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No classes yet</p>
                    {profile?.is_approved && (
                      <button onClick={() => setShowCreate(true)} className="text-emerald-600 font-medium hover:underline mt-2">Create your first class</button>
                    )}
                  </div>
                ) : (
                  classes.map(c => (
                    <div key={c.id} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-800">{c.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{c.subject_name} | {c.class_type} | Rs. {c.price}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Clock size={14} /> {new Date(c.scheduled_at).toLocaleString()}</span>
                            <span>{c.duration_minutes} min</span>
                            <span className="flex items-center gap-1"><Users size={14} /> {c.booked_count}/{c.max_students}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            c.status === 'completed' ? 'bg-green-100 text-green-700' :
                            c.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{c.status}</span>
                          {c.status === 'scheduled' && (
                            <>
                              <button onClick={() => updateClassStatus(c.id, 'in_progress')} className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">Start</button>
                              <button onClick={() => updateClassStatus(c.id, 'cancelled')} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">Cancel</button>
                            </>
                          )}
                          {c.status === 'in_progress' && (
                            <button onClick={() => updateClassStatus(c.id, 'completed')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">Complete</button>
                          )}
                          {c.meeting_link && (
                            <a href={c.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
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

            {/* Earnings Tab */}
            {tab === 'earnings' && earnings && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Earned</div>
                    <div className="text-3xl font-bold text-green-600">Rs. {earnings.total_earned}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-gray-500 mb-1">Pending (Escrow)</div>
                    <div className="text-3xl font-bold text-amber-600">Rs. {earnings.pending_amount}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Classes</div>
                    <div className="text-3xl font-bold text-indigo-600">{earnings.total_classes}</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Transaction History</h3>
                  {earnings.transactions.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No transactions yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Class</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Your Share</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {earnings.transactions.map((t: any) => (
                            <tr key={t.id}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.class_title}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{t.student_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-800">Rs. {t.amount}</td>
                              <td className="px-4 py-3 text-sm font-bold text-green-600">Rs. {t.teacher_amount}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  t.status === 'escrow' ? 'bg-amber-100 text-amber-700' :
                                  t.status === 'released' ? 'bg-green-100 text-green-700' :
                                  'bg-red-100 text-red-700'
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
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Your Teacher Profile</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3">
                      <div><span className="text-gray-500 text-sm">Qualification:</span> <span className="font-medium">{profile.qualification || 'Not set'}</span></div>
                      <div><span className="text-gray-500 text-sm">Experience:</span> <span className="font-medium">{profile.experience_years} years</span></div>
                      <div><span className="text-gray-500 text-sm">Hourly Rate:</span> <span className="font-medium text-green-600">Rs. {profile.hourly_rate}</span></div>
                      <div><span className="text-gray-500 text-sm">Languages:</span> <span className="font-medium">{profile.languages.join(', ') || 'Not set'}</span></div>
                      <div><span className="text-gray-500 text-sm">Rating:</span> <span className="font-medium text-amber-500">{profile.rating} ({profile.total_reviews} reviews)</span></div>
                      <div><span className="text-gray-500 text-sm">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${profile.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {profile.is_approved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Subjects</h4>
                    {profile.subjects.length > 0 ? (
                      <div className="space-y-2">
                        {profile.subjects.map((s: any) => (
                          <div key={s.id} className="p-2 bg-gray-50 rounded-lg">
                            <span className="font-medium text-indigo-700">{s.subject_name}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.class_levels.map((l: string, i: number) => (
                                <span key={i} className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded">{l}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No subjects added</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-gray-500 text-sm">Bio:</span>
                  <p className="mt-1 text-gray-700">{profile.bio || 'No bio set'}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Create New Class</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select required value={classForm.subject_id} onChange={(e) => setClassForm({ ...classForm, subject_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">Select Subject</option>
                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input required value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Class title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" rows={2} placeholder="What will you teach?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                    <select value={classForm.class_type} onChange={(e) => setClassForm({ ...classForm, class_type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                      <option value="one-on-one">One-on-One</option>
                      <option value="group">Group</option>
                      <option value="demo">Demo (Free)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                    <input type="number" min="1" value={classForm.max_students} onChange={(e) => setClassForm({ ...classForm, max_students: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input type="datetime-local" required value={classForm.scheduled_at} onChange={(e) => setClassForm({ ...classForm, scheduled_at: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input type="number" min="15" value={classForm.duration_minutes} onChange={(e) => setClassForm({ ...classForm, duration_minutes: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs.)</label>
                  <input type="number" min="0" required value={classForm.price} onChange={(e) => setClassForm({ ...classForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0 for free demo" />
                </div>
                <p className="text-xs text-gray-400">Jitsi Meet link will be auto-generated for the class</p>
                <button type="submit" disabled={creating}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50">
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

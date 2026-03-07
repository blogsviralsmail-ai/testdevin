import { useState, useEffect } from 'react';
import { adminAPI, paymentAPI, supportAPI, subjectAPI } from '../services/api';
import {
  Users, BookOpen, IndianRupee, Shield, CheckCircle, XCircle, AlertCircle, Ticket,
  TrendingUp, ArrowUpRight, ArrowDownRight, UserPlus, Search,
  BarChart3, Wallet, Clock, Calendar, MapPin, RefreshCw, X,
  Activity, Banknote, GraduationCap, MessageSquare, CreditCard, Building2, Send
} from 'lucide-react';

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    email: '', full_name: '', phone: '', city: '', state: 'Rajasthan', password: 'student123'
  });
  const [addingStudent, setAddingStudent] = useState(false);
  const [addStudentMsg, setAddStudentMsg] = useState({ type: '', text: '' });
  const [addTeacherForm, setAddTeacherForm] = useState({
    email: '', full_name: '', phone: '', city: '', state: 'Rajasthan',
    password: 'teacher123', bio: '', experience_years: 3, hourly_rate: 150,
    languages: ['Hindi', 'English'], qualification: 'B.Ed',
    subject_ids: [] as number[], auto_approve: true,
    bank_name: '', bank_account: '', bank_ifsc: '', upi_id: ''
  });
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [addTeacherMsg, setAddTeacherMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadDashboard();
    subjectAPI.list().then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'teachers') loadTeachers();
    if (tab === 'students') loadStudents();
    if (tab === 'payments') loadPayments();
    if (tab === 'classes') loadClasses();
    if (tab === 'tickets') loadTickets();
  }, [tab]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.dashboard();
      setDashboard(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadTeachers = async () => {
    try {
      const data = await adminAPI.listUsers({ role: 'teacher', search: teacherSearch, per_page: 200 });
      setTeachers(data.users);
    } catch (err) { console.error(err); }
  };

  const loadStudents = async () => {
    try {
      const data = await adminAPI.listUsers({ role: 'student', search: studentSearch, per_page: 200 });
      setStudents(data.users);
    } catch (err) { console.error(err); }
  };

  const loadPayments = async () => {
    try {
      const [p, s] = await Promise.all([
        paymentAPI.list(paymentFilter || undefined),
        paymentAPI.stats()
      ]);
      setPayments(p);
      setPaymentStats(s);
    } catch (err) { console.error(err); }
  };

  const loadClasses = async () => {
    try {
      const data = await adminAPI.listClasses({ per_page: 100 });
      setClasses(data.classes);
    } catch (err) { console.error(err); }
  };

  const loadTickets = async () => {
    try {
      const data = await supportAPI.listTickets();
      setTickets(data);
    } catch (err) { console.error(err); }
  };

  const handleUserAction = async (userId: number, action: string, role: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await adminAPI.updateUserStatus(userId, action);
      if (role === 'teacher') loadTeachers(); else loadStudents();
      loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handlePaymentAction = async (paymentId: number, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this payment?`)) return;
    try {
      if (action === 'release') await paymentAPI.release(paymentId);
      else if (action === 'refund') await paymentAPI.refund(paymentId);
      else if (action === 'payout_bank') await paymentAPI.payout(paymentId, 'bank_transfer');
      else if (action === 'payout_upi') await paymentAPI.payout(paymentId, 'upi');
      loadPayments();
      loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleTicketStatus = async (ticketId: number, status: string) => {
    try {
      await supportAPI.updateTicketStatus(ticketId, status);
      loadTickets();
      loadDashboard();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleAddTeacher = async () => {
    if (!addTeacherForm.email || !addTeacherForm.full_name) {
      setAddTeacherMsg({ type: 'error', text: 'Name and Email are required' });
      return;
    }
    setAddingTeacher(true);
    setAddTeacherMsg({ type: '', text: '' });
    try {
      await adminAPI.addTeacher(addTeacherForm);
      setAddTeacherMsg({ type: 'success', text: 'Teacher added successfully!' });
      setAddTeacherForm({
        email: '', full_name: '', phone: '', city: '', state: 'Rajasthan',
        password: 'teacher123', bio: '', experience_years: 3, hourly_rate: 150,
        languages: ['Hindi', 'English'], qualification: 'B.Ed',
        subject_ids: [], auto_approve: true,
        bank_name: '', bank_account: '', bank_ifsc: '', upi_id: ''
      });
      loadDashboard();
      if (tab === 'teachers') loadTeachers();
      setTimeout(() => { setShowAddTeacher(false); setAddTeacherMsg({ type: '', text: '' }); }, 1500);
    } catch (err: any) {
      setAddTeacherMsg({ type: 'error', text: err.message || 'Failed to add teacher' });
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleAddStudent = async () => {
    if (!addStudentForm.email || !addStudentForm.full_name) {
      setAddStudentMsg({ type: 'error', text: 'Name and Email are required' });
      return;
    }
    setAddingStudent(true);
    setAddStudentMsg({ type: '', text: '' });
    try {
      await adminAPI.addStudent(addStudentForm);
      setAddStudentMsg({ type: 'success', text: 'Student added successfully!' });
      setAddStudentForm({ email: '', full_name: '', phone: '', city: '', state: 'Rajasthan', password: 'student123' });
      loadDashboard();
      if (tab === 'students') loadStudents();
      setTimeout(() => { setShowAddStudent(false); setAddStudentMsg({ type: '', text: '' }); }, 1500);
    } catch (err: any) {
      setAddStudentMsg({ type: 'error', text: err.message || 'Failed to add student' });
    } finally {
      setAddingStudent(false);
    }
  };

  const toggleSubject = (id: number) => {
    setAddTeacherForm(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(id)
        ? prev.subject_ids.filter(s => s !== id)
        : [...prev.subject_ids, id]
    }));
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
    { id: 'teachers', label: 'Teachers', icon: <Users size={16} /> },
    { id: 'students', label: 'Students', icon: <GraduationCap size={16} /> },
    { id: 'payments', label: 'Payments', icon: <Wallet size={16} /> },
    { id: 'classes', label: 'Classes', icon: <BookOpen size={16} /> },
    { id: 'tickets', label: 'Tickets', icon: <Ticket size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Control Center</h1>
                <p className="text-slate-400 text-sm">GuruConnect Platform Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { loadDashboard(); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm transition backdrop-blur-sm">
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={() => setShowAddStudent(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm transition backdrop-blur-sm">
                <UserPlus size={14} /> Add Student
              </button>
              <button onClick={() => setShowAddTeacher(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-white text-sm font-medium transition shadow-lg">
                <UserPlus size={14} /> Add Teacher
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-2xl shadow-sm p-1.5 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label}
              {t.id === 'tickets' && dashboard?.open_tickets > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-5 text-center">{dashboard.open_tickets}</span>
              )}
            </button>
          ))}
        </div>

        {/* =============== DASHBOARD TAB =============== */}
        {tab === 'dashboard' && (
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading dashboard...</p>
              </div>
            </div>
          ) : dashboard && (
            <div className="space-y-6">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                      <GraduationCap size={22} className="text-blue-600" />
                    </div>
                    <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-1 rounded-lg">Students</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{dashboard.total_students}</div>
                  <p className="text-xs text-gray-400 mt-1">Registered students</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                      <Users size={22} className="text-emerald-600" />
                    </div>
                    <span className="text-xs text-emerald-500 font-medium bg-emerald-50 px-2 py-1 rounded-lg">Teachers</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{dashboard.total_teachers}</div>
                  <p className="text-xs text-gray-400 mt-1">Active teachers</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                      <Clock size={22} className="text-amber-600" />
                    </div>
                    {dashboard.pending_teachers > 0 && (
                      <span className="text-xs text-amber-500 font-medium bg-amber-50 px-2 py-1 rounded-lg animate-pulse">Action Needed</span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{dashboard.pending_teachers}</div>
                  <p className="text-xs text-gray-400 mt-1">Pending approvals</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                      <BookOpen size={22} className="text-purple-600" />
                    </div>
                    <span className="text-xs text-purple-500 font-medium bg-purple-50 px-2 py-1 rounded-lg">Classes</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{dashboard.total_classes}</div>
                  <p className="text-xs text-gray-400 mt-1">Total classes</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-5 text-white group hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition">
                      <IndianRupee size={22} />
                    </div>
                    <TrendingUp size={18} className="text-green-200" />
                  </div>
                  <div className="text-3xl font-bold">Rs {dashboard.total_revenue}</div>
                  <p className="text-xs text-green-200 mt-1">Platform Revenue</p>
                </div>
              </div>

              {/* Middle Row - Stats Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Classes Overview */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity size={18} className="text-indigo-500" /> Classes Overview</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Scheduled</span>
                      </div>
                      <span className="font-bold text-blue-700">{dashboard.active_classes}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                      <span className="font-bold text-green-700">{dashboard.completed_classes}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Total Bookings</span>
                      </div>
                      <span className="font-bold text-purple-700">{dashboard.total_bookings}</span>
                    </div>
                  </div>
                </div>

                {/* Escrow & Financial */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Banknote size={18} className="text-green-500" /> Financial Overview</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-amber-600 font-medium mb-1">IN ESCROW</p>
                          <p className="text-2xl font-bold text-amber-700">Rs {dashboard.escrow_amount}</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center">
                          <Clock size={20} className="text-amber-700" />
                        </div>
                      </div>
                      <p className="text-xs text-amber-500 mt-2">Payments held safely</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 font-medium mb-1">PLATFORM EARNINGS</p>
                          <p className="text-2xl font-bold text-green-700">Rs {dashboard.total_revenue}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center">
                          <TrendingUp size={20} className="text-green-700" />
                        </div>
                      </div>
                      <p className="text-xs text-green-500 mt-2">10% commission earned</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Support */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><MessageSquare size={18} className="text-red-500" /> Support & Actions</h3>
                  </div>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${dashboard.open_tickets > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">OPEN TICKETS</p>
                          <p className={`text-2xl font-bold ${dashboard.open_tickets > 0 ? 'text-red-600' : 'text-gray-400'}`}>{dashboard.open_tickets}</p>
                        </div>
                        <Ticket size={24} className={dashboard.open_tickets > 0 ? 'text-red-400' : 'text-gray-300'} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setTab('teachers')} className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-center transition">
                        <Users size={20} className="text-emerald-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-emerald-700">Teachers</p>
                      </button>
                      <button onClick={() => setTab('students')} className="p-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition">
                        <GraduationCap size={20} className="text-blue-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-blue-700">Students</p>
                      </button>
                      <button onClick={() => setShowAddTeacher(true)} className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-center transition">
                        <UserPlus size={20} className="text-indigo-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-indigo-600">Add Teacher</p>
                      </button>
                      <button onClick={() => setShowAddStudent(true)} className="p-3 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition">
                        <UserPlus size={20} className="text-purple-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-purple-600">Add Student</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              {dashboard.recent_bookings?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-500" /> Recent Bookings
                  </h3>
                  <div className="space-y-3">
                    {dashboard.recent_bookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl hover:from-indigo-50 hover:to-purple-50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                            {b.student_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">{b.student_name}</span>
                            <span className="text-gray-400 mx-2">booked</span>
                            <span className="text-indigo-600 font-medium">{b.class_title}</span>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(b.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          b.status === 'booked' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* =============== TEACHERS TAB =============== */}
        {tab === 'teachers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-64">
                  <Search size={16} className="text-gray-400" />
                  <input type="text" placeholder="Search teachers by name or email..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadTeachers()}
                    className="bg-transparent text-sm outline-none flex-1" />
                </div>
                <button onClick={loadTeachers} className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl text-sm font-medium hover:from-slate-900 hover:to-black transition shadow">
                  <Search size={14} className="inline mr-1" /> Search
                </button>
                <button onClick={() => setShowAddTeacher(true)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-green-700 transition shadow">
                  <UserPlus size={14} className="inline mr-1" /> Add Teacher
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center justify-between">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2"><Users size={18} /> All Teachers ({teachers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate / Rating</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Details</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {teachers.map(u => (
                      <tr key={u.id} className="hover:bg-emerald-50/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-emerald-400 to-green-600">
                              {u.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{u.full_name}</p>
                              <p className="text-xs text-gray-400">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-600">{u.email}</p>
                          <p className="text-xs text-gray-400">{u.phone || '-'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400" />
                            {u.city || '-'}{u.state ? `, ${u.state}` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {u.teacher_profile && (
                            <div className="text-xs space-y-0.5">
                              <p className="text-gray-500">Rate: <span className="font-medium text-gray-700">Rs {u.teacher_profile.hourly_rate}/hr</span></p>
                              <p className="text-gray-500">Rating: <span className="font-medium text-amber-600">{u.teacher_profile.rating}</span></p>
                              <p className="text-gray-500">Classes: <span className="font-medium text-gray-700">{u.teacher_profile.total_classes}</span></p>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {u.teacher_profile?.bank_name ? (
                            <div className="text-xs space-y-0.5">
                              <p className="text-gray-500">{u.teacher_profile.bank_name}</p>
                              <p className="text-gray-500">A/C: <span className="font-mono">{u.teacher_profile.bank_account?.replace(/(.{4})/g, '$1 ')}</span></p>
                              <p className="text-gray-500">IFSC: <span className="font-mono">{u.teacher_profile.bank_ifsc}</span></p>
                              {u.teacher_profile.upi_id && <p className="text-gray-500">UPI: <span className="font-medium text-indigo-600">{u.teacher_profile.upi_id}</span></p>}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not provided</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full w-fit">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full w-fit">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Suspended
                              </span>
                            )}
                            {u.teacher_profile && !u.teacher_profile.is_approved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full w-fit animate-pulse">
                                <AlertCircle size={10} /> Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            {u.teacher_profile && !u.teacher_profile.is_approved && (
                              <button onClick={() => handleUserAction(u.id, 'approve', 'teacher')}
                                className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium shadow-sm transition flex items-center gap-1">
                                <CheckCircle size={12} /> Approve
                              </button>
                            )}
                            {u.is_active ? (
                              <button onClick={() => handleUserAction(u.id, 'suspend', 'teacher')}
                                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 font-medium transition flex items-center gap-1">
                                <XCircle size={12} /> Suspend
                              </button>
                            ) : (
                              <button onClick={() => handleUserAction(u.id, 'activate', 'teacher')}
                                className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200 font-medium transition flex items-center gap-1">
                                <CheckCircle size={12} /> Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {teachers.length === 0 && (
                <div className="text-center py-16">
                  <Users size={48} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 font-medium">No teachers found</p>
                  <p className="text-xs text-gray-300 mt-1">Try adjusting your search or add a new teacher</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============== STUDENTS TAB =============== */}
        {tab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-64">
                  <Search size={16} className="text-gray-400" />
                  <input type="text" placeholder="Search students by name or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadStudents()}
                    className="bg-transparent text-sm outline-none flex-1" />
                </div>
                <button onClick={loadStudents} className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl text-sm font-medium hover:from-slate-900 hover:to-black transition shadow">
                  <Search size={14} className="inline mr-1" /> Search
                </button>
                <button onClick={() => setShowAddStudent(true)} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition shadow">
                  <UserPlus size={14} className="inline mr-1" /> Add Student
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                <h3 className="font-bold text-blue-800 flex items-center gap-2"><GraduationCap size={18} /> All Students ({students.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map(u => (
                      <tr key={u.id} className="hover:bg-blue-50/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-400 to-indigo-600">
                              {u.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{u.full_name}</p>
                              <p className="text-xs text-gray-400">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{u.email}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{u.phone || '-'}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400" />
                            {u.city || '-'}{u.state ? `, ${u.state}` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full w-fit">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full w-fit">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Suspended
                              </span>
                            )}
                            {u.is_verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full w-fit">
                                <CheckCircle size={10} /> Verified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            {u.is_active ? (
                              <button onClick={() => handleUserAction(u.id, 'suspend', 'student')}
                                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 font-medium transition flex items-center gap-1">
                                <XCircle size={12} /> Suspend
                              </button>
                            ) : (
                              <button onClick={() => handleUserAction(u.id, 'activate', 'student')}
                                className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200 font-medium transition flex items-center gap-1">
                                <CheckCircle size={12} /> Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {students.length === 0 && (
                <div className="text-center py-16">
                  <GraduationCap size={48} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 font-medium">No students found</p>
                  <p className="text-xs text-gray-300 mt-1">Try adjusting your search or add a new student</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============== PAYMENTS TAB =============== */}
        {tab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Stats */}
            {paymentStats && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-amber-500" />
                    <span className="text-xs text-amber-600 font-semibold uppercase">In Escrow</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700">Rs {paymentStats.total_escrow}</div>
                  <p className="text-xs text-amber-400 mt-1">Payments held</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight size={16} className="text-green-500" />
                    <span className="text-xs text-green-600 font-semibold uppercase">Released</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">Rs {paymentStats.total_released}</div>
                  <p className="text-xs text-green-400 mt-1">Paid to teachers</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownRight size={16} className="text-red-500" />
                    <span className="text-xs text-red-600 font-semibold uppercase">Refunded</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">Rs {paymentStats.total_refunded}</div>
                  <p className="text-xs text-red-400 mt-1">Returned to students</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-indigo-500" />
                    <span className="text-xs text-indigo-600 font-semibold uppercase">Platform Fee</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-700">Rs {paymentStats.total_platform_fee}</div>
                  <p className="text-xs text-indigo-400 mt-1">10% commission</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={16} className="text-gray-500" />
                    <span className="text-xs text-gray-600 font-semibold uppercase">Total</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{paymentStats.total_transactions}</div>
                  <p className="text-xs text-gray-400 mt-1">Transactions</p>
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex gap-2">
              {['', 'escrow', 'released', 'refunded'].map(f => (
                <button key={f} onClick={() => { setPaymentFilter(f); setTimeout(loadPayments, 100); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    paymentFilter === f
                      ? 'bg-slate-800 text-white shadow'
                      : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                  }`}
                >{f || 'All'}</button>
              ))}
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><IndianRupee size={18} className="text-green-500" /> All Transactions ({payments.length})</h3>
                <p className="text-xs text-gray-400 mt-1">Pay-In from students, Pay-Out to teachers</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pay-In (Student)</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pay-Out (Teacher)</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee (10%)</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher Gets</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payout</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-indigo-50/30 transition">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-800">{p.class_title}</p>
                          <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                          {p.transaction_id && <p className="text-xs text-gray-300 font-mono">{p.transaction_id}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <ArrowDownRight size={14} className="text-green-500" />
                            <div>
                              <span className="text-sm text-gray-700 block">{p.student_name}</span>
                              {p.card_last4 && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <CreditCard size={10} /> {p.card_brand} ****{p.card_last4}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <ArrowUpRight size={14} className="text-blue-500" />
                            <span className="text-sm text-gray-700">{p.teacher_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-gray-800">Rs {p.amount}</td>
                        <td className="px-5 py-4 text-sm font-medium text-indigo-600">Rs {p.platform_fee}</td>
                        <td className="px-5 py-4 text-sm font-medium text-green-600">Rs {p.teacher_amount}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            p.status === 'escrow' ? 'bg-amber-100 text-amber-700' :
                            p.status === 'released' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          {p.payout_reference ? (
                            <div className="text-xs space-y-0.5">
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium flex items-center gap-1 w-fit">
                                <CheckCircle size={10} /> Paid Out
                              </span>
                              <p className="text-gray-400 font-mono">{p.payout_reference}</p>
                              <p className="text-gray-400">{p.payout_method === 'upi' ? 'UPI' : 'Bank Transfer'}</p>
                              {p.payout_at && <p className="text-gray-300">{new Date(p.payout_at).toLocaleDateString()}</p>}
                            </div>
                          ) : p.status === 'released' ? (
                            <span className="text-xs text-amber-500 font-medium">Pending Payout</span>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {p.status === 'escrow' && (
                            <div className="flex flex-col gap-1.5">
                              <button onClick={() => handlePaymentAction(p.id, 'release')}
                                className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium shadow-sm transition flex items-center gap-1">
                                <ArrowUpRight size={12} /> Release
                              </button>
                              <button onClick={() => handlePaymentAction(p.id, 'refund')}
                                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 font-medium transition flex items-center gap-1">
                                <ArrowDownRight size={12} /> Refund
                              </button>
                            </div>
                          )}
                          {p.status === 'released' && !p.payout_reference && (
                            <div className="flex flex-col gap-1.5">
                              <button onClick={() => handlePaymentAction(p.id, 'payout_bank')}
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium shadow-sm transition flex items-center gap-1">
                                <Building2 size={12} /> Bank Payout
                              </button>
                              <button onClick={() => handlePaymentAction(p.id, 'payout_upi')}
                                className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs rounded-lg hover:bg-purple-200 font-medium transition flex items-center gap-1">
                                <Send size={12} /> UPI Payout
                              </button>
                            </div>
                          )}
                          {p.status === 'released' && p.payout_reference && (
                            <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Complete</span>
                          )}
                          {p.status === 'refunded' && (
                            <span className="text-xs text-red-500 flex items-center gap-1"><XCircle size={12} /> Refunded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {payments.length === 0 && (
                <div className="text-center py-16">
                  <Wallet size={48} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 font-medium">No payments yet</p>
                  <p className="text-xs text-gray-300 mt-1">Payments will appear here when students book classes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============== CLASSES TAB =============== */}
        {tab === 'classes' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><BookOpen size={18} className="text-purple-500" /> All Classes</h3>
              <p className="text-xs text-gray-400 mt-1">View and manage all platform classes</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bookings</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classes.map(c => (
                    <tr key={c.id} className="hover:bg-indigo-50/30 transition">
                      <td className="px-5 py-4 text-sm font-medium text-gray-800">{c.title}</td>
                      <td className="px-5 py-4"><span className="text-sm bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">{c.subject_name}</span></td>
                      <td className="px-5 py-4 text-sm text-gray-600">{c.teacher_name}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 capitalize">{c.class_type}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{new Date(c.scheduled_at).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-800">Rs {c.price}</td>
                      <td className="px-5 py-4 text-sm"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">{c.booking_count}</span></td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          c.status === 'completed' ? 'bg-green-100 text-green-700' :
                          c.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {classes.length === 0 && (
              <div className="text-center py-16">
                <BookOpen size={48} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 font-medium">No classes yet</p>
              </div>
            )}
          </div>
        )}

        {/* =============== TICKETS TAB =============== */}
        {tab === 'tickets' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Ticket size={18} className="text-red-500" /> Support Tickets
              </h3>
              <span className="text-sm text-gray-400">{tickets.length} total</span>
            </div>
            {tickets.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Ticket size={48} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 font-medium">No support tickets</p>
                <p className="text-xs text-gray-300 mt-1">All clear! No tickets to resolve.</p>
              </div>
            ) : (
              tickets.map(t => (
                <div key={t.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-mono">#{t.id}</span>
                        <h3 className="font-bold text-gray-800">{t.subject}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{t.priority}</span>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{t.category}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{t.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Users size={12} /> {t.user_name} ({t.user_role})</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {t.reply_count} replies</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        t.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                        t.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{t.status}</span>
                      {t.status !== 'resolved' && t.status !== 'closed' && (
                        <button onClick={() => handleTicketStatus(t.id, 'resolved')}
                          className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium shadow-sm transition">
                          Resolve
                        </button>
                      )}
                      {t.status !== 'closed' && (
                        <button onClick={() => handleTicketStatus(t.id, 'closed')}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 font-medium transition">
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* =============== ADD TEACHER MODAL =============== */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus size={20} className="text-indigo-600" /> Add New Teacher
                </h3>
                <p className="text-sm text-gray-500">Create a new teacher account</p>
              </div>
              <button onClick={() => { setShowAddTeacher(false); setAddTeacherMsg({ type: '', text: '' }); }}
                className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={addTeacherForm.full_name}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, full_name: e.target.value })}
                    placeholder="Teacher's full name"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={addTeacherForm.email}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, email: e.target.value })}
                    placeholder="teacher@email.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={addTeacherForm.phone}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={addTeacherForm.city}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, city: e.target.value })}
                    placeholder="e.g. Jaipur"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" value={addTeacherForm.state}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, state: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="text" value={addTeacherForm.password}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <select value={addTeacherForm.qualification}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, qualification: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                    {['B.Ed', 'M.Ed', 'B.Sc + B.Ed', 'M.Sc + B.Ed', 'M.A + B.Ed', 'Ph.D', 'MBA', 'B.Tech', 'MCA', 'M.Sc', 'M.A'].map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <input type="number" value={addTeacherForm.experience_years} min={0} max={40}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, experience_years: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (Rs)</label>
                  <input type="number" value={addTeacherForm.hourly_rate} min={50} max={5000}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, hourly_rate: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea value={addTeacherForm.bio}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, bio: e.target.value })}
                    placeholder="Brief description about the teacher..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none" />
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Banknote size={16} className="text-green-600" /> Bank Details (for Payout)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" value={addTeacherForm.bank_name}
                      onChange={e => setAddTeacherForm({ ...addTeacherForm, bank_name: e.target.value })}
                      placeholder="e.g. State Bank of India"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" value={addTeacherForm.bank_account}
                      onChange={e => setAddTeacherForm({ ...addTeacherForm, bank_account: e.target.value })}
                      placeholder="e.g. 1234567890123456"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input type="text" value={addTeacherForm.bank_ifsc}
                      onChange={e => setAddTeacherForm({ ...addTeacherForm, bank_ifsc: e.target.value })}
                      placeholder="e.g. SBIN0001234"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                    <input type="text" value={addTeacherForm.upi_id}
                      onChange={e => setAddTeacherForm({ ...addTeacherForm, upi_id: e.target.value })}
                      placeholder="e.g. teacher@upi"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                  </div>
                </div>
              </div>

              {/* Subjects Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {subjects.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        addTeacherForm.subject_ids.includes(s.id)
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-indigo-50'
                      }`}
                    >{s.name}</button>
                  ))}
                </div>
              </div>

              {/* Auto Approve */}
              <label className="flex items-center gap-3 p-3 bg-green-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={addTeacherForm.auto_approve}
                  onChange={e => setAddTeacherForm({ ...addTeacherForm, auto_approve: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Auto-approve teacher</span>
                  <p className="text-xs text-gray-500">Teacher will be immediately visible to students</p>
                </div>
              </label>

              {addTeacherMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  addTeacherMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {addTeacherMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}
                  {addTeacherMsg.text}
                </div>
              )}

              <button onClick={handleAddTeacher} disabled={addingTeacher}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {addingTeacher ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><UserPlus size={16} /> Add Teacher</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =============== ADD STUDENT MODAL =============== */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus size={20} className="text-blue-600" /> Add New Student
                </h3>
                <p className="text-sm text-gray-500">Create a new student account</p>
              </div>
              <button onClick={() => { setShowAddStudent(false); setAddStudentMsg({ type: '', text: '' }); }}
                className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={addStudentForm.full_name}
                    onChange={e => setAddStudentForm({ ...addStudentForm, full_name: e.target.value })}
                    placeholder="Student's full name"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={addStudentForm.email}
                    onChange={e => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                    placeholder="student@gmail.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={addStudentForm.phone}
                    onChange={e => setAddStudentForm({ ...addStudentForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={addStudentForm.city}
                    onChange={e => setAddStudentForm({ ...addStudentForm, city: e.target.value })}
                    placeholder="e.g. Delhi"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" value={addStudentForm.state}
                    onChange={e => setAddStudentForm({ ...addStudentForm, state: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="text" value={addStudentForm.password}
                    onChange={e => setAddStudentForm({ ...addStudentForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
              </div>

              {addStudentMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  addStudentMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {addStudentMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}
                  {addStudentMsg.text}
                </div>
              )}

              <button onClick={handleAddStudent} disabled={addingStudent}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {addingStudent ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><UserPlus size={16} /> Add Student</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { adminAPI, paymentAPI, supportAPI, subjectAPI, settingsAPI, csvAPI, gatewayAPI } from '../services/api';
import {
  Users, BookOpen, IndianRupee, Shield, CheckCircle, XCircle, AlertCircle, Ticket,
  TrendingUp, ArrowUpRight, ArrowDownRight, UserPlus, Search,
  BarChart3, Wallet, Clock, Calendar, MapPin, RefreshCw, X,
  Activity, Banknote, GraduationCap, MessageSquare, CreditCard, Building2, Send,
  Edit3, Save, Settings, Mail, Globe, Bell, Download, Upload, Zap, ToggleLeft, ToggleRight, Trash2, TestTube, QrCode, Smartphone, Key
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

  // Edit states
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editTeacherForm, setEditTeacherForm] = useState<any>({});
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [editTeacherMsg, setEditTeacherMsg] = useState({ type: '', text: '' });

  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editStudentForm, setEditStudentForm] = useState<any>({});
  const [savingStudent, setSavingStudent] = useState(false);
  const [editStudentMsg, setEditStudentMsg] = useState({ type: '', text: '' });

  // Settings state
  const [siteSettings, setSiteSettings] = useState({ platform_name: '', support_email: '', commission_rate: '', currency: '', platform_description: '' });
  const [emailConfig, setEmailConfig] = useState({ smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '', sender_name: '', sender_email: '', is_enabled: false });
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>({});
  const [savingSettings, setSavingSettings] = useState('');
  const [settingsMsg, setSettingsMsg] = useState({ section: '', type: '', text: '' });
  const [testEmail, setTestEmail] = useState('');

  // Gateway states
  const [gateways, setGateways] = useState<any[]>([]);
  const [editingGateway, setEditingGateway] = useState<any>(null);
  const [gwForm, setGwForm] = useState<any>({});
  const [savingGw, setSavingGw] = useState(false);
  const [gwMsg, setGwMsg] = useState({ type: '', text: '' });
  const [testingGw, setTestingGw] = useState<number | null>(null);

  // CSV states
  const [csvLoading, setCsvLoading] = useState('');
  const [csvMsg, setCsvMsg] = useState({ type: '', text: '' });
  const fileInputRef = (section: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setCsvLoading(section);
      setCsvMsg({ type: '', text: '' });
      try {
        const res = await csvAPI.upload(section, file);
        setCsvMsg({ type: 'success', text: res.message || 'Upload successful!' });
        // Reload relevant data
        if (section === 'teachers') loadTeachers();
        if (section === 'students') loadStudents();
        if (section === 'settings') loadSettings();
      } catch (err: unknown) {
        setCsvMsg({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
      } finally {
        setCsvLoading('');
      }
    };
    input.click();
  };
  const handleCsvDownload = async (section: string) => {
    setCsvLoading(`dl-${section}`);
    setCsvMsg({ type: '', text: '' });
    try {
      await csvAPI.download(section);
      setCsvMsg({ type: 'success', text: `${section}.csv downloaded!` });
    } catch {
      setCsvMsg({ type: 'error', text: 'Download failed' });
    } finally {
      setCsvLoading('');
    }
  };

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
    if (tab === 'settings') { loadSettings(); loadGateways(); }
  }, [tab]);

  // Auto-reload on filter change for payments
  useEffect(() => {
    if (tab === 'payments') loadPayments();
  }, [paymentFilter]);

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

  const loadSettings = async () => {
    try {
      const [site, email, notif] = await Promise.all([
        settingsAPI.getSiteSettings(),
        settingsAPI.getEmailConfig(),
        settingsAPI.getNotificationSettings()
      ]);
      setSiteSettings({ platform_name: site.platform_name || '', support_email: site.support_email || '', commission_rate: site.commission_rate || '', currency: site.currency || '', platform_description: site.platform_description || '' });
      setEmailConfig({ smtp_host: email.smtp_host || '', smtp_port: email.smtp_port || 587, smtp_username: email.smtp_username || '', smtp_password: '', sender_name: email.sender_name || '', sender_email: email.sender_email || '', is_enabled: !!email.is_enabled });
      setNotifSettings(notif);
    } catch (err) { console.error(err); }
  };

  const saveSiteSettings = async () => {
    setSavingSettings('site');
    try {
      await settingsAPI.updateSiteSettings(siteSettings);
      setSettingsMsg({ section: 'site', type: 'success', text: 'Settings saved!' });
    } catch (err) { setSettingsMsg({ section: 'site', type: 'error', text: err instanceof Error ? err.message : 'Failed' }); }
    finally { setSavingSettings(''); setTimeout(() => setSettingsMsg({ section: '', type: '', text: '' }), 3000); }
  };

  const saveEmailConfig = async () => {
    setSavingSettings('email');
    try {
      const data: Record<string, unknown> = { smtp_host: emailConfig.smtp_host, smtp_port: emailConfig.smtp_port, smtp_username: emailConfig.smtp_username, sender_name: emailConfig.sender_name, sender_email: emailConfig.sender_email, is_enabled: emailConfig.is_enabled };
      if (emailConfig.smtp_password) data.smtp_password = emailConfig.smtp_password;
      await settingsAPI.updateEmailConfig(data);
      setSettingsMsg({ section: 'email', type: 'success', text: 'Email config saved!' });
    } catch (err) { setSettingsMsg({ section: 'email', type: 'error', text: err instanceof Error ? err.message : 'Failed' }); }
    finally { setSavingSettings(''); setTimeout(() => setSettingsMsg({ section: '', type: '', text: '' }), 3000); }
  };

  const handleTestEmail = async () => {
    if (!testEmail) { alert('Enter an email address'); return; }
    setSavingSettings('test');
    try {
      await settingsAPI.sendTestEmail(testEmail);
      setSettingsMsg({ section: 'email', type: 'success', text: 'Test email sent!' });
    } catch (err) { setSettingsMsg({ section: 'email', type: 'error', text: err instanceof Error ? err.message : 'Failed to send' }); }
    finally { setSavingSettings(''); setTimeout(() => setSettingsMsg({ section: '', type: '', text: '' }), 3000); }
  };

  const saveNotifSettings = async () => {
    setSavingSettings('notif');
    try {
      await settingsAPI.updateNotificationSettings(notifSettings);
      setSettingsMsg({ section: 'notif', type: 'success', text: 'Notification settings saved!' });
    } catch (err) { setSettingsMsg({ section: 'notif', type: 'error', text: err instanceof Error ? err.message : 'Failed' }); }
    finally { setSavingSettings(''); setTimeout(() => setSettingsMsg({ section: '', type: '', text: '' }), 3000); }
  };

  const toggleNotif = (key: string) => {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Gateway functions
  const loadGateways = async () => {
    try {
      const data = await gatewayAPI.list();
      setGateways(data);
    } catch (err) { console.error(err); }
  };

  const handleGwToggle = async (id: number) => {
    try {
      await gatewayAPI.toggle(id);
      loadGateways();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleGwPrimary = async (id: number) => {
    try {
      await gatewayAPI.setPrimary(id);
      loadGateways();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleGwTest = async (id: number) => {
    setTestingGw(id);
    try {
      const res = await gatewayAPI.test(id);
      alert(res.success ? `Test Passed: ${res.message}` : `Test Failed: ${res.message}`);
    } catch (err) { alert(err instanceof Error ? err.message : 'Test failed'); }
    finally { setTestingGw(null); }
  };

  const handleGwDelete = async (id: number) => {
    if (!confirm('Delete this gateway?')) return;
    try {
      await gatewayAPI.delete(id);
      loadGateways();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  const openEditGateway = (gw: any) => {
    setEditingGateway(gw);
    setGwForm({
      name: gw.name, display_name: gw.display_name, api_key: gw.api_key || '',
      api_secret: '', merchant_id: gw.merchant_id || '',
      supports_upi: gw.supports_upi, supports_cards: gw.supports_cards,
      supports_netbanking: gw.supports_netbanking, upi_intent: gw.upi_intent,
      custom_upi_id: gw.custom_upi_id || '', custom_qr_data: gw.custom_qr_data || '',
    });
    setGwMsg({ type: '', text: '' });
  };

  const handleSaveGateway = async () => {
    if (!editingGateway) return;
    setSavingGw(true);
    setGwMsg({ type: '', text: '' });
    try {
      const payload: Record<string, unknown> = { ...gwForm };
      if (!payload.api_secret) delete payload.api_secret; // don't overwrite with empty
      await gatewayAPI.update(editingGateway.id, payload);
      setGwMsg({ type: 'success', text: 'Gateway updated!' });
      loadGateways();
      setTimeout(() => { setEditingGateway(null); setGwMsg({ type: '', text: '' }); }, 1200);
    } catch (err: any) {
      setGwMsg({ type: 'error', text: err.message || 'Failed' });
    } finally { setSavingGw(false); }
  };

  const gwTypeIcon = (type: string) => {
    if (type === 'razorpay') return <CreditCard size={18} className="text-blue-400" />;
    if (type === 'phonepe') return <Smartphone size={18} className="text-purple-400" />;
    if (type === 'custom_upi') return <QrCode size={18} className="text-emerald-400" />;
    if (type === 'cashfree') return <Wallet size={18} className="text-cyan-400" />;
    if (type === 'payu') return <IndianRupee size={18} className="text-amber-400" />;
    if (type === 'instamojo') return <Zap size={18} className="text-pink-400" />;
    return <CreditCard size={18} className="text-slate-400" />;
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

  // Edit Teacher
  const openEditTeacher = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditTeacherForm({
      full_name: teacher.full_name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      city: teacher.city || '',
      state: teacher.state || '',
      bio: teacher.teacher_profile?.bio || '',
      experience_years: teacher.teacher_profile?.experience_years || 0,
      hourly_rate: teacher.teacher_profile?.hourly_rate || 0,
      qualification: teacher.teacher_profile?.qualification || '',
      bank_name: teacher.teacher_profile?.bank_name || '',
      bank_account: teacher.teacher_profile?.bank_account || '',
      bank_ifsc: teacher.teacher_profile?.bank_ifsc || '',
      upi_id: teacher.teacher_profile?.upi_id || '',
    });
    setEditTeacherMsg({ type: '', text: '' });
  };

  const handleSaveTeacher = async () => {
    if (!editingTeacher) return;
    setSavingTeacher(true);
    setEditTeacherMsg({ type: '', text: '' });
    try {
      await adminAPI.editTeacher(editingTeacher.id, editTeacherForm);
      setEditTeacherMsg({ type: 'success', text: 'Teacher updated successfully!' });
      loadTeachers();
      setTimeout(() => { setEditingTeacher(null); setEditTeacherMsg({ type: '', text: '' }); }, 1200);
    } catch (err: any) {
      setEditTeacherMsg({ type: 'error', text: err.message || 'Failed to update' });
    } finally {
      setSavingTeacher(false);
    }
  };

  // Edit Student
  const openEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditStudentForm({
      full_name: student.full_name || '',
      email: student.email || '',
      phone: student.phone || '',
      city: student.city || '',
      state: student.state || '',
    });
    setEditStudentMsg({ type: '', text: '' });
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    setSavingStudent(true);
    setEditStudentMsg({ type: '', text: '' });
    try {
      await adminAPI.editUser(editingStudent.id, editStudentForm);
      setEditStudentMsg({ type: 'success', text: 'Student updated successfully!' });
      loadStudents();
      setTimeout(() => { setEditingStudent(null); setEditStudentMsg({ type: '', text: '' }); }, 1200);
    } catch (err: any) {
      setEditStudentMsg({ type: 'error', text: err.message || 'Failed to update' });
    } finally {
      setSavingStudent(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
    { id: 'teachers', label: 'Teachers', icon: <Users size={16} /> },
    { id: 'students', label: 'Students', icon: <GraduationCap size={16} /> },
    { id: 'payments', label: 'Payments', icon: <Wallet size={16} /> },
    { id: 'classes', label: 'Classes', icon: <BookOpen size={16} /> },
    { id: 'tickets', label: 'Tickets', icon: <Ticket size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-white placeholder-slate-500 outline-none";

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Header Bar */}
      <div className="glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse3d">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Admin Control Center</h1>
                <p className="text-slate-400 text-sm">GuruConnect Platform Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { loadDashboard(); }} className="btn-3d btn-3d-glass">
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={() => setShowAddStudent(true)} className="btn-3d btn-3d-glass">
                <UserPlus size={14} /> Add Student
              </button>
              <button onClick={() => setShowAddTeacher(true)} className="btn-3d btn-3d-emerald">
                <UserPlus size={14} /> Add Teacher
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 glass rounded-2xl p-1.5 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500">Loading dashboard...</p>
              </div>
            </div>
          ) : dashboard && (
            <div className="space-y-6">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card-3d glass rounded-2xl p-5 hover:bg-white/10 transition group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                      <GraduationCap size={22} className="text-cyan-400" />
                    </div>
                    <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded-lg">Students</span>
                  </div>
                  <div className="text-3xl font-black text-white">{dashboard.total_students}</div>
                  <p className="text-xs text-slate-500 mt-1">Registered students</p>
                </div>

                <div className="card-3d glass rounded-2xl p-5 hover:bg-white/10 transition group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                      <Users size={22} className="text-emerald-400" />
                    </div>
                    <span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">Teachers</span>
                  </div>
                  <div className="text-3xl font-black text-white">{dashboard.total_teachers}</div>
                  <p className="text-xs text-slate-500 mt-1">Active teachers</p>
                </div>

                <div className="card-3d glass rounded-2xl p-5 hover:bg-white/10 transition group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                      <Clock size={22} className="text-amber-400" />
                    </div>
                    {dashboard.pending_teachers > 0 && (
                      <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-1 rounded-lg animate-pulse">Action Needed</span>
                    )}
                  </div>
                  <div className="text-3xl font-black text-white">{dashboard.pending_teachers}</div>
                  <p className="text-xs text-slate-500 mt-1">Pending approvals</p>
                </div>

                <div className="card-3d glass rounded-2xl p-5 hover:bg-white/10 transition group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                      <BookOpen size={22} className="text-purple-400" />
                    </div>
                    <span className="text-xs text-purple-500 font-medium bg-purple-500/10 px-2 py-1 rounded-lg">Classes</span>
                  </div>
                  <div className="text-3xl font-black text-white">{dashboard.total_classes}</div>
                  <p className="text-xs text-slate-500 mt-1">Total classes</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20 p-5 text-white group hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition">
                      <IndianRupee size={22} />
                    </div>
                    <TrendingUp size={18} className="text-emerald-200" />
                  </div>
                  <div className="text-3xl font-black">Rs {dashboard.total_revenue}</div>
                  <p className="text-xs text-emerald-200 mt-1">Platform Revenue</p>
                </div>
              </div>

              {/* Middle Row - Stats Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Classes Overview */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-white flex items-center gap-2"><Activity size={18} className="text-emerald-400" /> Classes Overview</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span className="text-sm text-slate-400">Scheduled</span>
                      </div>
                      <span className="font-bold text-cyan-400">{dashboard.active_classes}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="text-sm text-slate-400">Completed</span>
                      </div>
                      <span className="font-bold text-emerald-400">{dashboard.completed_classes}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-xl border border-purple-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-sm text-slate-400">Total Bookings</span>
                      </div>
                      <span className="font-bold text-purple-400">{dashboard.total_bookings}</span>
                    </div>
                  </div>
                </div>

                {/* Escrow Status */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-white flex items-center gap-2"><Wallet size={18} className="text-emerald-400" /> Escrow Status</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/10">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-amber-400" />
                        <span className="text-sm text-slate-400">In Escrow</span>
                      </div>
                      <span className="font-bold text-amber-400">Rs {dashboard.escrow_amount}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight size={16} className="text-emerald-400" />
                        <span className="text-sm text-slate-400">Platform Earnings</span>
                      </div>
                      <span className="font-bold text-emerald-400">Rs {dashboard.total_revenue}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/10">
                      <div className="flex items-center gap-2">
                        <Ticket size={16} className="text-red-400" />
                        <span className="text-sm text-slate-400">Open Tickets</span>
                      </div>
                      <span className="font-bold text-red-400">{dashboard.open_tickets}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-400" /> Recent Bookings
                  </h3>
                  <div className="space-y-3">
                    {dashboard.recent_bookings?.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No bookings yet</p>}
                    {dashboard.recent_bookings?.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-bold">
                            {b.student_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <span className="font-medium text-white">{b.student_name}</span>
                            <span className="text-slate-500 mx-2">booked</span>
                            <span className="text-emerald-400 font-medium">{b.class_title}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{new Date(b.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          b.status === 'booked' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* =============== TEACHERS TAB =============== */}
        {tab === 'teachers' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-4">
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10 flex-1 min-w-64">
                  <Search size={16} className="text-slate-500" />
                  <input type="text" placeholder="Search by name, email, or phone..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadTeachers()}
                    className="bg-transparent text-sm outline-none flex-1 text-white placeholder-slate-500" />
                </div>
                <button onClick={loadTeachers} className="btn-3d btn-3d-emerald">
                  <Search size={14} /> Search
                </button>
                <button onClick={() => setShowAddTeacher(true)} className="btn-3d btn-3d-emerald">
                  <UserPlus size={14} /> Add Teacher
                </button>
                <button onClick={() => handleCsvDownload('teachers')} disabled={csvLoading === 'dl-teachers'} className="btn-3d btn-3d-cyan">
                  {csvLoading === 'dl-teachers' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />} CSV Download
                </button>
                <button onClick={() => fileInputRef('teachers')} disabled={csvLoading === 'teachers'} className="btn-3d btn-3d-amber">
                  {csvLoading === 'teachers' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />} CSV Upload
                </button>
              </div>
              {csvMsg.text && tab === 'teachers' && (
                <div className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${csvMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {csvMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}{csvMsg.text}
                </div>
              )}
            </div>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-emerald-400 flex items-center gap-2"><Users size={18} /> All Teachers ({teachers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Teacher</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Rate / Rating</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Details</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teachers.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-emerald-500 to-teal-500">
                              {u.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{u.full_name}</p>
                              <p className="text-xs text-slate-500">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-400">{u.email}</p>
                          <p className="text-xs text-slate-500">{u.phone || '-'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-400 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-500" />
                            {u.city || '-'}{u.state ? `, ${u.state}` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {u.teacher_profile && (
                            <div className="text-xs space-y-0.5">
                              <p className="text-slate-500">Rate: <span className="font-medium text-slate-300">Rs {u.teacher_profile.hourly_rate}/hr</span></p>
                              <p className="text-slate-500">Rating: <span className="font-medium text-amber-400">{u.teacher_profile.rating}</span></p>
                              <p className="text-slate-500">Classes: <span className="font-medium text-slate-300">{u.teacher_profile.total_classes}</span></p>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {u.teacher_profile?.bank_name ? (
                            <div className="text-xs space-y-0.5">
                              <p className="text-slate-500">{u.teacher_profile.bank_name}</p>
                              <p className="text-slate-500">A/C: <span className="font-mono">{u.teacher_profile.bank_account?.replace(/(.{4})/g, '$1 ')}</span></p>
                              <p className="text-slate-500">IFSC: <span className="font-mono">{u.teacher_profile.bank_ifsc}</span></p>
                              {u.teacher_profile.upi_id && <p className="text-slate-500">UPI: <span className="font-medium text-emerald-400">{u.teacher_profile.upi_id}</span></p>}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Not provided</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full w-fit">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full w-fit">
                                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Suspended
                              </span>
                            )}
                            {u.teacher_profile && !u.teacher_profile.is_approved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full w-fit animate-pulse">
                                <AlertCircle size={10} /> Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <button onClick={() => openEditTeacher(u)}
                              className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg hover:bg-cyan-500/20 font-medium transition flex items-center gap-1">
                              <Edit3 size={12} /> Edit
                            </button>
                            {u.teacher_profile && !u.teacher_profile.is_approved && (
                              <button onClick={() => handleUserAction(u.id, 'approve', 'teacher')}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-lg hover:from-emerald-400 hover:to-teal-400 font-medium shadow-sm transition flex items-center gap-1">
                                <CheckCircle size={12} /> Approve
                              </button>
                            )}
                            {u.is_active ? (
                              <button onClick={() => handleUserAction(u.id, 'suspend', 'teacher')}
                                className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 font-medium transition flex items-center gap-1">
                                <XCircle size={12} /> Suspend
                              </button>
                            ) : (
                              <button onClick={() => handleUserAction(u.id, 'activate', 'teacher')}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20 font-medium transition flex items-center gap-1">
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
                  <Users size={48} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 font-medium">No teachers found</p>
                  <p className="text-xs text-slate-600 mt-1">Try adjusting your search or add a new teacher</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============== STUDENTS TAB =============== */}
        {tab === 'students' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-4">
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10 flex-1 min-w-64">
                  <Search size={16} className="text-slate-500" />
                  <input type="text" placeholder="Search students by name or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadStudents()}
                    className="bg-transparent text-sm outline-none flex-1 text-white placeholder-slate-500" />
                </div>
                <button onClick={loadStudents} className="btn-3d btn-3d-emerald">
                  <Search size={14} /> Search
                </button>
                <button onClick={() => setShowAddStudent(true)} className="btn-3d btn-3d-emerald">
                  <UserPlus size={14} /> Add Student
                </button>
                <button onClick={() => handleCsvDownload('students')} disabled={csvLoading === 'dl-students'} className="btn-3d btn-3d-cyan">
                  {csvLoading === 'dl-students' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />} CSV Download
                </button>
                <button onClick={() => fileInputRef('students')} disabled={csvLoading === 'students'} className="btn-3d btn-3d-amber">
                  {csvLoading === 'students' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />} CSV Upload
                </button>
              </div>
              {csvMsg.text && tab === 'students' && (
                <div className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${csvMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {csvMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}{csvMsg.text}
                </div>
              )}
            </div>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-cyan-400 flex items-center gap-2"><GraduationCap size={18} /> All Students ({students.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {students.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-emerald-500 to-teal-500">
                              {u.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">{u.full_name}</p>
                              <p className="text-xs text-slate-500">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-400">{u.email}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{u.phone || '-'}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-400 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-500" />
                            {u.city || '-'}{u.state ? `, ${u.state}` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full w-fit">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full w-fit">
                                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Suspended
                              </span>
                            )}
                            {u.is_verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-full w-fit">
                                <CheckCircle size={10} /> Verified
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <button onClick={() => openEditStudent(u)}
                              className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-xs rounded-lg hover:bg-cyan-500/20 font-medium transition flex items-center gap-1">
                              <Edit3 size={12} /> Edit
                            </button>
                            {u.is_active ? (
                              <button onClick={() => handleUserAction(u.id, 'suspend', 'student')}
                                className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 font-medium transition flex items-center gap-1">
                                <XCircle size={12} /> Suspend
                              </button>
                            ) : (
                              <button onClick={() => handleUserAction(u.id, 'activate', 'student')}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20 font-medium transition flex items-center gap-1">
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
                  <GraduationCap size={48} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 font-medium">No students found</p>
                  <p className="text-xs text-slate-600 mt-1">Try adjusting your search or add a new student</p>
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
                <div className="glass rounded-2xl p-5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-amber-400" />
                    <span className="text-xs text-slate-500 font-semibold uppercase">In Escrow</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400">Rs {paymentStats.total_escrow}</div>
                  <p className="text-xs text-slate-500 mt-1">Payments held</p>
                </div>
                <div className="glass rounded-2xl p-5 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight size={16} className="text-emerald-400" />
                    <span className="text-xs text-slate-500 font-bold uppercase">Released</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">Rs {paymentStats.total_released}</div>
                  <p className="text-xs text-slate-500 mt-1">Paid to teachers</p>
                </div>
                <div className="glass rounded-2xl p-5 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownRight size={16} className="text-red-400" />
                    <span className="text-xs text-slate-500 font-bold uppercase">Refunded</span>
                  </div>
                  <div className="text-2xl font-black text-red-400">Rs {paymentStats.total_refunded}</div>
                  <p className="text-xs text-slate-500 mt-1">Returned to students</p>
                </div>
                <div className="glass rounded-2xl p-5 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span className="text-xs text-slate-500 font-semibold uppercase">Platform Fee</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">Rs {paymentStats.total_platform_fee}</div>
                  <p className="text-xs text-slate-500 mt-1">10% commission</p>
                </div>
                <div className="glass rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={16} className="text-gray-500" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Total</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{paymentStats.total_count}</div>
                  <p className="text-xs text-slate-500 mt-1">Transactions</p>
                </div>
              </div>
            )}

            {/* Filter + CSV Buttons */}
            <div className="flex gap-2 flex-wrap items-center">
              {['', 'escrow', 'released', 'refunded'].map(f => (
                <button key={f} onClick={() => setPaymentFilter(f)}
                  className={`btn-3d btn-3d-sm ${
                    paymentFilter === f
                      ? 'btn-3d-emerald'
                      : 'btn-3d-glass'
                  }`}>
                  {f || 'All'}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <button onClick={() => handleCsvDownload('payments')} disabled={csvLoading === 'dl-payments'} className="btn-3d btn-3d-sm btn-3d-cyan">
                  {csvLoading === 'dl-payments' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={12} />} CSV Download
                </button>
              </div>
            </div>

            {/* Payment Table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-400" />
                  {paymentFilter ? `${paymentFilter.charAt(0).toUpperCase() + paymentFilter.slice(1)} Transactions` : 'All Transactions'} ({payments.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pay-In from students, Pay-Out to teachers</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Class</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Pay-In (Student)</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Pay-Out (Teacher)</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Fee (10%)</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Teacher Gets</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Payout</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-white">{p.class_title || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString()}</p>
                          {p.transaction_id && <p className="text-xs text-slate-600 font-mono">{p.transaction_id}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={12} className="text-cyan-400" />
                            <span className="text-sm text-slate-400">{p.student_name || 'Unknown'}</span>
                          </div>
                          {p.card_last4 && <p className="text-xs text-slate-500 mt-0.5"><CreditCard size={10} className="inline" /> {p.card_brand} ****{p.card_last4}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Banknote size={12} className="text-emerald-400" />
                            <span className="text-sm text-slate-400">{p.teacher_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-white">Rs {p.amount}</td>
                        <td className="px-5 py-4 text-sm text-red-400">Rs {p.platform_fee}</td>
                        <td className="px-5 py-4 text-sm font-bold text-emerald-400">Rs {p.teacher_amount}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            p.status === 'escrow' ? 'bg-amber-500/10 text-amber-400' :
                            p.status === 'released' ? 'bg-emerald-500/10 text-emerald-400' :
                            p.status === 'refunded' ? 'bg-red-500/10 text-red-400' :
                            'bg-white/5 text-slate-400'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          {p.payout_reference ? (
                            <div className="text-xs space-y-0.5">
                              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={10} /> Paid Out</span>
                              <p className="text-slate-500 font-mono">{p.payout_reference}</p>
                              <p className="text-slate-500">{p.payout_method === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}</p>
                              {p.paid_out_at && <p className="text-slate-500">{new Date(p.paid_out_at).toLocaleDateString()}</p>}
                            </div>
                          ) : <span className="text-xs text-slate-500">-</span>}
                        </td>
                        <td className="px-5 py-4">
                          {p.status === 'escrow' && (
                            <div className="flex flex-col gap-1.5">
                              <button onClick={() => handlePaymentAction(p.id, 'release')}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-lg hover:from-emerald-400 hover:to-teal-400 font-medium shadow-sm transition flex items-center gap-1">
                                <ArrowUpRight size={12} /> Release
                              </button>
                              <button onClick={() => handlePaymentAction(p.id, 'refund')}
                                className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 font-medium transition flex items-center gap-1">
                                <ArrowDownRight size={12} /> Refund
                              </button>
                            </div>
                          )}
                          {p.status === 'released' && !p.payout_reference && (
                            <div className="flex flex-col gap-1.5">
                              <button onClick={() => handlePaymentAction(p.id, 'payout_bank')}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs rounded-lg hover:from-emerald-600 hover:to-teal-700 font-medium shadow-sm transition flex items-center gap-1">
                                <Building2 size={12} /> Bank Payout
                              </button>
                              <button onClick={() => handlePaymentAction(p.id, 'payout_upi')}
                                className="px-3 py-1.5 bg-purple-500/10 text-purple-400 text-xs rounded-lg hover:bg-purple-500/20 font-medium transition flex items-center gap-1">
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
                  <Wallet size={48} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 font-medium">No payments yet</p>
                  <p className="text-xs text-slate-600 mt-1">Payments will appear here when students book classes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============== CLASSES TAB =============== */}
        {tab === 'classes' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <button onClick={() => handleCsvDownload('classes')} disabled={csvLoading === 'dl-classes'} className="btn-3d btn-3d-cyan">
                {csvLoading === 'dl-classes' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />} CSV Download Classes
              </button>
            </div>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-5 bg-white/5 border-b border-white/5">
              <h3 className="font-bold text-white flex items-center gap-2"><BookOpen size={18} className="text-purple-400" /> All Classes</h3>
              <p className="text-xs text-slate-500 mt-1">View and manage all platform classes</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Class</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Teacher</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Bookings</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classes.map(c => (
                    <tr key={c.id} className="hover:bg-white/5 transition">
                      <td className="px-5 py-4 text-sm font-medium text-white">{c.title}</td>
                      <td className="px-5 py-4"><span className="text-sm bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg">{c.subject_name}</span></td>
                      <td className="px-5 py-4 text-sm text-slate-400">{c.teacher_name}</td>
                      <td className="px-5 py-4 text-sm text-slate-500 capitalize">{c.class_type}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{new Date(c.scheduled_at).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm font-bold text-white">Rs {c.price}</td>
                      <td className="px-5 py-4 text-sm"><span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-lg font-medium">{c.booking_count}</span></td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          c.status === 'scheduled' ? 'bg-cyan-500/10 text-cyan-400' :
                          c.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          c.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {classes.length === 0 && (
              <div className="text-center py-16">
                <BookOpen size={48} className="mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400 font-medium">No classes yet</p>
              </div>
            )}
          </div>
          </div>
        )}

        {/* =============== TICKETS TAB =============== */}
        {tab === 'tickets' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Ticket size={18} className="text-red-400" /> Support Tickets
                </h3>
                <span className="text-sm text-slate-500">{tickets.length} total</span>
              </div>
              <button onClick={() => handleCsvDownload('tickets')} disabled={csvLoading === 'dl-tickets'} className="btn-3d btn-3d-sm btn-3d-cyan">
                {csvLoading === 'dl-tickets' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={12} />} CSV Download
              </button>
            </div>
            {tickets.length === 0 ? (
              <div className="text-center py-16 glass rounded-2xl">
                <Ticket size={48} className="mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400 font-medium">No support tickets</p>
                <p className="text-xs text-slate-600 mt-1">All clear! No tickets to resolve.</p>
              </div>
            ) : (
              tickets.map(t => (
                <div key={t.id} className="glass rounded-2xl p-6 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-slate-500 font-mono">#{t.id}</span>
                        <h3 className="font-bold text-white">{t.subject}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          t.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                          t.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                          t.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-white/5 text-slate-400'
                        }`}>{t.priority}</span>
                        <span className="px-2.5 py-0.5 bg-white/5 text-slate-400 rounded-full text-xs">{t.category}</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{t.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Users size={12} /> {t.user_name} ({t.user_role})</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {t.reply_count} replies</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        t.status === 'open' ? 'bg-cyan-500/10 text-cyan-400' :
                        t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                        t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-white/5 text-slate-400'
                      }`}>{t.status}</span>
                      {t.status !== 'resolved' && t.status !== 'closed' && (
                        <button onClick={() => handleTicketStatus(t.id, 'resolved')}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-lg hover:from-emerald-400 hover:to-teal-400 font-medium shadow-sm transition">
                          Resolve
                        </button>
                      )}
                      {t.status !== 'closed' && (
                        <button onClick={() => handleTicketStatus(t.id, 'closed')}
                          className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg hover:bg-white/10 font-medium transition">
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
      {/* =============== SETTINGS TAB =============== */}
        {tab === 'settings' && (
          <div className="space-y-6">
            {/* Settings CSV Buttons */}
            <div className="flex gap-3 flex-wrap items-center">
              <button onClick={() => handleCsvDownload('settings')} disabled={csvLoading === 'dl-settings'} className="btn-3d btn-3d-cyan">
                {csvLoading === 'dl-settings' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />} CSV Download Settings
              </button>
              <button onClick={() => fileInputRef('settings')} disabled={csvLoading === 'settings'} className="btn-3d btn-3d-amber">
                {csvLoading === 'settings' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />} CSV Upload Settings
              </button>
              {csvMsg.text && tab === 'settings' && (
                <div className={`px-4 py-2 rounded-xl text-sm font-medium ${csvMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {csvMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}{csvMsg.text}
                </div>
              )}
            </div>
            {/* Website Settings */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Globe size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Website Settings</h3>
                  <p className="text-sm text-slate-400">Configure your platform settings</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Platform Name</label>
                  <input type="text" value={siteSettings.platform_name} onChange={e => setSiteSettings({ ...siteSettings, platform_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Support Email</label>
                  <input type="email" value={siteSettings.support_email} onChange={e => setSiteSettings({ ...siteSettings, support_email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Commission Rate (%)</label>
                  <input type="number" value={siteSettings.commission_rate} onChange={e => setSiteSettings({ ...siteSettings, commission_rate: e.target.value })} min={0} max={50} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Currency</label>
                  <input type="text" value={siteSettings.currency} onChange={e => setSiteSettings({ ...siteSettings, currency: e.target.value })} className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Platform Description</label>
                  <textarea rows={2} value={siteSettings.platform_description} onChange={e => setSiteSettings({ ...siteSettings, platform_description: e.target.value })} className={inputCls + " resize-none"} />
                </div>
              </div>
              {settingsMsg.section === 'site' && settingsMsg.text && (
                <div className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${settingsMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {settingsMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}{settingsMsg.text}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button onClick={saveSiteSettings} disabled={savingSettings === 'site'} className="btn-3d btn-3d-emerald disabled:opacity-50">
                  {savingSettings === 'site' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Save Settings
                </button>
              </div>
            </div>

            {/* Email Configuration */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                    <Mail size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Email Configuration (SMTP)</h3>
                    <p className="text-sm text-slate-400">Configure email server for notifications</p>
                  </div>
                </div>
                <button onClick={() => setEmailConfig({ ...emailConfig, is_enabled: !emailConfig.is_enabled })} className={`w-14 h-8 rounded-full transition-all relative ${emailConfig.is_enabled ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow ${emailConfig.is_enabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">SMTP Server</label>
                  <input type="text" value={emailConfig.smtp_host} onChange={e => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })} placeholder="smtp.gmail.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">SMTP Port</label>
                  <input type="number" value={emailConfig.smtp_port} onChange={e => setEmailConfig({ ...emailConfig, smtp_port: Number(e.target.value) })} placeholder="587" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">SMTP Username</label>
                  <input type="text" value={emailConfig.smtp_username} onChange={e => setEmailConfig({ ...emailConfig, smtp_username: e.target.value })} placeholder="your-email@gmail.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">SMTP Password</label>
                  <input type="password" value={emailConfig.smtp_password} onChange={e => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })} placeholder="App password" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Sender Name</label>
                  <input type="text" value={emailConfig.sender_name} onChange={e => setEmailConfig({ ...emailConfig, sender_name: e.target.value })} placeholder="GuruConnect" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Sender Email</label>
                  <input type="email" value={emailConfig.sender_email} onChange={e => setEmailConfig({ ...emailConfig, sender_email: e.target.value })} placeholder="noreply@guruplatform.com" className={inputCls} />
                </div>
              </div>
              {settingsMsg.section === 'email' && settingsMsg.text && (
                <div className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${settingsMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {settingsMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}{settingsMsg.text}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@gmail.com" className={inputCls + ' w-56'} />
                  <button onClick={handleTestEmail} disabled={savingSettings === 'test'} className="btn-3d btn-3d-cyan disabled:opacity-50">
                    {savingSettings === 'test' ? <div className="w-4 h-4 border-2 border-cyan-300/30 border-t-cyan-400 rounded-full animate-spin" /> : <Send size={16} />} Test
                  </button>
                </div>
                <button onClick={saveEmailConfig} disabled={savingSettings === 'email'} className="btn-3d btn-3d-emerald disabled:opacity-50">
                  {savingSettings === 'email' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Save Email Config
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Bell size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Email Notification Triggers</h3>
                  <p className="text-sm text-slate-400">Configure when email notifications are sent</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'new_student_registration', label: 'New Student Registration', desc: 'Send welcome email when a student registers' },
                  { key: 'new_teacher_registration', label: 'New Teacher Registration', desc: 'Send welcome email when a teacher registers' },
                  { key: 'teacher_approval', label: 'Teacher Approval', desc: 'Notify teacher when their profile is approved' },
                  { key: 'new_booking', label: 'New Booking', desc: 'Notify both student and teacher when a class is booked' },
                  { key: 'payment_received', label: 'Payment Received', desc: 'Notify student when payment is confirmed in escrow' },
                  { key: 'payment_released', label: 'Payment Released', desc: 'Notify teacher when payment is released from escrow' },
                  { key: 'payment_refunded', label: 'Payment Refunded', desc: 'Notify student when payment is refunded' },
                  { key: 'class_reminder', label: 'Class Reminder', desc: 'Send reminder 30 minutes before class starts' },
                  { key: 'class_completed', label: 'Class Completed', desc: 'Notify both parties when class is marked complete' },
                  { key: 'support_ticket_update', label: 'Support Ticket Update', desc: 'Notify user when their support ticket is updated' },
                  { key: 'payout_processed', label: 'Payout Processed', desc: 'Notify teacher when bank payout is processed' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
                    <div>
                      <p className="font-medium text-white text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button onClick={() => toggleNotif(item.key)} className={`w-12 h-7 rounded-full transition-all relative ${notifSettings[item.key] ? 'bg-emerald-500' : 'bg-white/10'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow ${notifSettings[item.key] ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              {settingsMsg.section === 'notif' && settingsMsg.text && (
                <div className={`mt-3 px-4 py-2 rounded-xl text-sm font-medium ${settingsMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {settingsMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}{settingsMsg.text}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button onClick={saveNotifSettings} disabled={savingSettings === 'notif'} className="btn-3d btn-3d-emerald disabled:opacity-50">
                  {savingSettings === 'notif' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Save Notification Settings
                </button>
              </div>
            </div>

            {/* ===== Payment Gateways Management ===== */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Payment Gateways</h3>
                  <p className="text-sm text-slate-400">Manage payment gateways, set API keys, enable/disable, choose primary</p>
                </div>
              </div>

              {gateways.length === 0 ? (
                <p className="text-slate-500 text-sm">No gateways configured. They will be seeded on next server restart.</p>
              ) : (
                <div className="space-y-3">
                  {gateways.map(gw => (
                    <div key={gw.id} className={`p-4 rounded-xl border transition ${gw.is_enabled ? 'bg-white/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/5 opacity-70'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {gwTypeIcon(gw.gateway_type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{gw.display_name}</span>
                              {gw.is_primary && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">PRIMARY</span>
                              )}
                              {gw.is_enabled && !gw.is_primary && (
                                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full font-bold">ENABLED</span>
                              )}
                              {!gw.is_enabled && (
                                <span className="bg-white/5 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">DISABLED</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {gw.gateway_type} | {gw.supports_upi ? 'UPI' : ''}{gw.supports_cards ? ' Cards' : ''}{gw.supports_netbanking ? ' NetBanking' : ''}{gw.upi_intent ? ' (Intent)' : ''}
                              {gw.gateway_type === 'custom_upi' && gw.custom_upi_id ? ` | VPA: ${gw.custom_upi_id}` : ''}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {gw.api_key ? `Key: ${gw.api_key.substring(0, 12)}...` : 'No API key set'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleGwToggle(gw.id)} title={gw.is_enabled ? 'Disable' : 'Enable'}
                            className={`p-2 rounded-lg transition ${gw.is_enabled ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                            {gw.is_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                          {gw.is_enabled && !gw.is_primary && (
                            <button onClick={() => handleGwPrimary(gw.id)} title="Set as Primary"
                              className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition">
                              <Zap size={16} />
                            </button>
                          )}
                          <button onClick={() => handleGwTest(gw.id)} title="Test Connection" disabled={testingGw === gw.id}
                            className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition">
                            {testingGw === gw.id ? <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /> : <TestTube size={16} />}
                          </button>
                          <button onClick={() => openEditGateway(gw)} title="Edit / Set Keys"
                            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition">
                            <Key size={16} />
                          </button>
                          <button onClick={() => handleGwDelete(gw.id)} title="Delete"
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =============== ADD TEACHER MODAL =============== */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-dark rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 flex items-center justify-between p-6 border-b z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus size={20} className="text-emerald-400" /> Add New Teacher
                </h3>
                <p className="text-sm text-slate-500">Create a new teacher account</p>
              </div>
              <button onClick={() => { setShowAddTeacher(false); setAddTeacherMsg({ type: '', text: '' }); }}
                className="p-2 hover:bg-white/5 rounded-full transition text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                  <input type="text" value={addTeacherForm.full_name}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, full_name: e.target.value })}
                    placeholder="Teacher's full name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                  <input type="email" value={addTeacherForm.email}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, email: e.target.value })}
                    placeholder="teacher@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input type="tel" value={addTeacherForm.phone}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, phone: e.target.value })}
                    placeholder="9876543210" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                  <input type="text" value={addTeacherForm.city}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, city: e.target.value })}
                    placeholder="e.g. Jaipur" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
                  <input type="text" value={addTeacherForm.state}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, state: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                  <input type="text" value={addTeacherForm.password}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, password: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Qualification</label>
                  <select value={addTeacherForm.qualification}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, qualification: e.target.value })}
                    className={inputCls}>
                    {['B.Ed', 'M.Ed', 'B.Sc + B.Ed', 'M.Sc + B.Ed', 'M.A + B.Ed', 'Ph.D', 'MBA', 'B.Tech', 'MCA', 'M.Sc', 'M.A'].map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Experience (years)</label>
                  <input type="number" value={addTeacherForm.experience_years} min={0} max={40}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, experience_years: Number(e.target.value) })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Hourly Rate (Rs)</label>
                  <input type="number" value={addTeacherForm.hourly_rate} min={50} max={5000}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, hourly_rate: Number(e.target.value) })}
                    className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                  <textarea value={addTeacherForm.bio}
                    onChange={e => setAddTeacherForm({ ...addTeacherForm, bio: e.target.value })}
                    placeholder="Brief description about the teacher..."
                    rows={2} className={inputCls + ' resize-none'} />
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><Banknote size={16} className="text-emerald-400" /> Bank Details (for Payout)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Bank Name</label>
                    <input type="text" value={addTeacherForm.bank_name}
                      onChange={e => setAddTeacherForm({ ...addTeacherForm, bank_name: e.target.value })}
                      placeholder="e.g. State Bank of India" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Account Number</label>
                    <input type="text" value={addTeacherForm.bank_account}
                      onChange={e => setAddTeacherForm({ ...addTeacherForm, bank_account: e.target.value })}
                      placeholder="e.g. 1234567890123456" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">IFSC Code</label>
                    <input type="text" value={addTeacherForm.bank_ifsc}
                      onChange={e => setAddTeacherForm({ ...addTeacherForm, bank_ifsc: e.target.value })}
                      placeholder="e.g. SBIN0001234" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">UPI ID</label>
                    <input type="text" value={addTeacherForm.upi_id}
                      onChange={e => setAddTeacherForm({ ...addTeacherForm, upi_id: e.target.value })}
                      placeholder="e.g. teacher@upi" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Subjects Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subjects</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-white/5 rounded-xl border border-white/10">
                  {subjects.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        addTeacherForm.subject_ids.includes(s.id)
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-emerald-500/10'
                      }`}
                    >{s.name}</button>
                  ))}
                </div>
              </div>

              {/* Auto Approve */}
              <label className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-xl cursor-pointer border border-emerald-500/20">
                <input type="checkbox" checked={addTeacherForm.auto_approve}
                  onChange={e => setAddTeacherForm({ ...addTeacherForm, auto_approve: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 rounded" />
                <div>
                  <span className="text-sm font-medium text-slate-300">Auto-approve teacher</span>
                  <p className="text-xs text-slate-500">Teacher will be immediately visible to students</p>
                </div>
              </label>

              {addTeacherMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  addTeacherMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {addTeacherMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}
                  {addTeacherMsg.text}
                </div>
              )}

              <button onClick={handleAddTeacher} disabled={addingTeacher}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-xl font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
          <div className="glass-dark rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 flex items-center justify-between p-6 border-b z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus size={20} className="text-cyan-400" /> Add New Student
                </h3>
                <p className="text-sm text-slate-500">Create a new student account</p>
              </div>
              <button onClick={() => { setShowAddStudent(false); setAddStudentMsg({ type: '', text: '' }); }}
                className="p-2 hover:bg-white/5 rounded-full transition text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                  <input type="text" value={addStudentForm.full_name}
                    onChange={e => setAddStudentForm({ ...addStudentForm, full_name: e.target.value })}
                    placeholder="Student's full name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                  <input type="email" value={addStudentForm.email}
                    onChange={e => setAddStudentForm({ ...addStudentForm, email: e.target.value })}
                    placeholder="student@gmail.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input type="tel" value={addStudentForm.phone}
                    onChange={e => setAddStudentForm({ ...addStudentForm, phone: e.target.value })}
                    placeholder="9876543210" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                  <input type="text" value={addStudentForm.city}
                    onChange={e => setAddStudentForm({ ...addStudentForm, city: e.target.value })}
                    placeholder="e.g. Delhi" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
                  <input type="text" value={addStudentForm.state}
                    onChange={e => setAddStudentForm({ ...addStudentForm, state: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                  <input type="text" value={addStudentForm.password}
                    onChange={e => setAddStudentForm({ ...addStudentForm, password: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              {addStudentMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  addStudentMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {addStudentMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}
                  {addStudentMsg.text}
                </div>
              )}

              <button onClick={handleAddStudent} disabled={addingStudent}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-xl font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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

      {/* =============== EDIT TEACHER MODAL =============== */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-dark rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 flex items-center justify-between p-6 border-b z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 size={20} className="text-emerald-400" /> Edit Teacher
                </h3>
                <p className="text-sm text-slate-500">Update teacher details and bank information</p>
              </div>
              <button onClick={() => { setEditingTeacher(null); setEditTeacherMsg({ type: '', text: '' }); }}
                className="p-2 hover:bg-white/5 rounded-full transition text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input type="text" value={editTeacherForm.full_name}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, full_name: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input type="email" value={editTeacherForm.email}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, email: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input type="tel" value={editTeacherForm.phone}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, phone: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                  <input type="text" value={editTeacherForm.city}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, city: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
                  <input type="text" value={editTeacherForm.state}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, state: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Hourly Rate (Rs)</label>
                  <input type="number" value={editTeacherForm.hourly_rate}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, hourly_rate: Number(e.target.value) })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Experience (years)</label>
                  <input type="number" value={editTeacherForm.experience_years}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, experience_years: Number(e.target.value) })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Qualification</label>
                  <input type="text" value={editTeacherForm.qualification}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, qualification: e.target.value })}
                    className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
                  <textarea value={editTeacherForm.bio}
                    onChange={e => setEditTeacherForm({ ...editTeacherForm, bio: e.target.value })}
                    rows={2} className={inputCls + ' resize-none'} />
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Banknote size={16} className="text-emerald-400" /> Bank Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Bank Name</label>
                    <input type="text" value={editTeacherForm.bank_name}
                      onChange={e => setEditTeacherForm({ ...editTeacherForm, bank_name: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Account Number</label>
                    <input type="text" value={editTeacherForm.bank_account}
                      onChange={e => setEditTeacherForm({ ...editTeacherForm, bank_account: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">IFSC Code</label>
                    <input type="text" value={editTeacherForm.bank_ifsc}
                      onChange={e => setEditTeacherForm({ ...editTeacherForm, bank_ifsc: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">UPI ID</label>
                    <input type="text" value={editTeacherForm.upi_id}
                      onChange={e => setEditTeacherForm({ ...editTeacherForm, upi_id: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {editTeacherMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  editTeacherMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {editTeacherMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}
                  {editTeacherMsg.text}
                </div>
              )}

              <button onClick={handleSaveTeacher} disabled={savingTeacher}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-xl font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {savingTeacher ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== EDIT STUDENT MODAL =============== */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-dark rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 flex items-center justify-between p-6 border-b z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 size={20} className="text-cyan-400" /> Edit Student
                </h3>
                <p className="text-sm text-slate-500">Update student details</p>
              </div>
              <button onClick={() => { setEditingStudent(null); setEditStudentMsg({ type: '', text: '' }); }}
                className="p-2 hover:bg-white/5 rounded-full transition text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input type="text" value={editStudentForm.full_name}
                    onChange={e => setEditStudentForm({ ...editStudentForm, full_name: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input type="email" value={editStudentForm.email}
                    onChange={e => setEditStudentForm({ ...editStudentForm, email: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input type="tel" value={editStudentForm.phone}
                    onChange={e => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                  <input type="text" value={editStudentForm.city}
                    onChange={e => setEditStudentForm({ ...editStudentForm, city: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
                  <input type="text" value={editStudentForm.state}
                    onChange={e => setEditStudentForm({ ...editStudentForm, state: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              {editStudentMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  editStudentMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {editStudentMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}
                  {editStudentMsg.text}
                </div>
              )}

              <button onClick={handleSaveStudent} disabled={savingStudent}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-xl font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {savingStudent ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =============== EDIT GATEWAY MODAL =============== */}
      {editingGateway && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-dark rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 flex items-center justify-between p-6 border-b z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key size={20} className="text-amber-400" /> Edit Gateway - {editingGateway.display_name}
                </h3>
                <p className="text-sm text-slate-500">Configure API keys and settings</p>
              </div>
              <button onClick={() => { setEditingGateway(null); setGwMsg({ type: '', text: '' }); }}
                className="p-2 hover:bg-white/5 rounded-full transition text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                  <input type="text" value={gwForm.display_name || ''} onChange={e => setGwForm({ ...gwForm, display_name: e.target.value })} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">API Key / App ID</label>
                  <input type="text" value={gwForm.api_key || ''} onChange={e => setGwForm({ ...gwForm, api_key: e.target.value })}
                    placeholder={editingGateway.gateway_type === 'razorpay' ? 'rzp_live_xxxxx or rzp_test_xxxxx' : editingGateway.gateway_type === 'phonepe' ? 'PhonePe API Key' : 'Enter API Key'}
                    className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">API Secret / Salt (leave blank to keep existing)</label>
                  <input type="password" value={gwForm.api_secret || ''} onChange={e => setGwForm({ ...gwForm, api_secret: e.target.value })}
                    placeholder="Enter new secret to update" className={inputCls} />
                </div>
                {(editingGateway.gateway_type === 'phonepe' || editingGateway.gateway_type === 'cashfree') && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Merchant ID</label>
                    <input type="text" value={gwForm.merchant_id || ''} onChange={e => setGwForm({ ...gwForm, merchant_id: e.target.value })} placeholder="Enter Merchant ID" className={inputCls} />
                  </div>
                )}
                {editingGateway.gateway_type === 'custom_upi' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1">UPI VPA (e.g. merchant@upi)</label>
                      <input type="text" value={gwForm.custom_upi_id || ''} onChange={e => setGwForm({ ...gwForm, custom_upi_id: e.target.value })}
                        placeholder="yourname@paytm or yourname@upi" className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1">QR Code Data (UPI deep link or image URL)</label>
                      <textarea value={gwForm.custom_qr_data || ''} onChange={e => setGwForm({ ...gwForm, custom_qr_data: e.target.value })}
                        placeholder="upi://pay?pa=yourname@upi&pn=YourName&cu=INR or paste QR image URL" rows={3} className={inputCls + ' resize-none'} />
                    </div>
                  </>
                )}
              </div>

              {/* Feature Toggles */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-bold text-slate-300 mb-3">Supported Payment Methods</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'supports_upi', label: 'UPI Payments', icon: <QrCode size={14} /> },
                    { key: 'supports_cards', label: 'Card Payments', icon: <CreditCard size={14} /> },
                    { key: 'supports_netbanking', label: 'Net Banking', icon: <Building2 size={14} /> },
                    { key: 'upi_intent', label: 'UPI Intent Mode', icon: <Smartphone size={14} /> },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/5 hover:bg-white/10 transition">
                      <input type="checkbox" checked={!!gwForm[item.key]}
                        onChange={e => setGwForm({ ...gwForm, [item.key]: e.target.checked })}
                        className="w-4 h-4 text-emerald-500 rounded" />
                      <span className="text-slate-400">{item.icon}</span>
                      <span className="text-sm text-slate-300">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {gwMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${gwMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {gwMsg.type === 'success' ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}
                  {gwMsg.text}
                </div>
              )}

              <button onClick={handleSaveGateway} disabled={savingGw}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-xl font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {savingGw ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Gateway Settings</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

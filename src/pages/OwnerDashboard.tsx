import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { TrendingUp, Calendar, Star, IndianRupee, AlertTriangle, Plus, Wallet, MapPin, CheckCircle, XCircle, CalendarOff, Menu, ChevronLeft, LogOut, BarChart3, FileText, Lock, Unlock, Edit, Trash2, MessageSquare, Tag, Users, Copy, User, Download, Search, Navigation, Shield, Upload, RefreshCw, Info, X, TrendingDown } from 'lucide-react';

interface DashboardData {
  grounds: Array<Record<string, unknown>>;
  stats: { total_revenue: number; total_bookings: number; monthly_revenue: number; avg_rating: number; today_bookings?: number; available_slots?: number };
  recent_bookings: Array<Record<string, unknown>>;
  cash_tracking: { online_collected: number; cash_collected: number; commission_due: number; net_payable: number; online_commission?: number; cash_commission?: number; commission_owed?: number; settlement_balance?: number };
  wallet_balance?: number;
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const validTabs = ['dashboard','grounds','bookings','wallet','settlement','payout','ledger','tickets','addground','coupons','autoreplies','crm','bulkslots','profile','tournaments','equipment','chat','manageslots','editground'] as const;
  type TabType = typeof validTabs[number];
  const getInitialTab = (): TabType => {
    const hash = window.location.hash.replace('#','') as TabType;
    return validTabs.includes(hash) ? hash : 'dashboard';
  };
  const [tab, setTab] = useState<TabType>(getInitialTab());
  const [slots, setSlots] = useState<Array<Record<string, unknown>>>([]);
  const [selectedGround, setSelectedGround] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [offlineDialog, setOfflineDialog] = useState(false);
  const [offlineData, setOfflineData] = useState({ customer_name: '', customer_phone: '', slot_id: 0, amount: 0 });
  const [offlineBookingDate, setOfflineBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSelfBooking, setIsSelfBooking] = useState(false);
  const [cancelPopup, setCancelPopup] = useState<Record<string, unknown> | null>(null);
  const [rateUserId, setRateUserId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [newGround, setNewGround] = useState({ name: '', address: '', city: 'Jaipur', ground_type: 'box', weekday_price: 800, weekend_price: 1000, evening_extra: 200, opening_time: '06:00', closing_time: '22:00', amenities: 'Floodlights,Parking', description: '', latitude: '', longitude: '', token_money_percent: 100 });
  const [, setGroundPhotos] = useState<File[]>([]);
  const [groundPhotoPreviews, setGroundPhotoPreviews] = useState<string[]>([]);
  const [successPopup, setSuccessPopup] = useState<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Floodlights', 'Parking']);
    const [editSelectedAmenities, setEditSelectedAmenities] = useState<string[]>([]);
    const allAmenities = ['Floodlights', 'Parking', 'Washroom', 'Water', 'Changing Room', 'Canteen', 'WiFi', 'CCTV', 'Coaching', 'First Aid', 'Scoreboard', 'Equipment', 'Nets', 'Multiple Pitches', 'Garden', 'AC', 'Seating', 'Music System'];
  const [ownerListSearch, setOwnerListSearch] = useState('');
  const [, _setWallet] = useState<Record<string, unknown> | null>(null);
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [kycDoc, setKycDoc] = useState('');
  const [, _setKycFileName] = useState('');
  const [, _setKycUploadProgress] = useState(0);
  void _setKycFileName; void _setKycUploadProgress;
  const [upiId, setUpiId] = useState('');
  const [ownerKycStatus, setOwnerKycStatus] = useState('none');
  const [ownerProfile, setOwnerProfile] = useState<Record<string, unknown> | null>(null);
  const [changingAccount, setChangingAccount] = useState(false);
  const [walletSection, setWalletSection] = useState<'overview' | 'kyc'>('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [kycFiles, setKycFiles] = useState<File[]>([]);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [ownerToast, setOwnerToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; show: boolean }>({ message: '', type: 'info', show: false });
  const showOwnerToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setOwnerToast({ message, type, show: true });
    setTimeout(() => setOwnerToast(prev => ({ ...prev, show: false })), 4500);
  };
  const [dayOffDate, setDayOffDate] = useState('');
  const [dayOffReason, setDayOffReason] = useState('');
  const [dayOffGround, setDayOffGround] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // V13 new state
  // const [ownerAnalytics, setOwnerAnalytics] = useState<Record<string, unknown>>({});  // Analytics removed
  const [ownerCoupons, setOwnerCoupons] = useState<Array<Record<string, unknown>>>([]);
  const [ownerAutoReplies, setOwnerAutoReplies] = useState<Array<Record<string, unknown>>>([]);
  const [ownerCRM, setOwnerCRM] = useState<Array<Record<string, unknown>>>([]);
  const [bulkSlotDate, setBulkSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkSlotEndDate, setBulkSlotEndDate] = useState('');
  const [bulkSlotStart, setBulkSlotStart] = useState('06:00');
  const [bulkSlotEnd, setBulkSlotEnd] = useState('22:00');
  const [bulkSlotDuration, setBulkSlotDuration] = useState(60);
  const [bulkSlotPrice, setBulkSlotPrice] = useState(800);
  const [bulkSlotGroundId, setBulkSlotGroundId] = useState<number>(0);
  const [editingSlot, setEditingSlot] = useState<Record<string, unknown> | null>(null);
  const [editSlotPrice, setEditSlotPrice] = useState('');
  const [addSlotDialog, setAddSlotDialog] = useState(false);
  const [newSlot, setNewSlot] = useState({ start_time: '', end_time: '', price: 0 });
  const [ownerTickets, setOwnerTickets] = useState<Array<Record<string, unknown>>>([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Record<string, unknown> | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketGroundId, setTicketGroundId] = useState<number>(0);

  const [ownerTournaments, setOwnerTournaments] = useState<Array<Record<string, unknown>>>([]);
  const [ownerEquipmentList, setOwnerEquipmentList] = useState<Array<Record<string, unknown>>>([]);
  const [showEditTournament, setShowEditTournament] = useState<Record<string, unknown> | null>(null);
  const [editTournamentData, setEditTournamentData] = useState<Record<string, unknown>>({});
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [createTournamentData, setCreateTournamentData] = useState<Record<string, unknown>>({ name: '', sport_type: 'cricket', max_teams: 8, entry_fee: 0, prize_pool: 0, start_date: '', end_date: '', description: '', ground_id: 0 });
  const [showCreateEquipment, setShowCreateEquipment] = useState(false);
  const [newEquipmentData, setNewEquipmentData] = useState({ name: '', price_per_hour: 50, quantity: 5 });
  const [editEquipment, setEditEquipment] = useState<Record<string, unknown> | null>(null);
  const [tournamentParticipants, setTournamentParticipants] = useState<Array<Record<string, unknown>>>([]);
  const [participantsTournamentId, setParticipantsTournamentId] = useState<number | null>(null);
  const [participantsTournamentName, setParticipantsTournamentName] = useState('');
  const [showEditGroundModal, setShowEditGroundModal] = useState<Record<string, unknown> | null>(null);
  const [editGroundFormData, setEditGroundFormData] = useState<Record<string, unknown>>({});
  const [, setEditGroundPhoto] = useState<File | null>(null);
  const [editGroundPhotos, setEditGroundPhotos] = useState<File[]>([]);
  const [editGroundPhotoPreviews, setEditGroundPhotoPreviews] = useState<string[]>([]);
  const grounds = data?.grounds || [];

  const [menuSearch, setMenuSearch] = useState('');
  const ownerTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'grounds', label: 'My Grounds', icon: MapPin },
    { id: 'addground', label: 'Add Ground', icon: Plus },
    { id: 'bulkslots', label: 'Bulk Slots', icon: Copy },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'ledger', label: 'Ledger', icon: FileText },
    // { id: 'analytics', label: 'Analytics', icon: TrendingUp },  // Removed
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'tournaments', label: 'Tournaments', icon: Calendar },
    { id: 'equipment', label: 'Equipment', icon: Tag },
    { id: 'autoreplies', label: 'Auto Reply', icon: MessageSquare },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'tickets', label: 'Support', icon: MessageSquare },
    { id: 'profile', label: 'My Profile', icon: User },
  ];
  const filteredOwnerTabs = menuSearch ? ownerTabs.filter(t => t.label.toLowerCase().includes(menuSearch.toLowerCase())) : ownerTabs;

  const changeTab = (t: TabType) => {
    setTab(t);
    window.location.hash = t;
  };

  useEffect(() => {
    const onHash = () => { const h = window.location.hash.replace('#','') as TabType; if (validTabs.includes(h)) setTab(h); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || (user.role !== 'owner' && user.role !== 'admin')) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = () => {
    api.getOwnerDashboard().then(setData).catch(() => navigate('/login')).finally(() => setLoading(false));
    api.getWallet().then(_setWallet).catch(() => {});
    api.getProfile().then(p => { setOwnerProfile(p); setOwnerKycStatus(String(p.kyc_status || 'none')); if(p.bank_name && !bankName) setBankName(String(p.bank_name)); if(p.bank_account && !accountNo) setAccountNo(String(p.bank_account)); if(p.bank_ifsc && !ifsc) setIfsc(String(p.bank_ifsc)); if(p.upi_id && !upiId) setUpiId(String(p.upi_id)); if(p.kyc_doc_type && !kycDoc) setKycDoc(String(p.kyc_doc_type)); }).catch(() => {});
  };

  const loadTab = () => {
    // if (tab === 'analytics') api.getOwnerAnalytics().then(setOwnerAnalytics).catch(() => {});  // Analytics removed
    if (tab === 'coupons') api.getOwnerCoupons().then(setOwnerCoupons).catch(() => {});
    if (tab === 'autoreplies') api.getOwnerAutoReplies().then(setOwnerAutoReplies).catch(() => {});
    if (tab === 'crm') api.getOwnerCRM().then(setOwnerCRM).catch(() => {});
    if (tab === 'tournaments') api.getOwnerTournaments().then(setOwnerTournaments).catch(() => {});
    if (tab === 'grounds') api.getOwnerChangeRequests().then(() => {}).catch(() => {});
    if (tab === 'equipment' && grounds.length > 0) api.getGroundEquipment(grounds[0]?.id as number || 0).then(setOwnerEquipmentList).catch(() => {});
  };

  useEffect(() => { loadTab(); }, [tab]);

  const [ownerDateFilter, setOwnerDateFilter] = useState('');
  const [ownerStatusFilter, setOwnerStatusFilter] = useState('all');
  void ownerDateFilter; void setOwnerDateFilter; void ownerStatusFilter; void setOwnerStatusFilter;

  const ownerExportPDF = (title: string, headers: string[], rows: string[][]) => {
    let html = '<html><head><style>body{font-family:Arial;padding:20px}h1{color:#1e40af;font-size:22px}table{width:100%;border-collapse:collapse;margin-top:15px}th{background:#1e40af;color:white;padding:10px;text-align:left;font-size:12px}td{padding:8px;border-bottom:1px solid #e5e7eb;font-size:11px}tr:nth-child(even){background:#f9fafb}.footer{margin-top:20px;text-align:center;color:#9ca3af;font-size:10px}</style></head><body>';
    html += '<h1>' + title + '</h1><p style="color:#6b7280;font-size:12px">Generated: ' + new Date().toLocaleString('en-IN') + '</p>';
    html += '<table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>';
    rows.forEach(r => { html += '<tr>' + r.map(c => '<td>' + (c || '-') + '</td>').join('') + '</tr>'; });
    html += '</tbody></table><div class="footer">BookAGround Owner Report</div></body></html>';
    const w = window.open('', '_blank'); if(w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const ownerExportCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmt);
    if (!amt || amt < 100) { showOwnerToast('Minimum Rs.100 withdraw kar sakte ho', 'warning'); return; }
    const balance = data?.cash_tracking?.net_payable ?? data?.wallet_balance ?? 0;
    if (balance <= 0) { showOwnerToast('Insufficient balance! Aapka balance Rs.' + balance + ' hai.', 'warning'); return; }
    if (amt > balance) { showOwnerToast('Amount balance se zyada hai! Available: Rs.' + balance, 'warning'); return; }
    setWithdrawing(true);
    try { await api.ownerPayout(amt); const charge = Math.round(amt * 0.03); showOwnerToast(`Withdrawal request of Rs.${amt - charge} submitted (3% charge: Rs.${charge}). Admin will process it.`, 'success'); setWithdrawAmt(''); setShowWithdrawModal(false); loadData(); }
    catch (e: unknown) { showOwnerToast(e instanceof Error ? e.message : 'Withdrawal failed', 'error'); }
    setWithdrawing(false);
  };

  const handleKYC = async () => {
    if (!bankName || !accountNo || !ifsc || !kycDoc) { showOwnerToast('Sab KYC fields fill karo', 'warning'); return; }
    if (kycFiles.length === 0) {
      // Check old file input as fallback
      const fileInput = document.getElementById('owner-kyc-file') as HTMLInputElement;
      if (!fileInput?.files?.[0]) { showOwnerToast('KYC document upload karo', 'warning'); return; }
    }
    setSubmittingKyc(true);
    try {
      const kycData: Record<string, unknown> = { bank_name: bankName, account_number: accountNo, ifsc_code: ifsc, document_type: kycDoc, upi_id: upiId || undefined };
      // Read files as base64
      if (kycFiles.length > 0) {
        const file = kycFiles[0];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1]); };
          reader.readAsDataURL(file);
        });
        kycData.kyc_doc_data = base64;
        kycData.kyc_doc_filename = file.name;
      } else {
        const fileInput = document.getElementById('owner-kyc-file') as HTMLInputElement;
        if (fileInput?.files?.[0]) {
          const file = fileInput.files[0];
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1]); };
            reader.readAsDataURL(file);
          });
          kycData.kyc_doc_data = base64;
          kycData.kyc_doc_filename = file.name;
        }
      }
      await api.ownerKYC(kycData);
      setOwnerKycStatus('pending');
      showOwnerToast('KYC submitted successfully! Admin will verify shortly.', 'success');
      setKycFiles([]);
      loadData();
    }
    catch (e: unknown) { showOwnerToast(e instanceof Error ? e.message : 'KYC submission failed', 'error'); }
    setSubmittingKyc(false);
  };

  const handleBlockSlot = async (slotId: number) => {
    try { await api.blockSlot(slotId); if (selectedGround) loadSlots(selectedGround, selectedDate); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Delete this slot? This cannot be undone.')) return;
    try { await api.deleteOwnerSlot(slotId); if (selectedGround) loadSlots(selectedGround, selectedDate); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const [ownerTxns, setOwnerTxns] = useState<Array<Record<string, unknown>>>([]);
  const loadOwnerTxns = async () => {
    try { const data = await api.getOwnerTransactions(); setOwnerTxns(data); }
    catch { setOwnerTxns([]); }
  };

  const handleUpdateSlotPrice = async (slotId: number, price: number) => {
    try { await api.updateOwnerSlot(slotId, { price }); setEditingSlot(null); setEditSlotPrice(''); if (selectedGround) loadSlots(selectedGround, selectedDate); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleAddSlot = async () => {
    if (!selectedGround || !newSlot.start_time || !newSlot.end_time || !newSlot.price) { alert('Fill all slot details'); return; }
    try { await api.addOwnerSlot({ ground_id: selectedGround, date: selectedDate, start_time: newSlot.start_time, end_time: newSlot.end_time, price: newSlot.price }); setAddSlotDialog(false); setNewSlot({ start_time: '', end_time: '', price: 0 }); loadSlots(selectedGround, selectedDate); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const loadSlots = async (groundId: number, date: string) => {
    try { const s = await api.getOwnerSlots(groundId, date); setSlots(s); }
    catch { try { const s = await api.getSlots(groundId, date); setSlots(s); } catch { setSlots([]); } }
  };

  const handleCancel = async (bookingId: string) => {
    try { const res = await api.ownerCancelBooking(bookingId); alert(res.message || 'Cancelled! Rs.100 penalty applied.'); setCancelPopup(null); loadData(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleOfflineBooking = async () => {
    try {
      await api.ownerOfflineBooking({ ...offlineData, ground_id: selectedGround, date: offlineBookingDate || selectedDate, is_self: isSelfBooking });
      alert(isSelfBooking ? 'Self booking recorded! No commission charged.' : 'Offline booking recorded!'); setOfflineDialog(false); setIsSelfBooking(false); loadData();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); setOfflineDialog(false); setIsSelfBooking(false); }
  };

  const handleRateUser = async (bookingId: string) => {
    if (userRating === 0) return;
    try { await api.rateUser(bookingId, userRating); alert('User rated!'); setRateUserId(null); setUserRating(0); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleAttendance = async (bookingId: string, status: string) => {
    try { await api.markAttendance(bookingId, status); alert(status === 'attended' ? 'Marked as attended!' : 'Marked as no-show! Token forfeited. Slot released.'); loadData(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try { await api.ownerApproveBooking(bookingId); alert('Booking approved and confirmed!'); loadData(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleVerifyCash = async (bookingId: string) => {
    if (!confirm('Verify cash payment received for this booking? This will confirm the booking.')) return;
    try { await api.ownerVerifyCash(bookingId); alert('Cash payment verified! Booking confirmed.'); loadData(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleDayOff = async () => {
    if (!dayOffGround || !dayOffDate) { alert('Select ground and date'); return; }
    try { await api.setDayOff(dayOffGround, dayOffDate, dayOffReason || 'Day Off'); alert('Day off set!'); setDayOffDate(''); setDayOffReason(''); setDayOffGround(null); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const loadOwnerTickets = async () => {
    try { const data = await api.getOwnerTickets(); setOwnerTickets(data); }
    catch { setOwnerTickets([]); }
  };

  const handleCreateOwnerTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) { alert('Fill subject and message'); return; }
    try { await api.createOwnerTicket({ subject: newTicketSubject, message: newTicketMessage, ground_id: ticketGroundId || undefined }); alert('Ticket created! Admin will respond shortly.'); setNewTicketSubject(''); setNewTicketMessage(''); setShowNewTicket(false); setTicketGroundId(0); loadOwnerTickets(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleOwnerTicketReply = async (ticketId: number) => {
    if (!ticketReply.trim()) return;
    try { await api.replyOwnerTicket(ticketId, ticketReply); setTicketReply(''); loadOwnerTickets(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!data) return null;

  const getDates = () => { const d = []; for(let i=0;i<7;i++){const dt=new Date();dt.setDate(dt.getDate()+i);d.push(dt.toISOString().split('T')[0]);}return d; };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full z-40 bg-gradient-to-b from-blue-900 to-indigo-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <MapPin size={24} className="text-blue-300 flex-shrink-0" />
          {sidebarOpen && <h1 className="font-bold text-lg truncate">Owner Panel</h1>}
        </div>
        {sidebarOpen && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="text" placeholder="Search menu..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
                className="w-full bg-white/10 text-white text-xs placeholder-white/40 rounded-lg pl-8 pr-3 py-2 outline-none focus:bg-white/20 transition" />
            </div>
          </div>
        )}
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {filteredOwnerTabs.map(t => (
            <button key={t.id} onClick={() => { changeTab(t.id as TabType); setMenuSearch(''); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${tab === t.id ? 'bg-white/20 text-white font-semibold shadow-lg' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <t.icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{t.label}</span>}
            </button>
          ))}
          {menuSearch && filteredOwnerTabs.length === 0 && sidebarOpen && (
            <p className="text-white/40 text-xs text-center py-4">No menu items found</p>
          )}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white text-sm transition">
            {sidebarOpen ? <><ChevronLeft size={18} /><span>Collapse</span></> : <Menu size={18} />}
          </button>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-500/20 text-sm mt-1 transition">
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="text-xl font-bold text-gray-800 capitalize">{ownerTabs.find(t => t.id === tab)?.label || (tab === 'manageslots' ? 'Manage Slots' : tab === 'editground' ? 'Edit Ground' : tab)}</h2>
            <p className="text-sm text-gray-500">BookAGround Owner Panel</p>
          </div>
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">O</div>
        </header>

      <div className="p-8">
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { icon: IndianRupee, label: 'Total Revenue', value: `Rs.${data.stats.total_revenue.toLocaleString()}`, color: 'text-green-600 bg-green-50' },
                { icon: Calendar, label: 'Total Bookings', value: data.stats.total_bookings, color: 'text-blue-600 bg-blue-50' },
                { icon: TrendingUp, label: 'Monthly Revenue', value: `Rs.${data.stats.monthly_revenue.toLocaleString()}`, color: 'text-purple-600 bg-purple-50' },
                { icon: Star, label: 'Avg Rating', value: data.stats.avg_rating.toFixed(1), color: 'text-yellow-600 bg-yellow-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color} mb-2`}><s.icon size={18} /></div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Today's Bookings */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <h3 className="font-bold text-gray-800 text-lg mb-3">Today's Bookings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">Customer</th><th className="p-3">Time</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                  <tbody>
                    {data.recent_bookings.slice(0,5).map((b: Record<string, unknown>) => (
                      <tr key={b.id as number} className="border-t">
                        <td className="p-3"><p className="font-medium">{b.user_name as string}</p><p className="text-xs text-gray-500">{b.user_phone as string}</p></td>
                        <td className="p-3 text-center text-xs">{b.start_time as string}-{b.end_time as string}</td>
                        <td className="p-3 text-center">
                          <p className="font-medium text-green-600">Rs.{b.total_amount as number}</p>
                          <p className="text-xs text-gray-400">{(b.remaining_amount as number) > 0 ? `Token: Rs.${b.token_amount}` : 'Fully Paid'}</p>
                        </td>
                        <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{b.status as string}</span></td>
                        <td className="p-3 text-center flex gap-1 justify-center">
                          {b.status === 'pending_cash' && <button onClick={() => handleVerifyCash(b.booking_id as string)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded flex items-center gap-0.5"><CheckCircle size={10}/> Verify Cash</button>}
                          {b.status === 'confirmed' && <button onClick={() => setCancelPopup(b)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">Cancel</button>}
                          {b.status === 'completed' && <button onClick={() => setRateUserId(b.booking_id as string)} className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded">Rate User</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Settlement Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
              <h3 className="font-bold text-lg mb-2">Next Settlement</h3>
              <div className="grid grid-cols-4 gap-3">
                <div><p className="text-sm opacity-80">Online</p><p className="text-xl font-bold">Rs.{data.cash_tracking.online_collected.toLocaleString()}</p></div>
                <div><p className="text-sm opacity-80">Cash</p><p className="text-xl font-bold">Rs.{data.cash_tracking.cash_collected.toLocaleString()}</p></div>
                <div><p className="text-sm opacity-80">Commission</p><p className="text-xl font-bold">Rs.{data.cash_tracking.commission_due.toLocaleString()}</p></div>
                <div><p className="text-sm opacity-80">Net Payable</p><p className="text-xl font-bold">Rs.{data.cash_tracking.net_payable.toLocaleString()}</p></div>
              </div>
            </div>
          </>
        )}

        {/* MY GROUNDS TAB */}
        {tab === 'grounds' && (
          <>
            <div className="space-y-4 mb-6">
              {data.grounds.map((g: Record<string, unknown>) => (
                <div key={g.id as number} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{g.name as string}</h3>
                      <p className="text-sm text-gray-500">{g.address as string}</p>
                      {!Number(g.is_active) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium border border-orange-200">
                          🔴 Inactive — Not visible to customers
                        </span>
                      )}
                      {!!Number(g.is_active) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium border border-green-200">
                          ✅ Live — Visible to customers
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">Rs.{g.weekday_price as number}/hr</p>
                      <p className="text-sm text-yellow-600 flex items-center gap-0.5 justify-end"><Star size={12} /> {g.rating as number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button onClick={() => { setSelectedGround(g.id as number); loadSlots(g.id as number, selectedDate); changeTab('manageslots'); }}
                      className="text-sm px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1">
                      <Calendar size={14}/> Manage Slots
                    </button>
                    <button disabled={isSubmitting} onClick={async () => { if (isSubmitting) return; setIsSubmitting(true); try { await api.toggleOwnerGround(g.id as number); loadData(); } catch(e: unknown) { setErrorPopup(e instanceof Error ? e.message : 'Failed to toggle'); } finally { setIsSubmitting(false); } }}
                      className={`text-sm px-4 py-2 rounded-lg flex items-center gap-1 ${Number(g.is_active) ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                      {Number(g.is_active) ? '🟢 Active' : '🔴 Inactive'}
                    </button>
                    <button onClick={() => { setShowEditGroundModal(g); const amenitiesStr = (g.amenities as string) || ''; setEditSelectedAmenities(amenitiesStr ? amenitiesStr.split(',').map((a: string) => a.trim()).filter(Boolean) : []); setEditGroundFormData({ name: g.name, address: g.address, city: g.city || 'Jaipur', weekday_price: g.weekday_price, weekend_price: g.weekend_price, evening_extra: g.evening_extra || 0, ground_type: g.ground_type || 'box', opening_time: g.opening_time || '06:00', closing_time: g.closing_time || '22:00', description: g.description || '', amenities: g.amenities || '', token_money_percent: g.token_money_percent || 100 }); setEditGroundPhoto(null); setEditGroundPhotos([]); setEditGroundPhotoPreviews([]); changeTab('editground'); }} className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-1"><Edit size={14}/> Edit</button>
                    <button disabled={isSubmitting} onClick={async () => { if (!confirm('Are you sure you want to delete this ground? This cannot be undone.')) return; setIsSubmitting(true); try { await api.deleteOwnerGround(g.id as number); setSuccessPopup('Ground deleted successfully!'); loadData(); } catch(e: unknown) { setErrorPopup(e instanceof Error ? e.message : 'Failed'); } finally { setIsSubmitting(false); } }} className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"><Trash2 size={14}/> Delete</button>
                  </div>
                </div>
              ))}
            </div>

          </>
        )}

        {/* MANAGE SLOTS TAB - opens as separate tab */}
        {tab === 'manageslots' && !selectedGround && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">No ground selected. Please go to My Grounds and click "Manage Slots".</p>
            <button onClick={() => changeTab('grounds')} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mx-auto"><ChevronLeft size={16}/> Go to My Grounds</button>
          </div>
        )}
        {tab === 'manageslots' && selectedGround && (
          <div className="space-y-4">
            <button onClick={() => changeTab('grounds')} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2"><ChevronLeft size={16}/> Back to My Grounds</button>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Slot Management</h3>
                  <p className="text-sm text-gray-500">{data.grounds.find((g: Record<string, unknown>) => g.id === selectedGround)?.name as string || 'Ground'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAddSlotDialog(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Plus size={14}/> Add Slot</button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto mb-4">
                {getDates().map(d => (
                  <button key={d} onClick={() => { setSelectedDate(d); loadSlots(selectedGround, d); }}
                    className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${selectedDate === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {new Date(d).toLocaleDateString('en', {weekday:'short',day:'numeric',month:'short'})}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {slots.map((s: Record<string, unknown>) => (
                  <div key={s.id as number} className={`p-3 rounded-xl text-sm border-2 ${s.status === 'available' ? 'bg-green-50 border-green-300' : s.status === 'booked' ? 'bg-red-50 border-red-300' : s.status === 'blocked' ? 'bg-gray-100 border-gray-400' : 'bg-yellow-50 border-yellow-300'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-800">{s.start_time as string} - {s.end_time as string}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'available' ? 'bg-green-200 text-green-800' : s.status === 'booked' ? 'bg-red-200 text-red-800' : s.status === 'blocked' ? 'bg-gray-300 text-gray-700' : 'bg-yellow-200 text-yellow-800'}`}>{s.status as string}</span>
                    </div>
                    <p className="font-semibold text-blue-600 mb-2">Rs.{s.price as number}</p>
                    {s.status !== 'booked' && s.status !== 'dayoff' && (
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => { setEditingSlot(s); setEditSlotPrice(String(s.price)); }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-0.5 hover:bg-blue-100"><Edit size={10}/> Price</button>
                        <button onClick={() => handleBlockSlot(s.id as number)} className={`text-xs px-2 py-1 rounded flex items-center gap-0.5 ${s.status === 'blocked' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                          {s.status === 'blocked' ? <><Unlock size={10}/> Unblock</> : <><Lock size={10}/> Block</>}
                        </button>
                        <button onClick={() => handleDeleteSlot(s.id as number)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded flex items-center gap-0.5 hover:bg-red-100"><Trash2 size={10}/> Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-200 border border-green-400 rounded"></span> Available ({slots.filter((s: Record<string, unknown>) => s.status === 'available').length})</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 border border-red-400 rounded"></span> Booked ({slots.filter((s: Record<string, unknown>) => s.status === 'booked').length})</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-300 border border-gray-400 rounded"></span> Blocked ({slots.filter((s: Record<string, unknown>) => s.status === 'blocked').length})</span>
              </div>

              {/* Edit Slot Price Modal */}
              {editingSlot && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingSlot(null)}>
                  <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Edit Slot Price</h3>
                    <p className="text-sm text-gray-500 mb-3">{editingSlot.start_time as string} - {editingSlot.end_time as string}</p>
                    <input type="number" placeholder="New Price" className="w-full border rounded-lg px-3 py-2 mb-3" value={editSlotPrice} onChange={e => setEditSlotPrice(e.target.value)} />
                    <div className="flex gap-3"><button onClick={() => setEditingSlot(null)} className="flex-1 border-2 py-2 rounded-xl font-medium">Cancel</button><button onClick={() => handleUpdateSlotPrice(editingSlot.id as number, parseFloat(editSlotPrice))} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium">Save</button></div>
                  </div>
                </div>
              )}

              {/* Add Custom Slot Modal */}
              {addSlotDialog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddSlotDialog(false)}>
                  <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Add Custom Slot</h3>
                    <div className="space-y-3">
                      <div><label className="text-sm text-gray-600">Start Time</label><input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} /></div>
                      <div><label className="text-sm text-gray-600">End Time</label><input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})} /></div>
                      <div><label className="text-sm text-gray-600">Price (Rs.)</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={newSlot.price || ''} onChange={e => setNewSlot({...newSlot, price: parseInt(e.target.value) || 0})} /></div>
                    </div>
                    <div className="flex gap-3 mt-4"><button onClick={() => setAddSlotDialog(false)} className="flex-1 border-2 py-2 rounded-xl font-medium">Cancel</button><button onClick={handleAddSlot} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-medium">Add Slot</button></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {tab === 'bookings' && (
          <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-wrap gap-3">
              <h3 className="font-bold text-gray-800 text-lg">All Bookings</h3>
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center bg-white rounded-lg border px-2 py-1.5 gap-1"><Search size={14} className="text-gray-400" /><input type="text" placeholder="Search..." className="outline-none text-xs w-28" value={ownerListSearch} onChange={e => setOwnerListSearch(e.target.value)} /></div>
                <select className="border rounded-lg px-2 py-1.5 text-xs bg-white" value={ownerStatusFilter} onChange={e => setOwnerStatusFilter(e.target.value)}><option value="all">All Status</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                <button onClick={() => ownerExportCSV('bookings.csv', ['User','Phone','Ground','Date','Time','Amount','Status'], data!.recent_bookings.map(b => [String(b.user_name),String(b.user_phone),String(b.ground_name),String(b.booking_date),String(b.start_time)+'-'+String(b.end_time),'Rs.'+String(b.total_amount),String(b.status)]))} className="bg-green-600 text-white px-2 py-1.5 rounded-lg text-xs flex items-center gap-1"><Download size={12}/> CSV</button>
                <button onClick={() => ownerExportPDF('My Bookings', ['User','Phone','Ground','Date','Time','Amount','Status'], data!.recent_bookings.map(b => [String(b.user_name),String(b.user_phone),String(b.ground_name),String(b.booking_date),String(b.start_time)+'-'+String(b.end_time),'Rs.'+String(b.total_amount),String(b.status)]))} className="bg-red-600 text-white px-2 py-1.5 rounded-lg text-xs flex items-center gap-1"><FileText size={12}/> PDF</button>
              </div>
              <button onClick={() => { if(!selectedGround && data.grounds.length > 0) { setSelectedGround((data.grounds[0] as Record<string,unknown>).id as number); loadSlots((data.grounds[0] as Record<string,unknown>).id as number, selectedDate); } setOfflineDialog(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-orange-600"><Plus size={14}/> Record Offline Booking</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="p-3 text-left">User</th><th className="p-3">Ground</th><th className="p-3">Date/Time</th><th className="p-3">Total</th><th className="p-3">Token</th><th className="p-3">Received</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Location</th><th className="p-3">Attendance</th><th className="p-3">Actions</th></tr></thead>
              <tbody>
                {data.recent_bookings.map((b: Record<string, unknown>) => (
                  <tr key={b.id as number} className="border-t hover:bg-gray-50">
                    <td className="p-3"><p className="font-medium">{b.user_name as string}</p><p className="text-xs text-gray-500">{b.user_phone as string}</p></td>
                    <td className="p-3 text-xs">{b.ground_name as string}</td>
                    <td className="p-3 text-xs text-center">{b.booking_date as string}<br/>{b.start_time as string}-{b.end_time as string}</td>
                    <td className="p-3 text-center"><p className="font-medium">Rs.{b.total_amount as number}</p></td>
                    <td className="p-3 text-center text-blue-600"><p className="font-medium">Rs.{(b.token_amount as number) || 0}</p></td>
                    <td className="p-3 text-center"><p className={`font-medium ${b.status === 'no_show' ? 'text-orange-600' : b.status === 'cancelled' ? 'text-red-500' : 'text-green-600'}`}>Rs.{b.status === 'no_show' ? (b.token_amount as number || 0) : b.status === 'cancelled' ? 0 : b.status === 'completed' || b.status === 'attended' ? (b.total_amount as number) : (b.token_amount as number || 0)}</p>{b.status === 'no_show' && <span className="text-xs text-orange-500">Token Only</span>}{b.status === 'confirmed' && (b.remaining_amount as number) > 0 && <span className="text-xs text-gray-400">+Rs.{b.remaining_amount as number} due</span>}</td>
                    <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${b.booking_type === 'owner_self' ? 'bg-purple-100 text-purple-700' : b.booking_type === 'offline' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{b.booking_type === 'owner_self' ? 'Owner Self' : b.booking_type === 'offline' ? 'Offline' : 'Online'}</span></td>
                    <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : b.status === 'no_show' ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'}`}>{b.status === 'no_show' ? 'Not Attended' : b.status as string}</span></td>
                    <td className="p-3 text-center">
                      {b.user_latitude && b.user_longitude ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-gray-400">{Number(b.user_latitude).toFixed(4)}, {Number(b.user_longitude).toFixed(4)}</span>
                          <div className="flex gap-1">
                            <a href={`https://www.google.com/maps?q=${b.user_latitude},${b.user_longitude}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 hover:bg-blue-100"><MapPin size={10}/> Map</a>
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.user_latitude},${b.user_longitude}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 hover:bg-green-100"><Navigation size={10}/> Go</a>
                          </div>
                        </div>
                      ) : <span className="text-[10px] text-gray-300">-</span>}
                    </td>
                    <td className="p-3 text-center">
                      {b.status === 'confirmed' && !b.attendance && (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleAttendance(b.booking_id as string, 'attended')} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded flex items-center gap-0.5" title="Attended"><CheckCircle size={12}/> Yes</button>
                          <button onClick={() => handleAttendance(b.booking_id as string, 'no_show')} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded flex items-center gap-0.5" title="Not Attended"><XCircle size={12}/> No</button>
                        </div>
                      )}
                      {b.attendance ? <span className={`text-xs font-medium ${b.attendance === 'attended' ? 'text-green-600' : 'text-red-600'}`}>{b.attendance === 'attended' ? 'Attended' : 'Not Attended'}</span> : null}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {b.status === 'awaiting_approval' && <button onClick={() => handleApproveBooking(b.booking_id as string)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-0.5"><CheckCircle size={10}/> Approve</button>}
                        {b.status === 'pending_cash' && <button onClick={() => handleVerifyCash(b.booking_id as string)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded flex items-center gap-0.5"><CheckCircle size={10}/> Verify Cash</button>}
                        {b.status === 'confirmed' && <button onClick={() => setCancelPopup(b)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg">Cancel</button>}
                        {(b.status === 'confirmed' || b.status === 'completed') && !b.attendance && (
                          <button onClick={async () => { if (confirm('Mark as Not Attended? Token amount will be forfeited and slot released.')) { try { await api.ownerMarkNoShow(b.booking_id as string); alert('Marked as Not Attended. Token forfeited.'); loadData(); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } } }} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg flex items-center gap-0.5"><XCircle size={10}/> Not Attended</button>
                        )}
                        {b.status === 'completed' && <button onClick={() => setRateUserId(b.booking_id as string)} className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg">Rate</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GPS Booking Locations Map */}
          {(() => {
            const gpsBookings = data.recent_bookings.filter((b: Record<string, unknown>) => b.user_latitude && b.user_longitude);
            if (gpsBookings.length === 0) return null;
            return (
              <div className="bg-white rounded-xl shadow-sm mt-6 p-5">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                  <Navigation size={18} className="text-green-600" /> Booking Locations ({gpsBookings.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {gpsBookings.map((b: Record<string, unknown>) => (
                    <div key={b.id as number} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{b.user_name as string}</p>
                          <p className="text-xs text-gray-500">{b.booking_date as string} • {b.start_time as string}</p>
                          <p className="text-xs text-gray-400">{b.ground_name as string}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{b.status as string}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <MapPin size={12} className="text-red-500" />
                        <span>{Number(b.user_latitude).toFixed(4)}, {Number(b.user_longitude).toFixed(4)}</span>
                      </div>
                      <div className="flex gap-2">
                        <a href={`https://www.google.com/maps?q=${b.user_latitude},${b.user_longitude}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-blue-50 text-blue-600 text-xs py-1.5 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1">
                          <MapPin size={12} /> View Map
                        </a>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.user_latitude},${b.user_longitude}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-green-50 text-green-600 text-xs py-1.5 rounded-lg hover:bg-green-100 flex items-center justify-center gap-1">
                          <Navigation size={12} /> Directions
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          </>
        )}

        {/* Global Styled Toast - visible on all tabs */}
        {ownerToast.show && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md animate-[slideDown_0.3s_ease-out]">
            <div className={`rounded-2xl shadow-2xl border px-4 py-3.5 flex items-start gap-3 backdrop-blur-sm ${
              ownerToast.type === 'success' ? 'bg-green-50/95 border-green-200 text-green-800' :
              ownerToast.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' :
              ownerToast.type === 'warning' ? 'bg-amber-50/95 border-amber-200 text-amber-800' :
              'bg-blue-50/95 border-blue-200 text-blue-800'
            }`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                ownerToast.type === 'success' ? 'bg-green-500' :
                ownerToast.type === 'error' ? 'bg-red-500' :
                ownerToast.type === 'warning' ? 'bg-amber-500' :
                'bg-blue-500'
              }`}>
                {ownerToast.type === 'success' && <CheckCircle size={16} className="text-white" />}
                {ownerToast.type === 'error' && <XCircle size={16} className="text-white" />}
                {ownerToast.type === 'warning' && <AlertTriangle size={14} className="text-white" />}
                {ownerToast.type === 'info' && <Info size={16} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-0.5">
                  {ownerToast.type === 'success' ? 'Success' : ownerToast.type === 'error' ? 'Error' : ownerToast.type === 'warning' ? 'Warning' : 'Info'}
                </p>
                <p className="text-sm font-medium leading-snug">{ownerToast.message}</p>
              </div>
              <button onClick={() => setOwnerToast(prev => ({ ...prev, show: false }))} className="flex-shrink-0 opacity-50 hover:opacity-100 transition mt-1">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <style>{`@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

        {/* COMBINED WALLET TAB (Settlement + Payout + KYC) */}
        {(tab === 'wallet' || tab === 'payout' || tab === 'settlement') && (
          <>

            {/* Wallet Card - Customer Style Gradient */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white mb-4 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={20} />
                <span className="text-green-100 text-sm font-medium">Owner Wallet</span>
              </div>
              <p className="text-4xl font-bold mb-1">Rs.{(data.cash_tracking?.net_payable ?? data.wallet_balance ?? 0).toLocaleString()}</p>
              <p className="text-green-200 text-xs">Available for withdrawal</p>
              {ownerKycStatus === 'verified' && <span className="mt-2 inline-block text-xs bg-green-400/30 text-green-100 px-3 py-1 rounded-full">KYC Verified</span>}
              {ownerKycStatus === 'rejected' && <span className="mt-2 inline-block text-xs bg-red-400/30 text-red-100 px-3 py-1 rounded-full">KYC Rejected</span>}
              {ownerKycStatus === 'pending' && <span className="mt-2 inline-block text-xs bg-yellow-400/30 text-yellow-100 px-3 py-1 rounded-full">KYC Pending</span>}

              <div className="flex gap-3 mt-5">
                <button onClick={() => {
                  if (ownerKycStatus !== 'verified') { setWalletSection('kyc'); return; }
                  const balance = data?.cash_tracking?.net_payable ?? data?.wallet_balance ?? 0;
                  if (balance < 100) { showOwnerToast('Minimum Rs.100 balance chahiye withdraw ke liye.', 'warning'); return; }
                  setShowWithdrawModal(true);
                }} className="flex-1 bg-white text-green-700 font-semibold py-2 rounded-xl text-sm flex items-center justify-center gap-1 hover:bg-green-50 transition">
                  <TrendingDown size={16} /> Withdraw
                </button>
                <button onClick={loadData} className="bg-green-500 text-white p-2 rounded-xl hover:bg-green-400 transition">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Section Tabs - Overview / KYC */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setWalletSection('overview')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1 ${walletSection === 'overview' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
                <Wallet size={14} /> Overview
              </button>
              <button onClick={() => setWalletSection('kyc')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1 ${walletSection === 'kyc' ? 'bg-orange-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
                <Shield size={14} /> KYC & Bank
                {ownerKycStatus === 'verified' && <span className="w-2 h-2 bg-green-400 rounded-full"></span>}
                {ownerKycStatus === 'pending' && <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>}
                {ownerKycStatus === 'rejected' && <span className="w-2 h-2 bg-red-400 rounded-full"></span>}
              </button>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                <div className="bg-white rounded-t-2xl p-6 w-full max-w-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Withdraw from Wallet</h3>
                    <button onClick={() => { setShowWithdrawModal(false); setWithdrawAmt(''); }} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-700">
                    <p className="font-semibold mb-1">Withdrawal Info:</p>
                    <p>- Minimum withdrawal: Rs.100</p>
                    <p>- 3% processing charge applicable</p>
                    <p>- Admin approval ke baad bank account mein transfer hoga</p>
                    <p>- Processing time: 1-3 business days</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Available Balance: <span className="font-bold text-green-600">Rs.{(data?.cash_tracking?.net_payable ?? data?.wallet_balance ?? 0).toLocaleString()}</span></p>
                  <div className="flex gap-2 mb-3">
                    {[100, 200, 500].filter(a => a <= (data?.cash_tracking?.net_payable ?? data?.wallet_balance ?? 0)).map(a => (
                      <button key={a} onClick={() => setWithdrawAmt(String(a))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${withdrawAmt === String(a) ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-200 text-gray-700 hover:border-orange-400'}`}>
                        Rs.{a}
                      </button>
                    ))}
                  </div>
                  <input type="number" placeholder="Enter amount (min Rs.100)" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  {withdrawAmt && parseFloat(withdrawAmt) >= 100 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs space-y-1">
                      <div className="flex justify-between"><span className="text-gray-500">Amount:</span><span className="font-medium">Rs.{parseFloat(withdrawAmt).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Charge (3%):</span><span className="text-red-500">-Rs.{(parseFloat(withdrawAmt) * 0.03).toFixed(2)}</span></div>
                      <div className="border-t pt-1 flex justify-between"><span className="text-gray-700 font-semibold">You will receive:</span><span className="font-bold text-green-600">Rs.{(parseFloat(withdrawAmt) * 0.97).toFixed(2)}</span></div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => { setShowWithdrawModal(false); setWithdrawAmt(''); }}
                      className="flex-1 py-2 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleWithdraw} disabled={withdrawing}
                      className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">
                      {withdrawing ? 'Processing...' : `Withdraw Rs.${withdrawAmt || '0'}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OVERVIEW SECTION */}
            {walletSection === 'overview' && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-xs text-gray-500 mb-1">Online Collected</p>
                    <p className="text-xl font-bold text-green-600">Rs.{data.cash_tracking.online_collected.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-xs text-gray-500 mb-1">Cash Collected</p>
                    <p className="text-xl font-bold text-blue-600">Rs.{data.cash_tracking.cash_collected.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-xs text-gray-500 mb-1">Total Commission</p>
                    <p className="text-xl font-bold text-red-500">Rs.{data.cash_tracking.commission_due.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Online: Rs.{(data.cash_tracking.online_commission ?? 0).toLocaleString()} | Cash: Rs.{(data.cash_tracking.cash_commission ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-xs text-gray-500 mb-1">{(data.cash_tracking.settlement_balance ?? data.cash_tracking.net_payable) < 0 ? 'Commission Owed' : 'Net Payable'}</p>
                    <p className={`text-xl font-bold ${(data.cash_tracking.settlement_balance ?? data.cash_tracking.net_payable) < 0 ? 'text-red-600' : 'text-purple-600'}`}>{(data.cash_tracking.settlement_balance ?? data.cash_tracking.net_payable) < 0 ? '-' : ''}Rs.{Math.abs(data.cash_tracking.settlement_balance ?? data.cash_tracking.net_payable).toLocaleString()}</p>
                    {(data.cash_tracking.settlement_balance ?? data.cash_tracking.net_payable) < 0 && <p className="text-[10px] text-red-500 mt-0.5">You owe this to platform</p>}
                  </div>
                </div>

                {/* Pay Commission Notice */}
                {(data.cash_tracking.cash_commission ?? 0) > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-800 font-medium">Commission Owed: Rs.{(data.cash_tracking.cash_commission ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-red-600 mt-1">Cash bookings par platform commission lagta hai.</p>
                      </div>
                      <button onClick={async () => {
                        const amt = data.cash_tracking.cash_commission ?? 0;
                        if(!confirm(`Pay Rs.${amt} commission via payment gateway?`)) return;
                        const BASE = String((import.meta as unknown as Record<string,Record<string,string>>).env?.VITE_API_URL || '');
                        const token = localStorage.getItem('token');
                        try {
                          const orderRes = await fetch(BASE + '/api/owner/pay-commission/create-order', {
                            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                            body: JSON.stringify({ amount: amt, payment_mode: 'online' })
                          });
                          const orderData = await orderRes.json();
                          if (!orderRes.ok) { showOwnerToast(orderData.detail || 'Gateway not configured.', 'error'); return; }
                          if (!(window as unknown as Record<string, unknown>).Razorpay) {
                            await new Promise<void>((resolve, reject) => {
                              const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
                              s.onload = () => resolve(); s.onerror = () => reject(new Error('Failed to load Razorpay'));
                              document.head.appendChild(s);
                            });
                          }
                          const RazorpayConstructor = (window as unknown as Record<string, unknown>).Razorpay as new (opts: Record<string, unknown>) => { open: () => void };
                          const rzp = new RazorpayConstructor({
                            key: orderData.key_id, amount: Math.round(amt * 100), currency: 'INR', name: 'BookAGround',
                            description: 'Commission Payment', order_id: orderData.order_id,
                            handler: async function(response: Record<string, string>) {
                              try {
                                const confirmRes = await fetch(BASE + '/api/owner/pay-commission', {
                                  method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                                  body: JSON.stringify({ amount: amt, payment_mode: 'online', razorpay_payment_id: response.razorpay_payment_id, razorpay_order_id: response.razorpay_order_id })
                                });
                                const confirmData = await confirmRes.json();
                                if (confirmRes.ok) { showOwnerToast('Commission paid! TXN: ' + response.razorpay_payment_id, 'success'); loadData(); }
                                else showOwnerToast(confirmData.detail || 'Payment confirmation failed', 'error');
                              } catch { showOwnerToast('Payment done but confirmation failed. Contact admin.', 'warning'); }
                            },
                            prefill: { name: String(ownerProfile?.name || ''), contact: String(ownerProfile?.phone || '') },
                            theme: { color: '#dc2626' }
                          });
                          rzp.open();
                        } catch (e) { showOwnerToast(e instanceof Error ? e.message : 'Failed to initiate payment', 'error'); }
                      }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 whitespace-nowrap ml-3">Pay Commission</button>
                    </div>
                  </div>
                )}

                {/* Settlement Note */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-yellow-800"><strong>Note:</strong> Settlements are processed weekly. Commission applies on all bookings (online + cash) except Self Bookings (0% commission).</p>
                </div>

                {/* Transaction Ledger */}
                <div className="bg-white rounded-2xl shadow-sm border">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-bold text-gray-800">Transaction Ledger</h2>
                      <div className="flex gap-2">
                        <button onClick={() => ownerExportCSV('settlement.csv', ['User','Phone','Ground','Date','Time','Total','Online','Cash','Commission'], data!.recent_bookings.filter(b => b.status !== 'cancelled').map(b => [String(b.user_name),String(b.user_phone),String(b.ground_name),String(b.booking_date),String(b.start_time)+'-'+String(b.end_time),'Rs.'+String(b.total_amount),String(b.payment_mode)!=='cash'?'Rs.'+String(b.token_amount):'-',String(b.payment_mode)==='cash'?'Rs.'+String(b.total_amount):'-','Rs.'+String(Math.round(Number(b.total_amount)*10/100))]))} className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg hover:bg-green-100">
                          <Download size={12} /> CSV
                        </button>
                        <button onClick={() => ownerExportPDF('Settlement Ledger', ['User','Phone','Ground','Date','Total','Commission'], data!.recent_bookings.filter(b => b.status !== 'cancelled').map(b => [String(b.user_name),String(b.user_phone),String(b.ground_name),String(b.booking_date),'Rs.'+String(b.total_amount),String(b.booking_type)==='owner_self'?'N/A':'Rs.'+String(Math.round(Number(b.total_amount)*10/100))]))} className="text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100">
                          <Download size={12} /> PDF
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr><th className="p-3 text-left">User</th><th className="p-3">Phone</th><th className="p-3">Ground</th><th className="p-3">Date</th><th className="p-3">Time</th><th className="p-3">Status</th><th className="p-3">Total</th><th className="p-3">Online</th><th className="p-3">Cash</th><th className="p-3">Commission</th></tr></thead>
                      <tbody>
                        {data.recent_bookings.filter((b: Record<string, unknown>) => b.status !== 'cancelled').map((b: Record<string, unknown>) => (
                          <tr key={b.id as number} className={`border-t hover:bg-gray-50 ${String(b.status) === 'no_show' ? 'bg-red-50' : ''}`}>
                            <td className="p-3 font-medium">{b.user_name as string}</td>
                            <td className="p-3 text-xs text-blue-600">{String(b.user_phone || '-')}</td>
                            <td className="p-3 text-xs text-gray-500">{b.ground_name as string}</td>
                            <td className="p-3 text-center text-xs">{b.booking_date as string}</td>
                            <td className="p-3 text-center text-xs">{String(b.start_time || '')}-{String(b.end_time || '')}</td>
                            <td className="p-3 text-center">{String(b.status) === 'no_show' ? <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">Not Attended</span> : <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">{String(b.status)}</span>}</td>
                            <td className="p-3 text-center font-bold text-green-600">Rs.{b.total_amount as number}</td>
                            <td className="p-3 text-center text-blue-600">{String(b.payment_mode) !== 'cash' ? `Rs.${b.token_amount as number}` : '-'}</td>
                            <td className="p-3 text-center text-orange-500">{String(b.status) === 'no_show' ? <span className="text-gray-400">Rs.0</span> : String(b.payment_mode) === 'cash' ? `Rs.${b.total_amount as number}` : (b.remaining_amount as number) > 0 ? `Rs.${b.remaining_amount}` : '-'}</td>
                            <td className="p-3 text-center text-red-500 font-medium">{String(b.booking_type) === 'owner_self' ? <span className="text-gray-400">N/A</span> : String(b.status) === 'no_show' ? `Rs.${Math.round((b.token_amount as number) * 10 / 100)}` : `Rs.${Math.round((b.total_amount as number) * 10 / 100)}`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* KYC SECTION */}
            {walletSection === 'kyc' && (
              <div className="space-y-4">
                {/* KYC Status Card */}
                <div className={`rounded-2xl p-5 shadow-sm border ${
                  ownerKycStatus === 'verified' ? 'bg-green-50 border-green-200' :
                  ownerKycStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                  ownerKycStatus === 'rejected' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ownerKycStatus === 'verified' ? 'bg-green-500' :
                      ownerKycStatus === 'pending' ? 'bg-yellow-500' :
                      ownerKycStatus === 'rejected' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`}>
                      <Shield size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">KYC Status</p>
                      <p className={`text-sm font-semibold ${
                        ownerKycStatus === 'verified' ? 'text-green-700' :
                        ownerKycStatus === 'pending' ? 'text-yellow-700' :
                        ownerKycStatus === 'rejected' ? 'text-red-700' :
                        'text-gray-500'
                      }`}>
                        {ownerKycStatus === 'verified' ? 'Verified - Withdrawals Enabled' :
                         ownerKycStatus === 'pending' ? 'Pending Verification - Admin will verify soon' :
                         ownerKycStatus === 'rejected' ? 'Rejected - Please reupload documents' :
                         'Not Submitted - Complete KYC to withdraw'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verified - Show bank details */}
                {ownerKycStatus === 'verified' && !changingAccount && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-green-600" /> Verified Bank Details</h3>
                    <div className="space-y-2 text-sm">
                      {ownerProfile?.bank_name ? <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{String(ownerProfile.bank_name)}</span></div> : null}
                      {ownerProfile?.bank_account ? <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">****{String(ownerProfile.bank_account).slice(-4)}</span></div> : null}
                      {ownerProfile?.bank_ifsc ? <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-medium">{String(ownerProfile.bank_ifsc)}</span></div> : null}
                      {ownerProfile?.upi_id ? <div className="flex justify-between"><span className="text-gray-500">UPI</span><span className="font-medium">{String(ownerProfile.upi_id)}</span></div> : null}
                      {ownerProfile?.kyc_doc_type ? <div className="flex justify-between"><span className="text-gray-500">Document</span><span className="font-medium capitalize">{String(ownerProfile.kyc_doc_type)}</span></div> : null}
                    </div>
                    <button onClick={() => {
                      const balance = data?.cash_tracking?.net_payable ?? data?.wallet_balance ?? 0;
                      if (balance < 100) { showOwnerToast('Minimum Rs.100 balance chahiye', 'warning'); return; }
                      setShowWithdrawModal(true);
                    }} className="w-full mt-4 bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 transition flex items-center justify-center gap-2">
                      <TrendingDown size={16} /> Withdraw Money (Balance: Rs.{(data?.cash_tracking?.net_payable ?? data?.wallet_balance ?? 0).toLocaleString()})
                    </button>
                    <button onClick={() => { setChangingAccount(true); setBankName(''); setAccountNo(''); setIfsc(''); setUpiId(''); setKycDoc(''); setKycFiles([]); }}
                      className="w-full mt-2 bg-white text-orange-600 border border-orange-300 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-50 transition flex items-center justify-center gap-2">
                      <RefreshCw size={14} /> Change Bank Details (Re-KYC)
                    </button>
                  </div>
                )}

                {/* Pending - Show submitted info */}
                {ownerKycStatus === 'pending' && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border">
                    <h3 className="font-bold text-yellow-700 mb-2 flex items-center gap-2"><Shield size={16} /> KYC Under Review</h3>
                    <p className="text-xs text-gray-500 mb-3">Your KYC documents are under review. Admin will verify shortly. You will be able to withdraw once verified.</p>
                    <div className="bg-yellow-50 rounded-lg p-3 space-y-1.5 text-sm">
                      {ownerProfile?.bank_name ? <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{String(ownerProfile.bank_name)}</span></div> : null}
                      {ownerProfile?.bank_account ? <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">{String(ownerProfile.bank_account)}</span></div> : null}
                      {ownerProfile?.bank_ifsc ? <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-medium">{String(ownerProfile.bank_ifsc)}</span></div> : null}
                    </div>
                  </div>
                )}

                {/* Rejected - Show rejection message */}
                {ownerKycStatus === 'rejected' && (
                  <div className="bg-red-50 rounded-2xl p-5 shadow-sm border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <X size={18} className="text-red-600" />
                      <h3 className="font-bold text-red-700">KYC Rejected</h3>
                    </div>
                    <p className="text-sm text-red-600 mb-3">Aapki KYC documents reject ho gayi hain. Sahi documents dobara upload karein.</p>
                    <div className="bg-white rounded-lg p-3 mb-3 border border-red-100">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Common reasons:</p>
                      <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                        <li>Document photo blurry ya unclear hai</li>
                        <li>Document expired hai</li>
                        <li>Name mismatch hai bank details se</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* KYC Form - show when not verified and not pending (or changing account) */}
                {(ownerKycStatus !== 'verified' && ownerKycStatus !== 'pending') || changingAccount ? (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border">
                    <h3 className="font-bold text-gray-800 mb-1">{changingAccount ? 'Change Bank Details (Re-KYC)' : ownerKycStatus === 'rejected' ? 'Resubmit KYC Documents' : 'Complete KYC'}</h3>
                    <p className="text-xs text-gray-500 mb-4">{changingAccount ? 'Naye bank details enter karein. Admin verify karega.' : 'Fill bank details and upload document to enable withdrawals'}</p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Bank Name *</label>
                        <input type="text" placeholder="e.g. State Bank of India" value={bankName} onChange={e => setBankName(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Account Number *</label>
                        <input type="text" placeholder="Enter account number" value={accountNo} onChange={e => setAccountNo(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">IFSC Code *</label>
                        <input type="text" placeholder="e.g. SBIN0001234" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())}
                          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">UPI ID (Optional)</label>
                        <input type="text" placeholder="e.g. name@upi" value={upiId} onChange={e => setUpiId(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">KYC Document Type *</label>
                        <select value={kycDoc} onChange={e => setKycDoc(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                          <option value="">Select Document</option>
                          <option value="aadhaar">Aadhaar Card</option>
                          <option value="pan">PAN Card</option>
                          <option value="passport">Passport</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Upload Documents * <span className="text-gray-400 font-normal">(Front & Back - max 5 files)</span></label>
                        <div className="border-2 border-dashed border-orange-200 rounded-xl p-4 text-center bg-orange-50/50 hover:bg-orange-50 transition cursor-pointer"
                          onClick={() => document.getElementById('owner-kyc-file-new')?.click()}>
                          <input id="owner-kyc-file-new" type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) setKycFiles(prev => [...prev, ...files].slice(0, 5));
                            e.target.value = '';
                          }} />
                          {kycFiles.length > 0 ? (
                            <div className="space-y-2">
                              {kycFiles.map((f, i) => (
                                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {f.type.startsWith('image/') ? (
                                      <img src={URL.createObjectURL(f)} alt="" className="w-10 h-10 rounded object-cover border" />
                                    ) : (
                                      <FileText size={20} className="text-orange-600 flex-shrink-0" />
                                    )}
                                    <span className="text-xs text-gray-700 truncate">{f.name}</span>
                                    <span className="text-[10px] text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
                                  </div>
                                  <button onClick={(ev) => { ev.stopPropagation(); setKycFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="text-red-400 hover:text-red-600 flex-shrink-0 ml-2"><X size={14}/></button>
                                </div>
                              ))}
                              {kycFiles.length < 5 && (
                                <p className="text-xs text-orange-500 mt-1">+ Tap to add more ({5 - kycFiles.length} remaining)</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <Upload size={24} className="mx-auto text-orange-400 mb-1" />
                              <p className="text-sm text-orange-600 font-medium">Tap to upload Aadhaar/PAN/Passport</p>
                              <p className="text-xs text-gray-400">Front + Back photos (JPG, PNG, PDF)</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button onClick={handleKYC} disabled={submittingKyc}
                        className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                        {submittingKyc ? 'Submitting...' : <><Shield size={16} /> Submit KYC for Verification</>}
                      </button>
                      {changingAccount && <button onClick={() => setChangingAccount(false)} className="w-full border text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">Cancel</button>}
                    </div>
                  </div>
                ) : null}

                {/* Info Card */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">How Withdrawal Works:</p>
                  <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                    <li>Complete KYC with bank details & document</li>
                    <li>Admin verifies your KYC (usually within 24 hours)</li>
                    <li>Once verified, click Withdraw and enter amount</li>
                    <li>3% processing charge will be deducted</li>
                    <li>Amount transferred to your bank in 1-3 business days</li>
                  </ol>
                </div>
              </div>
            )}
          </>
        )}

        {/* ADD GROUND TAB */}
        {tab === 'addground' && (
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-600" /> Add New Ground</h3>
            <p className="text-sm text-gray-500 mb-4">Submit your ground for listing. Admin will review and approve it.</p>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-gray-600">Ground Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.name} onChange={e => setNewGround({...newGround, name: e.target.value})} /></div>
              <div><label className="text-sm font-medium text-gray-600">Address</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.address} onChange={e => setNewGround({...newGround, address: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-600">City</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.city} onChange={e => setNewGround({...newGround, city: e.target.value})} /></div>
                <div><label className="text-sm font-medium text-gray-600">Ground Type</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.ground_type} onChange={e => setNewGround({...newGround, ground_type: e.target.value})}><option value="box">Box Cricket</option><option value="turf">Turf</option><option value="open">Open Ground</option><option value="indoor">Indoor</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-600">Weekday Price</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.weekday_price} onChange={e => setNewGround({...newGround, weekday_price: parseInt(e.target.value) || 0})} /></div>
                <div><label className="text-sm font-medium text-gray-600">Weekend Price</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.weekend_price} onChange={e => setNewGround({...newGround, weekend_price: parseInt(e.target.value) || 0})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-600">Evening Extra</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.evening_extra} onChange={e => setNewGround({...newGround, evening_extra: parseInt(e.target.value) || 0})} /></div>
                <div><label className="text-sm font-medium text-gray-600">Token Money %</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.token_money_percent} onChange={e => setNewGround({...newGround, token_money_percent: parseInt(e.target.value)})}><option value={30}>30%</option><option value={50}>50%</option><option value={100}>100%</option></select><p className="text-xs text-gray-400 mt-0.5">Agreement ke according token money %</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-600">Opening Time</label><input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.opening_time} onChange={e => setNewGround({...newGround, opening_time: e.target.value})} /></div>
                <div><label className="text-sm font-medium text-gray-600">Closing Time</label><input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={newGround.closing_time} onChange={e => setNewGround({...newGround, closing_time: e.target.value})} /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-600">Description</label><textarea className="w-full border rounded-lg px-3 py-2 mt-1" rows={2} value={newGround.description} onChange={e => setNewGround({...newGround, description: e.target.value})} /></div>
              <div className="bg-purple-50 rounded-lg p-3">
                <label className="text-sm font-medium text-purple-700 mb-2 block">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {allAmenities.map(a => (
                    <label key={a} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer border transition ${selectedAmenities.includes(a) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'}`}>
                      <input type="checkbox" className="hidden" checked={selectedAmenities.includes(a)} onChange={() => { const next = selectedAmenities.includes(a) ? selectedAmenities.filter(x => x !== a) : [...selectedAmenities, a]; setSelectedAmenities(next); setNewGround(g => ({...g, amenities: next.join(',')})); }} />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
              {/* Ground Photo Upload */}
              <div>
                <label className="text-sm font-medium text-gray-600">Upload Photos (multiple allowed)</label>
                <input type="file" accept="image/*" multiple className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" onChange={e => {
                  const files = Array.from(e.target.files || []);
                  setGroundPhotos(prev => [...prev, ...files]);
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = () => setGroundPhotoPreviews(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                  });
                }} />
                {groundPhotoPreviews.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {groundPhotoPreviews.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border-2 border-green-400" />
                        <button type="button" onClick={() => {
                          setGroundPhotos(prev => prev.filter((_, i) => i !== idx));
                          setGroundPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                        }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-600">&times;</button>
                        <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-center text-[10px] rounded-b-lg">New</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* GPS Location */}
              <div className="bg-blue-50 rounded-lg p-3">
                <label className="text-sm font-medium text-blue-700 mb-2 block">GPS Location</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Latitude (e.g. 26.9124)" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={newGround.latitude} onChange={e => setNewGround({...newGround, latitude: e.target.value})} />
                  <input type="text" placeholder="Longitude (e.g. 75.7873)" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={newGround.longitude} onChange={e => setNewGround({...newGround, longitude: e.target.value})} />
                  <button type="button" onClick={() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(pos => { setNewGround(g => ({...g, latitude: String(pos.coords.latitude.toFixed(6)), longitude: String(pos.coords.longitude.toFixed(6))})); alert('Location captured!'); }, () => alert('Location access denied')); } else { alert('Geolocation not supported'); } }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-blue-700">Get GPS</button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setNewGround({ name: '', address: '', city: 'Jaipur', ground_type: 'box', weekday_price: 800, weekend_price: 1000, evening_extra: 200, opening_time: '06:00', closing_time: '22:00', amenities: 'Floodlights,Parking', description: '', latitude: '', longitude: '', token_money_percent: 100 }); setSelectedAmenities(['Floodlights', 'Parking']); setGroundPhotos([]); setGroundPhotoPreviews([]); }} className="flex-1 border-2 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button disabled={isSubmitting} onClick={async () => {
                if (isSubmitting) return; setIsSubmitting(true);
                try {
                  const result = await api.addOwnerGround({...newGround, latitude: parseFloat(newGround.latitude) || 0, longitude: parseFloat(newGround.longitude) || 0}) as Record<string, unknown>;
                  // Upload photos if selected (use owner gallery endpoint, not admin)
                  if (groundPhotoPreviews.length > 0 && result?.id) {
                    for (const preview of groundPhotoPreviews) {
                      await api.addGalleryImage({ ground_id: result.id as number, image_data: preview, caption: 'Ground Photo' });
                    }
                  }
                  setSuccessPopup('Ground submitted successfully! Pending admin approval.');
                  setGroundPhotos([]); setGroundPhotoPreviews([]);
                  setNewGround({ name: '', address: '', city: 'Jaipur', ground_type: 'box', weekday_price: 800, weekend_price: 1000, evening_extra: 200, opening_time: '06:00', closing_time: '22:00', amenities: 'Floodlights,Parking', description: '', latitude: '', longitude: '', token_money_percent: 100 }); setSelectedAmenities(['Floodlights', 'Parking']);
                  loadData();
                } catch (e: unknown) { setErrorPopup(e instanceof Error ? e.message : 'Failed'); } finally { setIsSubmitting(false); }
              }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit for Approval'}</button>
            </div>
          </div>
        )}

        {/* DAY-OFF MANAGEMENT - shown in grounds tab */}
        {tab === 'grounds' && data.grounds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5 mt-6">
            <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2"><CalendarOff size={18} className="text-red-500" /> Day Off Management</h3>
            <p className="text-sm text-gray-500 mb-3">Set a day off for your ground. All slots for that day will be marked unavailable.</p>
            <div className="flex gap-3 flex-wrap">
              <select className="border rounded-lg px-3 py-2 text-sm" value={dayOffGround || ''} onChange={e => setDayOffGround(parseInt(e.target.value) || null)}>
                <option value="">Select Ground</option>
                {data.grounds.map((g: Record<string, unknown>) => <option key={g.id as number} value={g.id as number}>{g.name as string}</option>)}
              </select>
              <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={dayOffDate} onChange={e => setDayOffDate(e.target.value)} />
              <input type="text" placeholder="Reason (optional)" className="border rounded-lg px-3 py-2 text-sm" value={dayOffReason} onChange={e => setDayOffReason(e.target.value)} />
              <button onClick={handleDayOff} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600">Set Day Off</button>
            </div>
          </div>
        )}

        {/* Settlement tab now redirects to wallet */}

        {/* TICKETS TAB */}
        {tab === 'tickets' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Support Tickets</h2>
              <button onClick={() => { setShowNewTicket(!showNewTicket); loadOwnerTickets(); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Plus size={14}/> New Ticket</button>
            </div>
            {showNewTicket && (
              <div className="bg-blue-50 border rounded-xl p-4 mb-4">
                <h4 className="font-medium text-gray-800 mb-3">Create Support Ticket</h4>
                <input type="text" placeholder="Subject" className="w-full border rounded-lg px-3 py-2 text-sm mb-2 bg-white" value={newTicketSubject} onChange={e => setNewTicketSubject(e.target.value)} />
                <textarea placeholder="Describe your issue..." className="w-full border rounded-lg px-3 py-2 text-sm mb-2 bg-white" rows={3} value={newTicketMessage} onChange={e => setNewTicketMessage(e.target.value)} />
                <select className="w-full border rounded-lg px-3 py-2 text-sm mb-3 bg-white" value={ticketGroundId} onChange={e => setTicketGroundId(parseInt(e.target.value))}>
                  <option value={0}>General (No specific ground)</option>
                  {data?.grounds.map(g => <option key={g.id as number} value={g.id as number}>{g.name as string}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewTicket(false)} className="border px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={handleCreateOwnerTicket} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Submit</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {ownerTickets.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">No tickets yet. Click "New Ticket" to create one or click "Load" below.</p>
                  <button onClick={loadOwnerTickets} className="mt-3 text-sm text-blue-600 underline">Load Tickets</button>
                </div>
              ) : ownerTickets.map(t => (
                <div key={t.id as number} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button onClick={() => setSelectedTicket(selectedTicket?.id === t.id ? null : t)} className="w-full text-left p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium text-gray-800">{t.subject as string}</p><p className="text-xs text-gray-500 mt-0.5">{(t.created_at as string)?.replace('T', ' ').slice(0, 16)}{t.ground_name ? ` | ${t.ground_name}` : ''}</p></div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-orange-100 text-orange-700' : t.status === 'resolved' ? 'bg-green-100 text-green-700' : t.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{t.status as string}</span>
                    </div>
                  </button>
                  {selectedTicket?.id === t.id && (
                    <div className="border-t px-4 pb-4">
                      <div className="py-3 space-y-2">
                        <div className="bg-gray-50 rounded-lg p-3"><p className="text-sm">{t.message as string}</p></div>
                        {(t.replies as Array<Record<string, unknown>>)?.map((r, i) => (
                          <div key={i} className={`rounded-lg p-3 ${r.user_role === 'admin' ? 'bg-purple-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                            <p className="text-xs font-medium mb-1">{r.user_name as string} <span className={`px-1.5 py-0.5 rounded-full ${r.user_role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{r.user_role as string}</span></p>
                            <p className="text-sm">{r.message as string}</p>
                          </div>
                        ))}
                      </div>
                      {t.status !== 'closed' && (
                        <div className="flex gap-2">
                          <input type="text" placeholder="Type your reply..." className="flex-1 border rounded-lg px-3 py-2 text-sm" value={ticketReply} onChange={e => setTicketReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && ticketReply.trim()) handleOwnerTicketReply(t.id as number); }} />
                          <button onClick={() => handleOwnerTicketReply(t.id as number)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Reply</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* LEDGER TAB */}
        {tab === 'ledger' && (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-gray-800">Transaction Ledger</h2>
              <div className="flex gap-2 flex-wrap">
                <button onClick={loadOwnerTxns} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Load Transactions</button>
                {ownerTxns.length > 0 && <>
                  <button onClick={() => ownerExportCSV('ledger.csv', ['User','Phone','Ground','Date','Total','Mode','Status'], ownerTxns.map(t => [String(t.user_name||'-'),String(t.user_phone||'-'),String(t.ground_name||'-'),String(t.booking_date||'-'),'Rs.'+String(t.total_amount||0),String(t.payment_mode||'online'),String(t.status||'-')]))} className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-1"><Download size={12}/> CSV</button>
                  <button onClick={() => ownerExportPDF('Transaction Ledger', ['User','Phone','Ground','Date','Total','Mode','Status'], ownerTxns.map(t => [String(t.user_name||'-'),String(t.user_phone||'-'),String(t.ground_name||'-'),String(t.booking_date||'-'),'Rs.'+String(t.total_amount||0),String(t.payment_mode||'online'),String(t.status||'-')]))} className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-1"><FileText size={12}/> PDF</button>
                </>}
              </div>
            </div>
            {ownerTxns.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">User</th><th className="p-3">Phone</th><th className="p-3">Ground</th><th className="p-3">Date</th><th className="p-3">Slot Time</th><th className="p-3">Total</th><th className="p-3">Online</th><th className="p-3">Cash</th><th className="p-3">Commission</th><th className="p-3">Mode</th><th className="p-3">Status</th></tr></thead>
                  <tbody>
                    {ownerTxns.map((t: Record<string, unknown>, i: number) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{String(t.user_name || '-')}</td>
                        <td className="p-3 text-xs text-blue-600">{String(t.user_phone || '-')}</td>
                        <td className="p-3 text-xs text-gray-500">{String(t.ground_name || '-')}</td>
                        <td className="p-3 text-center text-xs">{String(t.booking_date || '-')}</td>
                        <td className="p-3 text-center text-xs">{String(t.start_time || '')}-{String(t.end_time || '')}</td>
                        <td className="p-3 text-center font-bold text-green-600">Rs.{String(t.total_amount || 0)}</td>
                        <td className="p-3 text-center text-blue-600">{String(t.payment_mode) !== 'cash' ? `Rs.${String(t.online_amount ?? t.token_amount ?? 0)}` : '-'}</td>
                        <td className="p-3 text-center text-orange-500">{String(t.payment_mode) === 'cash' ? `Rs.${String(t.total_amount || 0)}` : `Rs.${String(t.cash_amount ?? t.remaining_amount ?? 0)}`}</td>
                        <td className="p-3 text-center text-red-500 font-medium">{String(t.booking_type) === 'owner_self' ? <span className="text-gray-400">N/A</span> : `Rs.${Math.round(Number(t.total_amount || 0) * 10 / 100)}`}</td>
                        <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${String(t.payment_mode) === 'cash' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{String(t.payment_mode || 'online')}</span></td>
                        <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${String(t.status) === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{String(t.status || '-')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-gray-400">Click "Load Transactions" to view your transaction history</p>}
          </>
        )}

            {/* Analytics - Removed */}

            {/* Dynamic Pricing - Removed */}

            {/* Staff - Removed */}

            {/* DISCOUNT COUPONS */}
            {tab === 'coupons' && (
              <>
                <h3 className="font-bold text-gray-800 text-xl mb-4">Discount Coupons</h3>
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h4 className="font-bold text-gray-700 mb-3">Create Coupon</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select className="border rounded-lg px-3 py-2 text-sm" id="coupon-ground">
                      <option value="">Select Ground</option>
                      {grounds.map((g: Record<string, unknown>) => <option key={g.id as number} value={g.id as number}>{g.name as string}</option>)}
                    </select>
                    <input type="text" placeholder="Coupon Code (e.g. FLAT20)" className="border rounded-lg px-3 py-2 text-sm uppercase" id="coupon-code" />
                    <select className="border rounded-lg px-3 py-2 text-sm" id="coupon-type" onChange={(e) => { const valInput = document.getElementById('coupon-value') as HTMLInputElement; if (valInput) { valInput.placeholder = e.target.value === 'percentage' ? 'Discount (%)' : 'Discount (Rs.)'; valInput.value = ''; } }}>
                      <option value="percentage">Percentage Off</option><option value="flat">Flat Discount</option>
                    </select>
                    <input type="number" placeholder="Discount (%)" defaultValue="" className="border rounded-lg px-3 py-2 text-sm" id="coupon-value" />
                    <input type="number" placeholder="Max Uses" defaultValue="100" className="border rounded-lg px-3 py-2 text-sm" id="coupon-max" />
                    <input type="date" placeholder="Valid From" className="border rounded-lg px-3 py-2 text-sm" id="coupon-from" />
                    <input type="date" placeholder="Valid To" className="border rounded-lg px-3 py-2 text-sm" id="coupon-to" />
                  </div>
                  <button onClick={async () => { const gid = (document.getElementById('coupon-ground') as HTMLSelectElement)?.value; const code = (document.getElementById('coupon-code') as HTMLInputElement)?.value; const dtype = (document.getElementById('coupon-type') as HTMLSelectElement)?.value; const val = (document.getElementById('coupon-value') as HTMLInputElement)?.value; const max = (document.getElementById('coupon-max') as HTMLInputElement)?.value; const from = (document.getElementById('coupon-from') as HTMLInputElement)?.value; const to = (document.getElementById('coupon-to') as HTMLInputElement)?.value; if (!gid) { showOwnerToast('Ground select karo', 'warning'); return; } if (!code) { showOwnerToast('Coupon code enter karo', 'warning'); return; } try { await api.addOwnerCoupon({ ground_id: parseInt(gid), code, discount_type: dtype, discount_value: parseFloat(val || '10'), max_uses: parseInt(max || '100'), valid_from: from, valid_to: to }); showOwnerToast('Coupon created!', 'success'); loadTab(); } catch(e: unknown) { showOwnerToast(e instanceof Error ? e.message : 'Failed', 'error'); } }} className="mt-3 bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700">Create Coupon</button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-blue-700"><strong>Note:</strong> Coupons sirf usi ground pe kaam karenge jis ground ke liye banaye hain. Har coupon ek specific ground se linked hai.</p>
                </div>
                <div className="space-y-3">
                  {ownerCoupons.map((c: Record<string, unknown>) => (
                    <div key={c.id as number} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <code className="bg-purple-100 text-purple-700 px-3 py-1 rounded font-bold text-sm">{c.code as string}</code>
                          {c.ground_name ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{String(c.ground_name)}</span> : null}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{c.discount_type as string === 'percentage' ? `${c.discount_value}% off` : `Rs.${c.discount_value} off`} | Used: {c.used_count as number}/{c.max_uses as number}</p>
                        {c.valid_from ? <p className="text-xs text-gray-400">Valid: {String(c.valid_from)} to {String(c.valid_to)}</p> : null}
                      </div>
                      <button onClick={async () => { if (confirm('Delete coupon?')) { try { await api.deleteOwnerCoupon(c.id as number); loadTab(); } catch { /* */ } } }} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {ownerCoupons.length === 0 && <p className="text-gray-400 text-center py-8">No coupons created yet.</p>}
                </div>
              </>
            )}

            {/* Expenses - Removed */}
            {/* Maintenance - Removed */}

            {/* AUTO REPLIES */}
            {tab === 'autoreplies' && (
              <>
                <h3 className="font-bold text-gray-800 text-xl mb-4">Auto Reply Messages</h3>
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h4 className="font-bold text-gray-700 mb-3">Add Auto Reply</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select className="border rounded-lg px-3 py-2 text-sm" id="ar-trigger">
                      <option value="booking_confirm">Booking Confirmed</option><option value="booking_cancel">Booking Cancelled</option><option value="new_enquiry">New Enquiry</option><option value="payment_received">Payment Received</option>
                    </select>
                  </div>
                  <textarea placeholder="Auto reply message..." className="w-full border rounded-lg px-3 py-2 text-sm mt-3 h-20" id="ar-message" />
                  <button onClick={async () => { const trigger = (document.getElementById('ar-trigger') as HTMLSelectElement)?.value; const msg = (document.getElementById('ar-message') as HTMLTextAreaElement)?.value; if (!msg) { alert('Enter message'); return; } try { await api.addOwnerAutoReply({ trigger_type: trigger, message: msg }); alert('Auto reply added!'); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="mt-3 bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700">Add Auto Reply</button>
                </div>
                <div className="space-y-3">
                  {ownerAutoReplies.map((r: Record<string, unknown>) => (
                    <div key={r.id as number} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">{(r.trigger_type as string || '').replace('_', ' ')}</span>
                        <p className="text-sm text-gray-700 mt-2">{r.message as string}</p>
                      </div>
                      <button onClick={async () => { try { await api.deleteOwnerAutoReply(r.id as number); loadTab(); } catch { /* */ } }} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {ownerAutoReplies.length === 0 && <p className="text-gray-400 text-center py-8">No auto replies set up.</p>}
                </div>
              </>
            )}

            {/* Gallery - Removed */}

            {/* Bulk Slot Management */}
            {tab === 'bulkslots' && (
              <>
                <h3 className="font-bold text-gray-800 text-xl mb-4">Bulk Slot Management</h3>
                <p className="text-gray-500 text-sm mb-4">Generate multiple slots at once for a date range.</p>
                <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Select Ground</label>
                    <select className="w-full border rounded-lg px-4 py-2 mt-1" value={bulkSlotGroundId} onChange={e => setBulkSlotGroundId(parseInt(e.target.value))}>
                      <option value={0}>Choose Ground</option>
                      {grounds.map((g: Record<string, unknown>) => <option key={g.id as number} value={g.id as number}>{g.name as string}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-600">Start Date</label><input type="date" className="w-full border rounded-lg px-4 py-2 mt-1" value={bulkSlotDate} onChange={e => setBulkSlotDate(e.target.value)} /></div>
                    <div><label className="text-sm font-medium text-gray-600">End Date</label><input type="date" className="w-full border rounded-lg px-4 py-2 mt-1" value={bulkSlotEndDate} onChange={e => setBulkSlotEndDate(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="text-sm font-medium text-gray-600">Opening Time</label><input type="time" className="w-full border rounded-lg px-4 py-2 mt-1" value={bulkSlotStart} onChange={e => setBulkSlotStart(e.target.value)} /></div>
                    <div><label className="text-sm font-medium text-gray-600">Closing Time</label><input type="time" className="w-full border rounded-lg px-4 py-2 mt-1" value={bulkSlotEnd} onChange={e => setBulkSlotEnd(e.target.value)} /></div>
                    <div><label className="text-sm font-medium text-gray-600">Duration (min)</label><select className="w-full border rounded-lg px-4 py-2 mt-1" value={bulkSlotDuration} onChange={e => setBulkSlotDuration(parseInt(e.target.value))}><option value={30}>30 min</option><option value={60}>1 hour</option><option value={90}>1.5 hours</option><option value={120}>2 hours</option></select></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Price per Slot (Rs.)</label>
                    <input type="number" className="w-full border rounded-lg px-4 py-2 mt-1" value={bulkSlotPrice} onChange={e => setBulkSlotPrice(parseInt(e.target.value) || 0)} />
                  </div>
                  <button onClick={async () => {
                    if (!bulkSlotGroundId || !bulkSlotDate || !bulkSlotEndDate) { alert('Fill all fields'); return; }
                    try {
                      const startD = new Date(bulkSlotDate); const endD = new Date(bulkSlotEndDate);
                      let created = 0;
                      for (let d = startD; d <= endD; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        let [sh, sm] = bulkSlotStart.split(':').map(Number); const [eh] = bulkSlotEnd.split(':').map(Number);
                        while (sh < eh) {
                          const startMin = sh * 60 + sm; const endMin = startMin + bulkSlotDuration;
                          const st = String(Math.floor(startMin/60)).padStart(2,'0') + ':' + String(startMin%60).padStart(2,'0');
                          const et = String(Math.floor(endMin/60)).padStart(2,'0') + ':' + String(endMin%60).padStart(2,'0');
                          try { await api.addOwnerSlot({ ground_id: bulkSlotGroundId, date: dateStr, start_time: st, end_time: et, price: bulkSlotPrice }); created++; } catch {}
                          sh = Math.floor(endMin/60); sm = endMin%60;
                        }
                      }
                      alert(`${created} slots created successfully!`);
                    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
                  }} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">Generate Bulk Slots</button>
                </div>
              </>
            )}

            {/* CRM - Customer Data */}
            {tab === 'crm' && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h3 className="font-bold text-gray-800 text-xl">Customer CRM</h3>
                  <div className="flex gap-2">
                    {ownerCRM.length > 0 && <>
                      <button onClick={() => ownerExportCSV('crm.csv', ['Customer','Phone','Email','Bookings','Total Spent','First Booking','Last Booking'], ownerCRM.map(c => [String(c.name),String(c.phone),String(c.email||''),String(c.total_bookings),'Rs.'+String(c.total_spent||0),String(c.first_booking||''),String(c.last_booking||'')]))} className="bg-green-600 text-white px-2 py-1.5 rounded-lg text-xs flex items-center gap-1"><Download size={12}/> CSV</button>
                      <button onClick={() => ownerExportPDF('Customer CRM', ['Customer','Phone','Email','Bookings','Total Spent','First','Last'], ownerCRM.map(c => [String(c.name),String(c.phone),String(c.email||''),String(c.total_bookings),'Rs.'+String(c.total_spent||0),String(c.first_booking||''),String(c.last_booking||'')]))} className="bg-red-600 text-white px-2 py-1.5 rounded-lg text-xs flex items-center gap-1"><FileText size={12}/> PDF</button>
                    </>}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">Customer</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Total Bookings</th><th className="p-3">Total Spent</th><th className="p-3">First Booking</th><th className="p-3">Last Booking</th></tr></thead>
                    <tbody>
                      {ownerCRM.map((c: Record<string, unknown>) => (
                        <tr key={c.id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{c.name as string}</td>
                          <td className="p-3 text-xs">{c.phone as string}</td>
                          <td className="p-3 text-xs">{(c.email as string) || '-'}</td>
                          <td className="p-3 text-center font-bold">{c.total_bookings as number}</td>
                          <td className="p-3 text-center text-green-600 font-medium">Rs.{(c.total_spent as number || 0).toLocaleString()}</td>
                          <td className="p-3 text-xs">{c.first_booking as string}</td>
                          <td className="p-3 text-xs">{c.last_booking as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ownerCRM.length === 0 && <p className="text-gray-400 text-center py-8">No customer data yet. Bookings will appear here.</p>}
                </div>
              </>
            )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">{String(ownerProfile?.name || 'O')[0].toUpperCase()}</div>
                <div>
                  <h3 className="text-2xl font-bold">{String(ownerProfile?.name || 'Owner')}</h3>
                  <p className="text-blue-200">{String(ownerProfile?.phone || '')}</p>
                  <p className="text-blue-200 text-sm">{String(ownerProfile?.email || '')}</p>
                  <span className="mt-1 inline-block text-xs bg-white/20 px-3 py-1 rounded-full">Ground Owner</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={18} className="text-blue-600" /> Personal Details</h4>
                <div className="space-y-3">
                  <div><p className="text-xs text-gray-500 uppercase">Full Name</p><p className="font-medium text-gray-800">{String(ownerProfile?.name || '-')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Phone Number</p><p className="font-medium text-gray-800">{String(ownerProfile?.phone || '-')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Email</p><p className="font-medium text-gray-800">{String(ownerProfile?.email || '-')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Role</p><p className="font-medium text-gray-800 capitalize">{String(ownerProfile?.role || 'owner')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Member Since</p><p className="font-medium text-gray-800">{ownerProfile?.created_at ? new Date(String(ownerProfile.created_at)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p></div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Wallet size={18} className="text-green-600" /> KYC & Bank Details</h4>
                <div className="space-y-3">
                  <div><p className="text-xs text-gray-500 uppercase">KYC Status</p><p className={`font-medium ${ownerKycStatus === 'verified' ? 'text-green-600' : ownerKycStatus === 'pending' ? 'text-yellow-600' : ownerKycStatus === 'rejected' ? 'text-red-600' : 'text-gray-400'}`}>{ownerKycStatus === 'verified' ? 'Verified' : ownerKycStatus === 'pending' ? 'Pending Verification' : ownerKycStatus === 'rejected' ? 'Rejected' : 'Not Submitted'}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Bank Name</p><p className="font-medium text-gray-800">{String(ownerProfile?.bank_name || '-')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">Account Number</p><p className="font-medium text-gray-800">{String(ownerProfile?.bank_account || '-')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">IFSC Code</p><p className="font-medium text-gray-800">{String(ownerProfile?.bank_ifsc || '-')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">UPI ID</p><p className="font-medium text-gray-800">{String(ownerProfile?.upi_id || '-')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase">KYC Document</p><p className="font-medium text-gray-800 capitalize">{String(ownerProfile?.kyc_doc_type || '-')}</p></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={18} className="text-purple-600" /> My Grounds ({grounds.length})</h4>
              {grounds.length === 0 ? <p className="text-gray-400 text-sm">No grounds added yet</p> : (
                <div className="space-y-3">
                  {grounds.map((g: Record<string, unknown>, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-800">{String(g.name || '')}</p>
                          <p className="text-xs text-gray-500">{String(g.address || '')} {g.city ? ', ' + String(g.city) : ''}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${g.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{g.is_approved ? 'Active' : 'Pending'}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={async () => { const newName = prompt('New ground name:', String(g.name || '')); if (!newName) return; try { await api.requestGroundChange({ ground_id: g.id as number, changes: { name: newName } }); alert('Change request sent to admin for approval!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1"><Edit size={12}/> Edit</button>
                        <button onClick={async () => { if (!confirm('Request to delete this ground? Admin approval needed.')) return; try { await api.requestGroundChange({ ground_id: g.id as number, changes: { delete: true } }); alert('Delete request sent to admin for approval!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 text-center"><p className="text-2xl font-bold text-blue-600">{data.stats.total_bookings}</p><p className="text-xs text-gray-500 mt-1">Total Bookings</p></div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center"><p className="text-2xl font-bold text-green-600">Rs.{data.stats.total_revenue.toLocaleString()}</p><p className="text-xs text-gray-500 mt-1">Total Revenue</p></div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{data.stats.avg_rating.toFixed(1)}</p><p className="text-xs text-gray-500 mt-1">Avg Rating</p></div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center"><p className="text-2xl font-bold text-purple-600">{grounds.length}</p><p className="text-xs text-gray-500 mt-1">My Grounds</p></div>
            </div>
          </>
        )}

        {/* OWNER TOURNAMENTS - Complete Redesign */}
        {tab === 'tournaments' && (
          <div className="space-y-6">
            {/* Sub-Tabs: Tournaments List | Participants */}
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border shadow-sm">
              <button onClick={() => { setParticipantsTournamentId(null); setParticipantsTournamentName(''); }} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${!participantsTournamentId ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><Calendar size={16}/> Tournaments</button>
              <button disabled={!participantsTournamentId} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${participantsTournamentId ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-300 cursor-not-allowed'}`}><Users size={16}/> Participants {participantsTournamentId ? `(${tournamentParticipants.length})` : ''}</button>
            </div>

            {/* SUB-TAB: Tournaments List */}
            {!participantsTournamentId && (<>
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Tournaments</h3>
                <p className="text-sm text-gray-500 mt-0.5">Create and manage tournaments for your grounds</p>
              </div>
              <button onClick={() => { setCreateTournamentData({ name: '', sport_type: 'cricket', max_teams: 8, entry_fee: 0, prize_pool: 0, start_date: new Date().toISOString().split('T')[0], end_date: '', description: '', ground_id: grounds.length > 0 ? (grounds[0] as Record<string, unknown>).id : 0 }); setShowCreateTournament(true); }} className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-green-700 shadow-sm"><Plus size={16}/> Create Tournament</button>
            </div>

            {/* Stats Summary */}
            {ownerTournaments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-blue-500"><p className="text-2xl font-bold text-blue-600">{ownerTournaments.length}</p><p className="text-xs text-gray-500 mt-1">Total Tournaments</p></div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-green-500"><p className="text-2xl font-bold text-green-600">{ownerTournaments.filter(t => t.status === 'upcoming').length}</p><p className="text-xs text-gray-500 mt-1">Upcoming</p></div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-orange-500"><p className="text-2xl font-bold text-orange-600">{ownerTournaments.reduce((sum, t) => sum + ((t.registered_teams as number) || 0), 0)}</p><p className="text-xs text-gray-500 mt-1">Total Teams</p></div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-purple-500"><p className="text-2xl font-bold text-purple-600">Rs.{ownerTournaments.reduce((sum, t) => sum + ((t.prize_pool as number) || 0), 0).toLocaleString()}</p><p className="text-xs text-gray-500 mt-1">Total Prize Pool</p></div>
              </div>
            )}

            {/* Tournament Cards */}
            {ownerTournaments.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar size={36} className="text-green-400"/></div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">No Tournaments Yet</h4>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Create your first tournament to attract more players and grow your ground business!</p>
                <button onClick={() => { setCreateTournamentData({ name: '', sport_type: 'cricket', max_teams: 8, entry_fee: 0, prize_pool: 0, start_date: new Date().toISOString().split('T')[0], end_date: '', description: '', ground_id: grounds.length > 0 ? (grounds[0] as Record<string, unknown>).id : 0 }); setShowCreateTournament(true); }} className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700"><Plus size={16} className="inline mr-1"/> Create First Tournament</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {ownerTournaments.map(t => (
                  <div key={t.id as number} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    {/* Card Header with gradient */}
                    <div className={`p-5 ${t.status === 'upcoming' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : t.status === 'ongoing' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{t.name as string}</h4>
                          <p className="text-white/80 text-sm mt-1 flex items-center gap-1"><Calendar size={14}/> {t.start_date as string || 'Date TBD'}{t.end_date ? ` - ${t.end_date as string}` : ''}</p>
                        </div>
                        <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">{(t.status as string || 'upcoming').toUpperCase()}</span>
                      </div>
                    </div>
                    {/* Card Body */}
                    <div className="p-5">
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="text-center p-2 bg-green-50 rounded-lg"><p className="text-xs text-gray-500">Entry Fee</p><p className="font-bold text-green-700 text-sm">Rs.{(t.entry_fee as number) || 0}</p></div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg"><p className="text-xs text-gray-500">Prize Pool</p><p className="font-bold text-purple-700 text-sm">Rs.{(t.prize_pool as number) || 0}</p></div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500">Max Teams</p><p className="font-bold text-blue-700 text-sm">{(t.max_teams as number) || 8}</p></div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg"><p className="text-xs text-gray-500">Registered</p><p className="font-bold text-orange-700 text-sm">{(t.registered_teams as number) || 0}</p></div>
                      </div>
                      {t.sport_type ? <p className="text-xs text-gray-500 mb-1">Sport: <span className="font-medium text-gray-700 capitalize">{String(t.sport_type)}</span></p> : null}
                      {t.ground_name ? <p className="text-xs text-gray-500 mb-1">Ground: <span className="font-medium text-gray-700">{String(t.ground_name)}</span></p> : null}
                      {t.description ? <p className="text-sm text-gray-600 mt-2 line-clamp-2">{String(t.description)}</p> : null}
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Registration Progress</span><span>{(t.registered_teams as number) || 0}/{(t.max_teams as number) || 8} teams</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (((t.registered_teams as number) || 0) / ((t.max_teams as number) || 8)) * 100)}%` }}></div></div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
                        <button onClick={() => { setParticipantsTournamentId(t.id as number); setParticipantsTournamentName(String(t.name || 'Tournament')); api.getOwnerTournamentRegistrations(t.id as number).then(regs => setTournamentParticipants(Array.isArray(regs) ? regs : regs.registrations || [])).catch(() => setTournamentParticipants([])); }} className="text-xs bg-purple-50 text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-100 flex items-center gap-1 font-medium"><Users size={14}/> Participants ({(t.registered_teams as number) || 0})</button>
                        <button onClick={() => { setShowEditTournament(t); setEditTournamentData({ name: t.name, entry_fee: t.entry_fee, prize_pool: t.prize_pool, max_teams: t.max_teams, description: t.description || '', sport_type: t.sport_type || 'cricket', start_date: t.start_date || '', end_date: t.end_date || '', ground_id: t.ground_id || 0, status: t.status || 'upcoming' }); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-1 font-medium"><Edit size={14}/> Edit</button>
                        <button onClick={async () => { if(confirm('Delete this tournament? All registrations will also be deleted.')) { try { await api.deleteOwnerTournament(t.id as number); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } } }} className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center gap-1 font-medium"><Trash2 size={14}/> Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CREATE TOURNAMENT MODAL */}
            {showCreateTournament && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateTournament(false)}>
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar size={22}/> Create New Tournament</h3>
                    <p className="text-green-100 text-sm mt-1">Fill in all details to create your tournament</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Tournament Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tournament Name <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="e.g. Cricket Premier League 2026" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none transition-colors" value={createTournamentData.name as string || ''} onChange={e => setCreateTournamentData({...createTournamentData, name: e.target.value})} />
                    </div>
                    {/* Sport Type & Ground */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sport Type</label>
                        <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none bg-white" value={createTournamentData.sport_type as string || 'cricket'} onChange={e => setCreateTournamentData({...createTournamentData, sport_type: e.target.value})}>
                          <option value="cricket">Cricket</option>
                          <option value="football">Football</option>
                          <option value="badminton">Badminton</option>
                          <option value="tennis">Tennis</option>
                          <option value="kabaddi">Kabaddi</option>
                          <option value="volleyball">Volleyball</option>
                          <option value="basketball">Basketball</option>
                          <option value="hockey">Hockey</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ground</label>
                        <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none bg-white" value={createTournamentData.ground_id as number || 0} onChange={e => setCreateTournamentData({...createTournamentData, ground_id: parseInt(e.target.value)})}>
                          <option value={0}>Select Ground</option>
                          {grounds.map((g: Record<string, unknown>) => <option key={g.id as number} value={g.id as number}>{g.name as string}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none" value={createTournamentData.start_date as string || ''} onChange={e => setCreateTournamentData({...createTournamentData, start_date: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                        <input type="date" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none" value={createTournamentData.end_date as string || ''} onChange={e => setCreateTournamentData({...createTournamentData, end_date: e.target.value})} />
                      </div>
                    </div>
                    {/* Entry Fee, Prize Pool, Max Teams */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Entry Fee (Rs.)</label>
                        <input type="number" min="0" placeholder="0 = Free" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none" value={createTournamentData.entry_fee as number || ''} onChange={e => setCreateTournamentData({...createTournamentData, entry_fee: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prize Pool (Rs.)</label>
                        <input type="number" min="0" placeholder="e.g. 10000" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none" value={createTournamentData.prize_pool as number || ''} onChange={e => setCreateTournamentData({...createTournamentData, prize_pool: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Teams</label>
                        <input type="number" min="2" max="128" placeholder="e.g. 8" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none" value={createTournamentData.max_teams as number || ''} onChange={e => setCreateTournamentData({...createTournamentData, max_teams: parseInt(e.target.value) || 8})} />
                      </div>
                    </div>
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description / Rules</label>
                      <textarea placeholder="Tournament rules, format, prizes breakdown, etc." className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-0 outline-none resize-none" rows={4} value={createTournamentData.description as string || ''} onChange={e => setCreateTournamentData({...createTournamentData, description: e.target.value})} />
                    </div>
                    {/* Preview Summary */}
                    {(createTournamentData.name as string) && (
                      <div className="bg-gray-50 rounded-xl p-4 border">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</p>
                        <p className="font-bold text-gray-800">{createTournamentData.name as string}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-600">
                          <span>Sport: <b className="capitalize">{createTournamentData.sport_type as string}</b></span>
                          <span>Fee: <b>Rs.{(createTournamentData.entry_fee as number) || 0}</b></span>
                          <span>Prize: <b>Rs.{(createTournamentData.prize_pool as number) || 0}</b></span>
                          <span>Teams: <b>{(createTournamentData.max_teams as number) || 8}</b></span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="flex gap-3 p-6 pt-0">
                    <button onClick={() => setShowCreateTournament(false)} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={async () => {
                      if (!(createTournamentData.name as string)?.trim()) { alert('Please enter tournament name'); return; }
                      if (!(createTournamentData.start_date as string)) { alert('Please select start date'); return; }
                      try {
                        await api.createOwnerTournament(createTournamentData);
                        setShowCreateTournament(false);
                        loadTab();
                        alert('Tournament created successfully!');
                      } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed to create tournament'); }
                    }} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 shadow-sm">Create Tournament</button>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT TOURNAMENT MODAL */}
            {showEditTournament && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditTournament(null)}>
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Edit size={22}/> Edit Tournament</h3>
                    <p className="text-blue-100 text-sm mt-1">Update tournament details</p>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tournament Name <span className="text-red-500">*</span></label>
                      <input type="text" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none" value={editTournamentData.name as string || ''} onChange={e => setEditTournamentData({...editTournamentData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sport Type</label>
                        <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white" value={editTournamentData.sport_type as string || 'cricket'} onChange={e => setEditTournamentData({...editTournamentData, sport_type: e.target.value})}>
                          <option value="cricket">Cricket</option><option value="football">Football</option><option value="badminton">Badminton</option><option value="tennis">Tennis</option><option value="kabaddi">Kabaddi</option><option value="volleyball">Volleyball</option><option value="basketball">Basketball</option><option value="hockey">Hockey</option><option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                        <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none bg-white" value={editTournamentData.status as string || 'upcoming'} onChange={e => setEditTournamentData({...editTournamentData, status: e.target.value})}>
                          <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label><input type="date" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none" value={editTournamentData.start_date as string || ''} onChange={e => setEditTournamentData({...editTournamentData, start_date: e.target.value})} /></div>
                      <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label><input type="date" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none" value={editTournamentData.end_date as string || ''} onChange={e => setEditTournamentData({...editTournamentData, end_date: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Entry Fee (Rs.)</label><input type="number" min="0" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none" value={editTournamentData.entry_fee as number || 0} onChange={e => setEditTournamentData({...editTournamentData, entry_fee: parseInt(e.target.value) || 0})} /></div>
                      <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Prize Pool (Rs.)</label><input type="number" min="0" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none" value={editTournamentData.prize_pool as number || 0} onChange={e => setEditTournamentData({...editTournamentData, prize_pool: parseInt(e.target.value) || 0})} /></div>
                      <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Teams</label><input type="number" min="2" max="128" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none" value={editTournamentData.max_teams as number || 8} onChange={e => setEditTournamentData({...editTournamentData, max_teams: parseInt(e.target.value) || 8})} /></div>
                    </div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Description / Rules</label><textarea className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-0 outline-none resize-none" rows={4} value={editTournamentData.description as string || ''} onChange={e => setEditTournamentData({...editTournamentData, description: e.target.value})} /></div>
                  </div>
                  <div className="flex gap-3 p-6 pt-0">
                    <button onClick={() => setShowEditTournament(null)} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={async () => { try { await api.updateOwnerTournament(showEditTournament.id as number, editTournamentData); setShowEditTournament(null); loadTab(); alert('Tournament updated!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-sm">Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            </>)}

            {/* SUB-TAB: Participants View */}
            {participantsTournamentId && (<>
            {/* Participants Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => { setParticipantsTournamentId(null); setParticipantsTournamentName(''); }} className="p-2 bg-white rounded-lg border hover:bg-gray-50"><ChevronLeft size={18}/></button>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{participantsTournamentName}</h3>
                  <p className="text-sm text-gray-500">{tournamentParticipants.length} registrations</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { if (!participantsTournamentId) return; api.getOwnerTournamentRegistrations(participantsTournamentId).then(regs => setTournamentParticipants(Array.isArray(regs) ? regs : regs.registrations || [])).catch(() => {}); }} className="text-sm bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 font-medium"><Search size={14}/> Refresh</button>
                <button onClick={() => { const headers = ['#', 'Team Name', 'Player Name', 'Phone', 'Email', 'Status', 'Payment', 'Registered']; const rows = tournamentParticipants.map((p, i) => [String(i+1), String(p.team_name || ''), String(p.user_name || p.name || ''), String(p.user_phone || p.phone || ''), String(p.user_email || p.email || ''), String(p.status || ''), String(p.payment_method || ''), String(p.created_at || '').split('T')[0]]); ownerExportCSV(participantsTournamentName + ' - Participants', headers, rows); }} className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1.5 font-medium"><Download size={14}/> Export CSV</button>
                <button onClick={() => { const headers = ['#', 'Team Name', 'Player Name', 'Phone', 'Email', 'Status', 'Payment', 'Registered']; const rows = tournamentParticipants.map((p, i) => [String(i+1), String(p.team_name || ''), String(p.user_name || p.name || ''), String(p.user_phone || p.phone || ''), String(p.user_email || p.email || ''), String(p.status || ''), String(p.payment_method || ''), String(p.created_at || '').split('T')[0]]); ownerExportPDF(participantsTournamentName + ' - Participants', headers, rows); }} className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-1.5 font-medium"><FileText size={14}/> Export PDF</button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-3 border text-center"><p className="text-2xl font-bold text-blue-600">{tournamentParticipants.length}</p><p className="text-xs text-gray-500">Total</p></div>
              <div className="bg-white rounded-xl p-3 border text-center"><p className="text-2xl font-bold text-green-600">{tournamentParticipants.filter(p => p.status === 'registered').length}</p><p className="text-xs text-gray-500">Confirmed</p></div>
              <div className="bg-white rounded-xl p-3 border text-center"><p className="text-2xl font-bold text-orange-600">{tournamentParticipants.filter(p => p.status === 'waiting_verification').length}</p><p className="text-xs text-gray-500">Cash Pending</p></div>
              <div className="bg-white rounded-xl p-3 border text-center"><p className="text-2xl font-bold text-red-600">{tournamentParticipants.filter(p => p.status === 'cancelled').length}</p><p className="text-xs text-gray-500">Cancelled</p></div>
            </div>

            {/* Excel-Style Table */}
            {tournamentParticipants.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border">
                <Users size={48} className="mx-auto mb-3 text-gray-200"/>
                <p className="text-gray-400 font-medium">No participants registered yet</p>
                <p className="text-gray-300 text-sm mt-1">Share the tournament link to get registrations</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">#</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Team Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Player Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Phone</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Payment</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournamentParticipants.map((p, i) => (
                        <tr key={i} className={`border-b hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-4 py-3 font-medium text-gray-500">{i + 1}</td>
                          <td className="px-4 py-3 font-bold text-gray-800">{String(p.team_name || 'Team ' + (i+1))}</td>
                          <td className="px-4 py-3 text-gray-700">{String(p.user_name || p.name || 'Unknown')}</td>
                          <td className="px-4 py-3"><a href={'tel:' + String(p.user_phone || p.phone || '')} className="text-blue-600 hover:underline whitespace-nowrap">{String(p.user_phone || p.phone || '-')}</a></td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{String(p.user_email || p.email || '-')}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${p.payment_method === 'cash' ? 'bg-orange-100 text-orange-700' : p.payment_method === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{String(p.payment_method || 'N/A')}</span></td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{String(p.created_at || p.registered_at || '').split('T')[0] || '-'}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === 'cancelled' ? 'bg-red-100 text-red-700' : p.status === 'waiting_verification' ? 'bg-orange-100 text-orange-700' : p.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{p.status === 'waiting_verification' ? 'Cash Pending' : String(p.status || 'registered')}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {p.status === 'waiting_verification' && participantsTournamentId && (
                                <button onClick={async () => { if(confirm('Verify this cash payment?')) { try { await api.ownerVerifyTournamentReg(participantsTournamentId!, p.id as number); const regs = await api.getOwnerTournamentRegistrations(participantsTournamentId!); setTournamentParticipants(Array.isArray(regs) ? regs : []); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } } }} className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 font-medium whitespace-nowrap"><CheckCircle size={12} className="inline mr-0.5"/> Verify</button>
                              )}
                              {p.status !== 'cancelled' && participantsTournamentId && (
                                <button onClick={async () => { if(confirm('Cancel registration? 100% refund will be given.')) { try { await api.ownerCancelTournamentRegistration(participantsTournamentId!, p.id as number); const regs = await api.getOwnerTournamentRegistrations(participantsTournamentId!); setTournamentParticipants(Array.isArray(regs) ? regs : []); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } } }} className="text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 font-medium whitespace-nowrap">Cancel</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>)}

          </div>
        )}

        {/* V18 - OWNER EQUIPMENT with CRUD */}
        {tab === 'equipment' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Equipment for Rent</h3>
              <button onClick={() => setShowCreateEquipment(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Plus size={14}/> Add Equipment</button>
            </div>
            {ownerEquipmentList.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center"><Tag size={48} className="mx-auto mb-3 text-gray-300"/><p className="text-gray-500">No equipment. Add equipment for players to rent!</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownerEquipmentList.map(eq => (
                  <div key={eq.id as number} className="bg-white rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-1">{eq.name as string}</h4>
                    <p className="text-sm text-gray-600">Rs.{eq.price_per_hour as number}/hr | Qty: {eq.quantity as number}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${eq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{eq.is_active ? 'Available' : 'Unavailable'}</span>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <button onClick={() => setEditEquipment(eq)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1"><Edit size={12}/> Edit</button>
                      <button onClick={async () => { if(confirm('Delete this equipment?')) { try { await api.deleteOwnerEquipment(eq.id as number); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } } }} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Add Equipment Modal */}
            {showCreateEquipment && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateEquipment(false)}>
                <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Add Equipment</h3>
                  <div className="space-y-3">
                    <div><label className="text-sm font-medium text-gray-600">Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="e.g., Cricket Kit, Batting Pads" value={newEquipmentData.name} onChange={e => setNewEquipmentData({...newEquipmentData, name: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium text-gray-600">Price/Hr (Rs)</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={newEquipmentData.price_per_hour} onChange={e => setNewEquipmentData({...newEquipmentData, price_per_hour: parseInt(e.target.value)})} /></div>
                      <div><label className="text-sm font-medium text-gray-600">Quantity</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={newEquipmentData.quantity} onChange={e => setNewEquipmentData({...newEquipmentData, quantity: parseInt(e.target.value)})} /></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowCreateEquipment(false)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                    <button onClick={async () => { try { await api.addAdminEquipment({ ...newEquipmentData, ground_id: grounds[0]?.id || 0 }); setShowCreateEquipment(false); setNewEquipmentData({ name: '', price_per_hour: 50, quantity: 5 }); loadTab(); alert('Equipment added!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700">Add Equipment</button>
                  </div>
                </div>
              </div>
            )}
            {/* Edit Equipment Modal */}
            {editEquipment && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditEquipment(null)}>
                <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Equipment</h3>
                  <div className="space-y-3">
                    <div><label className="text-sm font-medium text-gray-600">Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue={editEquipment.name as string} id="edit-eq-name" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium text-gray-600">Price/Hr (Rs)</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue={editEquipment.price_per_hour as number} id="edit-eq-price" /></div>
                      <div><label className="text-sm font-medium text-gray-600">Quantity</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue={editEquipment.quantity as number} id="edit-eq-qty" /></div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setEditEquipment(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                    <button onClick={async () => { const name = (document.getElementById('edit-eq-name') as HTMLInputElement)?.value; const price = parseInt((document.getElementById('edit-eq-price') as HTMLInputElement)?.value); const qty = parseInt((document.getElementById('edit-eq-qty') as HTMLInputElement)?.value); try { await api.updateOwnerEquipment(editEquipment.id as number, { name, price_per_hour: price, quantity: qty }); setEditEquipment(null); loadTab(); alert('Equipment updated!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700">Save Changes</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EDIT GROUND TAB - opens as separate tab */}
        {tab === 'editground' && !showEditGroundModal && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">No ground selected. Please go to My Grounds and click "Edit".</p>
            <button onClick={() => changeTab('grounds')} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mx-auto"><ChevronLeft size={16}/> Go to My Grounds</button>
          </div>
        )}
        {tab === 'editground' && showEditGroundModal && (
          <div className="space-y-4">
            <button onClick={() => { setShowEditGroundModal(null); changeTab('grounds'); }} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2"><ChevronLeft size={16}/> Back to My Grounds</button>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Edit size={20} className="text-blue-600"/> Edit Ground</h3>
              <div className="space-y-3">
                <div><label className="text-sm font-medium text-gray-600">Ground Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.name as string || ''} onChange={e => setEditGroundFormData({...editGroundFormData, name: e.target.value})} /></div>
                <div><label className="text-sm font-medium text-gray-600">Address</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.address as string || ''} onChange={e => setEditGroundFormData({...editGroundFormData, address: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium text-gray-600">City</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.city as string || ''} onChange={e => setEditGroundFormData({...editGroundFormData, city: e.target.value})} /></div>
                  <div><label className="text-sm font-medium text-gray-600">Ground Type</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.ground_type as string || 'box'} onChange={e => setEditGroundFormData({...editGroundFormData, ground_type: e.target.value})}><option value="box">Box Cricket</option><option value="turf">Turf</option><option value="open">Open Ground</option><option value="indoor">Indoor</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium text-gray-600">Weekday Price</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.weekday_price as number || 0} onChange={e => setEditGroundFormData({...editGroundFormData, weekday_price: parseInt(e.target.value)})} /></div>
                  <div><label className="text-sm font-medium text-gray-600">Weekend Price</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.weekend_price as number || 0} onChange={e => setEditGroundFormData({...editGroundFormData, weekend_price: parseInt(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium text-gray-600">Evening Extra</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.evening_extra as number || 0} onChange={e => setEditGroundFormData({...editGroundFormData, evening_extra: parseInt(e.target.value)})} /></div>
                  <div><label className="text-sm font-medium text-gray-600">Token Money %</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.token_money_percent as number || 100} onChange={e => setEditGroundFormData({...editGroundFormData, token_money_percent: parseInt(e.target.value)})}><option value={30}>30%</option><option value={50}>50%</option><option value={100}>100%</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium text-gray-600">Opening Time</label><input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.opening_time as string || '06:00'} onChange={e => setEditGroundFormData({...editGroundFormData, opening_time: e.target.value})} /></div>
                  <div><label className="text-sm font-medium text-gray-600">Closing Time</label><input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={editGroundFormData.closing_time as string || '22:00'} onChange={e => setEditGroundFormData({...editGroundFormData, closing_time: e.target.value})} /></div>
                </div>
                <div><label className="text-sm font-medium text-gray-600">Description</label><textarea className="w-full border rounded-lg px-3 py-2 mt-1" rows={2} value={editGroundFormData.description as string || ''} onChange={e => setEditGroundFormData({...editGroundFormData, description: e.target.value})} /></div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <label className="text-sm font-medium text-purple-700 mb-2 block">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {allAmenities.map(a => (
                      <label key={a} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer border transition ${editSelectedAmenities.includes(a) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'}`}>
                        <input type="checkbox" className="hidden" checked={editSelectedAmenities.includes(a)} onChange={() => { const next = editSelectedAmenities.includes(a) ? editSelectedAmenities.filter(x => x !== a) : [...editSelectedAmenities, a]; setEditSelectedAmenities(next); setEditGroundFormData(prev => ({...prev, amenities: next.join(',')})); }} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
                {/* Gallery Images with Delete */}
                {Array.isArray(showEditGroundModal.gallery_images) && (showEditGroundModal.gallery_images as Array<Record<string, unknown>>).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Images</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {(showEditGroundModal.gallery_images as Array<Record<string, unknown>>).map((img: Record<string, unknown>) => (
                        <div key={img.id as number} className="relative">
                          <img src={String(img.image_url || '')} alt="Ground" className="w-24 h-24 object-cover rounded-lg border" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                          <button onClick={async () => { try { await api.deleteGalleryImage(img.id as number); const updated = (showEditGroundModal.gallery_images as Array<Record<string, unknown>>).filter(i => i.id !== img.id); setShowEditGroundModal({...showEditGroundModal, gallery_images: updated}); } catch {} }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">x</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Fallback: show image_url/photos if no gallery */}
                {(!Array.isArray(showEditGroundModal.gallery_images) || (showEditGroundModal.gallery_images as Array<Record<string, unknown>>).length === 0) && String(showEditGroundModal.image_url || showEditGroundModal.photos || '') !== '' && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Image</label>
                    <div className="flex gap-2 mt-1"><img src={String(showEditGroundModal.image_url || showEditGroundModal.photos || '')} alt="Ground" className="w-24 h-24 object-cover rounded-lg border" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} /></div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Upload Photos (multiple allowed)</label>
                  <input type="file" accept="image/*" multiple className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setEditGroundPhotos(prev => [...prev, ...files]);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = () => setEditGroundPhotoPreviews(prev => [...prev, reader.result as string]);
                      reader.readAsDataURL(file);
                    });
                  }} />
                  {editGroundPhotoPreviews.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {editGroundPhotoPreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border-2 border-green-400" />
                          <button type="button" onClick={() => {
                            setEditGroundPhotos(prev => prev.filter((_, i) => i !== idx));
                            setEditGroundPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                          }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">x</button>
                          <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-center text-[10px] rounded-b-lg">New</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowEditGroundModal(null); changeTab('grounds'); }} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                <button onClick={async () => {
                  try {
                    const changes: Record<string, unknown> = {};
                    const fields = ['name','address','city','weekday_price','weekend_price','evening_extra','ground_type','opening_time','closing_time','description','amenities','token_money_percent'];
                    fields.forEach(f => { if(editGroundFormData[f] !== undefined && editGroundFormData[f] !== showEditGroundModal[f]) changes[f] = editGroundFormData[f]; });
                    if(editGroundPhotos.length > 0) changes['photo_updated'] = true;
                    if(Object.keys(changes).length === 0 && editGroundPhotos.length === 0) { showOwnerToast('No changes made', 'warning'); return; }
                    if(Object.keys(changes).length > 0) {
                      await api.requestGroundChange({ ground_id: showEditGroundModal.id as number, changes });
                    }
                    for (const preview of editGroundPhotoPreviews) {
                      try {
                        await api.addGalleryImage({ ground_id: showEditGroundModal.id as number, image_data: preview, caption: '' });
                      } catch { /* ignore individual upload errors */ }
                    }
                    setEditGroundPhotos([]); setEditGroundPhotoPreviews([]);
                    if(Object.keys(changes).length > 0) {
                      showOwnerToast('Change request sent to admin + photos uploaded!', 'success');
                    } else {
                      showOwnerToast('Photos uploaded successfully!', 'success');
                    }
                    setShowEditGroundModal(null);
                    changeTab('grounds');
                    loadData();
                  } catch(e: unknown) { showOwnerToast(e instanceof Error ? e.message : 'Failed', 'error'); }
                }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">Submit Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {tab === 'chat' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Messages</h3>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-gray-600 mb-4">Chat with admin, users and other ground owners</p>
              <button onClick={() => navigate('/chat')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2"><MessageSquare size={18}/> Open Chat</button>
            </div>
          </div>
        )}

      </div>
      </div>

      {cancelPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCancelPopup(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4 text-red-600"><AlertTriangle size={24}/><h3 className="text-xl font-bold">Cancel Booking?</h3></div>
            <div className="bg-red-50 rounded-xl p-4 mb-4 text-sm">
              <p className="font-medium text-red-700 mb-2">Owner Cancel Penalty: Rs.100 per slot</p>
              <p className="text-red-600">This charge will be deducted from your settlement.</p>
              <p className="text-red-600 mt-1">Cancellation allowed only 4+ hours before booking time.</p>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{cancelPopup.user_name as string}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date/Time</span><span>{cancelPopup.booking_date as string} {cancelPopup.start_time as string}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span>Rs.{cancelPopup.total_amount as number}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelPopup(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Keep Booking</button>
              <button onClick={() => handleCancel(cancelPopup.booking_id as string)} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700">Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Rate User Popup */}
      {rateUserId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRateUserId(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Rate Customer</h3>
            <div className="flex gap-2 justify-center mb-4">
              {[1,2,3,4,5].map(s => <button key={s} onClick={() => setUserRating(s)}><Star size={28} className={s <= userRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}/></button>)}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRateUserId(null)} className="flex-1 border-2 py-2 rounded-xl font-medium">Cancel</button>
              <button onClick={() => handleRateUser(rateUserId)} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Booking Dialog */}
      {offlineDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOfflineDialog(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Record Offline Booking</h3>
            {/* Date Picker */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-1 block">Booking Date</label>
              <input type="date" className="w-full border rounded-lg px-4 py-2" value={offlineBookingDate} min={new Date().toISOString().split('T')[0]} onChange={e => { setOfflineBookingDate(e.target.value); if (selectedGround) loadSlots(selectedGround, e.target.value); }} />
            </div>
            {/* Self Booking Toggle */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border-2 cursor-pointer" onClick={() => { const next = !isSelfBooking; setIsSelfBooking(next); if (next && ownerProfile) { setOfflineData(d => ({...d, customer_name: String(ownerProfile.name || ''), customer_phone: String(ownerProfile.phone || '')})); } else { setOfflineData(d => ({...d, customer_name: '', customer_phone: ''})); } }} style={{borderColor: isSelfBooking ? '#7c3aed' : '#e5e7eb', backgroundColor: isSelfBooking ? '#f5f3ff' : 'white'}}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelfBooking ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>{isSelfBooking && <span className="text-white text-xs font-bold">✓</span>}</div>
              <div><p className="font-medium text-sm" style={{color: isSelfBooking ? '#7c3aed' : '#374151'}}>Self Booking (Owner)</p><p className="text-xs text-gray-500">No admin commission on self bookings</p></div>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Customer Name" className="w-full border rounded-lg px-4 py-2" value={offlineData.customer_name} onChange={e => setOfflineData({...offlineData, customer_name: e.target.value})} disabled={isSelfBooking} style={{backgroundColor: isSelfBooking ? '#f3f4f6' : 'white'}} />
              <input type="tel" placeholder="Customer Phone" className="w-full border rounded-lg px-4 py-2" value={offlineData.customer_phone} onChange={e => setOfflineData({...offlineData, customer_phone: e.target.value})} disabled={isSelfBooking} style={{backgroundColor: isSelfBooking ? '#f3f4f6' : 'white'}} />
              <select className="w-full border rounded-lg px-4 py-2" value={offlineData.slot_id} onChange={e => { const sid = parseInt(e.target.value); const slot = slots.find((s: Record<string, unknown>) => (s.id as number) === sid); setOfflineData({...offlineData, slot_id: sid, amount: slot ? (slot.price as number) : 0}); }}>
                <option value={0}>Select Slot</option>
                {slots.filter((s: Record<string, unknown>) => {
                  if (s.status !== 'available') return false;
                  const today = new Date().toISOString().split('T')[0];
                  if (offlineBookingDate === today) {
                    const now = new Date();
                    const hr = now.getHours();
                    const mn = now.getMinutes();
                    const currentTime = String(hr).padStart(2,'0') + ':' + String(mn).padStart(2,'0');
                    if ((s.start_time as string) <= currentTime) return false;
                  }
                  return true;
                }).map((s: Record<string, unknown>) => (
                  <option key={s.id as number} value={s.id as number}>{s.start_time as string} - {s.end_time as string} (Rs.{s.price as number})</option>
                ))}
              </select>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-lg font-bold text-green-600">Rs.{offlineData.amount || 0}</span>
              </div>
              {isSelfBooking && <p className="text-xs text-purple-600 bg-purple-50 rounded-lg p-2 text-center">Self booking - No commission will be charged</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setOfflineDialog(false); setIsSelfBooking(false); }} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
              <button onClick={handleOfflineBooking} className={`flex-1 text-white py-2.5 rounded-xl font-medium ${isSelfBooking ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-500 hover:bg-orange-600'}`}>{isSelfBooking ? 'Record Self Booking' : 'Record Booking'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {successPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSuccessPopup(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle size={28} className="text-green-600"/></div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Success!</h3>
            <p className="text-gray-600 text-sm mb-4">{successPopup}</p>
            <button onClick={() => setSuccessPopup(null)} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700">OK</button>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setErrorPopup(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><XCircle size={28} className="text-red-600"/></div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600 text-sm mb-4">{errorPopup}</p>
            <button onClick={() => setErrorPopup(null)} className="w-full bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
// v18-fix-1773731262

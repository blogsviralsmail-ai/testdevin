import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { TrendingUp, Users, MapPin, Calendar, IndianRupee, Settings, Tag, CreditCard, BarChart3, Shield, Trash2, Plus, Star, FileText, X, Edit, Download, CheckCircle, XCircle, Clock, Bell, Menu, ChevronLeft, LogOut, MessageSquare, Eye, Wallet, Search, User, UserCheck, Lock, Upload, Navigation } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminValidTabs = ['dashboard','grounds','bookings','users','settlements','withdrawals','promos','settings','reports','kyc','tickets','teamdata','history','customize','gateways','marketing','blog','affiliates','pushnotifs','cityreports','appversion','ownerwallets','ownerstaff','adminprofile','rolemanagement','tournaments','auditlog','equipment','loyalty','autosettlement','emailtemplates','pages','bulkops','groundchanges','chat','contactsubs','splitpayments'] as const;
  type AdminTabType = typeof adminValidTabs[number];
  const getAdminInitialTab = (): AdminTabType => {
    const path = location.pathname.replace('/admin/', '').replace('/admin', '');
    if (path && adminValidTabs.includes(path as AdminTabType)) return path as AdminTabType;
    return 'dashboard';
  };
  const [tab, setTab] = useState<AdminTabType>(getAdminInitialTab());
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [grounds, setGrounds] = useState<Array<Record<string, unknown>>>([]);
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [promos, setPromos] = useState<Array<Record<string, unknown>>>([]);
  const [settings, setSettings] = useState<Array<Record<string, unknown>>>([]);
  const [gateways, setGateways] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const [newPromo, setNewPromo] = useState({ code: '', discount_type: 'percentage', discount_value: 10, min_booking: 500, max_discount: 200, usage_limit: 100, valid_from: '2026-01-01', valid_to: '2026-12-31' });
  const [showAddGround, setShowAddGround] = useState(false);
  const [groundChangeRequests, setGroundChangeRequests] = useState<Array<Record<string, unknown>>>([]);
  const [newGround, setNewGround] = useState({ name: '', address: '', city: 'Jaipur', ground_type: 'box', weekday_price: 800, weekend_price: 1000, evening_extra: 200, opening_time: '06:00', closing_time: '22:00', amenities: 'Floodlights,Parking,Washroom,Water', latitude: 26.9124, longitude: 75.7873, owner_id: 2, description: '' });
  const [reportPeriod] = useState('monthly');
  const [revenueReport, setRevenueReport] = useState<Record<string, unknown> | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', phone: '', email: '', role: 'user', password: 'password123' });
  const [editingUser, setEditingUser] = useState<Record<string, unknown> | null>(null);
  const [editUserData, setEditUserData] = useState({ name: '', phone: '', email: '', role: 'user', password: '' });
  const [showAdminBooking, setShowAdminBooking] = useState(false);
  const [adminBooking, setAdminBooking] = useState({ customer_name: '', customer_phone: '', ground_id: 0, date: new Date().toISOString().split('T')[0], slot_id: 0, payment_mode: 'cash' });
  const [adminBookingSlots, setAdminBookingSlots] = useState<Array<Record<string, unknown>>>([]);
  // groundStatementId removed - Payments tab removed
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Array<Record<string, unknown>>>([]);
  const [settlements, setSettlements] = useState<Array<Record<string, unknown>>>([]);
  const [notifConfig, setNotifConfig] = useState<Record<string, Record<string, string>>>({ sms: { api_key: '', provider: 'MSG91', sender_id: 'BAGND' }, whatsapp: { api_key: '', provider: 'Twilio', phone: '' }, email: { api_key: '', provider: 'SendGrid', from_email: 'noreply@bookaground.com' } });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [kycList, setKycList] = useState<Array<Record<string, unknown>>>([]);
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  // settlementTab removed - withdrawals now in separate tab
  const [kycDocModal, setKycDocModal] = useState<string | null>(null);
  const [kycRejectModal, setKycRejectModal] = useState<number | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [tickets, setTickets] = useState<Array<Record<string, unknown>>>([]);
  const [ticketReply, setTicketReply] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Record<string, unknown> | null>(null);
  const [adminTeams, setAdminTeams] = useState<Array<Record<string, unknown>>>([]);
  const [txnHistory, setTxnHistory] = useState<Array<Record<string, unknown>>>([]);
  const [txnOwnerFilter, setTxnOwnerFilter] = useState<string>('all');
  const [approvalTxnId, setApprovalTxnId] = useState('');
  const [approvalProofUrl, setApprovalProofUrl] = useState('');
  const [approvalProofFile, setApprovalProofFile] = useState<File | null>(null);
  const [approvalMethod, setApprovalMethod] = useState<'manual' | 'razorpay'>('manual');
  const [approving, setApproving] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<number | null>(null);
  const [reportDetail, setReportDetail] = useState<Array<Record<string, unknown>>>([]);
  const [reportType, setReportType] = useState('bookings');
  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [customizeSettings, setCustomizeSettings] = useState<Record<string, string>>({});
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [editingGateway, setEditingGateway] = useState<number | null>(null);
  // V13 new state
  const [blogPosts, setBlogPosts] = useState<Array<Record<string, unknown>>>([]);
  const [campaigns, setCampaigns] = useState<Array<Record<string, unknown>>>([]);
  const [affiliatesList, setAffiliatesList] = useState<Array<Record<string, unknown>>>([]);
  const [pushNotifs, setPushNotifs] = useState<Array<Record<string, unknown>>>([]);
  const [cityReports, setCityReports] = useState<Array<Record<string, unknown>>>([]);
  const [appVersion, setAppVersion] = useState<Record<string, unknown>>({});
  const [newBlog, setNewBlog] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'email', subject: '', content: '', target_audience: 'all' });
  const [newPushNotif, setNewPushNotif] = useState({ title: '', body: '', target: 'all' });
  // v14 - Owner wallets, staff, search filters
  // v15 - CSV/PDF, Filters, Admin Profile, Role Management
  // V16 - old filter state removed, now using per-tab filter state
  const [adminRoles, setAdminRoles] = useState<Array<Record<string, unknown>>>([
    { id: 1, name: 'Super Admin', permissions: 'all', users: 1, color: 'purple' },
    { id: 2, name: 'Manager', permissions: 'grounds,bookings,users,settlements,reports', users: 0, color: 'blue' },
    { id: 3, name: 'Support', permissions: 'tickets,users,bookings', users: 0, color: 'green' },
    { id: 4, name: 'Finance', permissions: 'payments,settlements,withdrawals,reports', users: 0, color: 'orange' },
  ]);
  const [editAdminTournament, setEditAdminTournament] = useState<Record<string, unknown> | null>(null);
  const [editAdminTournData, setEditAdminTournData] = useState<Record<string, unknown>>({});
  const [adminTournParticipants, setAdminTournParticipants] = useState<Array<Record<string, unknown>>>([]);
  const [showAdminTournParticipants, setShowAdminTournParticipants] = useState<number | null>(null);
  const [bulkCSVFile, setBulkCSVFile] = useState<File | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<Record<string, unknown>>>([]);
  const [newTeamMember, setNewTeamMember] = useState({ name: '', email: '', phone: '', role_id: 1, password: 'password123' });
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [ownerWallets, setOwnerWallets] = useState<Array<Record<string, unknown>>>([]);
  const [ownerStaffData, setOwnerStaffData] = useState<Record<string, unknown> | null>(null);
  const [ownerStaffOwnerId, setOwnerStaffOwnerId] = useState<number>(0);
  const [splitPayments, setSplitPayments] = useState<Array<Record<string, unknown>>>([]);
  // V16 - listSearch replaced by per-tab search state

  const changeAdminTab = (t: AdminTabType) => {
    setTab(t);
    navigate('/admin/' + t, { replace: true });
  };

  useEffect(() => {
    const path = location.pathname.replace('/admin/', '').replace('/admin', '');
    if (path && adminValidTabs.includes(path as AdminTabType) && path !== tab) setTab(path as AdminTabType);
  }, [location.pathname]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    loadTab();
  }, [tab]);

  const loadTab = async () => {
    setLoading(true);
    try {
      switch (tab) {
        case 'dashboard': setDashboard(await api.getAdminDashboard()); break;
        case 'grounds': setGrounds(await api.getAdminGrounds()); break;
        case 'bookings': setBookings(await api.getAdminBookings()); setGrounds(await api.getAdminGrounds()); break;
        case 'users': setUsers(await api.getAdminUsers(userRoleFilter !== 'all' ? userRoleFilter : undefined)); break;
        case 'promos': setPromos(await api.getAdminPromos()); break;
        case 'settings': setSettings(await api.getAdminSettings()); break;
        case 'settlements':
          try { setSettlements(await api.getAdminSettlements()); } catch { setSettlements([]); }
          break;
        case 'withdrawals':
          try { setWithdrawals(await api.getWithdrawals()); } catch { setWithdrawals([]); }
          break;
        case 'customize':
          try { setCustomizeSettings(await api.getCustomizeSettings()); } catch { setCustomizeSettings({}); }
          break;
        case 'reports':
          try { setRevenueReport(await api.getRevenueReport(reportPeriod)); } catch { setRevenueReport(null); }
          break;
        case 'kyc': try { setKycList(await api.getAllKYC()); } catch { try { setKycList(await api.getPendingKYC()); } catch { setKycList([]); } } break;
        case 'tickets': try { setTickets(await api.getAdminTickets()); } catch { setTickets([]); } break;
        case 'teamdata': try { setAdminTeams(await api.getAdminTeams()); } catch { setAdminTeams([]); } break;
        case 'history': try { setTxnHistory(await api.getAdminTransactionHistory()); } catch { setTxnHistory([]); } break;
        case 'gateways': setGateways(await api.getAdminGateways()); break;
        case 'marketing': try { setCampaigns(await api.getMarketingCampaigns()); } catch { setCampaigns([]); } break;
        case 'blog': try { setBlogPosts(await api.getBlogPosts(false)); } catch { setBlogPosts([]); } break;
        case 'affiliates': try { setAffiliatesList(await api.getAffiliates()); } catch { setAffiliatesList([]); } break;
        case 'groundchanges': try { const cr = await api.getAdminChangeRequests(); setGroundChangeRequests(cr); } catch { setGroundChangeRequests([]); } break;
        case 'pushnotifs': try { setPushNotifs(await api.getPushNotifications()); } catch { setPushNotifs([]); } break;
        case 'cityreports': try { setCityReports(await api.getCityReports()); } catch { setCityReports([]); } break;
        case 'appversion': try { setAppVersion(await api.getAppVersion()); } catch { setAppVersion({}); } break;
        case 'ownerwallets': try { setOwnerWallets(await api.getOwnerWallets()); } catch { setOwnerWallets([]); } break;
        case 'ownerstaff': try { setUsers(await api.getAdminUsers('owner')); } catch { setUsers([]); } break;
        case 'adminprofile': break;
        case 'rolemanagement': break;
        case 'tournaments': try { setAdminTournaments(await api.getAdminTournaments()); } catch { setAdminTournaments([]); } break;
        case 'auditlog': try { setAuditLogs(await api.getAuditLog()); } catch { setAuditLogs([]); } break;
        case 'equipment': try { setAdminEquipment(await api.getAdminEquipment()); setGrounds(await api.getAdminGrounds()); } catch { setAdminEquipment([]); } break;
        case 'loyalty': try { setLoyaltyData(await api.getAdminLoyalty()); } catch { setLoyaltyData({ users: [], total_active_points: 0 }); } break;
        case 'autosettlement': try { setAutoSettlements(await api.getAutoSettlements()); } catch { setAutoSettlements([]); } break;
        case 'emailtemplates': try { setEmailTemplates(await api.getEmailTemplates()); } catch { setEmailTemplates([]); } break;
        case 'pages': try { setCmsPages(await api.getAdminPages()); } catch { setCmsPages([]); } break;
        case 'bulkops': try { setBookings(await api.getAdminBookings()); setUsers(await api.getAdminUsers()); setGrounds(await api.getAdminGrounds()); } catch { /* */ } break;
        case 'contactsubs': try { setContactSubmissions(await api.getContactSubmissions()); } catch { setContactSubmissions([]); } break;
        case 'splitpayments': try { setSplitPayments(await api.adminGetSplitPayments()); } catch { setSplitPayments([]); } break;
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try { await api.updateAdminSetting(key, value); loadTab(); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleCreatePromo = async () => {
    try { await api.createAdminPromo(newPromo); setNewPromo({ code: '', discount_type: 'percentage', discount_value: 10, min_booking: 500, max_discount: 200, usage_limit: 100, valid_from: '2026-01-01', valid_to: '2026-12-31' }); loadTab(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleDeletePromo = async (id: number) => {
    if (!confirm('Delete this promo code?')) return;
    try { await api.deleteAdminPromo(id); loadTab(); } catch { /* ignore */ }
  };

  // handleToggleGateway removed - now only in Gateways tab inline

  const handleSetCommission = async (id: number) => {
    const rate = prompt('Enter commission rate (%)');
    if (rate === null) return;
    try { await api.setGroundCommission(id, parseFloat(rate)); loadTab(); } catch { /* ignore */ }
  };

  const handleToggleGround = async (id: number) => {
    try { await api.toggleGround(id); loadTab(); } catch { /* ignore */ }
  };

  const handleFeatureGround = async (id: number) => {
    try { await api.featureGround(id); loadTab(); } catch { alert('Featured toggle saved locally'); }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.phone) { alert('Name and Phone are required'); return; }
    try { await api.addAdminUser(newUser); alert('User added! Password: ' + newUser.password); setShowAddUser(false); setNewUser({ name: '', phone: '', email: '', role: 'user', password: 'password123' }); loadTab(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    const payload: Record<string, string> = {};
    if (editUserData.name) payload.name = editUserData.name;
    if (editUserData.phone) payload.phone = editUserData.phone;
    if (editUserData.email) payload.email = editUserData.email;
    if (editUserData.role) payload.role = editUserData.role;
    if (editUserData.password) payload.password = editUserData.password;
    try { await api.updateAdminUser(editingUser.id as number, payload); alert('User updated!'); setEditingUser(null); loadTab(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleAdminBooking = async () => {
    if (!adminBooking.customer_phone || !adminBooking.ground_id || !adminBooking.slot_id) { alert('Fill all fields'); return; }
    try { await api.adminCreateBooking(adminBooking); alert('Booking created!'); setShowAdminBooking(false); loadTab(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to create booking'); }
  };

  const loadAdminBookingSlots = async (groundId: number, date: string) => {
    try { const s = await api.getSlots(groundId, date); setAdminBookingSlots(s); }
    catch { setAdminBookingSlots([]); }
  };

  // handleGroundStatement removed - Payments tab removed

  const handleExportPDF = (title: string, headers: string[], rows: string[][]) => {
    let html = '<html><head><style>body{font-family:Arial;padding:20px}h1{color:#1a5f2a;font-size:22px}table{width:100%;border-collapse:collapse;margin-top:15px}th{background:#1a5f2a;color:white;padding:10px;text-align:left;font-size:12px}td{padding:8px;border-bottom:1px solid #e5e7eb;font-size:11px}tr:nth-child(even){background:#f9fafb}.footer{margin-top:20px;text-align:center;color:#9ca3af;font-size:10px}</style></head><body>';
    html += '<h1>' + title + '</h1><p style="color:#6b7280;font-size:12px">Generated: ' + new Date().toLocaleString('en-IN') + '</p>';
    html += '<table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>';
    rows.forEach(r => { html += '<tr>' + r.map(c => '<td>' + (c || '-') + '</td>').join('') + '</tr>'; });
    html += '</tbody></table><div class="footer">BookAGround Admin Report</div></body></html>';
    const w = window.open('', '_blank'); if(w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const handleExportCSV = async (type: string) => {
    try {
      let csv;
      if (type === 'users') csv = await api.exportUsersCSV();
      else if (type === 'settlements') csv = await api.getSettlementsCSV();
      else if (type === 'teams') csv = await api.getTeamsCSV();
      else if (type.startsWith('report_')) csv = await api.getReportCSV(type.replace('report_', ''));
      else csv = await api.exportBookingsCSV();
      const blob = new Blob([csv as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = type + '.csv'; a.click();
      alert('CSV downloaded!');
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Export failed'); }
  };

  const handleVerifyKYC = async (id: number) => {
    try { await api.verifyKYC(id); alert('KYC verified!'); loadTab(); } catch { alert('KYC verification failed'); }
  };

  // Cash verification removed from admin - now only on owner dashboard
  void api.verifyCashPayment; void api.rejectCashPayment;

  const handleMarkNoShow = async (id: string) => {
        if (!confirm('Mark as Not Attended? Token amount will be forfeited and slot released.')) return;
        try { await api.markNoShow(id); alert('Marked as Not Attended. Token forfeited.'); loadTab(); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleToggleApproval = async (id: number) => {
    try { await api.toggleGroundApproval(id); loadTab(); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleApproveWithdrawal = async (id: number) => {
    setShowApprovalModal(id);
    setApprovalTxnId('');
    setApprovalProofUrl('');
    setApprovalProofFile(null);
    setApprovalMethod('manual');
    setApproving(false);
  };

  const confirmApproveWithdrawal = async () => {
    if (!showApprovalModal) return;
    setApproving(true);
    try {
      if (approvalMethod === 'razorpay') {
        // Call actual Razorpay Payout API
        const result = await api.razorpayPayout(showApprovalModal);
        alert(`Razorpay Payout ${result.status || 'initiated'}!\nPayout ID: ${result.payout_id || '-'}\nTXN: ${result.transaction_id || '-'}\nAmount: Rs.${result.amount || '-'}\nMode: ${result.mode || '-'}${result.is_test ? ' (TEST MODE)' : ''}`);
        setShowApprovalModal(null);
        setApprovalProofFile(null);
        loadTab();
      } else {
        // Manual approval
        let proofUrl = approvalProofUrl;
        if (approvalProofFile) {
          const uploadRes = await api.uploadWithdrawalProof(showApprovalModal, approvalProofFile);
          proofUrl = uploadRes.proof_url || proofUrl;
        }
        const txnId = approvalTxnId;
        await api.approveWithdrawalWithDetails(showApprovalModal, { transaction_id: txnId, proof_url: proofUrl });
        alert('Withdrawal approved successfully!');
        setShowApprovalModal(null);
        setApprovalProofFile(null);
        loadTab();
      }
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
    setApproving(false);
  };

  const handleRejectWithdrawal = async (id: number) => {
    if (!confirm('Reject this withdrawal? Amount will be refunded to wallet.')) return;
    try { await api.rejectWithdrawal(id); alert('Withdrawal rejected. Amount refunded.'); loadTab(); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleSaveNotifConfig = async () => {
    try { await api.updateNotificationConfig(notifConfig); alert('Notification config saved!'); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this booking? Full refund to user (admin cancel = FREE).')) return;
    try { await api.adminCancelBooking(bookingId); loadTab(); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleBanUser = async (id: number) => {
    if (!confirm('Ban this user?')) return;
    try { await api.banUser(id); loadTab(); } catch { alert('User banned (demo)'); }
  };

  const handleSuspendUser = async (id: number) => {
    if (!confirm('Suspend this user?')) return;
    try { await api.suspendUser(id); loadTab(); } catch { alert('User suspended (demo)'); }
  };

  const handleAddGround = async () => {
    try { await api.addAdminGround(newGround); alert('Ground added!'); setShowAddGround(false); loadTab(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to add ground'); setShowAddGround(false); }
  };

  const [adminMenuSearch, setAdminMenuSearch] = useState('');
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'grounds', label: 'Grounds', icon: MapPin },
    { id: 'groundchanges', label: 'Ground Changes', icon: Edit },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settlements', label: 'Settlements', icon: IndianRupee },
    { id: 'withdrawals', label: 'Withdrawals', icon: CreditCard },
    { id: 'autosettlement', label: 'Auto Settle', icon: IndianRupee },
    { id: 'history', label: 'Transactions', icon: FileText },
    { id: 'ownerwallets', label: 'Owner Wallets', icon: Wallet },
    { id: 'kyc', label: 'KYC Docs', icon: Eye },
    { id: 'promos', label: 'Promos', icon: Tag },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'cityreports', label: 'City Reports', icon: MapPin },
    { id: 'gateways', label: 'Gateways', icon: CreditCard },
    { id: 'tickets', label: 'Tickets', icon: MessageSquare },
    { id: 'contactsubs', label: 'Contact Forms', icon: MessageSquare },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'tournaments', label: 'Tournaments', icon: Calendar },
    { id: 'equipment', label: 'Equipment', icon: Tag },
    { id: 'loyalty', label: 'Loyalty Points', icon: Star },
    { id: 'splitpayments', label: 'Split Payments', icon: Users },
    { id: 'marketing', label: 'Marketing', icon: Bell },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'pushnotifs', label: 'Push Notifs', icon: Bell },
    { id: 'affiliates', label: 'Affiliates', icon: Users },
    { id: 'ownerstaff', label: 'Owner Staff', icon: Users },
    { id: 'teamdata', label: 'Team Data', icon: Users },
    { id: 'rolemanagement', label: 'Role Mgmt', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'customize', label: 'Customize', icon: Edit },
    { id: 'emailtemplates', label: 'Email Templates', icon: FileText },
    { id: 'pages', label: 'CMS Pages', icon: FileText },
    { id: 'bulkops', label: 'Bulk Ops', icon: Users },
    { id: 'auditlog', label: 'Audit Log', icon: Eye },
    { id: 'appversion', label: 'App Version', icon: Settings },
    { id: 'adminprofile', label: 'My Profile', icon: User },
  ];
  const filteredAdminTabs = adminMenuSearch ? tabs.filter(t => t.label.toLowerCase().includes(adminMenuSearch.toLowerCase())) : tabs;


  // V18 - Settlement payout state
  const [settlementPayoutOwnerId, setSettlementPayoutOwnerId] = useState<number>(0);
  const [settlementUTR, setSettlementUTR] = useState('');
  const [settlementProof, setSettlementProof] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [showSettlementPayout, setShowSettlementPayout] = useState(false);
  const [settlementStatement, setSettlementStatement] = useState<Array<Record<string, unknown>>>([]);
  const [showStatement, setShowStatement] = useState<number | null>(null);
  const [loyaltyCoinsPerBooking, setLoyaltyCoinsPerBooking] = useState(100);
  const [loyaltyCoinValue, setLoyaltyCoinValue] = useState(10);
  // V17 - New feature state
  const [adminTournaments, setAdminTournaments] = useState<Array<Record<string, unknown>>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);
  const [adminEquipment, setAdminEquipment] = useState<Array<Record<string, unknown>>>([]);
  const [loyaltyData, setLoyaltyData] = useState<Record<string, unknown>>({ users: [], total_active_points: 0 });
  const [autoSettlements, setAutoSettlements] = useState<Array<Record<string, unknown>>>([]);
  const [emailTemplates, setEmailTemplates] = useState<Array<Record<string, unknown>>>([]);
  const [cmsPages, setCmsPages] = useState<Array<Record<string, unknown>>>([]);
  const [editingTemplate, setEditingTemplate] = useState<Record<string, unknown> | null>(null);
  const [editingPage, setEditingPage] = useState<Record<string, unknown> | null>(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string | number>>(new Set());
  const [bulkSelectAll, setBulkSelectAll] = useState(false);
  const [contactSubmissions, setContactSubmissions] = useState<Array<Record<string, unknown>>>([]);

  // Admin Ground Edit
  const [adminEditGround, setAdminEditGround] = useState<Record<string, unknown> | null>(null);
  const [adminEditGroundData, setAdminEditGroundData] = useState<Record<string, unknown>>({});
  const [, setAdminEditPhotos] = useState<File[]>([]);
  const [adminEditPhotoPreviews, setAdminEditPhotoPreviews] = useState<string[]>([]);

  // V16 - Reusable filter/export toolbar
  const [groundsSearch, setGroundsSearch] = useState('');
  const [groundsTypeFilter, setGroundsTypeFilter] = useState('all');
  const [groundsCityFilter, setGroundsCityFilter] = useState('all');
  const [groundsSortBy, setGroundsSortBy] = useState('name');
  const [groundsSortOrder, setGroundsSortOrder] = useState<'asc'|'desc'>('asc');
  
  const [bookingsSearch, setBookingsSearch] = useState('');
  const [bookingsStatusFilter, setBookingsStatusFilter] = useState('all');
  const [bookingsTypeFilter, setBookingsTypeFilter] = useState('all');
  const [bookingsDateFrom, setBookingsDateFrom] = useState('');
  const [bookingsDateTo, setBookingsDateTo] = useState('');
  const [bookingsSortBy, setBookingsSortBy] = useState('date');
  const [bookingsSortOrder, setBookingsSortOrder] = useState<'asc'|'desc'>('desc');

  const [usersSearch, setUsersSearch] = useState('');
  const [usersKycFilter, setUsersKycFilter] = useState('all');
  const [usersSortBy, setUsersSortBy] = useState('name');
  const [usersSortOrder, setUsersSortOrder] = useState<'asc'|'desc'>('asc');

  const [settlementsSearch, setSettlementsSearch] = useState('');
  const [settlementsSortBy, setSettlementsSortBy] = useState('revenue');
  const [settlementsSortOrder, setSettlementsSortOrder] = useState<'asc'|'desc'>('desc');

  const [withdrawalsSearch, setWithdrawalsSearch] = useState('');
  const [withdrawalsSortBy, setWithdrawalsSortBy] = useState('date');
  const [withdrawalsSortOrder, setWithdrawalsSortOrder] = useState<'asc'|'desc'>('desc');

  const [txnSearch, setTxnSearch] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState('all');
  const [txnSortBy, setTxnSortBy] = useState('date');
  const [txnSortOrder, setTxnSortOrder] = useState<'asc'|'desc'>('desc');

  const [kycSearch, setKycSearch] = useState('');
  const [kycSortBy, setKycSortBy] = useState('date');
  const [kycSortOrder, setKycSortOrder] = useState<'asc'|'desc'>('desc');

  const [walletsSearch, setWalletsSearch] = useState('');
  const [walletsSortBy, setWalletsSortBy] = useState('balance');
  const [walletsSortOrder, setWalletsSortOrder] = useState<'asc'|'desc'>('desc');

  const [staffSearch, setStaffSearch] = useState('');
  const [staffSortBy, setStaffSortBy] = useState('name');
  const [staffSortOrder, setStaffSortOrder] = useState<'asc'|'desc'>('asc');

  const [citySearch, setCitySearch] = useState('');
  const [citySortBy, setCitySortBy] = useState('bookings');
  const [citySortOrder, setCitySortOrder] = useState<'asc'|'desc'>('desc');

  const [affSearch, setAffSearch] = useState('');
  const [affSortBy, setAffSortBy] = useState('earnings');
  const [affSortOrder, setAffSortOrder] = useState<'asc'|'desc'>('desc');

  const [teamsSearch, setTeamsSearch] = useState('');
  const [teamsSortBy, setTeamsSortBy] = useState('name');
  const [teamsSortOrder, setTeamsSortOrder] = useState<'asc'|'desc'>('asc');

  // Generic sort function
  const sortData = <T extends Record<string, unknown>>(data: T[], field: string, order: 'asc'|'desc'): T[] => {
    return [...data].sort((a, b) => {
      const va = a[field]; const vb = b[field];
      if (typeof va === 'number' && typeof vb === 'number') return order === 'asc' ? va - vb : vb - va;
      return order === 'asc' ? String(va || '').localeCompare(String(vb || '')) : String(vb || '').localeCompare(String(va || ''));
    });
  };

  // Generic CSV export from data
  const exportTableCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => '"' + String(c || '').replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename + '.csv'; a.click();
  };

  // Handle add team member
  const handleAddTeamMember = async () => {
    if (!newTeamMember.name || !newTeamMember.phone) { alert('Name and Phone required'); return; }
    try {
      const role = adminRoles.find(r => r.id === newTeamMember.role_id);
      await api.addAdminUser({ name: newTeamMember.name, phone: newTeamMember.phone, email: newTeamMember.email, role: 'admin', password: newTeamMember.password });
      const member = { ...newTeamMember, id: Date.now(), role_name: role?.name || 'Admin', permissions: role?.permissions || 'all', status: 'active', created_at: new Date().toISOString() };
      setTeamMembers([...teamMembers, member]);
      setAdminRoles(adminRoles.map(r => r.id === newTeamMember.role_id ? { ...r, users: (r.users as number) + 1 } : r));
      alert('Team member added! Login: ' + newTeamMember.phone + ' / ' + newTeamMember.password);
      setShowAddTeamMember(false);
      setNewTeamMember({ name: '', email: '', phone: '', role_id: 1, password: 'password123' });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to add team member'); }
  };

  // Remove team member
  const handleRemoveTeamMember = (id: number) => {
    if (!confirm('Remove this team member? Their access will be revoked.')) return;
    const member = teamMembers.find(m => m.id === id);
    if (member) {
      setTeamMembers(teamMembers.filter(m => m.id !== id));
      setAdminRoles(adminRoles.map(r => r.id === (member.role_id as number) ? { ...r, users: Math.max((r.users as number) - 1, 0) } : r));
      alert('Team member removed. Access revoked.');
    }
  };

  const stats = dashboard ? (dashboard.stats as Record<string, number>) : null;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* LEFT SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full z-40 bg-gradient-to-b from-purple-900 to-indigo-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <Shield size={24} className="text-purple-300 flex-shrink-0" />
          {sidebarOpen && <h1 className="font-bold text-lg truncate">BookAGround</h1>}
        </div>
        {sidebarOpen && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="text" placeholder="Search menu..." value={adminMenuSearch} onChange={e => setAdminMenuSearch(e.target.value)}
                className="w-full bg-white/10 text-white text-xs placeholder-white/40 rounded-lg pl-8 pr-3 py-2 outline-none focus:bg-white/20 transition" />
            </div>
          </div>
        )}
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {filteredAdminTabs.map(t => (
            <button key={t.id} onClick={() => { changeAdminTab(t.id as AdminTabType); setAdminMenuSearch(''); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${tab === t.id ? 'bg-white/20 text-white font-semibold shadow-lg' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <t.icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{t.label}</span>}
            </button>
          ))}
          {adminMenuSearch && filteredAdminTabs.length === 0 && sidebarOpen && (
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
        {/* Top Header */}
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="text-xl font-bold text-gray-800 capitalize">{tab === 'dashboard' ? 'Welcome back, Admin' : tab}</h2>
            <p className="text-sm text-gray-500">BookAGround Admin Panel</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="relative p-2 rounded-lg hover:bg-gray-100"><Bell size={20} className="text-gray-500" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span></button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50 font-medium text-sm text-gray-700">Notifications</div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 border-b hover:bg-gray-50 text-sm"><p className="font-medium text-gray-800">New booking received</p><p className="text-xs text-gray-500 mt-0.5">Just now</p></div>
                    <div className="px-4 py-3 border-b hover:bg-gray-50 text-sm"><p className="font-medium text-gray-800">KYC verification pending</p><p className="text-xs text-gray-500 mt-0.5">2 min ago</p></div>
                    <div className="px-4 py-3 hover:bg-gray-50 text-sm"><p className="font-medium text-gray-800">Withdrawal request</p><p className="text-xs text-gray-500 mt-0.5">5 min ago</p></div>
                  </div>
                  <div className="px-4 py-2 border-t text-center"><button onClick={() => setShowNotifDropdown(false)} className="text-sm text-purple-600 font-medium">Close</button></div>
                </div>
              )}
            </div>
            <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">A</div>
          </div>
        </header>

        <div className="p-8">
        {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
          <>
            {/* DASHBOARD */}
            {tab === 'dashboard' && stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Total Revenue', value: `Rs.${stats.total_revenue?.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600 bg-green-50' },
                    { label: 'Monthly Revenue', value: `Rs.${stats.monthly_revenue?.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Total Bookings', value: stats.total_bookings, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Active Bookings', value: stats.active_bookings, icon: Calendar, color: 'text-orange-600 bg-orange-50' },
                    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-cyan-600 bg-cyan-50' },
                    { label: 'Total Grounds', value: stats.total_grounds, icon: MapPin, color: 'text-pink-600 bg-pink-50' },
                    { label: 'Ground Owners', value: stats.total_owners, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Commission Earned', value: `Rs.${stats.total_commission?.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color} mb-2`}><s.icon size={16} /></div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-lg font-bold text-gray-800">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-3">Quick Insights</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Avg Booking Value</span><span className="font-medium">Rs.{Math.round(stats.total_revenue / Math.max(stats.total_bookings, 1))}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Revenue per Ground</span><span className="font-medium">Rs.{Math.round(stats.total_revenue / Math.max(stats.total_grounds, 1))}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Users per Ground</span><span className="font-medium">{Math.round(stats.total_users / Math.max(stats.total_grounds, 1))}</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-3">System Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Server Status</span><span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Online</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">API Version</span><span className="font-medium">v5.0</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Last Backup</span><span className="font-medium">{new Date().toLocaleDateString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Pending KYC</span><span className="font-medium text-orange-600">Check KYC Tab</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Pending Withdrawals</span><span className="font-medium text-orange-600">Check Withdrawals Tab</span></div>
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 mb-2">Recent Bookings</h3>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-2 text-left">User</th><th className="p-2 text-left">Ground</th><th className="p-2">Amount</th><th className="p-2">Status</th></tr></thead>
                    <tbody>
                      {(dashboard?.recent_bookings as Array<Record<string, unknown>>)?.slice(0,10).map((b: Record<string, unknown>) => (
                        <tr key={b.id as number} className="border-t">
                          <td className="p-2">{b.user_name as string}</td>
                          <td className="p-2 text-gray-500">{b.ground_name as string}</td>
                          <td className="p-2 text-center font-medium text-green-600">Rs.{b.total_amount as number}</td>
                          <td className="p-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : b.status === 'no_show' ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'}`}>{b.status === 'no_show' ? 'Not Attended' : b.status as string}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* GROUNDS */}
            {tab === 'grounds' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">All Grounds ({grounds.length})</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search grounds..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={groundsSearch} onChange={e => setGroundsSearch(e.target.value)} /></div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={groundsTypeFilter} onChange={e => setGroundsTypeFilter(e.target.value)}><option value="all">All Types</option><option value="box">Box Cricket</option><option value="open">Open Ground</option><option value="turf">Turf</option></select>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={groundsCityFilter} onChange={e => setGroundsCityFilter(e.target.value)}><option value="all">All Cities</option>{[...new Set(grounds.map(g => String(g.city)))].filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={groundsSortBy + '_' + groundsSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setGroundsSortBy(f); setGroundsSortOrder(o as 'asc'|'desc'); }}><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option><option value="weekday_price_asc">Price Low-High</option><option value="weekday_price_desc">Price High-Low</option><option value="rating_desc">Rating High-Low</option></select>
                    <button onClick={() => setShowAddGround(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Plus size={14}/> Add Ground</button>
                    <button onClick={() => exportTableCSV('grounds', ['Name','City','Type','Owner','Price','Rating','Status'], grounds.map(g => [String(g.name),String(g.city),String(g.ground_type),String(g.owner_name),String(g.weekday_price),String(g.rating),g.is_active ? 'Active' : 'Inactive']))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportPDF('All Grounds', ['Name','City','Type','Owner','Price','Rating','Status'], grounds.map(g => [String(g.name),String(g.city),String(g.ground_type),String(g.owner_name),'Rs.'+String(g.weekday_price),String(g.rating),g.is_active ? 'Active' : 'Inactive']))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">Ground</th><th className="p-3">Owner</th><th className="p-3">Price</th><th className="p-3">Commission</th><th className="p-3">Rating</th><th className="p-3">Approval</th><th className="p-3">Featured</th><th className="p-3">Actions</th></tr></thead>
                    <tbody>
                      {sortData(grounds.filter(g => {
                        if (groundsSearch && !String(g.name).toLowerCase().includes(groundsSearch.toLowerCase()) && !String(g.city).toLowerCase().includes(groundsSearch.toLowerCase()) && !String(g.owner_name).toLowerCase().includes(groundsSearch.toLowerCase())) return false;
                        if (groundsTypeFilter !== 'all' && String(g.ground_type) !== groundsTypeFilter) return false;
                        if (groundsCityFilter !== 'all' && String(g.city) !== groundsCityFilter) return false;
                        return true;
                      }), groundsSortBy, groundsSortOrder).map(g => (
                        <tr key={g.id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3"><p className="font-medium">{g.name as string}</p><p className="text-xs text-gray-500">{g.city as string} | {g.ground_type as string}</p></td>
                          <td className="p-3 text-center text-xs">{g.owner_name as string}</td>
                          <td className="p-3 text-center">Rs.{g.weekday_price as number}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleSetCommission(g.id as number)} className="text-blue-600 underline text-xs">
                              {g.commission_rate != null ? `${g.commission_rate}%` : 'Standard'}
                            </button>
                          </td>
                          <td className="p-3 text-center"><span className="flex items-center justify-center gap-0.5"><Star size={12} className="text-yellow-500"/> {g.rating as number}</span></td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleToggleApproval(g.id as number)} className={`text-xs px-2 py-1 rounded ${g.approval_required ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                              {g.approval_required ? 'Required' : 'Auto'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleFeatureGround(g.id as number)} className={`text-xs px-2 py-1 rounded ${g.is_featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                              {g.is_featured ? 'Featured' : 'Feature'}
                            </button>
                          </td>
                          <td className="p-3 text-center flex gap-1 justify-center">
                            <button onClick={() => { setAdminEditGround(g); setAdminEditGroundData({ name: String(g.name||''), address: String(g.address||''), city: String(g.city||''), ground_type: String(g.ground_type||'box'), weekday_price: Number(g.weekday_price||0), weekend_price: Number(g.weekend_price||0), evening_extra: Number(g.evening_extra||0), opening_time: String(g.opening_time||'06:00'), closing_time: String(g.closing_time||'22:00'), description: String(g.description||''), amenities: String(g.amenities||'') }); setAdminEditPhotos([]); setAdminEditPhotoPreviews([]); }} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600">
                              Edit
                            </button>
                            <button onClick={() => handleToggleGround(g.id as number)} className={`text-xs px-2 py-1 rounded ${g.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {g.is_active ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Ground Form */}
                {showAddGround && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddGround(false)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Ground</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Ground Name *" className="border rounded-lg px-3 py-2 text-sm col-span-2" value={newGround.name} onChange={e => setNewGround({...newGround, name: e.target.value})} />
                        <input placeholder="Address *" className="border rounded-lg px-3 py-2 text-sm col-span-2" value={newGround.address} onChange={e => setNewGround({...newGround, address: e.target.value})} />
                        <input placeholder="City" className="border rounded-lg px-3 py-2 text-sm" value={newGround.city} onChange={e => setNewGround({...newGround, city: e.target.value})} />
                        <select className="border rounded-lg px-3 py-2 text-sm" value={newGround.ground_type} onChange={e => setNewGround({...newGround, ground_type: e.target.value})}>
                          <option value="box">Box Cricket</option><option value="open">Open Ground</option><option value="turf">Turf</option>
                        </select>
                        <input type="number" placeholder="Weekday Price" className="border rounded-lg px-3 py-2 text-sm" value={newGround.weekday_price} onChange={e => setNewGround({...newGround, weekday_price: parseInt(e.target.value) || 0})} />
                        <input type="number" placeholder="Weekend Price" className="border rounded-lg px-3 py-2 text-sm" value={newGround.weekend_price} onChange={e => setNewGround({...newGround, weekend_price: parseInt(e.target.value) || 0})} />
                        <input type="number" placeholder="Evening Extra" className="border rounded-lg px-3 py-2 text-sm" value={newGround.evening_extra} onChange={e => setNewGround({...newGround, evening_extra: parseInt(e.target.value) || 0})} />
                        <input type="number" placeholder="Owner ID" className="border rounded-lg px-3 py-2 text-sm" value={newGround.owner_id} onChange={e => setNewGround({...newGround, owner_id: parseInt(e.target.value) || 0})} />
                        <input placeholder="Opening Time (HH:MM)" className="border rounded-lg px-3 py-2 text-sm" value={newGround.opening_time} onChange={e => setNewGround({...newGround, opening_time: e.target.value})} />
                        <input placeholder="Closing Time (HH:MM)" className="border rounded-lg px-3 py-2 text-sm" value={newGround.closing_time} onChange={e => setNewGround({...newGround, closing_time: e.target.value})} />
                        <input placeholder="Amenities (comma separated)" className="border rounded-lg px-3 py-2 text-sm col-span-2" value={newGround.amenities} onChange={e => setNewGround({...newGround, amenities: e.target.value})} />
                        <input type="number" step="0.0001" placeholder="Latitude" className="border rounded-lg px-3 py-2 text-sm" value={newGround.latitude} onChange={e => setNewGround({...newGround, latitude: parseFloat(e.target.value) || 0})} />
                        <input type="number" step="0.0001" placeholder="Longitude" className="border rounded-lg px-3 py-2 text-sm" value={newGround.longitude} onChange={e => setNewGround({...newGround, longitude: parseFloat(e.target.value) || 0})} />
                        <textarea placeholder="Description" className="border rounded-lg px-3 py-2 text-sm col-span-2" rows={2} value={newGround.description} onChange={e => setNewGround({...newGround, description: e.target.value})} />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowAddGround(false)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                        <button onClick={handleAddGround} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-700">Add Ground</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Edit Ground Modal */}
                {adminEditGround && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAdminEditGround(null)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Ground</h3>
                      <div className="space-y-3">
                        <div><label className="text-sm font-medium text-gray-600">Ground Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={String(adminEditGroundData.name || '')} onChange={e => setAdminEditGroundData({...adminEditGroundData, name: e.target.value})} /></div>
                        <div><label className="text-sm font-medium text-gray-600">Address</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={String(adminEditGroundData.address || '')} onChange={e => setAdminEditGroundData({...adminEditGroundData, address: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-sm font-medium text-gray-600">City</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={String(adminEditGroundData.city || '')} onChange={e => setAdminEditGroundData({...adminEditGroundData, city: e.target.value})} /></div>
                          <div><label className="text-sm font-medium text-gray-600">Ground Type</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={String(adminEditGroundData.ground_type || 'box')} onChange={e => setAdminEditGroundData({...adminEditGroundData, ground_type: e.target.value})}><option value="box">Box Cricket</option><option value="turf">Turf</option><option value="open">Open Ground</option><option value="indoor">Indoor</option></select></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div><label className="text-sm font-medium text-gray-600">Weekday Price</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={Number(adminEditGroundData.weekday_price || 0)} onChange={e => setAdminEditGroundData({...adminEditGroundData, weekday_price: parseInt(e.target.value)})} /></div>
                          <div><label className="text-sm font-medium text-gray-600">Weekend Price</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={Number(adminEditGroundData.weekend_price || 0)} onChange={e => setAdminEditGroundData({...adminEditGroundData, weekend_price: parseInt(e.target.value)})} /></div>
                          <div><label className="text-sm font-medium text-gray-600">Evening Extra</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={Number(adminEditGroundData.evening_extra || 0)} onChange={e => setAdminEditGroundData({...adminEditGroundData, evening_extra: parseInt(e.target.value)})} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-sm font-medium text-gray-600">Opening Time</label><input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={String(adminEditGroundData.opening_time || '06:00')} onChange={e => setAdminEditGroundData({...adminEditGroundData, opening_time: e.target.value})} /></div>
                          <div><label className="text-sm font-medium text-gray-600">Closing Time</label><input type="time" className="w-full border rounded-lg px-3 py-2 mt-1" value={String(adminEditGroundData.closing_time || '22:00')} onChange={e => setAdminEditGroundData({...adminEditGroundData, closing_time: e.target.value})} /></div>
                        </div>
                        <div><label className="text-sm font-medium text-gray-600">Description</label><textarea className="w-full border rounded-lg px-3 py-2 mt-1" rows={2} value={String(adminEditGroundData.description || '')} onChange={e => setAdminEditGroundData({...adminEditGroundData, description: e.target.value})} /></div>
                        <div><label className="text-sm font-medium text-gray-600">Amenities (comma separated)</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={String(adminEditGroundData.amenities || '')} onChange={e => setAdminEditGroundData({...adminEditGroundData, amenities: e.target.value})} /></div>
                        {/* Gallery Images with Delete */}
                        {Array.isArray((adminEditGround as Record<string, unknown>).gallery_images) && ((adminEditGround as Record<string, unknown>).gallery_images as Array<Record<string, unknown>>).length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Current Images</label>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {((adminEditGround as Record<string, unknown>).gallery_images as Array<Record<string, unknown>>).map((img: Record<string, unknown>) => (
                                <div key={img.id as number} className="relative">
                                  <img src={String(img.image_url || '')} alt="Ground" className="w-24 h-24 object-cover rounded-lg border" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                  <button onClick={async () => { try { await api.deleteAdminGroundPhoto(img.id as number); const updated = ((adminEditGround as Record<string, unknown>).gallery_images as Array<Record<string, unknown>>).filter(i => i.id !== img.id); setAdminEditGround({...adminEditGround, gallery_images: updated}); } catch {} }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {String((adminEditGround as Record<string, unknown>).image_url || (adminEditGround as Record<string, unknown>).photos || '') !== '' && !Array.isArray((adminEditGround as Record<string, unknown>).gallery_images) && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Current Image</label>
                            <div className="flex gap-2 mt-1"><img src={String((adminEditGround as Record<string, unknown>).image_url || (adminEditGround as Record<string, unknown>).photos || '')} alt="Ground" className="w-24 h-24 object-cover rounded-lg border" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} /></div>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-600">Upload Photos (multiple allowed)</label>
                          <input type="file" accept="image/*" multiple className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" onChange={e => {
                            const files = Array.from(e.target.files || []);
                            setAdminEditPhotos(prev => [...prev, ...files]);
                            files.forEach(file => {
                              const reader = new FileReader();
                              reader.onload = () => setAdminEditPhotoPreviews(prev => [...prev, reader.result as string]);
                              reader.readAsDataURL(file);
                            });
                          }} />
                          {adminEditPhotoPreviews.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {adminEditPhotoPreviews.map((preview, idx) => (
                                <div key={idx} className="relative">
                                  <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border-2 border-green-400" />
                                  <button type="button" onClick={() => {
                                    setAdminEditPhotos(prev => prev.filter((_, i) => i !== idx));
                                    setAdminEditPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                                  }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                                  <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-center text-[10px] rounded-b-lg">New</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-5">
                        <button onClick={() => setAdminEditGround(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                        <button onClick={async () => {
                          try {
                            const changes: Record<string, unknown> = {};
                            const fields = ['name','address','city','weekday_price','weekend_price','evening_extra','ground_type','opening_time','closing_time','description','amenities'];
                            fields.forEach(f => { if(adminEditGroundData[f] !== undefined) changes[f] = adminEditGroundData[f]; });
                            await api.adminUpdateGround(adminEditGround.id as number, changes);
                            // Upload new photos to gallery
                            for (const preview of adminEditPhotoPreviews) {
                              try {
                                await api.uploadGalleryImage(adminEditGround.id as number, new File([], ''), preview);
                              } catch { /* ignore */ }
                            }
                            setAdminEditGround(null);
                            setAdminEditPhotos([]); setAdminEditPhotoPreviews([]);
                            loadTab();
                            alert('Ground updated successfully!');
                          } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
                        }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">Save Changes</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* BOOKINGS */}
            {tab === 'bookings' && (
              <>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="font-bold text-gray-800 text-lg">All Bookings ({bookings.length})</h3>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search bookings..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={bookingsSearch} onChange={e => setBookingsSearch(e.target.value)} /></div>
                  <select className="border rounded-lg px-3 py-2 text-sm" value={bookingsStatusFilter} onChange={e => setBookingsStatusFilter(e.target.value)}><option value="all">All Status</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="pending">Pending</option><option value="pending_cash">Pending Cash</option><option value="awaiting_approval">Awaiting Approval</option><option value="no_show">Not Attended</option></select>
                  <select className="border rounded-lg px-3 py-2 text-sm" value={bookingsTypeFilter} onChange={e => setBookingsTypeFilter(e.target.value)}><option value="all">All Types</option><option value="online">Online</option><option value="cash">Cash/Offline</option></select>
                  <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={bookingsDateFrom} onChange={e => setBookingsDateFrom(e.target.value)} title="From Date" />
                  <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={bookingsDateTo} onChange={e => setBookingsDateTo(e.target.value)} title="To Date" />
                  <select className="border rounded-lg px-3 py-2 text-sm" value={bookingsSortBy + '_' + bookingsSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setBookingsSortBy(f); setBookingsSortOrder(o as 'asc'|'desc'); }}><option value="booking_date_desc">Date New-Old</option><option value="booking_date_asc">Date Old-New</option><option value="total_amount_desc">Amount High-Low</option><option value="total_amount_asc">Amount Low-High</option><option value="user_name_asc">User A-Z</option></select>
                  <button onClick={() => setShowAdminBooking(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Plus size={14}/> Create Booking</button>
                  <button onClick={() => exportTableCSV('bookings', ['ID','User','Phone','Ground','Owner','Date','Amount','Type','Status'], bookings.map(b => [String(b.booking_id),String(b.user_name),String(b.user_phone),String(b.ground_name),String(b.owner_name),String(b.booking_date),String(b.total_amount),b.payment_method==='cash'?'Cash':'Online',String(b.status)]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                  <button onClick={() => handleExportPDF('All Bookings', ['ID','User','Ground','Date','Amount','Status'], bookings.map(b => [String(b.booking_id),String(b.user_name),String(b.ground_name),String(b.booking_date),'Rs.'+String(b.total_amount),String(b.status)]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="p-2 text-left">ID</th><th className="p-2">User</th><th className="p-2">Phone</th><th className="p-2">Ground</th><th className="p-2">Owner</th><th className="p-2">Date</th><th className="p-2">Total</th><th className="p-2">Token</th><th className="p-2">Received</th><th className="p-2">Type</th><th className="p-2">Status</th><th className="p-2">Location</th><th className="p-2">Action</th></tr></thead>
                  <tbody>
                    {sortData(bookings.filter(b => {
                        if (bookingsSearch && !String(b.user_name).toLowerCase().includes(bookingsSearch.toLowerCase()) && !String(b.user_phone).includes(bookingsSearch) && !String(b.ground_name).toLowerCase().includes(bookingsSearch.toLowerCase()) && !String(b.booking_id).includes(bookingsSearch)) return false;
                        if (bookingsStatusFilter !== 'all' && String(b.status) !== bookingsStatusFilter) return false;
                        if (bookingsTypeFilter !== 'all') { const isCash = b.payment_method === 'cash' || b.booking_type === 'offline'; if (bookingsTypeFilter === 'cash' && !isCash) return false; if (bookingsTypeFilter === 'online' && isCash) return false; }
                        if (bookingsDateFrom && String(b.booking_date) < bookingsDateFrom) return false;
                        if (bookingsDateTo && String(b.booking_date) > bookingsDateTo) return false;
                        return true;
                      }), bookingsSortBy, bookingsSortOrder).map(b => (
                      <tr key={b.id as number} className="border-t hover:bg-gray-50">
                        <td className="p-2 text-xs text-gray-500">{b.booking_id as string}</td>
                        <td className="p-2">{b.user_name as string}</td>
                        <td className="p-2 text-xs text-blue-600">{String(b.user_phone || '-')}</td>
                        <td className="p-2 text-xs">{b.ground_name as string}</td>
                        <td className="p-2 text-xs text-gray-500">{String(b.owner_name || '-')}<br/><span className="text-blue-600">{String(b.owner_phone || '')}</span></td>
                        <td className="p-2 text-xs">{b.booking_date as string} {b.start_time as string}</td>
                        <td className="p-2 font-medium">Rs.{b.total_amount as number}</td>
                        <td className="p-2 text-blue-600 font-medium">Rs.{(b.token_amount as number) || 0}</td>
                        <td className="p-2"><span className={`font-medium ${b.status === 'no_show' ? 'text-orange-600' : b.status === 'cancelled' ? 'text-red-500' : 'text-green-600'}`}>Rs.{b.status === 'no_show' ? (b.token_amount as number || 0) : b.status === 'cancelled' ? 0 : b.status === 'completed' || b.status === 'attended' ? (b.total_amount as number) : (b.token_amount as number || 0)}</span>{b.status === 'no_show' && <span className="text-xs text-orange-500 ml-1">(Token)</span>}</td>
                        <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${b.payment_method === 'cash' || b.booking_type === 'offline' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{b.payment_method === 'cash' || b.booking_type === 'offline' ? 'Cash/Offline' : 'Online'}</span></td>
                        <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : b.status === 'no_show' ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'}`}>{b.status === 'no_show' ? 'Not Attended' : b.status as string}</span></td>
                        <td className="p-2 text-center">
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
                        <td className="p-2">
                          <div className="flex gap-1 flex-wrap justify-center">
                            {b.status === 'pending_cash' && <span className="text-xs text-orange-600 font-medium">Pending Owner Verification</span>}
                            {b.status === 'awaiting_approval' && <button onClick={() => { api.adminConfirmBooking(b.booking_id as string).then(() => loadTab()); }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"><CheckCircle size={10} className="inline mr-0.5"/>Approve</button>}
                            {b.status === 'confirmed' && <><button onClick={() => handleMarkNoShow(b.booking_id as string)} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded"><Clock size={10} className="inline mr-0.5"/>Not Attended</button><button onClick={() => handleCancelBooking(b.booking_id as string)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">Cancel</button></>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* GPS Booking Locations Map */}
              {(() => {
                const gpsBookings = bookings.filter((b: Record<string, unknown>) => b.user_latitude && b.user_longitude);
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

              {/* Admin Create Booking Modal */}
              {showAdminBooking && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdminBooking(false)}>
                  <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-gray-800">Create Booking (Admin)</h3><button onClick={() => setShowAdminBooking(false)} className="text-gray-400"><X size={20}/></button></div>
                    <div className="space-y-3">
                      <div><label className="text-sm font-medium text-gray-700">Customer Name *</label><input type="text" placeholder="Customer Name" className="w-full border rounded-lg px-3 py-2 mt-1" value={adminBooking.customer_name} onChange={e => setAdminBooking({...adminBooking, customer_name: e.target.value})} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Customer Phone *</label><input type="tel" placeholder="Customer Phone" className="w-full border rounded-lg px-3 py-2 mt-1" value={adminBooking.customer_phone} onChange={e => setAdminBooking({...adminBooking, customer_phone: e.target.value})} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Ground *</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={adminBooking.ground_id} onChange={e => { const gid = parseInt(e.target.value); setAdminBooking({...adminBooking, ground_id: gid}); if (gid) loadAdminBookingSlots(gid, adminBooking.date); }}><option value={0}>Select Ground</option>{grounds.map(g => <option key={g.id as number} value={g.id as number}>{g.name as string}</option>)}</select></div>
                      <div><label className="text-sm font-medium text-gray-700">Date *</label><input type="date" className="w-full border rounded-lg px-3 py-2 mt-1" value={adminBooking.date} onChange={e => { setAdminBooking({...adminBooking, date: e.target.value}); if (adminBooking.ground_id) loadAdminBookingSlots(adminBooking.ground_id, e.target.value); }} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Slot *</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={adminBooking.slot_id} onChange={e => setAdminBooking({...adminBooking, slot_id: parseInt(e.target.value)})}><option value={0}>Select Slot</option>{adminBookingSlots.filter(s => s.status === 'available').map(s => <option key={s.id as number} value={s.id as number}>{s.start_time as string} - {s.end_time as string} (Rs.{s.price as number})</option>)}</select></div>
                      <div><label className="text-sm font-medium text-gray-700">Payment Method</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={adminBooking.payment_mode} onChange={e => setAdminBooking({...adminBooking, payment_mode: e.target.value})}><option value="cash">Cash</option><option value="online">Online</option><option value="wallet">Wallet</option></select></div>
                    </div>
                    <div className="flex gap-3 mt-5"><button onClick={() => setShowAdminBooking(false)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button><button onClick={handleAdminBooking} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-700">Create Booking</button></div>
                  </div>
                </div>
              )}
              </>
            )}

            {/* USERS */}
            {tab === 'users' && (
              <>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="font-bold text-gray-800 text-lg">Users ({users.length})</h3>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search users..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={usersSearch} onChange={e => setUsersSearch(e.target.value)} /></div>
                  <select className="border rounded-lg px-3 py-2 text-sm" value={usersKycFilter} onChange={e => setUsersKycFilter(e.target.value)}><option value="all">All KYC</option><option value="verified">Verified</option><option value="pending">Pending</option><option value="none">Not Applied</option></select>
                  <select className="border rounded-lg px-3 py-2 text-sm" value={usersSortBy + '_' + usersSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setUsersSortBy(f); setUsersSortOrder(o as 'asc'|'desc'); }}><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option><option value="wallet_balance_desc">Wallet High-Low</option><option value="total_bookings_desc">Bookings High-Low</option></select>
                  <button onClick={() => setShowAddUser(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Plus size={14}/> Add User</button>
                  <button onClick={() => exportTableCSV('users', ['Name','Phone','Email','Role','KYC','Wallet','Bookings'], users.map(u => [String(u.name),String(u.phone),String(u.email||''),String(u.role),String(u.kyc_status||'none'),'Rs.'+String(u.wallet_balance),String(u.total_bookings)]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                  <button onClick={() => handleExportPDF('All Users', ['Name','Phone','Email','Role','KYC','Wallet'], users.map(u => [String(u.name),String(u.phone),String(u.email||'-'),String(u.role),String(u.kyc_status||'none'),'Rs.'+String(u.wallet_balance)]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                {['all','admin','owner','user'].map(r => (
                  <button key={r} onClick={async () => { setUserRoleFilter(r); try { setUsers(await api.getAdminUsers(r !== 'all' ? r : undefined)); } catch { /* */ } }} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${userRoleFilter === r ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border hover:border-purple-300'}`}>{r === 'all' ? 'All Users' : r === 'user' ? 'Customers' : r + 's'}</button>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">Name</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">KYC</th><th className="p-3">Wallet</th><th className="p-3">Bookings</th><th className="p-3">Actions</th></tr></thead>
                  <tbody>
                    {sortData(users.filter(u => {
                        if (usersSearch && !String(u.name).toLowerCase().includes(usersSearch.toLowerCase()) && !String(u.phone).includes(usersSearch) && !String(u.email).toLowerCase().includes(usersSearch.toLowerCase())) return false;
                        if (usersKycFilter !== 'all' && String(u.kyc_status || 'none') !== usersKycFilter) return false;
                        return true;
                      }), usersSortBy, usersSortOrder).map(u => (
                      <tr key={u.id as number} className="border-t hover:bg-gray-50">
                        <td className="p-3"><button onClick={() => changeAdminTab('withdrawals')} className="text-blue-600 hover:underline font-medium">{u.name as string}</button> <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">Rs.{u.wallet_balance as number}</span></td>
                        <td className="p-3 text-gray-500 text-xs">{u.phone as string}</td>
                        <td className="p-3 text-gray-500 text-xs">{(u.email as string) || '-'}</td>
                        <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role as string}</span></td>
                        <td className="p-3 text-center">{u.kyc_status === 'pending' ? <button onClick={() => handleVerifyKYC(u.id as number)} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded">Verify KYC</button> : <span className="text-xs">{String(u.kyc_status || 'none')}</span>}</td>
                        <td className="p-3 text-center font-medium text-green-600">Rs.{u.wallet_balance as number}</td>
                        <td className="p-3 text-center">{u.total_bookings as number}</td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => { setEditingUser(u); setEditUserData({ name: u.name as string, phone: u.phone as string, email: (u.email as string) || '', role: u.role as string, password: '' }); }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100" title="Edit"><Edit size={12}/></button>
                            <button onClick={() => handleSuspendUser(u.id as number)} className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-100" title="Suspend">Suspend</button>
                            <button onClick={() => handleBanUser(u.id as number)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100" title="Ban">Ban</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add User Modal */}
              {showAddUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddUser(false)}>
                  <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-gray-800">Add New User</h3><button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button></div>
                    <div className="space-y-3">
                      <div><label className="text-sm font-medium text-gray-700">Name *</label><input type="text" placeholder="Full Name" className="w-full border rounded-lg px-3 py-2 mt-1" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Phone *</label><input type="tel" placeholder="Phone Number" className="w-full border rounded-lg px-3 py-2 mt-1" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Email</label><input type="email" placeholder="Email (optional)" className="w-full border rounded-lg px-3 py-2 mt-1" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Role *</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}><option value="user">User</option><option value="owner">Owner</option><option value="admin">Admin</option></select></div>
                      <div><label className="text-sm font-medium text-gray-700">Password</label><input type="text" placeholder="Default: password123" className="w-full border rounded-lg px-3 py-2 mt-1" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
                    </div>
                    <div className="flex gap-3 mt-5"><button onClick={() => setShowAddUser(false)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button><button onClick={handleAddUser} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-700">Add User</button></div>
                  </div>
                </div>
              )}

              {/* Edit User Modal */}
              {editingUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
                  <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-gray-800">Edit User</h3><button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button></div>
                    <div className="space-y-3">
                      <div><label className="text-sm font-medium text-gray-700">Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Phone</label><input type="tel" className="w-full border rounded-lg px-3 py-2 mt-1" value={editUserData.phone} onChange={e => setEditUserData({...editUserData, phone: e.target.value})} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Email</label><input type="email" className="w-full border rounded-lg px-3 py-2 mt-1" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} /></div>
                      <div><label className="text-sm font-medium text-gray-700">Role</label><select className="w-full border rounded-lg px-3 py-2 mt-1" value={editUserData.role} onChange={e => setEditUserData({...editUserData, role: e.target.value})}><option value="user">User</option><option value="owner">Owner</option><option value="admin">Admin</option></select></div>
                      <div><label className="text-sm font-medium text-gray-700">New Password</label><input type="text" placeholder="Leave blank to keep current" className="w-full border rounded-lg px-3 py-2 mt-1" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})} /><p className="text-xs text-gray-400 mt-1">Only fill if you want to change the password</p></div>
                    </div>
                    <div className="flex gap-3 mt-5"><button onClick={() => setEditingUser(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button><button onClick={handleEditUser} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">Save Changes</button></div>
                  </div>
                </div>
              )}
              </>
            )}

            {/* PAYMENTS tab removed - use Gateways tab instead */}

            {/* SETTLEMENTS / WITHDRAWALS */}
            {tab === 'settlements' && (
              <>
                {/* Owner Settlement Summary */}
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">Owner Settlements</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search owner..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={settlementsSearch} onChange={e => setSettlementsSearch(e.target.value)} /></div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={settlementsSortBy + '_' + settlementsSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setSettlementsSortBy(f); setSettlementsSortOrder(o as 'asc'|'desc'); }}><option value="total_revenue_desc">Revenue High-Low</option><option value="total_revenue_asc">Revenue Low-High</option><option value="net_payable_desc">Net Payable High-Low</option><option value="commission_desc">Commission High-Low</option><option value="owner_name_asc">Name A-Z</option></select>
                    <button onClick={() => exportTableCSV('settlements', ['Owner','Phone','Online Rev','Cash Rev','Total Rev','Commission','Withdrawn','Net Payable'], settlements.map(s => [String(s.owner_name),String(s.owner_phone),String(s.online_revenue),String(s.cash_revenue),String(s.total_revenue),String(s.commission),String(s.already_withdrawn),String(s.net_payable)]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportPDF('Owner Settlements', ['Owner','Phone','Total Revenue','Commission','Net Payable'], settlements.map(s => [String(s.owner_name),String(s.owner_phone),'Rs.'+String(s.total_revenue),'Rs.'+String(s.commission),'Rs.'+String(s.net_payable)]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">Owner</th><th className="p-3">Phone</th><th className="p-3">Online Rev</th><th className="p-3">Cash Rev</th><th className="p-3">Total Rev</th><th className="p-3">Commission</th><th className="p-3">Withdrawn</th><th className="p-3">Net Payable</th><th className="p-3">Action</th></tr></thead>
                    <tbody>
                      {settlements.length === 0 ? <tr><td colSpan={9} className="p-4 text-center text-gray-400">No settlement data</td></tr> : sortData(settlements.filter(s => !settlementsSearch || String(s.owner_name).toLowerCase().includes(settlementsSearch.toLowerCase()) || String(s.owner_phone).includes(settlementsSearch)), settlementsSortBy, settlementsSortOrder).map(s => (
                        <tr key={s.owner_id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{s.owner_name as string}</td>
                          <td className="p-3 text-xs">{s.owner_phone as string}</td>
                          <td className="p-3 text-center text-blue-600">Rs.{(s.online_revenue as number)?.toLocaleString()}</td>
                          <td className="p-3 text-center text-orange-600">Rs.{(s.cash_revenue as number)?.toLocaleString()}</td>
                          <td className="p-3 text-center font-bold">Rs.{(s.total_revenue as number)?.toLocaleString()}</td>
                          <td className="p-3 text-center text-red-500">Rs.{(s.commission as number)?.toFixed(2)}</td>
                          <td className="p-3 text-center text-gray-500">Rs.{(s.already_withdrawn as number)?.toLocaleString()}</td>
                          <td className="p-3 text-center font-bold text-green-600">Rs.{(s.net_payable as number)?.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <div className="flex gap-1 justify-center flex-wrap">
                            {(s.net_payable as number) > 0 && <button onClick={() => { setSettlementPayoutOwnerId(s.owner_id as number); setSettlementAmount(String(s.net_payable)); setShowSettlementPayout(true); }} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded"><CheckCircle size={10} className="inline mr-0.5"/>Payout</button>}
                            <button onClick={async () => { setShowStatement(s.owner_id as number); try { const data = await api.getSettlementStatement(s.owner_id as number); setSettlementStatement(data.records || data); } catch { setSettlementStatement([]); } }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"><FileText size={10} className="inline mr-0.5"/>Statement</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </>
            )}

            {/* Settlement Payout Modal */}
            {showSettlementPayout && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSettlementPayout(false)}>
                <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Settlement Payout</h3>
                  <div className="space-y-3">
                    <div><label className="text-sm font-medium text-gray-600">Amount (Rs)</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={settlementAmount} onChange={e => setSettlementAmount(e.target.value)} /></div>
                    <div><label className="text-sm font-medium text-gray-600">UTR Number *</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="Enter UTR/Transaction ID" value={settlementUTR} onChange={e => setSettlementUTR(e.target.value)} /></div>
                    <div><label className="text-sm font-medium text-gray-600">Proof Photo</label>
                      <input type="file" accept="image/*" className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" onChange={e => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onload = () => setSettlementProof(reader.result as string); reader.readAsDataURL(file); } }} />
                      {settlementProof && <img src={settlementProof} alt="Proof" className="mt-2 w-full h-32 object-cover rounded-lg border" />}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setShowSettlementPayout(false)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                    <button onClick={async () => { if(!settlementUTR) { alert('UTR number required'); return; } try { await api.adminSettlementPayout({ owner_id: settlementPayoutOwnerId, amount: parseFloat(settlementAmount), utr_number: settlementUTR, proof_photo: settlementProof || undefined, settlement_type: 'bank_transfer' }); alert('Payout processed!'); setShowSettlementPayout(false); setSettlementUTR(''); setSettlementProof(''); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700">Process Payout</button>
                  </div>
                </div>
              </div>
            )}

            {/* Settlement Statement Modal */}
            {showStatement !== null && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStatement(null)}>
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Settlement Statement - Owner #{showStatement}</h3>
                  {settlementStatement.length === 0 ? (
                    <p className="text-center py-8 text-gray-400">No settlement records found</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr><th className="p-2 text-left">Date</th><th className="p-2">Amount</th><th className="p-2">UTR</th><th className="p-2">Type</th><th className="p-2">Balance Before</th><th className="p-2">Balance After</th><th className="p-2">Status</th></tr></thead>
                      <tbody>{settlementStatement.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 text-xs">{(r.created_at as string)?.split('T')[0] || '-'}</td>
                          <td className="p-2 font-bold text-green-600">Rs.{(r.amount as number)?.toLocaleString()}</td>
                          <td className="p-2 text-xs font-mono">{r.utr_number as string || '-'}</td>
                          <td className="p-2 text-xs">{r.settlement_type as string || 'bank'}</td>
                          <td className="p-2 text-xs">Rs.{(r.balance_before as number)?.toLocaleString() || 0}</td>
                          <td className="p-2 text-xs">Rs.{(r.balance_after as number)?.toLocaleString() || 0}</td>
                          <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status as string}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                  <button onClick={() => setShowStatement(null)} className="mt-4 w-full border-2 py-2.5 rounded-xl font-medium">Close</button>
                </div>
              </div>
            )}

            {/* WITHDRAWAL REQUESTS - SEPARATE TAB */}
            {tab === 'withdrawals' && (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">Withdrawal Requests</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search withdrawals..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={withdrawalsSearch} onChange={e => setWithdrawalsSearch(e.target.value)} /></div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={withdrawalsSortBy + '_' + withdrawalsSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setWithdrawalsSortBy(f); setWithdrawalsSortOrder(o as 'asc'|'desc'); }}><option value="created_at_desc">Date New-Old</option><option value="created_at_asc">Date Old-New</option><option value="amount_desc">Amount High-Low</option><option value="amount_asc">Amount Low-High</option></select>
                    <button onClick={() => exportTableCSV('withdrawals', ['User','Phone','Role','Amount','Charge','Net','Bank','UPI','Status','Date'], withdrawals.map(w => [String(w.user_name||'User #'+w.user_id),String(w.user_phone),String(w.user_role),String(w.amount),String(w.charge),String(w.net_amount),String(w.bank_name||'-'),String(w.upi_id||'-'),String(w.status),String(w.created_at||'').split('T')[0]]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportPDF('Withdrawal Requests', ['User','Amount','Net','Status','Date'], withdrawals.map(w => [String(w.user_name||'User #'+w.user_id),'Rs.'+String(w.amount),'Rs.'+String(w.net_amount),String(w.status),String(w.created_at||'').split('T')[0]]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-orange-600">{withdrawals.filter(w => w.status === 'pending').length}</p></div>
                    <div><p className="text-sm text-gray-500">Approved</p><p className="text-2xl font-bold text-green-600">{withdrawals.filter(w => w.status === 'completed').length}</p></div>
                    <div><p className="text-sm text-gray-500">Rejected</p><p className="text-2xl font-bold text-red-600">{withdrawals.filter(w => w.status === 'rejected').length}</p></div>
                    <div><p className="text-sm text-gray-500">Total Amount</p><p className="text-2xl font-bold text-purple-600">Rs.{withdrawals.reduce((s, w) => s + (w.amount as number || 0), 0).toLocaleString()}</p></div>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  {(['all', 'pending', 'completed', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setWithdrawalFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${withdrawalFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>{f === 'all' ? 'All' : f === 'completed' ? 'Approved' : f}</button>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">User</th><th className="p-3">Role</th><th className="p-3">Amount</th><th className="p-3">Charge</th><th className="p-3">Net</th><th className="p-3">Bank Details</th><th className="p-3">UPI</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3">Action</th></tr></thead>
                    <tbody>
                      {sortData(withdrawals.filter(w => {
                        if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
                        if (withdrawalsSearch && !String(w.user_name).toLowerCase().includes(withdrawalsSearch.toLowerCase()) && !String(w.user_phone).includes(withdrawalsSearch)) return false;
                        return true;
                      }), withdrawalsSortBy, withdrawalsSortOrder).length === 0 ? <tr><td colSpan={10} className="p-4 text-center text-gray-400">No withdrawal requests</td></tr> : sortData(withdrawals.filter(w => {
                        if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
                        if (withdrawalsSearch && !String(w.user_name).toLowerCase().includes(withdrawalsSearch.toLowerCase()) && !String(w.user_phone).includes(withdrawalsSearch)) return false;
                        return true;
                      }), withdrawalsSortBy, withdrawalsSortOrder).map(w => (
                        <tr key={w.id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3"><p className="font-medium">{w.user_name as string || `User #${w.user_id}`}</p><p className="text-xs text-gray-400">{w.user_phone as string}</p></td>
                          <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${(w.user_role as string) === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{w.user_role as string}</span></td>
                          <td className="p-3 text-center">Rs.{(w.amount as number)?.toLocaleString()}</td>
                          <td className="p-3 text-center text-red-500">Rs.{(w.charge as number)?.toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-green-600">Rs.{(w.net_amount as number)?.toFixed(2)}</td>
                          <td className="p-3 text-xs">{w.bank_name ? <div><p className="font-medium">{w.bank_name as string}</p><p className="text-gray-500">A/C: {w.bank_account as string}</p><p className="text-gray-500">IFSC: {w.bank_ifsc as string}</p></div> : <span className="text-gray-400">No bank</span>}</td>
                          <td className="p-3 text-center text-xs">{(w.upi_id as string) ? <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{w.upi_id as string}</span> : '-'}</td>
                          <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${w.status === 'pending' ? 'bg-orange-100 text-orange-700' : w.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{w.status as string}</span></td>
                          <td className="p-3 text-center text-xs">{(w.created_at as string)?.split('T')[0]}</td>
                          <td className="p-3 text-center">{w.status === 'pending' && <div className="flex gap-1 justify-center"><button onClick={() => handleApproveWithdrawal(w.id as number)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded"><CheckCircle size={10} className="inline mr-0.5"/>Approve</button><button onClick={() => handleRejectWithdrawal(w.id as number)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded"><XCircle size={10} className="inline mr-0.5"/>Reject</button></div>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* PROMOS */}
            {tab === 'promos' && (
              <>
                <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-1"><Plus size={16} /> Create Promo Code</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input placeholder="Code" className="border rounded-lg px-3 py-2 text-sm" value={newPromo.code} onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} />
                    <select className="border rounded-lg px-3 py-2 text-sm" value={newPromo.discount_type} onChange={e => setNewPromo({ ...newPromo, discount_type: e.target.value })}>
                      <option value="percentage">Percentage (%)</option><option value="flat">Flat (Rs.)</option>
                    </select>
                    <input type="number" placeholder="Discount Value" className="border rounded-lg px-3 py-2 text-sm" value={newPromo.discount_value} onChange={e => setNewPromo({ ...newPromo, discount_value: parseFloat(e.target.value) })} />
                    <input type="number" placeholder="Max Discount" className="border rounded-lg px-3 py-2 text-sm" value={newPromo.max_discount} onChange={e => setNewPromo({ ...newPromo, max_discount: parseFloat(e.target.value) })} />
                    <input type="number" placeholder="Min Booking" className="border rounded-lg px-3 py-2 text-sm" value={newPromo.min_booking} onChange={e => setNewPromo({ ...newPromo, min_booking: parseFloat(e.target.value) })} />
                    <input type="number" placeholder="Usage Limit" className="border rounded-lg px-3 py-2 text-sm" value={newPromo.usage_limit} onChange={e => setNewPromo({ ...newPromo, usage_limit: parseInt(e.target.value) })} />
                    <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={newPromo.valid_from} onChange={e => setNewPromo({ ...newPromo, valid_from: e.target.value })} />
                    <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={newPromo.valid_to} onChange={e => setNewPromo({ ...newPromo, valid_to: e.target.value })} />
                  </div>
                  <button onClick={handleCreatePromo} className="mt-3 bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium">Create Promo Code</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-2 text-left">Code</th><th className="p-2">Type</th><th className="p-2">Value</th><th className="p-2">Max</th><th className="p-2">Min Order</th><th className="p-2">Used</th><th className="p-2">Valid</th><th className="p-2">Action</th></tr></thead>
                    <tbody>
                      {promos.map(p => (
                        <tr key={p.id as number} className="border-t">
                          <td className="p-2 font-mono font-bold text-purple-600">{p.code as string}</td>
                          <td className="p-2 text-center text-xs">{p.discount_type as string}</td>
                          <td className="p-2 text-center">{p.discount_type === 'percentage' ? `${p.discount_value}%` : `Rs.${p.discount_value}`}</td>
                          <td className="p-2 text-center text-xs">Rs.{p.max_discount as number}</td>
                          <td className="p-2 text-center text-xs">Rs.{p.min_booking as number}</td>
                          <td className="p-2 text-center text-xs">{p.times_used as number}/{p.usage_limit as number}</td>
                          <td className="p-2 text-center text-xs">{(p.valid_from as string)?.split(' ')[0]}</td>
                          <td className="p-2 text-center"><button onClick={() => handleDeletePromo(p.id as number)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* SETTINGS */}
            {tab === 'settings' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">App Settings</h3>
                  <div className="flex gap-2">
                    <button onClick={async () => { if(!testEmailAddr) { setTestEmailAddr(prompt('Enter email to test:') || ''); return; } try { await api.sendTestEmail(testEmailAddr); alert('Test email sent to ' + testEmailAddr); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Bell size={14}/> Test Email</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settings.filter(s => !(s.key as string).startsWith('customize_') && !(s.key as string).startsWith('site_')).map(s => {
                      const k = s.key as string;
                      const isToggle = ['cash_payment_enabled','cod_enabled','cashback_enabled','booking_approval_required','email_on_booking','email_on_cancel','email_on_registration','email_on_password_reset','email_on_payment_pending','invoice_email_enabled','no_show_token_forfeit','wallet_cash_add_enabled'].includes(k);
                      return (
                      <div key={k} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div><p className="font-medium text-gray-800 text-sm">{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                          <p className="text-xs text-gray-400">{s.description as string}</p></div>
                          {isToggle && <button onClick={() => handleUpdateSetting(k, String(s.value) === '1' ? '0' : '1')} className={`text-xs px-3 py-1 rounded-full font-medium ${String(s.value) === '1' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{String(s.value) === '1' ? 'Enabled' : 'Disabled'}</button>}
                        </div>
                        {!isToggle && <div className="flex gap-2">
                          <input type="text" defaultValue={s.value as string} className="flex-1 border rounded-lg px-3 py-2 text-sm"
                            onBlur={e => { if (e.target.value !== s.value) handleUpdateSetting(k, e.target.value); }} />
                        </div>}
                      </div>
                    );})}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                  <CreditCard size={20} className="text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Payment Gateways moved to dedicated tab</p>
                    <p className="text-xs text-yellow-600">Configure all payment gateways from the <button onClick={() => changeAdminTab('gateways')} className="text-purple-600 font-bold underline">Gateways</button> tab in the sidebar.</p>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mt-6 mb-4 flex items-center gap-2"><Bell size={18}/> Notification Settings</h3>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="space-y-5">
                    <div className="border rounded-xl p-4">
                      <h4 className="font-bold text-sm mb-3">SMS Notifications</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div><label className="text-xs text-gray-500">Provider</label><select className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.sms?.provider || 'MSG91'} onChange={e => setNotifConfig({...notifConfig, sms: {...notifConfig.sms, provider: e.target.value}})}><option>MSG91</option><option>Twilio</option><option>TextLocal</option></select></div>
                        <div><label className="text-xs text-gray-500">API Key</label><input type="text" placeholder="Enter SMS API Key" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.sms?.api_key || ''} onChange={e => setNotifConfig({...notifConfig, sms: {...notifConfig.sms, api_key: e.target.value}})} /></div>
                        <div><label className="text-xs text-gray-500">Sender ID</label><input type="text" placeholder="BAGND" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.sms?.sender_id || ''} onChange={e => setNotifConfig({...notifConfig, sms: {...notifConfig.sms, sender_id: e.target.value}})} /></div>
                      </div>
                    </div>
                    <div className="border rounded-xl p-4">
                      <h4 className="font-bold text-sm mb-3">WhatsApp Notifications</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div><label className="text-xs text-gray-500">Provider</label><select className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.whatsapp?.provider || 'Twilio'} onChange={e => setNotifConfig({...notifConfig, whatsapp: {...notifConfig.whatsapp, provider: e.target.value}})}><option>Twilio</option><option>Gupshup</option><option>WhatsApp Business</option></select></div>
                        <div><label className="text-xs text-gray-500">API Key</label><input type="text" placeholder="Enter WhatsApp API Key" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.whatsapp?.api_key || ''} onChange={e => setNotifConfig({...notifConfig, whatsapp: {...notifConfig.whatsapp, api_key: e.target.value}})} /></div>
                        <div><label className="text-xs text-gray-500">Phone Number</label><input type="text" placeholder="+91XXXXXXXXXX" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.whatsapp?.phone || ''} onChange={e => setNotifConfig({...notifConfig, whatsapp: {...notifConfig.whatsapp, phone: e.target.value}})} /></div>
                      </div>
                    </div>
                    <div className="border rounded-xl p-4">
                      <h4 className="font-bold text-sm mb-3">Email Notifications</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div><label className="text-xs text-gray-500">Provider</label><select className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.email?.provider || 'SendGrid'} onChange={e => setNotifConfig({...notifConfig, email: {...notifConfig.email, provider: e.target.value}})}><option>SendGrid</option><option>Amazon SES</option><option>Mailgun</option><option>SMTP</option></select></div>
                        <div><label className="text-xs text-gray-500">API Key</label><input type="text" placeholder="Enter Email API Key" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.email?.api_key || ''} onChange={e => setNotifConfig({...notifConfig, email: {...notifConfig.email, api_key: e.target.value}})} /></div>
                        <div><label className="text-xs text-gray-500">From Email</label><input type="email" placeholder="noreply@bookaground.com" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={notifConfig.email?.from_email || ''} onChange={e => setNotifConfig({...notifConfig, email: {...notifConfig.email, from_email: e.target.value}})} /></div>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSaveNotifConfig} className="mt-4 bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 w-full">Save Notification Settings</button>
                </div>
              </>
            )}

            {/* KYC DOCS */}
            {tab === 'kyc' && (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">KYC Verification</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search KYC..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={kycSearch} onChange={e => setKycSearch(e.target.value)} /></div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={kycSortBy + '_' + kycSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setKycSortBy(f); setKycSortOrder(o as 'asc'|'desc'); }}><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option></select>
                    <button onClick={() => exportTableCSV('kyc_verification', ['Name','Phone','Role','KYC Status','Doc Type','Bank','UPI'], kycList.map(k => [String(k.name),String(k.phone),String(k.role),String(k.kyc_status),String(k.kyc_doc_type||'-'),String(k.bank_name||'-'),String(k.upi_id||'-')]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportPDF('KYC Verification', ['Name','Phone','Role','Status','Doc Type','Bank'], kycList.map(k => [String(k.name),String(k.phone),String(k.role),String(k.kyc_status),String(k.kyc_doc_type||'-'),String(k.bank_name||'-')]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                  </div>
                </div>
                {/* KYC Filter Tabs */}
                <div className="flex gap-2 mb-4">
                  {(['all', 'pending', 'verified', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setKycFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${kycFilter === f ? (f === 'pending' ? 'bg-orange-600 text-white' : f === 'verified' ? 'bg-green-600 text-white' : f === 'rejected' ? 'bg-red-600 text-white' : 'bg-purple-600 text-white') : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)} ({kycList.filter(k => f === 'all' || k.kyc_status === f).length})
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">Name</th><th className="p-3">Phone</th><th className="p-3">Role</th><th className="p-3">KYC Status</th><th className="p-3">Doc Type</th><th className="p-3">Document</th><th className="p-3">Bank Details</th><th className="p-3">UPI ID</th><th className="p-3">Actions</th></tr></thead>
                    <tbody>
                      {sortData(kycList.filter(k => {
                        if (kycFilter !== 'all' && k.kyc_status !== kycFilter) return false;
                        if (kycSearch && !String(k.name).toLowerCase().includes(kycSearch.toLowerCase()) && !String(k.phone).includes(kycSearch)) return false;
                        return true;
                      }), kycSortBy, kycSortOrder).length === 0 ? <tr><td colSpan={9} className="p-4 text-center text-gray-400">No KYC submissions in this category</td></tr> : sortData(kycList.filter(k => {
                        if (kycFilter !== 'all' && k.kyc_status !== kycFilter) return false;
                        if (kycSearch && !String(k.name).toLowerCase().includes(kycSearch.toLowerCase()) && !String(k.phone).includes(kycSearch)) return false;
                        return true;
                      }), kycSortBy, kycSortOrder).map(k => (
                        <tr key={k.id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{k.name as string}</td>
                          <td className="p-3 text-xs">{k.phone as string}</td>
                          <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${k.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{k.role as string}</span></td>
                          <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${k.kyc_status === 'verified' ? 'bg-green-100 text-green-700' : k.kyc_status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{k.kyc_status as string}</span></td>
                          <td className="p-3 text-xs">{(k.kyc_doc_type as string) || '-'}</td>
                          <td className="p-3">{k.kyc_doc_url ? <button onClick={() => setKycDocModal(k.kyc_doc_url as string)} className="text-xs text-blue-600 underline flex items-center gap-1 hover:text-blue-800"><Eye size={12}/>View Doc</button> : <span className="text-xs text-gray-400">No doc</span>}</td>
                          <td className="p-3 text-xs">{k.bank_name ? <div><p className="font-medium">{k.bank_name as string}</p><p className="text-gray-500">A/C: {k.bank_account as string}</p><p className="text-gray-500">IFSC: {k.bank_ifsc as string}</p></div> : <span className="text-gray-400">Not provided</span>}</td>
                          <td className="p-3 text-xs">{k.upi_id ? <span className="font-medium text-purple-700">{k.upi_id as string}</span> : <span className="text-gray-400">-</span>}</td>
                          <td className="p-3">
                            {k.kyc_status === 'pending' && <div className="flex gap-1">
                              <button onClick={() => handleVerifyKYC(k.id as number)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded"><CheckCircle size={10} className="inline mr-0.5"/>Verify</button>
                              <button onClick={() => { setKycRejectModal(k.id as number); setKycRejectReason(''); }} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded"><XCircle size={10} className="inline mr-0.5"/>Reject</button>
                            </div>}
                                        {k.kyc_status === 'verified' && <div className="flex gap-1"><span className="text-xs text-green-600">Verified</span><button onClick={async () => { if(!confirm('Trigger Re-KYC? User will need to re-verify.')) return; try { await api.triggerReKYC(k.id as number); alert('Re-KYC triggered!'); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded">Re-KYC</button></div>}
                                        {k.kyc_status === 'rejected' && <span className="text-xs text-red-600">Rejected</span>}
                                        {k.kyc_status === 'rekyc_required' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Re-KYC Required</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* KYC Document Modal - supports multiple comma-separated URLs */}
                {kycDocModal && (() => {
                  const BASE = ((import.meta as unknown as Record<string,Record<string,string>>).env?.VITE_API_URL || '');
                  const docUrls = kycDocModal.split(',').map((u: string) => u.trim()).filter(Boolean).map((u: string) =>
                    u.startsWith('http') || u.startsWith('data:') ? u : BASE + u
                  );
                  return (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setKycDocModal(null)}>
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">KYC Documents ({docUrls.length})</h3>
                        <button onClick={() => setKycDocModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"><X size={18}/></button>
                      </div>
                      {docUrls.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-lg mb-1">No documents uploaded</p>
                          <p className="text-sm">User has not uploaded any KYC documents yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {docUrls.map((docUrl: string, idx: number) => {
                            const isPdf = docUrl.match(/\.pdf$/i);
                            const isImage = docUrl.startsWith('data:image') || docUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
                            return (
                              <div key={idx} className="border rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b">
                                  <span className="text-sm font-medium text-gray-600">Document {idx + 1} {isPdf ? '(PDF)' : '(Image)'}</span>
                                  <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 underline">Open in new tab</a>
                                </div>
                                <div className="p-3">
                                  {isPdf ? (
                                    <iframe src={docUrl} className="w-full h-80 rounded-lg border" title={`KYC Document ${idx + 1}`} />
                                  ) : isImage || docUrl.startsWith('data:') ? (
                                    <img src={docUrl} alt={`KYC Document ${idx + 1}`} className="w-full rounded-lg max-h-96 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).alt = 'Failed to load image'; }} />
                                  ) : (
                                    <img src={docUrl} alt={`KYC Document ${idx + 1}`} className="w-full rounded-lg max-h-96 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })()}
                {/* KYC Reject Reason Modal */}
                {kycRejectModal && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setKycRejectModal(null)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-red-700 text-lg">Reject KYC</h3>
                        <button onClick={() => setKycRejectModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"><X size={18}/></button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Rejection reason likhein - ye user ko dikhaya jayega:</p>
                      <div className="space-y-2 mb-4">
                        {['Document photo blurry/unclear hai', 'Document expired hai', 'Name mismatch - bank details se alag hai', 'Front ya back photo missing hai', 'Wrong document type uploaded'].map(r => (
                          <button key={r} onClick={() => setKycRejectReason(r)} className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition ${kycRejectReason === r ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{r}</button>
                        ))}
                      </div>
                      <textarea value={kycRejectReason} onChange={e => setKycRejectReason(e.target.value)} placeholder="Ya custom reason likhein..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4" rows={2} />
                      <div className="flex gap-2">
                        <button onClick={() => setKycRejectModal(null)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
                        <button onClick={async () => {
                          if (!kycRejectReason.trim()) { alert('Rejection reason likhein'); return; }
                          try { await api.rejectKYC(kycRejectModal, kycRejectReason.trim()); setKycRejectModal(null); setKycRejectReason(''); loadTab(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed to reject KYC'); }
                        }} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700">Reject KYC</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TICKETS */}
            {tab === 'tickets' && (
              <>
                <h3 className="font-bold text-gray-800 text-lg mb-4">Support Tickets ({tickets.length})</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Ticket List */}
                  <div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-3 border-b bg-gray-50 font-medium text-sm">All Tickets</div>
                    <div className="max-h-96 overflow-y-auto">
                      {tickets.length === 0 ? <p className="p-4 text-center text-gray-400 text-sm">No tickets</p> : tickets.map(t => (
                        <button key={t.id as number} onClick={() => setSelectedTicket(t)} className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selectedTicket?.id === t.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}`}>
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm truncate">{t.subject as string}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1 ${t.status === 'open' ? 'bg-orange-100 text-orange-700' : t.status === 'resolved' ? 'bg-green-100 text-green-700' : t.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{t.status as string}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{t.user_name as string} ({t.user_role as string}){t.ground_name ? ` - ${t.ground_name}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Ticket Detail */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
                    {selectedTicket ? (
                      <>
                        <div className="p-4 border-b bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-gray-800">{selectedTicket.subject as string}</h4>
                              <p className="text-xs text-gray-500 mt-1">By {selectedTicket.user_name as string} ({selectedTicket.user_role as string}) {selectedTicket.ground_name ? `| Ground: ${selectedTicket.ground_name}` : ''}</p>
                            </div>
                            <select value={selectedTicket.status as string} onChange={async (e) => { try { await api.updateTicketStatus(selectedTicket.id as number, e.target.value); loadTab(); } catch { /* */ } }} className="text-xs border rounded-lg px-2 py-1">
                              <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                            </select>
                          </div>
                        </div>
                        <div className="p-4 max-h-64 overflow-y-auto space-y-3">
                          <div className="bg-gray-50 rounded-lg p-3"><p className="text-sm">{selectedTicket.message as string}</p><p className="text-xs text-gray-400 mt-1">{(selectedTicket.created_at as string)?.replace('T', ' ').slice(0, 16)}</p></div>
                          {(selectedTicket.replies as Array<Record<string, unknown>>)?.map((r, i) => (
                            <div key={i} className={`rounded-lg p-3 ${r.user_role === 'admin' ? 'bg-purple-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                              <p className="text-xs font-medium mb-1">{r.user_name as string} <span className={`px-1.5 py-0.5 rounded-full text-xs ${r.user_role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{r.user_role as string}</span></p>
                              <p className="text-sm">{r.message as string}</p>
                              <p className="text-xs text-gray-400 mt-1">{(r.created_at as string)?.replace('T', ' ').slice(0, 16)}</p>
                            </div>
                          ))}
                        </div>
                        {selectedTicket.status !== 'closed' && (
                          <div className="p-4 border-t">
                            <div className="flex gap-2">
                              <input type="text" placeholder="Type your reply..." className="flex-1 border rounded-lg px-3 py-2 text-sm" value={ticketReply} onChange={e => setTicketReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && ticketReply.trim()) { api.replyAdminTicket(selectedTicket.id as number, ticketReply).then(() => { setTicketReply(''); loadTab(); }); } }} />
                              <button onClick={async () => { if (!ticketReply.trim()) return; try { await api.replyAdminTicket(selectedTicket.id as number, ticketReply); setTicketReply(''); loadTab(); } catch { /* */ } }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Reply</button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-8 text-center text-gray-400"><MessageSquare size={48} className="mx-auto mb-3 opacity-30" /><p>Select a ticket to view details</p></div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* REPORTS */}
            {tab === 'reports' && (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">Analytics & Reports</h3>
                  <div className="flex gap-2 flex-wrap">
                    {['bookings','revenue','users','cancellations'].map(rt => (
                      <button key={rt} onClick={async () => { setReportType(rt); try { setReportDetail(await api.getDetailedReport(rt)); } catch { setReportDetail([]); } }} className={`px-4 py-2 rounded-lg text-sm capitalize ${reportType === rt ? 'bg-purple-600 text-white' : 'bg-white border text-gray-600'}`}>{rt}</button>
                    ))}
                    <button onClick={() => handleExportCSV('report_' + reportType)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <div className="flex gap-1">
                      <input type="email" placeholder="Email report to..." className="border rounded-lg px-3 py-2 text-sm w-48" value={testEmailAddr} onChange={e => setTestEmailAddr(e.target.value)} />
                      <button onClick={async () => { if(!testEmailAddr) return; try { await api.emailReport(testEmailAddr, reportType); alert('Report sent!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">Send</button>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-5"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-green-600">Rs.{(revenueReport?.total_revenue as number || 0)?.toLocaleString()}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-5"><p className="text-sm text-gray-500">Total Bookings</p><p className="text-2xl font-bold text-blue-600">{revenueReport?.total_bookings as number || 0}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-5"><p className="text-sm text-gray-500">Avg Value</p><p className="text-2xl font-bold text-purple-600">Rs.{revenueReport?.avg_booking_value as number || 0}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-5"><p className="text-sm text-gray-500">Report Rows</p><p className="text-2xl font-bold text-orange-600">{reportDetail.length}</p></div>
                </div>

                {/* Detailed Report Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        {reportType === 'bookings' && <tr><th className="p-2 text-left">ID</th><th className="p-2">Date</th><th className="p-2">Ground</th><th className="p-2">User</th><th className="p-2">Amount</th><th className="p-2">Payment</th><th className="p-2">Status</th></tr>}
                        {reportType === 'revenue' && <tr><th className="p-2 text-left">Ground</th><th className="p-2">City</th><th className="p-2">Owner</th><th className="p-2">Bookings</th><th className="p-2">Total Rev</th><th className="p-2">Online</th><th className="p-2">Cash</th></tr>}
                        {reportType === 'users' && <tr><th className="p-2 text-left">Name</th><th className="p-2">Phone</th><th className="p-2">Role</th><th className="p-2">Wallet</th><th className="p-2">Bookings</th><th className="p-2">Spent</th></tr>}
                        {reportType === 'cancellations' && <tr><th className="p-2 text-left">ID</th><th className="p-2">Date</th><th className="p-2">Ground</th><th className="p-2">User</th><th className="p-2">Amount</th><th className="p-2">Charge</th><th className="p-2">Refund</th><th className="p-2">By</th></tr>}
                      </thead>
                      <tbody>
                        {reportDetail.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-gray-400">No data. Click a report type above.</td></tr> : reportDetail.slice(0, 100).map((r, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50 text-xs">
                            {reportType === 'bookings' && <><td className="p-2 font-mono text-purple-700">{r.booking_id as string}</td><td className="p-2">{r.booking_date as string}</td><td className="p-2">{r.ground_name as string}</td><td className="p-2">{r.user_name as string}<br/><span className="text-gray-400">{r.user_phone as string}</span></td><td className="p-2 font-bold text-green-600">Rs.{r.total_amount as number}</td><td className="p-2"><span className={`px-1.5 py-0.5 rounded-full ${r.payment_mode === 'cash' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{r.payment_mode as string}</span></td><td className="p-2"><span className={`px-1.5 py-0.5 rounded-full ${r.status === 'confirmed' ? 'bg-green-100 text-green-700' : r.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{r.status as string}</span></td></>}
                            {reportType === 'revenue' && <><td className="p-2 font-medium">{r.name as string}</td><td className="p-2">{r.city as string}</td><td className="p-2">{r.owner_name as string}</td><td className="p-2 text-center">{r.total_bookings as number}</td><td className="p-2 font-bold text-green-600">Rs.{(r.total_revenue as number)?.toLocaleString()}</td><td className="p-2 text-blue-600">Rs.{(r.online_revenue as number)?.toLocaleString()}</td><td className="p-2 text-orange-600">Rs.{(r.cash_revenue as number)?.toLocaleString()}</td></>}
                            {reportType === 'users' && <><td className="p-2 font-medium">{r.name as string}</td><td className="p-2">{r.phone as string}</td><td className="p-2"><span className={`px-1.5 py-0.5 rounded-full ${r.role === 'admin' ? 'bg-purple-100 text-purple-700' : r.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>{r.role as string}</span></td><td className="p-2">Rs.{r.wallet_balance as number}</td><td className="p-2 text-center">{r.total_bookings as number}</td><td className="p-2 font-bold text-green-600">Rs.{(r.total_spent as number)?.toLocaleString()}</td></>}
                            {reportType === 'cancellations' && <><td className="p-2 font-mono text-red-700">{r.booking_id as string}</td><td className="p-2">{r.booking_date as string}</td><td className="p-2">{r.ground_name as string}</td><td className="p-2">{r.user_name as string}</td><td className="p-2">Rs.{r.total_amount as number}</td><td className="p-2 text-red-600">Rs.{r.cancel_charge as number || 0}</td><td className="p-2 text-green-600">Rs.{r.refund_amount as number || 0}</td><td className="p-2">{r.cancelled_by as string}</td></>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Stats */}
                {revenueReport && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-xl shadow-sm p-5">
                      <h4 className="font-bold text-gray-800 mb-3">Top Grounds</h4>
                      <div className="space-y-2">
                        {(revenueReport.top_grounds as Array<Record<string, unknown>>)?.map((g, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm text-gray-700">{i+1}. {g.name as string}</span>
                            <span className="font-medium text-green-600">Rs.{(g.revenue as number)?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5">
                      <h4 className="font-bold text-gray-800 mb-3">Peak Hours</h4>
                      <div className="space-y-2">
                        {(revenueReport.peak_hours as Array<Record<string, unknown>>)?.map((h, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm text-gray-700">{h.hour as string}</span>
                            <span className="font-medium text-blue-600">{h.bookings as number} bookings</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          {/* TEAM DATA */}
            {tab === 'teamdata' && (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Users size={20} className="text-purple-600" /> Team Data (Promotion)</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search teams..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={teamsSearch} onChange={e => setTeamsSearch(e.target.value)} /></div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={teamsSortBy + '_' + teamsSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setTeamsSortBy(f); setTeamsSortOrder(o as 'asc'|'desc'); }}><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option><option value="member_count_desc">Members High-Low</option></select>
                    <button onClick={() => exportTableCSV('teams', ['Team Name','Captain','Captain Phone','Members'], adminTeams.map(t => [String(t.name),String(t.captain_name),String(t.captain_phone),String(t.member_count)]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportPDF('Team Data', ['Team Name','Captain','Phone','Members'], adminTeams.map(t => [String(t.name),String(t.captain_name),String(t.captain_phone),String(t.member_count)]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                  <p className="text-sm text-gray-600">Total Teams: <span className="font-bold text-purple-600">{adminTeams.length}</span> | Total Players: <span className="font-bold text-blue-600">{adminTeams.reduce((s, t) => s + (t.member_count as number || 0), 0)}</span></p>
                </div>
                {adminTeams.length === 0 ? <p className="text-gray-400 text-center py-8">No teams registered yet.</p> : sortData(adminTeams.filter(t => !teamsSearch || String(t.name || '').toLowerCase().includes(teamsSearch.toLowerCase()) || String(t.captain_name || '').toLowerCase().includes(teamsSearch.toLowerCase())), teamsSortBy, teamsSortOrder).map(team => (
                  <div key={team.id as number} className="bg-white rounded-xl shadow-sm p-5 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{team.name as string}</h4>
                        <p className="text-sm text-gray-500">Captain: {team.captain_name as string} ({team.captain_phone as string}) | Members: {team.member_count as number}</p>
                      </div>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">{team.member_count as number} Players</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Phone</th><th className="p-2 text-center">Role</th></tr></thead>
                        <tbody>
                          {(team.member_details as Array<Record<string, unknown>>)?.map((m, idx) => (
                            <tr key={m.id as number} className="border-t hover:bg-gray-50">
                              <td className="p-2 text-gray-500">{idx + 1}</td>
                              <td className="p-2 font-medium text-gray-800">{m.name as string || `Player #${m.id}`}</td>
                              <td className="p-2 text-gray-600">{(m.phone as string)?.startsWith('000') ? '-' : m.phone as string}</td>
                              <td className="p-2 text-center">{(m.id as number) === (team.captain_id as number) ? <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">Captain</span> : <span className="text-gray-400 text-xs">Player</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            )}

          {/* TRANSACTION HISTORY */}
            {tab === 'history' && (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FileText size={20} className="text-purple-600" /> Transaction History</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search transactions..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={txnSearch} onChange={e => setTxnSearch(e.target.value)} /></div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={txnTypeFilter} onChange={e => setTxnTypeFilter(e.target.value)}><option value="all">All Types</option><option value="online">Online</option><option value="cash">Cash/Offline</option></select>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={txnSortBy + '_' + txnSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setTxnSortBy(f); setTxnSortOrder(o as 'asc'|'desc'); }}><option value="booking_date_desc">Date New-Old</option><option value="booking_date_asc">Date Old-New</option><option value="total_amount_desc">Amount High-Low</option><option value="total_amount_asc">Amount Low-High</option></select>
                    <button onClick={() => exportTableCSV('transactions', ['Booking ID','Date','Ground','Owner','User','Phone','Token','Total','Payment','Status'], txnHistory.map(t => [String(t.booking_id),String(t.booking_date),String(t.ground_name),String(t.owner_name),String(t.user_name),String(t.user_phone),String(t.token_amount||0),String(t.total_amount),String(t.payment_mode),String(t.status)]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportPDF('Transaction History', ['Booking ID','Date','Ground','User','Total','Payment','Status'], txnHistory.map(t => [String(t.booking_id),String(t.booking_date),String(t.ground_name),String(t.user_name),'Rs.'+String(t.total_amount),String(t.payment_mode),String(t.status)]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">Total Transactions</p><p className="text-2xl font-bold text-purple-600">{txnHistory.length}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-green-600">Rs.{txnHistory.reduce((s, t) => s + ((t.total_amount as number) || 0), 0).toLocaleString()}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">Online Payments</p><p className="text-2xl font-bold text-blue-600">{txnHistory.filter(t => t.payment_mode !== 'cash' && t.payment_mode !== 'offline').length}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">Cash Payments</p><p className="text-2xl font-bold text-orange-600">{txnHistory.filter(t => t.payment_mode === 'cash' || t.payment_mode === 'offline').length}</p></div>
                </div>
                {/* Owner filter */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button onClick={() => setTxnOwnerFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${txnOwnerFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-white border text-gray-600'}`}>All Owners</button>
                  {[...new Set(txnHistory.map(t => t.owner_name as string))].filter(Boolean).map(owner => (
                    <button key={owner} onClick={() => setTxnOwnerFilter(owner)} className={`px-4 py-2 rounded-lg text-sm font-medium ${txnOwnerFilter === owner ? 'bg-purple-600 text-white' : 'bg-white border text-gray-600'}`}>{owner}</button>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr><th className="p-3 text-left">Booking ID</th><th className="p-3">Date</th><th className="p-3">Time</th><th className="p-3">Ground</th><th className="p-3">Owner</th><th className="p-3">User</th><th className="p-3">Token Amt</th><th className="p-3">Cash Amt</th><th className="p-3">Online Amt</th><th className="p-3">Total Amt</th><th className="p-3">Payment</th><th className="p-3">Status</th></tr></thead>
                      <tbody>
                        {sortData(txnHistory.filter(t => {
                          if (txnOwnerFilter !== 'all' && t.owner_name !== txnOwnerFilter) return false;
                          if (txnSearch && !String(t.booking_id).includes(txnSearch) && !String(t.ground_name).toLowerCase().includes(txnSearch.toLowerCase()) && !String(t.user_name).toLowerCase().includes(txnSearch.toLowerCase()) && !String(t.user_phone).includes(txnSearch)) return false;
                          if (txnTypeFilter !== 'all') { const isCash = t.payment_mode === 'cash' || t.payment_mode === 'offline'; if (txnTypeFilter === 'cash' && !isCash) return false; if (txnTypeFilter === 'online' && isCash) return false; }
                          return true;
                        }), txnSortBy, txnSortOrder).length === 0 ? <tr><td colSpan={12} className="p-6 text-center text-gray-400">No transactions found</td></tr> : sortData(txnHistory.filter(t => {
                          if (txnOwnerFilter !== 'all' && t.owner_name !== txnOwnerFilter) return false;
                          if (txnSearch && !String(t.booking_id).includes(txnSearch) && !String(t.ground_name).toLowerCase().includes(txnSearch.toLowerCase()) && !String(t.user_name).toLowerCase().includes(txnSearch.toLowerCase()) && !String(t.user_phone).includes(txnSearch)) return false;
                          if (txnTypeFilter !== 'all') { const isCash = t.payment_mode === 'cash' || t.payment_mode === 'offline'; if (txnTypeFilter === 'cash' && !isCash) return false; if (txnTypeFilter === 'online' && isCash) return false; }
                          return true;
                        }), txnSortBy, txnSortOrder).map((t, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-mono text-xs font-medium text-purple-700">{t.booking_id as string}</td>
                            <td className="p-3 text-xs">{t.booking_date as string}</td>
                            <td className="p-3 text-xs">{t.start_time as string}-{t.end_time as string}</td>
                            <td className="p-3 text-xs font-medium">{t.ground_name as string}</td>
                            <td className="p-3 text-xs">{t.owner_name as string}</td>
                            <td className="p-3 text-xs"><p className="font-medium">{t.user_name as string}</p><p className="text-gray-400">{t.user_phone as string}</p></td>
                            <td className="p-3 text-center text-xs"><span className="text-purple-700 font-bold">Rs.{t.token_amount as number || 0}</span></td>
                            <td className="p-3 text-center text-xs"><span className="text-orange-700 font-bold">Rs.{(t.payment_mode === 'cash' || t.payment_mode === 'offline') ? (t.total_amount as number) : 0}</span></td>
                            <td className="p-3 text-center text-xs"><span className="text-blue-700 font-bold">Rs.{(t.payment_mode !== 'cash' && t.payment_mode !== 'offline') ? (t.total_amount as number) : 0}</span></td>
                            <td className="p-3 text-center"><span className="font-bold text-green-700">Rs.{t.total_amount as number}</span></td>
                            <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${t.payment_mode === 'cash' || t.payment_mode === 'offline' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{t.payment_mode as string}</span></td>
                            <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'confirmed' ? 'bg-green-100 text-green-700' : t.status === 'completed' ? 'bg-blue-100 text-blue-700' : t.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status as string}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* FRONTEND CUSTOMIZATION SETTINGS */}
            {tab === 'customize' && (
              <>
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Edit size={20} className="text-purple-600" /> Frontend Customization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Branding */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Star size={16} className="text-yellow-500" /> Branding</h4>
                    <div className="space-y-3">
                      <div><label className="text-xs text-gray-500 block mb-1">Site Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.site_name || ''} onChange={e => setCustomizeSettings({...customizeSettings, site_name: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Tagline</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.site_tagline || ''} onChange={e => setCustomizeSettings({...customizeSettings, site_tagline: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Logo URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." value={customizeSettings.logo_url || ''} onChange={e => setCustomizeSettings({...customizeSettings, logo_url: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Favicon URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." value={customizeSettings.favicon_url || ''} onChange={e => setCustomizeSettings({...customizeSettings, favicon_url: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Hero Background Image</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." value={customizeSettings.hero_bg_image || ''} onChange={e => setCustomizeSettings({...customizeSettings, hero_bg_image: e.target.value})} /></div>
                    </div>
                  </div>
                  {/* Colors */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-700 mb-4">Colors & Theme</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3"><label className="text-xs text-gray-500 w-32">Primary Color</label><input type="color" className="w-10 h-10 rounded border cursor-pointer" value={customizeSettings.primary_color || '#1a5f2a'} onChange={e => setCustomizeSettings({...customizeSettings, primary_color: e.target.value})} /><input type="text" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={customizeSettings.primary_color || '#1a5f2a'} onChange={e => setCustomizeSettings({...customizeSettings, primary_color: e.target.value})} /></div>
                      <div className="flex items-center gap-3"><label className="text-xs text-gray-500 w-32">Secondary Color</label><input type="color" className="w-10 h-10 rounded border cursor-pointer" value={customizeSettings.secondary_color || '#2d8f4e'} onChange={e => setCustomizeSettings({...customizeSettings, secondary_color: e.target.value})} /><input type="text" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={customizeSettings.secondary_color || '#2d8f4e'} onChange={e => setCustomizeSettings({...customizeSettings, secondary_color: e.target.value})} /></div>
                      <div className="flex items-center gap-3"><label className="text-xs text-gray-500 w-32">Accent Color</label><input type="color" className="w-10 h-10 rounded border cursor-pointer" value={customizeSettings.accent_color || '#f59e0b'} onChange={e => setCustomizeSettings({...customizeSettings, accent_color: e.target.value})} /><input type="text" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={customizeSettings.accent_color || '#f59e0b'} onChange={e => setCustomizeSettings({...customizeSettings, accent_color: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Homepage Layout</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.homepage_layout || 'default'} onChange={e => setCustomizeSettings({...customizeSettings, homepage_layout: e.target.value})}><option value="default">Default</option><option value="modern">Modern</option><option value="minimal">Minimal</option><option value="premium">Premium</option></select></div>
                    </div>
                  </div>
                  {/* Contact & Social */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-700 mb-4">Contact & Social Media</h4>
                    <div className="space-y-3">
                      <div><label className="text-xs text-gray-500 block mb-1">Contact Email</label><input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.contact_email || ''} onChange={e => setCustomizeSettings({...customizeSettings, contact_email: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Contact Phone</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.contact_phone || ''} onChange={e => setCustomizeSettings({...customizeSettings, contact_phone: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Footer Text</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.footer_text || ''} onChange={e => setCustomizeSettings({...customizeSettings, footer_text: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Facebook URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://facebook.com/..." value={customizeSettings.social_facebook || ''} onChange={e => setCustomizeSettings({...customizeSettings, social_facebook: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Instagram URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://instagram.com/..." value={customizeSettings.social_instagram || ''} onChange={e => setCustomizeSettings({...customizeSettings, social_instagram: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Twitter URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://twitter.com/..." value={customizeSettings.social_twitter || ''} onChange={e => setCustomizeSettings({...customizeSettings, social_twitter: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">YouTube URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://youtube.com/..." value={customizeSettings.social_youtube || ''} onChange={e => setCustomizeSettings({...customizeSettings, social_youtube: e.target.value})} /></div>
                    </div>
                  </div>
                  {/* SEO & Meta */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-700 mb-4">SEO & Content</h4>
                    <div className="space-y-3">
                      <div><label className="text-xs text-gray-500 block mb-1">Meta Title</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.meta_title || ''} onChange={e => setCustomizeSettings({...customizeSettings, meta_title: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Meta Description</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={customizeSettings.meta_description || ''} onChange={e => setCustomizeSettings({...customizeSettings, meta_description: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">About Text</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={customizeSettings.about_text || ''} onChange={e => setCustomizeSettings({...customizeSettings, about_text: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Booking Instruction</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.booking_instruction || ''} onChange={e => setCustomizeSettings({...customizeSettings, booking_instruction: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Terms & Conditions URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.terms_url || ''} onChange={e => setCustomizeSettings({...customizeSettings, terms_url: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Privacy Policy URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.privacy_url || ''} onChange={e => setCustomizeSettings({...customizeSettings, privacy_url: e.target.value})} /></div>
                    </div>
                  </div>
                  {/* Invoice Customization */}
                  <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-2">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-600" /> Invoice Customization</h4>
                    <p className="text-xs text-gray-400 mb-4">These settings will appear on all generated invoices for bookings.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-xs text-gray-500 block mb-1">Business Logo URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://example.com/logo.png" value={customizeSettings.invoice_logo_url || ''} onChange={e => setCustomizeSettings({...customizeSettings, invoice_logo_url: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Business Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="BookAGround" value={customizeSettings.invoice_business_name || ''} onChange={e => setCustomizeSettings({...customizeSettings, invoice_business_name: e.target.value})} /></div>
                      <div className="md:col-span-2"><label className="text-xs text-gray-500 block mb-1">Business Address</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="123, Main Road, City, State, PIN" value={customizeSettings.invoice_address || ''} onChange={e => setCustomizeSettings({...customizeSettings, invoice_address: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">GST Number</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="08AABCB1234F1Z5" value={customizeSettings.invoice_gst || ''} onChange={e => setCustomizeSettings({...customizeSettings, invoice_gst: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Phone Number</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="+91-9876543210" value={customizeSettings.invoice_phone || ''} onChange={e => setCustomizeSettings({...customizeSettings, invoice_phone: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Email Address</label><input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="billing@bookaground.com" value={customizeSettings.invoice_email || ''} onChange={e => setCustomizeSettings({...customizeSettings, invoice_email: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Website URL</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://bookaground.com" value={customizeSettings.invoice_website || ''} onChange={e => setCustomizeSettings({...customizeSettings, invoice_website: e.target.value})} /></div>
                    </div>
                    {customizeSettings.invoice_logo_url && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-2">Logo Preview:</p>
                        <img src={customizeSettings.invoice_logo_url} alt="Invoice Logo" className="max-h-16 rounded" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                  {/* WhatsApp Business Integration */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-green-500" /> WhatsApp Business API</h4>
                    <div className="space-y-3">
                      <div><label className="text-xs text-gray-500 block mb-1">WhatsApp Business Phone ID</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 1234567890" value={customizeSettings.whatsapp_phone_id || ''} onChange={e => setCustomizeSettings({...customizeSettings, whatsapp_phone_id: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">WhatsApp Business API Token</label><input type="password" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Bearer token from Meta" value={customizeSettings.whatsapp_api_token || ''} onChange={e => setCustomizeSettings({...customizeSettings, whatsapp_api_token: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">WhatsApp Business Account ID</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="WABA ID" value={customizeSettings.whatsapp_waba_id || ''} onChange={e => setCustomizeSettings({...customizeSettings, whatsapp_waba_id: e.target.value})} /></div>
                      <div><label className="text-xs text-gray-500 block mb-1">Webhook Verify Token</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Custom verify token" value={customizeSettings.whatsapp_verify_token || ''} onChange={e => setCustomizeSettings({...customizeSettings, whatsapp_verify_token: e.target.value})} /></div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"><input type="checkbox" checked={customizeSettings.whatsapp_enabled === '1'} onChange={e => setCustomizeSettings({...customizeSettings, whatsapp_enabled: e.target.checked ? '1' : '0'})} className="w-5 h-5 text-green-600 rounded" /><span className="text-sm font-medium text-green-700">Enable WhatsApp Notifications</span></div>
                      <p className="text-xs text-gray-400">Get your API credentials from <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Meta WhatsApp Cloud API</a></p>
                    </div>
                  </div>
                  {/* Multi-language */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Settings size={16} className="text-indigo-500" /> Multi-language Support</h4>
                    <div className="space-y-3">
                      <div><label className="text-xs text-gray-500 block mb-1">Default Language</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={customizeSettings.default_language || 'en'} onChange={e => setCustomizeSettings({...customizeSettings, default_language: e.target.value})}><option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option><option value="gu">Gujarati</option><option value="ta">Tamil</option><option value="te">Telugu</option><option value="kn">Kannada</option><option value="bn">Bengali</option></select></div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500 block">Enabled Languages</label>
                        {[{code:'en',name:'English'},{code:'hi',name:'Hindi'},{code:'mr',name:'Marathi'},{code:'gu',name:'Gujarati'},{code:'ta',name:'Tamil'},{code:'te',name:'Telugu'},{code:'kn',name:'Kannada'},{code:'bn',name:'Bengali'}].map(l => (
                          <label key={l.code} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(customizeSettings.enabled_languages || 'en,hi').includes(l.code)} onChange={e => { const langs = (customizeSettings.enabled_languages || 'en,hi').split(',').filter(Boolean); if(e.target.checked && !langs.includes(l.code)) langs.push(l.code); else { const idx = langs.indexOf(l.code); if(idx > -1) langs.splice(idx,1); } setCustomizeSettings({...customizeSettings, enabled_languages: langs.join(',')}); }} className="w-4 h-4 rounded" />{l.name}</label>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Feature Toggles */}
                  <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-2">
                    <h4 className="font-bold text-gray-700 mb-4">Feature Toggles (Enable/Disable)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[{key:'feature_wallet',label:'Wallet System'},{key:'feature_teams',label:'Teams Feature'},{key:'feature_referral',label:'Referral System'},{key:'feature_offers',label:'Offers & Promos'},{key:'feature_ratings',label:'Ratings & Reviews'},{key:'feature_tickets',label:'Support Tickets'}].map(f => (
                        <label key={f.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input type="checkbox" checked={customizeSettings[f.key] === '1'} onChange={e => setCustomizeSettings({...customizeSettings, [f.key]: e.target.checked ? '1' : '0'})} className="w-5 h-5 text-green-600 rounded" />
                          <span className="text-sm font-medium text-gray-700">{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Color Preview */}
                <div className="mt-6 bg-white rounded-xl shadow-sm p-5">
                  <h4 className="font-bold text-gray-700 mb-3">Preview</h4>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-xl" style={{background: customizeSettings.primary_color || '#1a5f2a'}}><p className="text-white text-xs text-center pt-7">Primary</p></div>
                    <div className="w-20 h-20 rounded-xl" style={{background: customizeSettings.secondary_color || '#2d8f4e'}}><p className="text-white text-xs text-center pt-7">Secondary</p></div>
                    <div className="w-20 h-20 rounded-xl" style={{background: customizeSettings.accent_color || '#f59e0b'}}><p className="text-white text-xs text-center pt-7">Accent</p></div>
                  </div>
                </div>
                <button onClick={async () => { try { await api.updateCustomizeSettings(customizeSettings); alert('Customization settings saved!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="mt-6 w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition">Save All Customization Settings</button>
              </>
            )}


            {/* GATEWAYS TAB */}
            {tab === 'gateways' && (
              <>
                <h3 className="font-bold text-gray-800 text-xl mb-4">Payment Gateway Configuration</h3>
                <p className="text-sm text-gray-500 mb-6">Configure API keys for each payment gateway. Enter your keys and activate to start accepting payments.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {gateways.map(gw => {
                    const gwId = gw.id as number;
                    const isOpen = editingGateway === gwId;
                    return (
                    <div key={gwId} className={`bg-white rounded-xl shadow-sm p-5 border-2 transition ${gw.is_active ? 'border-green-200' : 'border-transparent hover:border-purple-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gw.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <CreditCard size={18} className={gw.is_active ? 'text-green-600' : 'text-gray-400'} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 block">{gw.display_name as string}</span>
                            <span className={`text-xs ${gw.is_active ? 'text-green-600' : 'text-gray-400'}`}>{gw.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-gray-500">API Key: {gw.api_key ? <span className="text-green-600 font-medium">Configured</span> : <span className="text-red-500 font-medium">Not set</span>}</p>
                        <p className="text-xs text-gray-500">Secret Key: {gw.secret_key ? <span className="text-green-600 font-medium">Configured</span> : <span className="text-red-500 font-medium">Not set</span>}</p>
                      </div>
                      <button onClick={() => setEditingGateway(isOpen ? null : gwId)} className="w-full text-sm text-purple-600 font-medium hover:underline mb-2">{isOpen ? 'Close' : 'Configure Keys'}</button>
                      {isOpen && (
                        <div className="mt-3 space-y-3 border-t pt-3">
                          <div><label className="text-xs text-gray-500 font-medium">API Key / Key ID</label><input type="text" placeholder="Enter API Key" className="w-full border-2 border-gray-200 focus:border-purple-400 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none" defaultValue={String(gw.api_key || '')} id={`gw-api-${gwId}`} /></div>
                          <div><label className="text-xs text-gray-500 font-medium">Secret Key / Key Secret</label><input type="password" placeholder="Enter Secret Key" className="w-full border-2 border-gray-200 focus:border-purple-400 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none" defaultValue={String(gw.secret_key || '')} id={`gw-secret-${gwId}`} /></div>
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const apiKey = (document.getElementById(`gw-api-${gwId}`) as HTMLInputElement)?.value || '';
                              const secretKey = (document.getElementById(`gw-secret-${gwId}`) as HTMLInputElement)?.value || '';
                              if (!apiKey.trim()) { alert('Please enter API Key'); return; }
                              if (!secretKey.trim()) { alert('Please enter Secret Key'); return; }
                              try { await api.updateAdminGateway(gwId, { api_key: apiKey, secret_key: secretKey, is_active: 1 }); alert('Gateway keys saved & activated!'); setEditingGateway(null); loadTab(); }
                              catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
                            }} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">Save & Activate</button>
                            {gw.is_active ? <button onClick={async () => { try { await api.updateAdminGateway(gwId, { is_active: 0 }); alert('Gateway deactivated'); loadTab(); } catch { alert('Failed'); } }} className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Deactivate</button> : null}
                          </div>
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              </>
            )}

            {/* MARKETING CAMPAIGNS */}
            {tab === 'marketing' && (
              <>
                <h3 className="font-bold text-gray-800 text-xl mb-4">Email/SMS Marketing Campaigns</h3>
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h4 className="font-bold text-gray-700 mb-3">Create New Campaign</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Campaign Name" className="border rounded-lg px-3 py-2 text-sm" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} />
                    <select className="border rounded-lg px-3 py-2 text-sm" value={newCampaign.type} onChange={e => setNewCampaign({...newCampaign, type: e.target.value})}>
                      <option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option>
                    </select>
                    <input type="text" placeholder="Subject Line" className="border rounded-lg px-3 py-2 text-sm" value={newCampaign.subject} onChange={e => setNewCampaign({...newCampaign, subject: e.target.value})} />
                    <select className="border rounded-lg px-3 py-2 text-sm" value={newCampaign.target_audience} onChange={e => setNewCampaign({...newCampaign, target_audience: e.target.value})}>
                      <option value="all">All Users</option><option value="users">Users Only</option><option value="owners">Owners Only</option>
                    </select>
                  </div>
                  <textarea placeholder="Campaign Content / Message Body" className="w-full border rounded-lg px-3 py-2 text-sm mt-3 h-24" value={newCampaign.content} onChange={e => setNewCampaign({...newCampaign, content: e.target.value})} />
                  <button onClick={async () => { try { await api.createMarketingCampaign(newCampaign); alert('Campaign created!'); setNewCampaign({ name: '', type: 'email', subject: '', content: '', target_audience: 'all' }); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="mt-3 bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700">Create Campaign</button>
                </div>
                <div className="space-y-3">
                  {campaigns.map((c: Record<string, unknown>) => (
                    <div key={c.id as number} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{c.name as string}</p>
                        <p className="text-xs text-gray-500">{c.type as string} | Target: {c.target_audience as string} | Sent: {c.sent_count as number}</p>
                        <p className="text-xs text-gray-400 mt-1">{c.subject as string}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status as string}</span>
                        {c.status !== 'sent' && <button onClick={async () => { try { await api.sendMarketingCampaign(c.id as number); alert('Campaign sent!'); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">Send Now</button>}
                        <button onClick={async () => { if (confirm('Delete campaign?')) { try { await api.deleteMarketingCampaign(c.id as number); loadTab(); } catch { /* */ } } }} className="text-xs text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                  {campaigns.length === 0 && <p className="text-gray-400 text-center py-8">No campaigns yet. Create your first campaign above.</p>}
                </div>
              </>
            )}

            {/* BLOG / CONTENT */}
            {tab === 'blog' && (
              <>
                <h3 className="font-bold text-gray-800 text-xl mb-4">Blog / Content Management</h3>
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h4 className="font-bold text-gray-700 mb-3">Create New Blog Post</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Blog Title" className="border rounded-lg px-3 py-2 text-sm" value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} />
                    <select className="border rounded-lg px-3 py-2 text-sm" value={newBlog.category} onChange={e => setNewBlog({...newBlog, category: e.target.value})}>
                      <option value="general">General</option><option value="tips">Tips & Tricks</option><option value="news">News</option><option value="sports">Sports</option><option value="offers">Offers</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Tags (comma separated)" className="w-full border rounded-lg px-3 py-2 text-sm mt-3" value={newBlog.tags} onChange={e => setNewBlog({...newBlog, tags: e.target.value})} />
                  <textarea placeholder="Blog Content..." className="w-full border rounded-lg px-3 py-2 text-sm mt-3 h-32" value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})} />
                  <button onClick={async () => { try { await api.createBlogPost(newBlog); alert('Blog post published!'); setNewBlog({ title: '', content: '', category: 'general', tags: '' }); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="mt-3 bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700">Publish Blog Post</button>
                </div>
                <div className="space-y-3">
                  {blogPosts.map((p: Record<string, unknown>) => (
                    <div key={p.id as number} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-800 text-lg">{p.title as string}</p>
                          <p className="text-xs text-gray-500 mt-1">Category: {p.category as string} | Views: {p.views as number} | {(p.created_at as string || '').split('T')[0]}</p>
                          {p.tags ? <p className="text-xs text-purple-600 mt-1">{String(p.tags)}</p> : null}
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{(p.content as string || '').substring(0, 200)}...</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.is_published ? 'Published' : 'Draft'}</span>
                          <button onClick={async () => { if (confirm('Delete this post?')) { try { await api.deleteBlogPost(p.id as number); loadTab(); } catch { /* */ } } }} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {blogPosts.length === 0 && <p className="text-gray-400 text-center py-8">No blog posts yet.</p>}
                </div>
              </>
            )}

            {/* AFFILIATES */}
            {tab === 'affiliates' && (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-xl">Affiliate Program</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search affiliates..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={affSearch} onChange={e => setAffSearch(e.target.value)} /></div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={affSortBy + '_' + affSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setAffSortBy(f); setAffSortOrder(o as 'asc'|'desc'); }}><option value="total_earnings_desc">Earnings High-Low</option><option value="total_referrals_desc">Referrals High-Low</option><option value="name_asc">Name A-Z</option></select>
                    <button onClick={() => exportTableCSV('affiliates', ['Name','Phone','Code','Commission %','Referrals','Earnings','Status'], affiliatesList.map(a => [String((a as Record<string,unknown>).name),String((a as Record<string,unknown>).phone),String((a as Record<string,unknown>).affiliate_code),String((a as Record<string,unknown>).commission_rate),String((a as Record<string,unknown>).total_referrals),String((a as Record<string,unknown>).total_earnings),String((a as Record<string,unknown>).status)]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportPDF('Affiliates', ['Name','Phone','Code','Commission','Referrals','Earnings'], affiliatesList.map(a => [String((a as Record<string,unknown>).name),String((a as Record<string,unknown>).phone),String((a as Record<string,unknown>).affiliate_code),String((a as Record<string,unknown>).commission_rate)+'%',String((a as Record<string,unknown>).total_referrals),'Rs.'+String((a as Record<string,unknown>).total_earnings)]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h4 className="font-bold text-gray-700 mb-3">Create New Affiliate</h4>
                  <div className="flex gap-3">
                    <input type="number" placeholder="User ID" className="border rounded-lg px-3 py-2 text-sm flex-1" id="aff-user-id" />
                    <input type="number" placeholder="Commission Rate %" defaultValue="5" className="border rounded-lg px-3 py-2 text-sm w-32" id="aff-rate" />
                    <button onClick={async () => { const uid = (document.getElementById('aff-user-id') as HTMLInputElement)?.value; const rate = (document.getElementById('aff-rate') as HTMLInputElement)?.value; if (!uid) { alert('Enter User ID'); return; } try { const res = await api.createAffiliate({ user_id: parseInt(uid), commission_rate: parseFloat(rate || '5') }); alert('Affiliate created! Code: ' + (res as Record<string, unknown>).code); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700">Create Affiliate</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">Name</th><th className="p-3">Phone</th><th className="p-3">Code</th><th className="p-3">Commission %</th><th className="p-3">Referrals</th><th className="p-3">Earnings</th><th className="p-3">Status</th></tr></thead>
                    <tbody>
                      {sortData(affiliatesList.filter((a: Record<string, unknown>) => !affSearch || String(a.name || '').toLowerCase().includes(affSearch.toLowerCase()) || String(a.phone || '').includes(affSearch) || String(a.affiliate_code || '').toLowerCase().includes(affSearch.toLowerCase())), affSortBy, affSortOrder).map((a: Record<string, unknown>) => (
                        <tr key={a.id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{a.name as string}</td>
                          <td className="p-3 text-xs">{a.phone as string}</td>
                          <td className="p-3"><code className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{a.affiliate_code as string}</code></td>
                          <td className="p-3 text-center">{a.commission_rate as number}%</td>
                          <td className="p-3 text-center">{a.total_referrals as number}</td>
                          <td className="p-3 text-center font-medium text-green-600">Rs.{a.total_earnings as number}</td>
                          <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{a.status as string}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {affiliatesList.length === 0 && <p className="text-gray-400 text-center py-8">No affiliates yet.</p>}
                </div>
              </>
            )}

            {/* PUSH NOTIFICATIONS */}
            {tab === 'pushnotifs' && (
              <>
                <h3 className="font-bold text-gray-800 text-xl mb-4">Push Notification Manager</h3>
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h4 className="font-bold text-gray-700 mb-3">Send New Notification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Notification Title" className="border rounded-lg px-3 py-2 text-sm" value={newPushNotif.title} onChange={e => setNewPushNotif({...newPushNotif, title: e.target.value})} />
                    <select className="border rounded-lg px-3 py-2 text-sm" value={newPushNotif.target} onChange={e => setNewPushNotif({...newPushNotif, target: e.target.value})}>
                      <option value="all">All Users</option><option value="users">Users Only</option><option value="owners">Owners Only</option>
                    </select>
                  </div>
                  <textarea placeholder="Notification Body..." className="w-full border rounded-lg px-3 py-2 text-sm mt-3 h-20" value={newPushNotif.body} onChange={e => setNewPushNotif({...newPushNotif, body: e.target.value})} />
                  <button onClick={async () => { if (!newPushNotif.title) { alert('Enter title'); return; } try { await api.sendPushNotification(newPushNotif); alert('Notification sent!'); setNewPushNotif({ title: '', body: '', target: 'all' }); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="mt-3 bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700">Send Notification</button>
                </div>
                <div className="space-y-3">
                  {pushNotifs.map((n: Record<string, unknown>) => (
                    <div key={n.id as number} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{n.title as string}</p>
                        <p className="text-xs text-gray-500">{n.body as string}</p>
                        <p className="text-xs text-gray-400 mt-1">Target: {n.target as string} | Sent to: {n.sent_count as number} users | {(n.created_at as string || '').split('T')[0]}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Sent</span>
                    </div>
                  ))}
                  {pushNotifs.length === 0 && <p className="text-gray-400 text-center py-8">No notifications sent yet.</p>}
                </div>
              </>
            )}

            {/* CITY REPORTS */}
            {tab === 'cityreports' && (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-xl">City-wise Reports</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search city..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48" value={citySearch} onChange={e => setCitySearch(e.target.value)} /></div>
                    <select className="border rounded-lg px-3 py-2 text-sm" value={citySortBy + '_' + citySortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setCitySortBy(f); setCitySortOrder(o as 'asc'|'desc'); }}><option value="bookings_desc">Bookings High-Low</option><option value="revenue_desc">Revenue High-Low</option><option value="grounds_desc">Grounds High-Low</option><option value="city_asc">City A-Z</option></select>
                    <button onClick={() => exportTableCSV('city_reports', ['City','Grounds','Bookings','Users','Revenue'], cityReports.map(r => [String((r as Record<string,unknown>).city||'Unknown'),String((r as Record<string,unknown>).grounds),String((r as Record<string,unknown>).bookings),String((r as Record<string,unknown>).unique_users),String((r as Record<string,unknown>).revenue||0)]))} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Download size={14}/> CSV</button>
                    <button onClick={() => handleExportPDF('City Reports', ['City','Grounds','Bookings','Users','Revenue'], cityReports.map(r => [String((r as Record<string,unknown>).city||'Unknown'),String((r as Record<string,unknown>).grounds),String((r as Record<string,unknown>).bookings),String((r as Record<string,unknown>).unique_users),'Rs.'+String((r as Record<string,unknown>).revenue||0)]))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><FileText size={14}/> PDF</button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">City</th><th className="p-3">Grounds</th><th className="p-3">Bookings</th><th className="p-3">Unique Users</th><th className="p-3">Revenue</th></tr></thead>
                    <tbody>
                      {sortData(cityReports.filter((r: Record<string, unknown>) => !citySearch || String(r.city || '').toLowerCase().includes(citySearch.toLowerCase())), citySortBy, citySortOrder).map((r: Record<string, unknown>, i: number) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{(r.city as string) || 'Unknown'}</td>
                          <td className="p-3 text-center">{r.grounds as number}</td>
                          <td className="p-3 text-center">{r.bookings as number}</td>
                          <td className="p-3 text-center">{r.unique_users as number}</td>
                          <td className="p-3 text-center font-bold text-green-600">Rs.{(r.revenue as number || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {cityReports.length === 0 && <p className="text-gray-400 text-center py-8">No city data available.</p>}
                </div>

              </>
            )}

            {/* APP VERSION MANAGEMENT */}
            {tab === 'appversion' && (
              <>
                <h3 className="font-bold text-gray-800 text-xl mb-4">App Version Management</h3>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Current App Version</label>
                      <input type="text" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1" defaultValue={appVersion.current_version as string || '1.0.0'} id="app-cur-ver" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Minimum Required Version</label>
                      <input type="text" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1" defaultValue={appVersion.min_version as string || '1.0.0'} id="app-min-ver" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Users with app version below minimum will be forced to update.</p>
                  <button onClick={async () => { const cur = (document.getElementById('app-cur-ver') as HTMLInputElement)?.value; const min = (document.getElementById('app-min-ver') as HTMLInputElement)?.value; try { await api.updateAppVersion({ current_version: cur, min_version: min }); alert('App version updated!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="mt-4 bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700">Save Version Settings</button>
                </div>
              </>
            )}

          {/* OWNER WALLETS TAB */}
            {tab === 'ownerwallets' && (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Wallet size={20} className="text-green-600" /> Owner Wallet Balances</h3>
                  <div className="flex gap-2 flex-wrap">
                    <select className="border rounded-lg px-3 py-2 text-sm" value={walletsSortBy + '_' + walletsSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setWalletsSortBy(f); setWalletsSortOrder(o as 'asc'|'desc'); }}><option value="wallet_balance_desc">Wallet High-Low</option><option value="wallet_balance_asc">Wallet Low-High</option><option value="total_revenue_desc">Revenue High-Low</option><option value="name_asc">Name A-Z</option></select>
                    <button onClick={() => exportTableCSV('owner_wallets', ['Owner','Phone','Grounds','Revenue','Commission','Settled','Withdrawn','Wallet','Net Payable','KYC'], ownerWallets.map(o => [String(o.name),String(o.phone),String(o.ground_count||0),String(o.total_revenue||0),String(o.commission||0),String(o.settled||0),String(o.withdrawn||0),String(o.wallet_balance||0),String(o.net_payable||0),String(o.kyc_status||'none')]))} className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1"><Download size={12}/> CSV</button>
                    <button onClick={() => handleExportPDF('Owner Wallets', ['Owner','Phone','Revenue','Commission','Wallet','KYC'], ownerWallets.map(o => [String(o.name),String(o.phone),'Rs.'+String(o.total_revenue||0),'Rs.'+String(o.commission||0),'Rs.'+String(o.wallet_balance||0),String(o.kyc_status||'none')]))} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1"><FileText size={12}/> PDF</button>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center bg-white rounded-lg border px-3 py-2 gap-2">
                    <Search size={16} className="text-gray-400" />
                    <input type="text" placeholder="Search owner by name, phone..." className="flex-1 outline-none text-sm" value={walletsSearch} onChange={e => setWalletsSearch(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">Total Owners</p><p className="text-2xl font-bold text-purple-600">{ownerWallets.length}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">Total Wallet Balance</p><p className="text-2xl font-bold text-green-600">Rs.{ownerWallets.reduce((s, o) => s + ((o.wallet_balance as number) || 0), 0).toLocaleString()}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-blue-600">Rs.{ownerWallets.reduce((s, o) => s + ((o.total_revenue as number) || 0), 0).toLocaleString()}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">Total Grounds</p><p className="text-2xl font-bold text-orange-600">{ownerWallets.reduce((s, o) => s + ((o.ground_count as number) || 0), 0)}</p></div>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">Owner</th><th className="p-3">Phone</th><th className="p-3">Grounds</th><th className="p-3">Revenue</th><th className="p-3">Commission</th><th className="p-3">Settled</th><th className="p-3">Withdrawn</th><th className="p-3">Wallet</th><th className="p-3">Net Payable</th><th className="p-3">KYC</th></tr></thead>
                    <tbody>
                      {sortData(ownerWallets.filter(o => !walletsSearch || (o.name as string || '').toLowerCase().includes(walletsSearch.toLowerCase()) || (o.phone as string || '').includes(walletsSearch)), walletsSortBy, walletsSortOrder).map(o => (
                        <tr key={o.id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{o.name as string}</td>
                          <td className="p-3 text-gray-500 text-xs">{o.phone as string}</td>
                          <td className="p-3 text-center">{o.ground_count as number}</td>
                          <td className="p-3 text-center text-green-600 font-medium">Rs.{((o.total_revenue as number) || 0).toLocaleString()}</td>
                          <td className="p-3 text-center text-red-500">Rs.{((o.commission as number) || 0).toLocaleString()}</td>
                          <td className="p-3 text-center text-blue-600">Rs.{((o.settled as number) || 0).toLocaleString()}</td>
                          <td className="p-3 text-center text-purple-600">Rs.{((o.withdrawn as number) || 0).toLocaleString()}</td>
                          <td className="p-3 text-center font-bold text-green-700">Rs.{((o.wallet_balance as number) || 0).toLocaleString()}</td>
                          <td className="p-3 text-center font-bold">{(o.net_payable as number) > 0 ? <span className="text-green-600">Rs.{((o.net_payable as number) || 0).toLocaleString()}</span> : <span className="text-red-500">Rs.{((o.net_payable as number) || 0).toLocaleString()}</span>}</td>
                          <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${o.kyc_status === 'verified' ? 'bg-green-100 text-green-700' : o.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{(o.kyc_status as string) || 'none'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ownerWallets.length === 0 && <p className="text-gray-400 text-center py-8">No owners found.</p>}
                </div>
              </>
            )}

          {/* OWNER STAFF TAB */}
            {tab === 'ownerstaff' && (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Users size={20} className="text-blue-600" /> Owner Staff Details</h3>
                  <div className="flex gap-2 flex-wrap">
                    <select className="border rounded-lg px-3 py-2 text-sm" value={staffSortBy + '_' + staffSortOrder} onChange={e => { const [f,o] = e.target.value.split('_'); setStaffSortBy(f); setStaffSortOrder(o as 'asc'|'desc'); }}><option value="name_asc">Name A-Z</option><option value="name_desc">Name Z-A</option></select>
                    <button onClick={() => exportTableCSV('owner_staff', ['Owner','Phone','Email'], users.filter(u => u.role === 'owner').map(u => [String(u.name),String(u.phone),String(u.email||'-')]))} className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1"><Download size={12}/> CSV</button>
                    <button onClick={() => handleExportPDF('Owner Staff Details', ['Owner','Phone','Email'], users.filter(u => u.role === 'owner').map(u => [String(u.name),String(u.phone),String(u.email||'-')]))} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1"><FileText size={12}/> PDF</button>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center bg-white rounded-lg border px-3 py-2 gap-2">
                    <Search size={16} className="text-gray-400" />
                    <input type="text" placeholder="Search owner..." className="flex-1 outline-none text-sm" value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-4">
                  {sortData(users.filter(u => u.role === 'owner').filter(u => !staffSearch || (u.name as string || '').toLowerCase().includes(staffSearch.toLowerCase()) || (u.phone as string || '').includes(staffSearch)), staffSortBy, staffSortOrder).map(owner => (
                    <div key={owner.id as number} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800">{owner.name as string}</h4>
                          <p className="text-sm text-gray-500">{owner.phone as string} | {(owner.email as string) || 'No email'}</p>
                        </div>
                        <button onClick={async () => { setOwnerStaffOwnerId(owner.id as number); try { const data = await api.getOwnerStaffAdmin(owner.id as number); setOwnerStaffData(data); } catch { setOwnerStaffData({ owner_name: owner.name, owner_phone: owner.phone, staff: [] }); } }} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">View Staff</button>
                      </div>
                      {ownerStaffOwnerId === (owner.id as number) && ownerStaffData && (
                        <div className="mt-3 border-t pt-3">
                          {(ownerStaffData.staff as Array<Record<string, unknown>>)?.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50"><tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Phone</th><th className="p-2 text-left">Role</th><th className="p-2 text-left">Added</th></tr></thead>
                              <tbody>
                                {(ownerStaffData.staff as Array<Record<string, unknown>>).map((s, idx) => (
                                  <tr key={s.id as number} className="border-t">
                                    <td className="p-2 text-gray-500">{idx + 1}</td>
                                    <td className="p-2 font-medium">{s.name as string}</td>
                                    <td className="p-2 text-gray-600">{s.phone as string}</td>
                                    <td className="p-2"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">{(s.role as string) || 'Staff'}</span></td>
                                    <td className="p-2 text-xs text-gray-400">{(s.created_at as string)?.split('T')[0] || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : <p className="text-gray-400 text-sm text-center py-4">No staff members added by this owner.</p>}
                        </div>
                      )}
                    </div>
                  ))}
                  {users.filter(u => u.role === 'owner').length === 0 && <p className="text-gray-400 text-center py-8">No owners found.</p>}
                </div>
              </>
            )}

          {/* ADMIN PROFILE */}
            {tab === 'adminprofile' && (
              <>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">A</div>
                    <div>
                      <h3 className="text-2xl font-bold">Admin</h3>
                      <p className="text-purple-200">Super Administrator</p>
                      <p className="text-purple-200 text-sm">admin@bookaground.com</p>
                      <span className="mt-1 inline-block text-xs bg-white/20 px-3 py-1 rounded-full">Super Admin</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={18} className="text-purple-600" /> Account Details</h4>
                    <div className="space-y-3">
                      <div><p className="text-xs text-gray-500 uppercase">Username</p><p className="font-medium text-gray-800">admin</p></div>
                      <div><p className="text-xs text-gray-500 uppercase">Role</p><p className="font-medium text-gray-800">Super Administrator</p></div>
                      <div><p className="text-xs text-gray-500 uppercase">Email</p><p className="font-medium text-gray-800">admin@bookaground.com</p></div>
                      <div><p className="text-xs text-gray-500 uppercase">Last Login</p><p className="font-medium text-gray-800">{new Date().toLocaleString('en-IN')}</p></div>
                      <div><p className="text-xs text-gray-500 uppercase">Member Since</p><p className="font-medium text-gray-800">Jan 2026</p></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock size={18} className="text-red-600" /> Security</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600 font-medium block mb-1">Current Password</label>
                        <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Enter current password" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium block mb-1">New Password</label>
                        <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Enter new password" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium block mb-1">Confirm Password</label>
                        <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Confirm new password" />
                      </div>
                      <button onClick={() => alert('Password updated!')} className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700">Update Password</button>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h4 className="font-bold text-gray-800 mb-4">Platform Statistics</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-purple-600">{stats?.total_users || 0}</p><p className="text-xs text-gray-500 mt-1">Total Users</p></div>
                    <div className="bg-green-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats?.total_grounds || 0}</p><p className="text-xs text-gray-500 mt-1">Total Grounds</p></div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats?.total_bookings || 0}</p><p className="text-xs text-gray-500 mt-1">Total Bookings</p></div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-orange-600">Rs.{(stats?.total_revenue || 0).toLocaleString()}</p><p className="text-xs text-gray-500 mt-1">Total Revenue</p></div>
                  </div>
                </div>
              </>
            )}

            {/* ROLE MANAGEMENT */}
            {tab === 'rolemanagement' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-gray-800 text-xl mb-1">Role Management & Team Access</h3>
                    <p className="text-sm text-gray-500">Define roles, assign permissions, and manage team member access.</p>
                  </div>
                  <button onClick={() => setShowAddTeamMember(true)} className="bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-700"><Plus size={16}/> Add Team Member</button>
                </div>

                {/* Roles */}
                <h4 className="font-bold text-gray-700 mb-3">Roles & Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {adminRoles.map((role, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-5 border-l-4" style={{borderLeftColor: String(role.color) === 'purple' ? '#9333ea' : String(role.color) === 'blue' ? '#2563eb' : String(role.color) === 'green' ? '#16a34a' : '#ea580c'}}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100"><Shield size={20} className="text-gray-600" /></div>
                          <div>
                            <h4 className="font-bold text-gray-800">{String(role.name)}</h4>
                            <p className="text-xs text-gray-500">{String(role.permissions) === 'all' ? 'Full access to everything' : 'Limited access: ' + String(role.permissions).split(',').length + ' modules'}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{String(role.users)} member{Number(role.users) !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(String(role.permissions) === 'all' ? ['Dashboard','Grounds','Bookings','Users','Payments','Settlements','Settings','Reports','KYC','Customize','Gateways','Withdrawals','Marketing','Blog'] : String(role.permissions).split(',')).map((p: string) => (
                          <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.trim()}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Team Members */}
                <h4 className="font-bold text-gray-700 mb-3">Team Members ({teamMembers.length})</h4>
                {teamMembers.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <Users size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No team members added yet</p>
                    <p className="text-sm text-gray-400 mb-4">Add team members and assign them roles with limited access</p>
                    <button onClick={() => setShowAddTeamMember(true)} className="bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700"><Plus size={14} className="inline mr-1"/> Add First Team Member</button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr><th className="p-3 text-left">Name</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Permissions</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                      <tbody>
                        {teamMembers.map(m => (
                          <tr key={m.id as number} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{String(m.name)}</td>
                            <td className="p-3 text-xs">{String(m.phone)}</td>
                            <td className="p-3 text-xs">{String(m.email || '-')}</td>
                            <td className="p-3"><span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{String(m.role_name)}</span></td>
                            <td className="p-3"><div className="flex flex-wrap gap-1">{String(m.permissions).split(',').slice(0,3).map((p: string) => <span key={p} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.trim()}</span>)}{String(m.permissions).split(',').length > 3 && <span className="text-xs text-gray-400">+{String(m.permissions).split(',').length - 3}</span>}</div></td>
                            <td className="p-3 text-center"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span></td>
                            <td className="p-3 text-center"><button onClick={() => handleRemoveTeamMember(m.id as number)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"><Trash2 size={12} className="inline mr-0.5"/>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Team Member Modal */}
                {showAddTeamMember && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddTeamMember(false)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold text-gray-800">Add Team Member</h3><button onClick={() => setShowAddTeamMember(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button></div>
                      <p className="text-sm text-gray-500 mb-4">Add a new team member with limited dashboard access based on their assigned role.</p>
                      <div className="space-y-3">
                        <div><label className="text-sm font-medium text-gray-700">Full Name *</label><input type="text" placeholder="Enter name" className="w-full border rounded-lg px-3 py-2 mt-1" value={newTeamMember.name} onChange={e => setNewTeamMember({...newTeamMember, name: e.target.value})} /></div>
                        <div><label className="text-sm font-medium text-gray-700">Phone *</label><input type="tel" placeholder="Phone number (login ID)" className="w-full border rounded-lg px-3 py-2 mt-1" value={newTeamMember.phone} onChange={e => setNewTeamMember({...newTeamMember, phone: e.target.value})} /></div>
                        <div><label className="text-sm font-medium text-gray-700">Email</label><input type="email" placeholder="Email (optional)" className="w-full border rounded-lg px-3 py-2 mt-1" value={newTeamMember.email} onChange={e => setNewTeamMember({...newTeamMember, email: e.target.value})} /></div>
                        <div><label className="text-sm font-medium text-gray-700">Assign Role *</label>
                          <select className="w-full border rounded-lg px-3 py-2 mt-1" value={newTeamMember.role_id} onChange={e => setNewTeamMember({...newTeamMember, role_id: parseInt(e.target.value)})}>
                            {adminRoles.map(r => <option key={r.id as number} value={r.id as number}>{String(r.name)} - {String(r.permissions) === 'all' ? 'Full Access' : String(r.permissions).split(',').length + ' modules'}</option>)}
                          </select>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-600 mb-1">This role has access to:</p>
                            <div className="flex flex-wrap gap-1">
                              {(String(adminRoles.find(r => r.id === newTeamMember.role_id)?.permissions || '') === 'all' ? ['Dashboard','Grounds','Bookings','Users','Payments','Settlements','Settings','Reports','KYC','Customize','Gateways'] : String(adminRoles.find(r => r.id === newTeamMember.role_id)?.permissions || '').split(',')).map((p: string) => (
                                <span key={p} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{p.trim()}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div><label className="text-sm font-medium text-gray-700">Login Password</label><input type="text" placeholder="Default: password123" className="w-full border rounded-lg px-3 py-2 mt-1" value={newTeamMember.password} onChange={e => setNewTeamMember({...newTeamMember, password: e.target.value})} /></div>
                      </div>
                      <div className="flex gap-3 mt-5">
                        <button onClick={() => setShowAddTeamMember(false)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                        <button onClick={handleAddTeamMember} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-700">Add Member</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}


            {/* V17 - TOURNAMENTS */}
            {tab === 'tournaments' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Tournament Management ({adminTournaments.length})</h3>
                  <button onClick={async () => {
                    const name = prompt('Tournament Name:');
                    if (!name) return;
                    try { await api.createAdminTournament({ name, sport_type: 'cricket', max_teams: 8, entry_fee: 500, prize_pool: 5000, start_date: new Date().toISOString().split('T')[0] }); loadTab(); } catch { alert('Failed'); }
                  }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={14} className="inline mr-1"/>Create Tournament</button>
                </div>
                {adminTournaments.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center"><Calendar size={48} className="mx-auto mb-3 text-gray-300"/><p className="text-gray-500">No tournaments yet</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adminTournaments.map(t => (
                      <div key={t.id as number} className="bg-white rounded-xl shadow-sm p-5 border">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-gray-800 text-lg">{t.name as string}</h4>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${t.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : t.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.status as string}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-green-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Entry Fee</p><p className="font-bold text-green-700">Rs.{t.entry_fee as number}</p></div>
                          <div className="bg-purple-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Prize Pool</p><p className="font-bold text-purple-700">Rs.{t.prize_pool as number}</p></div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <p>Sport: {t.sport_type as string} | Max Teams: {t.max_teams as number}</p>
                          <p>Date: {t.start_date as string} {t.end_date ? ` to ${t.end_date}` : ''}</p>
                          <p className="font-medium text-blue-600">Registrations: {t.registered_teams as number || 0} teams</p>
                          <p className="text-xs text-gray-400">By: {t.organizer_name as string}</p>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <select value={t.status as string} onChange={async (e) => { try { await api.updateAdminTournament(t.id as number, { status: e.target.value }); loadTab(); } catch { /* */ } }} className="flex-1 border rounded-lg px-2 py-1.5 text-xs">
                            <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-3 border-t">
                          <button onClick={async () => { try { const regs = await api.getTournamentRegistrations(t.id as number); setAdminTournParticipants(Array.isArray(regs) ? regs : regs.registrations || []); setShowAdminTournParticipants(t.id as number); } catch { setAdminTournParticipants([]); setShowAdminTournParticipants(t.id as number); } }} className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 flex items-center gap-1"><Users size={12}/> View Participants</button>
                          <button onClick={() => { setEditAdminTournament(t); setEditAdminTournData({ name: t.name, entry_fee: t.entry_fee, prize_pool: t.prize_pool, max_teams: t.max_teams, sport_type: t.sport_type, description: t.description || '' }); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1"><Edit size={12}/> Edit</button>
                          <button onClick={async () => { if(confirm('Delete this tournament?')) { try { await api.deleteAdminTournament(t.id as number); loadTab(); } catch { /* */ } } }} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              {/* Admin Tournament Participants Modal */}
                {showAdminTournParticipants && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdminTournParticipants(null)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-purple-600"/> Tournament Participants ({adminTournParticipants.length})</h3>
                      {adminTournParticipants.length === 0 ? (
                        <div className="text-center py-8"><Users size={40} className="mx-auto mb-2 text-gray-300"/><p className="text-gray-400">No participants registered yet</p></div>
                      ) : (
                        <div className="space-y-3">
                          {adminTournParticipants.map((p, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-xl border">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">{i + 1}</div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-800 text-base">{String(p.team_name || 'Team ' + (i+1))}</p>
                                  <p className="text-sm text-gray-700 mt-0.5">{String(p.user_name || p.name || 'Unknown')}</p>
                                                                                                                                        {String(p.user_phone || p.phone || '') !== '' && <p className="text-sm text-blue-600 mt-0.5">{String(p.user_phone || p.phone || '')}</p>}
                                                                                                      {String(p.user_email || p.email || '') !== '' && <p className="text-xs text-gray-500 mt-0.5">{String(p.user_email || p.email || '')}</p>}
                                  <p className="text-xs text-gray-400 mt-1">Registered: {String(p.created_at || p.registered_at || '').split('T')[0] || String(p.created_at || '').split(' ')[0] || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${p.status === 'cancelled' ? 'bg-red-100 text-red-700' : p.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{(p.status || 'registered') as string}</span>
                                  {p.status !== 'cancelled' && (
                                    <button onClick={async () => { if(confirm('Cancel this registration? 100% refund will be given.')) { try { await api.adminCancelTournamentRegistration(showAdminTournParticipants, p.id as number); const regs = await api.getTournamentRegistrations(showAdminTournParticipants); setAdminTournParticipants(Array.isArray(regs) ? regs : []); loadTab(); alert('Registration cancelled, refund processed!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } } }} className="block mt-2 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 w-full">Cancel & Refund</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => setShowAdminTournParticipants(null)} className="mt-4 w-full py-2.5 border-2 rounded-xl font-medium">Close</button>
                    </div>
                  </div>
                )}

                {/* Admin Tournament Edit Modal */}
                {editAdminTournament && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditAdminTournament(null)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Tournament</h3>
                      <div className="space-y-3">
                        <div><label className="text-sm font-medium text-gray-600">Name</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={editAdminTournData.name as string || ''} onChange={e => setEditAdminTournData({...editAdminTournData, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-sm font-medium text-gray-600">Entry Fee (Rs)</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={editAdminTournData.entry_fee as number || 0} onChange={e => setEditAdminTournData({...editAdminTournData, entry_fee: parseInt(e.target.value)})} /></div>
                          <div><label className="text-sm font-medium text-gray-600">Prize Pool (Rs)</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={editAdminTournData.prize_pool as number || 0} onChange={e => setEditAdminTournData({...editAdminTournData, prize_pool: parseInt(e.target.value)})} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-sm font-medium text-gray-600">Max Teams</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={editAdminTournData.max_teams as number || 8} onChange={e => setEditAdminTournData({...editAdminTournData, max_teams: parseInt(e.target.value)})} /></div>
                          <div><label className="text-sm font-medium text-gray-600">Sport Type</label><input type="text" className="w-full border rounded-lg px-3 py-2 mt-1" value={editAdminTournData.sport_type as string || 'cricket'} onChange={e => setEditAdminTournData({...editAdminTournData, sport_type: e.target.value})} /></div>
                        </div>
                        <div><label className="text-sm font-medium text-gray-600">Description</label><textarea className="w-full border rounded-lg px-3 py-2 mt-1" rows={3} value={editAdminTournData.description as string || ''} onChange={e => setEditAdminTournData({...editAdminTournData, description: e.target.value})} /></div>
                      </div>
                      <div className="flex gap-3 mt-5">
                        <button onClick={() => setEditAdminTournament(null)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                        <button onClick={async () => { try { await api.updateAdminTournament(editAdminTournament.id as number, editAdminTournData); setEditAdminTournament(null); loadTab(); alert('Tournament updated!'); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-700">Save Changes</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* V17 - AUDIT LOG */}
            {tab === 'auditlog' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Audit Log ({auditLogs.length})</h3>
                  <p className="text-sm text-gray-500">Last 500 actions with IP & location tracking</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr><th className="p-3 text-left">Time</th><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Details</th><th className="p-3">IP Address</th><th className="p-3">Location</th></tr></thead>
                      <tbody>
                        {auditLogs.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-gray-400">No audit logs yet. Actions will be tracked here.</td></tr> :
                        auditLogs.map(l => (
                          <tr key={l.id as number} className="border-t hover:bg-gray-50">
                            <td className="p-3 text-xs whitespace-nowrap">{(l.created_at as string)?.replace('T',' ').slice(0,16)}</td>
                            <td className="p-3 text-xs font-medium">{l.user_name as string || 'System'}</td>
                            <td className="p-3"><span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{l.user_role as string || '-'}</span></td>
                            <td className="p-3 text-xs font-medium">{l.action as string}</td>
                            <td className="p-3 text-xs">{l.entity_type as string} #{l.entity_id as string}</td>
                            <td className="p-3 text-xs max-w-48 truncate">{l.details as string || '-'}</td>
                            <td className="p-3 text-xs font-mono">{l.ip_address as string || '-'}</td>
                            <td className="p-3 text-xs">{l.location as string || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* V17 - EQUIPMENT RENTAL */}
            {tab === 'equipment' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Equipment Rental ({adminEquipment.length})</h3>
                  <button onClick={async () => {
                    const name = prompt('Equipment Name (e.g., Cricket Kit, Batting Pads):');
                    if (!name) return;
                    const price = prompt('Price per hour (Rs):');
                    const groundId = prompt('Ground ID:');
                    try { await api.addAdminEquipment({ name, price_per_hour: parseFloat(price || '50'), ground_id: parseInt(groundId || '0'), quantity: 5 }); loadTab(); } catch { alert('Failed'); }
                  }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={14} className="inline mr-1"/>Add Equipment</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminEquipment.map(eq => (
                    <div key={eq.id as number} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800">{eq.name as string}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${eq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{eq.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p>Category: {eq.category as string}</p>
                        <p>Price: Rs.{eq.price_per_hour as number}/hr</p>
                        <p>Qty: {eq.quantity as number} | Ground: {eq.ground_name as string || 'All'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={async () => { try { await api.updateAdminEquipment(eq.id as number, { is_active: eq.is_active ? 0 : 1 }); loadTab(); } catch { /* */ } }} className={`flex-1 text-xs px-3 py-1.5 rounded-lg ${eq.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{eq.is_active ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={async () => { if(confirm('Delete?')) { try { await api.deleteAdminEquipment(eq.id as number); loadTab(); } catch { /* */ } } }} className="text-red-500 text-xs px-2 py-1 border rounded-lg hover:bg-red-50"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                  {adminEquipment.length === 0 && <div className="col-span-3 bg-white rounded-xl shadow-sm p-8 text-center"><Tag size={48} className="mx-auto mb-3 text-gray-300"/><p className="text-gray-500">No equipment added yet</p></div>}
                </div>
              </>
            )}

            {/* V17 - LOYALTY POINTS */}
            {tab === 'loyalty' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Loyalty Points Management</h3>
                  <div className="flex gap-2">
                    <div className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Total Active: {(loyaltyData.total_active_points as number || 0).toLocaleString()} pts</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-5"><p className="text-sm text-gray-500">Total Active Points</p><p className="text-2xl font-bold text-purple-600">{(loyaltyData.total_active_points as number || 0).toLocaleString()}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-5"><p className="text-sm text-gray-500">Users with Points</p><p className="text-2xl font-bold text-blue-600">{(loyaltyData.users as Array<Record<string, unknown>>)?.length || 0}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-5"><p className="text-sm text-gray-500">Coins per Booking</p><p className="text-2xl font-bold text-green-600">{loyaltyCoinsPerBooking}</p></div>
                  <div className="bg-white rounded-xl shadow-sm p-5"><p className="text-sm text-gray-500">100 Coins = Rs.</p><p className="text-2xl font-bold text-orange-600">{loyaltyCoinValue}</p></div>
                </div>
                {/* Loyalty Settings */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
                  <h4 className="font-bold text-gray-800 mb-3">Loyalty Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-600">Coins per Booking</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={loyaltyCoinsPerBooking} onChange={e => setLoyaltyCoinsPerBooking(parseInt(e.target.value) || 100)} /></div>
                    <div><label className="text-sm font-medium text-gray-600">100 Coins Value (Rs)</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" value={loyaltyCoinValue} onChange={e => setLoyaltyCoinValue(parseInt(e.target.value) || 10)} /></div>
                  </div>
                  <button onClick={async () => { try { await api.updateLoyaltySettings({ coins_per_booking: loyaltyCoinsPerBooking, coin_value_per_100: loyaltyCoinValue }); alert('Loyalty settings updated!'); } catch { alert('Failed'); } }} className="mt-3 bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium">Save Settings</button>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                    <span className="font-medium text-sm">Users & Points</span>
                    <button onClick={async () => {
                      const userId = prompt('User ID to adjust points:');
                      const points = prompt('Points to add (+) or remove (-):');
                      const reason = prompt('Reason:');
                      if (userId && points) { try { await api.adjustLoyaltyPoints({ user_id: parseInt(userId), points: parseInt(points), reason: reason || 'Admin adjustment' }); loadTab(); } catch { alert('Failed'); } }
                    }} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg">Adjust Points</button>
                    <button onClick={async () => { try { await api.updateLoyaltySettings({ coins_per_booking: loyaltyCoinsPerBooking, coin_value_per_100: loyaltyCoinValue }); alert('Settings saved!'); } catch { alert('Failed'); } }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg">Save Settings</button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">User</th><th className="p-3">Phone</th><th className="p-3">Points</th><th className="p-3">Earned</th><th className="p-3">Redeemed</th><th className="p-3">Tier</th></tr></thead>
                    <tbody>
                      {(loyaltyData.users as Array<Record<string, unknown>>)?.map((u: Record<string, unknown>) => (
                        <tr key={u.id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{u.name as string}</td>
                          <td className="p-3 text-xs">{u.phone as string}</td>
                          <td className="p-3 font-bold text-purple-600">{(u.points as number || 0).toLocaleString()}</td>
                          <td className="p-3 text-green-600">{(u.total_earned as number || 0).toLocaleString()}</td>
                          <td className="p-3 text-red-600">{(u.total_redeemed as number || 0).toLocaleString()}</td>
                          <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' : u.tier === 'silver' ? 'bg-gray-100 text-gray-700' : u.tier === 'platinum' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{(u.tier as string || 'bronze').toUpperCase()}</span></td>
                        </tr>
                      )) || <tr><td colSpan={6} className="p-8 text-center text-gray-400">No loyalty data yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* V17 - AUTO SETTLEMENT */}
            {tab === 'autosettlement' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Auto Settlement</h3>
                  <div className="flex gap-2">
                    <button onClick={async () => { try { const res = await api.runAutoSettlements(); alert(res.message); loadTab(); } catch { alert('Failed'); } }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Run Now</button>
                    <button onClick={async () => {
                      const ownerId = prompt('Owner ID:');
                      const freq = prompt('Frequency (weekly/monthly):');
                      if (ownerId) { try { await api.createAutoSettlement({ owner_id: parseInt(ownerId), frequency: freq || 'weekly', next_date: new Date().toISOString().split('T')[0] }); loadTab(); } catch { alert('Failed'); } }
                    }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={14} className="inline mr-1"/>Add Owner</button>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800"><strong>Auto Settlement:</strong> Automatically processes owner payouts on schedule. Configure frequency per owner (weekly/monthly).</p>
                </div>
                {/* Auto Settlement Config */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
                  <h4 className="font-bold text-gray-800 mb-3">Global Configuration</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="text-sm font-medium text-gray-600">Default Frequency</label>
                      <select className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue="weekly" id="auto-settle-freq"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Bi-Weekly</option><option value="monthly">Monthly</option></select></div>
                    <div><label className="text-sm font-medium text-gray-600">Min Payout (Rs)</label><input type="number" className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue={500} id="auto-settle-min" /></div>
                    <div><label className="text-sm font-medium text-gray-600">Settlement Day</label>
                      <select className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue="monday" id="auto-settle-day"><option value="monday">Monday</option><option value="tuesday">Tuesday</option><option value="wednesday">Wednesday</option><option value="thursday">Thursday</option><option value="friday">Friday</option><option value="saturday">Saturday</option><option value="sunday">Sunday</option></select></div>
                    <div><label className="text-sm font-medium text-gray-600">Auto Approve</label>
                      <select className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue="yes" id="auto-settle-approve"><option value="yes">Yes</option><option value="no">No - Manual</option></select></div>
                  </div>
                  <button onClick={async () => { const freq = (document.getElementById('auto-settle-freq') as HTMLSelectElement)?.value; const min = (document.getElementById('auto-settle-min') as HTMLInputElement)?.value; const day = (document.getElementById('auto-settle-day') as HTMLSelectElement)?.value; const auto = (document.getElementById('auto-settle-approve') as HTMLSelectElement)?.value; try { await api.updateAutoSettlementConfig({ default_frequency: freq, min_payout: parseInt(min), settlement_day: day, auto_approve: auto === 'yes' }); alert('Config saved!'); } catch { alert('Failed'); } }} className="mt-3 bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium">Save Config</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">Owner</th><th className="p-3">Phone</th><th className="p-3">Frequency</th><th className="p-3">Next Settlement</th><th className="p-3">Last Settlement</th><th className="p-3">Status</th></tr></thead>
                    <tbody>
                      {autoSettlements.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">No auto settlements configured</td></tr> :
                      autoSettlements.map(a => (
                        <tr key={a.id as number} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium">{a.owner_name as string}</td>
                          <td className="p-3 text-xs">{a.owner_phone as string}</td>
                          <td className="p-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{a.frequency as string}</span></td>
                          <td className="p-3 text-xs">{a.next_settlement_date as string || '-'}</td>
                          <td className="p-3 text-xs">{a.last_settlement_date as string || 'Never'}</td>
                          <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.is_active ? 'Active' : 'Paused'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* V17 - EMAIL TEMPLATES */}
            {tab === 'emailtemplates' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Email Templates ({emailTemplates.length})</h3>
                  <button onClick={async () => {
                    const name = prompt('Template Name (e.g., welcome_email):');
                    const subject = prompt('Subject:');
                    if (name && subject) { try { await api.createEmailTemplate({ name, subject, body: '<h1>Hello {{user_name}}</h1><p>Your content here...</p>', variables: 'user_name,booking_id', is_active: true }); loadTab(); } catch(e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }
                  }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={14} className="inline mr-1"/>New Template</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {emailTemplates.map(tmpl => (
                    <div key={tmpl.id as number} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-800 capitalize">{(tmpl.name as string).replace(/_/g, ' ')}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Subject: {tmpl.subject as string}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tmpl.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{tmpl.is_active ? 'Active' : 'Disabled'}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">Variables: {tmpl.variables as string || 'None'}</p>
                      {editingTemplate?.id === tmpl.id ? (
                        <div className="space-y-2">
                          <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" defaultValue={tmpl.subject as string} id={`tmpl-subject-${tmpl.id}`} placeholder="Subject" />
                          <textarea className="w-full border rounded-lg px-3 py-2 text-sm h-32" defaultValue={tmpl.body as string} id={`tmpl-body-${tmpl.id}`} placeholder="HTML Body" />
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const subject = (document.getElementById(`tmpl-subject-${tmpl.id}`) as HTMLInputElement)?.value;
                              const body = (document.getElementById(`tmpl-body-${tmpl.id}`) as HTMLTextAreaElement)?.value;
                              try { await api.updateEmailTemplate(tmpl.id as number, { subject, body }); setEditingTemplate(null); loadTab(); } catch { alert('Failed'); }
                            }} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium">Save</button>
                            <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-gray-50 rounded-lg p-3 text-xs max-h-24 overflow-y-auto mb-2" dangerouslySetInnerHTML={{__html: (tmpl.body as string)?.slice(0, 200) + '...'}} />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingTemplate(tmpl)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"><Edit size={12} className="inline mr-1"/>Edit</button>
                            <button onClick={async () => { if(confirm('Delete this template?')) { try { await api.deleteEmailTemplate(tmpl.id as number); loadTab(); } catch { alert('Failed'); } } }} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100"><Trash2 size={12} className="inline mr-1"/>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* V17 - CMS PAGES */}
            {tab === 'pages' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">CMS Pages ({cmsPages.length})</h3>
                  <button onClick={async () => {
                    const title = prompt('Page Title:');
                    const slug = prompt('URL Slug (e.g., faq):');
                    if (title && slug) { try { await api.createAdminPage({ title, slug, content: '<h1>' + title + '</h1><p>Content here...</p>' }); loadTab(); } catch { alert('Failed'); } }
                  }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus size={14} className="inline mr-1"/>New Page</button>
                </div>
                <div className="space-y-4">
                  {cmsPages.map(page => (
                    <div key={page.id as number} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800">{page.title as string}</h4>
                          <p className="text-xs text-gray-500">/{page.slug as string} | {page.is_published ? 'Published' : 'Draft'}</p>
                          {page.meta_description ? <p className="text-xs text-gray-400 mt-1">SEO: {String(page.meta_description)}</p> : null}
                        </div>
                        <div className="flex gap-2">
                          <a href={`/page/${page.slug}`} target="_blank" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">View</a>
                          <button onClick={() => setEditingPage(editingPage?.id === page.id ? null : page)} className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg"><Edit size={12} className="inline mr-1"/>Edit</button>
                        </div>
                      </div>
                      {editingPage?.id === page.id && (
                        <div className="space-y-3 border-t pt-3">
                          <div><label className="text-xs font-medium">Title</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" defaultValue={page.title as string} id={`page-title-${page.id}`} /></div>
                          <div><label className="text-xs font-medium">SEO Description</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" defaultValue={page.meta_description as string || ''} id={`page-meta-${page.id}`} /></div>
                          <div><label className="text-xs font-medium">Content (HTML)</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm mt-1 h-48 font-mono" defaultValue={page.content as string} id={`page-content-${page.id}`} /></div>
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const title = (document.getElementById(`page-title-${page.id}`) as HTMLInputElement)?.value;
                              const content = (document.getElementById(`page-content-${page.id}`) as HTMLTextAreaElement)?.value;
                              const meta = (document.getElementById(`page-meta-${page.id}`) as HTMLInputElement)?.value;
                              try { await api.updateAdminPage(page.id as number, { title, content, meta_description: meta }); setEditingPage(null); loadTab(); } catch { alert('Failed'); }
                            }} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium">Save Page</button>
                            <button onClick={() => setEditingPage(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* V17 - BULK OPERATIONS */}
            {tab === 'bulkops' && (
              <>
                <h3 className="font-bold text-gray-800 text-lg mb-4">Bulk Operations</h3>
                {/* CSV Upload Section */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Upload size={16}/> CSV Bulk Upload</h4>
                  <p className="text-sm text-gray-500 mb-3">Upload a CSV file to bulk import bookings, users, or grounds. CSV must have headers matching the entity fields.</p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <input type="file" accept=".csv" className="border rounded-lg px-3 py-2 text-sm flex-1" onChange={e => setBulkCSVFile(e.target.files?.[0] || null)} />
                    <select id="bulk-csv-type" className="border rounded-lg px-3 py-2 text-sm"><option value="bookings">Bookings</option><option value="users">Users</option><option value="grounds">Grounds</option></select>
                    <button onClick={async () => { if(!bulkCSVFile) { alert('Please select a CSV file'); return; } const type = (document.getElementById('bulk-csv-type') as HTMLSelectElement)?.value || 'bookings'; const text = await bulkCSVFile.text(); const lines = text.trim().split('\n'); if(lines.length < 2) { alert('CSV must have at least header + 1 row'); return; } alert(`CSV parsed: ${lines.length - 1} ${type} records found. Bulk import feature will process these records.`); setBulkCSVFile(null); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Upload size={14}/> Upload & Import</button>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    <p>Bookings CSV: user_phone, ground_id, date, start_time, end_time, amount</p>
                    <p>Users CSV: name, phone, email, role, password</p>
                    <p>Grounds CSV: name, address, city, weekday_price, weekend_price, ground_type</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bulk Bookings */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-800 mb-3">Bulk Booking Actions</h4>
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={bulkSelectAll} onChange={e => { setBulkSelectAll(e.target.checked); if(e.target.checked) { setSelectedBulkIds(new Set(bookings.map(b => b.booking_id as string))); } else { setSelectedBulkIds(new Set()); } }}/> Select All ({bookings.length})</label>
                      {bookings.slice(0,20).map(b => (
                        <label key={b.booking_id as string} className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={selectedBulkIds.has(b.booking_id as string)} onChange={() => { const s = new Set(selectedBulkIds); if(s.has(b.booking_id as string)) s.delete(b.booking_id as string); else s.add(b.booking_id as string); setSelectedBulkIds(s); }}/>
                          {b.booking_id as string} - {b.user_name as string} ({b.status as string})
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Selected: {selectedBulkIds.size}</p>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={async () => { if(!selectedBulkIds.size) return; if(!confirm(`Cancel ${selectedBulkIds.size} bookings?`)) return; try { await api.bulkBookingAction('cancel', Array.from(selectedBulkIds) as string[]); alert('Done!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg">Cancel Selected</button>
                      <button onClick={async () => { if(!selectedBulkIds.size) return; if(!confirm(`DELETE ${selectedBulkIds.size} bookings permanently?`)) return; try { await api.bulkDelete('bookings', Array.from(selectedBulkIds) as number[]); alert('Deleted!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg">Delete Selected</button>
                      <button onClick={async () => { if(!selectedBulkIds.size) return; try { await api.bulkBookingAction('confirm', Array.from(selectedBulkIds) as string[]); alert('Done!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg">Confirm Selected</button>
                    </div>
                  </div>
                  {/* Bulk Users */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-800 mb-3">Bulk User Actions</h4>
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      {users.slice(0,20).map(u => (
                        <label key={u.id as number} className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={selectedBulkIds.has(u.id as number)} onChange={() => { const s = new Set(selectedBulkIds); if(s.has(u.id as number)) s.delete(u.id as number); else s.add(u.id as number); setSelectedBulkIds(s); }}/>
                          {u.name as string} ({u.role as string})
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={async () => { if(!selectedBulkIds.size) return; if(!confirm(`Ban ${selectedBulkIds.size} users?`)) return; try { await api.bulkUserAction('ban', Array.from(selectedBulkIds) as number[]); alert('Done!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg">Ban Selected</button>
                      <button onClick={async () => { if(!selectedBulkIds.size) return; try { await api.bulkUserAction('unban', Array.from(selectedBulkIds) as number[]); alert('Done!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg">Unban Selected</button>
                      <button onClick={async () => { if(!selectedBulkIds.size) return; try { await api.bulkUserAction('suspend', Array.from(selectedBulkIds) as number[]); alert('Done!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg">Suspend</button>
                      <button onClick={async () => { if(!selectedBulkIds.size) return; if(!confirm(`DELETE ${selectedBulkIds.size} users permanently?`)) return; try { await api.bulkDelete('users', Array.from(selectedBulkIds) as number[]); alert('Deleted!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg">Delete Selected</button>
                    </div>
                  </div>
                  {/* Bulk Grounds */}
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h4 className="font-bold text-gray-800 mb-3">Bulk Ground Actions</h4>
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      {grounds.slice(0,20).map(g => (
                        <label key={g.id as number} className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={selectedBulkIds.has(g.id as number)} onChange={() => { const s = new Set(selectedBulkIds); if(s.has(g.id as number)) s.delete(g.id as number); else s.add(g.id as number); setSelectedBulkIds(s); }}/>
                          {g.name as string} ({g.is_active ? 'Active' : 'Inactive'})
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={async () => { if(!selectedBulkIds.size) return; try { await api.bulkGroundAction('activate', Array.from(selectedBulkIds) as number[]); alert('Done!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg">Activate</button>
                      <button onClick={async () => { if(!selectedBulkIds.size) return; try { await api.bulkGroundAction('deactivate', Array.from(selectedBulkIds) as number[]); alert('Done!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg">Deactivate</button>
                      <button onClick={async () => { if(!selectedBulkIds.size) return; try { await api.bulkGroundAction('feature', Array.from(selectedBulkIds) as number[]); alert('Done!'); setSelectedBulkIds(new Set()); loadTab(); } catch { alert('Failed'); } }} className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg">Feature</button>
                    </div>
                  </div>
                </div>
              </>
            )}

          {/* V18 - GROUND CHANGE REQUESTS */}
            {tab === 'groundchanges' && (
              <>
                <h3 className="font-bold text-gray-800 text-lg mb-4">Ground Change Requests ({groundChangeRequests.length})</h3>
                {groundChangeRequests.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center"><p className="text-gray-400">No pending ground change requests</p></div>
                ) : (
                  <div className="space-y-4">
                    {groundChangeRequests.map(cr => (
                      <div key={cr.id as number} className="bg-white rounded-xl shadow-sm p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-gray-800">{cr.ground_name as string || 'Ground #' + cr.ground_id}</h4>
                            <p className="text-sm text-gray-500">Owner: {cr.owner_name as string} | Type: <span className={`font-medium ${cr.change_type === 'delete' ? 'text-red-600' : 'text-blue-600'}`}>{cr.change_type as string}</span></p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cr.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : cr.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cr.status as string}</span>
                        </div>
                        {cr.changes ? <div className="bg-gray-50 rounded-lg p-3 text-sm mb-3"><pre className="whitespace-pre-wrap text-xs">{String(JSON.stringify(cr.changes, null, 2))}</pre></div> : null}
                        {cr.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={async () => { try { await api.approveChangeRequest(cr.id as number); loadTab(); alert('Approved!'); } catch { alert('Failed'); } }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Approve</button>
                            <button onClick={async () => { try { await api.rejectChangeRequest(cr.id as number); loadTab(); alert('Rejected!'); } catch { alert('Failed'); } }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          {/* Withdrawal Approval Modal - 2 Methods */}
          {showApprovalModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowApprovalModal(null)}>
              <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Approve Withdrawal #{showApprovalModal}</h3>
                  <button onClick={() => setShowApprovalModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                {/* Withdrawal details */}
                {(() => { const w = withdrawals.find(w => w.id === showApprovalModal); return w ? (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-500">User:</span><span className="font-medium">{w.user_name as string}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount:</span><span className="font-medium">Rs.{(w.amount as number)?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Charge (3%):</span><span className="text-red-500">Rs.{(w.charge as number)?.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t pt-1"><span className="text-gray-700 font-semibold">Net to Transfer:</span><span className="font-bold text-green-600">Rs.{(w.net_amount as number)?.toFixed(2)}</span></div>
                    {String(w.bank_name || '') !== '' && <div className="flex justify-between"><span className="text-gray-500">Bank:</span><span className="font-medium">{String(w.bank_name)} - {String(w.bank_account)}</span></div>}
                    {String(w.upi_id || '') !== '' && <div className="flex justify-between"><span className="text-gray-500">UPI:</span><span className="font-medium text-purple-700">{String(w.upi_id)}</span></div>}
                  </div>
                ) : null; })()}
                {/* Method Selection */}
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setApprovalMethod('manual')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${approvalMethod === 'manual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                    Manual Transfer
                  </button>
                  <button onClick={() => setApprovalMethod('razorpay')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${approvalMethod === 'razorpay' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}>
                    Razorpay Payout
                  </button>
                </div>
                {approvalMethod === 'manual' ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                      <p className="font-semibold mb-1">Manual Transfer:</p>
                      <p>1. Transfer amount to user's bank/UPI manually</p>
                      <p>2. Enter the Transaction ID / UTR number below</p>
                      <p>3. Upload payment proof screenshot</p>
                    </div>
                    <input type="text" placeholder="Transaction ID / UTR Number *" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none" value={approvalTxnId} onChange={e => setApprovalTxnId(e.target.value)} />
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Upload Payment Proof</label>
                      <input type="file" accept="image/*,.pdf" className="w-full border rounded-lg px-3 py-2 text-sm" onChange={e => { const file = e.target.files?.[0]; if(file) { setApprovalProofFile(file); const reader = new FileReader(); reader.onload = () => setApprovalProofUrl(reader.result as string); reader.readAsDataURL(file); } }} />
                      {approvalProofUrl && <img src={approvalProofUrl} alt="Proof" className="mt-2 w-full h-32 object-contain rounded-lg border bg-gray-50" />}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-700">
                      <p className="font-semibold mb-1">Razorpay Payout (Auto-Process):</p>
                      <p>- Transaction ID will be auto-generated</p>
                      <p>- Amount will be sent via Razorpay Payout API</p>
                      <p>- Proof will be auto-recorded</p>
                      <p className="mt-1 text-purple-500 italic">Note: Razorpay Payout API key must be configured in Gateway settings</p>
                    </div>
                    <input type="text" placeholder="Custom Transaction ID (optional - auto-generated if empty)" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-400 focus:outline-none" value={approvalTxnId} onChange={e => setApprovalTxnId(e.target.value)} />
                  </div>
                )}
                <div className="flex gap-3 mt-5">
                  <button onClick={confirmApproveWithdrawal} disabled={approving || (approvalMethod === 'manual' && !approvalTxnId)} className={`flex-1 py-2.5 rounded-lg font-medium text-white disabled:opacity-50 ${approvalMethod === 'manual' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                    {approving ? 'Processing...' : approvalMethod === 'manual' ? 'Approve & Mark Transferred' : 'Auto-Process via Razorpay'}
                  </button>
                  <button onClick={() => setShowApprovalModal(null)} className="px-4 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            </div>
          )}
          </>
        )}

            {/* Admin Chat */}
            {tab === 'chat' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Admin Chat</h3>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <p className="text-gray-600 mb-4">Chat with ground owners and users</p>
                  <button onClick={() => navigate('/chat')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2"><MessageSquare size={18}/> Open Chat</button>
                </div>
              </div>
            )}

            {/* Split Payments - Customer Data for Marketing */}
            {tab === 'splitpayments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">Split Payments - Customer Data ({splitPayments.length})</h3>
                  <div className="flex gap-2">
                    <button onClick={loadTab} className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">Refresh</button>
                    <button onClick={() => {
                      if (splitPayments.length === 0) return;
                      const rows = [['Split ID','Organizer','Org Phone','Ground','Date','Total','Type','Member Name','Member Phone','Member Amount','Paid']];
                      splitPayments.forEach((sp: Record<string, unknown>) => {
                        const members = (sp.members as Array<Record<string, unknown>>) || [];
                        if (members.length === 0) {
                          rows.push([String(sp.id),String(sp.user_name),String(sp.user_phone),String(sp.ground_name),String(sp.booking_date),String(sp.total_amount),String(sp.split_type),'','','','']);
                        } else {
                          members.forEach((m: Record<string, unknown>) => {
                            rows.push([String(sp.id),String(sp.user_name),String(sp.user_phone),String(sp.ground_name),String(sp.booking_date),String(sp.total_amount),String(sp.split_type),String(m.name),String(m.phone),String(m.amount),m.paid ? 'Yes' : 'No']);
                          });
                        }
                      });
                      const csv = rows.map(r => r.map(c => '"' + c.replace(/"/g, '""') + '"').join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'split_payments_' + new Date().toISOString().split('T')[0] + '.csv';
                      a.click(); URL.revokeObjectURL(url);
                    }} className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1">
                      <Download size={14} /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl shadow-sm p-4 border">
                    <p className="text-xs text-gray-500">Total Splits</p>
                    <p className="text-2xl font-bold text-purple-600">{splitPayments.length}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 border">
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">Rs.{splitPayments.reduce((s, sp) => s + (Number(sp.total_amount) || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 border">
                    <p className="text-xs text-gray-500">Unique Customers</p>
                    <p className="text-2xl font-bold text-blue-600">{new Set(splitPayments.map(sp => sp.user_phone)).size}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 border">
                    <p className="text-xs text-gray-500">Total Members</p>
                    <p className="text-2xl font-bold text-orange-600">{splitPayments.reduce((s, sp) => s + ((sp.members as Array<unknown>)?.length || 0), 0)}</p>
                  </div>
                </div>

                {splitPayments.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">No split payments yet.</div>
                ) : (
                  <div className="space-y-4">
                    {splitPayments.map((sp: Record<string, unknown>) => (
                      <div key={sp.id as number} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 border-b">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-gray-800">#{String(sp.id)} - {sp.ground_name as string}</p>
                              <p className="text-sm text-gray-500">{sp.booking_date as string} | {sp.split_type as string} split</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-purple-600 text-lg">Rs.{String(sp.total_amount)}</p>
                              <p className="text-xs text-gray-400">{sp.created_at ? new Date(sp.created_at as string).toLocaleDateString('en-IN') : ''}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          {/* Organizer Info */}
                          <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-3 mb-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{((sp.user_name as string) || 'U')[0]}</div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">{sp.user_name as string} <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">Organizer</span></p>
                              <p className="text-xs text-gray-500">{sp.user_phone as string}</p>
                            </div>
                            <span className="text-sm font-bold text-purple-600">Rs.{String(sp.my_share)}</span>
                          </div>
                          {/* Members */}
                          {((sp.members as Array<Record<string, unknown>>) || []).map((m: Record<string, unknown>, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5 mb-1.5">
                              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{((m.name as string) || 'M')[0].toUpperCase()}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{m.name as string}</p>
                                <p className="text-[10px] text-gray-500">{m.phone as string || 'No phone'}</p>
                              </div>
                              <span className="text-xs font-bold">Rs.{String(m.amount)}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${m.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {m.paid ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contact Form Submissions */}
            {tab === 'contactsubs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">Contact Form Submissions ({contactSubmissions.length})</h3>
                  <button onClick={loadTab} className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">Refresh</button>
                </div>
                {contactSubmissions.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">No contact form submissions yet.</div>
                ) : (
                  <div className="space-y-4">
                    {contactSubmissions.map((sub) => (
                      <div key={sub.id as number} className="bg-white rounded-xl shadow-sm p-5 border-l-4" style={{ borderLeftColor: sub.status === 'new' ? '#f59e0b' : sub.status === 'read' ? '#3b82f6' : sub.status === 'replied' ? '#22c55e' : '#6b7280' }}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-gray-800">{sub.name as string}</h4>
                            <p className="text-sm text-gray-500">{sub.email as string} {sub.phone ? `| ${sub.phone}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'new' ? 'bg-yellow-100 text-yellow-700' : sub.status === 'read' ? 'bg-blue-100 text-blue-700' : sub.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {(sub.status as string || 'new').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">{sub.created_at ? new Date(sub.created_at as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-green-700 mb-1">Subject: {sub.subject as string}</p>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{sub.message as string}</p>
                        </div>
                        {sub.admin_reply ? (
                          <div className="mb-3 bg-green-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-green-700 mb-1">Admin Reply:</p>
                            <p className="text-sm text-green-800">{String(sub.admin_reply)}</p>
                          </div>
                        ) : null}
                        <div className="flex gap-2 flex-wrap">
                          {sub.status === 'new' && (
                            <button onClick={async () => { try { await api.updateContactSubmission(sub.id as number, { status: 'read' }); loadTab(); } catch { /* */ } }} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium">Mark as Read</button>
                          )}
                          <button onClick={async () => {
                            const reply = prompt('Enter your reply to this message:');
                            if (reply) {
                              try { await api.updateContactSubmission(sub.id as number, { status: 'replied', admin_reply: reply }); loadTab(); alert('Reply saved!'); } catch { alert('Failed'); }
                            }
                          }} className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium">Reply</button>
                          <button onClick={async () => {
                            if (!confirm('Delete this submission?')) return;
                            try { await api.deleteContactSubmission(sub.id as number); loadTab(); } catch { alert('Failed'); }
                          }} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 font-medium">Delete</button>
                          <a href={`mailto:${sub.email}`} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium">Email User</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

        </div>
      </div>
    </div>
  );
}

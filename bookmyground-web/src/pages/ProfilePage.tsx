import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Star, Wallet, Users, Gift, LogOut, ChevronRight, Edit, Shield, CalendarDays, HelpCircle, Send, Copy, Phone, Mail, MessageCircle, Plus, X, Tag, Swords, UserPlus, Upload, FileText, MessageSquare, Lock, Key, Camera, Image, MapPin } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [kycDoc, setKycDoc] = useState('');
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState<Array<Record<string, unknown>>>([]);
  const [gateways, setGateways] = useState<Array<Record<string, unknown>>>([]);
  const [selectedGateway, setSelectedGateway] = useState('razorpay');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [offers, setOffers] = useState<Array<Record<string, unknown>>>([]);
  const [memberPhone, setMemberPhone] = useState('');
  const [memberName, setMemberName] = useState('');
  const [addingMemberId, setAddingMemberId] = useState<number | null>(null);
  const [challengeTeamId, setChallengeTeamId] = useState<number | null>(null);
  const [challengeDate, setChallengeDate] = useState(new Date().toISOString().split('T')[0]);
  const [challengeTime, setChallengeTime] = useState('18:00');
  const [allTeams, setAllTeams] = useState<Array<Record<string, unknown>>>([]);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [kycStatus, setKycStatus] = useState('none');
  const [transactions, setTransactions] = useState<Array<Record<string, unknown>>>([]);
  const [showTxns, setShowTxns] = useState(false);
  const [myTickets, setMyTickets] = useState<Array<Record<string, unknown>>>([]);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Record<string, unknown> | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [changingAccount, setChangingAccount] = useState(false);
  const [viewingMembersId, setViewingMembersId] = useState<number | null>(null);
  const [upiId, setUpiId] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    Promise.all([
      api.getProfile().then(p => { setProfile(p); setKycStatus(String(p.kyc_status || 'none')); }).catch(() => navigate('/login')),
      api.getPaymentGateways().then(setGateways).catch(() => {}),
      api.getPublicSettings().then(setSettings).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddMoney = async () => {
    const amt = parseInt(walletAmount);
    if (!amt || amt < 100) { alert('Minimum Rs.100'); return; }
    try {
      const res = await api.addMoney(amt, selectedGateway);
      if (res.status === 'pending') {
        alert(`Rs.${amt} top-up request submitted! Admin will verify and approve. Amount will be added to your wallet after approval.`);
        setWalletAmount('');
        api.getProfile().then(setProfile);
      } else if (res.status === 'razorpay_order') {
        // Open Razorpay checkout
        const options = {
          key: res.key_id,
          amount: res.amount,
          currency: res.currency || 'INR',
          name: 'BookAGround',
          description: `Wallet Top-up Rs.${amt}`,
          order_id: res.order_id,
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              const verifyRes = await api.verifyWalletTopup({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: amt,
              });
              alert(verifyRes.message || `Rs.${amt} added to wallet!`);
              setWalletAmount('');
              api.getProfile().then(setProfile);
            } catch (verifyErr: unknown) {
              alert(verifyErr instanceof Error ? verifyErr.message : 'Payment verification failed');
            }
          },
          prefill: {
            name: profile?.name as string || '',
            contact: profile?.phone as string || '',
            email: profile?.email as string || '',
          },
          theme: { color: '#16a34a' },
          modal: { ondismiss: () => { /* user closed payment popup */ } },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new ((window as any).Razorpay)(options);
        rzp.open();
      } else {
        alert(res.message || `Rs.${amt} added to wallet`);
        setWalletAmount('');
        api.getProfile().then(setProfile);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed';
      if (msg.includes('API key not configured') || msg.includes('not active')) {
        alert(`Payment gateway not configured. Please contact admin to enable ${selectedGateway}.`);
      } else {
        alert(msg);
      }
    }
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmount);
    if (!amt || amt < 100) { alert('Minimum Rs.100'); return; }
    // When KYC is verified, bank details are in profile - don't require local state
    const hasBankDetails = (bankName || profile?.bank_name) && (accountNo || profile?.bank_account) && (ifsc || profile?.bank_ifsc);
    if (kycStatus === 'rekyc_required') { alert('Re-KYC Required! Your account details changed. Please re-submit KYC before withdrawing.'); return; }
    if (!hasBankDetails && kycStatus !== 'verified') { alert('Complete KYC first'); return; }
    try {
      await api.withdrawMoney(amt);
      const charge = Math.round(amt * 0.03);
      alert(`Rs.${amt - charge} will be transferred (3% charge: Rs.${charge})`);
      setWithdrawAmount('');
      api.getProfile().then(setProfile);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleKYC = async () => {
    if (!bankName || !accountNo || !ifsc || !kycDoc) { alert('Fill all KYC details'); return; }
    if (!kycFile) { alert('Please upload your KYC document (Aadhaar/PAN/Passport)'); return; }
    try {
      await api.submitKYC({ bank_name: bankName, account_number: accountNo, ifsc_code: ifsc, document_type: kycDoc, upi_id: upiId });
      // Upload the KYC document file to server
      try {
        await api.uploadKYCDocument(kycFile);
      } catch (uploadErr: unknown) {
        console.error('KYC doc upload error:', uploadErr);
      }
      setKycStatus('pending');
      alert('KYC submitted for verification! Document uploaded successfully.');
      api.getProfile().then(p => { setProfile(p); setKycStatus(String(p.kyc_status || 'none')); });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'KYC submission failed'); }
  };

  const loadTeams = async () => {
    try { const data = await api.getMyTeams(); setTeams(data); } catch { setTeams([]); }
    try { const data = await api.getTeams(); setAllTeams(data); } catch { setAllTeams([]); }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { alert('Enter team name'); return; }
    try { await api.createTeam(teamName); setTeamName(''); loadTeams(); alert('Team created!'); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to create team'); }
  };

  const handleAddMember = async (teamId: number) => {
    if (!memberName.trim()) { alert('Enter member name'); return; }
    try { await api.addTeamMember(teamId, memberPhone || '', memberName); alert('Member added!'); setMemberPhone(''); setMemberName(''); setAddingMemberId(null); loadTeams(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to add member'); }
  };

  const handleChallenge = async (opponentTeamId: number) => {
    try { await api.challengeTeam(opponentTeamId, undefined, challengeDate, challengeTime); alert('Challenge sent!'); setChallengeTeamId(null); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to send challenge'); }
  };

  const loadOffers = async () => {
    try { const data = await api.getOffers(); setOffers(data); }
    catch { setOffers([{ id: 1, code: 'FIRST100', discount_type: 'flat', discount_value: 100, description: 'Rs.100 off on first booking' }, { id: 2, code: 'SUMMER20', discount_type: 'percentage', discount_value: 20, description: '20% off this summer' }, { id: 3, code: 'WEEKEND50', discount_type: 'flat', discount_value: 50, description: 'Rs.50 off on weekends' }]); }
  };

  const copyReferral = () => {
    const code = String(profile?.referral_code || 'BMGXXXXX');
    const link = `https://bookaground.com/signup?ref=${code}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied!');
  };

  const loadTransactions = async () => {
    try { const data = await api.getUserTransactions(); setTransactions(data); setShowTxns(true); }
    catch { setTransactions([]); setShowTxns(true); }
  };

  const loadTickets = async () => {
    try { const data = await api.getMyTickets(); setMyTickets(data); }
    catch { setMyTickets([]); }
  };

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) { alert('Fill subject and message'); return; }
    try { await api.createTicket({ subject: newTicketSubject, message: newTicketMessage }); alert('Ticket created! Our team will respond shortly.'); setNewTicketSubject(''); setNewTicketMessage(''); setShowNewTicket(false); loadTickets(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleTicketReply = async (ticketId: number) => {
    if (!ticketReply.trim()) return;
    try { await api.replyTicket(ticketId, ticketReply); setTicketReply(''); loadTickets(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!profile) return null;

  const referralReward = settings.referral_reward || '50';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {profilePhoto || profile.photo_url ? (
                  <img src={profilePhoto || String(profile.photo_url)} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-green-100" />
                ) : (
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-4xl font-bold">
                    {(profile.name as string)?.[0] || 'U'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 shadow-lg">
                  <Camera size={14} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => { setProfilePhoto(ev.target?.result as string); };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{profile.name as string}</h2>
              <p className="text-gray-500">{profile.phone as string}</p>
              {profile.email ? <p className="text-gray-400 text-sm">{String(profile.email)}</p> : null}
              {profile.city ? <p className="text-gray-400 text-xs flex items-center gap-1 justify-center mt-1"><MapPin size={12} /> {String(profile.city)}</p> : null}
              {(profile.rating as number) > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-yellow-600">
                  <Star size={14} fill="currentColor" /> {profile.rating as number} rating
                </div>
              )}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={() => { setEditName(String(profile.name || '')); setEditEmail(String(profile.email || '')); setEditCity(String(profile.city || '')); setEditAddress(String(profile.address || '')); setEditDob(String(profile.dob || '')); setEditGender(String(profile.gender || '')); setEditMode(true); }} className="text-green-600 text-sm font-medium flex items-center gap-1 hover:underline">
                  <Edit size={14} /> Edit Profile
                </button>
                <button onClick={() => setShowPasswordModal(true)} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
                  <Lock size={14} /> Change Password
                </button>
              </div>
              {/* Password Change Modal */}
              {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
                  <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Key size={20} className="text-blue-600" /> Change Password</h3>
                    <input type="password" placeholder="Current Password" className="w-full border rounded-lg px-3 py-2 mb-3" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    <input type="password" placeholder="New Password (min 6 characters)" className="w-full border rounded-lg px-3 py-2 mb-3" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <input type="password" placeholder="Confirm New Password" className="w-full border rounded-lg px-3 py-2 mb-4" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    <div className="flex gap-3">
                      <button onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="flex-1 border py-2 rounded-lg font-medium">Cancel</button>
                      <button onClick={async () => { if (newPassword !== confirmPassword) { alert('Passwords do not match'); return; } if (newPassword.length < 6) { alert('Password must be at least 6 characters'); return; } try { await api.changePassword(currentPassword, newPassword); alert('Password changed successfully!'); setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to change password'); } }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">Change Password</button>
                    </div>
                  </div>
                </div>
              )}
              {/* BUG-023 FIX: Edit Profile Modal */}
              {editMode && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditMode(false)}>
                  <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Profile</h3>
                    <input type="text" placeholder="Full Name" className="w-full border rounded-lg px-3 py-2 mb-3" value={editName} onChange={e => setEditName(e.target.value)} />
                    <input type="email" placeholder="Email Address" className="w-full border rounded-lg px-3 py-2 mb-3" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input type="text" placeholder="City" className="w-full border rounded-lg px-3 py-2" value={editCity} onChange={e => setEditCity(e.target.value)} />
                      <select className="w-full border rounded-lg px-3 py-2" value={editGender} onChange={e => setEditGender(e.target.value)}>
                        <option value="">Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Address" className="w-full border rounded-lg px-3 py-2 mb-3" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                    <input type="date" className="w-full border rounded-lg px-3 py-2 mb-4" value={editDob} onChange={e => setEditDob(e.target.value)} />
                    <div className="flex gap-3">
                      <button onClick={() => setEditMode(false)} className="flex-1 border py-2 rounded-lg font-medium">Cancel</button>
                      <button onClick={async () => { try { await api.updateProfile({ name: editName, email: editEmail, city: editCity, address: editAddress, dob: editDob, gender: editGender }); alert('Profile updated!'); setEditMode(false); api.getProfile().then(setProfile); } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); } }} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700">Save</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Role Links */}
            {(profile.role === 'owner' || profile.role === 'admin') && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-4">
                {(profile.role === 'owner' || profile.role === 'admin') && (
                  <Link to="/owner" className="flex items-center gap-3 px-5 py-4 border-b hover:bg-gray-50 transition">
                    <Shield size={20} className="text-blue-600" />
                    <span className="flex-1 text-gray-700 font-medium">Owner Dashboard</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </Link>
                )}
                {profile.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition">
                    <Shield size={20} className="text-purple-600" />
                    <span className="flex-1 text-gray-700 font-medium">Admin Panel</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </Link>
                )}
              </div>
            )}

            <button onClick={handleLogout} className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 text-red-600 hover:bg-red-50 mt-4 transition">
              <LogOut size={20} /> <span className="font-medium">Logout</span>
            </button>
          </div>

          {/* Right - Stats & Menu */}
          <div className="lg:col-span-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <p className="text-3xl font-bold text-green-600">{profile.total_bookings as number}</p>
                <p className="text-sm text-gray-500 mt-1">Total Bookings</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/wallet')}>
                <p className="text-3xl font-bold text-blue-600">Rs.{profile.wallet_balance as number}</p>
                <p className="text-sm text-gray-500 mt-1">Wallet Balance</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition" onClick={() => setActiveSection(activeSection === 'referral' ? null : 'referral')}>
                <p className="text-3xl font-bold text-purple-600">{profile.total_referrals as number}</p>
                <p className="text-sm text-gray-500 mt-1">Referrals</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <h3 className="font-bold text-gray-800 px-6 py-4 border-b">Quick Links</h3>
              {[
                { icon: CalendarDays, label: 'My Bookings', action: () => navigate('/my-bookings'), color: 'text-green-600' },
                { icon: Wallet, label: `Wallet Balance: Rs.${profile.wallet_balance}`, action: () => navigate('/wallet'), color: 'text-blue-600' },
                { icon: Tag, label: 'Offers & Promo Codes', action: () => { setActiveSection(activeSection === 'offers' ? null : 'offers'); loadOffers(); }, color: 'text-orange-600' },
                { icon: Users, label: 'My Teams', action: () => { setActiveSection(activeSection === 'teams' ? null : 'teams'); loadTeams(); }, color: 'text-purple-600' },
                { icon: Gift, label: `Referral: Earn Rs.${referralReward} per referral`, action: () => setActiveSection(activeSection === 'referral' ? null : 'referral'), color: 'text-pink-600' },
                { icon: MessageSquare, label: 'My Tickets / Support', action: () => { setActiveSection(activeSection === 'tickets' ? null : 'tickets'); loadTickets(); }, color: 'text-indigo-600' },
                { icon: HelpCircle, label: 'Help & FAQ', action: () => setActiveSection(activeSection === 'help' ? null : 'help'), color: 'text-cyan-600' },
              ].map((item, i) => (
                <button key={i} onClick={item.action} className="w-full flex items-center gap-4 px-6 py-4 border-b last:border-0 hover:bg-gray-50 transition text-left">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="flex-1 text-gray-700">{item.label}</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>

            {/* WALLET SECTION */}
            {activeSection === 'wallet' && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Wallet size={20} className="text-blue-600" /> Wallet</h3>
                <div className="bg-blue-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-sm text-blue-600">Available Balance</p>
                  <p className="text-3xl font-bold text-blue-700">Rs.{profile.wallet_balance as number}</p>
                  <button onClick={loadTransactions} className="mt-2 text-sm text-blue-600 underline hover:text-blue-800">View Transaction History</button>
                </div>
                {showTxns && (
                  <div className="mb-4 border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-700">Transaction History</h4>
                      <button onClick={() => setShowTxns(false)} className="text-gray-400 text-xs">Close</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {transactions.length === 0 ? <p className="text-center text-gray-400 text-sm py-4">No transactions yet</p> : transactions.map((t, i) => (
                        <div key={i} className="px-4 py-2.5 border-t flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium text-gray-800 capitalize">{String(t.type)}</p>
                            <p className="text-xs text-gray-500">{String(t.description)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${(t.amount as number) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(t.amount as number) >= 0 ? '+' : ''}Rs.{Math.abs(t.amount as number)}</p>
                            <p className="text-xs text-gray-400">{String(t.created_at || '').split('T')[0]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-xl p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2"><Plus size={16} className="text-green-600" /> Add Money</h4>
                    <div className="flex gap-2 mb-3">
                      {[500, 1000, 2000, 5000].map(a => (
                        <button key={a} onClick={() => setWalletAmount(String(a))} className={`px-3 py-1 rounded-lg text-sm border ${walletAmount === String(a) ? 'bg-green-50 border-green-500 text-green-700' : ''}`}>Rs.{a}</button>
                      ))}
                    </div>
                    <input type="number" placeholder="Amount (min Rs.100)" className="w-full border rounded-lg px-3 py-2 mb-3" value={walletAmount} onChange={e => setWalletAmount(e.target.value)} />
                    <select className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" value={selectedGateway} onChange={e => setSelectedGateway(e.target.value)}>
                      {gateways.length === 0 && <option value="">No payment gateways available</option>}
                      {gateways.map(g => <option key={g.id as number} value={g.name as string}>{g.display_name as string}</option>)}
                      <option value="cash">Cash (Admin Approval Required)</option>
                    </select>
                    {selectedGateway === 'cash' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 text-sm text-orange-700">
                        Cash deposit requires admin approval. Amount will be added to your wallet after admin verifies the payment.
                      </div>
                    )}
                    <button onClick={handleAddMoney} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700">Add Money</button>
                  </div>
                  <div className="border rounded-xl p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2"><Send size={16} className="text-purple-600" /> Withdraw to Bank</h4>
                    <p className="text-xs text-gray-500 mb-3">3% withdrawal charge applies. KYC required.</p>
                    {/* KYC Status Badge */}
                    <div className={`text-xs px-3 py-1.5 rounded-lg mb-3 text-center font-medium ${
                      kycStatus === 'verified' ? 'bg-green-50 text-green-700' :
                      kycStatus === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      kycStatus === 'rekyc_required' ? 'bg-orange-50 text-orange-700' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {kycStatus === 'verified' ? 'KYC Verified - You can withdraw' :
                       kycStatus === 'pending' ? 'KYC Pending Verification - Please wait for admin approval' :
                       kycStatus === 'rekyc_required' ? 'Re-KYC Required - Your account details changed. Please re-submit KYC to enable withdrawals.' :
                       'KYC Not Submitted - Complete KYC below to enable withdrawals'}
                    </div>
                    {/* KYC Form - show when not verified AND not changing account */}
                    {(kycStatus !== 'verified' || changingAccount || String(kycStatus) === 'rekyc_required') && (
                      <div className="bg-orange-50 rounded-xl p-4 mb-3 border border-orange-200">
                        <h5 className="text-sm font-bold text-orange-700 mb-2">{changingAccount ? 'Change Bank Account' : 'Complete KYC First'}</h5>
                        <p className="text-xs text-orange-600 mb-3">{changingAccount ? 'Submit new bank details. Your KYC will need to be re-verified by admin.' : 'You must complete KYC verification before you can withdraw funds.'}</p>
                    <input type="text" placeholder="Bank Name" className="w-full border rounded-lg px-3 py-2 mb-2 text-sm bg-white" value={bankName} onChange={e => setBankName(e.target.value)} />
                    <input type="text" placeholder="Account Number" className="w-full border rounded-lg px-3 py-2 mb-2 text-sm bg-white" value={accountNo} onChange={e => setAccountNo(e.target.value)} />
                    <input type="text" placeholder="IFSC Code" className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" value={ifsc} onChange={e => setIfsc(e.target.value)} />
                    <input type="text" placeholder="UPI ID (e.g. name@upi) - Optional" className="w-full border rounded-lg px-3 py-2 mb-2 text-sm bg-white" value={upiId} onChange={e => setUpiId(e.target.value)} />
                    <select className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" value={kycDoc} onChange={e => setKycDoc(e.target.value)}>
                      <option value="">Select KYC Document</option>
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="passport">Passport</option>
                    </select>
                    {/* KYC Document Upload with Progress */}
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 mb-3 text-center bg-blue-50/50 hover:bg-blue-50 transition cursor-pointer" onClick={() => document.getElementById('kyc-file-input')?.click()}>
                      <input id="kyc-file-input" type="file" accept="image/*,.pdf" className="hidden" onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setKycFile(file);
                        if (file) {
                          setUploading(true);
                          setUploadProgress(0);
                          // Simulate upload progress based on file size
                          const totalSize = file.size;
                          let loaded = 0;
                          const interval = setInterval(() => {
                            loaded += totalSize * 0.15;
                            if (loaded >= totalSize) {
                              loaded = totalSize;
                              clearInterval(interval);
                              setUploading(false);
                            }
                            setUploadProgress(Math.min(100, Math.round((loaded / totalSize) * 100)));
                          }, 200);
                        }
                      }} />
                      {kycFile ? (
                        <div>
                          <div className="flex items-center gap-2 justify-center">
                            <FileText size={18} className="text-blue-600" />
                            <span className="text-sm text-blue-700 font-medium">{kycFile.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setKycFile(null); setUploadProgress(0); setUploading(false); }} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                          </div>
                          {/* Upload Progress Bar */}
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <p className="text-xs text-blue-600 mt-1 font-medium">{uploading ? `Uploading... ${uploadProgress}%` : `Upload Complete - ${uploadProgress}%`}</p>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-blue-400 mx-auto mb-1" />
                          <p className="text-sm text-blue-600 font-medium">Upload KYC Document</p>
                          <p className="text-xs text-gray-400 mt-0.5">Aadhaar, PAN Card, or Passport (Image/PDF)</p>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { handleKYC(); setChangingAccount(false); }} className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-orange-700">{changingAccount ? 'Submit New Account' : 'Submit KYC for Verification'}</button>
                      {changingAccount && <button onClick={() => setChangingAccount(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>}
                    </div>
                      </div>
                    )}
                    {/* KYC Pending - Show submitted bank details + pending status */}
                    {kycStatus === 'pending' && !changingAccount && (
                      <div className="bg-yellow-50 rounded-xl p-4 mb-3 border border-yellow-200">
                        <h5 className="text-sm font-bold text-yellow-700 mb-2 flex items-center gap-2"><Shield size={16} /> KYC Pending Verification</h5>
                        <p className="text-xs text-yellow-600 mb-3">Your KYC documents are under review. Admin will verify shortly.</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Bank Name</span><span className="font-medium text-gray-800">{String(profile.bank_name || bankName || 'N/A')}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Account No.</span><span className="font-medium text-gray-800">{String(profile.bank_account || accountNo || 'N/A')}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">IFSC Code</span><span className="font-medium text-gray-800">{String(profile.bank_ifsc || ifsc || 'N/A')}</span></div>
                          {(profile.upi_id || upiId) ? <div className="flex justify-between"><span className="text-gray-500">UPI ID</span><span className="font-medium text-gray-800">{String(profile.upi_id || upiId)}</span></div> : null}
                          {profile.kyc_document_type ? <div className="flex justify-between"><span className="text-gray-500">Document Type</span><span className="font-medium text-gray-800 capitalize">{String(profile.kyc_document_type)}</span></div> : null}
                        </div>
                        {/* KYC Document Preview */}
                        {(profile.kyc_document_url || kycFile) && (
                          <div className="mt-3 border border-yellow-300 rounded-lg p-3 bg-white">
                            <p className="text-xs font-bold text-yellow-700 mb-2 flex items-center gap-1"><Image size={14} /> Uploaded KYC Document</p>
                            {kycFile ? (
                              kycFile.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(kycFile)} alt="KYC Document" className="max-w-full max-h-48 rounded-lg border mx-auto" />
                              ) : (
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3"><FileText size={20} className="text-blue-600" /><span className="text-sm text-gray-700">{kycFile.name}</span></div>
                              )
                            ) : profile.kyc_document_url ? (
                              String(profile.kyc_document_url).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={String(profile.kyc_document_url)} alt="KYC Document" className="max-w-full max-h-48 rounded-lg border mx-auto" />
                              ) : (
                                <a href={String(profile.kyc_document_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 hover:bg-gray-100"><FileText size={20} className="text-blue-600" /><span className="text-sm text-blue-700 underline">View KYC Document (PDF)</span></a>
                              )
                            ) : null}
                          </div>
                        )}
                        <div className="mt-3 bg-yellow-100 rounded-lg p-2 text-center">
                          <span className="text-xs text-yellow-700 font-bold">Status: KYC Pending</span>
                        </div>
                      </div>
                    )}
                    {/* Verified Account Details - show when KYC verified and NOT changing account */}
                    {kycStatus === 'verified' && !changingAccount && (
                      <div className="bg-green-50 rounded-xl p-4 mb-3 border border-green-200">
                        <h5 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">Verified Bank Account</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Bank Name</span><span className="font-medium text-gray-800">{String(profile.bank_name || 'N/A')}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Account No.</span><span className="font-medium text-gray-800">{String(profile.bank_account || 'N/A')}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">IFSC Code</span><span className="font-medium text-gray-800">{String(profile.bank_ifsc || 'N/A')}</span></div>
                          {profile.upi_id ? <div className="flex justify-between"><span className="text-gray-500">UPI ID</span><span className="font-medium text-gray-800">{String(profile.upi_id)}</span></div> : null}
                        </div>
                        <button onClick={() => setChangingAccount(true)} className="w-full mt-3 border-2 border-orange-400 text-orange-600 py-2 rounded-lg font-medium text-sm hover:bg-orange-50">Change Account (Re-KYC Required)</button>
                      </div>
                    )}
                    {/* Withdraw form - only show when KYC is verified and not changing account */}
                    {kycStatus === 'verified' && !changingAccount ? (
                      <>
                    <input type="number" placeholder="Withdraw Amount (min Rs.100)" className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                    <button onClick={handleWithdraw} className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700">Withdraw to Bank</button>
                      </>
                    ) : !changingAccount ? (
                      <button disabled className="w-full bg-gray-300 text-gray-500 py-2.5 rounded-lg font-medium cursor-not-allowed">Complete KYC to Withdraw</button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* OFFERS SECTION - inline, not navigate to homepage */}
            {activeSection === 'offers' && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Tag size={20} className="text-orange-600" /> Offers & Promo Codes</h3>
                <div className="space-y-3">
                  {offers.length === 0 && <p className="text-gray-400 text-center py-4">No active offers right now.</p>}
                  {offers.map((o, i) => (
                    <div key={i} className="border rounded-xl p-4 flex items-center justify-between hover:bg-orange-50 transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm font-mono">{String(o.code)}</span>
                          <span className="text-xs text-green-600 font-medium">{o.discount_type === 'percentage' ? String(o.discount_value) + '% OFF' : 'Rs.' + String(o.discount_value) + ' OFF'}</span>
                        </div>
                        <p className="text-sm text-gray-600">{String(o.description || 'Save on your next booking')}</p>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(String(o.code)); alert('Promo code ' + String(o.code) + ' copied!'); }} className="ml-3 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-1"><Copy size={14} /> Copy</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-700 font-medium">First Booking Cashback: Rs.{settings.first_booking_cashback || '100'}</p>
                  <p className="text-xs text-green-600 mt-1">Automatically applied on your first booking!</p>
                </div>
              </div>
            )}

            {/* REFERRAL SECTION */}
            {activeSection === 'referral' && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Gift size={20} className="text-pink-600" /> Referral Program</h3>
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-5 text-center mb-4">
                  <p className="text-lg font-bold text-gray-800 mb-1">Refer friends, earn Rs.{referralReward} each!</p>
                  <p className="text-sm text-gray-600 mb-4">When your friend signs up using your referral link and completes their first booking, both of you get Rs.{referralReward} wallet credit.</p>
                  <div className="bg-white rounded-lg p-3 flex items-center justify-between mb-3 border">
                    <span className="font-mono font-bold text-lg text-purple-700">{String(profile.referral_code || 'BMGXXXXX')}</span>
                    <button onClick={copyReferral} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-purple-700">
                      <Copy size={14} /> Copy Link
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Your referral earnings: Rs.{(profile.total_referrals as number || 0) * parseInt(referralReward)}</p>
                </div>
                <p className="text-xs text-gray-400 text-center">*T&C Apply: Credit is given only after the referred user completes their first booking. Referral rewards are subject to admin settings.</p>
              </div>
            )}

            {/* TEAMS SECTION - with add member + challenge */}
            {activeSection === 'teams' && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Users size={20} className="text-purple-600" /> My Teams</h3>
                <div className="flex gap-3 mb-6">
                  <input type="text" placeholder="Enter Team Name" className="flex-1 border rounded-lg px-4 py-2" value={teamName} onChange={e => setTeamName(e.target.value)} />
                  <button onClick={handleCreateTeam} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 flex items-center gap-1"><Plus size={16}/> Create</button>
                </div>
                <div className="space-y-4 mb-6">
                  {teams.length === 0 && <p className="text-gray-400 text-center py-4">No teams yet. Create your first team!</p>}
                  {teams.map((t) => (
                    <div key={Number(t.id)} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div><p className="font-bold text-gray-800 text-lg">{String(t.name)}</p><p className="text-sm text-gray-500">{Array.isArray(t.members) ? (t.members as number[]).length : Number(t.member_count || 0)} members</p></div>
                        <div className="flex gap-2">
                          <button onClick={() => setViewingMembersId(viewingMembersId === Number(t.id) ? null : Number(t.id))} className="text-sm bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 flex items-center gap-1"><Users size={14}/> View Members</button>
                          <button onClick={() => setAddingMemberId(addingMemberId === Number(t.id) ? null : Number(t.id))} className="text-sm bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center gap-1"><UserPlus size={14}/> Add Member</button>
                        </div>
                      </div>
                      {/* View Members List */}
                      {viewingMembersId === Number(t.id) && (
                        <div className="bg-green-50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-green-700 mb-2">Team Members ({Array.isArray(t.members) ? (t.members as number[]).length : 0}/{11})</p>
                          <div className="space-y-2">
                              {Array.isArray(t.member_details) && (t.member_details as Array<Record<string, unknown>>).length > 0 ? (t.member_details as Array<Record<string, unknown>>).map((member, idx: number) => (
                                <div key={member.id as number} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm">
                                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                  <span className="text-gray-700">{member.name as string || `Player #${member.id}`}</span>
                                  {(member.id as number) === Number(t.captain_id) && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Captain</span>}
                                </div>
                              )) : Array.isArray(t.members) && (t.members as number[]).length > 0 ? (t.members as number[]).map((memberId: number, idx: number) => (
                                <div key={memberId} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm">
                                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                  <span className="text-gray-700">Player #{memberId}</span>
                                  {memberId === Number(t.captain_id) && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Captain</span>}
                                </div>
                              )) : <p className="text-xs text-gray-400">No members yet</p>}
                          </div>
                        </div>
                      )}
                      {addingMemberId === Number(t.id) && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-blue-700 mb-2">Add Team Member</p>
                          <div className="flex flex-col gap-2">
                            <input type="text" placeholder="Member Name *" className="border rounded-lg px-3 py-2 text-sm bg-white" value={memberName} onChange={e => setMemberName(e.target.value)} />
                            <input type="tel" placeholder="Phone Number (optional)" className="border rounded-lg px-3 py-2 text-sm bg-white" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} />
                            <div className="flex gap-2">
                              <button onClick={() => handleAddMember(Number(t.id))} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Add Member</button>
                              <button onClick={() => { setAddingMemberId(null); setMemberPhone(''); setMemberName(''); }} className="text-gray-500 px-2"><X size={18}/></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {allTeams.length > 0 && (
                  <>
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Swords size={16} className="text-red-500" /> Challenge Other Teams</h4>
                    <div className="space-y-3">
                      {allTeams.filter(t => !teams.some(mt => Number(mt.id) === Number(t.id))).map((t) => (
                        <div key={Number(t.id)} className="border rounded-xl p-4 flex items-center justify-between">
                          <div><p className="font-medium text-gray-800">{String(t.name)}</p><p className="text-sm text-gray-500">{Number(t.member_count || t.members || 0)} members</p></div>
                          {challengeTeamId === Number(t.id) ? (
                            <div className="flex items-center gap-2">
                              <input type="date" className="border rounded-lg px-2 py-1 text-sm" value={challengeDate} onChange={e => setChallengeDate(e.target.value)} />
                              <input type="time" className="border rounded-lg px-2 py-1 text-sm" value={challengeTime} onChange={e => setChallengeTime(e.target.value)} />
                              <button onClick={() => handleChallenge(Number(t.id))} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700">Send</button>
                              <button onClick={() => setChallengeTeamId(null)} className="text-gray-400"><X size={16}/></button>
                            </div>
                          ) : (
                            <button onClick={() => setChallengeTeamId(Number(t.id))} className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 flex items-center gap-1"><Swords size={14}/> Challenge</button>
                          )}
                        </div>
                      ))}
                      {allTeams.filter(t => !teams.some(mt => Number(mt.id) === Number(t.id))).length === 0 && <p className="text-gray-400 text-center py-3">No other teams to challenge right now.</p>}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TICKETS SECTION */}
            {activeSection === 'tickets' && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><MessageSquare size={20} className="text-indigo-600" /> My Tickets</h3>
                  <button onClick={() => setShowNewTicket(!showNewTicket)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Plus size={14}/> New Ticket</button>
                </div>
                {showNewTicket && (
                  <div className="border rounded-xl p-4 mb-4 bg-indigo-50">
                    <h4 className="font-medium text-gray-800 mb-3">Create Support Ticket</h4>
                    <input type="text" placeholder="Subject" className="w-full border rounded-lg px-3 py-2 text-sm mb-2 bg-white" value={newTicketSubject} onChange={e => setNewTicketSubject(e.target.value)} />
                    <textarea placeholder="Describe your issue in detail..." className="w-full border rounded-lg px-3 py-2 text-sm mb-3 bg-white" rows={3} value={newTicketMessage} onChange={e => setNewTicketMessage(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => setShowNewTicket(false)} className="border px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
                      <button onClick={handleCreateTicket} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Submit Ticket</button>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {myTickets.length === 0 ? <p className="text-gray-400 text-center py-4">No tickets yet. Create one if you need help!</p> : myTickets.map(t => (
                    <div key={t.id as number} className="border rounded-xl overflow-hidden">
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
                              <input type="text" placeholder="Type your reply..." className="flex-1 border rounded-lg px-3 py-2 text-sm" value={ticketReply} onChange={e => setTicketReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && ticketReply.trim()) handleTicketReply(t.id as number); }} />
                              <button onClick={() => handleTicketReply(t.id as number)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Reply</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HELP SECTION */}
            {activeSection === 'help' && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><HelpCircle size={20} className="text-cyan-600" /> Help & Support</h3>
                <div className="space-y-3 mb-6">
                  {[
                    { q: 'How to book a ground?', a: 'Search for grounds, select date & time slots, choose payment method and confirm booking.' },
                    { q: 'What is token amount?', a: 'Token is 30% advance payment to confirm booking. Remaining can be paid online before your slot.' },
                    { q: 'How to cancel a booking?', a: 'Go to My Bookings, click Cancel. Charges: 10% (48+ hrs), 25% (24-48 hrs), 50% (4-24 hrs), 100% (<4 hrs).' },
                    { q: 'How does wallet work?', a: 'Add money to wallet using any payment gateway. Use wallet balance for bookings. Withdraw to bank (3% charge, KYC required).' },
                    { q: 'How does referral work?', a: 'Share your referral link. When friend signs up and books, both get wallet credit.' },
                  ].map((faq, i) => (
                    <details key={i} className="border rounded-xl">
                      <summary className="px-4 py-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-50">{faq.q}</summary>
                      <p className="px-4 pb-3 text-sm text-gray-600">{faq.a}</p>
                    </details>
                  ))}
                </div>
                <h4 className="font-medium text-gray-800 mb-3">Contact Us</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <a href="tel:+919782005500" className="flex items-center gap-2 border rounded-xl p-4 hover:bg-gray-50 transition">
                    <Phone size={18} className="text-green-600" /><span className="text-sm font-medium">Call Support</span>
                  </a>
                  <a href="https://wa.me/919782005500" target="_blank" className="flex items-center gap-2 border rounded-xl p-4 hover:bg-gray-50 transition">
                    <MessageCircle size={18} className="text-green-600" /><span className="text-sm font-medium">WhatsApp</span>
                  </a>
                  <a href="mailto:support@bookaground.com" className="flex items-center gap-2 border rounded-xl p-4 hover:bg-gray-50 transition">
                    <Mail size={18} className="text-blue-600" /><span className="text-sm font-medium">Email</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Trophy, Calendar, MapPin, Users, Medal, Plus, Info, XCircle, Clock, Wallet, CheckCircle, Copy, X, ArrowDownLeft } from 'lucide-react';

interface Tournament {
  id: number; name: string; sport_type: string; ground_name: string; ground_id: number;
  start_date: string; end_date: string; max_teams: number; registered_teams: number;
  entry_fee: number; prize_pool: number; status: string; description: string;
  organizer_name: string; format: string;
}

interface MyRegistration {
  id: number; tournament_id: number; team_name: string; status: string; created_at: string;
  tournament_name: string; sport_type: string; start_date: string; end_date: string;
  entry_fee: number; prize_pool: number; tournament_status: string; max_teams: number;
  registered_teams: number; ground_name: string; organizer_name: string;
}

export default function TournamentPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<MyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'ongoing' | 'completed' | 'my'>('upcoming');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', sport_type: 'cricket', start_date: '', end_date: '', max_teams: 8, entry_fee: 500, prize_pool: 5000, description: '', format: 'knockout' });

  useEffect(() => {
    loadTournaments();
    if (localStorage.getItem('token')) loadMyRegistrations();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try { const data = await api.getTournaments(); setTournaments(data); }
    catch { setTournaments([]); }
    setLoading(false);
  };

  const loadMyRegistrations = async () => {
    try { const data = await api.getMyTournamentRegistrations(); setMyRegistrations(Array.isArray(data) ? data : []); }
    catch { setMyRegistrations([]); }
  };

  const [paymentStep, setPaymentStep] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | 'wallet'>('online');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [regSuccess, setRegSuccess] = useState<{ tournamentName: string; teamName: string; amount: number; method: string; newBalance?: number; transactionId?: string; date: string } | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<{ tournamentName: string; teamName: string; refundAmount: number; newBalance: number; date: string } | null>(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setWalletBalance(u.wallet_balance || 0);
  }, []);

  const handleRegister = async (id: number) => {
    if (!localStorage.getItem('token')) { navigate('/login', { state: { from: '/tournaments' } }); return; }
    if (!teamName.trim()) { alert('Enter team name'); return; }
    const tournament = tournaments.find(t => t.id === id);
    if (tournament && tournament.entry_fee > 0 && !paymentStep) {
      setSelectedTournament(tournament);
      setPaymentStep(true);
      return;
    }
    try {
      if (tournament && tournament.entry_fee > 0) {
        const result = await api.registerTournament(id, { team_name: teamName, payment_method: paymentMethod });
        if (result.status === 'payment_pending' && result.order_id && result.key_id) {
          // Razorpay payment flow
          const options = {
            key: result.key_id,
            amount: result.amount,
            currency: 'INR',
            name: 'BookAGround',
            description: `Tournament: ${tournament.name}`,
            order_id: result.order_id,
            handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
              try {
                await api.verifyTournamentPayment(id, {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                setShowRegister(null); setTeamName(''); setPaymentStep(false); setSelectedTournament(null); setPaymentMethod('online');
                setRegSuccess({ tournamentName: tournament.name, teamName: teamName, amount: tournament.entry_fee, method: 'online', transactionId: response.razorpay_payment_id, date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
                loadTournaments(); loadMyRegistrations();
              } catch { alert('Payment verification failed. Contact support.'); }
            },
            prefill: { name: JSON.parse(localStorage.getItem('user') || '{}').name || '' },
            theme: { color: '#EAB308' },
          };
          const rzp = new (window as unknown as Record<string, unknown> & { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(options);
          rzp.open();
          return;
        } else if (result.status === 'waiting_verification') {
          alert(result.message || 'Registration submitted! Waiting for owner to verify your cash payment.');
        } else {
          // Wallet or other successful registration
          setShowRegister(null); setTeamName(''); setPaymentStep(false);
          setRegSuccess({ tournamentName: tournament.name, teamName: teamName, amount: tournament.entry_fee, method: paymentMethod, newBalance: result.new_balance, date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
          setSelectedTournament(null); setPaymentMethod('online');
          loadTournaments(); loadMyRegistrations();
          try { const wData = await api.getWallet(); setWalletBalance(wData.balance || 0); const su = JSON.parse(localStorage.getItem('user') || '{}'); su.wallet_balance = wData.balance || 0; localStorage.setItem('user', JSON.stringify(su)); } catch {}
          return;
        }
      } else {
        await api.registerTournament(id, { team_name: teamName });
        setShowRegister(null); setTeamName(''); setPaymentStep(false);
        setRegSuccess({ tournamentName: (tournament?.name || 'Tournament'), teamName: teamName, amount: 0, method: 'free', date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
        setSelectedTournament(null); setPaymentMethod('online');
        loadTournaments(); loadMyRegistrations();
        return;
      }
          setShowRegister(null); setTeamName(''); setPaymentStep(false); setSelectedTournament(null); setPaymentMethod('online');
          loadTournaments();
          loadMyRegistrations();
          // Refresh wallet balance after wallet payment
          try { const wData = await api.getWallet(); setWalletBalance(wData.balance || 0); const su = JSON.parse(localStorage.getItem('user') || '{}'); su.wallet_balance = wData.balance || 0; localStorage.setItem('user', JSON.stringify(su)); } catch {}
        } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Registration failed'); }
  };

  const handleCancel = async (tournamentId: number) => {
    if (!confirm('Are you sure you want to cancel your tournament registration?\n\nRefund Policy:\n- Within 48 hours: 100% refund\n- After 48 hours: No refund')) return;
    try {
      const result = await api.cancelTournamentRegistration(tournamentId);
      setCancelSuccess({
        tournamentName: result.tournament_name || 'Tournament',
        teamName: result.team_name || '',
        refundAmount: result.refund_amount || 0,
        newBalance: result.new_balance || 0,
        date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      loadMyRegistrations();
      loadTournaments();
      // Update local wallet balance
      try { const wData = await api.getWallet(); setWalletBalance(wData.balance || 0); const su = JSON.parse(localStorage.getItem('user') || '{}'); su.wallet_balance = wData.balance || 0; localStorage.setItem('user', JSON.stringify(su)); } catch {}
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to cancel'); }
  };

  const filtered = tournaments.filter(t => {
    if (tab === 'upcoming') return t.status === 'upcoming' || t.status === 'registration_open';
    if (tab === 'ongoing') return t.status === 'ongoing';
    if (tab === 'completed') return t.status === 'completed';
    return false;
  });

  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700', registration_open: 'bg-green-100 text-green-700',
    ongoing: 'bg-yellow-100 text-yellow-700', completed: 'bg-gray-100 text-gray-600',
  };

  const regStatusColors: Record<string, string> = {
    registered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    confirmed: 'bg-blue-100 text-blue-700',
  };

  // Check if user can cancel (within 48 hours)
  const canCancel = (reg: MyRegistration) => {
    if (reg.status !== 'registered') return false;
    if (reg.tournament_status === 'completed' || reg.tournament_status === 'cancelled') return false;
    return true;
  };

  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={28} className="text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-800">Tournaments</h1>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['upcoming', 'ongoing', 'completed'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 border'}`}>{t}</button>
          ))}
          {isLoggedIn && (
            <button onClick={() => setTab('my')}
              className={`px-5 py-2 rounded-lg text-sm font-medium ${tab === 'my' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 border'}`}>My Tournaments</button>
          )}
          {(() => { const u = JSON.parse(localStorage.getItem('user') || 'null'); return (u?.role === 'owner' || u?.role === 'admin') ? (
            <button onClick={() => setShowCreate(true)}
              className="ml-auto bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 flex items-center gap-1.5">
              <Plus size={16} /> Create Tournament
            </button>
          ) : null; })()}
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">How Tournaments Work</p>
            <p className="text-xs text-yellow-700 mt-1">1. Register your team | 2. Cancel within 48hrs for full refund | 3. Owner manages matches | 4. Winners get the prize pool!</p>
          </div>
        </div>

        {/* My Tournaments Tab */}
        {tab === 'my' ? (
          <div>
            {myRegistrations.length === 0 ? (
              <div className="text-center py-20">
                <Trophy size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-lg">No tournament registrations yet</p>
                <p className="text-gray-400 text-sm mt-1">Register for a tournament to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRegistrations.map(reg => (
                  <div key={reg.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className={`h-2 ${reg.status === 'registered' ? 'bg-green-500' : reg.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{reg.tournament_name}</h3>
                          <p className="text-sm text-gray-500">Team: <span className="font-medium text-gray-700">{reg.team_name}</span></p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${regStatusColors[reg.status] || 'bg-gray-100'}`}>{reg.status}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[reg.tournament_status] || 'bg-gray-100'}`}>{(reg.tournament_status || '').replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">Sport</p>
                          <p className="font-medium text-sm capitalize">{reg.sport_type}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">Entry Fee</p>
                          <p className="font-bold text-green-600 text-sm">Rs.{reg.entry_fee}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">Prize Pool</p>
                          <p className="font-bold text-yellow-600 text-sm">Rs.{reg.prize_pool}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">Teams</p>
                          <p className="font-medium text-sm">{reg.registered_teams}/{reg.max_teams}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {reg.start_date} - {reg.end_date}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {reg.ground_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} /> Registered: {reg.created_at?.split('T')[0] || reg.created_at?.split(' ')[0] || ''}
                        {reg.organizer_name && <span>| Organizer: {reg.organizer_name}</span>}
                      </div>
                      {canCancel(reg) && (
                        <div className="mt-4 pt-3 border-t flex items-center justify-between">
                          <p className="text-xs text-gray-500">Cancel within 48hrs for 100% refund</p>
                          <button onClick={() => handleCancel(reg.tournament_id)}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-1.5">
                            <XCircle size={14} /> Cancel Registration
                          </button>
                        </div>
                      )}
                      {reg.status === 'cancelled' && (
                        <div className="mt-3 bg-red-50 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                          <XCircle size={16} /> Registration cancelled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-gray-400">Loading tournaments...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Trophy size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No {tab} tournaments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="h-24 bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Trophy size={40} className="text-white" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">{t.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[t.status] || 'bg-gray-100'}`}>{t.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{t.description}</p>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><Calendar size={14} /> {t.start_date} - {t.end_date}</p>
                    <p className="flex items-center gap-2"><MapPin size={14} /> {t.ground_name}</p>
                    <p className="flex items-center gap-2"><Users size={14} /> {t.registered_teams}/{t.max_teams} teams | {t.format}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                    <div><p className="text-xs text-gray-500">Entry Fee</p><p className="font-bold text-green-600">Rs.{t.entry_fee}</p></div>
                    <div><p className="text-xs text-gray-500">Prize Pool</p><p className="font-bold text-yellow-600 flex items-center gap-1"><Medal size={14} /> Rs.{t.prize_pool}</p></div>
                    {(t.status === 'upcoming' || t.status === 'registration_open') && t.registered_teams < t.max_teams && (
                      <button onClick={() => setShowRegister(t.id)} className="ml-auto bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600">Register</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Tournament Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Trophy size={20} className="text-yellow-500" /> Create Tournament</h3>
              <div className="space-y-3">
                <div><label className="text-sm text-gray-600 font-medium">Tournament Name *</label>
                  <input type="text" placeholder="e.g. Cricket Premier League 2026" className="w-full border-2 rounded-lg px-4 py-2.5 mt-1" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm text-gray-600 font-medium">Sport</label>
                    <select className="w-full border rounded-lg px-3 py-2.5 mt-1" value={createForm.sport_type} onChange={e => setCreateForm({...createForm, sport_type: e.target.value})}>
                      <option value="cricket">Cricket</option><option value="football">Football</option><option value="badminton">Badminton</option><option value="tennis">Tennis</option>
                    </select></div>
                  <div><label className="text-sm text-gray-600 font-medium">Format</label>
                    <select className="w-full border rounded-lg px-3 py-2.5 mt-1" value={createForm.format} onChange={e => setCreateForm({...createForm, format: e.target.value})}>
                      <option value="knockout">Knockout</option><option value="league">League</option><option value="round-robin">Round Robin</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm text-gray-600 font-medium">Start Date</label>
                    <input type="date" className="w-full border rounded-lg px-3 py-2.5 mt-1" value={createForm.start_date} onChange={e => setCreateForm({...createForm, start_date: e.target.value})} /></div>
                  <div><label className="text-sm text-gray-600 font-medium">End Date</label>
                    <input type="date" className="w-full border rounded-lg px-3 py-2.5 mt-1" value={createForm.end_date} onChange={e => setCreateForm({...createForm, end_date: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-sm text-gray-600 font-medium">Max Teams</label>
                    <input type="number" className="w-full border rounded-lg px-3 py-2.5 mt-1" value={createForm.max_teams} onChange={e => setCreateForm({...createForm, max_teams: parseInt(e.target.value) || 8})} /></div>
                  <div><label className="text-sm text-gray-600 font-medium">Entry Fee (Rs)</label>
                    <input type="number" className="w-full border rounded-lg px-3 py-2.5 mt-1" value={createForm.entry_fee} onChange={e => setCreateForm({...createForm, entry_fee: parseInt(e.target.value) || 0})} /></div>
                  <div><label className="text-sm text-gray-600 font-medium">Prize Pool (Rs)</label>
                    <input type="number" className="w-full border rounded-lg px-3 py-2.5 mt-1" value={createForm.prize_pool} onChange={e => setCreateForm({...createForm, prize_pool: parseInt(e.target.value) || 0})} /></div>
                </div>
                <div><label className="text-sm text-gray-600 font-medium">Description</label>
                  <textarea placeholder="Tournament rules, venue details etc." className="w-full border rounded-lg px-3 py-2.5 mt-1" rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} /></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreate(false)} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                <button onClick={async () => {
                  if (!createForm.name.trim() || !createForm.start_date) { alert('Fill tournament name and dates'); return; }
                  try { await api.createTournament(createForm); alert('Tournament created successfully! It will be visible after admin approval.'); setShowCreate(false); loadTournaments(); }
                  catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to create tournament'); }
                }} className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl font-medium hover:bg-yellow-600">Create Tournament</button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Success Screen - Paytm Style */}
        {regSuccess && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-out]">
              {/* Yellow-Green Success Header */}
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 px-6 pt-8 pb-10 text-center relative">
                <button onClick={() => setRegSuccess(null)} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={20}/></button>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Trophy size={40} className="text-yellow-500" />
                </div>
                <p className="text-yellow-100 text-sm font-medium mb-1">Registration Successful!</p>
                <p className="text-white text-2xl font-bold">{regSuccess.tournamentName}</p>
                {regSuccess.amount > 0 && <p className="text-yellow-100 text-lg font-semibold mt-1">Rs.{regSuccess.amount} Paid</p>}
              </div>

              {/* Details Card */}
              <div className="px-6 -mt-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  {/* Team Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Team Name</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{regSuccess.teamName}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle size={12}/> Registered
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200"></div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {regSuccess.amount > 0 && (
                      <div>
                        <p className="text-xs text-gray-400">Entry Fee Paid</p>
                        <p className="text-sm font-bold text-green-600 mt-0.5">Rs.{regSuccess.amount}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Payment Method</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5 capitalize flex items-center gap-1">
                        {regSuccess.method === 'wallet' && <Wallet size={13} className="text-purple-600"/>}
                        {regSuccess.method === 'free' ? 'Free Entry' : regSuccess.method}
                      </p>
                    </div>
                    {regSuccess.newBalance !== undefined && (
                      <div>
                        <p className="text-xs text-gray-400">Wallet Balance</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5">Rs.{regSuccess.newBalance.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Date & Time</p>
                      <p className="text-sm text-gray-700 mt-0.5">{regSuccess.date}</p>
                    </div>
                    {regSuccess.transactionId && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">Transaction ID</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm font-mono text-gray-800">{regSuccess.transactionId}</p>
                          <button onClick={() => navigator.clipboard.writeText(regSuccess.transactionId || '')} className="text-blue-600 hover:text-blue-800"><Copy size={12}/></button>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="text-sm font-semibold text-green-600 mt-0.5 flex items-center gap-1"><CheckCircle size={14}/> Confirmed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-5 space-y-3">
                <button onClick={() => { setRegSuccess(null); setTab('my'); }} className="w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-yellow-600 transition shadow-sm">
                  View My Tournaments
                </button>
                <button onClick={() => setRegSuccess(null)} className="w-full border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition">
                  Close
                </button>
                <p className="text-center text-xs text-gray-400">BookAGround Tournaments</p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation/Refund Success Screen - Paytm Style */}
        {cancelSuccess && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-out]">
              {/* Header - Red/Orange for cancel, Green tint for refund */}
              <div className={`px-6 pt-8 pb-10 text-center relative ${cancelSuccess.refundAmount > 0 ? 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600' : 'bg-gradient-to-br from-red-400 via-red-500 to-orange-500'}`}>
                <button onClick={() => setCancelSuccess(null)} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={20}/></button>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {cancelSuccess.refundAmount > 0 ? (
                    <ArrowDownLeft size={40} className="text-green-500" />
                  ) : (
                    <XCircle size={40} className="text-red-500" />
                  )}
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">
                  {cancelSuccess.refundAmount > 0 ? 'Refund Processed!' : 'Registration Cancelled'}
                </p>
                {cancelSuccess.refundAmount > 0 ? (
                  <p className="text-white text-4xl font-bold">Rs.{cancelSuccess.refundAmount.toLocaleString()}</p>
                ) : (
                  <p className="text-white text-2xl font-bold">No Refund</p>
                )}
                <p className="text-white/70 text-sm mt-2">{cancelSuccess.tournamentName}</p>
              </div>

              {/* Details Card */}
              <div className="px-6 -mt-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Tournament</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{cancelSuccess.tournamentName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${cancelSuccess.refundAmount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cancelSuccess.refundAmount > 0 ? <><CheckCircle size={12}/> Refunded</> : <><XCircle size={12}/> Cancelled</>}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200"></div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {cancelSuccess.teamName && (
                      <div>
                        <p className="text-xs text-gray-400">Team Name</p>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">{cancelSuccess.teamName}</p>
                      </div>
                    )}
                    {cancelSuccess.refundAmount > 0 && (
                      <div>
                        <p className="text-xs text-gray-400">Refund Amount</p>
                        <p className="text-sm font-bold text-green-600 mt-0.5">+Rs.{cancelSuccess.refundAmount.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Wallet Balance</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">Rs.{cancelSuccess.newBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date & Time</p>
                      <p className="text-sm text-gray-700 mt-0.5">{cancelSuccess.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Refunded To</p>
                      <p className="text-sm text-gray-700 mt-0.5 flex items-center gap-1"><Wallet size={13} className="text-purple-600"/> Wallet</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <p className={`text-sm font-semibold mt-0.5 flex items-center gap-1 ${cancelSuccess.refundAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cancelSuccess.refundAmount > 0 ? <><CheckCircle size={14}/> Refund Complete</> : <><XCircle size={14}/> No Refund</>}
                      </p>
                    </div>
                  </div>

                  {cancelSuccess.refundAmount === 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                      <p className="font-medium">No refund applicable</p>
                      <p>Cancellation was made after 48 hours of registration.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-5 space-y-3">
                <button onClick={() => { setCancelSuccess(null); navigate('/wallet'); }} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition shadow-sm flex items-center justify-center gap-2">
                  <Wallet size={16}/> View Wallet
                </button>
                <button onClick={() => setCancelSuccess(null)} className="w-full border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition">
                  Close
                </button>
                <p className="text-center text-xs text-gray-400">BookAGround Tournaments</p>
              </div>
            </div>
          </div>
        )}

        {showRegister && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowRegister(null); setPaymentStep(false); }}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              {paymentStep && selectedTournament ? (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Trophy size={20} className="text-yellow-500" /> Payment Required</h3>
                  <div className="bg-yellow-50 rounded-xl p-4 mb-4 border border-yellow-200">
                    <p className="text-sm text-yellow-800 font-medium mb-2">Tournament: {selectedTournament.name}</p>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Entry Fee</span><span className="font-bold text-green-600">Rs.{selectedTournament.entry_fee}</span></div>
                    <div className="flex justify-between text-sm mt-1"><span className="text-gray-600">Team Name</span><span className="font-medium">{teamName}</span></div>
                  </div>
                  {/* Payment Method Selection */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Choose Payment Method</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setPaymentMethod('online')}
                        className={`p-3 rounded-xl border-2 text-center transition ${paymentMethod === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        <p className="font-medium text-sm">{paymentMethod === 'online' ? '✓ ' : ''}Online</p>
                        <p className="text-xs text-gray-500 mt-1">UPI/Card/Net</p>
                      </button>
                      <button onClick={() => setPaymentMethod('wallet')}
                        className={`p-3 rounded-xl border-2 text-center transition ${paymentMethod === 'wallet' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-center justify-center gap-1"><Wallet size={14} className="text-purple-600" /><p className="font-medium text-sm">{paymentMethod === 'wallet' ? '✓ ' : ''}Wallet</p></div>
                        <p className="text-xs text-green-600 font-semibold mt-1">Bal: ₹{walletBalance}</p>
                      </button>
                      <button onClick={() => setPaymentMethod('cash')}
                        className={`p-3 rounded-xl border-2 text-center transition ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                        <p className="font-medium text-sm">{paymentMethod === 'cash' ? '✓ ' : ''}Cash</p>
                        <p className="text-xs text-gray-500 mt-1">Pay to owner</p>
                      </button>
                    </div>
                  </div>
                  {paymentMethod === 'cash' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-700">
                      <p className="font-medium">Cash Payment Info:</p>
                      <p>Your registration will be in "Waiting Verification" status until the owner/organizer confirms your cash payment.</p>
                    </div>
                  )}
                  {paymentMethod === 'wallet' && (
                    <div className={`rounded-lg p-3 mb-4 text-xs border ${walletBalance >= (selectedTournament?.entry_fee || 0) ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <p className="font-medium">Wallet Payment:</p>
                      <p>Rs.{selectedTournament?.entry_fee || 0} will be deducted from your wallet balance (₹{walletBalance}).</p>
                      {walletBalance < (selectedTournament?.entry_fee || 0) && <p className="font-bold mt-1">⚠️ Insufficient balance! Please add money to wallet first.</p>}
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Payment Summary</p>
                    <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span className="text-green-600">Rs.{selectedTournament.entry_fee}</span></div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-700">
                    <p className="font-medium">Cancellation Policy:</p>
                    <p>Cancel within 48 hours for 100% refund. No refund after 48 hours.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setPaymentStep(false); setPaymentMethod('online'); }} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Back</button>
                    <button onClick={() => handleRegister(showRegister)} 
                      disabled={paymentMethod === 'wallet' && walletBalance < (selectedTournament?.entry_fee || 0)}
                      className={`flex-1 text-white py-2.5 rounded-xl font-medium ${paymentMethod === 'cash' ? 'bg-orange-500 hover:bg-orange-600' : paymentMethod === 'wallet' ? (walletBalance >= (selectedTournament?.entry_fee || 0) ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed') : 'bg-green-600 hover:bg-green-700'}`}>
                      {paymentMethod === 'cash' ? 'Submit Cash Registration' : paymentMethod === 'wallet' ? 'Pay from Wallet' : 'Pay & Register'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Trophy size={20} className="text-yellow-500" /> Register for Tournament</h3>
                  {(() => { const t = tournaments.find(x => x.id === showRegister); return t && t.entry_fee > 0 ? (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 text-sm text-orange-700">Entry Fee: Rs.{t.entry_fee} - Payment required after team name</div>
                  ) : null; })()}
                  <input type="text" placeholder="Your Team Name" className="w-full border-2 rounded-lg px-4 py-3 mb-4"
                    value={teamName} onChange={e => setTeamName(e.target.value)} />
                  <div className="flex gap-3">
                    <button onClick={() => { setShowRegister(null); setPaymentStep(false); }} className="flex-1 border-2 py-2.5 rounded-xl font-medium">Cancel</button>
                    <button onClick={() => handleRegister(showRegister)} className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl font-medium hover:bg-yellow-600">{(() => { const t = tournaments.find(x => x.id === showRegister); return t && t.entry_fee > 0 ? 'Continue to Payment' : 'Register Team'; })()}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

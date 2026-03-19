import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, RefreshCw, Gift, AlertTriangle, Download, ChevronLeft, CheckCircle, Copy, X, Trophy, Shield, Upload, FileText, Info, XCircle } from 'lucide-react';

type Transaction = {
  type: string;
  amount: number;
  description: string;
  reference_id: string;
  created_at: string;
  transaction_id?: string;
  proof_url?: string;
};

export default function WalletPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [balance, setBalance] = useState<number>(user?.wallet_balance || 0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [gateways, setGateways] = useState<Array<Record<string, unknown>>>([]);
  const [selectedGateway, setSelectedGateway] = useState('razorpay');
  const [filter, setFilter] = useState<string>('all');
  const [txnTab, setTxnTab] = useState<'all' | 'wallet'>('all');
  const [successData, setSuccessData] = useState<{ amount: number; transactionId: string; newBalance: number; date: string } | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>('none');
  const [walletSection, setWalletSection] = useState<'main' | 'kyc'>('main');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [kycDoc, setKycDoc] = useState('');
  const [kycFiles, setKycFiles] = useState<File[]>([]);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [profileData, setProfileData] = useState<Record<string, unknown>>({});
  const [showReKyc, setShowReKyc] = useState(false);
  const [rekycBankName, setRekycBankName] = useState('');
  const [rekycAccountNo, setRekycAccountNo] = useState('');
  const [rekycIfsc, setRekycIfsc] = useState('');
  const [rekycUpiId, setRekycUpiId] = useState('');
  const [rekycDocType, setRekycDocType] = useState('');
  const [submittingRekyc, setSubmittingRekyc] = useState(false);
  const [rekycFiles, setRekycFiles] = useState<File[]>([]);
  const [rekycOldDetails, setRekycOldDetails] = useState<Record<string, unknown> | null>(null);
  const [isRekyc, setIsRekyc] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; show: boolean }>({ message: '', type: 'info', show: false });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4500);
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walletData, txns, gw] = await Promise.all([
        api.getWallet(),
        api.getUserTransactions(),
        api.getPaymentGateways().catch(() => []),
      ]);
      setBalance(walletData.balance ?? walletData.wallet_balance ?? 0);
      setKycStatus(walletData.kyc_status || 'none');
      if (walletData.is_rekyc) setIsRekyc(true); else setIsRekyc(false);
      if (walletData.kyc_reject_reason) setKycRejectReason(String(walletData.kyc_reject_reason));
      setTransactions(txns || []);
      if (Array.isArray(gw)) setGateways(gw.filter((g: Record<string, unknown>) => g.enabled));
      // Load profile for KYC details
      try {
        const prof = await api.getProfile();
        setProfileData(prof);
        if (prof.kyc_status) setKycStatus(String(prof.kyc_status));
        if (prof.kyc_reject_reason) setKycRejectReason(String(prof.kyc_reject_reason));
      } catch { /* ignore */ }
      // Load Re-KYC details (old bank details if pending)
      try {
        const kycDetails = await api.getMyKycDetails();
        if (kycDetails.is_rekyc && kycDetails.old_bank_account) {
          setRekycOldDetails({ bank_name: kycDetails.old_bank_name, bank_account: kycDetails.old_bank_account, bank_ifsc: kycDetails.old_bank_ifsc, upi_id: kycDetails.old_upi_id });
        } else {
          setRekycOldDetails(null);
        }
      } catch { /* ignore */ }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddMoney = async () => {
    const amt = parseFloat(addAmount);
    if (!amt || amt < 100) { showToast('Minimum Rs.100 add karo', 'warning'); return; }
    try {
      // Step 1: Create Razorpay order via backend
      const orderRes = await api.addMoney(amt, selectedGateway || 'razorpay');
      if (orderRes.status === 'pending') {
        // Cash topup - pending admin approval
        showToast(orderRes.message || 'Top-up request submitted!', 'success');
        setShowAddMoney(false);
        setAddAmount('');
        loadData();
        return;
      }
      if (!orderRes.order_id || !orderRes.key_id) {
        showToast('Order create nahi ho paya. Try again.', 'error');
        return;
      }
      // Step 2: Open Razorpay checkout with the order
      const options = {
        key: orderRes.key_id,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'BookAGround',
        description: 'Wallet Top-up',
        order_id: orderRes.order_id,
        prefill: { name: user?.name, contact: user?.phone, email: user?.email || '' },
        theme: { color: '#16a34a' },
        handler: async (response: Record<string, string>) => {
          try {
            // Step 3: Verify payment via backend
            const res = await api.verifyWalletTopup({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amt,
            });
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const newBal = res.new_balance || (storedUser.wallet_balance + amt);
            storedUser.wallet_balance = newBal;
            localStorage.setItem('user', JSON.stringify(storedUser));
            setBalance(newBal);
            setShowAddMoney(false);
            setAddAmount('');
            setSuccessData({
              amount: amt,
              transactionId: response.razorpay_payment_id || 'N/A',
              newBalance: newBal,
              date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            });
            loadData();
          } catch { showToast('Payment verify karne mein error. Support se contact karo.', 'error'); }
        },
      };
      // @ts-expect-error Razorpay global
      if (window.Razorpay) { const rz = new window.Razorpay(options); rz.open(); }
      else { showToast('Razorpay load nahi ho raha. Page refresh karo.', 'error'); }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create payment order. Try again.', 'error');
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 100) { showToast('Minimum Rs.100 withdraw kar sakte ho', 'warning'); return; }
    if (amt > balance) { showToast('Insufficient balance', 'warning'); return; }
    setWithdrawing(true);
    try {
      const res = await api.withdrawMoney(amt);
      showToast(res.message || 'Withdrawal request submitted!', 'success');
      setShowWithdraw(false);
      setWithdrawAmount('');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.wallet_balance = Math.max(0, (storedUser.wallet_balance || 0) - amt);
      localStorage.setItem('user', JSON.stringify(storedUser));
      loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Withdrawal failed';
      showToast(msg, 'error');
    }
    setWithdrawing(false);
  };

  const txnIcon = (type: string) => {
    switch (type) {
      case 'topup': return <ArrowDownLeft size={16} className="text-green-600" />;
      case 'cashback': return <Gift size={16} className="text-blue-600" />;
      case 'refund': return <RefreshCw size={16} className="text-green-600" />;
      case 'booking': return <ArrowUpRight size={16} className="text-red-500" />;
      case 'withdrawal': return <TrendingDown size={16} className="text-orange-600" />;
      case 'penalty': return <AlertTriangle size={16} className="text-red-600" />;
      case 'tournament_debit': return <Trophy size={16} className="text-orange-600" />;
      case 'tournament_credit': return <Trophy size={16} className="text-green-600" />;
      default: return <TrendingUp size={16} className="text-gray-400" />;
    }
  };

  const txnBg = (type: string) => {
    switch (type) {
      case 'topup': return 'bg-green-50';
      case 'cashback': return 'bg-blue-50';
      case 'refund': return 'bg-green-50';
      case 'booking': return 'bg-red-50';
      case 'withdrawal': return 'bg-orange-50';
      case 'penalty': return 'bg-red-50';
      case 'tournament_debit': return 'bg-orange-50';
      case 'tournament_credit': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  const txnLabel = (type: string) => {
    switch (type) {
      case 'topup': return 'Wallet Top-up';
      case 'cashback': return 'Cashback';
      case 'refund': return 'Refund';
      case 'booking': return 'Booking Payment';
      case 'withdrawal': return 'Withdrawal';
      case 'penalty': return 'Penalty (Not Attended)';
      case 'tournament_debit': return 'Tournament Entry Fee';
      case 'tournament_credit': return 'Tournament Refund';
      default: return type;
    }
  };

  const handleDownloadCSV = () => {
    const rows = transactions.map(t => [
      t.type, t.amount > 0 ? `+${t.amount}` : t.amount, t.description, t.reference_id, t.created_at
    ]);
    const header = ['Type', 'Amount', 'Description', 'Reference', 'Date'];
    const csv = [header, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'wallet-transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const rows = transactions.map((t, i) => {
      const isCredit = t.amount > 0;
      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      const amtColor = isCredit ? '#16a34a' : '#dc2626';
      const amtBg = isCredit ? '#f0fdf4' : '#fef2f2';
      return `<tr style="background:${bg}">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px"><span style="background:${amtBg};color:${amtColor};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">${txnLabel(t.type)}</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:${amtColor}">${isCredit ? '+' : '-'}Rs.${Math.abs(t.amount).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151">${t.description || ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#9ca3af">${t.reference_id || '-'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280">${formatDate(t.created_at)}</td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><title>Wallet Transactions - BookAGround</title>
    <style>
      @page{size:A4;margin:15mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1f2937;padding:30px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:3px solid #16a34a;padding-bottom:16px}
      .logo{font-size:24px;font-weight:800;color:#16a34a;letter-spacing:-0.5px}
      .logo span{color:#374151}
      .meta{text-align:right;font-size:11px;color:#6b7280;line-height:1.6}
      .wallet-card{background:linear-gradient(135deg,#16a34a,#15803d);border-radius:14px;padding:20px 24px;color:white;margin-bottom:20px}
      .wallet-label{font-size:12px;opacity:0.8}
      .wallet-balance{font-size:32px;font-weight:800;margin:4px 0}
      .summary{display:flex;gap:16px;margin-bottom:20px}
      .stat{flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px}
      .stat-label{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
      .stat-value{font-size:20px;font-weight:700}
      table{width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb}
      thead th{background:#16a34a;color:white;padding:10px 12px;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:0.5px;font-weight:600}
      .footer{margin-top:24px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px}
    </style></head><body>
      <div class="header">
        <div><div class="logo">Book<span>AGround</span></div><div style="font-size:12px;color:#6b7280;margin-top:4px">Wallet Transaction Report</div></div>
        <div class="meta"><strong style="font-size:14px;color:#1f2937">${user?.name || 'User'}</strong><br>${user?.phone || ''}<br>Generated: ${new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div class="wallet-card"><div class="wallet-label">Current Wallet Balance</div><div class="wallet-balance">Rs.${balance.toLocaleString()}</div></div>
      <div class="summary">
        <div class="stat"><div class="stat-label">Total Transactions</div><div class="stat-value" style="color:#1f2937">${transactions.length}</div></div>
        <div class="stat"><div class="stat-label">Total Credits</div><div class="stat-value" style="color:#16a34a">+Rs.${totalCredit.toLocaleString()}</div></div>
        <div class="stat"><div class="stat-label">Total Debits</div><div class="stat-value" style="color:#dc2626">-Rs.${totalDebit.toLocaleString()}</div></div>
      </div>
      <table><thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>Reference</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">BookAGround | bookaground.com | This is a computer-generated document</div>
    <script>window.onload=function(){window.print();}<\/script></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const walletTypes = ['topup', 'withdrawal', 'tournament_debit', 'tournament_credit'];
  const tabFilteredTxns = txnTab === 'wallet' ? transactions.filter(t => walletTypes.includes(t.type)) : transactions;
  const filteredTxns = filter === 'all' ? tabFilteredTxns : tabFilteredTxns.filter(t => t.type === filter);
  const totalCredit = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Styled Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md animate-[slideDown_0.3s_ease-out]">
          <div className={`rounded-2xl shadow-2xl border px-4 py-3.5 flex items-start gap-3 backdrop-blur-sm ${
            toast.type === 'success' ? 'bg-green-50/95 border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-800' :
            toast.type === 'warning' ? 'bg-amber-50/95 border-amber-200 text-amber-800' :
            'bg-blue-50/95 border-blue-200 text-blue-800'
          }`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-amber-500' :
              'bg-blue-500'
            }`}>
              {toast.type === 'success' && <CheckCircle size={16} className="text-white" />}
              {toast.type === 'error' && <XCircle size={16} className="text-white" />}
              {toast.type === 'warning' && <AlertTriangle size={14} className="text-white" />}
              {toast.type === 'info' && <Info size={16} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-0.5">
                {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Warning' : 'Info'}
              </p>
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="flex-shrink-0 opacity-50 hover:opacity-100 transition mt-1">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
          <ChevronLeft size={16} /> Back
        </button>

        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white mb-4 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={20} />
            <span className="text-green-100 text-sm font-medium">My Wallet</span>
          </div>
          <p className="text-4xl font-bold mb-1">Rs.{balance.toLocaleString()}</p>
          <p className="text-green-200 text-xs">{user?.name}</p>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowAddMoney(true)}
              className="flex-1 bg-white text-green-700 font-semibold py-2 rounded-xl text-sm flex items-center justify-center gap-1 hover:bg-green-50 transition"
            >
              <Plus size={16} /> Add Money
            </button>
            <button
              onClick={() => {
                if (kycStatus !== 'verified' && kycStatus !== 'approved' && !isRekyc) {
                  setWalletSection('kyc');
                  return;
                }
                if (balance < 100) {
                  showToast('Minimum Rs.100 balance hona chahiye withdraw ke liye.', 'warning');
                  return;
                }
                setShowWithdraw(true);
              }}
              className="flex-1 bg-green-500 text-white font-semibold py-2 rounded-xl text-sm flex items-center justify-center gap-1 hover:bg-green-400 transition"
            >
              <TrendingDown size={16} /> Withdraw
            </button>
            <button
              onClick={loadData}
              className="bg-green-500 text-white p-2 rounded-xl hover:bg-green-400 transition"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Section Tabs - Main / KYC */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setWalletSection('main')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1 ${walletSection === 'main' ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            <Wallet size={14} /> Wallet
          </button>
          <button onClick={() => setWalletSection('kyc')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1 ${walletSection === 'kyc' ? 'bg-orange-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            <Shield size={14} /> KYC & Withdraw
            {kycStatus === 'verified' && <span className="w-2 h-2 bg-green-400 rounded-full"></span>}
            {kycStatus === 'pending' && <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>}
            {kycStatus === 'rejected' && <span className="w-2 h-2 bg-red-400 rounded-full"></span>}
          </button>
        </div>

        {/* Withdraw Money Modal - outside walletSection so it works from any tab */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
            <div className="bg-white rounded-t-2xl p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Withdraw from Wallet</h3>
                <button onClick={() => { setShowWithdraw(false); setWithdrawAmount(''); }} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-700">
                <p className="font-semibold mb-1">Withdrawal Info:</p>
                <p>- Minimum withdrawal: Rs.100</p>
                <p>- 3% processing charge applicable</p>
                <p>- Admin approval ke baad bank account mein transfer hoga</p>
                <p>- Processing time: 1-3 business days</p>
              </div>
              <p className="text-sm text-gray-500 mb-2">Available Balance: <span className="font-bold text-green-600">Rs.{balance.toLocaleString()}</span></p>
              <div className="flex gap-2 mb-3">
                {[100, 200, 500].filter(a => a <= balance).map(a => (
                  <button key={a} onClick={() => setWithdrawAmount(String(a))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${withdrawAmount === String(a) ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-200 text-gray-700 hover:border-orange-400'}`}>
                    Rs.{a}
                  </button>
                ))}
                {balance >= 1000 && (
                  <button onClick={() => setWithdrawAmount(String(balance))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${withdrawAmount === String(balance) ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-200 text-gray-700 hover:border-orange-400'}`}>
                    Full: Rs.{balance.toLocaleString()}
                  </button>
                )}
              </div>
              <input
                type="number" placeholder="Enter amount (min Rs.100)" value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {withdrawAmount && parseFloat(withdrawAmount) >= 100 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Amount:</span><span className="font-medium">Rs.{parseFloat(withdrawAmount).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Charge (3%):</span><span className="text-red-500">-Rs.{(parseFloat(withdrawAmount) * 0.03).toFixed(2)}</span></div>
                  <div className="border-t pt-1 flex justify-between"><span className="text-gray-700 font-semibold">You will receive:</span><span className="font-bold text-green-600">Rs.{(parseFloat(withdrawAmount) * 0.97).toFixed(2)}</span></div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowWithdraw(false); setWithdrawAmount(''); }}
                  className="flex-1 py-2 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleWithdraw} disabled={withdrawing}
                  className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">
                  {withdrawing ? 'Processing...' : `Withdraw Rs.${withdrawAmount || '0'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {walletSection === 'main' && (<>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Total Credits</p>
            <p className="text-xl font-bold text-green-600">+Rs.{totalCredit.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Total Debits</p>
            <p className="text-xl font-bold text-red-500">-Rs.{totalDebit.toLocaleString()}</p>
          </div>
        </div>

        {/* Add Money Modal */}
        {showAddMoney && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
            <div className="bg-white rounded-t-2xl p-6 w-full max-w-2xl">
              <h3 className="text-lg font-bold mb-4">Add Money to Wallet</h3>
              <div className="flex gap-2 mb-3">
                {[100, 200, 500, 1000].map(a => (
                  <button key={a} onClick={() => setAddAmount(String(a))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${addAmount === String(a) ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-400'}`}>
                    Rs.{a}
                  </button>
                ))}
              </div>
              <input
                type="number" placeholder="Custom amount (Rs.)" value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {gateways.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {gateways.map((g: Record<string, unknown>) => (
                    <button key={g.id as number} onClick={() => setSelectedGateway(g.name as string)}
                      className={`flex-1 py-2 rounded-lg text-xs border transition ${selectedGateway === g.name ? 'bg-green-50 border-green-400 text-green-700' : 'border-gray-200'}`}>
                      {g.label as string || g.name as string}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowAddMoney(false); setAddAmount(''); }}
                  className="flex-1 py-2 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleAddMoney}
                  className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
                  Pay Rs.{addAmount || '0'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Success Screen - Paytm Style */}
        {successData && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-out]">
              {/* Green Success Header */}
              <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 px-6 pt-8 pb-10 text-center relative">
                <button onClick={() => setSuccessData(null)} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={20}/></button>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle size={48} className="text-green-500" />
                </div>
                <p className="text-green-100 text-sm font-medium mb-1">Payment Successful</p>
                <p className="text-white text-4xl font-bold">Rs.{successData.amount.toLocaleString()}</p>
                <p className="text-green-200 text-sm mt-2">Added to BookAGround Wallet</p>
              </div>

              {/* Transaction Details */}
              <div className="px-6 -mt-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  {/* Transaction ID */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Transaction ID</p>
                      <p className="text-sm font-mono font-medium text-gray-800 mt-0.5">{successData.transactionId}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(successData.transactionId); const btn = document.getElementById('copy-btn'); if(btn) { btn.textContent = 'Copied!'; setTimeout(() => { if(btn) btn.textContent = ''; }, 2000); } }} className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition">
                      <Copy size={12}/> <span id="copy-btn">Copy</span>
                    </button>
                  </div>

                  <div className="border-t border-dashed border-gray-200"></div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="text-sm font-bold text-green-600 mt-0.5">+Rs.{successData.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">New Balance</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">Rs.{successData.newBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date & Time</p>
                      <p className="text-sm text-gray-700 mt-0.5">{successData.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Payment Method</p>
                      <p className="text-sm text-gray-700 mt-0.5 capitalize">{selectedGateway}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="text-sm font-semibold text-green-600 mt-0.5 flex items-center gap-1"><CheckCircle size={14}/> Success</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Credited To</p>
                      <p className="text-sm text-gray-700 mt-0.5">{user?.name || 'Wallet'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-5 space-y-3">
                <button onClick={() => setSuccessData(null)} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition shadow-sm">
                  Done
                </button>
                <p className="text-center text-xs text-gray-400">BookAGround Wallet • Powered by Razorpay</p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">Transaction History</h2>
              <div className="flex gap-2">
                <button onClick={handleDownloadCSV}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                  <Download size={12} /> CSV
                </button>
                <button onClick={handleDownloadPDF}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                  <Download size={12} /> PDF
                </button>
              </div>
            </div>
            {/* All / Wallet Transactions Tab */}
            <div className="flex gap-2">
              <button onClick={() => { setTxnTab('all'); setFilter('all'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${txnTab === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All Transactions
              </button>
              <button onClick={() => { setTxnTab('wallet'); setFilter('all'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${txnTab === 'wallet' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Wallet size={12} /> Wallet Transactions
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b">
            {(txnTab === 'wallet' ? ['all', 'topup', 'withdrawal', 'tournament_debit', 'tournament_credit'] : ['all', 'topup', 'booking', 'refund', 'cashback', 'withdrawal', 'penalty', 'tournament_debit', 'tournament_credit']).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f === 'all' ? 'All' : txnLabel(f)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : filteredTxns.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Wallet size={32} className="mx-auto mb-2 text-gray-300" />
              <p>Koi transaction nahi mila</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTxns.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${txnBg(t.type)}`}>
                    {txnIcon(t.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{txnLabel(t.type)}</p>
                    <p className="text-xs text-gray-500 truncate">{t.description}</p>
                    {t.reference_id && <p className="text-xs text-gray-400">Ref: {t.reference_id}</p>}
                    {t.transaction_id && <p className="text-xs text-blue-600 font-medium">TXN: {t.transaction_id}</p>}
                    {t.proof_url && (
                      <a href={t.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-0.5">
                        <FileText size={10} /> View Proof
                      </a>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(t.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {t.amount > 0 ? '+' : ''}Rs.{Math.abs(t.amount).toLocaleString()}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${txnBg(t.type)}`}>{txnLabel(t.type)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>)}

        {/* KYC Section */}
        {walletSection === 'kyc' && (
          <div className="space-y-4">
            {/* KYC Status Card */}
            <div className={`rounded-2xl p-5 shadow-sm border ${
              kycStatus === 'verified' ? 'bg-green-50 border-green-200' :
              kycStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' :
              kycStatus === 'rejected' ? 'bg-red-50 border-red-200' :
              kycStatus === 'rekyc_required' ? 'bg-orange-50 border-orange-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  kycStatus === 'verified' ? 'bg-green-500' :
                  kycStatus === 'pending' ? 'bg-yellow-500' :
                  kycStatus === 'rejected' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}>
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">KYC Status</p>
                  <p className={`text-sm font-semibold ${
                    kycStatus === 'verified' ? 'text-green-700' :
                    kycStatus === 'pending' ? 'text-yellow-700' :
                    kycStatus === 'rejected' ? 'text-red-700' :
                    kycStatus === 'rekyc_required' ? 'text-orange-700' :
                    'text-gray-500'
                  }`}>
                    {kycStatus === 'verified' ? 'Verified - Withdrawals Enabled' :
                     kycStatus === 'pending' ? 'Pending Verification - Admin will verify soon' :
                     kycStatus === 'rejected' ? 'Rejected - Please reupload documents' :
                     kycStatus === 'rekyc_required' ? 'Re-KYC Required - Please resubmit' :
                     'Not Submitted - Complete KYC to withdraw'}
                  </p>
                </div>
              </div>
            </div>

            {/* Rejected - Show rejection message and reupload prompt */}
            {kycStatus === 'rejected' && (
              <div className="bg-red-50 rounded-2xl p-5 shadow-sm border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <X size={18} className="text-red-600" />
                  <h3 className="font-bold text-red-700">KYC Rejected</h3>
                </div>
                <p className="text-sm text-red-600 mb-3">Aapki KYC documents reject ho gayi hain. Kripya sahi documents dobara upload karein.</p>
                {kycRejectReason ? (
                  <div className="bg-white rounded-lg p-3 mb-3 border border-red-200">
                    <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-gray-700">{kycRejectReason}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-3 mb-3 border border-red-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Rejection ke common reasons:</p>
                    <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                      <li>Document photo blurry ya unclear hai</li>
                      <li>Document expired hai</li>
                      <li>Name mismatch hai bank details se</li>
                      <li>Front ya back photo missing hai</li>
                    </ul>
                  </div>
                )}
                <p className="text-xs text-gray-500 mb-1">Neeche form fill karke dobara submit karein:</p>
              </div>
            )}

            {/* Verified - Show bank details and withdraw */}
            {kycStatus === 'verified' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-green-600" /> Verified Bank Details</h3>
                <div className="space-y-2 text-sm">
                  {profileData.bank_name ? <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{String(profileData.bank_name)}</span></div> : null}
                  {profileData.account_number ? <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">****{String(profileData.account_number).slice(-4)}</span></div> : null}
                  {profileData.ifsc_code ? <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-medium">{String(profileData.ifsc_code)}</span></div> : null}
                  {profileData.upi_id ? <div className="flex justify-between"><span className="text-gray-500">UPI</span><span className="font-medium">{String(profileData.upi_id)}</span></div> : null}
                </div>
                <button onClick={() => {
                  if (balance < 100) { showToast('Minimum Rs.100 balance chahiye', 'warning'); return; }
                  setShowWithdraw(true);
                }} className="w-full mt-4 bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 transition flex items-center justify-center gap-2">
                  <TrendingDown size={16} /> Withdraw Money (Balance: Rs.{balance.toLocaleString()})
                </button>
                <button onClick={() => { setRekycBankName(''); setRekycAccountNo(''); setRekycIfsc(''); setRekycUpiId(''); setRekycDocType(''); setRekycFiles([]); setShowReKyc(true); }}
                  className="w-full mt-2 bg-white text-orange-600 border border-orange-300 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-50 transition flex items-center justify-center gap-2">
                  <RefreshCw size={14} /> Change Bank Details (Re-KYC)
                </button>
              </div>
            )}

            {/* Re-KYC Modal */}
            {showReKyc && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReKyc(false)}>
                <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><RefreshCw size={16} className="text-orange-600" /> Change Bank Details</h3>
                    <button onClick={() => setShowReKyc(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Naye bank details enter karein. Admin verify karega, tab tak purane details active rahenge.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">New Bank Name *</label>
                      <input type="text" placeholder="e.g. State Bank of India" value={rekycBankName} onChange={e => setRekycBankName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">New Account Number *</label>
                      <input type="text" placeholder="Enter new account number" value={rekycAccountNo} onChange={e => setRekycAccountNo(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">New IFSC Code *</label>
                      <input type="text" placeholder="e.g. SBIN0001234" value={rekycIfsc} onChange={e => setRekycIfsc(e.target.value.toUpperCase())}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">New UPI ID (Optional)</label>
                      <input type="text" placeholder="e.g. name@upi" value={rekycUpiId} onChange={e => setRekycUpiId(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">KYC Document Type *</label>
                      <select value={rekycDocType} onChange={e => setRekycDocType(e.target.value)}
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
                        onClick={() => document.getElementById('rekyc-file-upload')?.click()}>
                        <input id="rekyc-file-upload" type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) setRekycFiles(prev => [...prev, ...files].slice(0, 5));
                          e.target.value = '';
                        }} />
                        {rekycFiles.length > 0 ? (
                          <div className="space-y-2">
                            {rekycFiles.map((f, i) => (
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
                                <button onClick={(ev) => { ev.stopPropagation(); setRekycFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="text-red-400 hover:text-red-600 flex-shrink-0 ml-2"><X size={14}/></button>
                              </div>
                            ))}
                            {rekycFiles.length < 5 && (
                              <p className="text-xs text-orange-500 mt-1">+ Tap to add more photos ({5 - rekycFiles.length} remaining)</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <Upload size={24} className="mx-auto text-orange-400 mb-1" />
                            <p className="text-sm text-orange-600 font-medium">Tap to upload documents</p>
                            <p className="text-xs text-gray-400">Aadhaar/PAN/Passport front + back (JPG, PNG, PDF)</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={async () => {
                      if (!rekycBankName || !rekycAccountNo || !rekycIfsc || !rekycDocType) { showToast('Sab required fields fill karo', 'warning'); return; }
                      if (rekycFiles.length === 0) { showToast('KYC document upload karo (front & back)', 'warning'); return; }
                      setSubmittingRekyc(true);
                      try {
                        await api.submitReKYC({ bank_name: rekycBankName, account_number: rekycAccountNo, ifsc_code: rekycIfsc, upi_id: rekycUpiId, document_type: rekycDocType });
                        let uploadedCount = 0;
                        let uploadErrors = 0;
                        for (const file of rekycFiles) {
                          try { await api.uploadKYCDocument(file); uploadedCount++; } catch { uploadErrors++; }
                        }
                        setShowReKyc(false);
                        setKycStatus('pending');
                        if (uploadErrors > 0 && uploadedCount === 0) {
                          showToast('Re-KYC details saved but documents upload failed!', 'warning');
                        } else if (uploadErrors > 0) {
                          showToast(`Re-KYC submitted! ${uploadedCount}/${rekycFiles.length} docs uploaded. Admin will verify.`, 'warning');
                        } else {
                          showToast('Re-KYC request submitted! ' + uploadedCount + ' documents uploaded. Admin will verify.', 'success');
                        }
                        loadData();
                      } catch (e: unknown) {
                        showToast(e instanceof Error ? e.message : 'Re-KYC submission failed', 'error');
                      }
                      setSubmittingRekyc(false);
                    }} disabled={submittingRekyc}
                      className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                      {submittingRekyc ? 'Submitting...' : <><Shield size={16} /> Submit Re-KYC Request</>}
                    </button>
                  </div>
                  <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-600"><Info size={12} className="inline mr-1" />Purane bank details admin approval tak active rahenge. Reject hone par purane details wapas aa jayenge.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending - Show submitted info */}
            {kycStatus === 'pending' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border">
                <h3 className="font-bold text-yellow-700 mb-2 flex items-center gap-2"><Shield size={16} /> {rekycOldDetails ? 'Re-KYC Under Review' : 'KYC Under Review'}</h3>
                <p className="text-xs text-gray-500 mb-3">{rekycOldDetails ? 'Aapke naye bank details admin verify kar rahe hain. Approve hone tak purane details active hain.' : 'Your KYC documents are under review. Admin will verify shortly. You will be able to withdraw once verified.'}</p>
                {rekycOldDetails ? (
                  <div className="space-y-3">
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <p className="text-xs font-semibold text-red-600 mb-2">Old Bank Details (Currently Active)</p>
                      <div className="space-y-1.5 text-sm">
                        {rekycOldDetails.bank_name ? <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{String(rekycOldDetails.bank_name)}</span></div> : null}
                        {rekycOldDetails.bank_account ? <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">****{String(rekycOldDetails.bank_account).slice(-4)}</span></div> : null}
                        {rekycOldDetails.bank_ifsc ? <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-medium">{String(rekycOldDetails.bank_ifsc)}</span></div> : null}
                        {rekycOldDetails.upi_id ? <div className="flex justify-between"><span className="text-gray-500">UPI</span><span className="font-medium">{String(rekycOldDetails.upi_id)}</span></div> : null}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs font-semibold text-green-600 mb-2">New Bank Details (Pending Approval)</p>
                      <div className="space-y-1.5 text-sm">
                        {profileData.bank_name ? <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{String(profileData.bank_name)}</span></div> : null}
                        {profileData.account_number ? <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">{String(profileData.account_number)}</span></div> : null}
                        {profileData.ifsc_code ? <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-medium">{String(profileData.ifsc_code)}</span></div> : null}
                        {profileData.upi_id ? <div className="flex justify-between"><span className="text-gray-500">UPI</span><span className="font-medium">{String(profileData.upi_id)}</span></div> : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-3 space-y-1.5 text-sm">
                    {profileData.bank_name ? <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{String(profileData.bank_name)}</span></div> : null}
                    {profileData.account_number ? <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">{String(profileData.account_number)}</span></div> : null}
                    {profileData.ifsc_code ? <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-medium">{String(profileData.ifsc_code)}</span></div> : null}
                  </div>
                )}
              </div>
            )}

            {/* KYC Form - show when not verified and not pending */}
            {(kycStatus !== 'verified' && kycStatus !== 'pending') && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-1">{kycStatus === 'rejected' ? 'Resubmit KYC Documents' : 'Complete KYC'}</h3>
                <p className="text-xs text-gray-500 mb-4">{kycStatus === 'rejected' ? 'Sahi documents upload karein aur dobara submit karein' : 'Fill bank details and upload document to enable withdrawals'}</p>

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
                      onClick={() => document.getElementById('wallet-kyc-file')?.click()}>
                      <input id="wallet-kyc-file" type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => {
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
                              <button onClick={(e) => { e.stopPropagation(); setKycFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="text-red-400 hover:text-red-600 flex-shrink-0 ml-2"><X size={14}/></button>
                            </div>
                          ))}
                          {kycFiles.length < 5 && (
                            <p className="text-xs text-orange-500 mt-1">+ Tap to add more photos ({5 - kycFiles.length} remaining)</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} className="mx-auto text-orange-400 mb-1" />
                          <p className="text-sm text-orange-600 font-medium">Tap to upload Aadhaar/PAN/Passport</p>
                          <p className="text-xs text-gray-400">Front + Back photos upload karein (JPG, PNG, PDF)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button onClick={async () => {
                    if (!bankName || !accountNo || !ifsc || !kycDoc) { showToast('Sab fields fill karo', 'warning'); return; }
                    if (kycFiles.length === 0) { showToast('KYC document upload karo (front & back)', 'warning'); return; }
                    setSubmittingKyc(true);
                    try {
                      await api.submitKYC({ bank_name: bankName, account_number: accountNo, ifsc_code: ifsc, document_type: kycDoc, upi_id: upiId });
                      // Upload all files one by one - track success/failure
                      let uploadedCount = 0;
                      let uploadErrors = 0;
                      for (const file of kycFiles) {
                        try {
                          await api.uploadKYCDocument(file);
                          uploadedCount++;
                        } catch (uploadErr) {
                          uploadErrors++;
                          console.error('Doc upload failed:', file.name, uploadErr);
                        }
                      }
                      setKycStatus('pending');
                      if (uploadErrors > 0 && uploadedCount === 0) {
                        showToast('KYC details saved but documents upload failed! Please try uploading again from Profile page.', 'warning');
                      } else if (uploadErrors > 0) {
                        showToast(`KYC submitted! ${uploadedCount}/${kycFiles.length} documents uploaded. ${uploadErrors} failed. Admin will verify soon.`, 'warning');
                      } else {
                        showToast('KYC submitted successfully! ' + uploadedCount + ' documents uploaded. Admin will verify soon.', 'success');
                      }
                      loadData();
                    } catch (e: unknown) {
                      showToast(e instanceof Error ? e.message : 'KYC submission failed', 'error');
                    }
                    setSubmittingKyc(false);
                  }} disabled={submittingKyc}
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                    {submittingKyc ? 'Submitting...' : <><Shield size={16} /> Submit KYC for Verification</>}
                  </button>
                </div>
              </div>
            )}

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
      </div>
    </div>
  );
}

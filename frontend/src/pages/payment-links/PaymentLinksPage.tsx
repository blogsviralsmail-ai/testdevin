import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Plus, Trash2, X, Copy, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';

interface PaymentLink { id: number; uid: string; title: string; amount: number; currency: string; gateway: string; status: string; payment_url: string; created_at: string; }

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', currency: 'INR', gateway: 'razorpay' });

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/payment-links'); const d = data.data || data; setLinks(d.items || d.data || d || []); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payment-links', { ...formData, amount: parseFloat(formData.amount) });
      toast.success('Payment link created'); setShowCreate(false); setFormData({ title: '', amount: '', currency: 'INR', gateway: 'razorpay' }); fetchLinks();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/payment-links/${id}`); toast.success('Deleted'); fetchLinks(); } catch { toast.error('Failed'); }
  };

  const copyLink = (url: string) => { navigator.clipboard.writeText(url); toast.success('Link copied!'); };

  const statusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'paid') return <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={14} /> Paid</span>;
    if (s === 'expired') return <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle size={14} /> Expired</span>;
    return <span className="flex items-center gap-1 text-yellow-600 text-xs"><Clock size={14} /> {status || 'Pending'}</span>;
  };

  const gateways = ['razorpay', 'stripe', 'paypal', 'paystack', 'phonepe', 'upi'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'NGN', 'RUB'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Payment Links</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and share payment links</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Create Link</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Total Links</p><p className="text-2xl font-bold dark:text-white mt-1">{links.length}</p></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Paid</p><p className="text-2xl font-bold text-green-600 mt-1">{links.filter(l => l.status === 'paid').length}</p></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600 mt-1">{links.filter(l => l.status !== 'paid').length}</p></div>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : links.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><CreditCard size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No payment links yet</p></div>
      ) : (
        <div className="space-y-3">
          {links.map(l => (
            <div key={l.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border dark:border-slate-700 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3"><h3 className="font-semibold dark:text-white">{l.title}</h3>{statusBadge(l.status)}</div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-lg font-bold text-emerald-600">{l.currency} {l.amount}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{l.gateway}</span>
                  <span className="text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {l.payment_url && <><button onClick={() => copyLink(l.payment_url)} className="p-2 text-gray-400 hover:text-emerald-500" title="Copy"><Copy size={16} /></button><a href={l.payment_url} target="_blank" rel="noopener" className="p-2 text-gray-400 hover:text-blue-500"><ExternalLink size={16} /></a></>}
                <button onClick={() => handleDelete(l.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Create Payment Link</h3><button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Title *</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Amount *</label><input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Currency</label>
                  <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Payment Gateway</label>
                <select value={formData.gateway} onChange={e => setFormData({...formData, gateway: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                  {gateways.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create Link</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

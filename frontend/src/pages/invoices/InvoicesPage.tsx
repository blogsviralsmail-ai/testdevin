import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Receipt, Eye, Download, X, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Invoice { id: number; uid: string; vendors_id: number; plan_name: string; price: number; status: string; payment_method: string; expiry_at: string; created_at: string; }

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/invoices'); const d = data.data || data; setInvoices(d.items || d.data || d || []); }
    catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const statusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'active') return <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={14} /> {status}</span>;
    if (s === 'expired' || s === 'cancelled') return <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle size={14} /> {status}</span>;
    return <span className="flex items-center gap-1 text-yellow-600 text-xs"><Clock size={14} /> {status || 'Pending'}</span>;
  };

  const downloadPdf = async (id: number) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${id}.pdf`; a.click();
    } catch { toast.error('PDF download not available'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Invoices</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View subscription invoices and payment history</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Total Invoices</p><p className="text-2xl font-bold dark:text-white mt-1">{invoices.length}</p></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Paid</p><p className="text-2xl font-bold text-green-600 mt-1">{invoices.filter(i => i.status?.toLowerCase() === 'paid' || i.status?.toLowerCase() === 'active').length}</p></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-emerald-600 mt-1">INR {invoices.reduce((s, i) => s + (i.price || 0), 0).toFixed(2)}</p></div>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><Receipt size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No invoices yet</p></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
              <th className="py-3 px-4 text-left text-gray-500 font-medium">Invoice #</th>
              <th className="py-3 px-4 text-left text-gray-500 font-medium">Plan</th>
              <th className="py-3 px-4 text-left text-gray-500 font-medium">Amount</th>
              <th className="py-3 px-4 text-left text-gray-500 font-medium">Status</th>
              <th className="py-3 px-4 text-left text-gray-500 font-medium">Payment</th>
              <th className="py-3 px-4 text-left text-gray-500 font-medium">Date</th>
              <th className="py-3 px-4 text-right text-gray-500 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750">
                  <td className="py-3 px-4 dark:text-gray-300">#{inv.id}</td>
                  <td className="py-3 px-4 font-medium dark:text-white">{inv.plan_name || 'N/A'}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">INR {inv.price}</td>
                  <td className="py-3 px-4">{statusBadge(inv.status)}</td>
                  <td className="py-3 px-4 dark:text-gray-300">{inv.payment_method || '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewInvoice(inv)} className="p-1 text-gray-400 hover:text-blue-500"><Eye size={16} /></button>
                      <button onClick={() => downloadPdf(inv.id)} className="p-1 text-gray-400 hover:text-emerald-500"><Download size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Invoice #{viewInvoice.id}</h3><button onClick={() => setViewInvoice(null)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3">
              {[['Plan', viewInvoice.plan_name], ['Amount', `INR ${viewInvoice.price}`], ['Status', viewInvoice.status], ['Payment Method', viewInvoice.payment_method], ['Expiry', viewInvoice.expiry_at ? new Date(viewInvoice.expiry_at).toLocaleDateString() : '-'], ['Created', new Date(viewInvoice.created_at).toLocaleString()]].map(([label, val]) => (
                <div key={label as string} className="flex justify-between py-2 border-b dark:border-slate-700"><span className="text-sm text-gray-500">{label}</span><span className="text-sm font-medium dark:text-white">{(val as string) || '-'}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

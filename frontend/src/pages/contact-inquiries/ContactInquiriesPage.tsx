import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Mail, Trash2, Eye, Search } from 'lucide-react';

interface Inquiry { id: number; name: string; email: string; phone: string; subject: string; message: string; status: string; created_at: string; }

export default function ContactInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState<Inquiry | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/contact-inquiries?search=${search}`); setInquiries((data.data || data)?.data || data.data || []); }
    catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this inquiry?')) return;
    try { await api.delete(`/contact-inquiries/${id}`); toast.success('Deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Mail className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Contact Inquiries</h1></div>
      </div>
      <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search inquiries..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>

      {viewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold dark:text-white mb-4">Inquiry Details</h3>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-gray-500">Name:</span> <span className="dark:text-white">{viewItem.name}</span></div>
              <div><span className="font-medium text-gray-500">Email:</span> <span className="dark:text-white">{viewItem.email}</span></div>
              <div><span className="font-medium text-gray-500">Phone:</span> <span className="dark:text-white">{viewItem.phone}</span></div>
              <div><span className="font-medium text-gray-500">Subject:</span> <span className="dark:text-white">{viewItem.subject}</span></div>
              <div><span className="font-medium text-gray-500">Message:</span><p className="dark:text-gray-300 mt-1">{viewItem.message}</p></div>
              <div><span className="font-medium text-gray-500">Date:</span> <span className="dark:text-white">{new Date(viewItem.created_at).toLocaleString()}</span></div>
            </div>
            <button onClick={() => setViewItem(null)} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg dark:text-white">Close</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
         inquiries.length === 0 ? <div className="p-8 text-center text-gray-500">No contact inquiries found.</div> : (
          <table className="w-full"><thead className="bg-gray-50 dark:bg-slate-700"><tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Name</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Email</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Subject</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Date</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
          </tr></thead><tbody className="divide-y dark:divide-slate-700">
            {inquiries.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3 text-sm dark:text-white">{i.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{i.email}</td>
                <td className="px-4 py-3 text-sm dark:text-gray-300">{i.subject}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{i.created_at ? new Date(i.created_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewItem(i)} className="text-blue-500 hover:text-blue-700 mr-2"><Eye size={16} /></button>
                  <button onClick={() => handleDelete(i.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </td>
              </tr>))}
          </tbody></table>)}
      </div>
    </div>
  );
}

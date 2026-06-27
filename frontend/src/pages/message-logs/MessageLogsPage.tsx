import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Search, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface MessageLog { id: number; wa_id: string; contact_name: string; direction: string; type: string; status: string; message: string; created_at: string; }

export default function MessageLogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const fetchData = async () => { setLoading(true); try { const { data } = await api.get(`/whatsapp/message-logs?page=${page}&search=${search}&direction=${direction}`); const d = data.data || data; setLogs(d.data || d.items || []); if (d.meta) setMeta(d.meta); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, [page, search, direction]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><FileText className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Message Logs</h1></div>
      <div className="flex gap-4">
        <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by phone or name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
        <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1); }}
          className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          <option value="all">All</option><option value="incoming">Incoming</option><option value="outgoing">Outgoing</option>
        </select>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
         logs.length === 0 ? <div className="p-8 text-center text-gray-500">No message logs found.</div> : (
          <table className="w-full"><thead className="bg-gray-50 dark:bg-slate-700"><tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Direction</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Contact</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Type</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Message</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Time</th>
          </tr></thead><tbody className="divide-y dark:divide-slate-700">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3">{l.direction === 'incoming' ? <ArrowDownLeft size={16} className="text-blue-500" /> : <ArrowUpRight size={16} className="text-emerald-500" />}</td>
                <td className="px-4 py-3 text-sm dark:text-white">{l.contact_name || l.wa_id}</td>
                <td className="px-4 py-3 text-sm text-gray-500 capitalize">{l.type}</td>
                <td className="px-4 py-3 text-sm dark:text-gray-300 max-w-xs truncate">{l.message}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${l.status === 'delivered' ? 'bg-green-100 text-green-700' : l.status === 'sent' ? 'bg-blue-100 text-blue-700' : l.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{l.status}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{l.created_at ? new Date(l.created_at).toLocaleString() : '-'}</td>
              </tr>))}
          </tbody></table>)}
        {meta.totalPages > 1 && <div className="flex justify-center gap-2 p-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded dark:border-slate-600 dark:text-gray-300 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-sm dark:text-gray-300">{page} / {meta.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="px-3 py-1 border rounded dark:border-slate-600 dark:text-gray-300 disabled:opacity-50">Next</button>
        </div>}
      </div>
    </div>
  );
}

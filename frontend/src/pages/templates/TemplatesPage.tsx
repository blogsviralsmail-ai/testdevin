import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, RefreshCw, Search, Eye, X, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Template {
  id: number; uid: string; template_id: string; template_name: string; language: string;
  category: string; status: string; components: string; created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewTemplate, setViewTemplate] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/whatsapp/templates?search=${search}`);
      const d = data.data || data;
      setTemplates(d.items || d.data || d || []);
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/whatsapp/templates/sync');
      toast.success('Templates synced from Meta');
      fetchTemplates();
    } catch { toast.error('Sync failed - check WhatsApp API credentials'); }
    finally { setSyncing(false); }
  };

  const statusIcon = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'APPROVED') return <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={14} /> Approved</span>;
    if (s === 'PENDING') return <span className="flex items-center gap-1 text-yellow-600 text-xs"><Clock size={14} /> Pending</span>;
    return <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle size={14} /> {status}</span>;
  };

  const parseComponents = (componentsStr: string) => {
    try { return JSON.parse(componentsStr || '[]'); } catch { return []; }
  };

  const filtered = templates.filter(t => filterStatus === 'all' || t.status?.toUpperCase() === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Templates</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage WhatsApp message templates synced from Meta</p></div>
        <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync from Meta'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: templates.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Approved', value: templates.filter(t => t.status?.toUpperCase() === 'APPROVED').length, color: 'bg-green-50 text-green-600' },
          { label: 'Pending', value: templates.filter(t => t.status?.toUpperCase() === 'PENDING').length, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Rejected', value: templates.filter(t => t.status?.toUpperCase() === 'REJECTED').length, color: 'bg-red-50 text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
          <Search size={16} className="text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white" />
        </div>
        <div className="flex gap-2">
          {['all', 'APPROVED', 'PENDING', 'REJECTED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm ${filterStatus === s ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-gray-300'}`}>{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><FileText size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No templates found. Click "Sync from Meta" to import.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const components = parseComponents(t.components);
            const body = components.find((c: Record<string, string>) => c.type === 'BODY');
            const header = components.find((c: Record<string, string>) => c.type === 'HEADER');
            return (
              <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5 hover:shadow-md transition cursor-pointer" onClick={() => setViewTemplate(t)}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold dark:text-white truncate">{t.template_name}</h3>
                  {statusIcon(t.status)}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{t.category || 'UTILITY'}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{t.language || 'en'}</span>
                </div>
                {header && <p className="text-xs text-gray-400 mb-1">Header: {header.format || header.type}</p>}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{body?.text || 'No body text'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">ID: {t.template_id}</span>
                  <button className="text-emerald-500 hover:text-emerald-600"><Eye size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Template Modal */}
      {viewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Template Preview</h3><button onClick={() => setViewTemplate(null)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold dark:text-white">{viewTemplate.template_name}</h4>
                {statusIcon(viewTemplate.status)}
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{viewTemplate.category}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{viewTemplate.language}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">ID: {viewTemplate.template_id}</span>
              </div>
              {/* Template Preview */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-semibold mb-2">PREVIEW</p>
                {parseComponents(viewTemplate.components).map((comp: Record<string, string>, i: number) => (
                  <div key={i} className="mb-2">
                    <p className="text-xs text-gray-400 uppercase">{comp.type}</p>
                    <p className="text-sm dark:text-white">{comp.text || comp.format || JSON.stringify(comp)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2 border-t dark:border-slate-700">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm dark:text-white">{new Date(viewTemplate.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

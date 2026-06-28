import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Workflow, Plus, Edit, Trash2, X, RefreshCw, Eye } from 'lucide-react';

interface WhatsAppFlow { id: number; uid: string; flow_id: string; name: string; status: string; created_at: string; }

export default function FlowsPage() {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', flowId: '' });

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/whatsapp-flows'); const d = data.data || data; setFlows(d.items || d.data || d || []); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/whatsapp-flows', formData); toast.success('Created'); setShowCreate(false); setFormData({ name: '', flowId: '' }); fetchFlows(); }
    catch { toast.error('Failed'); }
  };

  const handleSync = async () => {
    try { await api.post('/whatsapp-flows/sync'); toast.success('Synced from Meta'); fetchFlows(); }
    catch { toast.error('Sync failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/whatsapp-flows/${id}`); toast.success('Deleted'); fetchFlows(); } catch { toast.error('Failed'); }
  };

  const statusColors: Record<string, string> = { PUBLISHED: 'bg-green-100 text-green-700', DRAFT: 'bg-gray-100 text-gray-700', DEPRECATED: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">WhatsApp Flows</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Meta's native WhatsApp Flows integration</p></div>
        <div className="flex gap-2">
          <button onClick={handleSync} className="flex items-center gap-2 px-3 py-2 border dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300"><RefreshCw size={16} /> Sync from Meta</button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> New Flow</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : flows.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><Workflow size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No WhatsApp Flows yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map(f => (
            <div key={f.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold dark:text-white">{f.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[f.status] || statusColors.DRAFT}`}>{f.status || 'DRAFT'}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">Flow ID: {f.flow_id || 'N/A'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1">
                  <button className="p-1 text-gray-400 hover:text-blue-500"><Eye size={16} /></button>
                  <button onClick={() => handleDelete(f.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Create WhatsApp Flow</h3><button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Flow Name *</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Meta Flow ID</label><input value={formData.flowId} onChange={e => setFormData({...formData, flowId: e.target.value})} placeholder="Optional - auto-created on Meta" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

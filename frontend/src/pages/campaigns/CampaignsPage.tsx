import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Send, Plus, Search, Eye, Trash2, Play, Pause, Clock, CheckCircle, XCircle, X, BarChart3 } from 'lucide-react';

interface Campaign {
  id: number; uid: string; name: string; status: string; scheduled_at: string;
  started_at: string; completed_at: string; total_count: number; sent_count: number;
  failed_count: number; created_at: string; whatsapp_templates_id: number;
}

interface Template { id: number; template_name: string; status: string; }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 1 });
  const [showCreate, setShowCreate] = useState(false);
  const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({ name: '', templateId: '', scheduledAt: '' });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/campaigns?page=${page}&search=${search}`);
      const d = data.data || data;
      setCampaigns(d.items || d.data || d || []);
      if (d.meta) setMeta(d.meta);
    } catch { toast.error('Failed to load campaigns'); }
    finally { setLoading(false); }
  }, [page, search]);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/whatsapp/templates');
      const d = data.data || data;
      setTemplates(d.items || d.data || d || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCampaigns(); fetchTemplates(); }, [fetchCampaigns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/campaigns', {
        name: formData.name,
        templateId: parseInt(formData.templateId),
        scheduledAt: formData.scheduledAt || null,
      });
      toast.success('Campaign created');
      setShowCreate(false);
      setFormData({ name: '', templateId: '', scheduledAt: '' });
      fetchCampaigns();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    }
  };

  const handleStart = async (id: number) => {
    try { await api.post(`/campaigns/${id}/start`); toast.success('Campaign started'); fetchCampaigns(); }
    catch { toast.error('Failed to start campaign'); }
  };

  const handlePause = async (id: number) => {
    try { await api.post(`/campaigns/${id}/pause`); toast.success('Campaign paused'); fetchCampaigns(); }
    catch { toast.error('Failed to pause campaign'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campaign?')) return;
    try { await api.delete(`/campaigns/${id}`); toast.success('Campaign deleted'); fetchCampaigns(); }
    catch { toast.error('Failed to delete'); }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700', pending: 'bg-yellow-100 text-yellow-700',
      running: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700', paused: 'bg-orange-100 text-orange-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>{status || 'draft'}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Campaigns</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Send bulk template messages to contact groups</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> New Campaign</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: meta.total, icon: Send, color: 'text-blue-500 bg-blue-50' },
          { label: 'Running', value: campaigns.filter(c => c.status === 'running').length, icon: Play, color: 'text-emerald-500 bg-emerald-50' },
          { label: 'Completed', value: campaigns.filter(c => c.status === 'completed').length, icon: CheckCircle, color: 'text-green-500 bg-green-50' },
          { label: 'Scheduled', value: campaigns.filter(c => c.status === 'pending').length, icon: Clock, color: 'text-yellow-500 bg-yellow-50' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold dark:text-white mt-1">{s.value}</p></div>
              <div className={`p-3 rounded-xl ${s.color}`}><s.icon size={20} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
        <Search size={16} className="text-gray-400" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search campaigns..." className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white" />
      </div>

      {/* Campaign List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded" />)}</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-400"><Send size={48} className="mx-auto mb-4 opacity-50" /><p>No campaigns yet. Create your first campaign!</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Name</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Status</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Progress</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Scheduled</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Created</th>
                <th className="py-3 px-4 text-right text-gray-500 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750">
                    <td className="py-3 px-4 font-medium dark:text-white">{c.name}</td>
                    <td className="py-3 px-4">{statusBadge(c.status)}</td>
                    <td className="py-3 px-4 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2 max-w-[120px]">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${c.total_count > 0 ? (c.sent_count / c.total_count) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs">{c.sent_count}/{c.total_count}</span>
                      </div>
                      {c.failed_count > 0 && <span className="text-xs text-red-500">{c.failed_count} failed</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '-'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewCampaign(c)} className="p-1 text-gray-400 hover:text-blue-500"><Eye size={16} /></button>
                        {(c.status === 'draft' || c.status === 'pending') && <button onClick={() => handleStart(c.id)} className="p-1 text-gray-400 hover:text-emerald-500"><Play size={16} /></button>}
                        {c.status === 'running' && <button onClick={() => handlePause(c.id)} className="p-1 text-gray-400 hover:text-orange-500"><Pause size={16} /></button>}
                        <button onClick={() => handleDelete(c.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-gray-500">{meta.total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-slate-600 dark:text-gray-300">Prev</button>
              <span className="px-3 py-1 text-sm dark:text-gray-300">{page} / {meta.totalPages}</span>
              <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page === meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-slate-600 dark:text-gray-300">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Create Campaign</h3><button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Campaign Name *</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">Template *</label>
                <select value={formData.templateId} onChange={e => setFormData({...formData, templateId: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                  <option value="">Select template...</option>
                  {templates.filter(t => t.status === 'APPROVED').map(t => <option key={t.id} value={t.id}>{t.template_name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Schedule (optional)</label><input type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData({...formData, scheduledAt: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Create Campaign</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Campaign Modal */}
      {viewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Campaign Details</h3><button onClick={() => setViewCampaign(null)}><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><h4 className="text-xl font-bold dark:text-white">{viewCampaign.name}</h4>{statusBadge(viewCampaign.status)}</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-600">{viewCampaign.total_count}</p><p className="text-xs text-gray-500">Total</p></div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-600">{viewCampaign.sent_count}</p><p className="text-xs text-gray-500">Sent</p></div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-red-600">{viewCampaign.failed_count}</p><p className="text-xs text-gray-500">Failed</p></div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: `${viewCampaign.total_count > 0 ? (viewCampaign.sent_count / viewCampaign.total_count) * 100 : 0}%` }} />
              </div>
              {[['Scheduled', viewCampaign.scheduled_at], ['Started', viewCampaign.started_at], ['Completed', viewCampaign.completed_at], ['Created', viewCampaign.created_at]].map(([label, val]) => (
                <div key={label as string} className="flex justify-between py-2 border-b dark:border-slate-700"><span className="text-sm text-gray-500">{label}</span><span className="text-sm dark:text-white">{val ? new Date(val as string).toLocaleString() : '-'}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

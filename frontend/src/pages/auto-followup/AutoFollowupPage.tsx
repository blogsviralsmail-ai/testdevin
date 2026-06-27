import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { RefreshCw, Plus, Trash2, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

interface Followup { id: number; title: string; trigger_type: string; delay_minutes: number; message: string; template_id: number; status: number; created_at: string; }

export default function AutoFollowupPage() {
  const [items, setItems] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', trigger_type: 'no_reply', delay_minutes: 60, message: '' });

  const fetchData = async () => { setLoading(true); try { const { data } = await api.get('/auto-followup'); setItems((data.data || data)?.data || data.data || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.message) { toast.error('Title and message required'); return; }
    try { await api.post('/auto-followup', formData); toast.success('Follow-up created'); setShowCreate(false); setFormData({ title: '', trigger_type: 'no_reply', delay_minutes: 60, message: '' }); fetchData(); }
    catch { toast.error('Failed to create follow-up'); }
  };

  const toggleStatus = async (item: Followup) => {
    try { await api.put(`/auto-followup/${item.id}`, { status: item.status === 1 ? 0 : 1 }); fetchData(); }
    catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this follow-up?')) return;
    try { await api.delete(`/auto-followup/${id}`); toast.success('Deleted'); fetchData(); } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><RefreshCw className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Auto Follow-up</h1></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"><Plus size={18} /> Create Follow-up</button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <h3 className="font-semibold dark:text-white mb-4">New Auto Follow-up</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <select value={formData.trigger_type} onChange={(e) => setFormData({...formData, trigger_type: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option value="no_reply">No Reply</option><option value="after_message">After Message</option><option value="after_campaign">After Campaign</option>
            </select>
            <input type="number" placeholder="Delay (minutes)" value={formData.delay_minutes} onChange={(e) => setFormData({...formData, delay_minutes: parseInt(e.target.value)})} className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <div className="md:col-span-2"><textarea placeholder="Message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">Save</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg dark:border-slate-600 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
         items.length === 0 ? <div className="p-8 text-center text-gray-500">No auto follow-ups configured.</div> : (
          <table className="w-full"><thead className="bg-gray-50 dark:bg-slate-700"><tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Title</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Trigger</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Delay</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
          </tr></thead><tbody className="divide-y dark:divide-slate-700">
            {items.map((item) => (
              <tr key={item.id}><td className="px-4 py-3 text-sm dark:text-white">{item.title}</td>
                <td className="px-4 py-3 text-sm text-gray-500 capitalize">{item.trigger_type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.delay_minutes} min</td>
                <td className="px-4 py-3"><button onClick={() => toggleStatus(item)}>{item.status === 1 ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-400" />}</button></td>
                <td className="px-4 py-3 text-right"><button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
              </tr>))}
          </tbody></table>)}
      </div>
    </div>
  );
}

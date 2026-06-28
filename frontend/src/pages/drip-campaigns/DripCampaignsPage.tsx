import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Droplets, Plus, Trash2, Play, Pause, Edit } from 'lucide-react';

interface DripCampaign { id: number; title: string; description: string; steps_count: number; contacts_count: number; status: string; created_at: string; }

export default function DripCampaignsPage() {
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const fetchData = async () => { setLoading(true); try { const { data } = await api.get('/drip-campaigns'); setCampaigns((data.data || data)?.data || data.data || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!formData.title) { toast.error('Title required'); return; }
    try { await api.post('/drip-campaigns', formData); toast.success('Drip campaign created'); setShowCreate(false); setFormData({ title: '', description: '' }); fetchData(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => { if (!confirm('Delete?')) return; try { await api.delete(`/drip-campaigns/${id}`); toast.success('Deleted'); fetchData(); } catch { toast.error('Failed'); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Droplets className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Drip Campaigns</h1></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"><Plus size={18} /> Create Drip Campaign</button>
      </div>
      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <input placeholder="Campaign Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-3" />
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} className="bg-emerald-500 text-white px-4 py-2 rounded-lg">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg dark:border-slate-600 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
         campaigns.length === 0 ? <div className="p-12 text-center"><Droplets size={48} className="mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-semibold dark:text-white">No Drip Campaigns</h3><p className="text-gray-500 mt-2">Create automated multi-step messaging campaigns.</p></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {campaigns.map(c => (
              <div key={c.id} className="border dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between"><h3 className="font-semibold dark:text-white">{c.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span></div>
                <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                <div className="flex justify-between mt-3 text-sm text-gray-500"><span>{c.steps_count || 0} steps</span><span>{c.contacts_count || 0} contacts</span></div>
                <div className="flex gap-2 mt-3"><button className="text-blue-500"><Edit size={16} /></button><button onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 size={16} /></button></div>
              </div>))}
          </div>)}
      </div>
    </div>
  );
}

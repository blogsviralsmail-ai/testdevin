import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

interface Survey { id: number; title: string; description: string; questions_count: number; responses_count: number; status: number; created_at: string; }

export default function FeedbackPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const fetchData = async () => { setLoading(true); try { const { data } = await api.get('/feedback'); setSurveys((data.data || data)?.data || data.data || []); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!formData.title) { toast.error('Title required'); return; }
    try { await api.post('/feedback', formData); toast.success('Survey created'); setShowCreate(false); setFormData({ title: '', description: '' }); fetchData(); }
    catch { toast.error('Failed to create'); }
  };

  const handleDelete = async (id: number) => { if (!confirm('Delete?')) return; try { await api.delete(`/feedback/${id}`); toast.success('Deleted'); fetchData(); } catch { toast.error('Failed'); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><ClipboardList className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Feedback / Survey</h1></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"><Plus size={18} /> Create Survey</button>
      </div>
      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <h3 className="font-semibold dark:text-white mb-4">New Feedback Survey</h3>
          <input placeholder="Survey Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-3" />
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} className="bg-emerald-500 text-white px-4 py-2 rounded-lg">Save</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg dark:border-slate-600 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
         surveys.length === 0 ? <div className="p-12 text-center"><ClipboardList size={48} className="mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-semibold dark:text-white">No Surveys</h3><p className="text-gray-500 mt-2">Create your first feedback survey to collect customer responses.</p></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {surveys.map(s => (
              <div key={s.id} className="border dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold dark:text-white">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.description}</p>
                <div className="flex justify-between mt-3 text-sm text-gray-500">
                  <span>{s.questions_count || 0} questions</span><span>{s.responses_count || 0} responses</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="text-blue-500 hover:text-blue-700"><Eye size={16} /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </div>
              </div>))}
          </div>)}
      </div>
    </div>
  );
}

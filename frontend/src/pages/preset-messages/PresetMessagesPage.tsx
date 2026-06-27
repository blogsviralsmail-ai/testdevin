import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Edit, Trash2, X, Send, Image, FileText, Video } from 'lucide-react';

interface PresetMessage { id: number; title: string; message: string; type: string; buttons: string; media_url: string; status: number; created_at: string; }

export default function PresetMessagesPage() {
  const [messages, setMessages] = useState<PresetMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editMsg, setEditMsg] = useState<PresetMessage | null>(null);
  const [formData, setFormData] = useState({ title: '', message: '', type: 'text', buttons: '', mediaUrl: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/preset-messages'); const d = data.data || data; setMessages(d.items || d.data || d || []); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMsg) { await api.put(`/preset-messages/${editMsg.id}`, formData); toast.success('Updated'); }
      else { await api.post('/preset-messages', formData); toast.success('Created'); }
      setShowCreate(false); setEditMsg(null); setFormData({ title: '', message: '', type: 'text', buttons: '', mediaUrl: '' }); fetch();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/preset-messages/${id}`); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  const typeIcon = (type: string) => {
    if (type === 'image') return <Image size={16} className="text-blue-500" />;
    if (type === 'video') return <Video size={16} className="text-purple-500" />;
    if (type === 'document') return <FileText size={16} className="text-orange-500" />;
    return <MessageSquare size={16} className="text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Preset Messages</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick reply templates for chat</p></div>
        <button onClick={() => { setShowCreate(true); setEditMsg(null); setFormData({ title: '', message: '', type: 'text', buttons: '', mediaUrl: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> New Preset</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : messages.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><MessageSquare size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No preset messages yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {messages.map(m => (
            <div key={m.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">{typeIcon(m.type)}<h3 className="font-semibold dark:text-white">{m.title}</h3></div>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{m.type}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-3 mb-3">{m.message}</p>
              {m.media_url && <p className="text-xs text-blue-500 truncate mb-2">{m.media_url}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditMsg(m); setShowCreate(true); setFormData({ title: m.title, message: m.message, type: m.type || 'text', buttons: m.buttons || '', mediaUrl: m.media_url || '' }); }} className="p-1 text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">{editMsg ? 'Edit' : 'Create'} Preset Message</h3><button onClick={() => { setShowCreate(false); setEditMsg(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Title *</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                  {['text', 'image', 'video', 'document', 'template'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Message *</label><textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required rows={4} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              {formData.type !== 'text' && <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Media URL</label><input value={formData.mediaUrl} onChange={e => setFormData({...formData, mediaUrl: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>}
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Buttons (JSON, optional)</label><input value={formData.buttons} onChange={e => setFormData({...formData, buttons: e.target.value})} placeholder='[{"type":"reply","title":"Yes"}]' className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">{editMsg ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditMsg(null); }} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

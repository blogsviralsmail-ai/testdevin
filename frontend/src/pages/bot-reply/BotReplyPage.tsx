import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Bot, Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, X, Zap } from 'lucide-react';

interface BotReply {
  id: number; name: string; keyword: string; match_type: string;
  reply_message: string; reply_type: string; priority: number;
  status: number; trigger_count: number; created_at: string;
}

export default function BotReplyPage() {
  const [replies, setReplies] = useState<BotReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editReply, setEditReply] = useState<BotReply | null>(null);
  const [formData, setFormData] = useState({
    name: '', keyword: '', matchType: 'exact', replyMessage: '', replyType: 'text', priority: 0,
  });

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/bot-replies?search=${search}`);
      const d = data.data || data;
      setReplies(d.items || d.data || d || []);
    } catch { toast.error('Failed to load bot replies'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchReplies(); }, [fetchReplies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editReply) {
        await api.put(`/bot-replies/${editReply.id}`, formData);
        toast.success('Updated');
      } else {
        await api.post('/bot-replies', formData);
        toast.success('Created');
      }
      setShowCreate(false); setEditReply(null);
      setFormData({ name: '', keyword: '', matchType: 'exact', replyMessage: '', replyType: 'text', priority: 0 });
      fetchReplies();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this bot reply?')) return;
    try { await api.delete(`/bot-replies/${id}`); toast.success('Deleted'); fetchReplies(); }
    catch { toast.error('Failed'); }
  };

  const handleToggle = async (reply: BotReply) => {
    try {
      await api.put(`/bot-replies/${reply.id}`, { status: reply.status === 1 ? 0 : 1 });
      toast.success(reply.status === 1 ? 'Disabled' : 'Enabled');
      fetchReplies();
    } catch { toast.error('Failed'); }
  };

  const matchTypes = [
    { value: 'exact', label: 'Exact Match' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'regex', label: 'Regex Pattern' },
  ];

  const replyTypes = [
    { value: 'text', label: 'Text Message' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'document', label: 'Document' },
    { value: 'template', label: 'Template Message' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Bot Reply</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create auto-reply rules for incoming messages</p></div>
        <button onClick={() => { setShowCreate(true); setEditReply(null); setFormData({ name: '', keyword: '', matchType: 'exact', replyMessage: '', replyType: 'text', priority: 0 }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Add Rule</button>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
        <Search size={16} className="text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rules..." className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white" />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-xl" />)}</div>
      ) : replies.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><Bot size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No bot reply rules yet</p></div>
      ) : (
        <div className="space-y-3">
          {replies.sort((a, b) => b.priority - a.priority).map(reply => (
            <div key={reply.id} className={`bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border dark:border-slate-700 ${reply.status !== 1 ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><Zap className="text-emerald-600" size={20} /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold dark:text-white">{reply.name}</h3>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{reply.match_type}</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{reply.reply_type}</span>
                      <span className="text-xs text-gray-400">Priority: {reply.priority}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Keyword: <code className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">{reply.keyword}</code></p>
                    <p className="text-sm text-gray-500 mt-1 truncate max-w-lg">Reply: {reply.reply_message?.substring(0, 100)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold dark:text-white">{reply.trigger_count}</p>
                    <p className="text-xs text-gray-400">triggers</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleToggle(reply)} className="p-1">{reply.status === 1 ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} className="text-gray-400" />}</button>
                  <button onClick={() => { setEditReply(reply); setShowCreate(true); setFormData({ name: reply.name, keyword: reply.keyword, matchType: reply.match_type, replyMessage: reply.reply_message, replyType: reply.reply_type, priority: reply.priority }); }} className="p-1 text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(reply.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">{editReply ? 'Edit' : 'Create'} Bot Reply Rule</h3><button onClick={() => { setShowCreate(false); setEditReply(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Rule Name *</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Keyword *</label><input value={formData.keyword} onChange={e => setFormData({...formData, keyword: e.target.value})} required placeholder="e.g. hello, hi" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Match Type</label>
                  <select value={formData.matchType} onChange={e => setFormData({...formData, matchType: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    {matchTypes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Reply Type</label>
                  <select value={formData.replyType} onChange={e => setFormData({...formData, replyType: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    {replyTypes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Priority</label><input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Reply Message *</label><textarea value={formData.replyMessage} onChange={e => setFormData({...formData, replyMessage: e.target.value})} required rows={4} placeholder="Type your auto-reply message..." className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">{editReply ? 'Update' : 'Create'} Rule</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditReply(null); }} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

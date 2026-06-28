import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Edit, Trash2, Eye, X, Globe } from 'lucide-react';

interface Article { id: number; uid: string; title: string; slug: string; content: string; category: string; status: number; created_at: string; }

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: '', status: 1 });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/blog'); const d = data.data || data; setArticles(d.items || d.data || d || []); }
    catch { toast.error('Failed to load articles'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editArticle) { await api.put(`/blog/${editArticle.id}`, formData); toast.success('Updated'); }
      else { await api.post('/blog', formData); toast.success('Created'); }
      setShowCreate(false); setEditArticle(null); setFormData({ title: '', content: '', category: '', status: 1 }); fetchArticles();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this article?')) return;
    try { await api.delete(`/blog/${id}`); toast.success('Deleted'); fetchArticles(); } catch { toast.error('Failed'); }
  };

  const categories = ['General', 'WhatsApp', 'Marketing', 'Tutorial', 'News', 'Updates'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Blog</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage blog articles</p></div>
        <button onClick={() => { setShowCreate(true); setEditArticle(null); setFormData({ title: '', content: '', category: '', status: 1 }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> New Article</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : articles.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><BookOpen size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No articles yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(a => (
            <div key={a.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{a.category || 'General'}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${a.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{a.status === 1 ? 'Published' : 'Draft'}</span>
              </div>
              <h3 className="font-semibold dark:text-white mb-2">{a.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-3 mb-3">{(a.content || '').replace(/<[^>]*>/g, '').substring(0, 150)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1">
                  <button onClick={() => window.open(`/blog/${a.slug}`, '_blank')} className="p-1 text-gray-400 hover:text-blue-500"><Globe size={16} /></button>
                  <button onClick={() => { setEditArticle(a); setShowCreate(true); setFormData({ title: a.title, content: a.content || '', category: a.category || '', status: a.status }); }} className="p-1 text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">{editArticle ? 'Edit' : 'Create'} Article</h3><button onClick={() => { setShowCreate(false); setEditArticle(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Title *</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    <option value="">Select...</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: parseInt(e.target.value)})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    <option value={1}>Published</option><option value={0}>Draft</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Content *</label><textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required rows={12} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white font-mono" placeholder="Write your article content here... HTML is supported." /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">{editArticle ? 'Update' : 'Publish'}</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditArticle(null); }} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

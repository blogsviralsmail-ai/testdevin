import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Layout, Plus, Edit, Trash2, X, Globe, Eye, Code } from 'lucide-react';

interface Page { id: number; uid: string; title: string; slug: string; content: string; meta_title: string; meta_description: string; status: number; created_at: string; }

export default function PagesBuilderPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPage, setEditPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', metaTitle: '', metaDescription: '', status: 1 });

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/pages'); const d = data.data || data; setPages(d.items || d.data || d || []); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editPage) { await api.put(`/pages/${editPage.id}`, formData); toast.success('Updated'); }
      else { await api.post('/pages', formData); toast.success('Created'); }
      setShowCreate(false); setEditPage(null); setFormData({ title: '', content: '', metaTitle: '', metaDescription: '', status: 1 }); fetchPages();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/pages/${id}`); toast.success('Deleted'); fetchPages(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Pages</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage landing pages</p></div>
        <button onClick={() => { setShowCreate(true); setEditPage(null); setFormData({ title: '', content: '', metaTitle: '', metaDescription: '', status: 1 }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> New Page</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : pages.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><Layout size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No pages yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold dark:text-white">{p.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{p.status === 1 ? 'Published' : 'Draft'}</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">/{p.slug}</p>
              {p.meta_title && <p className="text-xs text-gray-400 mb-1">SEO: {p.meta_title}</p>}
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{(p.content || '').replace(/<[^>]*>/g, '').substring(0, 100)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1">
                  <button onClick={() => window.open(`/page/${p.slug}`, '_blank')} className="p-1 text-gray-400 hover:text-blue-500"><Globe size={16} /></button>
                  <button onClick={() => { setEditPage(p); setShowCreate(true); setFormData({ title: p.title, content: p.content || '', metaTitle: p.meta_title || '', metaDescription: p.meta_description || '', status: p.status }); }} className="p-1 text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">{editPage ? 'Edit' : 'Create'} Page</h3><button onClick={() => { setShowCreate(false); setEditPage(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Page Title *</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Meta Title (SEO)</label><input value={formData.metaTitle} onChange={e => setFormData({...formData, metaTitle: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: parseInt(e.target.value)})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    <option value={1}>Published</option><option value={0}>Draft</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Meta Description</label><input value={formData.metaDescription} onChange={e => setFormData({...formData, metaDescription: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Content (HTML) *</label><textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required rows={15} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white font-mono" placeholder="<h1>Page Title</h1><p>Your content...</p>" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">{editPage ? 'Update' : 'Create'} Page</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditPage(null); }} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

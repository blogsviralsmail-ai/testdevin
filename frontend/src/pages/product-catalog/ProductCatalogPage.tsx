import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Package, Plus, Edit, Trash2, X, Share2, Image } from 'lucide-react';

interface Product { id: number; uid: string; name: string; description: string; price: number; image_url: string; category: string; status: number; created_at: string; }

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', imageUrl: '', category: '' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/product-catalog'); const d = data.data || data; setProducts(d.items || d.data || d || []); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, price: parseFloat(formData.price) };
      if (editProduct) { await api.put(`/product-catalog/${editProduct.id}`, payload); toast.success('Updated'); }
      else { await api.post('/product-catalog', payload); toast.success('Created'); }
      setShowCreate(false); setEditProduct(null); setFormData({ name: '', description: '', price: '', imageUrl: '', category: '' }); fetchProducts();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/product-catalog/${id}`); toast.success('Deleted'); fetchProducts(); } catch { toast.error('Failed'); }
  };

  const categories = ['Electronics', 'Clothing', 'Food', 'Health', 'Beauty', 'Sports', 'Home', 'Other'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Product Catalog</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage products and share via WhatsApp</p></div>
        <button onClick={() => { setShowCreate(true); setEditProduct(null); setFormData({ name: '', description: '', price: '', imageUrl: '', category: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Add Product</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><Package size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No products yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
              <div className="h-48 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Image size={48} className="text-gray-300" />}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{p.category || 'Other'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{p.status === 1 ? 'Active' : 'Draft'}</span>
                </div>
                <h3 className="font-semibold dark:text-white mt-2">{p.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{p.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-emerald-600">INR {p.price}</span>
                  <div className="flex gap-1">
                    <button className="p-1 text-gray-400 hover:text-blue-500" title="Share via WhatsApp"><Share2 size={16} /></button>
                    <button onClick={() => { setEditProduct(p); setShowCreate(true); setFormData({ name: p.name, description: p.description || '', price: String(p.price), imageUrl: p.image_url || '', category: p.category || '' }); }} className="p-1 text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">{editProduct ? 'Edit' : 'Add'} Product</h3><button onClick={() => { setShowCreate(false); setEditProduct(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Product Name *</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Price *</label><input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
                <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    <option value="">Select...</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Image URL</label><input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">{editProduct ? 'Update' : 'Add'} Product</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditProduct(null); }} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

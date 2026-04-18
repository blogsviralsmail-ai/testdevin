import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Edit2, Trash2, RefreshCw, Save } from 'lucide-react';

interface Product {
  id: string; name: string; durationType: string; durationValue: number;
  price: Record<string, number>; features: string[]; streamQuality: string;
  isActive: boolean; sortOrder: number;
}

export default function AdminProducts() {

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', durationType: 'day', durationValue: 1, price: 0, features: '', streamQuality: '720p', sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try { const res = await adminAPI.getProducts(); setProducts(res.data); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.createProduct({
        name: form.name, durationType: form.durationType, durationValue: form.durationValue,
        price: { INR: form.price }, features: form.features.split('\n').filter(Boolean),
        streamQuality: form.streamQuality, sortOrder: form.sortOrder, isActive: true,
      });
      setShowAdd(false);
      setForm({ name: '', durationType: 'day', durationValue: 1, price: 0, features: '', streamQuality: '720p', sortOrder: 0 });
      loadProducts();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminAPI.updateProduct(editing.id, editing as unknown as Record<string, unknown>);
      setEditing(null);
      loadProducts();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try { await adminAPI.deleteProduct(id); loadProducts(); } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Plans & Pricing</h1>
        <div className="flex gap-2">
          <button onClick={loadProducts} className="px-3 py-2 rounded-lg border hover:bg-[rgb(var(--bg-muted))]"><RefreshCw size={18} /></button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-white flex items-center gap-2">
            <Plus size={18} /> Add Plan
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editing) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="surface-base rounded-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-primary mb-4">{editing ? 'Edit Plan' : 'Add New Plan'}</h2>
            <form onSubmit={editing ? (e) => { e.preventDefault(); handleUpdate(); } : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name</label>
                <input type="text" required
                  value={editing ? editing.name : form.name}
                  onChange={e => editing ? setEditing({...editing, name: e.target.value}) : setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration Type</label>
                  <select value={editing ? editing.durationType : form.durationType}
                    onChange={e => editing ? setEditing({...editing, durationType: e.target.value}) : setForm({...form, durationType: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2">
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration Value</label>
                  <input type="number" required min={1}
                    value={editing ? editing.durationValue : form.durationValue}
                    onChange={e => editing ? setEditing({...editing, durationValue: parseInt(e.target.value)}) : setForm({...form, durationValue: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (INR)</label>
                  <input type="number" required min={0} step="0.01"
                    value={editing ? editing.price.INR : form.price}
                    onChange={e => editing ? setEditing({...editing, price: { INR: parseFloat(e.target.value) }}) : setForm({...form, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stream Quality</label>
                  <select value={editing ? editing.streamQuality : form.streamQuality}
                    onChange={e => editing ? setEditing({...editing, streamQuality: e.target.value}) : setForm({...form, streamQuality: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2">
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Features (one per line)</label>
                <textarea rows={4}
                  value={editing ? editing.features.join('\n') : form.features}
                  onChange={e => editing ? setEditing({...editing, features: e.target.value.split('\n')}) : setForm({...form, features: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 resize-none"
                  placeholder="24/7 Streaming&#10;HD Quality&#10;Auto Restart" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditing(null); }} className="flex-1 py-2.5 rounded-xl border">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={16} /> {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-tertiary">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="surface-base rounded-xl border p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(product)} className="p-1.5 rounded hover:bg-[rgb(var(--bg-muted))]">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded hover:bg-red-50">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">₹{product.price.INR}</div>
              <div className="text-sm text-tertiary mb-3">per {product.durationType} • {product.streamQuality}</div>
              <ul className="space-y-1">
                {product.features.map((f, i) => (
                  <li key={i} className="text-sm text-secondary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

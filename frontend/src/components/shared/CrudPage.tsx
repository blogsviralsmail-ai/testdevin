import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface CrudPageProps {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: Column[];
  createFields?: { key: string; label: string; type?: string; required?: boolean; options?: { value: string; label: string }[] }[];
  searchable?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function CrudPage({ title, subtitle, endpoint, columns, createFields, searchable = true, canCreate = true, canDelete = true }: CrudPageProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);
      const { data } = await api.get(`${endpoint}?${params}`);
      const d = data.data || data;
      setItems(d.items || d || []);
      if (d.meta) setMeta(d.meta);
    } catch (err) {
      console.error(`Failed to load ${title}`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, search, title]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(endpoint, formData);
      toast.success(`${title} created`);
      setShowCreate(false);
      setFormData({});
      fetchData();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Create failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <RefreshCw size={16} />
          </button>
          {canCreate && createFields && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
              <Plus size={16} /> Add New
            </button>
          )}
        </div>
      </div>

      {showCreate && createFields && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold dark:text-white mb-4">Create New {title}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {createFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} required={field.required} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" rows={3} />
                ) : field.type === 'select' && field.options ? (
                  <select value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white">
                    <option value="">Select...</option>
                    {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={field.type || 'text'} value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} required={field.required} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" />
                )}
              </div>
            ))}
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">Save</button>
              <button type="button" onClick={() => { setShowCreate(false); setFormData({}); }} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-lg text-sm font-medium dark:text-white">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
        {searchable && (
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 max-w-sm">
              <Search size={16} className="text-gray-400" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-8 animate-pulse space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded-lg" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No {title.toLowerCase()} found</p>
            {canCreate && <p className="text-sm">Click "Add New" to get started.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  {columns.map((col) => (
                    <th key={col.key} className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{col.label}</th>
                  ))}
                  {canDelete && <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={(item.id as number) || idx} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750">
                    {columns.map((col) => (
                      <td key={col.key} className="py-3 px-4 dark:text-gray-300">
                        {col.render ? col.render(item[col.key], item) : (
                          item[col.key] != null ? String(item[col.key]) : '-'
                        )}
                      </td>
                    ))}
                    {canDelete && (
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleDelete(item.id as number)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-gray-500">{meta.total} total items</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-slate-600 dark:text-gray-300">Prev</button>
              <span className="px-3 py-1 text-sm dark:text-gray-300">{page} / {meta.totalPages}</span>
              <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page === meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-slate-600 dark:text-gray-300">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

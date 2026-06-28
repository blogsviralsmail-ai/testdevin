import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Languages, Plus, Save, Search, Trash2, Edit } from 'lucide-react';

interface Translation {
  id: number;
  key: string;
  locale: string;
  value: string;
  group: string;
}

const LOCALES = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja', 'ko'];

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ key: '', locale: 'en', value: '', group: 'general' });

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/translations?locale=${selectedLocale}&search=${search}`);
      setTranslations((data.data || data)?.data || data.data || []);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTranslations(); }, [selectedLocale, search]);

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`/translations/${editId}`, formData);
        toast.success('Translation updated');
      } else {
        await api.post('/translations', formData);
        toast.success('Translation created');
      }
      setShowCreate(false);
      setEditId(null);
      setFormData({ key: '', locale: 'en', value: '', group: 'general' });
      fetchTranslations();
    } catch { toast.error('Failed to save translation'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this translation?')) return;
    try {
      await api.delete(`/translations/${id}`);
      toast.success('Deleted');
      fetchTranslations();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Languages className="text-emerald-500" size={28} />
          <h1 className="text-2xl font-bold dark:text-white">Translations</h1>
        </div>
        <button onClick={() => { setShowCreate(true); setEditId(null); setFormData({ key: '', locale: selectedLocale, value: '', group: 'general' }); }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">
          <Plus size={18} /> Add Translation
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search translations..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
        </div>
        <select value={selectedLocale} onChange={(e) => setSelectedLocale(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white">
          {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <h3 className="font-semibold dark:text-white mb-4">{editId ? 'Edit' : 'Add'} Translation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Key (e.g. dashboard.title)" value={formData.key} onChange={(e) => setFormData({...formData, key: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <select value={formData.locale} onChange={(e) => setFormData({...formData, locale: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
            <input placeholder="Group" value={formData.group} onChange={(e) => setFormData({...formData, group: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Value" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})}
              className="px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">
              <Save size={16} /> Save
            </button>
            <button onClick={() => { setShowCreate(false); setEditId(null); }} className="px-4 py-2 border rounded-lg dark:border-slate-600 dark:text-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : translations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No translations found. Add your first translation.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Key</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Group</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Value</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {translations.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-sm dark:text-white font-mono">{t.key}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.group}</td>
                  <td className="px-4 py-3 text-sm dark:text-gray-300">{t.value}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditId(t.id); setFormData({ key: t.key, locale: t.locale, value: t.value, group: t.group }); setShowCreate(true); }}
                      className="text-blue-500 hover:text-blue-700 mr-2"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

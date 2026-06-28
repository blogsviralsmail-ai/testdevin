import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Puzzle, Download, Check, X } from 'lucide-react';

interface Addon { id: number; title: string; description: string; version: string; status: number; icon: string; price: number; }

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/addons'); setAddons((data.data || data)?.data || data.data || []); }
      catch { /* */ } finally { setLoading(false); }
    })();
  }, []);

  const toggleAddon = async (addon: Addon) => {
    try {
      await api.put(`/addons/${addon.id}`, { status: addon.status === 1 ? 0 : 1 });
      toast.success(addon.status === 1 ? 'Addon disabled' : 'Addon enabled');
      setAddons(addons.map(a => a.id === addon.id ? { ...a, status: a.status === 1 ? 0 : 1 } : a));
    } catch { toast.error('Failed to update addon'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Puzzle className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Addons</h1></div>
      {loading ? <div className="text-center py-8 text-gray-500">Loading addons...</div> :
       addons.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm">
          <Puzzle size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold dark:text-white">No Addons Available</h3>
          <p className="text-gray-500 mt-2">Addons will appear here when available for installation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addons.map((addon) => (
            <div key={addon.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div><h3 className="font-semibold dark:text-white">{addon.title}</h3><p className="text-sm text-gray-500 mt-1">{addon.description}</p></div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${addon.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {addon.status === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">v{addon.version}</span>
                <button onClick={() => toggleAddon(addon)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${addon.status === 1 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                  {addon.status === 1 ? <><X size={14} /> Disable</> : <><Check size={14} /> Enable</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

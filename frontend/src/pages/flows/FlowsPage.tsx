import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';

export default function FlowsPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(false); // API call placeholder
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">WhatsApp Flows</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Meta interactive flow builder</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white" />
          </div>
        </div>
        <div className="p-8 text-center text-gray-400">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded-lg" />)}
            </div>
          ) : (
            <p>No data yet. Click "Add New" to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}

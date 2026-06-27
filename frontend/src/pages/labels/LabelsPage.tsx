import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit, X } from 'lucide-react';
import api from '../../services/api';

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#6b7280'];

export default function LabelsPage() {
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#3b82f6' });

  useEffect(() => {
    api.get('/labels').then((r: any) => setLabels(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newLabel.name.trim()) return;
    try {
      await api.post('/labels', newLabel);
      setShowCreate(false);
      setNewLabel({ name: '', color: '#3b82f6' });
      const r = await api.get('/labels');
      setLabels(r.data?.data || []);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="text-blue-600" /> Labels
          </h1>
          <p className="text-gray-500 text-sm mt-1">Organize your contacts with color-coded labels</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={16} /> Create Label
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Create New Label</h3>
            <button onClick={() => setShowCreate(false)}><X size={18} /></button>
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Label Name</label>
              <input
                type="text"
                value={newLabel.name}
                onChange={e => setNewLabel({ ...newLabel, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Enter label name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Color</label>
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewLabel({ ...newLabel, color: c })}
                    className={`w-7 h-7 rounded-full border-2 ${newLabel.color === c ? 'border-gray-800' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Create
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : labels.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Tag size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No labels created yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {labels.map(l => (
              <div key={l.id || l._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: l.color || '#3b82f6' }} />
                  <span className="font-medium">{l.name}</span>
                  {l.contacts_count !== undefined && (
                    <span className="text-xs text-gray-400">{l.contacts_count} contacts</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                  <button className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

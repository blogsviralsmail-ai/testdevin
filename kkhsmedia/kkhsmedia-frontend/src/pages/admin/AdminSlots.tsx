import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Search, Trash2, RefreshCw, CheckCircle, Square } from 'lucide-react';

interface SlotItem {
  id: string; name: string; platform: string; status: string; isStreaming: boolean;
  userId: string; userName?: string; userEmail?: string; videoName?: string;
  createdAt: string; expiresAt?: string;
}

export default function AdminSlots() {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const loadSlots = async () => {
    setLoading(true);
    try { const res = await adminAPI.getSlots(); setSlots(res.data.slots || res.data); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadSlots(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    try { await adminAPI.deleteSlot(id); loadSlots(); } catch { /* ignore */ }
  };

  const handleActivate = async (id: string) => {
    try { await adminAPI.extendSlot(id, 30); loadSlots(); } catch { /* ignore */ }
  };

  const handleForceStop = async (id: string) => {
    try { await adminAPI.forceStopSlot(id); loadSlots(); } catch { /* ignore */ }
  };

  const filtered = slots.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.userEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Slots ({slots.length})</h1>
        <button onClick={loadSlots} className="px-3 py-2 rounded-lg border hover:bg-gray-50"><RefreshCw size={18} /></button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search slots..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Slot</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Platform</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden lg:table-cell">Stream</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(slot => (
                <tr key={slot.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{slot.name}</div>
                    <div className="text-xs text-gray-400">{slot.videoName || 'No video'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{slot.userEmail || slot.userId}</td>
                  <td className="px-4 py-3 text-sm capitalize">{slot.platform}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      slot.status === 'active' ? 'bg-green-100 text-green-700' : slot.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>{slot.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {slot.isStreaming ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                      </span>
                    ) : <span className="text-xs text-gray-400">Offline</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {slot.status !== 'active' && (
                        <button onClick={() => handleActivate(slot.id)} className="p-1.5 rounded hover:bg-green-50" title="Activate (30 days)">
                          <CheckCircle size={14} className="text-green-500" />
                        </button>
                      )}
                      {slot.isStreaming && (
                        <button onClick={() => handleForceStop(slot.id)} className="p-1.5 rounded hover:bg-orange-50" title="Force Stop Stream">
                          <Square size={14} className="text-orange-500" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(slot.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { slotsAPI, videosAPI } from '../../services/api';
import { Radio, Play, Square, Trash2, Plus, RefreshCw, Youtube, Facebook, Twitch, Instagram, Globe } from 'lucide-react';

interface Slot {
  id: string; name: string; platform: string; streamKey: string; streamUrl?: string;
  status: string; videoId?: string; videoName?: string; isStreaming: boolean;
  expiresAt?: string; createdAt: string;
}
interface VideoItem { id: string; name: string; }

export default function LiveSlotsPage() {
  const { settings } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', platform: 'youtube', streamKey: '', streamUrl: '', videoId: '' });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const primary = settings?.primaryColor || '#6366f1';

  const platformIcons: Record<string, React.ReactNode> = {
    youtube: <Youtube size={18} className="text-red-500" />,
    facebook: <Facebook size={18} className="text-blue-600" />,
    twitch: <Twitch size={18} className="text-purple-500" />,
    instagram: <Instagram size={18} className="text-pink-500" />,
    custom: <Globe size={18} className="text-gray-500" />,
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, vRes] = await Promise.all([slotsAPI.getAll(), videosAPI.getAll()]);
      setSlots(sRes.data);
      setVideos(vRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await slotsAPI.create(form);
      setShowAdd(false);
      setForm({ name: '', platform: 'youtube', streamKey: '', streamUrl: '', videoId: '' });
      loadData();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleStartStream = async (slotId: string) => {
    setActionLoading(slotId);
    try { await slotsAPI.startStream(slotId); loadData(); } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleStopStream = async (slotId: string) => {
    setActionLoading(slotId);
    try { await slotsAPI.stopStream(slotId); loadData(); } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Delete this slot?')) return;
    try { await slotsAPI.delete(slotId); loadData(); } catch { /* ignore */ }
  };

  const getStatusColor = (s: string) => {
    switch (s) { case 'active': return 'bg-green-100 text-green-700'; case 'expired': return 'bg-red-100 text-red-700'; default: return 'bg-gray-100 text-gray-700'; }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Live Slots</h1>
        <div className="flex gap-2">
          <button onClick={loadData} className="px-3 py-2 rounded-lg border hover:bg-gray-50"><RefreshCw size={18} /></button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-white flex items-center gap-2" style={{ backgroundColor: primary }}>
            <Plus size={18} /> Add Slot
          </button>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add New Slot</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Slot Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="My YouTube Stream" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Platform</label>
                <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2">
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitch">Twitch</option>
                  <option value="instagram">Instagram</option>
                  <option value="custom">Custom RTMP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stream Key</label>
                <input type="text" required value={form.streamKey} onChange={e => setForm({...form, streamKey: e.target.value})}
                  placeholder="xxxx-xxxx-xxxx-xxxx" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
              </div>
              {form.platform === 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-1">RTMP URL</label>
                  <input type="text" value={form.streamUrl} onChange={e => setForm({...form, streamUrl: e.target.value})}
                    placeholder="rtmp://..." className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Video</label>
                <select value={form.videoId} onChange={e => setForm({...form, videoId: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2">
                  <option value="">Select a video</option>
                  {videos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white disabled:opacity-50" style={{ backgroundColor: primary }}>
                  {saving ? 'Creating...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slots List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : slots.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Radio size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">No Live Slots Yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first slot to start streaming 24/7.</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: primary }}>Add Slot</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {slots.map(slot => (
            <div key={slot.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {platformIcons[slot.platform] || <Globe size={18} />}
                  <div>
                    <h3 className="font-semibold">{slot.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{slot.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(slot.status)}`}>{slot.status}</span>
                  {slot.isStreaming && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE</span>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>Stream Key: <span className="font-mono text-xs">••••{slot.streamKey?.slice(-4)}</span></div>
                <div>Video: {slot.videoName || 'Not set'}</div>
                {slot.expiresAt && <div>Expires: {new Date(slot.expiresAt).toLocaleDateString()}</div>}
              </div>

              <div className="mt-4 flex gap-2">
                {slot.status === 'active' && !slot.isStreaming && (
                  <button onClick={() => handleStartStream(slot.id)} disabled={actionLoading === slot.id}
                    className="px-3 py-1.5 rounded-lg text-white text-sm flex items-center gap-1.5 disabled:opacity-50" style={{ backgroundColor: '#22c55e' }}>
                    <Play size={14} /> {actionLoading === slot.id ? 'Starting...' : 'Start Stream'}
                  </button>
                )}
                {slot.isStreaming && (
                  <button onClick={() => handleStopStream(slot.id)} disabled={actionLoading === slot.id}
                    className="px-3 py-1.5 rounded-lg text-white text-sm flex items-center gap-1.5 bg-red-500 disabled:opacity-50">
                    <Square size={14} /> {actionLoading === slot.id ? 'Stopping...' : 'Stop Stream'}
                  </button>
                )}
                <button onClick={() => handleDelete(slot.id)} className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-red-500 hover:bg-red-50">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

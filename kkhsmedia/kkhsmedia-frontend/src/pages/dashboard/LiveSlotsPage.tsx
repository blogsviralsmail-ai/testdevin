import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { slotsAPI, videosAPI } from '../../services/api';
import { Radio, Play, Square, Trash2, Plus, RefreshCw, Youtube, Facebook, Twitch, Instagram, Globe, AlertCircle, Film, Image, Upload } from 'lucide-react';

interface Slot {
  id: string; name: string; platform: string; streamKey: string; streamUrl?: string;
  rtmpUrl?: string; status: string; videoId?: string; videoName?: string; isStreaming: boolean;
  expiryDate?: string; expiresAt?: string; createdAt: string;
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
  const [error, setError] = useState<string | null>(null);
  const [showStreamModal, setShowStreamModal] = useState<string | null>(null);
  const [streamThumb, setStreamThumb] = useState<File | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
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
    setError(null);
    try {
      const [sRes, vRes] = await Promise.all([slotsAPI.getAll(), videosAPI.getAll()]);
      const slotsData = Array.isArray(sRes.data) ? sRes.data : sRes.data?.slots || [];
      const videosData = Array.isArray(vRes.data) ? vRes.data : vRes.data?.videos || [];
      setSlots(slotsData);
      setVideos(videosData);
    } catch { setError('Failed to load data'); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await slotsAPI.create(form);
      setShowAdd(false);
      setForm({ name: '', platform: 'youtube', streamKey: '', streamUrl: '', videoId: '' });
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create slot';
      setError(msg);
    }
    setSaving(false);
  };

  const handleAssignVideo = async (slotId: string, videoId: string) => {
    setActionLoading(slotId);
    setError(null);
    try {
      await slotsAPI.update(slotId, { videoId: videoId || null });
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to assign video';
      setError(msg);
    }
    setActionLoading(null);
  };

  const openStreamModal = (slotId: string) => {
    setShowStreamModal(slotId);
    setStreamThumb(null);
  };

  const handleStartStream = async (slotId: string) => {
    setShowStreamModal(null);
    setActionLoading(slotId);
    setError(null);
    try {
      if (streamThumb) {
        // Upload thumbnail first
        const formData = new FormData();
        formData.append('thumbnail', streamThumb);
        formData.append('slotId', slotId);
        await slotsAPI.uploadThumbnail(slotId, formData);
      }
      await slotsAPI.startStream(slotId);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start stream';
      setError(msg);
    }
    setActionLoading(null);
    setStreamThumb(null);
  };

  const handleStopStream = async (slotId: string) => {
    setActionLoading(slotId);
    setError(null);
    try { await slotsAPI.stopStream(slotId); loadData(); } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to stop stream';
      setError(msg);
    }
    setActionLoading(null);
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Delete this slot?')) return;
    try { await slotsAPI.delete(slotId); loadData(); } catch { /* ignore */ }
  };

  const getStatusColor = (s: string) => {
    switch (s) { case 'active': return 'bg-green-100 text-green-700'; case 'expired': return 'bg-red-100 text-red-700'; default: return 'bg-gray-100 text-gray-700'; }
  };

  const getVideoName = (slot: Slot) => {
    if (slot.videoName) return slot.videoName;
    if (slot.videoId) {
      const v = videos.find(vid => vid.id === slot.videoId);
      return v ? v.name : 'Unknown video';
    }
    return null;
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

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

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
                <label className="block text-sm font-medium mb-1">Video (optional, can assign later)</label>
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
          {slots.map(slot => {
            const videoName = getVideoName(slot);
            return (
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
                <div className="flex items-center gap-1">
                  <Film size={14} />
                  {videoName ? (
                    <span className="text-green-700 font-medium truncate max-w-48">{videoName}</span>
                  ) : (
                    <span className="text-orange-500">No video assigned</span>
                  )}
                </div>
                {(slot.expiryDate || slot.expiresAt) && (
                  <div>Expires: {new Date(slot.expiryDate || slot.expiresAt || '').toLocaleDateString()}</div>
                )}
              </div>

              {/* Video Assignment Dropdown */}
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Assign Video:</label>
                <select
                  value={slot.videoId || ''}
                  onChange={e => handleAssignVideo(slot.id, e.target.value)}
                  disabled={actionLoading === slot.id}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                >
                  <option value="">-- No video --</option>
                  {videos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              {/* Status Messages */}
              {slot.status === 'inactive' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Slot is inactive. Please purchase a plan to activate.
                </div>
              )}
              {slot.status === 'active' && !slot.videoId && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                  <Film size={14} />
                  Assign a video above to start streaming.
                </div>
              )}

              <div className="mt-4 flex gap-2 flex-wrap">
                {slot.status === 'active' && !slot.isStreaming && slot.videoId && (
                  <button onClick={() => openStreamModal(slot.id)} disabled={actionLoading === slot.id}
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
            );
          })}
        </div>
      )}

      {/* Stream Start Modal - Thumbnail Option */}
      {showStreamModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Play size={20} /> Start Stream</h2>
            <p className="text-sm text-gray-600 mb-4">Video is already assigned. You can optionally add a custom thumbnail for the stream.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 flex items-center gap-1.5"><Image size={14} /> Custom Thumbnail (optional)</label>
              <div 
                onClick={() => thumbInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition"
              >
                {streamThumb ? (
                  <div className="flex items-center gap-2 justify-center">
                    <img src={URL.createObjectURL(streamThumb)} alt="thumb" className="w-20 h-14 object-cover rounded" />
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-48">{streamThumb.name}</p>
                      <p className="text-xs text-gray-500">{(streamThumb.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} className="mx-auto mb-1 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload thumbnail</p>
                    <p className="text-xs text-gray-400">If not provided, auto-generated from video</p>
                  </div>
                )}
              </div>
              <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={e => setStreamThumb(e.target.files?.[0] || null)} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowStreamModal(null); setStreamThumb(null); }} className="flex-1 py-2.5 rounded-xl border">Cancel</button>
              <button onClick={() => handleStartStream(showStreamModal)} className="flex-1 py-2.5 rounded-xl text-white" style={{ backgroundColor: '#22c55e' }}>
                Start Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

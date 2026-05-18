import { useState, useEffect, useRef } from 'react';
import { adminAPI, slotsAPI, streamingAPI, bulkAPI } from '../../services/api';
import { Search, Trash2, RefreshCw, CheckCircle, Square, Plus, Play, Youtube, Facebook, Twitch, Instagram, Globe, AlertCircle, Film, Image, Clock, Calendar, Timer, Link, HardDrive, List, X, CheckSquare, Layers, CircleDot } from 'lucide-react';

interface SlotItem {
  id: string; name: string; platform: string; streamKey: string; streamUrl?: string;
  rtmpUrl?: string; status: string; videoId?: string; videoName?: string; isStreaming: boolean;
  userId: string; userName?: string; userEmail?: string;
  createdAt: string; expiresAt?: string; expiryDate?: string;
  scheduledStart?: string; scheduledEnd?: string;
  sourceType?: string; sourceUrl?: string; resolution?: string;
}
interface VideoItem { id: string; name: string; }

const platformIcons: Record<string, typeof Youtube> = {
  youtube: Youtube, facebook: Facebook, twitch: Twitch, instagram: Instagram, custom: Globe,
};
const platformColors: Record<string, string> = {
  youtube: 'text-red-500', facebook: 'text-blue-600', twitch: 'text-purple-500', instagram: 'text-pink-500', custom: 'text-tertiary',
};

function SourceTabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = [
    { key: 'uploaded', label: 'Video', Icon: Film, clr: '' },
    { key: 'youtube_url', label: 'YT Link', Icon: Youtube, clr: 'text-red-600' },
    { key: 'gdrive', label: 'Drive', Icon: HardDrive, clr: 'text-blue-600' },
    { key: 'playlist', label: 'Playlist', Icon: List, clr: 'text-purple-600' },
  ];
  return (
    <div className="flex gap-1 mb-2 surface-muted p-0.5 rounded-lg">
      {tabs.map(({ key, label, Icon, clr }) => (
        <button key={key} type="button" onClick={() => onChange(key)}
          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${active === key ? `surface-base shadow ${clr || 'text-primary'}` : 'text-tertiary'}`}>
          <Icon size={12} className="inline mr-1" />{label}
        </button>
      ))}
    </div>
  );
}

export default function AdminSlots() {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', platform: 'youtube', streamKey: '', streamUrl: '', videoId: '',
    scheduledStart: '', scheduledEnd: '', resolution: '1080p',
    sourceType: 'uploaded' as string, sourceUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [createAndStart, setCreateAndStart] = useState(false);
  const [formThumb, setFormThumb] = useState<File | null>(null);
  const formThumbRef = useRef<HTMLInputElement>(null);

  const [showStreamModal, setShowStreamModal] = useState<string | null>(null);
  const [streamThumb, setStreamThumb] = useState<File | null>(null);
  const [streamEndDate, setStreamEndDate] = useState('');
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [videoSource, setVideoSource] = useState<'uploaded' | 'youtube_url' | 'google_drive' | 'playlist'>('uploaded');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [playlistVideoIds, setPlaylistVideoIds] = useState<string[]>([]);
  const [streamLoop, setStreamLoop] = useState(true);

  const [showScheduleModal, setShowScheduleModal] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledStart: '', scheduledEnd: '' });

  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [recordingSlots, setRecordingSlots] = useState<Set<string>>(new Set());
  const [overlaySlot, setOverlaySlot] = useState<string | null>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);

  const [slotSourceTab, setSlotSourceTab] = useState<Record<string, string>>({});
  const [slotYtUrl, setSlotYtUrl] = useState<Record<string, string>>({});
  const [slotGdriveUrl, setSlotGdriveUrl] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [sRes, vRes] = await Promise.all([adminAPI.getSlots(), adminAPI.getVideos()]);
      const sd = sRes.data?.slots || sRes.data || [];
      const vd = vRes.data?.videos || vRes.data || [];
      setSlots(Array.isArray(sd) ? sd : []);
      setVideos(Array.isArray(vd) ? vd : []);
    } catch { setError('Failed to load data'); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;

  const handleCreate = async (e: React.FormEvent, startNow = false) => {
    e.preventDefault(); setSaving(true); setCreateAndStart(startNow); setError(null);
    try {
      const res = await slotsAPI.create(form);
      const nid = res.data?.id || res.data?._id;
      if (formThumb && nid) {
        const fd = new FormData(); fd.append('thumbnail', formThumb); fd.append('slotId', nid);
        try { await slotsAPI.uploadThumbnail(nid, fd); } catch { /* ok */ }
      }
      if (startNow && nid) {
        try {
          if (form.sourceType === 'youtube_url' && form.sourceUrl.trim())
            await streamingAPI.youtubeUrl({ slotId: nid, url: form.sourceUrl.trim(), loop: true });
          else if (form.sourceType === 'gdrive' && form.sourceUrl.trim())
            await streamingAPI.cloudStream({ slotId: nid, cloudUrl: form.sourceUrl.trim(), provider: 'gdrive', loop: true });
          else if (form.videoId) await slotsAPI.startStream(nid);
        } catch (err: unknown) { setError(errMsg(err) || 'Slot created but stream start failed'); }
      }
      setShowAdd(false);
      setForm({ name: '', platform: 'youtube', streamKey: '', streamUrl: '', videoId: '', scheduledStart: '', scheduledEnd: '', resolution: '1080p', sourceType: 'uploaded', sourceUrl: '' });
      setFormThumb(null); loadData();
    } catch (err: unknown) { setError(errMsg(err) || 'Failed to create slot'); }
    setSaving(false); setCreateAndStart(false);
  };

  const handleAssignVideo = async (slotId: string, videoId: string) => {
    setActionLoading(slotId); setError(null);
    try { await slotsAPI.update(slotId, { videoId: videoId || null }); loadData(); }
    catch (err: unknown) { setError(errMsg(err) || 'Failed to assign video'); }
    setActionLoading(null);
  };

  const openStreamModal = (slotId: string) => {
    setShowStreamModal(slotId); setStreamThumb(null); setStreamEndDate('');
    setVideoSource('uploaded'); setYoutubeUrl(''); setGdriveUrl('');
    setPlaylistVideoIds([]); setStreamLoop(true);
  };

  const handleStartStream = async (slotId: string) => {
    setShowStreamModal(null); setActionLoading(slotId); setError(null);
    try {
      if (streamThumb) {
        const fd = new FormData(); fd.append('thumbnail', streamThumb); fd.append('slotId', slotId);
        await slotsAPI.uploadThumbnail(slotId, fd);
      }
      if (streamEndDate) await slotsAPI.update(slotId, { scheduledEnd: new Date(streamEndDate).toISOString() });
      if (videoSource === 'youtube_url' && youtubeUrl.trim())
        await streamingAPI.youtubeUrl({ slotId, url: youtubeUrl.trim(), loop: streamLoop });
      else if (videoSource === 'google_drive' && gdriveUrl.trim())
        await streamingAPI.cloudStream({ slotId, cloudUrl: gdriveUrl.trim(), provider: 'gdrive', loop: streamLoop });
      else if (videoSource === 'playlist' && playlistVideoIds.length > 0)
        await streamingAPI.playlistQueue({ slotId, videoIds: playlistVideoIds });
      else await slotsAPI.startStream(slotId);
      loadData();
    } catch (err: unknown) { setError(errMsg(err) || 'Failed to start stream'); }
    setActionLoading(null); setStreamThumb(null); setStreamEndDate('');
    setYoutubeUrl(''); setGdriveUrl(''); setPlaylistVideoIds([]);
  };

  const handleStopStream = async (slotId: string) => {
    setActionLoading(slotId); setError(null);
    try { await slotsAPI.stopStream(slotId); loadData(); } catch {
      try { await adminAPI.forceStopSlot(slotId); loadData(); }
      catch (err: unknown) { setError(errMsg(err) || 'Failed to stop stream'); }
    }
    setActionLoading(null);
  };

  const handleSaveSchedule = async (slotId: string) => {
    setShowScheduleModal(null); setActionLoading(slotId); setError(null);
    try {
      const u: Record<string, unknown> = {};
      u.scheduledStart = scheduleForm.scheduledStart ? new Date(scheduleForm.scheduledStart).toISOString() : '';
      u.scheduledEnd = scheduleForm.scheduledEnd ? new Date(scheduleForm.scheduledEnd).toISOString() : '';
      await slotsAPI.update(slotId, u); loadData();
    } catch (err: unknown) { setError(errMsg(err) || 'Failed to save schedule'); }
    setActionLoading(null);
  };

  const openScheduleModal = (slot: SlotItem) => {
    setShowScheduleModal(slot.id);
    setScheduleForm({
      scheduledStart: slot.scheduledStart ? new Date(slot.scheduledStart).toISOString().slice(0, 16) : '',
      scheduledEnd: slot.scheduledEnd ? new Date(slot.scheduledEnd).toISOString().slice(0, 16) : '',
    });
  };

  const fmtDate = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleString(); } catch { return d; }
  };
  const timeLeft = (end?: string) => {
    if (!end) return '';
    try {
      const d = new Date(end).getTime() - Date.now();
      if (d <= 0) return 'Ended';
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
    } catch { return ''; }
  };

  const handleActivate = async (id: string) => {
    try { await adminAPI.extendSlot(id, 30); loadData(); } catch { /* ok */ }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    try { await adminAPI.deleteSlot(id); loadData(); } catch { /* ok */ }
  };

  const toggleSelect = (id: string) => setSelectedSlots(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelectedSlots(p => p.length === filtered.length ? [] : filtered.map(s => s.id));

  const doBulk = async (action: () => Promise<unknown>, label: string) => {
    setBulkLoading(true);
    try { await action(); setSelectedSlots([]); loadData(); }
    catch { setError(`${label} failed`); }
    setBulkLoading(false);
  };

  const startRec = async (id: string) => {
    setActionLoading(id);
    try { await streamingAPI.startRecording(id); setRecordingSlots(p => new Set(p).add(id)); }
    catch { setError('Failed to start recording'); }
    setActionLoading(null);
  };
  const stopRec = async (id: string) => {
    setActionLoading(id);
    try { await streamingAPI.stopRecording(id); setRecordingSlots(p => { const s = new Set(p); s.delete(id); return s; }); }
    catch { setError('Failed to stop recording'); }
    setActionLoading(null);
  };
  const doOverlay = async (id: string, f: File) => {
    setActionLoading(id);
    try { const fd = new FormData(); fd.append('file', f); await streamingAPI.uploadOverlay(id, fd); }
    catch { setError('Failed to upload overlay'); }
    setActionLoading(null); setOverlaySlot(null);
  };
  const rmOverlay = async (id: string) => {
    setActionLoading(id);
    try { await streamingAPI.removeOverlay(id); } catch { setError('Failed to remove overlay'); }
    setActionLoading(null);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'surface-muted text-secondary';
    }
  };
  const vidName = (s: SlotItem) => {
    if (s.videoName) return s.videoName;
    if (s.videoId) { const v = videos.find(x => x.id === s.videoId); return v ? v.name : 'Unknown video'; }
    return null;
  };
  const srcLabel = (s: SlotItem) => {
    if (s.sourceType === 'youtube_url') return { label: 'YouTube URL', Icon: Youtube, color: 'text-red-600' };
    if (s.sourceType === 'cloud_gdrive') return { label: 'Google Drive', Icon: HardDrive, color: 'text-green-600' };
    if (s.sourceType === 'playlist_queue') return { label: 'Playlist', Icon: List, color: 'text-purple-600' };
    return null;
  };
  const togglePl = (id: string) => setPlaylistVideoIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filtered = slots.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.userEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2";
  const selectCls = `${inputCls} bg-[rgb(var(--bg-muted))] text-[rgb(var(--text))] border-[rgb(var(--border))]`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Slots ({slots.length})</h1>
        <div className="flex gap-2">
          <button onClick={loadData} className="px-3 py-2 rounded-lg border hover:bg-[rgb(var(--bg-muted))]">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-white flex items-center gap-2">
            <Plus size={18} /> Add Slot
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {filtered.length > 0 && (
        <div className="mb-4 p-3 surface-base rounded-xl border flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={selectedSlots.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" />
            <CheckSquare size={16} className="text-tertiary" /> Select All
          </label>
          {selectedSlots.length > 0 && (<>
            <span className="text-sm text-tertiary">({selectedSlots.length} selected)</span>
            <button onClick={() => doBulk(() => bulkAPI.start(selectedSlots), 'Bulk start')} disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg text-white text-xs flex items-center gap-1 disabled:opacity-50" style={{ backgroundColor: '#22c55e' }}>
              <Play size={12} /> Start All
            </button>
            <button onClick={() => doBulk(() => bulkAPI.stop(selectedSlots), 'Bulk stop')} disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs flex items-center gap-1 disabled:opacity-50">
              <Square size={12} /> Stop All
            </button>
            <button onClick={() => { if (confirm(`Delete ${selectedSlots.length} slots?`)) doBulk(() => bulkAPI.delete(selectedSlots), 'Bulk delete'); }} disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 text-red-500 hover:bg-red-50 disabled:opacity-50">
              <Trash2 size={12} /> Delete Selected
            </button>
          </>)}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search slots by name or email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input type="file" ref={overlayInputRef} accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f && overlaySlot) doOverlay(overlaySlot, f); e.target.value = ''; }} />
      <input type="file" ref={thumbInputRef} accept="image/*" className="hidden"
        onChange={e => setStreamThumb(e.target.files?.[0] || null)} />

      {/* ===== ADD SLOT MODAL ===== */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="surface-base rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-5 pb-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Add New Slot</h2>
              <button type="button" onClick={() => { setShowAdd(false); setFormThumb(null); }} className="text-tertiary hover:text-secondary"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Slot Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="My YouTube Stream" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Platform</label>
                  <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className={selectCls}>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitch">Twitch</option>
                    <option value="instagram">Instagram</option>
                    <option value="custom">Custom RTMP</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Stream Key</label>
                  <input type="text" required value={form.streamKey} onChange={e => setForm({ ...form, streamKey: e.target.value })}
                    placeholder="xxxx-xxxx-xxxx-xxxx" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Stream Quality</label>
                  <select value={form.resolution} onChange={e => setForm({ ...form, resolution: e.target.value })} className={selectCls}>
                    <option value="auto">Auto</option>
                    <option value="4k">4K</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                  </select>
                </div>
              </div>
              {form.platform === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">RTMP URL</label>
                  <input type="text" value={form.streamUrl} onChange={e => setForm({ ...form, streamUrl: e.target.value })}
                    placeholder="rtmp://..." className={inputCls} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Video Source</label>
                <SourceTabs active={form.sourceType} onChange={t => setForm({ ...form, sourceType: t, sourceUrl: '', videoId: '' })} />
                {form.sourceType === 'uploaded' && (
                  <select value={form.videoId} onChange={e => setForm({ ...form, videoId: e.target.value })} className={selectCls}>
                    <option value="">Select a video (optional)</option>
                    {videos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                )}
                {form.sourceType === 'youtube_url' && (
                  <input type="text" placeholder="https://youtube.com/watch?v=..." value={form.sourceUrl}
                    onChange={e => setForm({ ...form, sourceUrl: e.target.value })} className={inputCls} />
                )}
                {form.sourceType === 'gdrive' && (
                  <input type="text" placeholder="https://drive.google.com/file/d/..." value={form.sourceUrl}
                    onChange={e => setForm({ ...form, sourceUrl: e.target.value })} className={inputCls} />
                )}
                {form.sourceType === 'playlist' && (
                  <p className="text-xs text-tertiary p-2 surface-subtle rounded-lg">Playlist select after slot creation.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Thumbnail</label>
                  <input type="file" ref={formThumbRef} accept="image/*" className="hidden" onChange={e => setFormThumb(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => formThumbRef.current?.click()}
                    className="w-full px-3 py-2 rounded-lg border text-sm flex items-center gap-2 hover:bg-[rgb(var(--bg-muted))] truncate">
                    <Image size={14} className="shrink-0" />
                    <span className="truncate">{formThumb ? formThumb.name : 'Upload (optional)'}</span>
                  </button>
                  {formThumb && <button type="button" onClick={() => setFormThumb(null)} className="text-red-400 hover:text-red-600 text-xs mt-1">Remove</button>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Schedule End</label>
                  <input type="datetime-local" value={form.scheduledEnd} onChange={e => setForm({ ...form, scheduledEnd: e.target.value })} className={inputCls} />
                  <p className="text-xs text-tertiary mt-0.5">Empty = runs forever</p>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t sticky bottom-0 surface-base pb-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium disabled:opacity-50 hover:bg-[rgb(var(--bg-muted))]">
                  {saving && !createAndStart ? 'Creating...' : 'Create Slot'}
                </button>
                <button type="button" disabled={saving} onClick={(e) => handleCreate(e as unknown as React.FormEvent, true)}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: '#22c55e' }}>
                  <Play size={14} /> {saving && createAndStart ? 'Starting...' : 'Create & Go LIVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== START STREAM MODAL ===== */}
      {showStreamModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="surface-base rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-5 pb-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Play size={20} className="text-green-500" /> Start Stream</h2>
              <button type="button" onClick={() => setShowStreamModal(null)} className="text-tertiary hover:text-secondary"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Video Source</label>
                <SourceTabs active={videoSource} onChange={t => setVideoSource(t as typeof videoSource)} />
                {videoSource === 'uploaded' && <p className="text-xs text-tertiary">Will use the currently assigned uploaded video.</p>}
                {videoSource === 'youtube_url' && (
                  <input type="text" placeholder="https://youtube.com/watch?v=..." value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)} className={inputCls} />
                )}
                {videoSource === 'google_drive' && (
                  <input type="text" placeholder="https://drive.google.com/file/d/..." value={gdriveUrl}
                    onChange={e => setGdriveUrl(e.target.value)} className={inputCls} />
                )}
                {videoSource === 'playlist' && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {videos.map(v => (
                      <label key={v.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[rgb(var(--bg-muted))] cursor-pointer text-sm">
                        <input type="checkbox" checked={playlistVideoIds.includes(v.id)} onChange={() => togglePl(v.id)} className="rounded" />
                        {v.name}
                      </label>
                    ))}
                    {playlistVideoIds.length > 0 && <p className="text-xs text-tertiary mt-1">{playlistVideoIds.length} videos in queue</p>}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={streamLoop} onChange={e => setStreamLoop(e.target.checked)} className="rounded" />
                Loop video infinitely
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Custom Thumbnail</label>
                  <button type="button" onClick={() => thumbInputRef.current?.click()}
                    className="w-full px-3 py-2 rounded-lg border text-sm flex items-center gap-2 hover:bg-[rgb(var(--bg-muted))] truncate">
                    <Image size={14} className="shrink-0" />
                    <span className="truncate">{streamThumb ? streamThumb.name : 'Upload (optional)'}</span>
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Auto-Stop At</label>
                  <input type="datetime-local" value={streamEndDate} onChange={e => setStreamEndDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <button onClick={() => handleStartStream(showStreamModal)} disabled={actionLoading === showStreamModal}
                className="w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: '#22c55e' }}>
                <Play size={16} /> {actionLoading === showStreamModal ? 'Starting...' : 'Start Stream Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SCHEDULE MODAL ===== */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="surface-base rounded-xl w-full max-w-md">
            <div className="p-5 pb-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Calendar size={20} className="text-indigo-500" /> Schedule Stream</h2>
              <button type="button" onClick={() => setShowScheduleModal(null)} className="text-tertiary hover:text-secondary"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Scheduled Start</label>
                <input type="datetime-local" value={scheduleForm.scheduledStart}
                  onChange={e => setScheduleForm({ ...scheduleForm, scheduledStart: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Scheduled End</label>
                <input type="datetime-local" value={scheduleForm.scheduledEnd}
                  onChange={e => setScheduleForm({ ...scheduleForm, scheduledEnd: e.target.value })} className={inputCls} />
                <p className="text-xs text-tertiary mt-0.5">Empty = runs until manually stopped</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowScheduleModal(null)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-[rgb(var(--bg-muted))]">Cancel</button>
                <button onClick={() => handleSaveSchedule(showScheduleModal)}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#6366f1' }}>Save Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SLOTS GRID ===== */}
      {loading ? (
        <div className="text-center py-12 text-tertiary">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 surface-base rounded-xl border">
          <AlertCircle size={48} className="mx-auto mb-4 text-secondary" />
          <h3 className="font-semibold text-primary mb-2">{search ? 'No matching slots' : 'No Slots Yet'}</h3>
          <p className="text-sm text-tertiary mb-4">{search ? 'Try a different search' : 'Create the first slot to start streaming.'}</p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-white">
              <Plus size={16} className="inline mr-1" />Add Slot
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(slot => {
            const vn = vidName(slot);
            const sl = srcLabel(slot);
            const PIcon = platformIcons[slot.platform] || Globe;
            const pClr = platformColors[slot.platform] || 'text-tertiary';
            return (
              <div key={slot.id} className={`surface-base rounded-xl border p-5 ${selectedSlots.includes(slot.id) ? 'ring-2 ring-indigo-400' : ''}`}>
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedSlots.includes(slot.id)} onChange={() => toggleSelect(slot.id)} className="rounded" />
                    <PIcon size={18} className={pClr} />
                    <div>
                      <h3 className="font-semibold">{slot.name}</h3>
                      <p className="text-xs text-tertiary capitalize">{slot.platform} &middot; {slot.userEmail || slot.userId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(slot.status)}`}>{slot.status}</span>
                    {slot.isStreaming && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Info row */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-secondary">
                  <div>Stream Key: <span className="font-mono text-xs">....{slot.streamKey?.slice(-4)}</span></div>
                  <div className="flex items-center gap-1">
                    <Film size={14} />
                    {vn ? <span className="text-green-700 font-medium truncate max-w-48">{vn}</span> : <span className="text-orange-500">No video assigned</span>}
                  </div>
                  {(slot.expiryDate || slot.expiresAt) && (
                    <div>Expires: {new Date(slot.expiryDate || slot.expiresAt || '').toLocaleDateString()}</div>
                  )}
                  {sl && slot.isStreaming && (
                    <div className="flex items-center gap-1">
                      <sl.Icon size={13} className={sl.color} />
                      <span className={`${sl.color} font-medium text-xs`}>{sl.label}</span>
                      {slot.sourceUrl && <span className="text-xs text-tertiary truncate max-w-32">{slot.sourceUrl}</span>}
                    </div>
                  )}
                </div>

                {/* Schedule info */}
                {(slot.scheduledStart || slot.scheduledEnd) && (
                  <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-indigo-700 mb-1"><Clock size={13} /> Schedule</div>
                    <div className="grid grid-cols-2 gap-2 text-indigo-600">
                      {slot.scheduledStart && <div>Start: {fmtDate(slot.scheduledStart)}</div>}
                      {slot.scheduledEnd && (
                        <div className="flex items-center gap-1">
                          End: {fmtDate(slot.scheduledEnd)}
                          {slot.isStreaming && <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 rounded text-indigo-800 font-medium">{timeLeft(slot.scheduledEnd)}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {slot.isStreaming && !slot.scheduledEnd && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-1.5">
                    <Timer size={13} /> Infinite loop - runs until manually stopped
                  </div>
                )}

                {/* Video source tabs per slot */}
                <div className="mt-3">
                  <label className="text-xs text-tertiary mb-1 block">Video Source:</label>
                  <SourceTabs active={slotSourceTab[slot.id] || 'uploaded'} onChange={t => setSlotSourceTab(p => ({ ...p, [slot.id]: t }))} />
                  {(!slotSourceTab[slot.id] || slotSourceTab[slot.id] === 'uploaded') && (
                    <select value={slot.videoId || ''} onChange={e => handleAssignVideo(slot.id, e.target.value)}
                      disabled={actionLoading === slot.id} className={`${selectCls} disabled:opacity-50`}>
                      <option value="">-- Select uploaded video --</option>
                      {videos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  )}
                  {slotSourceTab[slot.id] === 'youtube_url' && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="https://youtube.com/watch?v=..."
                        value={slotYtUrl[slot.id] || ''} onChange={e => setSlotYtUrl(p => ({ ...p, [slot.id]: e.target.value }))}
                        className={`flex-1 ${inputCls}`} />
                      <button onClick={() => { slotsAPI.update(slot.id, { sourceType: 'youtube_url', sourceUrl: slotYtUrl[slot.id] || '' }); loadData(); }}
                        disabled={!slotYtUrl[slot.id]?.trim()} className="px-3 py-2 rounded-lg text-white text-xs disabled:opacity-50">Save</button>
                    </div>
                  )}
                  {slotSourceTab[slot.id] === 'gdrive' && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="https://drive.google.com/file/d/..."
                        value={slotGdriveUrl[slot.id] || ''} onChange={e => setSlotGdriveUrl(p => ({ ...p, [slot.id]: e.target.value }))}
                        className={`flex-1 ${inputCls}`} />
                      <button onClick={() => { slotsAPI.update(slot.id, { sourceType: 'gdrive', sourceUrl: slotGdriveUrl[slot.id] || '' }); loadData(); }}
                        disabled={!slotGdriveUrl[slot.id]?.trim()} className="px-3 py-2 rounded-lg text-white text-xs disabled:opacity-50">Save</button>
                    </div>
                  )}
                  {slotSourceTab[slot.id] === 'playlist' && (
                    <p className="text-xs text-tertiary p-2 surface-subtle rounded-lg">
                      Playlist queue available in <strong>Start Stream</strong> modal.
                    </p>
                  )}
                  {slot.sourceUrl && (
                    <div className="mt-1 text-xs text-tertiary flex items-center gap-1 truncate">
                      <Link size={11} /> Current: <span className="text-blue-600 truncate">{slot.sourceUrl}</span>
                    </div>
                  )}
                </div>

                {/* Inactive warning */}
                {slot.status === 'inactive' && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 flex items-center gap-2">
                    <AlertCircle size={14} /> Slot inactive. Activate to stream.
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {slot.status !== 'active' && (
                    <button onClick={() => handleActivate(slot.id)}
                      className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-green-600 hover:bg-green-50">
                      <CheckCircle size={14} /> Activate (30d)
                    </button>
                  )}
                  {slot.status === 'active' && !slot.isStreaming && (
                    <button onClick={() => openStreamModal(slot.id)} disabled={actionLoading === slot.id}
                      className="px-3 py-1.5 rounded-lg text-white text-sm flex items-center gap-1.5 disabled:opacity-50"
                      style={{ backgroundColor: '#22c55e' }}>
                      <Play size={14} /> {actionLoading === slot.id ? 'Starting...' : 'Start Stream'}
                    </button>
                  )}
                  {slot.isStreaming && (
                    <button onClick={() => handleStopStream(slot.id)} disabled={actionLoading === slot.id}
                      className="px-3 py-1.5 rounded-lg text-white text-sm flex items-center gap-1.5 bg-red-500 disabled:opacity-50">
                      <Square size={14} /> {actionLoading === slot.id ? 'Stopping...' : 'Stop Stream'}
                    </button>
                  )}
                  {slot.status === 'active' && !slot.isStreaming && (
                    <button onClick={() => openScheduleModal(slot)}
                      className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-indigo-600 hover:bg-indigo-50">
                      <Calendar size={14} /> Schedule
                    </button>
                  )}
                  {slot.isStreaming && !recordingSlots.has(slot.id) && (
                    <button onClick={() => startRec(slot.id)} disabled={actionLoading === slot.id}
                      className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50">
                      <CircleDot size={14} /> Record
                    </button>
                  )}
                  {recordingSlots.has(slot.id) && (
                    <button onClick={() => stopRec(slot.id)} disabled={actionLoading === slot.id}
                      className="px-3 py-1.5 rounded-lg bg-red-100 border border-red-300 text-sm flex items-center gap-1.5 text-red-700 disabled:opacity-50">
                      <CircleDot size={14} className="animate-pulse" /> Stop Rec
                    </button>
                  )}
                  {slot.isStreaming && (<>
                    <button onClick={() => { setOverlaySlot(slot.id); overlayInputRef.current?.click(); }}
                      className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-purple-600 hover:bg-purple-50">
                      <Layers size={14} /> Overlay
                    </button>
                    <button onClick={() => rmOverlay(slot.id)} disabled={actionLoading === slot.id}
                      className="px-2 py-1.5 rounded-lg border text-sm flex items-center gap-1 text-tertiary hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                      title="Remove overlay">
                      <X size={14} />
                    </button>
                  </>)}
                  <button onClick={() => handleDelete(slot.id)}
                    className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-red-500 hover:bg-red-50">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

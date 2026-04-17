import { useState, useEffect, useRef } from 'react';
import { slotsAPI, videosAPI, youtubeAPI, streamingAPI, bulkAPI } from '../../services/api';
import { Radio, Play, Square, Trash2, Plus, RefreshCw, Youtube, Facebook, Twitch, Instagram, Globe, AlertCircle, Film, Image, Upload, Clock, Calendar, Timer, Link, HardDrive, List, ExternalLink, CheckSquare, Layers, CircleDot, X } from 'lucide-react';

interface Slot {
  id: string; name: string; platform: string; streamKey: string; streamUrl?: string;
  rtmpUrl?: string; status: string; videoId?: string; videoName?: string; isStreaming: boolean;
  expiryDate?: string; expiresAt?: string; createdAt: string;
  scheduledStart?: string; scheduledEnd?: string;
  sourceType?: string; sourceUrl?: string;
  resolution?: string;
}
interface VideoItem { id: string; name: string; }

type VideoSourceType = 'uploaded' | 'youtube_url' | 'google_drive' | 'playlist';

export default function LiveSlotsPage() {

  const [slots, setSlots] = useState<Slot[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', platform: 'youtube', streamKey: '', streamUrl: '', videoId: '', scheduledStart: '', scheduledEnd: '', resolution: '1080p', sourceType: 'uploaded' as string, sourceUrl: '' });
  const [saving, setSaving] = useState(false);
  const [createAndStart, setCreateAndStart] = useState(false);
  const [formThumb, setFormThumb] = useState<File | null>(null);
  const formThumbRef = useRef<HTMLInputElement>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStreamModal, setShowStreamModal] = useState<string | null>(null);
  const [streamThumb, setStreamThumb] = useState<File | null>(null);
  const [streamEndDate, setStreamEndDate] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledStart: '', scheduledEnd: '' });
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [ytStatus, setYtStatus] = useState<{connected: boolean; channel?: {channelTitle?: string; channelThumbnail?: string}} | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  // Bulk selection
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  // Recording state
  const [recordingSlots, setRecordingSlots] = useState<Set<string>>(new Set());
  // Overlay state
  const [overlaySlot, setOverlaySlot] = useState<string | null>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  // Per-slot source tabs & URL inputs
  const [slotSourceTab, setSlotSourceTab] = useState<Record<string, string>>({});
  const [slotYtUrl, setSlotYtUrl] = useState<Record<string, string>>({});
  const [slotGdriveUrl, setSlotGdriveUrl] = useState<Record<string, string>>({});
  // Simulcast (multi-platform) state
  const [showSimulcast, setShowSimulcast] = useState(false);
  const [simulcastDests, setSimulcastDests] = useState<{platform: string; streamKey: string; rtmpUrl: string}[]>([
    { platform: 'youtube', streamKey: '', rtmpUrl: '' },
    { platform: 'facebook', streamKey: '', rtmpUrl: '' },
  ]);
  const [simulcastVideoId, setSimulcastVideoId] = useState('');
  const [simulcastSourceType, setSimulcastSourceType] = useState<'uploaded' | 'youtube_url'>('uploaded');
  const [simulcastSourceUrl, setSimulcastSourceUrl] = useState('');
  const [simulcastLoading, setSimulcastLoading] = useState(false);

  // Video source states for stream modal
  const [videoSource, setVideoSource] = useState<VideoSourceType>('uploaded');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeUrlInfo, setYoutubeUrlInfo] = useState<{title?: string; thumbnail?: string; duration?: string; type?: string; count?: number} | null>(null);
  const [ytUrlLoading, setYtUrlLoading] = useState(false);
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [playlistVideoIds, setPlaylistVideoIds] = useState<string[]>([]);
  const [streamLoop, setStreamLoop] = useState(true);

  const platformIcons: Record<string, React.ReactNode> = {
    youtube: <Youtube size={18} className="text-red-500" />,
    facebook: <Facebook size={18} className="text-blue-600" />,
    twitch: <Twitch size={18} className="text-purple-500" />,
    instagram: <Instagram size={18} className="text-pink-500" />,
    custom: <Globe size={18} className="text-tertiary" />,
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

  const loadYoutubeStatus = async () => {
    try {
      const res = await youtubeAPI.getStatus();
      setYtStatus(res.data);
    } catch { /* ignore if not configured */ }
  };

  useEffect(() => { loadData(); loadYoutubeStatus(); }, []);

  // Check URL params for YouTube OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      loadYoutubeStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('youtube_error')) {
      setError(`YouTube connection failed: ${params.get('youtube_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnectYoutube = async () => {
    setYtLoading(true);
    try {
      const res = await youtubeAPI.getAuthUrl();
      window.location.href = res.data.authUrl;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to get YouTube auth URL';
      setError(msg);
      setYtLoading(false);
    }
  };

  const handleDisconnectYoutube = async () => {
    if (!confirm('Disconnect YouTube channel?')) return;
    setYtLoading(true);
    try {
      await youtubeAPI.disconnect();
      setYtStatus({ connected: false });
    } catch { setError('Failed to disconnect YouTube'); }
    setYtLoading(false);
  };

  const handleCreate = async (e: React.FormEvent, startImmediately = false) => {
    e.preventDefault();
    setSaving(true);
    setCreateAndStart(startImmediately);
    setError(null);
    try {
      const res = await slotsAPI.create(form);
      const newSlotId = res.data?.id || res.data?._id;
      
      // Upload thumbnail if provided
      if (formThumb && newSlotId) {
        const fd = new FormData();
        fd.append('thumbnail', formThumb);
        fd.append('slotId', newSlotId);
        try { await slotsAPI.uploadThumbnail(newSlotId, fd); } catch { /* ignore thumb error */ }
      }
      
      // If "Create & Start Stream" was clicked, start streaming immediately
      if (startImmediately && newSlotId) {
        try {
          if (form.sourceType === 'youtube_url' && form.sourceUrl.trim()) {
            await streamingAPI.youtubeUrl({ slotId: newSlotId, url: form.sourceUrl.trim(), loop: true });
          } else if (form.sourceType === 'gdrive' && form.sourceUrl.trim()) {
            await streamingAPI.cloudStream({ slotId: newSlotId, cloudUrl: form.sourceUrl.trim(), provider: 'gdrive', loop: true });
          } else if (form.videoId) {
            await slotsAPI.startStream(newSlotId);
          }
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Slot created but stream start failed';
          setError(msg);
        }
      }
      
      setShowAdd(false);
      setForm({ name: '', platform: 'youtube', streamKey: '', streamUrl: '', videoId: '', scheduledStart: '', scheduledEnd: '', resolution: '1080p', sourceType: 'uploaded', sourceUrl: '' });
      setFormThumb(null);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create slot';
      setError(msg);
    }
    setSaving(false);
    setCreateAndStart(false);
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
    const slot = slots.find(s => s.id === slotId);
    setShowStreamModal(slotId);
    setStreamThumb(null);
    setStreamEndDate('');
    setVideoSource(slot?.videoId ? 'uploaded' : 'uploaded');
    setYoutubeUrl('');
    setYoutubeUrlInfo(null);
    setGdriveUrl('');
    setPlaylistVideoIds([]);
    setStreamLoop(true);
  };

  const handleExtractYoutubeUrl = async () => {
    if (!youtubeUrl.trim()) return;
    setYtUrlLoading(true);
    setYoutubeUrlInfo(null);
    try {
      const res = await streamingAPI.extractYoutubeInfo(youtubeUrl);
      setYoutubeUrlInfo(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to extract YouTube URL info';
      setError(msg);
    }
    setYtUrlLoading(false);
  };

  const handleStartStream = async (slotId: string) => {
    setShowStreamModal(null);
    setActionLoading(slotId);
    setError(null);
    try {
      if (streamThumb) {
        const formData = new FormData();
        formData.append('thumbnail', streamThumb);
        formData.append('slotId', slotId);
        await slotsAPI.uploadThumbnail(slotId, formData);
      }
      if (streamEndDate) {
        await slotsAPI.update(slotId, { scheduledEnd: new Date(streamEndDate).toISOString() });
      }
      if (videoSource === 'youtube_url' && youtubeUrl.trim()) {
        await streamingAPI.youtubeUrl({ slotId, url: youtubeUrl.trim(), loop: streamLoop });
      } else if (videoSource === 'google_drive' && gdriveUrl.trim()) {
        await streamingAPI.cloudStream({ slotId, cloudUrl: gdriveUrl.trim(), provider: 'gdrive', loop: streamLoop });
      } else if (videoSource === 'playlist' && playlistVideoIds.length > 0) {
        await streamingAPI.playlistQueue({ slotId, videoIds: playlistVideoIds });
      } else {
        await slotsAPI.startStream(slotId);
      }
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start stream';
      setError(msg);
    }
    setActionLoading(null);
    setStreamThumb(null);
    setStreamEndDate('');
    setYoutubeUrl('');
    setYoutubeUrlInfo(null);
    setGdriveUrl('');
    setPlaylistVideoIds([]);
  };

  const handleSaveSchedule = async (slotId: string) => {
    setShowScheduleModal(null);
    setActionLoading(slotId);
    setError(null);
    try {
      const update: Record<string, unknown> = {};
      if (scheduleForm.scheduledStart) {
        update.scheduledStart = new Date(scheduleForm.scheduledStart).toISOString();
      } else {
        update.scheduledStart = '';
      }
      if (scheduleForm.scheduledEnd) {
        update.scheduledEnd = new Date(scheduleForm.scheduledEnd).toISOString();
      } else {
        update.scheduledEnd = '';
      }
      await slotsAPI.update(slotId, update);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to save schedule';
      setError(msg);
    }
    setActionLoading(null);
  };

  const openScheduleModal = (slot: Slot) => {
    setShowScheduleModal(slot.id);
    setScheduleForm({
      scheduledStart: slot.scheduledStart ? new Date(slot.scheduledStart).toISOString().slice(0, 16) : '',
      scheduledEnd: slot.scheduledEnd ? new Date(slot.scheduledEnd).toISOString().slice(0, 16) : '',
    });
  };

  const formatScheduleDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return null; }
  };

  const getTimeRemaining = (endStr?: string) => {
    if (!endStr) return null;
    try {
      const end = new Date(endStr).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) return 'Ended';
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h left`;
      if (hrs > 0) return `${hrs}h ${mins}m left`;
      return `${mins}m left`;
    } catch { return null; }
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

  // Bulk operations
  const toggleSelectSlot = (slotId: string) => {
    setSelectedSlots(prev => prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]);
  };
  const toggleSelectAll = () => {
    if (selectedSlots.length === slots.length) setSelectedSlots([]);
    else setSelectedSlots(slots.map(s => s.id));
  };
  const handleBulkStart = async () => {
    setBulkLoading(true); setError(null);
    try { await bulkAPI.start(selectedSlots); setSelectedSlots([]); loadData(); } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Bulk start failed';
      setError(msg);
    }
    setBulkLoading(false);
  };
  const handleBulkStop = async () => {
    setBulkLoading(true); setError(null);
    try { await bulkAPI.stop(selectedSlots); setSelectedSlots([]); loadData(); } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Bulk stop failed';
      setError(msg);
    }
    setBulkLoading(false);
  };
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedSlots.length} selected slots?`)) return;
    setBulkLoading(true); setError(null);
    try { await bulkAPI.delete(selectedSlots); setSelectedSlots([]); loadData(); } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Bulk delete failed';
      setError(msg);
    }
    setBulkLoading(false);
  };

  // Recording
  const handleStartRecording = async (slotId: string) => {
    setActionLoading(slotId); setError(null);
    try { await streamingAPI.startRecording(slotId); setRecordingSlots(prev => new Set(prev).add(slotId)); } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start recording';
      setError(msg);
    }
    setActionLoading(null);
  };
  const handleStopRecording = async (slotId: string) => {
    setActionLoading(slotId); setError(null);
    try { await streamingAPI.stopRecording(slotId); setRecordingSlots(prev => { const n = new Set(prev); n.delete(slotId); return n; }); } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to stop recording';
      setError(msg);
    }
    setActionLoading(null);
  };

  // Overlay
  const handleOverlayUpload = async (slotId: string, file: File) => {
    setActionLoading(slotId); setError(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      await streamingAPI.uploadOverlay(slotId, fd);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to upload overlay';
      setError(msg);
    }
    setActionLoading(null); setOverlaySlot(null);
  };
  const handleRemoveOverlay = async (slotId: string) => {
    setActionLoading(slotId); setError(null);
    try { await streamingAPI.removeOverlay(slotId); } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to remove overlay';
      setError(msg);
    }
    setActionLoading(null);
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm('Delete this slot?')) return;
    try { await slotsAPI.delete(slotId); loadData(); } catch { /* ignore */ }
  };

  const getStatusColor = (s: string) => {
    switch (s) { case 'active': return 'bg-green-100 text-green-700'; case 'expired': return 'bg-red-100 text-red-700'; default: return 'surface-muted text-secondary'; }
  };

  const getVideoName = (slot: Slot) => {
    if (slot.videoName) return slot.videoName;
    if (slot.videoId) {
      const v = videos.find(vid => vid.id === slot.videoId);
      return v ? v.name : 'Unknown video';
    }
    return null;
  };

  const getSourceLabel = (slot: Slot) => {
    if (slot.sourceType === 'youtube_url') return { label: 'YouTube URL', icon: <Youtube size={13} className="text-red-500" />, color: 'text-red-600' };
    if (slot.sourceType === 'cloud_gdrive') return { label: 'Google Drive', icon: <HardDrive size={13} className="text-green-500" />, color: 'text-green-600' };
    if (slot.sourceType === 'playlist_queue') return { label: 'Playlist Queue', icon: <List size={13} className="text-purple-500" />, color: 'text-purple-600' };
    return null;
  };

  const togglePlaylistVideo = (videoId: string) => {
    setPlaylistVideoIds(prev =>
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  };

  const canStartStream = (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.status !== 'active') return false;
    if (videoSource === 'uploaded') return !!slot.videoId;
    if (videoSource === 'youtube_url') return !!youtubeUrl.trim();
    if (videoSource === 'google_drive') return !!gdriveUrl.trim();
    if (videoSource === 'playlist') return playlistVideoIds.length > 0;
    return false;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Live Slots</h1>
        <div className="flex gap-2">
          <button onClick={loadData} className="px-3 py-2 rounded-lg border hover:bg-[rgb(var(--bg-muted))]"><RefreshCw size={18} /></button>
          <button onClick={() => setShowSimulcast(true)} className="px-4 py-2 rounded-lg border flex items-center gap-2 text-sm text-indigo-600 hover:bg-indigo-50">
            <Globe size={16} /> Simulcast
          </button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-white flex items-center gap-2">
            <Plus size={18} /> Add Slot
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {slots.length > 0 && (
        <div className="mb-4 p-3 surface-base rounded-xl border flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={selectedSlots.length === slots.length && slots.length > 0} onChange={toggleSelectAll} className="rounded" />
            <CheckSquare size={16} className="text-tertiary" /> Select All
          </label>
          {selectedSlots.length > 0 && (
            <>
              <span className="text-sm text-tertiary">({selectedSlots.length} selected)</span>
              <button onClick={handleBulkStart} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg text-white text-xs flex items-center gap-1 disabled:opacity-50" style={{ backgroundColor: '#22c55e' }}>
                <Play size={12} /> Start All
              </button>
              <button onClick={handleBulkStop} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs flex items-center gap-1 disabled:opacity-50">
                <Square size={12} /> Stop All
              </button>
              <button onClick={handleBulkDelete} disabled={bulkLoading} className="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 text-red-500 hover:bg-red-50 disabled:opacity-50">
                <Trash2 size={12} /> Delete Selected
              </button>
            </>
          )}
        </div>
      )}

      {/* YouTube Connection Card */}
      <div className="mb-4 p-4 surface-base rounded-xl border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Youtube size={24} className="text-red-500" />
            <div>
              <h3 className="font-semibold text-sm">YouTube Channel</h3>
              {ytStatus?.connected ? (
                <p className="text-xs text-green-600">Connected: {ytStatus.channel?.channelTitle || 'YouTube Channel'}</p>
              ) : (
                <p className="text-xs text-tertiary">Connect to auto-set custom thumbnails on YouTube live streams</p>
              )}
            </div>
          </div>
          {ytStatus?.connected ? (
            <div className="flex items-center gap-2">
              {ytStatus.channel?.channelThumbnail && (
                <img src={ytStatus.channel.channelThumbnail} alt="" className="w-8 h-8 rounded-full" />
              )}
              <button onClick={handleDisconnectYoutube} disabled={ytLoading}
                className="px-3 py-1.5 rounded-lg border text-sm text-red-500 hover:bg-red-50 disabled:opacity-50">
                {ytLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <button onClick={handleConnectYoutube} disabled={ytLoading}
              className="px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2 disabled:opacity-50 bg-red-500 hover:bg-red-600">
              <Youtube size={16} /> {ytLoading ? 'Connecting...' : 'Connect YouTube'}
            </button>
          )}
        </div>
        {ytStatus?.connected && (
          <div className="mt-2 pt-2 border-t text-xs text-tertiary">
            Channel connect hone ke fayde: Jab aap live stream start karoge to custom thumbnail automatically YouTube pe set ho jayega. Bina channel connect ke YouTube apna auto-generated thumbnail use karta hai.
          </div>
        )}
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
          <div className="surface-base rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-5 pb-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Add New Slot</h2>
              <button type="button" onClick={() => { setShowAdd(false); setFormThumb(null); }} className="text-tertiary hover:text-secondary"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-5 space-y-3">
              {/* Row 1: Name + Platform */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Slot Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="My YouTube Stream" className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Platform</label>
                  <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-[rgb(var(--bg-muted))] text-[rgb(var(--text))] border-[rgb(var(--border))]">
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitch">Twitch</option>
                    <option value="instagram">Instagram</option>
                    <option value="custom">Custom RTMP</option>
                  </select>
                </div>
              </div>
              {/* Row 2: Stream Key + Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Stream Key</label>
                  <input type="text" required value={form.streamKey} onChange={e => setForm({...form, streamKey: e.target.value})}
                    placeholder="xxxx-xxxx-xxxx-xxxx" className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Stream Quality</label>
                  <select value={form.resolution} onChange={e => setForm({...form, resolution: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-[rgb(var(--bg-muted))] text-[rgb(var(--text))] border-[rgb(var(--border))]">
                    <option value="auto">Auto (Smart Fallback)</option>
                    <option value="4k">4K (2160p)</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="720p">720p HD</option>
                  </select>
                </div>
              </div>
              {form.platform === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">RTMP URL</label>
                  <input type="text" value={form.streamUrl} onChange={e => setForm({...form, streamUrl: e.target.value})}
                    placeholder="rtmp://..." className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                </div>
              )}

              {/* Video Source - Tabs */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Video Source</label>
                <div className="flex gap-1 mb-2 surface-muted p-0.5 rounded-lg">
                  <button type="button" onClick={() => setForm({...form, sourceType: 'uploaded', sourceUrl: ''})}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${form.sourceType === 'uploaded' ? 'surface-base shadow text-primary' : 'text-tertiary'}`}>
                    <Film size={12} className="inline mr-1" />Video
                  </button>
                  <button type="button" onClick={() => setForm({...form, sourceType: 'youtube_url', videoId: ''})}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${form.sourceType === 'youtube_url' ? 'surface-base shadow text-red-600' : 'text-tertiary'}`}>
                    <Youtube size={12} className="inline mr-1" />YT Link
                  </button>
                  <button type="button" onClick={() => setForm({...form, sourceType: 'gdrive', videoId: ''})}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${form.sourceType === 'gdrive' ? 'surface-base shadow text-blue-600' : 'text-tertiary'}`}>
                    <HardDrive size={12} className="inline mr-1" />Drive
                  </button>
                  <button type="button" onClick={() => setForm({...form, sourceType: 'playlist', videoId: ''})}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${form.sourceType === 'playlist' ? 'surface-base shadow text-purple-600' : 'text-tertiary'}`}>
                    <List size={12} className="inline mr-1" />Playlist
                  </button>
                </div>
                {form.sourceType === 'uploaded' && (
                  <select value={form.videoId} onChange={e => setForm({...form, videoId: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-[rgb(var(--bg-muted))] text-[rgb(var(--text))] border-[rgb(var(--border))]">
                    <option value="">Select a video (optional)</option>
                    {videos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                )}
                {form.sourceType === 'youtube_url' && (
                  <input type="text" placeholder="https://youtube.com/watch?v=..."
                    value={form.sourceUrl} onChange={e => setForm({...form, sourceUrl: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                )}
                {form.sourceType === 'gdrive' && (
                  <input type="text" placeholder="https://drive.google.com/file/d/..."
                    value={form.sourceUrl} onChange={e => setForm({...form, sourceUrl: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                )}
                {form.sourceType === 'playlist' && (
                  <p className="text-xs text-tertiary p-2 surface-subtle rounded-lg">Playlist select after slot creation.</p>
                )}
              </div>

              {/* Thumbnail + Schedule Row */}
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Thumbnail</label>
                  <input type="file" ref={formThumbRef} accept="image/*" className="hidden"
                    onChange={e => setFormThumb(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => formThumbRef.current?.click()}
                    className="w-full px-3 py-2 rounded-lg border text-sm flex items-center gap-2 hover:bg-[rgb(var(--bg-muted))] truncate">
                    <Image size={14} className="shrink-0" /> <span className="truncate">{formThumb ? formThumb.name : 'Upload (optional)'}</span>
                  </button>
                  {formThumb && (
                    <button type="button" onClick={() => setFormThumb(null)} className="text-red-400 hover:text-red-600 text-xs mt-1">Remove</button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Schedule End</label>
                  <input type="datetime-local" value={form.scheduledEnd} onChange={e => setForm({...form, scheduledEnd: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                  <p className="text-xs text-tertiary mt-0.5">Empty = runs forever</p>
                </div>
              </div>

              {/* Action Buttons - sticky at bottom */}
              <div className="flex gap-2 pt-3 border-t sticky bottom-0 surface-base pb-1">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg border text-sm font-medium disabled:opacity-50 hover:bg-[rgb(var(--bg-muted))]">
                  {saving && !createAndStart ? 'Creating...' : 'Create Slot'}
                </button>
                <button type="button" disabled={saving} onClick={(e) => handleCreate(e as unknown as React.FormEvent, true)}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50" style={{ backgroundColor: '#22c55e' }}>
                  <Play size={14} /> {saving && createAndStart ? 'Starting...' : 'Create & Go LIVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slots List */}
      {loading ? (
        <div className="text-center py-12 text-tertiary">Loading...</div>
      ) : slots.length === 0 ? (
        <div className="text-center py-12 surface-base rounded-xl border">
          <Radio size={48} className="mx-auto mb-4 text-secondary" />
          <h3 className="font-semibold text-primary mb-2">No Live Slots Yet</h3>
          <p className="text-sm text-tertiary mb-4">Create your first slot to start streaming 24/7.</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-white">Add Slot</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {slots.map(slot => {
            const videoName = getVideoName(slot);
            const sourceLabel = getSourceLabel(slot);
            return (
            <div key={slot.id} className={`surface-base rounded-xl border p-5 ${selectedSlots.includes(slot.id) ? 'ring-2 ring-indigo-400' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedSlots.includes(slot.id)} onChange={() => toggleSelectSlot(slot.id)} className="rounded" />
                  {platformIcons[slot.platform] || <Globe size={18} />}
                  <div>
                    <h3 className="font-semibold">{slot.name}</h3>
                    <p className="text-xs text-tertiary capitalize">{slot.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(slot.status)}`}>{slot.status}</span>
                  {slot.isStreaming && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE</span>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-secondary">
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
                {sourceLabel && slot.isStreaming && (
                  <div className="flex items-center gap-1">
                    {sourceLabel.icon}
                    <span className={`${sourceLabel.color} font-medium text-xs`}>{sourceLabel.label}</span>
                    {slot.sourceUrl && <span className="text-xs text-tertiary truncate max-w-32">{slot.sourceUrl}</span>}
                  </div>
                )}
              </div>

              {/* Schedule Info */}
              {(slot.scheduledStart || slot.scheduledEnd) && (
                <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-indigo-700 mb-1"><Clock size={13} /> Schedule</div>
                  <div className="grid grid-cols-2 gap-2 text-indigo-600">
                    {slot.scheduledStart && <div>Start: {formatScheduleDate(slot.scheduledStart)}</div>}
                    {slot.scheduledEnd && (
                      <div className="flex items-center gap-1">
                        End: {formatScheduleDate(slot.scheduledEnd)}
                        {slot.isStreaming && <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 rounded text-indigo-800 font-medium">{getTimeRemaining(slot.scheduledEnd)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {slot.isStreaming && !slot.scheduledEnd && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-1.5">
                  <Timer size={13} /> Streaming in infinite loop - will continue until manually stopped
                </div>
              )}

              {/* Video Source Assignment - Tabs: Uploaded / YouTube URL / Drive / Playlist */}
              <div className="mt-3">
                <label className="text-xs text-tertiary mb-1 block">Video Source:</label>
                <div className="flex gap-1 mb-2 surface-muted p-0.5 rounded-lg">
                  <button type="button" onClick={() => { const el = document.getElementById(`src-tab-${slot.id}`); if (el) el.dataset.tab = 'uploaded'; setSlotSourceTab(prev => ({...prev, [slot.id]: 'uploaded'})); }}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${(slotSourceTab[slot.id] || 'uploaded') === 'uploaded' ? 'surface-base shadow text-primary' : 'text-tertiary'}`}>
                    <Film size={12} className="inline mr-1" />Video
                  </button>
                  <button type="button" onClick={() => setSlotSourceTab(prev => ({...prev, [slot.id]: 'youtube_url'}))}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${slotSourceTab[slot.id] === 'youtube_url' ? 'surface-base shadow text-red-600' : 'text-tertiary'}`}>
                    <Youtube size={12} className="inline mr-1" />YT Link
                  </button>
                  <button type="button" onClick={() => setSlotSourceTab(prev => ({...prev, [slot.id]: 'gdrive'}))}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${slotSourceTab[slot.id] === 'gdrive' ? 'surface-base shadow text-blue-600' : 'text-tertiary'}`}>
                    <HardDrive size={12} className="inline mr-1" />Drive
                  </button>
                  <button type="button" onClick={() => setSlotSourceTab(prev => ({...prev, [slot.id]: 'playlist'}))}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${slotSourceTab[slot.id] === 'playlist' ? 'surface-base shadow text-purple-600' : 'text-tertiary'}`}>
                    <List size={12} className="inline mr-1" />Playlist
                  </button>
                </div>

                {/* Uploaded Video Tab */}
                {(!slotSourceTab[slot.id] || slotSourceTab[slot.id] === 'uploaded') && (
                  <select
                    value={slot.videoId || ''}
                    onChange={e => handleAssignVideo(slot.id, e.target.value)}
                    disabled={actionLoading === slot.id}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                  >
                    <option value="">-- Select uploaded video --</option>
                    {videos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                )}

                {/* YouTube URL Tab */}
                {slotSourceTab[slot.id] === 'youtube_url' && (
                  <div className="flex gap-2">
                    <input type="text" placeholder="https://youtube.com/watch?v=..." 
                      value={slotYtUrl[slot.id] || ''} onChange={e => setSlotYtUrl(prev => ({...prev, [slot.id]: e.target.value}))}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                    <button onClick={() => { slotsAPI.update(slot.id, { sourceType: 'youtube_url', sourceUrl: slotYtUrl[slot.id] || '' }); loadData(); }}
                      disabled={!slotYtUrl[slot.id]?.trim()} className="px-3 py-2 rounded-lg text-white text-xs disabled:opacity-50">
                      Save
                    </button>
                  </div>
                )}

                {/* Google Drive Tab */}
                {slotSourceTab[slot.id] === 'gdrive' && (
                  <div className="flex gap-2">
                    <input type="text" placeholder="https://drive.google.com/file/d/..." 
                      value={slotGdriveUrl[slot.id] || ''} onChange={e => setSlotGdriveUrl(prev => ({...prev, [slot.id]: e.target.value}))}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                    <button onClick={() => { slotsAPI.update(slot.id, { sourceType: 'gdrive', sourceUrl: slotGdriveUrl[slot.id] || '' }); loadData(); }}
                      disabled={!slotGdriveUrl[slot.id]?.trim()} className="px-3 py-2 rounded-lg text-white text-xs disabled:opacity-50">
                      Save
                    </button>
                  </div>
                )}

                {/* Playlist Tab */}
                {slotSourceTab[slot.id] === 'playlist' && (
                  <div className="text-xs text-tertiary p-2 surface-subtle rounded-lg">
                    Playlist queue is available in the <strong>Start Stream</strong> modal. Click Start Stream to select multiple videos for queue playback.
                  </div>
                )}
                
                {/* Show current source if YouTube URL or Drive assigned */}
                {slot.sourceUrl && (
                  <div className="mt-1 text-xs text-tertiary flex items-center gap-1 truncate">
                    <Link size={11} /> Current: <span className="text-blue-600 truncate">{slot.sourceUrl}</span>
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {slot.status === 'inactive' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Slot is inactive. Please purchase a plan to activate.
                </div>
              )}
              <div className="mt-4 flex gap-2 flex-wrap">
                {slot.status === 'active' && !slot.isStreaming && (
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
                {slot.status === 'active' && !slot.isStreaming && (
                  <button onClick={() => openScheduleModal(slot)} className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-indigo-600 hover:bg-indigo-50">
                    <Calendar size={14} /> Schedule
                  </button>
                )}
                {/* Recording buttons - only when streaming */}
                {slot.isStreaming && !recordingSlots.has(slot.id) && (
                  <button onClick={() => handleStartRecording(slot.id)} disabled={actionLoading === slot.id}
                    className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50">
                    <CircleDot size={14} /> Record
                  </button>
                )}
                {recordingSlots.has(slot.id) && (
                  <button onClick={() => handleStopRecording(slot.id)} disabled={actionLoading === slot.id}
                    className="px-3 py-1.5 rounded-lg bg-red-100 border border-red-300 text-sm flex items-center gap-1.5 text-red-700 disabled:opacity-50">
                    <CircleDot size={14} className="animate-pulse" /> Stop Rec
                  </button>
                )}
                {/* Overlay buttons - only when streaming */}
                {slot.isStreaming && (
                  <>
                    <button onClick={() => { setOverlaySlot(slot.id); overlayInputRef.current?.click(); }}
                      className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 text-purple-600 hover:bg-purple-50">
                      <Layers size={14} /> Overlay
                    </button>
                    <button onClick={() => handleRemoveOverlay(slot.id)} disabled={actionLoading === slot.id}
                      className="px-2 py-1.5 rounded-lg border text-sm flex items-center gap-1 text-tertiary hover:text-red-500 hover:bg-red-50 disabled:opacity-50" title="Remove overlay">
                      <X size={14} />
                    </button>
                  </>
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

      {/* Simulcast Modal - Stream to multiple platforms at once */}
      {showSimulcast && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="surface-base rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-5 pb-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Globe size={20} /> Simulcast - Multi Platform</h2>
              <button type="button" onClick={() => setShowSimulcast(false)} className="text-tertiary hover:text-secondary"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-xs text-tertiary">Ek hi video ko multiple platforms pe ek saath LIVE karo. Har platform ka stream key daalo.</p>

              {/* Destinations */}
              {simulcastDests.map((dest, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="w-28">
                    <label className="block text-xs text-tertiary mb-1">Platform</label>
                    <select value={dest.platform} onChange={e => { const d = [...simulcastDests]; d[i].platform = e.target.value; setSimulcastDests(d); }}
                      className="w-full px-2 py-2 rounded-lg border text-sm">
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitch">Twitch</option>
                      <option value="instagram">Instagram</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-tertiary mb-1">Stream Key</label>
                    <input type="text" value={dest.streamKey} onChange={e => { const d = [...simulcastDests]; d[i].streamKey = e.target.value; setSimulcastDests(d); }}
                      placeholder="xxxx-xxxx-xxxx-xxxx" className="w-full px-3 py-2 rounded-lg border text-sm" />
                  </div>
                  {simulcastDests.length > 1 && (
                    <button type="button" onClick={() => setSimulcastDests(simulcastDests.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 pb-2">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setSimulcastDests([...simulcastDests, { platform: 'twitch', streamKey: '', rtmpUrl: '' }])}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <Plus size={14} /> Add Platform
              </button>

              {/* Video Source */}
              <div className="border-t pt-3">
                <label className="block text-xs font-medium text-secondary mb-1">Video Source</label>
                <div className="flex gap-1 mb-2 surface-muted p-0.5 rounded-lg">
                  <button type="button" onClick={() => setSimulcastSourceType('uploaded')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${simulcastSourceType === 'uploaded' ? 'surface-base shadow' : 'text-tertiary'}`}>
                    <Film size={12} className="inline mr-1" />Uploaded Video
                  </button>
                  <button type="button" onClick={() => setSimulcastSourceType('youtube_url')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition ${simulcastSourceType === 'youtube_url' ? 'surface-base shadow text-red-600' : 'text-tertiary'}`}>
                    <Youtube size={12} className="inline mr-1" />YouTube URL
                  </button>
                </div>
                {simulcastSourceType === 'uploaded' ? (
                  <select value={simulcastVideoId} onChange={e => setSimulcastVideoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="">Select a video</option>
                    {videos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                ) : (
                  <input type="text" value={simulcastSourceUrl} onChange={e => setSimulcastSourceUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2 rounded-lg border text-sm" />
                )}
              </div>
            </div>

            {/* Start Button */}
            <div className="p-5 pt-3 border-t">
              <button disabled={simulcastLoading || simulcastDests.filter(d => d.streamKey.trim()).length === 0 || (!simulcastVideoId && !simulcastSourceUrl.trim())}
                onClick={async () => {
                  setSimulcastLoading(true);
                  setError(null);
                  try {
                    const validDests = simulcastDests.filter(d => d.streamKey.trim());
                    if (simulcastSourceType === 'uploaded' && simulcastVideoId) {
                      await streamingAPI.multiStream({ videoId: simulcastVideoId, destinations: validDests, loop: true });
                    } else if (simulcastSourceType === 'youtube_url' && simulcastSourceUrl.trim()) {
                      // Create temp slots for each destination and start YT URL stream on each
                      for (const dest of validDests) {
                        const slotRes = await slotsAPI.create({ name: `Simulcast-${dest.platform}`, platform: dest.platform, streamKey: dest.streamKey, resolution: '1080p', sourceType: 'youtube_url', sourceUrl: simulcastSourceUrl });
                        const sid = slotRes.data?.id || slotRes.data?._id;
                        if (sid) await streamingAPI.youtubeUrl({ slotId: sid, url: simulcastSourceUrl.trim(), loop: true });
                      }
                    }
                    setShowSimulcast(false);
                    loadData();
                  } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Simulcast start failed';
                    setError(msg);
                  }
                  setSimulcastLoading(false);
                }}
                className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: '#22c55e' }}>
                <Play size={16} /> {simulcastLoading ? 'Starting All Streams...' : `Go LIVE on ${simulcastDests.filter(d => d.streamKey.trim()).length} Platforms`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Start Modal - Video Source + Thumbnail + End Date */}
      {showStreamModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="surface-base rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2"><Play size={20} /> Start Stream</h2>

            {/* Video Source Tabs */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Video Source</label>
              <div className="grid grid-cols-4 gap-1 surface-muted p-1 rounded-xl">
                <button type="button" onClick={() => setVideoSource('uploaded')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${videoSource === 'uploaded' ? 'surface-base shadow text-primary' : 'text-tertiary hover:text-gray-700'}`}>
                  <Film size={16} />
                  Uploaded
                </button>
                <button type="button" onClick={() => setVideoSource('youtube_url')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${videoSource === 'youtube_url' ? 'surface-base shadow text-red-600' : 'text-tertiary hover:text-gray-700'}`}>
                  <Youtube size={16} />
                  YouTube URL
                </button>
                <button type="button" onClick={() => setVideoSource('google_drive')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${videoSource === 'google_drive' ? 'surface-base shadow text-green-600' : 'text-tertiary hover:text-gray-700'}`}>
                  <HardDrive size={16} />
                  Drive
                </button>
                <button type="button" onClick={() => setVideoSource('playlist')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${videoSource === 'playlist' ? 'surface-base shadow text-purple-600' : 'text-tertiary hover:text-gray-700'}`}>
                  <List size={16} />
                  Playlist
                </button>
              </div>
            </div>

            {/* Uploaded Video Source */}
            {videoSource === 'uploaded' && (
              <div className="mb-4 p-3 surface-subtle rounded-xl">
                <p className="text-sm text-secondary mb-2">Using assigned uploaded video. It will loop continuously in its original quality (up to 4K).</p>
                {(() => {
                  const slot = slots.find(s => s.id === showStreamModal);
                  const vName = slot ? getVideoName(slot) : null;
                  return vName ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Film size={14} className="text-green-600" />
                      <span className="text-green-700 font-medium">{vName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle size={14} />
                      No video assigned. Please assign a video first or use YouTube URL / Google Drive.
                    </div>
                  );
                })()}
              </div>
            )}

            {/* YouTube URL Source */}
            {videoSource === 'youtube_url' && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl space-y-3">
                <p className="text-sm text-secondary">Paste a YouTube video or playlist URL. Video download ki zaroorat nahi - direct stream hoga!</p>
                <div className="flex gap-2">
                  <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or playlist URL"
                    className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                  <button type="button" onClick={handleExtractYoutubeUrl} disabled={ytUrlLoading || !youtubeUrl.trim()}
                    className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm disabled:opacity-50 flex items-center gap-1">
                    {ytUrlLoading ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                    {ytUrlLoading ? '...' : 'Check'}
                  </button>
                </div>
                {youtubeUrlInfo && (
                  <div className="flex items-center gap-3 p-2 surface-base rounded-lg border">
                    {youtubeUrlInfo.thumbnail && <img src={youtubeUrlInfo.thumbnail} alt="" className="w-16 h-10 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{youtubeUrlInfo.title || 'YouTube Video'}</p>
                      <p className="text-xs text-tertiary">
                        {youtubeUrlInfo.type === 'playlist' ? `Playlist - ${youtubeUrlInfo.count || '?'} videos` : youtubeUrlInfo.duration || 'Video'}
                      </p>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={streamLoop} onChange={e => setStreamLoop(e.target.checked)} className="rounded" />
                  Loop video (repeat continuously)
                </label>
              </div>
            )}

            {/* Google Drive Source */}
            {videoSource === 'google_drive' && (
              <div className="mb-4 p-3 bg-green-50 rounded-xl space-y-3">
                <p className="text-sm text-secondary">Paste a Google Drive video share link. Make sure the file is shared as &quot;Anyone with the link can view&quot;.</p>
                <input type="text" value={gdriveUrl} onChange={e => setGdriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or direct link"
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={streamLoop} onChange={e => setStreamLoop(e.target.checked)} className="rounded" />
                  Loop video (repeat continuously)
                </label>
                <div className="text-xs text-tertiary flex items-center gap-1">
                  <Link size={12} /> Tip: Google Drive se video download nahi hoga, direct stream hoga server se YouTube ko.
                </div>
              </div>
            )}

            {/* Playlist Queue Source */}
            {videoSource === 'playlist' && (
              <div className="mb-4 p-3 bg-purple-50 rounded-xl space-y-3">
                <p className="text-sm text-secondary">Multiple uploaded videos ko queue me add karo - ek ke baad ek stream hongi.</p>
                {videos.length === 0 ? (
                  <p className="text-sm text-orange-600 flex items-center gap-1"><AlertCircle size={14} /> Koi video upload nahi hai. Pehle Videos page se upload karo.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {videos.map(v => (
                      <label key={v.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${playlistVideoIds.includes(v.id) ? 'bg-purple-100 border border-purple-300' : 'surface-base border hover:bg-[rgb(var(--bg-muted))]'}`}>
                        <input type="checkbox" checked={playlistVideoIds.includes(v.id)} onChange={() => togglePlaylistVideo(v.id)} className="rounded" />
                        <Film size={14} className="text-tertiary" />
                        <span className="text-sm truncate">{v.name}</span>
                        {playlistVideoIds.includes(v.id) && (
                          <span className="ml-auto text-xs text-purple-600 font-medium">#{playlistVideoIds.indexOf(v.id) + 1}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {playlistVideoIds.length > 0 && (
                  <p className="text-xs text-purple-700 font-medium">{playlistVideoIds.length} videos selected - will play in order</p>
                )}
              </div>
            )}

            {/* Thumbnail */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 flex items-center gap-1.5"><Image size={14} /> Custom Thumbnail (optional)</label>
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:bg-[rgb(var(--bg-muted))] transition"
              >
                {streamThumb ? (
                  <div className="flex items-center gap-2 justify-center">
                    <img src={URL.createObjectURL(streamThumb)} alt="thumb" className="w-20 h-14 object-cover rounded" />
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-48">{streamThumb.name}</p>
                      <p className="text-xs text-tertiary">{(streamThumb.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={20} className="mx-auto mb-1 text-tertiary" />
                    <p className="text-xs text-tertiary">Click to upload thumbnail</p>
                    <p className="text-xs text-tertiary">Auto-set on YouTube if channel is connected</p>
                  </div>
                )}
              </div>
              <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={e => setStreamThumb(e.target.files?.[0] || null)} />
            </div>

            {/* End Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 flex items-center gap-1.5"><Clock size={14} /> End Date & Time (optional)</label>
              <input type="datetime-local" value={streamEndDate} onChange={e => setStreamEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2" />
              <p className="text-xs text-tertiary mt-1">Leave empty for infinite loop. Video keeps looping until this time or manual stop.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowStreamModal(null); setStreamThumb(null); setStreamEndDate(''); }} className="flex-1 py-2.5 rounded-xl border">Cancel</button>
              <button onClick={() => handleStartStream(showStreamModal)} disabled={!canStartStream(showStreamModal)}
                className="flex-1 py-2.5 rounded-xl text-white disabled:opacity-50" style={{ backgroundColor: '#22c55e' }}>
                Start Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Overlay File Input */}
      <input ref={overlayInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f && overlaySlot) handleOverlayUpload(overlaySlot, f); e.target.value = ''; }} />

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="surface-base rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2"><Calendar size={20} /> Schedule Stream</h2>
            <p className="text-sm text-secondary mb-4">Set a start and/or end time. Stream auto-starts at the scheduled time and loops the video until end time.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1.5"><Play size={14} /> Start Date & Time</label>
                <input type="datetime-local" value={scheduleForm.scheduledStart} onChange={e => setScheduleForm({...scheduleForm, scheduledStart: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2" />
                <p className="text-xs text-tertiary mt-1">Stream will auto-start at this time</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1.5"><Square size={14} /> End Date & Time</label>
                <input type="datetime-local" value={scheduleForm.scheduledEnd} onChange={e => setScheduleForm({...scheduleForm, scheduledEnd: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2" />
                <p className="text-xs text-tertiary mt-1">Stream will auto-stop at this time. Video loops until then.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowScheduleModal(null)} className="flex-1 py-2.5 rounded-xl border">Cancel</button>
              <button onClick={() => handleSaveSchedule(showScheduleModal)} className="flex-1 py-2.5 rounded-xl text-white">
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

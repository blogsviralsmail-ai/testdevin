import { useState, useEffect, useRef } from 'react';
import { videosAPI } from '../../services/api';
import { Video, Upload, Trash2, Edit2, Check, X, RefreshCw, AlertCircle, Play, Clock } from 'lucide-react';

interface VideoItem {
  id: string; name: string; originalName: string; fileSize: number;
  duration: number; thumbnailUrl: string; createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function VideosPage() {

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadQueue, setUploadQueue] = useState<{name: string; progress: number; status: 'pending' | 'uploading' | 'done' | 'error'}[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await videosAPI.getAll();
      setVideos(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadVideos(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    const queue = fileList.map(f => ({ name: f.name, progress: 0, status: 'pending' as const }));
    setUploadQueue(queue);

    for (let idx = 0; idx < fileList.length; idx++) {
      const file = fileList[idx];
      setUploadQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'uploading' } : q));
      try {
        await videosAPI.uploadChunked(file, (progress: number) => {
          setUploadQueue(prev => prev.map((q, i) => i === idx ? { ...q, progress } : q));
          // Overall progress across all files
          const base = (idx / fileList.length) * 100;
          const filePart = (progress / fileList.length);
          setUploadProgress(Math.round(base + filePart));
        });
        setUploadQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'done', progress: 100 } : q));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed.';
        setUploadQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'error' } : q));
        setUploadError(errorMsg);
      }
    }
    loadVideos();
    setUploading(false);
    setUploadProgress(0);
    setUploadQueue([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRename = async (id: string) => {
    try {
      await videosAPI.update(id, { name: editName });
      setEditingId(null);
      loadVideos();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try { await videosAPI.delete(id); loadVideos(); } catch { /* ignore */ }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '—';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getThumbUrl = (video: VideoItem) => {
    if (!video.thumbnailUrl) return '';
    const token = localStorage.getItem('token') || '';
    return `${API_URL}${video.thumbnailUrl}${video.thumbnailUrl.includes('?') ? '&' : '?'}token=${token}`;
  };

  const getStreamUrl = (video: VideoItem) => {
    const token = localStorage.getItem('token') || '';
    return `${API_URL}/api/videos/${video.id}/stream?token=${token}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Videos</h1>
        <div className="flex gap-2">
          <button onClick={loadVideos} className="px-3 py-2 rounded-lg border hover:bg-[rgb(var(--bg-muted))]"><RefreshCw size={18} /></button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50">
            <Upload size={18} /> {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
          <input ref={fileRef} type="file" accept="video/*" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {uploading && (
        <div className="mb-4 surface-base rounded-xl border p-4 space-y-3">
          {uploadQueue.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Overall progress</span>
                <span className="text-sm text-tertiary">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, backgroundColor: 'rgb(var(--accent))' }} />
              </div>
            </div>
          )}
          {uploadQueue.map((q, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-secondary truncate max-w-[70%]">
                  {q.status === 'done' ? '\u2714' : q.status === 'error' ? '\u2716' : q.status === 'uploading' ? '\u25B6' : '\u25CB'}{' '}{q.name}
                </span>
                <span className="text-xs text-tertiary">{q.status === 'done' ? 'Done' : q.status === 'error' ? 'Failed' : `${q.progress}%`}</span>
              </div>
              {q.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${q.progress}%`, backgroundColor: 'rgb(var(--accent))' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-700">{uploadError}</p>
            <button onClick={() => setUploadError(null)} className="text-xs text-red-500 underline mt-1">Dismiss</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-tertiary">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 surface-base rounded-xl border">
          <Video size={48} className="mx-auto mb-4 text-secondary" />
          <h3 className="font-semibold text-gray-700 mb-2">No Videos Yet</h3>
          <p className="text-sm text-tertiary mb-4">Upload your first video to start streaming.</p>
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-lg text-white">Upload Video</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(video => (
            <div key={video.id} className="surface-base rounded-xl border overflow-hidden group hover:shadow-md transition-shadow">
              {/* Thumbnail / Play area */}
              <div
                className="relative aspect-video bg-gray-900 cursor-pointer flex items-center justify-center"
                onClick={() => setPlayingVideo(video)}
              >
                {video.thumbnailUrl ? (
                  <img
                    src={getThumbUrl(video)}
                    alt={video.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Video size={40} className="text-secondary" />
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full surface-base/90 flex items-center justify-center">
                    <Play size={24} className="text-primary ml-1" />
                  </div>
                </div>
                {/* Duration badge */}
                {video.duration > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} />
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>

              {/* Info area */}
              <div className="p-3">
                {editingId === video.id ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className="px-2 py-1 border rounded text-sm flex-1" autoFocus />
                    <button onClick={() => handleRename(video.id)} className="text-green-600"><Check size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="text-tertiary"><X size={16} /></button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium truncate" title={video.name}>{video.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-tertiary">
                        {formatSize(video.fileSize)} &middot; {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => { setEditingId(video.id); setEditName(video.name); }}
                          className="p-1 rounded hover:bg-[rgb(var(--bg-muted))] text-tertiary" title="Rename"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(video.id)}
                          className="p-1 rounded hover:bg-red-50 text-red-400" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
          <div className="surface-base card-premium overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm truncate flex-1">{playingVideo.name}</h3>
              <button onClick={() => setPlayingVideo(null)} className="p-1 rounded hover:bg-[rgb(var(--bg-muted))] text-tertiary ml-2"><X size={18} /></button>
            </div>
            <div className="bg-black flex-1">
              <video
                src={getStreamUrl(playingVideo)}
                controls
                autoPlay
                className="w-full max-h-[75vh]"
                style={{ objectFit: 'contain' }}
              >
                Your browser does not support video playback.
              </video>
            </div>
            <div className="p-3 border-t flex items-center justify-between text-xs text-tertiary">
              <span>{formatSize(playingVideo.fileSize)} &middot; {formatDuration(playingVideo.duration)}</span>
              <span>Uploaded {new Date(playingVideo.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

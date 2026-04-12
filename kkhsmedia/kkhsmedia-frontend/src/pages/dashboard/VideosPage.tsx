import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { videosAPI } from '../../services/api';
import { Video, Upload, Trash2, Edit2, Check, X, RefreshCw, AlertCircle, Play, Clock } from 'lucide-react';

interface VideoItem {
  id: string; name: string; originalName: string; fileSize: number;
  duration: number; thumbnailUrl: string; createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function VideosPage() {
  const { settings } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const primary = settings?.primaryColor || '#6366f1';

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
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    try {
      // Use chunked upload for files > 50MB to bypass Cloudflare limits
      if (file.size > 50 * 1024 * 1024) {
        await videosAPI.uploadChunked(file, (progress: number) => setUploadProgress(progress));
      } else {
        const fd = new FormData();
        fd.append('file', file);
        await videosAPI.uploadLocal(fd, (progress: number) => setUploadProgress(progress));
      }
      loadVideos();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed. Try a smaller file or check your connection.';
      setUploadError(errorMsg);
    }
    setUploading(false);
    setUploadProgress(0);
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
          <button onClick={loadVideos} className="px-3 py-2 rounded-lg border hover:bg-gray-50"><RefreshCw size={18} /></button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: primary }}>
            <Upload size={18} /> {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {uploading && (
        <div className="mb-4 bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading video...</span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, backgroundColor: primary }} />
          </div>
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
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Video size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700 mb-2">No Videos Yet</h3>
          <p className="text-sm text-gray-500 mb-4">Upload your first video to start streaming.</p>
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: primary }}>Upload Video</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(video => (
            <div key={video.id} className="bg-white rounded-xl border overflow-hidden group hover:shadow-md transition-shadow">
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
                  <Video size={40} className="text-gray-600" />
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                    <Play size={24} className="text-gray-800 ml-1" />
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
                    <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={16} /></button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium truncate" title={video.name}>{video.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {formatSize(video.fileSize)} &middot; {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => { setEditingId(video.id); setEditName(video.name); }}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400" title="Rename"><Edit2 size={13} /></button>
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
          <div className="bg-white rounded-xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm truncate flex-1">{playingVideo.name}</h3>
              <button onClick={() => setPlayingVideo(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500 ml-2"><X size={18} /></button>
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
            <div className="p-3 border-t flex items-center justify-between text-xs text-gray-500">
              <span>{formatSize(playingVideo.fileSize)} &middot; {formatDuration(playingVideo.duration)}</span>
              <span>Uploaded {new Date(playingVideo.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

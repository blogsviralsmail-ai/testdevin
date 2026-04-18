import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Video, Search, Trash2, RefreshCw, Play, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface VideoItem {
  id: string; name: string; originalName: string; size: number;
  userId: string; userEmail?: string; createdAt: string;
  thumbnailUrl?: string; duration?: number; fileUrl?: string;
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  const loadVideos = async () => {
    setLoading(true);
    try { const res = await adminAPI.getVideos(); setVideos(res.data.videos || res.data); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadVideos(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try { await adminAPI.deleteVideo(id); loadVideos(); } catch { /* ignore */ }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0 KB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getThumbnailUrl = (video: VideoItem) => {
    if (!video.thumbnailUrl) return null;
    const token = localStorage.getItem('token');
    if (video.thumbnailUrl.startsWith('http')) return video.thumbnailUrl;
    return `${API_URL}${video.thumbnailUrl}?token=${token}`;
  };

  const getStreamUrl = (video: VideoItem) => {
    const token = localStorage.getItem('token');
    return `${API_URL}/api/videos/${video.id}/stream?token=${token}`;
  };

  const filtered = videos.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.userEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Videos ({videos.length})</h1>
        <button onClick={loadVideos} className="px-3 py-2 rounded-lg border hover:bg-[rgb(var(--bg-muted))]"><RefreshCw size={18} /></button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search videos..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
          <div className="surface-base rounded-xl max-w-3xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold truncate">{playingVideo.name}</h3>
              <button onClick={() => setPlayingVideo(null)} className="p-1 rounded-lg hover:bg-[rgb(var(--bg-muted))]"><X size={20} /></button>
            </div>
            <div className="bg-black">
              <video controls autoPlay className="w-full max-h-[70vh]" src={getStreamUrl(playingVideo)} />
            </div>
            <div className="p-3 text-sm text-tertiary flex justify-between">
              <span>User: {playingVideo.userEmail || playingVideo.userId}</span>
              <span>{formatSize(playingVideo.size)} {playingVideo.duration ? `• ${formatDuration(playingVideo.duration)}` : ''}</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-tertiary">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(video => {
            const thumbUrl = getThumbnailUrl(video);
            return (
              <div key={video.id} className="surface-base rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                <div className="relative aspect-video surface-muted cursor-pointer group" onClick={() => setPlayingVideo(video)}>
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={video.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={40} className="text-secondary" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full surface-base/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={20} className="text-primary ml-1" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  {video.duration ? (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  ) : null}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium truncate" title={video.name}>{video.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-tertiary">{video.userEmail || video.userId}</span>
                    <span className="text-xs text-tertiary">{formatSize(video.size)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-tertiary">{new Date(video.createdAt).toLocaleDateString()}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(video.id); }} className="p-1 rounded hover:bg-red-50" title="Delete">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

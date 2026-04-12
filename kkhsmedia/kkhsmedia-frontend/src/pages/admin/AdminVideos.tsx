import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Video, Search, Trash2, RefreshCw } from 'lucide-react';

interface VideoItem {
  id: string; name: string; originalName: string; size: number;
  userId: string; userEmail?: string; createdAt: string;
}

export default function AdminVideos() {
  const { settings } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const primary = settings?.primaryColor || '#6366f1';

  const loadVideos = async () => {
    setLoading(true);
    try { const res = await adminAPI.getVideos(); setVideos(res.data); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadVideos(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try { await adminAPI.deleteVideo(id); loadVideos(); } catch { /* ignore */ }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const filtered = videos.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.userEmail || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Videos ({videos.length})</h1>
        <button onClick={loadVideos} className="px-3 py-2 rounded-lg border hover:bg-gray-50"><RefreshCw size={18} /></button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search videos..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Video</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Size</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 hidden lg:table-cell">Uploaded</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(video => (
                <tr key={video.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Video size={16} style={{ color: primary }} />
                      <span className="text-sm font-medium">{video.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{video.userEmail || video.userId}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{formatSize(video.size)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{new Date(video.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(video.id)} className="p-1.5 rounded hover:bg-red-50">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
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

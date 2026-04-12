import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { videosAPI } from '../../services/api';
import { Video, Upload, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';

interface VideoItem {
  id: string; name: string; originalName: string; size: number;
  mimeType: string; createdAt: string; url?: string;
}

export default function VideosPage() {
  const { settings } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
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
    try {
      const fd = new FormData();
      fd.append('file', file);
      await videosAPI.uploadLocal(fd);
      loadVideos();
    } catch { /* ignore */ }
    setUploading(false);
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
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500 hidden sm:table-cell">Size</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500 hidden md:table-cell">Uploaded</th>
                <th className="text-right px-5 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    {editingId === video.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                          className="px-2 py-1 border rounded text-sm flex-1" autoFocus />
                        <button onClick={() => handleRename(video.id)} className="text-green-600"><Check size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Video size={16} style={{ color: primary }} />
                        <span className="text-sm font-medium">{video.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 hidden sm:table-cell">{formatSize(video.size)}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 hidden md:table-cell">{new Date(video.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingId(video.id); setEditName(video.name); }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(video.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
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

import { useState, useEffect } from 'react';
import { rtmpPullAPI, slotsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function RtmpPullPage() {
  const [slots, setSlots] = useState<{ id: string; name: string }[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string; url: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ slotId: '', sourceUrl: '', sourceName: '', quality: 'copy', loop: false });
  const [saveName, setSaveName] = useState('');
  const [saveUrl, setSaveUrl] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [slotRes, srcRes] = await Promise.all([slotsAPI.getAll(), rtmpPullAPI.getSources()]);
      setSlots((slotRes.data.slots || slotRes.data || []).map((s: Record<string, unknown>) => ({ id: (s.id || s._id) as string, name: s.name as string })));
      setSources(srcRes.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const startPull = async () => {
    if (!form.slotId || !form.sourceUrl) { toast.error('Select slot and enter source URL'); return; }
    try {
      const res = await rtmpPullAPI.start(form);
      toast.success(`RTMP Pull started (PID: ${res.data.pid})`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start';
      toast.error(msg);
    }
  };

  const stopPull = async () => {
    if (!form.slotId) { toast.error('Select slot'); return; }
    try {
      await rtmpPullAPI.stop(form.slotId);
      toast.success('Stream stopped');
    } catch { toast.error('Failed to stop'); }
  };

  const saveSource = async () => {
    if (!saveName || !saveUrl) { toast.error('Enter name and URL'); return; }
    try {
      await rtmpPullAPI.saveSource(saveName, saveUrl);
      toast.success('Source saved');
      setSaveName(''); setSaveUrl('');
      loadData();
    } catch { toast.error('Failed to save'); }
  };

  const deleteSource = async (id: string) => {
    try { await rtmpPullAPI.deleteSource(id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary">RTMP Pull / Re-Stream</h1>
      <p className="text-sm text-tertiary">Re-stream from any RTMP, HLS, or HTTP video source to your YouTube channel</p>

      {/* Start RTMP Pull */}
      <div className="surface-base border rounded-lg p-6 space-y-4 max-w-lg">
        <h2 className="text-lg font-semibold">Start Re-Stream</h2>
        <select value={form.slotId} onChange={e => setForm({ ...form, slotId: e.target.value })} className="w-full border rounded p-2 text-sm">
          <option value="">Select Slot</option>
          {slots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="text" placeholder="Source URL (rtmp://, http://, .m3u8)" value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} className="w-full border rounded p-2 text-sm" />
        <input type="text" placeholder="Source Name (optional)" value={form.sourceName} onChange={e => setForm({ ...form, sourceName: e.target.value })} className="w-full border rounded p-2 text-sm" />
        <div className="flex space-x-4">
          <select value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })} className="flex-1 border rounded p-2 text-sm">
            <option value="copy">Passthrough (Copy)</option>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
          </select>
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={form.loop} onChange={e => setForm({ ...form, loop: e.target.checked })} />
            <span>Loop</span>
          </label>
        </div>
        <div className="flex space-x-2">
          <button onClick={startPull} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm">Start Re-Stream</button>
          <button onClick={stopPull} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 text-sm">Stop</button>
        </div>
      </div>

      {/* Saved Sources */}
      <div className="surface-base border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Saved Sources</h2>
        <div className="flex space-x-2">
          <input type="text" placeholder="Name" value={saveName} onChange={e => setSaveName(e.target.value)} className="flex-1 border rounded p-2 text-sm" />
          <input type="text" placeholder="URL" value={saveUrl} onChange={e => setSaveUrl(e.target.value)} className="flex-1 border rounded p-2 text-sm" />
          <button onClick={saveSource} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Save</button>
        </div>
        {sources.length === 0 ? (
          <p className="text-sm text-tertiary">No saved sources yet</p>
        ) : (
          <div className="space-y-2">
            {sources.map(s => (
              <div key={s.id} className="flex items-center justify-between surface-subtle rounded p-3">
                <div>
                  <span className="font-medium text-sm">{s.name}</span>
                  <p className="text-xs text-tertiary truncate max-w-md">{s.url}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setForm({ ...form, sourceUrl: s.url, sourceName: s.name })} className="text-blue-600 text-xs hover:text-blue-800">Use</button>
                  <button onClick={() => deleteSource(s.id)} className="text-red-600 text-xs hover:text-red-800">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

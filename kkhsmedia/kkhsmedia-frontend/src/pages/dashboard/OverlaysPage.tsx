import { useState, useEffect } from 'react';
import { overlayAPI, slotsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function OverlaysPage() {
  const [slots, setSlots] = useState<{ id: string; name: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [tab, setTab] = useState<'watermark' | 'chat'>('watermark');
  const [watermark, setWatermark] = useState({ enabled: false, text: '', position: 'topRight', opacity: 0.7, fontSize: 24, fontColor: 'white', imageUrl: '' });
  const [chatConfig, setChatConfig] = useState({ enabled: false, position: 'bottomRight', fontSize: 18, fontColor: 'white', backgroundColor: 'black', backgroundOpacity: 0.6, maxMessages: 5, width: 350, height: 200 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSlots(); }, []);
  useEffect(() => { if (selectedSlot) loadConfigs(); }, [selectedSlot]);

  const loadSlots = async () => {
    try {
      const res = await slotsAPI.getAll();
      const s = (res.data.slots || res.data || []).map((s: Record<string, unknown>) => ({ id: (s.id || s._id) as string, name: s.name as string }));
      setSlots(s);
      if (s.length > 0) setSelectedSlot(s[0].id);
    } catch { toast.error('Failed to load slots'); }
    finally { setLoading(false); }
  };

  const loadConfigs = async () => {
    try {
      const [wRes, cRes] = await Promise.all([overlayAPI.getWatermarkConfig(selectedSlot), overlayAPI.getChatConfig(selectedSlot)]);
      setWatermark(wRes.data);
      setChatConfig(cRes.data);
    } catch { /* defaults ok */ }
  };

  const saveWatermark = async () => {
    try {
      await overlayAPI.updateWatermarkConfig({ slotId: selectedSlot, ...watermark });
      toast.success('Watermark config saved');
    } catch { toast.error('Failed to save'); }
  };

  const saveChatConfig = async () => {
    try {
      await overlayAPI.updateChatConfig({ slotId: selectedSlot, ...chatConfig });
      toast.success('Chat overlay config saved');
    } catch { toast.error('Failed to save'); }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await overlayAPI.uploadWatermark(fd);
      setWatermark({ ...watermark, imageUrl: res.data.url });
      toast.success('Logo uploaded');
    } catch { toast.error('Upload failed'); }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary">Stream Overlays</h1>

      {/* Slot selector */}
      <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)} className="border rounded-lg p-2 text-sm w-full max-w-xs">
        {slots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {/* Tabs */}
      <div className="flex space-x-1 surface-muted rounded-lg p-1 max-w-md">
        {(['watermark', 'chat'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${tab === t ? 'surface-base shadow text-blue-600' : 'text-secondary'}`}>
            {t === 'watermark' ? 'Watermark / Logo' : 'Chat Overlay'}
          </button>
        ))}
      </div>

      {/* Watermark Tab */}
      {tab === 'watermark' && (
        <div className="surface-base border rounded-lg p-6 space-y-4 max-w-lg">
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={watermark.enabled} onChange={e => setWatermark({ ...watermark, enabled: e.target.checked })} />
            <span className="font-medium">Enable Watermark</span>
          </label>
          <div>
            <label className="text-sm text-secondary">Text Watermark</label>
            <input type="text" placeholder="Your brand name" value={watermark.text} onChange={e => setWatermark({ ...watermark, text: e.target.value })} className="w-full border rounded p-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-sm text-secondary">Or Upload Logo Image</label>
            <input type="file" accept="image/*" onChange={uploadLogo} className="w-full text-sm mt-1" />
            {watermark.imageUrl && <p className="text-xs text-green-600 mt-1">Logo: {watermark.imageUrl}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-secondary">Position</label>
              <select value={watermark.position} onChange={e => setWatermark({ ...watermark, position: e.target.value })} className="w-full border rounded p-2 text-sm mt-1">
                <option value="topLeft">Top Left</option>
                <option value="topRight">Top Right</option>
                <option value="bottomLeft">Bottom Left</option>
                <option value="bottomRight">Bottom Right</option>
                <option value="center">Center</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-secondary">Opacity</label>
              <input type="range" min="0.1" max="1" step="0.1" value={watermark.opacity} onChange={e => setWatermark({ ...watermark, opacity: parseFloat(e.target.value) })} className="w-full mt-2" />
              <span className="text-xs text-tertiary">{watermark.opacity}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-secondary">Font Size</label>
              <input type="number" value={watermark.fontSize} onChange={e => setWatermark({ ...watermark, fontSize: parseInt(e.target.value) || 24 })} className="w-full border rounded p-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm text-secondary">Font Color</label>
              <input type="text" value={watermark.fontColor} onChange={e => setWatermark({ ...watermark, fontColor: e.target.value })} className="w-full border rounded p-2 text-sm mt-1" />
            </div>
          </div>
          <button onClick={saveWatermark} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">Save Watermark</button>
        </div>
      )}

      {/* Chat Overlay Tab */}
      {tab === 'chat' && (
        <div className="surface-base border rounded-lg p-6 space-y-4 max-w-lg">
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={chatConfig.enabled} onChange={e => setChatConfig({ ...chatConfig, enabled: e.target.checked })} />
            <span className="font-medium">Enable Chat Overlay</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-secondary">Position</label>
              <select value={chatConfig.position} onChange={e => setChatConfig({ ...chatConfig, position: e.target.value })} className="w-full border rounded p-2 text-sm mt-1">
                <option value="topLeft">Top Left</option>
                <option value="topRight">Top Right</option>
                <option value="bottomLeft">Bottom Left</option>
                <option value="bottomRight">Bottom Right</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-secondary">Max Messages</label>
              <input type="number" value={chatConfig.maxMessages} onChange={e => setChatConfig({ ...chatConfig, maxMessages: parseInt(e.target.value) || 5 })} className="w-full border rounded p-2 text-sm mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-secondary">Font Size</label>
              <input type="number" value={chatConfig.fontSize} onChange={e => setChatConfig({ ...chatConfig, fontSize: parseInt(e.target.value) || 18 })} className="w-full border rounded p-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm text-secondary">BG Opacity</label>
              <input type="range" min="0" max="1" step="0.1" value={chatConfig.backgroundOpacity} onChange={e => setChatConfig({ ...chatConfig, backgroundOpacity: parseFloat(e.target.value) })} className="w-full mt-2" />
              <span className="text-xs text-tertiary">{chatConfig.backgroundOpacity}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-secondary">Width (px)</label>
              <input type="number" value={chatConfig.width} onChange={e => setChatConfig({ ...chatConfig, width: parseInt(e.target.value) || 350 })} className="w-full border rounded p-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-sm text-secondary">Height (px)</label>
              <input type="number" value={chatConfig.height} onChange={e => setChatConfig({ ...chatConfig, height: parseInt(e.target.value) || 200 })} className="w-full border rounded p-2 text-sm mt-1" />
            </div>
          </div>
          <button onClick={saveChatConfig} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">Save Chat Config</button>
        </div>
      )}
    </div>
  );
}

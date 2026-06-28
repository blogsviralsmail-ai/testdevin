import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Cake, Save, ToggleLeft, ToggleRight } from 'lucide-react';

interface BirthdayConfig { id: number; enabled: boolean; template_id: number; send_time: string; days_before: number; message: string; }

export default function BirthdayWishesPage() {
  const [config, setConfig] = useState<BirthdayConfig>({ id: 0, enabled: false, template_id: 0, send_time: '09:00', days_before: 0, message: 'Happy Birthday! 🎂 Wishing you a wonderful day.' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => { try { const { data } = await api.get('/birthday-wishes/config'); if (data.data || data) setConfig({ ...config, ...(data.data || data) }); } catch {} finally { setLoading(false); } })(); }, []);

  const handleSave = async () => { setSaving(true); try { await api.put('/birthday-wishes/config', config); toast.success('Settings saved'); } catch { toast.error('Failed to save'); } finally { setSaving(false); } };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Cake className="text-emerald-500" size={28} /><h1 className="text-2xl font-bold dark:text-white">Birthday Wishes</h1></div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50"><Save size={18} /> {saving ? 'Saving...' : 'Save'}</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div><h3 className="font-semibold dark:text-white">Auto Birthday Wishes</h3><p className="text-sm text-gray-500">Automatically send birthday wishes to contacts</p></div>
          <button onClick={() => setConfig({...config, enabled: !config.enabled})}>{config.enabled ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-gray-400" />}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Send Time</label>
            <input type="time" value={config.send_time} onChange={(e) => setConfig({...config, send_time: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Days Before (0 = on birthday)</label>
            <input type="number" min={0} max={7} value={config.days_before} onChange={(e) => setConfig({...config, days_before: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birthday Message</label>
            <textarea value={config.message} onChange={(e) => setConfig({...config, message: e.target.value})} rows={4} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
        </div>
      </div>
    </div>
  );
}

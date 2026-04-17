import { useState, useEffect } from 'react';
import { scheduleAPI, slotsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Schedule {
  id: string;
  slotId: string;
  slotName: string;
  youtubeUrl?: string;
  videoId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  loop: boolean;
  quality: string;
  title?: string;
  status: string;
}

interface YouTubeAccount {
  id: string;
  channelName: string;
  channelId: string;
  streamKey: string;
  rtmpUrl: string;
  isDefault: boolean;
  description: string;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [accounts, setAccounts] = useState<YouTubeAccount[]>([]);
  const [slots, setSlots] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'schedules' | 'accounts' | 'csv'>('schedules');
  const [showAdd, setShowAdd] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [form, setForm] = useState({ slotId: '', youtubeUrl: '', startTime: '', duration: 24, quality: '1080p', loop: true, title: '' });
  const [accountForm, setAccountForm] = useState({ channelName: '', streamKey: '', rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2', isDefault: false, description: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [schedRes, accRes, slotRes] = await Promise.all([
        scheduleAPI.getAll(), scheduleAPI.getYouTubeAccounts(), slotsAPI.getAll()
      ]);
      setSchedules(schedRes.data.schedules || []);
      setAccounts(accRes.data || []);
      setSlots((slotRes.data.slots || slotRes.data || []).map((s: Record<string, unknown>) => ({ id: (s.id || s._id) as string, name: s.name as string })));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const createSchedule = async () => {
    if (!form.slotId || !form.startTime) { toast.error('Select slot and start time'); return; }
    try {
      await scheduleAPI.create(form);
      toast.success('Schedule created');
      setShowAdd(false);
      loadData();
    } catch { toast.error('Failed to create schedule'); }
  };

  const deleteSchedule = async (id: string) => {
    try { await scheduleAPI.delete(id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Failed to delete'); }
  };

  const addAccount = async () => {
    if (!accountForm.channelName || !accountForm.streamKey) { toast.error('Fill channel name and stream key'); return; }
    try {
      await scheduleAPI.addYouTubeAccount(accountForm);
      toast.success('YouTube account added');
      setShowAddAccount(false);
      setAccountForm({ channelName: '', streamKey: '', rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2', isDefault: false, description: '' });
      loadData();
    } catch { toast.error('Failed to add account'); }
  };

  const deleteAccount = async (id: string) => {
    try { await scheduleAPI.deleteYouTubeAccount(id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await scheduleAPI.importCsv(fd);
      toast.success(`Imported ${res.data.imported} schedules`);
      if (res.data.errors > 0) toast.error(`${res.data.errors} errors`);
      loadData();
    } catch { toast.error('CSV import failed'); }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Schedule & YouTube Accounts</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 surface-muted rounded-lg p-1">
        {(['schedules', 'accounts', 'csv'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${tab === t ? 'surface-base shadow text-blue-600' : 'text-secondary hover:text-primary'}`}>
            {t === 'schedules' ? 'Schedules' : t === 'accounts' ? 'YouTube Accounts' : 'CSV Import'}
          </button>
        ))}
      </div>

      {/* Schedules Tab */}
      {tab === 'schedules' && (
        <div className="space-y-4">
          <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            + Add Schedule
          </button>

          {showAdd && (
            <div className="surface-base border rounded-lg p-4 space-y-3">
              <select value={form.slotId} onChange={e => setForm({ ...form, slotId: e.target.value })} className="w-full border rounded p-2 text-sm">
                <option value="">Select Slot</option>
                {slots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="text" placeholder="YouTube URL (optional)" value={form.youtubeUrl} onChange={e => setForm({ ...form, youtubeUrl: e.target.value })} className="w-full border rounded p-2 text-sm" />
              <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full border rounded p-2 text-sm" />
              <div className="flex space-x-2">
                <input type="number" placeholder="Duration (hours)" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })} className="flex-1 border rounded p-2 text-sm" />
                <select value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })} className="flex-1 border rounded p-2 text-sm">
                  <option value="4k">4K</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                </select>
              </div>
              <input type="text" placeholder="Title (optional)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded p-2 text-sm" />
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={form.loop} onChange={e => setForm({ ...form, loop: e.target.checked })} />
                <span>Loop video</span>
              </label>
              <button onClick={createSchedule} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Create</button>
            </div>
          )}

          {schedules.length === 0 ? (
            <div className="text-center py-12 text-tertiary">No schedules yet. Create one above!</div>
          ) : (
            <div className="surface-base border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="surface-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-tertiary">Slot</th>
                    <th className="px-4 py-3 text-left font-medium text-tertiary">Title</th>
                    <th className="px-4 py-3 text-center font-medium text-tertiary">Start</th>
                    <th className="px-4 py-3 text-center font-medium text-tertiary">Quality</th>
                    <th className="px-4 py-3 text-center font-medium text-tertiary">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-tertiary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schedules.map(s => (
                    <tr key={s.id} className="hover:bg-[rgb(var(--bg-muted))]">
                      <td className="px-4 py-3">{s.slotName}</td>
                      <td className="px-4 py-3">{s.title || '-'}</td>
                      <td className="px-4 py-3 text-center text-xs">{new Date(s.startTime).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">{s.quality}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : s.status === 'running' ? 'bg-green-100 text-green-700' : 'surface-muted text-secondary'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => deleteSchedule(s.id)} className="text-red-600 hover:text-red-800 text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* YouTube Accounts Tab */}
      {tab === 'accounts' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddAccount(!showAddAccount)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
            + Add YouTube Account
          </button>

          {showAddAccount && (
            <div className="surface-base border rounded-lg p-4 space-y-3">
              <input type="text" placeholder="Channel Name" value={accountForm.channelName} onChange={e => setAccountForm({ ...accountForm, channelName: e.target.value })} className="w-full border rounded p-2 text-sm" />
              <input type="text" placeholder="Stream Key" value={accountForm.streamKey} onChange={e => setAccountForm({ ...accountForm, streamKey: e.target.value })} className="w-full border rounded p-2 text-sm" />
              <input type="text" placeholder="RTMP URL" value={accountForm.rtmpUrl} onChange={e => setAccountForm({ ...accountForm, rtmpUrl: e.target.value })} className="w-full border rounded p-2 text-sm" />
              <input type="text" placeholder="Description (optional)" value={accountForm.description} onChange={e => setAccountForm({ ...accountForm, description: e.target.value })} className="w-full border rounded p-2 text-sm" />
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={accountForm.isDefault} onChange={e => setAccountForm({ ...accountForm, isDefault: e.target.checked })} />
                <span>Set as Default</span>
              </label>
              <button onClick={addAccount} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Add Account</button>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="text-center py-12 text-tertiary">No YouTube accounts. Add one to manage multiple channels!</div>
          ) : (
            <div className="grid gap-4">
              {accounts.map(a => (
                <div key={a.id} className="surface-base border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{a.channelName}</span>
                      {a.isDefault && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <p className="text-sm text-tertiary mt-1">Key: ****{a.streamKey.slice(-4)}</p>
                    {a.description && <p className="text-xs text-tertiary">{a.description}</p>}
                  </div>
                  <button onClick={() => deleteAccount(a.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CSV Import Tab */}
      {tab === 'csv' && (
        <div className="space-y-4">
          <div className="surface-base border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Import Schedule from CSV</h3>
            <p className="text-sm text-tertiary">Upload a CSV file with schedule entries. Download the template below to see the expected format.</p>
            <div className="flex space-x-4">
              <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
                Upload CSV
                <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
              </label>
              <a href={`${import.meta.env.VITE_API_URL || ''}/api/schedule/csv-template`} className="surface-muted text-secondary px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">
                Download Template
              </a>
            </div>
            <div className="surface-subtle rounded p-3 text-xs font-mono">
              slot_name,youtube_url,video_id,start_time,end_time,duration_hours,quality,loop,title
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

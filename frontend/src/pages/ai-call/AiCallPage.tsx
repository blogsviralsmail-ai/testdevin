import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Phone, Play, Clock, FileAudio, RefreshCw } from 'lucide-react';

interface CallLog { id: number; contactId: number; contactName: string; phone: string; duration: number; status: string; recordingUrl: string; createdAt: string; }

export default function AiCallPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [callLoading, setCallLoading] = useState(false);
  const [contactId, setContactId] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/ai-call/logs?page=${page}`);
      const d = data.data || data;
      setLogs(d.items || d.data || d || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleInitiateCall = async () => {
    if (!contactId) { toast.error('Enter a contact ID'); return; }
    setCallLoading(true);
    try {
      await api.post('/ai-call/initiate', { contactId: parseInt(contactId) });
      toast.success('AI Call initiated!');
      setContactId('');
      fetchLogs();
    } catch { toast.error('Failed to initiate call'); }
    finally { setCallLoading(false); }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    ringing: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">AI Voice Calls</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Initiate AI-powered voice calls to contacts</p></div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300"><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* Initiate Call */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
        <h3 className="font-semibold dark:text-white mb-3">Initiate AI Call</h3>
        <div className="flex gap-3">
          <input
            type="number"
            value={contactId}
            onChange={e => setContactId(e.target.value)}
            placeholder="Enter Contact ID"
            className="flex-1 px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white"
          />
          <button
            onClick={handleInitiateCall}
            disabled={callLoading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            <Phone size={16} /> {callLoading ? 'Calling...' : 'Call'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Total Calls</p><p className="text-2xl font-bold dark:text-white mt-1">{logs.length}</p></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600 mt-1">{logs.filter(l => l.status === 'completed').length}</p></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border dark:border-slate-700"><p className="text-sm text-gray-500">Avg Duration</p><p className="text-2xl font-bold text-blue-600 mt-1">{logs.length > 0 ? formatDuration(Math.round(logs.reduce((s, l) => s + (l.duration || 0), 0) / logs.length)) : '0:00'}</p></div>
      </div>

      {/* Call Logs */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><Phone size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No call logs yet</p></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700"><tr>
              <th className="text-left py-3 px-4 font-medium dark:text-gray-300">Contact</th>
              <th className="text-left py-3 px-4 font-medium dark:text-gray-300">Phone</th>
              <th className="text-left py-3 px-4 font-medium dark:text-gray-300">Duration</th>
              <th className="text-left py-3 px-4 font-medium dark:text-gray-300">Status</th>
              <th className="text-left py-3 px-4 font-medium dark:text-gray-300">Date</th>
              <th className="text-left py-3 px-4 font-medium dark:text-gray-300">Recording</th>
            </tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-t dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4 dark:text-gray-300">{log.contactName || `Contact #${log.contactId}`}</td>
                  <td className="py-3 px-4 dark:text-gray-300">{log.phone || '-'}</td>
                  <td className="py-3 px-4 dark:text-gray-300"><Clock size={14} className="inline mr-1" />{formatDuration(log.duration)}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[log.status] || 'bg-gray-100 text-gray-700'}`}>{log.status}</span></td>
                  <td className="py-3 px-4 text-gray-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                  <td className="py-3 px-4">{log.recordingUrl ? <a href={log.recordingUrl} target="_blank" rel="noopener" className="text-blue-500 hover:underline flex items-center gap-1"><FileAudio size={14} /> Play</a> : <span className="text-gray-400">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

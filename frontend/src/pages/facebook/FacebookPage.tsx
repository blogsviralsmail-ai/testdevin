import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Facebook as FacebookIcon, Trash2, X, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';

interface FBStatus { connected: boolean; pageId: string; pageName: string; autoReplyEnabled: boolean; }

export default function FacebookPage() {
  const [status, setStatus] = useState<FBStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [formData, setFormData] = useState({ pageId: '', accessToken: '' });

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/facebook/status');
      const d = data.data || data;
      setStatus(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/facebook/connect', formData);
      toast.success('Facebook Page connected!');
      setShowConnect(false);
      setFormData({ pageId: '', accessToken: '' });
      fetchStatus();
    } catch { toast.error('Failed to connect'); }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Facebook Page?')) return;
    try { await api.post('/facebook/disconnect'); toast.success('Disconnected'); fetchStatus(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Facebook Integration</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect Facebook Pages for Messenger chat</p></div>
        {!(status?.connected) && <button onClick={() => setShowConnect(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><FacebookIcon size={16} /> Connect Page</button>}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">Connect your Facebook Page to receive and reply to Messenger messages directly from WabaPanel. You need a Page Access Token from the Meta Developer Portal.</p>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
      ) : status?.connected ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><FacebookIcon className="text-blue-600" size={24} /></div>
              <div>
                <h3 className="font-semibold dark:text-white">{status.pageName || 'Facebook Page'}</h3>
                <p className="text-xs text-gray-400">Page ID: {status.pageId}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Connected</span>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleDisconnect} className="flex items-center gap-1 px-4 py-2 text-red-500 border border-red-200 rounded-lg text-sm hover:bg-red-50"><Trash2 size={14} /> Disconnect</button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center">
          <FacebookIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400 mb-4">No Facebook Page connected</p>
          <button onClick={() => setShowConnect(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Connect Facebook Page</button>
        </div>
      )}

      {showConnect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Connect Facebook Page</h3><button onClick={() => setShowConnect(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleConnect} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Page ID *</label><input value={formData.pageId} onChange={e => setFormData({...formData, pageId: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Page Access Token *</label><input value={formData.accessToken} onChange={e => setFormData({...formData, accessToken: e.target.value})} required type="password" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <p className="text-xs text-gray-400">Get your Page Access Token from <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline">Meta Developer Portal</a></p>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Connect</button>
                <button type="button" onClick={() => setShowConnect(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

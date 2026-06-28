import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Instagram as InstagramIcon, Trash2, X } from 'lucide-react';

interface IGStatus { connected: boolean; accountId: string; username: string; }

export default function InstagramPage() {
  const [status, setStatus] = useState<IGStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [formData, setFormData] = useState({ accountId: '', accessToken: '' });

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/instagram/status');
      const d = data.data || data;
      setStatus(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/instagram/connect', formData);
      toast.success('Instagram connected!');
      setShowConnect(false);
      setFormData({ accountId: '', accessToken: '' });
      fetchStatus();
    } catch { toast.error('Failed to connect'); }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Instagram?')) return;
    try { await api.post('/instagram/disconnect'); toast.success('Disconnected'); fetchStatus(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">Instagram Integration</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect Instagram accounts for DM handling</p></div>
        {!(status?.connected) && <button onClick={() => setShowConnect(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-sm font-medium"><InstagramIcon size={16} /> Connect Account</button>}
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-purple-700 dark:text-purple-300">Connect your Instagram Business account to handle DMs. Requires a connected Facebook Page and Instagram Business/Creator account with an access token from Meta.</p>
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
      ) : status?.connected ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center"><InstagramIcon className="text-purple-600" size={24} /></div>
              <div>
                <h3 className="font-semibold dark:text-white">@{status.username || 'Instagram Account'}</h3>
                <p className="text-xs text-gray-400">Account ID: {status.accountId}</p>
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
          <InstagramIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400 mb-4">No Instagram account connected</p>
          <button onClick={() => setShowConnect(true)} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm font-medium">Connect Instagram</button>
        </div>
      )}

      {showConnect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Connect Instagram</h3><button onClick={() => setShowConnect(false)}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleConnect} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Instagram Account ID *</label><input value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Access Token *</label><input value={formData.accessToken} onChange={e => setFormData({...formData, accessToken: e.target.value})} required type="password" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <p className="text-xs text-gray-400">Get your token from <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline">Meta Developer Portal</a> (Instagram Graph API)</p>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm font-medium">Connect</button>
                <button type="button" onClick={() => setShowConnect(false)} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

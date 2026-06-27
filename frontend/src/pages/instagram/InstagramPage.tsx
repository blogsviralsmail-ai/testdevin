import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Instagram, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstagramPage() {
  const [status, setStatus] = useState<{ connected: boolean; accountId: string | null }>({ connected: false, accountId: null });
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    api.get('/instagram/status').then(res => {
      setStatus(res.data?.data || res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleConnect = async () => {
    try {
      await api.post('/instagram/connect', { accountId, accessToken });
      toast.success('Instagram connected!');
      setStatus({ connected: true, accountId });
    } catch { toast.error('Connection failed'); }
  };

  const handleDisconnect = async () => {
    try {
      await api.post('/instagram/disconnect');
      toast.success('Disconnected');
      setStatus({ connected: false, accountId: null });
    } catch { toast.error('Disconnect failed'); }
  };

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 dark:bg-slate-700 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold dark:text-white">Instagram Integration</h1><p className="text-sm text-gray-500 mt-1">Connect your Instagram Business Account</p></div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center"><Instagram size={24} className="text-white" /></div>
          <div>
            <h3 className="font-semibold dark:text-white">Instagram Business</h3>
            <div className="flex items-center gap-2 mt-1">
              {status.connected ? <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600">Connected (ID: {status.accountId})</span></> : <><XCircle size={16} className="text-red-400" /><span className="text-sm text-gray-500">Not Connected</span></>}
            </div>
          </div>
        </div>
        {status.connected ? (
          <button onClick={handleDisconnect} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm">Disconnect</button>
        ) : (
          <div className="space-y-4 max-w-md">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account ID</label><input value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token</label><input value={accessToken} onChange={(e) => setAccessToken(e.target.value)} type="password" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
            <button onClick={handleConnect} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-sm">Connect</button>
          </div>
        )}
      </div>
    </div>
  );
}

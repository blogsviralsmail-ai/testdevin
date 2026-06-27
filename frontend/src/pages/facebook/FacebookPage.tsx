import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Facebook, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacebookPage() {
  const [status, setStatus] = useState<{ connected: boolean; pageId: string | null }>({ connected: false, pageId: null });
  const [loading, setLoading] = useState(true);
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    api.get('/facebook/status').then(res => {
      setStatus(res.data?.data || res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleConnect = async () => {
    try {
      await api.post('/facebook/connect', { pageId, accessToken });
      toast.success('Facebook connected!');
      setStatus({ connected: true, pageId });
    } catch { toast.error('Connection failed'); }
  };

  const handleDisconnect = async () => {
    try {
      await api.post('/facebook/disconnect');
      toast.success('Disconnected');
      setStatus({ connected: false, pageId: null });
    } catch { toast.error('Disconnect failed'); }
  };

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 dark:bg-slate-700 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold dark:text-white">Facebook Integration</h1><p className="text-sm text-gray-500 mt-1">Connect your Facebook Page</p></div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center"><Facebook size={24} className="text-white" /></div>
          <div>
            <h3 className="font-semibold dark:text-white">Facebook Page</h3>
            <div className="flex items-center gap-2 mt-1">
              {status.connected ? <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600">Connected (Page: {status.pageId})</span></> : <><XCircle size={16} className="text-red-400" /><span className="text-sm text-gray-500">Not Connected</span></>}
            </div>
          </div>
        </div>
        {status.connected ? (
          <button onClick={handleDisconnect} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm">Disconnect</button>
        ) : (
          <div className="space-y-4 max-w-md">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page ID</label><input value={pageId} onChange={(e) => setPageId(e.target.value)} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token</label><input value={accessToken} onChange={(e) => setAccessToken(e.target.value)} type="password" className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
            <button onClick={handleConnect} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">Connect</button>
          </div>
        )}
      </div>
    </div>
  );
}

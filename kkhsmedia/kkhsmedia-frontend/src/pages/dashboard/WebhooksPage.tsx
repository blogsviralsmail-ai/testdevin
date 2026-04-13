import { useState, useEffect } from 'react';
import { webhooksAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [tab, setTab] = useState<'webhooks' | 'logs'>('webhooks');
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [newEvents, setNewEvents] = useState(['stream.started', 'stream.stopped', 'stream.error']);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [hooksRes, logsRes] = await Promise.all([webhooksAPI.getAll(), webhooksAPI.getLogs()]);
      setWebhooks(hooksRes.data || []);
      setLogs(logsRes.data?.logs || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const addWebhook = async () => {
    if (!newUrl) return toast.error('URL required');
    try {
      await webhooksAPI.create({ url: newUrl, secret: newSecret, events: newEvents });
      toast.success('Webhook added');
      setShowAdd(false); setNewUrl(''); setNewSecret('');
      loadData();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook?')) return;
    await webhooksAPI.delete(id);
    toast.success('Deleted');
    loadData();
  };

  const toggleActive = async (hook: any) => {
    await webhooksAPI.update(hook.id, { isActive: !hook.isActive });
    loadData();
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  const allEvents = ['stream.started', 'stream.stopped', 'stream.error', 'stream.restarted', 'payment.success', 'slot.expired'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Webhooks</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('webhooks')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'webhooks' ? 'bg-blue-600 text-white' : 'surface-muted'}`}>Webhooks</button>
          <button onClick={() => setTab('logs')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'logs' ? 'bg-blue-600 text-white' : 'surface-muted'}`}>Delivery Logs</button>
        </div>
      </div>

      {tab === 'webhooks' && (
        <div className="space-y-4">
          <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Webhook</button>

          {showAdd && (
            <div className="surface-base rounded-lg border p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL *</label>
                <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://your-server.com/webhook" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret (for signature verification)</label>
                <input type="text" value={newSecret} onChange={e => setNewSecret(e.target.value)} placeholder="Optional secret key" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Events</label>
                <div className="flex flex-wrap gap-2">
                  {allEvents.map(evt => (
                    <label key={evt} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={newEvents.includes(evt)} onChange={e => {
                        if (e.target.checked) setNewEvents([...newEvents, evt]);
                        else setNewEvents(newEvents.filter(x => x !== evt));
                      }} className="w-3.5 h-3.5 rounded" />
                      {evt}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addWebhook} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Save</button>
                <button onClick={() => setShowAdd(false)} className="surface-muted px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="surface-base rounded-lg border divide-y">
            {webhooks.length === 0 ? (
              <div className="p-8 text-center text-tertiary">No webhooks configured</div>
            ) : webhooks.map((hook: any) => (
              <div key={hook.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">{hook.url}</p>
                  <p className="text-xs text-tertiary mt-1">Events: {(hook.events || []).join(', ')}</p>
                  {hook.failCount > 0 && <p className="text-xs text-red-500 mt-1">Failed deliveries: {hook.failCount}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleActive(hook)} className={`px-3 py-1 rounded-full text-xs font-medium ${hook.isActive ? 'bg-green-100 text-green-800' : 'surface-muted text-secondary'}`}>
                    {hook.isActive ? 'Active' : 'Disabled'}
                  </button>
                  <button onClick={() => deleteWebhook(hook.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="surface-base rounded-lg border">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-tertiary">No delivery logs yet</div>
          ) : (
            <div className="divide-y">
              {logs.map((log: any, i: number) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{log.event}</p>
                    <p className="text-xs text-tertiary">{log.url}</p>
                    <p className="text-xs text-tertiary mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {log.statusCode || 'Error'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

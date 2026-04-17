import { useState, useEffect } from 'react';
import { rtmpPullAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface ServerNode {
  id: string;
  name: string;
  host: string;
  port: number;
  maxStreams: number;
  region: string;
  isActive: boolean;
  activeStreams: number;
  loadPercent: number;
}

export default function AdminServers() {
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', host: '', port: 22, maxStreams: 10, sshUser: 'root', region: '', isActive: true });

  useEffect(() => { loadServers(); }, []);

  const loadServers = async () => {
    try {
      const res = await rtmpPullAPI.getServers();
      setServers(res.data || []);
    } catch { /* ok */ }
    finally { setLoading(false); }
  };

  const addServer = async () => {
    if (!form.name || !form.host) { toast.error('Enter name and host'); return; }
    try {
      await rtmpPullAPI.addServer(form);
      toast.success('Server added');
      setShowAdd(false);
      setForm({ name: '', host: '', port: 22, maxStreams: 10, sshUser: 'root', region: '', isActive: true });
      loadServers();
    } catch { toast.error('Failed'); }
  };

  const deleteServer = async (id: string) => {
    try { await rtmpPullAPI.deleteServer(id); toast.success('Deleted'); loadServers(); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed';
      toast.error(msg);
    }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Server Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">+ Add Server</button>
      </div>

      {showAdd && (
        <div className="surface-base border rounded-lg p-4 space-y-3 max-w-lg">
          <input type="text" placeholder="Server Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded p-2 text-sm" />
          <input type="text" placeholder="Host (IP)" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} className="w-full border rounded p-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Port" value={form.port} onChange={e => setForm({ ...form, port: parseInt(e.target.value) || 22 })} className="border rounded p-2 text-sm" />
            <input type="number" placeholder="Max Streams" value={form.maxStreams} onChange={e => setForm({ ...form, maxStreams: parseInt(e.target.value) || 10 })} className="border rounded p-2 text-sm" />
          </div>
          <input type="text" placeholder="Region (e.g. US-East)" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} className="w-full border rounded p-2 text-sm" />
          <button onClick={addServer} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Add Server</button>
        </div>
      )}

      {servers.length === 0 ? (
        <div className="surface-base border rounded-lg p-12 text-center text-tertiary">
          <p className="text-lg font-medium">No servers configured</p>
          <p className="text-sm mt-1">Add server nodes to enable load balancing across multiple machines</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map(s => (
            <div key={s.id} className="surface-base border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${s.isActive ? 'bg-green-500' : 'bg-[rgb(var(--border))]'}`} />
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-tertiary">{s.host}:{s.port} {s.region && `(${s.region})`}</p>
                  </div>
                </div>
                <button onClick={() => deleteServer(s.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
              </div>
              <div className="mt-3 flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-tertiary mb-1">
                    <span>{s.activeStreams} / {s.maxStreams} streams</span>
                    <span>{s.loadPercent}%</span>
                  </div>
                  <div className="w-full bg-[rgb(var(--bg-muted))] rounded-full h-2">
                    <div className={`h-2 rounded-full ${s.loadPercent > 80 ? 'bg-red-500' : s.loadPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${s.loadPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

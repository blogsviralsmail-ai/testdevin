import { useState, useEffect } from 'react';
import { healthAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function StreamHealthPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const res = await healthAPI.getSystem();
      setHealth(res.data);
    } catch {
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading health data...</div>;

  const system = (health?.system || {}) as Record<string, Record<string, number>>;
  const ffmpeg = (health?.ffmpeg || {}) as Record<string, unknown>;
  const network = (health?.network || {}) as Record<string, number>;
  const processes = (ffmpeg?.processes || []) as Record<string, unknown>[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Stream Health Dashboard</h1>
        <span className="text-sm text-tertiary">Auto-refreshes every 10s</span>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">CPU Load (1m)</p>
          <p className="text-2xl font-bold text-blue-800">{system?.cpu?.loadAvg1m || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Memory Used</p>
          <p className="text-2xl font-bold text-green-800">{system?.memory?.percent || 0}%</p>
          <p className="text-xs text-green-600">{system?.memory?.usedMB || 0}MB / {system?.memory?.totalMB || 0}MB</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Disk Used</p>
          <p className="text-2xl font-bold text-purple-800">{system?.disk?.percent || 0}%</p>
          <p className="text-xs text-purple-600">{system?.disk?.usedGB || 0}GB / {system?.disk?.totalGB || 0}GB</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Network TX</p>
          <p className="text-2xl font-bold text-orange-800">{network?.totalTxGB || 0} GB</p>
          <p className="text-xs text-orange-600">RX: {network?.totalRxGB || 0} GB</p>
        </div>
      </div>

      {/* FFmpeg Processes */}
      <div className="surface-base rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">FFmpeg Processes ({(ffmpeg?.count as number) || 0})</h2>
          <span className="text-sm text-tertiary">Total CPU: {(ffmpeg?.totalCpu as number) || 0}%</span>
        </div>
        {processes.length === 0 ? (
          <div className="p-8 text-center text-tertiary">No active FFmpeg processes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="surface-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-tertiary">PID</th>
                  <th className="px-4 py-3 text-center font-medium text-tertiary">CPU %</th>
                  <th className="px-4 py-3 text-center font-medium text-tertiary">Memory %</th>
                  <th className="px-4 py-3 text-center font-medium text-tertiary">RSS (MB)</th>
                  <th className="px-4 py-3 text-center font-medium text-tertiary">Stream Key</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {processes.map((p, i) => (
                  <tr key={i} className="hover:bg-[rgb(var(--bg-muted))]">
                    <td className="px-4 py-3 font-mono">{p.pid as number}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${(p.cpuPercent as number) > 80 ? 'text-red-600' : 'text-green-600'}`}>
                        {p.cpuPercent as number}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{p.memPercent as number}%</td>
                    <td className="px-4 py-3 text-center">{p.rssMB as number} MB</td>
                    <td className="px-4 py-3 text-center font-mono text-xs">{(p.streamKey as string) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load Average Chart */}
      <div className="surface-base rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Load Average</h2>
        <div className="flex items-end space-x-8 h-32">
          {[
            { label: '1 min', value: system?.cpu?.loadAvg1m || 0, color: 'bg-blue-500' },
            { label: '5 min', value: system?.cpu?.loadAvg5m || 0, color: 'bg-blue-400' },
            { label: '15 min', value: system?.cpu?.loadAvg15m || 0, color: 'bg-blue-300' },
          ].map((item, i) => {
            const maxLoad = 4;
            const height = Math.min((item.value / maxLoad) * 100, 100);
            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <span className="text-sm font-medium mb-1">{item.value}</span>
                <div className="w-full max-w-16 relative" style={{ height: '100px' }}>
                  <div className={`absolute bottom-0 w-full ${item.color} rounded-t`} style={{ height: `${height}%` }} />
                </div>
                <span className="text-xs text-tertiary mt-1">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

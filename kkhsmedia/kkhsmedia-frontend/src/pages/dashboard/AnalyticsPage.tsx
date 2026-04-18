import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface StreamStats {
  summary: {
    totalSlots: number;
    activeSlots: number;
    streamingNow: number;
    totalStreams: number;
    totalErrors: number;
    totalRestarts: number;
    totalHours: number;
  };
  dailyActivity: { date: string; count: number }[];
  slotStats: {
    slotId: string;
    slotName: string;
    platform: string;
    isStreaming: boolean;
    totalStarts: number;
    totalErrors: number;
    totalHours: number;
  }[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await analyticsAPI.getStreamStats();
      setStats(res.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading analytics...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary">Stream Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Slots', value: stats?.summary.totalSlots || 0, color: 'bg-blue-50 text-blue-700' },
          { label: 'Streaming Now', value: stats?.summary.streamingNow || 0, color: 'bg-green-50 text-green-700' },
          { label: 'Total Streams', value: stats?.summary.totalStreams || 0, color: 'bg-purple-50 text-purple-700' },
          { label: 'Total Hours', value: stats?.summary.totalHours || 0, color: 'bg-orange-50 text-orange-700' },
          { label: 'Active Slots', value: stats?.summary.activeSlots || 0, color: 'bg-teal-50 text-teal-700' },
          { label: 'Total Errors', value: stats?.summary.totalErrors || 0, color: 'bg-red-50 text-red-700' },
          { label: 'Auto Restarts', value: stats?.summary.totalRestarts || 0, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Uptime %', value: stats?.summary.totalStreams ? Math.round((1 - (stats.summary.totalErrors / stats.summary.totalStreams)) * 100) : 100, color: 'bg-indigo-50 text-indigo-700' },
        ].map((card, i) => (
          <div key={i} className={`rounded-lg p-4 ${card.color}`}>
            <p className="text-sm font-medium opacity-75">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Activity Chart */}
      {stats?.dailyActivity && stats.dailyActivity.length > 0 && (
        <div className="surface-base rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Daily Stream Activity (Last 30 Days)</h2>
          <div className="flex items-end space-x-1 h-40">
            {stats.dailyActivity.map((day, i) => {
              const max = Math.max(...stats.dailyActivity.map(d => d.count), 1);
              const height = (day.count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors min-h-[2px]"
                    style={{ height: `${height}%` }}
                  />
                  <div className="hidden group-hover:block absolute -top-8 bg-[rgb(var(--text))] text-[rgb(var(--bg-elevated))] text-xs px-2 py-1 rounded whitespace-nowrap">
                    {day.date}: {day.count} streams
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Slot Stats */}
      {stats?.slotStats && stats.slotStats.length > 0 && (
        <div className="surface-base rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Per-Slot Statistics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="surface-subtle">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-tertiary">Slot Name</th>
                  <th className="px-4 py-3 text-left font-medium text-tertiary">Platform</th>
                  <th className="px-4 py-3 text-center font-medium text-tertiary">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-tertiary">Total Starts</th>
                  <th className="px-4 py-3 text-center font-medium text-tertiary">Errors</th>
                  <th className="px-4 py-3 text-center font-medium text-tertiary">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.slotStats.map((slot, i) => (
                  <tr key={i} className="hover:bg-[rgb(var(--bg-muted))]">
                    <td className="px-4 py-3 font-medium">{slot.slotName || 'Unnamed'}</td>
                    <td className="px-4 py-3 capitalize">{slot.platform}</td>
                    <td className="px-4 py-3 text-center">
                      {slot.isStreaming ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">LIVE</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium surface-muted text-secondary">Offline</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{slot.totalStarts}</td>
                    <td className="px-4 py-3 text-center text-red-600">{slot.totalErrors}</td>
                    <td className="px-4 py-3 text-center">{slot.totalHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

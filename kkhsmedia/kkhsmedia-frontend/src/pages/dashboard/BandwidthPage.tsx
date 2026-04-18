import { useState, useEffect } from 'react';
import { billingAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function BandwidthPage() {
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [trial, setTrial] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [bwRes, trialRes] = await Promise.all([billingAPI.getBandwidth('30d'), billingAPI.getFreeTrial()]);
      setUsage(bwRes.data);
      setTrial(trialRes.data);
    } catch { /* ok */ }
    finally { setLoading(false); }
  };

  const activateTrial = async () => {
    try {
      await billingAPI.activateFreeTrial();
      toast.success('Free trial activated!');
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed';
      toast.error(msg);
    }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  const daily = (usage?.daily || []) as { date: string; gb: number; hours: number }[];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary">Bandwidth & Usage</h1>

      {/* Usage Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Data Used</p>
          <p className="text-2xl font-bold text-blue-800">{(usage?.totalGB as number) || 0} GB</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Streaming Hours</p>
          <p className="text-2xl font-bold text-green-800">{(usage?.totalHours as number) || 0}h</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Limit</p>
          <p className="text-2xl font-bold text-purple-800">{(usage?.limitGB as number) || 500} GB</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Usage</p>
          <p className="text-2xl font-bold text-orange-800">{(usage?.usagePercent as number) || 0}%</p>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="surface-base border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary">Bandwidth Usage</span>
          <span className="text-sm text-tertiary">{(usage?.totalGB as number) || 0} / {(usage?.limitGB as number) || 500} GB</span>
        </div>
        <div className="w-full bg-[rgb(var(--bg-muted))] rounded-full h-3">
          <div
            className={`h-3 rounded-full ${((usage?.usagePercent as number) || 0) > 80 ? 'bg-red-500' : ((usage?.usagePercent as number) || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min((usage?.usagePercent as number) || 0, 100)}%` }}
          />
        </div>
      </div>

      {/* Daily Chart */}
      {daily.length > 0 && (
        <div className="surface-base border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Daily Usage (Last 30 Days)</h2>
          <div className="flex items-end space-x-1 h-32">
            {daily.map((d, i) => {
              const max = Math.max(...daily.map(x => x.gb), 0.1);
              const height = (d.gb / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors min-h-[2px]" style={{ height: `${height}%` }} />
                  <div className="hidden group-hover:block absolute -top-10 bg-[rgb(var(--text))] text-[rgb(var(--bg-elevated))] text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date}: {d.gb}GB, {d.hours}h
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Free Trial */}
      <div className="surface-base border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Free Trial</h2>
        {trial?.eligible ? (
          <div className="space-y-3">
            <p className="text-sm text-secondary">You are eligible for a 7-day free trial! Try our streaming service at no cost.</p>
            <button onClick={activateTrial} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm">Activate Free Trial</button>
          </div>
        ) : trial?.active ? (
          <div>
            <p className="text-sm text-green-600 font-medium">Free trial is active!</p>
            <p className="text-sm text-tertiary mt-1">Expires: {trial.expiresAt ? new Date(trial.expiresAt as string).toLocaleDateString() : 'N/A'}</p>
            <p className="text-sm text-tertiary">Days left: {(trial.daysLeft as number) || 0}</p>
          </div>
        ) : (
          <p className="text-sm text-tertiary">Free trial not available (already used or paid user)</p>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { slotsAPI, videosAPI } from '../../services/api';
import { Radio, Video, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { settings } = useAuth();
  const [stats, setStats] = useState({ active: 0, expired: 0, inactive: 0, videos: 0 });
  const primary = settings?.primaryColor || '#6366f1';

  useEffect(() => {
    const load = async () => {
      try {
        const [slotsRes, videosRes] = await Promise.all([slotsAPI.getAll(), videosAPI.getAll()]);
        const slots = slotsRes.data;
        setStats({
          active: slots.filter((s: Record<string, string>) => s.status === 'active').length,
          expired: slots.filter((s: Record<string, string>) => s.status === 'expired').length,
          inactive: slots.filter((s: Record<string, string>) => s.status === 'inactive').length,
          videos: videosRes.data.length,
        });
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const cards = [
    { label: 'Active Slots', value: stats.active, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Expired Slots', value: stats.expired, icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Inactive Slots', value: stats.inactive, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Total Videos', value: stats.videos, icon: Video, color: primary, bg: primary + '10' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/live-slots" className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primary + '15' }}>
            <Radio size={24} style={{ color: primary }} />
          </div>
          <div>
            <h3 className="font-semibold">Manage Live Slots</h3>
            <p className="text-sm text-gray-500">Start/stop streams, add new slots</p>
          </div>
        </Link>
        <Link to="/videos" className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primary + '15' }}>
            <Video size={24} style={{ color: primary }} />
          </div>
          <div>
            <h3 className="font-semibold">Manage Videos</h3>
            <p className="text-sm text-gray-500">Upload, rename, delete videos</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

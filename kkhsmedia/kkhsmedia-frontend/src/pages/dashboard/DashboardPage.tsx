import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { slotsAPI, videosAPI } from '../../services/api';
import { Radio, Video, CheckCircle, XCircle, Clock, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, expired: 0, inactive: 0, videos: 0 });
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: 'Active Slots', value: stats.active, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Expired Slots', value: stats.expired, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Inactive Slots', value: stats.inactive, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Total Videos', value: stats.videos, icon: Video, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-primary">Dashboard</h1>
        <p className="text-xs text-tertiary mt-0.5">Welcome back, {user?.firstName || 'User'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {cards.map((card, i) => (
          <motion.div key={i}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="metric-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
            </div>
            {loading ? (
              <div className="skeleton h-8 w-12 mb-1" />
            ) : (
              <div className="text-2xl font-bold text-primary tracking-tight">{card.value}</div>
            )}
            <div className="text-[11px] text-tertiary mt-0.5">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <Link to="/live-slots" className="card-premium p-4 flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Radio size={16} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-primary">Live Slots</h3>
              <p className="text-[11px] text-tertiary">Manage your streaming slots</p>
            </div>
            <ArrowRight size={14} className="text-tertiary group-hover:text-primary transition-colors" />
          </Link>
          <Link to="/videos" className="card-premium p-4 flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Video size={16} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-primary">Videos</h3>
              <p className="text-[11px] text-tertiary">Upload and manage videos</p>
            </div>
            <ArrowRight size={14} className="text-tertiary group-hover:text-primary transition-colors" />
          </Link>
          <Link to="/stream-health" className="card-premium p-4 flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Activity size={16} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-primary">Stream Health</h3>
              <p className="text-[11px] text-tertiary">Monitor stream performance</p>
            </div>
            <ArrowRight size={14} className="text-tertiary group-hover:text-primary transition-colors" />
          </Link>
          <Link to="/analytics" className="card-premium p-4 flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Activity size={16} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-primary">Analytics</h3>
              <p className="text-[11px] text-tertiary">View streaming analytics</p>
            </div>
            <ArrowRight size={14} className="text-tertiary group-hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}

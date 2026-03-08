import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { Bell, Check, CheckCheck } from 'lucide-react';

export default function Notifications() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try { const d = await notificationAPI.list(); setData(d); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try { await notificationAPI.markAllRead(); loadNotifications(); }
    catch (err) { console.error(err); }
  };

  const markRead = async (id: number) => {
    try { await notificationAPI.markRead(id); loadNotifications(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell size={22} className="text-emerald-400" /> Notifications
            {data?.unread_count > 0 && (
              <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold shadow-lg shadow-red-500/30">{data.unread_count}</span>
            )}
          </h1>
          {data?.unread_count > 0 && (
            <button onClick={markAllRead} className="px-4 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl text-sm font-medium flex items-center gap-1.5 transition">
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div></div>
        ) : !data?.notifications?.length ? (
          <div className="text-center py-16 glass rounded-2xl">
            <Bell size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.notifications.map((n: any) => (
              <div key={n.id}
                className={`glass rounded-xl p-4 flex items-start gap-3 transition hover:bg-white/10 ${!n.is_read ? 'border-l-4 border-l-emerald-500' : ''}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  n.type === 'booking' ? 'bg-cyan-500/10 text-cyan-400' :
                  n.type === 'payment' ? 'bg-emerald-500/10 text-emerald-400' :
                  n.type === 'support' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-white/5 text-slate-400'
                }`}><Bell size={16} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm ${!n.is_read ? 'font-bold text-white' : 'font-medium text-slate-400'}`}>{n.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition" title="Mark as read">
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

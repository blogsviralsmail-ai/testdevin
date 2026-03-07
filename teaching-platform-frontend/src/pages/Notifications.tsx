import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { Bell, Check, CheckCheck } from 'lucide-react';

export default function Notifications() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const d = await notificationAPI.list();
      setData(d);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      loadNotifications();
    } catch (err) { console.error(err); }
  };

  const markRead = async (id: number) => {
    try {
      await notificationAPI.markRead(id);
      loadNotifications();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell size={24} /> Notifications
            {data?.unread_count > 0 && (
              <span className="bg-red-500 text-white text-sm px-2.5 py-0.5 rounded-full">{data.unread_count}</span>
            )}
          </h1>
          {data?.unread_count > 0 && (
            <button onClick={markAllRead} className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-medium flex items-center gap-1 transition">
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : !data?.notifications?.length ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.notifications.map((n: any) => (
              <div key={n.id}
                className={`bg-white rounded-xl shadow-sm p-4 flex items-start gap-3 transition ${!n.is_read ? 'border-l-4 border-indigo-500' : ''}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  n.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                  n.type === 'payment' ? 'bg-green-100 text-green-600' :
                  n.type === 'support' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Bell size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm ${!n.is_read ? 'font-bold text-gray-800' : 'font-medium text-gray-600'}`}>{n.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400" title="Mark as read">
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

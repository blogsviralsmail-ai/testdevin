import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../services/api';

export default function EventNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/marketing/event-notifications').then((r: any) => setNotifications(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-yellow-600" /> Event Notifications
          </h1>
          <p className="text-gray-500 text-sm mt-1">Set up automated WhatsApp notifications for events and triggers</p>
        </div>
        <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-700">
          <Plus size={16} /> Add Notification
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No Event Notifications</h3>
            <p className="text-gray-400 mt-2">Create event-triggered notifications to automate customer communication</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any) => (
              <div key={n.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{n.name}</h3>
                  <p className="text-sm text-gray-500">Trigger: {n.event_type}</p>
                </div>
                <div className="flex items-center gap-3">
                  {n.is_active ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-400" />}
                  <button className="text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

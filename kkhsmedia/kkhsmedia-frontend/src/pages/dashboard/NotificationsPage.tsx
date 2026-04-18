import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifRes, settingsRes] = await Promise.all([
        notificationsAPI.getHistory(),
        notificationsAPI.getSettings(),
      ]);
      setNotifications(notifRes.data.notifications || []);
      setSettings(settingsRes.data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await notificationsAPI.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  const saveSettings = async () => {
    try {
      await notificationsAPI.updateSettings(settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  if (loading) return <div className="p-6 text-tertiary">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('inbox')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'inbox' ? 'bg-blue-600 text-white' : 'surface-muted text-secondary'}`}>Inbox</button>
          <button onClick={() => setTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'settings' ? 'bg-blue-600 text-white' : 'surface-muted text-secondary'}`}>Settings</button>
        </div>
      </div>

      {tab === 'inbox' && (
        <div className="surface-base rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="text-sm text-tertiary">{notifications.length} notifications</p>
            <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">Mark all read</button>
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-tertiary">No notifications yet</div>
          ) : (
            <div className="divide-y">
              {notifications.map((n: any) => (
                <div key={n.id} className={`p-4 hover:bg-[rgb(var(--bg-muted))] cursor-pointer ${!n.read ? 'bg-blue-50' : ''}`} onClick={() => markRead(n.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-medium ${!n.read ? 'text-primary' : 'text-secondary'}`}>{n.title}</p>
                      <p className="text-sm text-tertiary mt-1">{n.message}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-tertiary mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="surface-base rounded-lg border p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={settings.emailNotifications ?? true} onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })} className="w-4 h-4 rounded" />
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-tertiary">Receive notifications via email</p>
                </div>
              </label>

              <div className="border-t pt-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={settings.telegramEnabled ?? false} onChange={e => setSettings({ ...settings, telegramEnabled: e.target.checked })} className="w-4 h-4 rounded" />
                  <div>
                    <p className="font-medium text-sm">Telegram Notifications</p>
                    <p className="text-xs text-tertiary">Receive notifications via Telegram bot</p>
                  </div>
                </label>
                {settings.telegramEnabled && (
                  <input type="text" value={settings.telegramChatId || ''} onChange={e => setSettings({ ...settings, telegramChatId: e.target.value })} placeholder="Telegram Chat ID" className="mt-2 ml-7 px-3 py-2 border rounded-lg text-sm w-64" />
                )}
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={settings.whatsappEnabled ?? false} onChange={e => setSettings({ ...settings, whatsappEnabled: e.target.checked })} className="w-4 h-4 rounded" />
                  <div>
                    <p className="font-medium text-sm">WhatsApp Notifications</p>
                    <p className="text-xs text-tertiary">Receive notifications via WhatsApp</p>
                  </div>
                </label>
                {settings.whatsappEnabled && (
                  <input type="text" value={settings.whatsappNumber || ''} onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })} placeholder="WhatsApp Number (with country code)" className="mt-2 ml-7 px-3 py-2 border rounded-lg text-sm w-64" />
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Notification Events</h3>
            <div className="space-y-3">
              {[
                { key: 'streamStartNotify', label: 'Stream Started', desc: 'When a stream goes live' },
                { key: 'streamStopNotify', label: 'Stream Stopped', desc: 'When a stream stops' },
                { key: 'streamErrorNotify', label: 'Stream Error', desc: 'When a stream encounters an error' },
                { key: 'paymentNotify', label: 'Payment', desc: 'Payment confirmation and receipts' },
                { key: 'expiryNotify', label: 'Slot Expiry', desc: 'When a slot is about to expire' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3">
                  <input type="checkbox" checked={settings[item.key] ?? true} onChange={e => setSettings({ ...settings, [item.key]: e.target.checked })} className="w-4 h-4 rounded" />
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-tertiary">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button onClick={saveSettings} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Save Settings</button>
        </div>
      )}
    </div>
  );
}

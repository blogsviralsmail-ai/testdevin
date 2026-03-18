import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({
    booking_confirm: { sms: true, email: true, whatsapp: true, push: true },
    booking_reminder: { sms: true, email: true, whatsapp: true, push: true },
    booking_cancel: { sms: true, email: true, whatsapp: true, push: true },
    payment_received: { sms: true, email: true, whatsapp: true, push: true },
    offers_promos: { sms: true, email: true, whatsapp: true, push: true },
    wallet_update: { sms: true, email: true, whatsapp: true, push: true },
  });

  if (!localStorage.getItem('token')) { navigate('/login'); return null; }

  const togglePref = (category: string, channel: string) => {
    setPrefs(p => ({
      ...p,
      [category]: { ...(p as Record<string, Record<string, boolean>>)[category], [channel]: !(p as Record<string, Record<string, boolean>>)[category][channel] }
    }));
  };

  const categories = [
    { key: 'booking_confirm', label: 'Booking Confirmation', desc: 'When your booking is confirmed' },
    { key: 'booking_reminder', label: 'Booking Reminder', desc: '1 hour before your slot' },
    { key: 'booking_cancel', label: 'Cancellation Alerts', desc: 'When booking is cancelled' },
    { key: 'payment_received', label: 'Payment Updates', desc: 'Payment confirmations & refunds' },
    { key: 'offers_promos', label: 'Offers & Promotions', desc: 'Deals and promo codes' },
    { key: 'wallet_update', label: 'Wallet Updates', desc: 'Money added/withdrawn from wallet' },
  ];

  const channels = [
    { key: 'sms', label: 'SMS', icon: Smartphone },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { key: 'push', label: 'Push', icon: Bell },
  ];

  const handleSave = () => {
    alert('Notification preferences saved!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell size={28} className="text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Notification Preferences</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left font-medium text-gray-600">Notification Type</th>
                {channels.map(ch => (
                  <th key={ch.key} className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <ch.icon size={16} className="text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">{ch.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.key} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-800">{cat.label}</p>
                    <p className="text-xs text-gray-500">{cat.desc}</p>
                  </td>
                  {channels.map(ch => (
                    <td key={ch.key} className="p-4 text-center">
                      <button
                        onClick={() => togglePref(cat.key, ch.key)}
                        className={`w-10 h-6 rounded-full transition relative ${(prefs as Record<string, Record<string, boolean>>)[cat.key][ch.key] ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${(prefs as Record<string, Record<string, boolean>>)[cat.key][ch.key] ? 'left-5' : 'left-1'}`} />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={handleSave} className="mt-6 w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700">Save Preferences</button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Rocket, Plus, Trash2, Play, Pause } from 'lucide-react';
import api from '../../services/api';

interface PresetCampaign {
  id: number;
  name: string;
  preset_message_id: number;
  contact_group_id: number;
  status: string;
  scheduled_at: string;
  sent_count: number;
  created_at: string;
}

export default function PresetCampaignsPage() {
  const [campaigns, setCampaigns] = useState<PresetCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/preset-campaigns').then((r: any) => {
      setCampaigns(r.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Rocket className="text-green-600" /> Preset Campaigns
          </h1>
          <p className="text-gray-500 text-sm mt-1">Send campaigns using preset templates without using WhatsApp API credits</p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Plus size={16} /> Create Campaign
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No preset campaigns yet. Create your first one!</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Sent</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Scheduled</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{c.sent_count}</td>
                  <td className="p-4 text-gray-500 text-sm">{c.scheduled_at || '-'}</td>
                  <td className="p-4 flex gap-2">
                    <button className="text-blue-500 hover:text-blue-700"><Play size={16} /></button>
                    <button className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

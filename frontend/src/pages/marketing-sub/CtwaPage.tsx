import { useState, useEffect } from 'react';
import { MousePointerClick, Plus, ExternalLink } from 'lucide-react';
import api from '../../services/api';

export default function CtwaPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/marketing/ctwa').then((r: any) => setAds(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MousePointerClick className="text-blue-600" /> Click To WhatsApp Ads
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your CTWA (Click-to-WhatsApp) ad campaigns from Facebook/Instagram</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={16} /> Create CTWA Ad
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12">
            <MousePointerClick size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No CTWA Ads Yet</h3>
            <p className="text-gray-400 mt-2">Create Click-to-WhatsApp ads to drive conversations from Facebook and Instagram</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {ads.map((ad: any) => (
              <div key={ad.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{ad.name}</h3>
                  <p className="text-sm text-gray-500">{ad.status}</p>
                </div>
                <button className="text-blue-500"><ExternalLink size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

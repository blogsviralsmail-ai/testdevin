import { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import api from '../../services/api';

export default function LicencePage() {
  const [licence, setLicence] = useState({
    licence_key: '',
    status: 'inactive',
    registered_domain: '',
    expires_at: '',
    product_name: 'WabaPanel',
    version: '2.0.0',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/licence').then((r: any) => {
      if (r.data?.data) setLicence({ ...licence, ...r.data.data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="text-yellow-600" /> Licence Information
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your WabaPanel licence and activation</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className={`p-4 rounded-lg flex items-center gap-3 ${licence.status === 'active' ? 'bg-green-50' : 'bg-yellow-50'}`}>
          {licence.status === 'active' ? (
            <CheckCircle className="text-green-600" size={24} />
          ) : (
            <AlertTriangle className="text-yellow-600" size={24} />
          )}
          <div>
            <h3 className={`font-medium ${licence.status === 'active' ? 'text-green-800' : 'text-yellow-800'}`}>
              Licence {licence.status === 'active' ? 'Active' : 'Not Activated'}
            </h3>
            <p className={`text-sm ${licence.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
              {licence.status === 'active' ? `Valid until ${licence.expires_at || 'lifetime'}` : 'Enter your licence key to activate'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <input type="text" value={licence.product_name} readOnly className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
            <input type="text" value={licence.version} readOnly className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registered Domain</label>
            <input type="text" value={licence.registered_domain || window.location.hostname} readOnly className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <input type="text" value={licence.status} readOnly className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-50 capitalize" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Licence Key</label>
          <input
            type="text"
            value={licence.licence_key}
            onChange={e => setLicence({ ...licence, licence_key: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 text-sm font-mono"
            placeholder="Enter your licence key"
          />
        </div>

        <button className="bg-yellow-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-700">
          <Save size={16} /> Activate Licence
        </button>
      </div>
    </div>
  );
}

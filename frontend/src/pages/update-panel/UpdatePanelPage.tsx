import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Download, Server } from 'lucide-react';
import api from '../../services/api';

export default function UpdatePanelPage() {
  const [updateInfo, setUpdateInfo] = useState({
    current_version: '2.0.0',
    latest_version: '2.0.0',
    update_available: false,
    last_checked: '',
    changelog: [] as string[],
  });
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/update-panel').then((r: any) => {
      if (r.data?.data) setUpdateInfo({ ...updateInfo, ...r.data.data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const checkForUpdates = () => {
    setChecking(true);
    api.post('/update-panel/check').then((r: any) => {
      if (r.data?.data) setUpdateInfo({ ...updateInfo, ...r.data.data });
    }).catch(() => {}).finally(() => setChecking(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw className="text-purple-600" /> Update Panel
        </h1>
        <p className="text-gray-500 text-sm mt-1">Check and install WabaPanel updates</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Server size={18} />
                  <span className="text-sm font-medium">Current Version</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">v{updateInfo.current_version}</span>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <Download size={18} />
                  <span className="text-sm font-medium">Latest Version</span>
                </div>
                <span className="text-2xl font-bold text-green-900">v{updateInfo.latest_version}</span>
              </div>
              <div className={`rounded-lg p-4 ${updateInfo.update_available ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {updateInfo.update_available ? (
                    <AlertTriangle size={18} className="text-yellow-600" />
                  ) : (
                    <CheckCircle size={18} className="text-green-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700">Status</span>
                </div>
                <span className={`text-lg font-bold ${updateInfo.update_available ? 'text-yellow-700' : 'text-green-700'}`}>
                  {updateInfo.update_available ? 'Update Available' : 'Up to Date'}
                </span>
              </div>
            </div>

            {updateInfo.last_checked && (
              <p className="text-sm text-gray-500">Last checked: {updateInfo.last_checked}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={checkForUpdates}
                disabled={checking}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
              >
                <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
                {checking ? 'Checking...' : 'Check for Updates'}
              </button>
              {updateInfo.update_available && (
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
                  <Download size={16} /> Install Update
                </button>
              )}
            </div>

            {updateInfo.changelog.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-3">Changelog</h3>
                <ul className="space-y-2">
                  {updateInfo.changelog.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Table2, Plus, Trash2, Copy, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function GoogleSheetsPage() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/integrations/google-sheets').then((r: any) => setScripts(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Table2 className="text-green-600" /> Google Sheets Integration
          </h1>
          <p className="text-gray-500 text-sm mt-1">Connect Google Sheets to sync contacts and send messages via Apps Script</p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Plus size={16} /> Add Script
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-medium mb-3">How it works</h3>
        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2 mb-6">
          <li>Create a Google Apps Script from the template below</li>
          <li>Add your API key and sheet ID</li>
          <li>Set up triggers (time-based or on-edit)</li>
          <li>Contacts from your sheet will sync automatically</li>
        </ol>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Apps Script Template</span>
            <button className="text-blue-500 text-sm flex items-center gap-1"><Copy size={14} /> Copy</button>
          </div>
          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap font-mono">
{`function syncContacts() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var apiUrl = 'YOUR_API_URL/api/contacts/import';
  var apiKey = 'YOUR_API_KEY';
  
  var contacts = [];
  for (var i = 1; i < data.length; i++) {
    contacts.push({
      first_name: data[i][0],
      last_name: data[i][1],
      phone: data[i][2],
      email: data[i][3]
    });
  }
  
  UrlFetchApp.fetch(apiUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: JSON.stringify({ contacts: contacts })
  });
}`}
          </pre>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-6 text-gray-400">No Google Sheet integrations configured yet</div>
        ) : (
          <div className="space-y-3">
            {scripts.map((s: any) => (
              <div key={s.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{s.name}</h4>
                  <p className="text-sm text-gray-500">Last synced: {s.last_synced_at || 'Never'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-500"><RefreshCw size={16} /></button>
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

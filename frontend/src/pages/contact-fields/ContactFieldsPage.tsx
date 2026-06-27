import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';

const FIELD_TYPES = ['text', 'number', 'date', 'email', 'phone', 'url', 'select', 'textarea'];

export default function ContactFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/contact-custom-fields').then((r: any) => setFields(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-violet-600" /> Custom Attributes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Define custom fields to store additional contact information</p>
        </div>
        <button className="bg-violet-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-violet-700">
          <Plus size={16} /> Add Field
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : fields.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p>No custom attributes defined yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Field Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Required</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.id || f._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{f.name || f.input_name}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">{f.input_type || f.type}</span>
                  </td>
                  <td className="p-4">{f.is_required ? 'Yes' : 'No'}</td>
                  <td className="p-4 flex gap-2">
                    <button className="text-blue-500"><Edit size={16} /></button>
                    <button className="text-red-500"><Trash2 size={16} /></button>
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

import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Eye } from 'lucide-react';
import api from '../../services/api';

export default function LeadFormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/marketing/lead-forms').then((r: any) => setForms(r.data?.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-purple-600" /> Lead Generation Forms
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage lead capture forms integrated with WhatsApp</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700">
          <Plus size={16} /> Create Form
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No Lead Forms Yet</h3>
            <p className="text-gray-400 mt-2">Create lead generation forms to capture customer information via WhatsApp</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {forms.map((form: any) => (
              <div key={form.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{form.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{form.submissions_count || 0} submissions</p>
                <div className="flex gap-2 mt-3">
                  <button className="text-blue-500 text-sm flex items-center gap-1"><Eye size={14} /> View</button>
                  <button className="text-red-500 text-sm flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

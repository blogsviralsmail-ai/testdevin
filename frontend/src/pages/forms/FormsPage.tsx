import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileInput, Plus, Search, Edit, Trash2, Eye, X, Copy, ExternalLink, ClipboardList } from 'lucide-react';

interface Form { id: number; uid: string; title: string; description: string; fields: string; confirmation_message: string; status: number; created_at: string; }
interface FormResponse { id: number; response_data: string; created_at: string; }

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState<Form | null>(null);
  const [viewResponses, setViewResponses] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [formData, setFormData] = useState({ title: '', description: '', confirmationMessage: 'Thank you for your response!' });
  const [fields, setFields] = useState<{ label: string; type: string; required: boolean }[]>([{ label: '', type: 'text', required: false }]);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/forms');
      const d = data.data || data;
      setForms(d.items || d.data || d || []);
    } catch { toast.error('Failed to load forms'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, fields: JSON.stringify(fields.filter(f => f.label)) };
      if (editForm) {
        await api.put(`/forms/${editForm.id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/forms', payload);
        toast.success('Created');
      }
      setShowCreate(false); setEditForm(null); fetchForms();
      setFormData({ title: '', description: '', confirmationMessage: 'Thank you for your response!' });
      setFields([{ label: '', type: 'text', required: false }]);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this form?')) return;
    try { await api.delete(`/forms/${id}`); toast.success('Deleted'); fetchForms(); }
    catch { toast.error('Failed'); }
  };

  const loadResponses = async (form: Form) => {
    setViewResponses(form);
    try {
      const { data } = await api.get(`/forms/${form.id}/responses`);
      const d = data.data || data;
      setResponses(d.items || d.data || d || []);
    } catch { /* ignore */ }
  };

  const addField = () => setFields([...fields, { label: '', type: 'text', required: false }]);
  const removeField = (idx: number) => setFields(fields.filter((_, i) => i !== idx));
  const updateField = (idx: number, key: string, value: string | boolean) => {
    const updated = [...fields];
    (updated[idx] as Record<string, string | boolean>)[key] = value;
    setFields(updated);
  };

  const fieldTypes = ['text', 'number', 'email', 'phone', 'date', 'time', 'select', 'radio', 'checkbox', 'textarea', 'file'];

  const copyPublicUrl = (form: Form) => {
    navigator.clipboard.writeText(`${window.location.origin}/public/form/${form.uid}`);
    toast.success('Link copied!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold dark:text-white">WhatsApp Forms</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create custom forms and collect responses</p></div>
        <button onClick={() => { setShowCreate(true); setEditForm(null); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Create Form</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
      ) : forms.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center"><FileInput size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">No forms yet. Create your first form!</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map(form => {
            let fieldCount = 0;
            try { fieldCount = JSON.parse(form.fields || '[]').length; } catch { /* ignore */ }
            return (
              <div key={form.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold dark:text-white">{form.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${form.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{form.status === 1 ? 'Active' : 'Draft'}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{form.description || 'No description'}</p>
                <p className="text-xs text-gray-400 mb-4">{fieldCount} fields</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => loadResponses(form)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100"><ClipboardList size={14} /> Responses</button>
                  <button onClick={() => copyPublicUrl(form)} className="p-1.5 text-gray-400 hover:text-emerald-500" title="Copy link"><Copy size={16} /></button>
                  <button onClick={() => { setEditForm(form); setShowCreate(true); setFormData({ title: form.title, description: form.description || '', confirmationMessage: form.confirmation_message || '' }); try { setFields(JSON.parse(form.fields || '[]')); } catch { setFields([]); } }} className="p-1.5 text-gray-400 hover:text-emerald-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(form.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">{editForm ? 'Edit' : 'Create'} Form</h3><button onClick={() => { setShowCreate(false); setEditForm(null); }}><X size={20} className="text-gray-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Form Title *</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>

              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium dark:text-gray-300">Form Fields</label><button type="button" onClick={addField} className="text-xs text-emerald-500 hover:text-emerald-600">+ Add Field</button></div>
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                      <input value={field.label} onChange={e => updateField(idx, 'label', e.target.value)} placeholder="Field label" className="flex-1 px-2 py-1.5 border dark:border-slate-600 rounded text-sm dark:bg-slate-800 dark:text-white" />
                      <select value={field.type} onChange={e => updateField(idx, 'type', e.target.value)} className="px-2 py-1.5 border dark:border-slate-600 rounded text-sm dark:bg-slate-800 dark:text-white">
                        {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs dark:text-gray-300"><input type="checkbox" checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} /> Req</label>
                      {fields.length > 1 && <button type="button" onClick={() => removeField(idx)} className="text-red-400 hover:text-red-500"><X size={16} /></button>}
                    </div>
                  ))}
                </div>
              </div>

              <div><label className="block text-sm font-medium dark:text-gray-300 mb-1">Confirmation Message</label><input value={formData.confirmationMessage} onChange={e => setFormData({...formData, confirmationMessage: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">{editForm ? 'Update' : 'Create'} Form</button>
                <button type="button" onClick={() => { setShowCreate(false); setEditForm(null); }} className="px-4 py-2 border dark:border-slate-600 rounded-lg text-sm dark:text-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Responses */}
      {viewResponses && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Responses - {viewResponses.title}</h3><button onClick={() => setViewResponses(null)}><X size={20} className="text-gray-400" /></button></div>
            {responses.length === 0 ? (
              <p className="text-center py-8 text-gray-400">No responses yet</p>
            ) : (
              <div className="space-y-3">
                {responses.map(r => {
                  let data: Record<string, string> = {};
                  try { data = JSON.parse(r.response_data || '{}'); } catch { /* ignore */ }
                  return (
                    <div key={r.id} className="border dark:border-slate-700 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-2">{new Date(r.created_at).toLocaleString()}</p>
                      {Object.entries(data).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1"><span className="text-sm text-gray-500">{key}</span><span className="text-sm dark:text-white">{val}</span></div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

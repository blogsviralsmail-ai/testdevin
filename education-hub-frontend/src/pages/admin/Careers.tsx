import { useState, useEffect } from "react";
import { Briefcase, Plus, Pencil, Trash2, X, Users, GripVertical, PlusCircle, Eye } from "lucide-react";
import api from "../../lib/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CareersAdmin() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", department: "", location: "", type: "Full-time", experience: "", salary_range: "", description: "", requirements: "", status: "active" });
  const [formFields, setFormFields] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [showApps, setShowApps] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const load = () => { api.get("/api/careers").then(r => setJobs(r.data || [])).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title) return;
    const payload = { ...form, form_fields: formFields };
    if (editing) { await api.put(`/api/careers/${editing.id}`, payload); }
    else { await api.post("/api/careers", payload); }
    setShowForm(false); setEditing(null); setForm({ title: "", department: "", location: "", type: "Full-time", experience: "", salary_range: "", description: "", requirements: "", status: "active" }); setFormFields([]); load();
  };

  const del = async (id: number) => { if (confirm("Delete?")) { await api.delete(`/api/careers/${id}`); load(); } };
  const edit = async (j: any) => {
    setForm({ title: j.title, department: j.department || "", location: j.location || "", type: j.type, experience: j.experience || "", salary_range: j.salary_range || "", description: j.description || "", requirements: j.requirements || "", status: j.status });
    try { const r = await api.get(`/api/careers/${j.id}`); setFormFields(r.data?.form_fields || []); } catch { setFormFields([]); }
    setEditing(j); setShowForm(true);
  };
  const viewApps = async (jid: number) => { const r = await api.get(`/api/careers/${jid}/applications`); setApps(r.data || []); setShowApps(true); };
  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const bulkDelete = async () => { if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} jobs?`)) return; await api.delete("/api/careers/bulk", { data: { ids: selectedIds } }); setSelectedIds([]); load(); };
  const addFormField = () => setFormFields(prev => [...prev, { field_name: "", field_label: "", field_type: "text", is_required: 1, placeholder: "", options: "" }]);
  const updateFormField = (idx: number, key: string, val: any) => setFormFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: val } : f));
  const removeFormField = (idx: number) => setFormFields(prev => prev.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Briefcase className="h-7 w-7 text-teal-600" /> Careers ({jobs.length})</h1>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.length > 0 && <button onClick={bulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete ({selectedIds.length})</button>}
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", department: "", location: "", type: "Full-time", experience: "", salary_range: "", description: "", requirements: "", status: "active" }); setFormFields([]); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"><Plus className="h-4 w-4" /> Add Job</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? "Edit Job" : "Add Job"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Job Title *" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Department" className="px-3 py-2 border rounded-lg text-sm" />
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Location" className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                </select>
                <input value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="Experience (e.g. 2-5 yrs)" className="px-3 py-2 border rounded-lg text-sm" />
                <input value={form.salary_range} onChange={e => setForm({ ...form, salary_range: e.target.value })} placeholder="Salary Range" className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Job Description" rows={4} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder="Requirements (one per line)" rows={4} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="active">Active</option><option value="closed">Closed</option><option value="draft">Draft</option>
              </select>
              {/* Custom Application Form Fields */}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Custom Application Form Fields</h3>
                  <button type="button" onClick={addFormField} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800"><PlusCircle className="h-3.5 w-3.5" /> Add Field</button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Name, Email, Phone are default fields. Add custom fields below:</p>
                {formFields.map((ff, idx) => (
                  <div key={idx} className="flex gap-2 items-start mb-2 p-2 bg-gray-50 rounded-lg">
                    <GripVertical className="h-4 w-4 text-gray-400 mt-2 flex-shrink-0" />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input value={ff.field_label} onChange={e => updateFormField(idx, "field_label", e.target.value)} placeholder="Field Label" className="px-2 py-1.5 border rounded text-xs" />
                      <select value={ff.field_type} onChange={e => updateFormField(idx, "field_type", e.target.value)} className="px-2 py-1.5 border rounded text-xs">
                        <option value="text">Text</option><option value="email">Email</option><option value="number">Number</option><option value="textarea">Textarea</option><option value="select">Dropdown</option><option value="file">File Upload</option>
                      </select>
                      {ff.field_type === "select" && <input value={ff.options || ""} onChange={e => updateFormField(idx, "options", e.target.value)} placeholder="Options (comma separated)" className="col-span-2 px-2 py-1.5 border rounded text-xs" />}
                      <input value={ff.placeholder || ""} onChange={e => updateFormField(idx, "placeholder", e.target.value)} placeholder="Placeholder text" className="px-2 py-1.5 border rounded text-xs" />
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={ff.is_required === 1} onChange={e => updateFormField(idx, "is_required", e.target.checked ? 1 : 0)} /> Required</label>
                    </div>
                    <button onClick={() => removeFormField(idx)} className="text-red-500 hover:text-red-700 mt-1"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <button onClick={save} className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">{editing ? "Update" : "Post Job"}</button>
            </div>
          </div>
        </div>
      )}

      {showApps && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Applications ({apps.length})</h2>
              <button onClick={() => setShowApps(false)}><X className="h-5 w-5" /></button>
            </div>
            {apps.length === 0 ? <p className="text-gray-500 text-center py-4">No applications yet</p> : (
              <div className="space-y-3">
                {apps.map(a => (
                  <div key={a.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{a.name}</div>
                      {a.resume_url && (
                        <a href={a.resume_url.startsWith("/") ? API + a.resume_url : a.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                          <Eye className="h-3 w-3" /> Resume
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{a.email} | {a.phone}</div>
                    {a.cover_letter && <p className="text-xs text-gray-600 mt-1">{a.cover_letter}</p>}
                    {a.form_data && (() => { try { const fd = JSON.parse(a.form_data); return <div className="mt-1 text-xs text-gray-500">{Object.entries(fd).map(([k,v]) => <span key={k} className="mr-2"><b>{k}:</b> {String(v)}</span>)}</div>; } catch { return null; } })()}
                    <div className="text-xs text-gray-400 mt-1">{a.created_at ? new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map(j => (
          <div key={j.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={selectedIds.includes(j.id)} onChange={() => toggleSelect(j.id)} className="mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">{j.title}</h3>
                  <p className="text-sm text-gray-500">{j.department} | {j.location}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${j.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{j.status}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{j.type}</span>
              {j.experience && <span className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded text-xs">{j.experience}</span>}
              {j.salary_range && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{j.salary_range}</span>}
            </div>
            {j.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{j.description}</p>}
            <div className="flex gap-2">
              <button onClick={() => viewApps(j.id)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"><Users className="h-3.5 w-3.5" /> Applications</button>
              <button onClick={() => edit(j)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => del(j.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No job postings yet</div>}
      </div>
    </div>
  );
}

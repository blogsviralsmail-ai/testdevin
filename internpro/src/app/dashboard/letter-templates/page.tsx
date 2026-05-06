"use client";

import { useState, useEffect, useCallback } from "react";

interface Template {
  id: string;
  name: string;
  type: string;
  htmlContent: string;
  isDefault: boolean;
  createdAt: string;
}

export default function LetterTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "offer", htmlContent: "", isDefault: false });
  const [preview, setPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("offer");

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/letter-templates");
    if (res.ok) setTemplates(await res.json());
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/letter-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", type: "offer", htmlContent: "", isDefault: false });
      fetchTemplates();
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await fetch(`/api/letter-templates/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editing.name,
        htmlContent: editing.htmlContent,
        isDefault: editing.isDefault,
      }),
    });
    setEditing(null);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/letter-templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  const defaultOfferTemplate = `<div style="font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #1e1b4b; font-size: 28px;">{{company_name}}</h1>
    <p style="color: #64748b;">Internship Offer Letter</p>
  </div>
  <p style="color: #374151;"><strong>Ref:</strong> {{letter_number}}</p>
  <p style="color: #374151;"><strong>Date:</strong> {{date}}</p>
  <p style="color: #374151; margin-top: 20px;">Dear <strong>{{student_name}}</strong>,</p>
  <p style="color: #374151;">We are pleased to offer you an internship position for the <strong>{{program_name}}</strong> program at {{company_name}}.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Duration</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{duration}} days</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Mode</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{mode}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Joining Date</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{joining_date}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Work Timing</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{work_timing}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Stipend/Salary</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">Rs. {{salary}}/month</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Weekly Off</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{weekoffs}} day(s)</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Paid Leaves</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{paid_leaves}}/month</td></tr>
  </table>
  <p style="color: #374151;">Please confirm your acceptance by joining on the mentioned date.</p>
  <p style="color: #374151; margin-top: 40px;">Best Regards,<br/><strong>{{company_name}}</strong></p>
</div>`;

  const defaultExperienceTemplate = `<div style="font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #1e1b4b; font-size: 28px;">{{company_name}}</h1>
    <h2 style="color: #374151;">EXPERIENCE / COMPLETION LETTER</h2>
  </div>
  <p style="color: #374151;"><strong>Ref:</strong> {{letter_number}}</p>
  <p style="color: #374151;"><strong>Date:</strong> {{date}}</p>
  <p style="color: #374151; margin-top: 20px;">To Whom It May Concern,</p>
  <p style="color: #374151;">This is to certify that <strong>{{student_name}}</strong> has successfully completed the <strong>{{program_name}}</strong> internship program at {{company_name}}.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Program</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{program_name}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Duration</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{duration}} days</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Period</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{start_date}} to {{end_date}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Performance</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{category}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #e5e7eb; color: #6b7280;">Remarks</td><td style="padding: 8px; border: 1px solid #e5e7eb; color: #111827;">{{remarks}}</td></tr>
  </table>
  <p style="color: #374151;">We wish {{student_name}} all the best in their future endeavors.</p>
  <p style="color: #374151; margin-top: 40px;">Authorized Signatory,<br/><strong>{{company_name}}</strong></p>
</div>`;

  const offerPlaceholders = [
    "{{company_name}}", "{{student_name}}", "{{program_name}}", "{{letter_number}}",
    "{{date}}", "{{joining_date}}", "{{duration}}", "{{salary}}",
    "{{weekoffs}}", "{{paid_leaves}}", "{{work_timing}}", "{{mode}}",
  ];

  const experiencePlaceholders = [
    "{{company_name}}", "{{student_name}}", "{{program_name}}", "{{letter_number}}",
    "{{date}}", "{{duration}}", "{{start_date}}", "{{end_date}}",
    "{{category}}", "{{remarks}}", "{{mode}}",
  ];

  const availablePlaceholders = activeTab === "experience" ? experiencePlaceholders : offerPlaceholders;

  const filteredTemplates = templates.filter((t) => (t.type || "offer") === activeTab);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Letter Template Designer</h1>
          <p className="text-gray-600 text-sm">Design offer letters and experience letters — details auto-fill ho jayenge</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); if (!showAdd) setForm({ name: "", type: activeTab, htmlContent: activeTab === "experience" ? defaultExperienceTemplate : defaultOfferTemplate, isDefault: false }); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          {showAdd ? "Cancel" : `+ New ${activeTab === "experience" ? "Experience" : "Offer"} Template`}
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { setActiveTab("offer"); setShowAdd(false); setEditing(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "offer" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          Offer Letter Templates
        </button>
        <button onClick={() => { setActiveTab("experience"); setShowAdd(false); setEditing(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "experience" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          Experience Letter Templates
        </button>
      </div>

      {/* Available Placeholders */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-blue-800 mb-2">Available Placeholders (auto-replace honge):</p>
        <div className="flex gap-2 flex-wrap">
          {availablePlaceholders.map((p) => (
            <code key={p} className="text-xs bg-white text-blue-700 px-2 py-1 rounded border border-blue-200">{p}</code>
          ))}
        </div>
      </div>

      {/* Add Template Form */}
      {showAdd && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 border mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Template</h2>
          <div className="space-y-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Template Name" required />
            <p className="text-xs text-gray-500">Type: <strong>{form.type === "experience" ? "Experience Letter" : "Offer Letter"}</strong></p>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              <label className="text-sm text-gray-700">Set as default template</label>
            </div>
            <textarea value={form.htmlContent} onChange={(e) => setForm({ ...form, htmlContent: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 font-mono" rows={15}
              placeholder="HTML content with placeholders..." required />
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700">
              Save Template
            </button>
            <button type="button" onClick={() => setPreview(!preview)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
              {preview ? "Hide Preview" : "Preview"}
            </button>
          </div>
          {preview && (
            <div className="mt-4 border rounded-lg p-4">
              <div dangerouslySetInnerHTML={{ __html: form.htmlContent }} />
            </div>
          )}
        </form>
      )}

      {/* Edit Template */}
      {editing && (
        <div className="bg-white rounded-xl p-6 border mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Editing: {editing.name}</h2>
            <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          <div className="space-y-4">
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} />
              <label className="text-sm text-gray-700">Default template</label>
            </div>
            <textarea value={editing.htmlContent} onChange={(e) => setEditing({ ...editing, htmlContent: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 font-mono" rows={15} />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleUpdate} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700">
              Save Changes
            </button>
            <button onClick={() => setPreview(!preview)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
              {preview ? "Hide Preview" : "Preview"}
            </button>
          </div>
          {preview && (
            <div className="mt-4 border rounded-lg p-4">
              <div dangerouslySetInnerHTML={{ __html: editing.htmlContent }} />
            </div>
          )}
        </div>
      )}

      {/* Templates List */}
      {filteredTemplates.length === 0 && !showAdd ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-4xl mb-4">🎨</p>
          <p className="text-gray-600">No {activeTab === "experience" ? "experience letter" : "offer letter"} templates yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Templates HTML mein hote hain placeholders ke saath — jab letter generate hota hai toh details auto-fill ho jaate hain.
          </p>
        </div>
      ) : (
        !editing && (
          <div className="grid gap-4">
            {filteredTemplates.map((tmpl) => (
              <div key={tmpl.id} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{tmpl.name}</h3>
                      {tmpl.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Default</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Created: {new Date(tmpl.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(tmpl); setPreview(false); }}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100">
                      Edit Design
                    </button>
                    <button onClick={() => handleDelete(tmpl.id)}
                      className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

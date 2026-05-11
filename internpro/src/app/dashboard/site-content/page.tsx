"use client";

import { useState, useEffect, useCallback } from "react";

interface SitePage {
  id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
  createdAt: string;
}

export default function SiteContentPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SitePage | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [editMode, setEditMode] = useState<"visual" | "raw">("visual");
  const [visualData, setVisualData] = useState<Record<string, unknown>>({});
  const [msg, setMsg] = useState("");

  const fetchPages = useCallback(async () => {
    const res = await fetch("/api/site-content");
    if (res.ok) setPages(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const startEdit = (page: SitePage) => {
    setEditing(page);
    setFormTitle(page.title);
    setFormSlug(page.slug);
    setFormContent(page.content);
    setFormPublished(page.isPublished);
    setCreating(false);
    try {
      setVisualData(JSON.parse(page.content));
      setEditMode("visual");
    } catch {
      setEditMode("raw");
    }
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setFormTitle("");
    setFormSlug("");
    setFormContent("{}");
    setFormPublished(true);
    setVisualData({});
    setEditMode("raw");
  };

  const saveContent = async () => {
    setSaving(true);
    setMsg("");
    const contentStr = editMode === "visual" ? JSON.stringify(visualData) : formContent;

    if (editing) {
      const res = await fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, title: formTitle, content: contentStr, isPublished: formPublished }),
      });
      if (res.ok) { setMsg("Saved successfully!"); fetchPages(); }
      else setMsg("Error saving");
    } else if (creating) {
      const res = await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: formSlug, title: formTitle, content: contentStr, isPublished: formPublished }),
      });
      if (res.ok) { setMsg("Page created!"); setCreating(false); fetchPages(); }
      else { const d = await res.json(); setMsg(d.error || "Error creating"); }
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const deletePage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    await fetch("/api/site-content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPages();
    if (editing?.id === id) { setEditing(null); setCreating(false); }
  };

  const updateVisualField = (key: string, value: unknown) => {
    setVisualData(prev => ({ ...prev, [key]: value }));
  };

  const updateVisualSection = (sectionIndex: number, field: string, value: string) => {
    const sections = [...((visualData.sections || []) as { title: string; body: string }[])];
    sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
    setVisualData(prev => ({ ...prev, sections }));
  };

  const addSection = () => {
    const sections = [...((visualData.sections || []) as { title: string; body: string }[]), { title: "", body: "" }];
    setVisualData(prev => ({ ...prev, sections }));
  };

  const removeSection = (idx: number) => {
    const sections = ((visualData.sections || []) as { title: string; body: string }[]).filter((_, i) => i !== idx);
    setVisualData(prev => ({ ...prev, sections }));
  };

  const updateVisualValue = (parentKey: string, index: number, field: string, value: string) => {
    const arr = [...((visualData[parentKey] || []) as Record<string, string>[])];
    arr[index] = { ...arr[index], [field]: value };
    setVisualData(prev => ({ ...prev, [parentKey]: arr }));
  };

  const addArrayItem = (key: string, template: Record<string, string>) => {
    const arr = [...((visualData[key] || []) as Record<string, string>[]), template];
    setVisualData(prev => ({ ...prev, [key]: arr }));
  };

  const removeArrayItem = (key: string, idx: number) => {
    const arr = ((visualData[key] || []) as Record<string, string>[]).filter((_, i) => i !== idx);
    setVisualData(prev => ({ ...prev, [key]: arr }));
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-2 border-t-[#0EA5B8] border-white/10 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Site Content Manager</h1>
          <p className="text-slate-400 mt-1">Manage About Us, Privacy Policy, Terms & Conditions, and custom pages</p>
        </div>
        <button onClick={startCreate} className="px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 15px rgba(14,165,184,0.3)' }}>
          + New Page
        </button>
      </div>

      {msg && (
        <div className="mb-6 p-4 rounded-xl text-white text-sm" style={{ background: msg.includes("Error") ? 'rgba(255,107,107,0.15)' : 'rgba(14,165,184,0.15)', border: `1px solid ${msg.includes("Error") ? 'rgba(255,107,107,0.3)' : 'rgba(14,165,184,0.3)'}` }}>
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Page List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">All Pages</h3>
          {pages.map(page => (
            <div key={page.id} onClick={() => startEdit(page)} className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${editing?.id === page.id ? 'ring-1 ring-[#0EA5B8]' : ''}`} style={{ background: editing?.id === page.id ? 'rgba(14,165,184,0.1)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{page.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">/{page.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${page.isPublished ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <button onClick={(e) => { e.stopPropagation(); deletePage(page.id); }} className="text-slate-600 hover:text-red-400 transition text-sm p-1">🗑</button>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">Updated: {new Date(page.updatedAt).toLocaleDateString()}</p>
            </div>
          ))}
          {pages.length === 0 && <p className="text-slate-500 text-sm">No pages yet. Create one!</p>}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {(editing || creating) ? (
            <div className="p-6 rounded-2xl space-y-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{creating ? "Create New Page" : `Edit: ${formTitle}`}</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={formPublished} onChange={(e) => setFormPublished(e.target.checked)} className="rounded" />
                    Published
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Page Title</label>
                  <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g., About Us" />
                </div>
                {creating && (
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">URL Slug</label>
                    <input value={formSlug} onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} placeholder="e.g., about-us" />
                  </div>
                )}
              </div>

              {/* Edit Mode Tabs */}
              <div className="flex gap-2">
                <button onClick={() => { setEditMode("visual"); try { setVisualData(JSON.parse(formContent)); } catch { setVisualData({}); } }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${editMode === "visual" ? "text-white" : "text-slate-400"}`} style={editMode === "visual" ? { background: 'rgba(14,165,184,0.15)', border: '1px solid rgba(14,165,184,0.3)' } : { border: '1px solid transparent' }}>
                  Visual Editor
                </button>
                <button onClick={() => { setEditMode("raw"); setFormContent(JSON.stringify(visualData, null, 2)); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${editMode === "raw" ? "text-white" : "text-slate-400"}`} style={editMode === "raw" ? { background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' } : { border: '1px solid transparent' }}>
                  Raw JSON
                </button>
              </div>

              {editMode === "raw" ? (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Content (JSON)</label>
                  <textarea value={formContent} onChange={e => setFormContent(e.target.value)} rows={20} className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none font-mono text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Render visual fields based on content structure */}
                  {Object.entries(visualData).map(([key, value]) => {
                    if (typeof value === "string") {
                      return (
                        <div key={key}>
                          <label className="text-sm text-slate-400 mb-1 block capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                          {value.length > 200 ? (
                            <textarea value={value} onChange={e => updateVisualField(key, e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                          ) : (
                            <input value={value} onChange={e => updateVisualField(key, e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-white outline-none text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                          )}
                        </div>
                      );
                    }
                    if (key === "sections" && Array.isArray(value)) {
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-slate-400 font-medium uppercase tracking-wider">Sections</label>
                            <button onClick={addSection} className="px-3 py-1 rounded-lg text-xs text-[#22d3ee]" style={{ background: 'rgba(14,165,184,0.1)', border: '1px solid rgba(14,165,184,0.2)' }}>+ Add Section</button>
                          </div>
                          <div className="space-y-4">
                            {(value as { title: string; body: string }[]).map((sec, idx) => (
                              <div key={idx} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs text-slate-500">Section {idx + 1}</span>
                                  <button onClick={() => removeSection(idx)} className="text-red-400/50 hover:text-red-400 text-xs">Remove</button>
                                </div>
                                <input value={sec.title} onChange={e => updateVisualSection(idx, "title", e.target.value)} placeholder="Section Title" className="w-full px-3 py-2 rounded-lg text-white mb-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                <textarea value={sec.body} onChange={e => updateVisualSection(idx, "body", e.target.value)} placeholder="Section Content" rows={4} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
                      const fields = Object.keys(value[0] as Record<string, string>);
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-slate-400 font-medium uppercase tracking-wider capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <button onClick={() => addArrayItem(key, fields.reduce((a, f) => ({ ...a, [f]: "" }), {}))} className="px-3 py-1 rounded-lg text-xs text-[#22d3ee]" style={{ background: 'rgba(14,165,184,0.1)', border: '1px solid rgba(14,165,184,0.2)' }}>+ Add</button>
                          </div>
                          <div className="space-y-3">
                            {(value as Record<string, string>[]).map((item, idx) => (
                              <div key={idx} className="p-3 rounded-xl flex gap-2 items-start" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, 1fr)` }}>
                                  {fields.map(f => (
                                    <input key={f} value={item[f] || ""} onChange={e => updateVisualValue(key, idx, f, e.target.value)} placeholder={f} className="px-3 py-2 rounded-lg text-white text-xs outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                  ))}
                                </div>
                                <button onClick={() => removeArrayItem(key, idx)} className="text-red-400/50 hover:text-red-400 text-xs mt-2">×</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={saveContent} disabled={saving} className="px-6 py-2.5 rounded-xl text-white font-medium transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 15px rgba(14,165,184,0.3)' }}>
                  {saving ? "Saving..." : (creating ? "Create Page" : "Save Changes")}
                </button>
                <button onClick={() => { setEditing(null); setCreating(false); }} className="px-5 py-2.5 rounded-xl text-slate-400 transition hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
                {editing && !creating && (
                  <a href={`/${editing.slug}`} target="_blank" className="text-sm text-[#22d3ee] hover:underline ml-auto">
                    View Page →
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-white mb-2">Select a page to edit</h3>
              <p className="text-slate-400 mb-6">Click on any page from the left panel, or create a new one</p>
              <button onClick={startCreate} className="px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #0EA5B8, #0891b2)' }}>
                Create New Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

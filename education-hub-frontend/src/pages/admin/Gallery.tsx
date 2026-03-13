import { useState, useEffect, useRef } from "react";
import { Image, Plus, Pencil, Trash2, X, Upload, Search, ChevronDown, CheckSquare, Square } from "lucide-react";
import api from "../../lib/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function GalleryAdmin() {
  const [images, setImages] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", image: "", category: "General", description: "", display_order: 99, university: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [filter, setFilter] = useState("");
  const [uniFilter, setUniFilter] = useState("");
  const [universities, setUniversities] = useState<any[]>([]);
  const [uniSearch, setUniSearch] = useState("");
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const uniDropdownRef = useRef<HTMLDivElement>(null);

  // Selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(e.target as Node)) {
        setUniDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = () => { api.get("/api/gallery").then(r => setImages(r.data || [])).catch(() => {}); };
  useEffect(() => { load(); api.get("/api/universities").then(r => setUniversities(r.data || [])).catch(() => {}); }, []);

  // Get unique universities from gallery data
  const galleryUnis = [...new Set(images.map(i => i.university).filter(Boolean))].sort();
  const allUniNames = [...new Set([...galleryUnis, ...universities.map((u: any) => u.name)])].sort();

  const imgSrc = (p: string) => { if (!p) return ""; if (p.startsWith("http")) return p; return API + p; };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const res = await api.post("/api/gallery/upload", fd); setForm(f => ({ ...f, image: res.data.url || "" })); } catch { /* */ }
    setUploading(false);
  };

  // Handle multiple file selection
  const handleMultiFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || files.length === 0) return;
    const newFiles = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }));
    setPendingFiles(prev => [...prev, ...newFiles]);
    e.target.value = "";
  };

  // Remove a pending file
  const removePendingFile = (idx: number) => {
    setPendingFiles(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
  };

  // Upload all pending files as gallery entries
  const uploadAll = async () => {
    if (!form.university) { alert("Please select a university first"); return; }
    if (pendingFiles.length === 0) { alert("Please select photos to upload"); return; }
    setUploading(true);
    setUploadProgress({ current: 0, total: pendingFiles.length });
    let uploaded = 0;
    for (const pf of pendingFiles) {
      try {
        const fd = new FormData(); fd.append("file", pf.file);
        const res = await api.post("/api/gallery/upload", fd);
        const url = res.data.url || "";
        if (url) {
          await api.post("/api/gallery", { title: form.university, image: url, category: form.category, description: form.description, display_order: form.display_order, university: form.university });
        }
        uploaded++;
        setUploadProgress({ current: uploaded, total: pendingFiles.length });
      } catch { /* */ }
      URL.revokeObjectURL(pf.preview);
    }
    setPendingFiles([]);
    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    setShowForm(false);
    setForm({ title: "", image: "", category: "General", description: "", display_order: 99, university: "" });
    load();
  };

  const save = async () => {
    if (!form.image) { alert("Please upload an image"); return; }
    if (editing) { await api.put(`/api/gallery/${editing.id}`, form); }
    else { await api.post("/api/gallery", form); }
    setShowForm(false); setEditing(null); setForm({ title: "", image: "", category: "General", description: "", display_order: 99, university: "" }); load();
  };

  const del = async (id: number) => { if (confirm("Delete?")) { await api.delete(`/api/gallery/${id}`); load(); } };
  const edit = (g: any) => { setForm({ title: g.title || "", image: g.image, category: g.category, description: g.description || "", display_order: g.display_order, university: g.university || "" }); setEditing(g); setShowForm(true); };

  // Toggle selection of a single image
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all filtered images
  const selectAll = () => { setSelected(new Set(filtered.map(g => g.id))); };

  // Deselect all
  const deselectAll = () => { setSelected(new Set()); };

  // Delete selected images
  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected image(s)?`)) return;
    setDeleting(true);
    try {
      for (const id of Array.from(selected)) { await api.delete(`/api/gallery/${id}`); }
      setSelected(new Set()); setSelectMode(false); load();
    } catch { /* */ }
    setDeleting(false);
  };

  // Delete ALL images
  const deleteAll = async () => {
    if (images.length === 0) return;
    if (!confirm(`Are you sure you want to DELETE ALL ${images.length} gallery images? This cannot be undone!`)) return;
    setDeleting(true);
    try {
      for (const img of images) { await api.delete(`/api/gallery/${img.id}`); }
      setSelected(new Set()); setSelectMode(false); load();
    } catch { /* */ }
    setDeleting(false);
  };

  const categories = [...new Set(images.map(i => i.category))];
  const filtered = images.filter(i => {
    const matchCat = !filter || i.category === filter;
    const matchUni = !uniFilter || i.university === uniFilter;
    return matchCat && matchUni;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Image className="h-7 w-7 text-pink-600" /> Gallery ({images.length})</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {images.length > 0 && (
            <button onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${selectMode ? "bg-yellow-100 text-yellow-800 border border-yellow-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              <CheckSquare className="h-4 w-4" /> {selectMode ? "Cancel Select" : "Select"}
            </button>
          )}
          {images.length > 0 && (
            <button onClick={deleteAll} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete All"}
            </button>
          )}
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", image: "", category: "General", description: "", display_order: 99, university: "" }); }}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700"><Plus className="h-4 w-4" /> Add Image</button>
        </div>
      </div>

      {/* Select Mode Action Bar */}
      {selectMode && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-sm font-medium text-yellow-800">{selected.size} selected</span>
          <button onClick={selectAll} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Select All ({filtered.length})</button>
          {selected.size > 0 && (
            <>
              <button onClick={deselectAll} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300">Deselect All</button>
              <button onClick={deleteSelected} disabled={deleting}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> {deleting ? "Deleting..." : `Delete ${selected.size}`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* University Filter */}
        <select value={uniFilter} onChange={e => setUniFilter(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white min-w-[200px]">
          <option value="">All Universities</option>
          {galleryUnis.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("")} className={`px-3 py-1.5 rounded-lg text-sm ${!filter ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === c ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{c}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? "Edit Image" : "Add Image"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {/* University Searchable Dropdown */}
              <div>
                <label className="block text-xs font-medium mb-1">University *</label>
                <div className="relative" ref={uniDropdownRef}>
                  <div
                    onClick={() => { setUniDropdownOpen(!uniDropdownOpen); setUniSearch(""); }}
                    className="w-full px-3 py-2 border rounded-lg text-sm flex items-center justify-between cursor-pointer bg-white hover:border-pink-400"
                  >
                    <span className={form.university ? "text-gray-900" : "text-gray-400"}>
                      {form.university || "Select University"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                  {uniDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                      <div className="p-2 border-b sticky top-0 bg-white">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <input
                            autoFocus
                            value={uniSearch}
                            onChange={e => setUniSearch(e.target.value)}
                            placeholder="Search university..."
                            className="w-full pl-7 pr-3 py-1.5 border rounded text-sm focus:outline-none focus:border-pink-400"
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-44">
                        {allUniNames
                          .filter(u => u.toLowerCase().includes(uniSearch.toLowerCase()))
                          .map(u => (
                            <div
                              key={u}
                              onClick={() => {
                                setForm({ ...form, university: u, title: u });
                                setUniDropdownOpen(false);
                                setUniSearch("");
                              }}
                              className={`px-3 py-2 text-sm cursor-pointer hover:bg-pink-50 ${
                                form.university === u ? "bg-pink-100 text-pink-700 font-medium" : "text-gray-700"
                              }`}
                            >
                              {u}
                            </div>
                          ))}
                        {allUniNames.filter(u => u.toLowerCase().includes(uniSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-400">No university found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option>General</option><option>Campus</option><option>Events</option><option>Team</option><option>Seminars</option><option>Celebrations</option><option>Achievements</option>
                </select>
              </div>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 99 })} placeholder="Display Order" className="w-full px-3 py-2 border rounded-lg text-sm" />

              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-medium mb-1">{editing ? "Image *" : "Photos * (select multiple)"}</label>
                {editing ? (
                  <>
                    {form.image && <img src={imgSrc(form.image)} alt="" className="h-24 w-36 rounded object-cover border mb-2" />}
                    <label className="flex items-center gap-2 px-3 py-2 bg-pink-600 text-white rounded-lg cursor-pointer hover:bg-pink-700 text-xs font-medium w-fit">
                      <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload"} <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                    <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Or paste URL" className="w-full px-3 py-2 border rounded-lg text-sm mt-2" />
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-2 px-3 py-2 bg-pink-600 text-white rounded-lg cursor-pointer hover:bg-pink-700 text-xs font-medium w-fit mb-2">
                      <Upload className="h-3.5 w-3.5" /> Select Photos
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultiFiles} />
                    </label>
                    {pendingFiles.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                        {pendingFiles.map((pf, idx) => (
                          <div key={idx} className="relative group">
                            <img src={pf.preview} alt="" className="h-20 w-full rounded object-cover border" />
                            <button onClick={() => removePendingFile(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" type="button">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{pendingFiles.length} photo(s) selected</p>
                  </>
                )}
              </div>

              {/* Upload progress */}
              {uploading && uploadProgress.total > 0 && (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress.current}/{uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-pink-600 h-2 rounded-full transition-all" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}

              {editing ? (
                <button onClick={save} className="w-full py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700">Update</button>
              ) : (
                <button onClick={uploadAll} disabled={uploading} className="w-full py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 disabled:opacity-50">
                  {uploading ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` : `Upload ${pendingFiles.length} Photo(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(g => (
          <div key={g.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden group relative ${selectMode && selected.has(g.id) ? "ring-2 ring-pink-500" : ""}`}>
            <div className="relative">
              {selectMode && (
                <button onClick={() => toggleSelect(g.id)} className="absolute top-2 left-2 z-10 bg-white rounded shadow p-0.5">
                  {selected.has(g.id) ? <CheckSquare className="h-5 w-5 text-pink-600" /> : <Square className="h-5 w-5 text-gray-400" />}
                </button>
              )}
              <img src={imgSrc(g.image)} alt={g.title} className="w-full h-40 object-cover cursor-pointer" onClick={() => selectMode && toggleSelect(g.id)} />
              {!selectMode && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => edit(g)} className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(g.id)} className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm truncate">{g.title || "Untitled"}</h3>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{g.category}</span>
                {g.university && <span className="text-xs text-indigo-600">| {g.university}</span>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No gallery images. Add your first image!</div>}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

import DataToolbar from "@/components/DataToolbar";
import { exportToCSV, exportToPDF, buildTableHTML } from "@/lib/export-utils";
interface HolidayInfo {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string | null;
}

export default function HolidaysManagementPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [holidays, setHolidays] = useState<HolidayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HolidayInfo | null>(null);
  const [form, setForm] = useState({ title: "", date: "", type: "public", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchHolidays = async () => {
    const res = await fetch("/api/holidays");
    if (res.ok) setHolidays(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchHolidays(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.date) { alert("Title and date are required"); return; }
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;
    const res = await fetch("/api/holidays", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { fetchHolidays(); setShowForm(false); setEditing(null); setForm({ title: "", date: "", type: "public", description: "" }); }
    else alert("Failed to save holiday");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this holiday?")) return;
    setDeleting(id);
    const res = await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchHolidays();
    setDeleting(null);
  };

  const openEdit = (h: HolidayInfo) => {
    setEditing(h);
    setForm({ title: h.title, date: h.date.split("T")[0], type: h.type, description: h.description || "" });
    setShowForm(true);
  };

  const upcomingCount = holidays.filter(h => new Date(h.date) >= new Date()).length;

  const getFilteredForExport = () => {
    return (holidays || []) as unknown as Record<string, unknown>[];
  };

  const handleExportCSV = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    exportToCSV(data as Record<string, unknown>[], "Holidays", [{ key: "title", label: "Title" }, { key: "date", label: "Date" }, { key: "type", label: "Type" }, { key: "description", label: "Description" }]);
  };

  const handleExportPDF = () => {
    const data = getFilteredForExport();
    if (!data.length) return alert("No data to export");
    const cols = [{ key: "title", label: "Title" }, { key: "date", label: "Date" }, { key: "type", label: "Type" }, { key: "description", label: "Description" }];
    exportToPDF("Holidays", buildTableHTML(data as Record<string, unknown>[], cols));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === holidays.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(holidays.map((item: { id: string }) => item.id)));
  };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} holidays?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_holidays", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchHolidays();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Holiday Management</h1>
      
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search holidays..."
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">
            {bulkDeleting ? "Deleting..." : "Delete Selected"}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
        </div>
      )}
          <p className="text-sm text-slate-400 mt-1">{holidays.length} total, {upcomingCount} upcoming</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", date: "", type: "public", description: "" }); }}
          className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm font-medium hover:bg-[#0d96a7] transition-all transform hover:scale-[1.02] shadow-lg">
          + Add Holiday
        </button>
      </div>

      {loading ? <div className="text-center text-slate-500 py-8">Loading...</div> :
      holidays.length === 0 ? (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-8 text-center">
          <p className="text-4xl mb-3">🏖️</p>
          <h3 className="text-lg font-semibold text-white mb-1">No Holidays Added</h3>
          <p className="text-sm text-slate-400 mb-4">Add public holidays, restricted holidays, and company off days.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm">Add First Holiday</button>
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03]">
                <tr className="text-left text-slate-400">
                  <th className="p-3 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === holidays.length} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" /></th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Holiday</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map(h => {
                  const d = new Date(h.date);
                  const isPast = d < new Date();
                  return (
                    <tr key={h.id} className={`border-t border-white/[0.04] hover:bg-white/[0.02] ${isPast ? "opacity-60" : ""}`}>
                      <td className="p-3 w-10"><input type="checkbox" checked={selectedIds.has(h.id)} onChange={() => toggleSelect(h.id)} className="rounded border-white/20 bg-white/5 accent-[#0EA5B8]" /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-[#0EA5B8]/20 flex flex-col items-center justify-center border border-[#0EA5B8]/30">
                            <span className="text-[10px] text-[#0EA5B8]">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                            <span className="text-sm font-bold text-white">{d.getDate()}</span>
                          </div>
                          <span className="text-xs text-slate-500">{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-white">{h.title}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                          h.type === "public" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                          h.type === "restricted" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                          "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        }`}>{h.type}</span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs max-w-[200px] truncate">{h.description || "—"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(h)}
                            className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 border border-blue-500/30">Edit</button>
                          <button onClick={() => handleDelete(h.id)} disabled={deleting === h.id}
                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 border border-red-500/30">
                            {deleting === h.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1420] rounded-2xl border border-white/[0.08] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editing ? "Edit Holiday" : "Add Holiday"}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-red-400 text-xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Holiday Name</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Republic Day"
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm">
                    <option value="public">Public Holiday</option>
                    <option value="restricted">Restricted Holiday</option>
                    <option value="company">Company Off</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Description (optional)</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description"
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 px-4 py-2 bg-white/[0.05] text-slate-300 rounded-lg text-sm hover:bg-white/[0.1]">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2 bg-[#0EA5B8] text-white rounded-lg text-sm font-medium hover:bg-[#0d96a7] disabled:opacity-50">
                {saving ? "Saving..." : (editing ? "Update" : "Add Holiday")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

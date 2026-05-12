"use client";

import { useState, useEffect, useCallback } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  order: number;
}

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", bio: "", photo: "", order: 0 });
  const [msg, setMsg] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/team");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const toggleSelect = (id: string) => { const next = new Set(selectedIds); if (next.has(id)) next.delete(id); else next.add(id); setSelectedIds(next); };
  const toggleSelectAll = () => { if (selectedIds.size === members.length) setSelectedIds(new Set()); else setSelectedIds(new Set(members.map((m) => m.id))); };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} team members?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_team_members", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchMembers();
  };

  const startEdit = (m: TeamMember) => {
    setEditing(m);
    setCreating(false);
    setForm({ name: m.name, role: m.role, bio: m.bio, photo: m.photo, order: m.order });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: "", role: "", bio: "", photo: "", order: members.length + 1 });
  };

  const saveMember = async () => {
    setSaving(true);
    setMsg("");
    if (editing) {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      if (res.ok) { setMsg("Updated!"); fetchMembers(); setEditing(null); }
      else setMsg("Error saving");
    } else if (creating) {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setMsg("Member added!"); fetchMembers(); setCreating(false); }
      else setMsg("Error creating");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    await fetch(`/api/team?id=${id}`, { method: "DELETE" });
    fetchMembers();
    if (editing?.id === id) setEditing(null);
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
          <h1 className="text-3xl font-bold text-white">Team Members</h1>
          <p className="text-slate-400 mt-1">Manage team members shown on the &quot;Our Team&quot; page</p>
        </div>
        <button onClick={startCreate} className="px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 15px rgba(14,165,184,0.3)' }}>
          + Add Member
        </button>
      </div>

      {msg && (
        <div className="mb-6 p-4 rounded-xl text-white text-sm" style={{ background: msg.includes("Error") ? 'rgba(255,107,107,0.15)' : 'rgba(14,165,184,0.15)', border: `1px solid ${msg.includes("Error") ? 'rgba(255,107,107,0.3)' : 'rgba(14,165,184,0.3)'}` }}>
          {msg}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">{bulkDeleting ? "Deleting..." : "Delete Selected"}</button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">All Members ({members.length})</h3>
            <div className="flex items-center gap-2"><input type="checkbox" checked={members.length > 0 && selectedIds.size === members.length} onChange={toggleSelectAll} /><span className="text-xs text-slate-500">Select All</span></div>
          </div>
          {members.map(m => (
            <div key={m.id} onClick={() => startEdit(m)} className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${editing?.id === m.id ? 'ring-1 ring-[#0EA5B8]' : ''}`} style={{ background: editing?.id === m.id ? 'rgba(14,165,184,0.1)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedIds.has(m.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(m.id); }} onClick={(e) => e.stopPropagation()} />
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{background: 'linear-gradient(135deg, rgba(14,165,184,0.3), rgba(167,139,250,0.3))'}}>
                  {m.photo ? <img src={m.photo} alt={m.name} className="w-10 h-10 rounded-full object-cover" /> : m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{m.name}</h4>
                  <p className="text-xs text-slate-500">{m.role}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteMember(m.id); }} className="text-slate-600 hover:text-red-400 transition text-sm p-1">🗑</button>
              </div>
            </div>
          ))}
          {members.length === 0 && <p className="text-slate-500 text-sm">No team members. Add some!</p>}
        </div>

        <div className="lg:col-span-2">
          {(editing || creating) ? (
            <div className="p-6 rounded-2xl space-y-4" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-white">{creating ? "Add Team Member" : `Edit: ${form.name}`}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl text-white outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} placeholder="Full Name" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Role / Designation</label>
                  <input value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl text-white outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} placeholder="e.g., CEO, Manager" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className="w-full px-4 py-2.5 rounded-xl text-white outline-none text-sm" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} placeholder="Short description..." />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Photo URL</label>
                  <input value={form.photo} onChange={e => setForm({...form, photo: e.target.value})} className="w-full px-4 py-2.5 rounded-xl text-white outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} placeholder="/uploads/photo.jpg" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Display Order</label>
                  <input type="number" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 rounded-xl text-white outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveMember} disabled={saving || !form.name} className="px-6 py-2.5 rounded-xl text-white font-medium transition-all hover:-translate-y-1 disabled:opacity-50" style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 0 #0a7c8a'}}>
                  {saving ? "Saving..." : creating ? "Add Member" : "Update"}
                </button>
                <button onClick={() => { setEditing(null); setCreating(false); }} className="px-6 py-2.5 rounded-xl text-slate-400 font-medium" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-20 text-slate-500">
              <p>Select a member to edit or click &quot;+ Add Member&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

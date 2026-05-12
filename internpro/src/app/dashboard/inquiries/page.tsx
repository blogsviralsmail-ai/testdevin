"use client";

import { useState, useEffect, useCallback } from "react";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/contact");
    if (res.ok) setInquiries(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelect = (id: string) => { const next = new Set(selectedIds); if (next.has(id)) next.delete(id); else next.add(id); setSelectedIds(next); };
  const toggleSelectAll = () => { if (selectedIds.size === filtered.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map((i) => i.id))); };
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} inquiries?`)) return;
    setBulkDeleting(true);
    await fetch("/api/bulk-actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_delete_inquiries", ids: Array.from(selectedIds) }) });
    setSelectedIds(new Set());
    setBulkDeleting(false);
    fetchData();
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    await fetch(`/api/contact?id=${id}`, { method: "DELETE" });
    fetchData();
    if (selected?.id === id) setSelected(null);
  };

  const filtered = inquiries.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase()) ||
    (i.subject || "").toLowerCase().includes(search.toLowerCase()) ||
    i.message.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const rows = [["Name", "Email", "Phone", "Subject", "Message", "Date"]];
    filtered.forEach(i => rows.push([i.name, i.email, i.phone || "", i.subject || "", i.message, new Date(i.createdAt).toLocaleString()]));
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "inquiries.csv";
    a.click();
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
          <h1 className="text-3xl font-bold text-white">Contact Inquiries</h1>
          <p className="text-slate-400 mt-1">Messages from the Contact Us page ({inquiries.length} total)</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{background: 'linear-gradient(135deg, #059669, #047857)'}}>
          CSV Export
        </button>
      </div>

      <div className="mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inquiries..." className="w-full md:w-96 px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} />
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-sm text-red-400 font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkDelete} disabled={bulkDeleting} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">{bulkDeleting ? "Deleting..." : "Delete Selected"}</button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20">Clear</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2"><input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleSelectAll} /><span className="text-xs text-slate-500">Select All</span></div>
          {filtered.map(i => (
            <div key={i.id} onClick={() => setSelected(i)} className={`p-4 rounded-xl cursor-pointer transition-all ${selected?.id === i.id ? 'ring-1 ring-[#0EA5B8]' : ''}`} style={{ background: selected?.id === i.id ? 'rgba(14,165,184,0.1)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedIds.has(i.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(i.id); }} onClick={(e) => e.stopPropagation()} />
                  <div>
                    <h4 className="font-medium text-white text-sm">{i.name}</h4>
                    <p className="text-xs text-slate-500">{i.email}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteInquiry(i.id); }} className="text-slate-600 hover:text-red-400 transition text-sm">🗑</button>
              </div>
              <p className="text-xs text-slate-600 mt-1 truncate">{i.subject || "General"} — {i.message.slice(0, 60)}...</p>
              <p className="text-xs text-slate-700 mt-1">{new Date(i.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-sm">No inquiries found.</p>}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="p-6 rounded-2xl space-y-4" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{selected.subject || "General Inquiry"}</h3>
                <span className="text-xs text-slate-500">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.03)'}}>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-white font-medium">{selected.name}</p>
                </div>
                <div className="p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.03)'}}>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-white font-medium">{selected.email}</p>
                </div>
                <div className="p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.03)'}}>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-white font-medium">{selected.phone || "N/A"}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{background: 'rgba(255,255,255,0.03)'}}>
                <p className="text-xs text-slate-500 mb-2">Message</p>
                <p className="text-slate-300 whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div className="flex gap-3">
                <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || "Your Inquiry"}`} className="px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:-translate-y-1" style={{background: 'linear-gradient(135deg, #0EA5B8, #0891b2)', boxShadow: '0 4px 0 #0a7c8a'}}>
                  Reply via Email
                </a>
                {selected.phone && (
                  <a href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl text-white font-medium transition-all hover:-translate-y-1" style={{background: 'linear-gradient(135deg, #25d366, #1da851)', boxShadow: '0 4px 0 #128c3a'}}>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-20 text-slate-500">
              <p>Select an inquiry to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

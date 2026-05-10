"use client";
import { useState, useEffect, useCallback } from "react";
import PaymentBlockMessage from "@/components/PaymentBlockMessage";

interface Discussion { id: string; title: string; content: string; category: string; authorId: string; programId?: string; isPinned: boolean; isResolved: boolean; replyCount: number; author: { name: string; role: string }; createdAt: string; }
interface Program { id: string; title: string; }

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", programId: "", category: "doubt" });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ id: string; title: string; content: string; category: string; author: { name: string; role: string }; isResolved: boolean; replies: { id: string; content: string; author: { name: string; role: string }; isAnswer: boolean; createdAt: string }[]; createdAt: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    const params = selectedProgramId !== "all" ? `?programId=${selectedProgramId}` : "";
    const [dRes, pRes, mRes] = await Promise.all([
      fetch(`/api/discussions${params}`), fetch("/api/programs"), fetch("/api/auth/me"),
    ]);
    if (dRes.ok) setDiscussions(await dRes.json());
    if (pRes.ok) setPrograms(await pRes.json());
    if (mRes.ok) { const d = await mRes.json(); setUser(d.user || d); }
  }, [selectedProgramId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isAdmin = user?.role === "admin" || user?.role === "organization" || user?.role === "teamleader";

  const handleCreate = async () => {
    const res = await fetch("/api/discussions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, programId: form.programId || undefined }),
    });
    if (res.ok) { setShowForm(false); setForm({ title: "", content: "", programId: "", category: "doubt" }); fetchData(); }
  };

  const viewDiscussion = async (id: string) => {
    const res = await fetch(`/api/discussions/${id}`);
    if (res.ok) { setDetail(await res.json()); setViewingId(id); }
  };

  const submitReply = async () => {
    if (!viewingId || !replyText.trim()) return;
    const res = await fetch(`/api/discussions/${viewingId}/replies`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText, isAnswer: isAdmin }),
    });
    if (res.ok) { setReplyText(""); viewDiscussion(viewingId); }
  };

  const toggleResolved = async (id: string, current: boolean) => {
    await fetch(`/api/discussions/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isResolved: !current }),
    });
    fetchData();
    if (detail && detail.id === id) viewDiscussion(id);
  };

  const deleteDiscussion = async (id: string, title: string) => {
    if (!confirm(`Delete discussion "${title}"?`)) return;
    const r = await fetch(`/api/discussions/${id}`, { method: "DELETE" });
    if (r.ok) { fetchData(); if (viewingId === id) { setViewingId(null); setDetail(null); } }
  };

  const togglePin = async (id: string, current: boolean) => {
    await fetch(`/api/discussions/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !current }),
    });
    fetchData();
  };

  if (viewingId && detail) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setViewingId(null); setDetail(null); }} className="text-sm text-indigo-600 hover:underline">&larr; Back to Discussions</button>
        <div className="bg-white rounded-xl p-6 border">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{detail.title}</h1>
                {detail.isResolved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Resolved</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">by {detail.author.name} ({detail.author.role}) &middot; {new Date(detail.createdAt).toLocaleDateString()}</p>
            </div>
            {(isAdmin || user?.id === detail.id) && (
              <button onClick={() => toggleResolved(detail.id, detail.isResolved)} className="text-xs text-indigo-600 hover:underline">
                {detail.isResolved ? "Reopen" : "Mark Resolved"}
              </button>
            )}
          </div>
          <p className="mt-4 text-gray-700 whitespace-pre-wrap">{detail.content}</p>
        </div>

        <h2 className="font-semibold text-gray-700">{detail.replies.length} Replies</h2>
        {detail.replies.map(r => (
          <div key={r.id} className={`bg-white rounded-xl p-4 border ${r.isAnswer ? "border-green-300 bg-green-50" : ""}`}>
            {r.isAnswer && <span className="text-xs text-green-700 font-medium">Accepted Answer</span>}
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{r.content}</p>
            <p className="text-xs text-gray-400 mt-2">{r.author.name} ({r.author.role}) &middot; {new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
        ))}

        <div className="bg-white rounded-xl p-4 border">
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px]" />
          <button onClick={submitReply} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Post Reply</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discussion Forum</h1>
          <p className="text-sm text-gray-500">Ask doubts, discuss topics, and help each other</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ New Discussion</button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search discussions..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>}
          </div>
          {programs.length > 1 && (
            <>
              <label className="text-sm font-medium text-gray-700">Course:</label>
              <select value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm text-gray-900 min-w-[250px]">
                <option value="all">All Courses</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">New Discussion</h2>
            <div className="space-y-3">
              <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea placeholder="Describe your question or topic..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm min-h-[100px]" />
              <select value={form.programId} onChange={e => setForm({ ...form, programId: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">General (No specific course)</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="doubt">Doubt / Question</option>
                <option value="discussion">General Discussion</option>
                <option value="resource">Resource Sharing</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Post</button>
            </div>
          </div>
        </div>
      )}

      {/* Discussion List */}
      {discussions.length === 0 ? (
        <>
          <PaymentBlockMessage feature="Discussions" />
          <div className="text-center py-12 text-gray-400">No discussions yet. Start one!</div>
        </>
      ) : (
        <div className="space-y-3">
          {discussions.filter(d => !searchQuery.trim() || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.content.toLowerCase().includes(searchQuery.toLowerCase())).map(d => (
            <div key={d.id} className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => viewDiscussion(d.id)}>
                  <div className="flex items-center gap-2">
                    {d.isPinned && <span className="text-xs">📌</span>}
                    <h3 className="font-semibold text-gray-900">{d.title}</h3>
                    {d.isResolved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Resolved</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{d.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{d.author.name} ({d.author.role})</span>
                    <span>{d.replyCount} replies</span>
                    <span className="capitalize">{d.category}</span>
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button onClick={(e) => { e.stopPropagation(); togglePin(d.id, d.isPinned); }} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
                      {d.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleResolved(d.id, d.isResolved); }} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">
                      {d.isResolved ? "Reopen" : "Resolve"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteDiscussion(d.id, d.title); }} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

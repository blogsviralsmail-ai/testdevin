"use client";
import { useState, useEffect } from "react";

interface Campaign { id: string; title: string; subject: string; htmlContent: string; targetRole: string; status: string; scheduledAt?: string; sentAt?: string; sentCount: number; openCount: number; clickCount: number; createdAt: string; }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", htmlContent: "", targetRole: "all", scheduledAt: "" });

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => { const r = await fetch("/api/campaigns"); if (r.ok) setCampaigns(await r.json()); };

  const createCampaign = async () => {
    const r = await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { setShowCreate(false); setForm({ title: "", subject: "", htmlContent: "", targetRole: "all", scheduledAt: "" }); fetchCampaigns(); }
  };

  const sendCampaign = async (id: string) => {
    if (!confirm("Send this campaign to all targeted users?")) return;
    const r = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
    if (r.ok) { const data = await r.json(); alert(`Sent to ${data.sentCount} users!`); fetchCampaigns(); }
    else { const err = await r.json(); alert(err.error || "Failed to send"); }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    fetchCampaigns();
  };

  const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-600", scheduled: "bg-blue-100 text-blue-700", sent: "bg-green-100 text-green-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-sm text-gray-500">Create and send bulk email campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">+ New Campaign</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Campaign</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Target</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Sent</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3"><p className="text-sm font-medium">{c.title}</p><p className="text-xs text-gray-500">{c.subject}</p></td>
                <td className="px-4 py-3 text-sm capitalize">{c.targetRole}</td>
                <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status] || ""}`}>{c.status}</span></td>
                <td className="px-4 py-3 text-center text-sm">{c.sentCount > 0 ? c.sentCount : "—"}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    {c.status === "draft" && <button onClick={() => sendCampaign(c.id)} className="text-xs text-green-600 hover:underline">Send</button>}
                    <button onClick={() => deleteCampaign(c.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaigns.length === 0 && <div className="text-center py-12 text-gray-400">No campaigns yet.</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-lg font-bold mb-4">New Email Campaign</h2>
            <div className="space-y-3">
              <input placeholder="Campaign Name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Email Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="HTML Content (use {{name}} for personalization)" value={form.htmlContent} onChange={e => setForm({ ...form, htmlContent: e.target.value })} className="w-full px-3 py-2 border rounded-lg h-40 font-mono text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} className="px-3 py-2 border rounded-lg">
                  <option value="all">All Users</option>
                  <option value="student">Students Only</option>
                  <option value="teamleader">Team Leaders Only</option>
                  <option value="agent">Agents Only</option>
                </select>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="px-3 py-2 border rounded-lg" placeholder="Schedule (optional)" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={createCampaign} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

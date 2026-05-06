"use client";

import { useState, useEffect, useCallback } from "react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  reply: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string };
}

interface UserSession {
  id: string;
  role: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [replyModal, setReplyModal] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [form, setForm] = useState({ subject: "", message: "", priority: "normal" });

  const fetchData = useCallback(async () => {
    const [ticketRes, meRes] = await Promise.all([
      fetch("/api/support"),
      fetch("/api/auth/me"),
    ]);
    if (ticketRes.ok) setTickets(await ticketRes.json());
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ subject: "", message: "", priority: "normal" });
      fetchData();
    }
  };

  const handleReply = async () => {
    if (!replyModal || !replyText) return;
    await fetch(`/api/support/${replyModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText, status: "resolved" }),
    });
    setReplyModal(null);
    setReplyText("");
    fetchData();
  };

  const isAdmin = user?.role === "admin" || user?.role === "organization";

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-yellow-100 text-yellow-700",
      "in-progress": "bg-blue-100 text-blue-700",
      resolved: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const priorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-600",
      normal: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      urgent: "bg-red-100 text-red-700",
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 text-sm">
            {isAdmin ? "Manage support tickets from all users" : "Create support tickets or chat with us"}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          {showForm ? "Cancel" : "+ New Ticket"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 border mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Support Ticket</h2>
          <div className="space-y-4">
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Subject" required />
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Describe your issue..." rows={4} required />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900">
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button type="submit" className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700">
            Submit Ticket
          </button>
        </form>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reply to Ticket</h2>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{replyModal.subject}</strong> from {replyModal.user.name}
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
              {replyModal.message}
            </div>
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900" placeholder="Your reply..." rows={4} />
            <div className="flex gap-3 mt-4">
              <button onClick={handleReply} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Reply & Resolve
              </button>
              <button onClick={() => setReplyModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-gray-600">No support tickets yet. Create one if you need help!</p>
          <p className="text-sm text-gray-400 mt-2">
            You can also call the support number provided in your program details.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900">{ticket.subject}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  {isAdmin && (
                    <p className="text-sm text-gray-500 mb-2">
                      From: {ticket.user.name} ({ticket.user.email}) — {ticket.user.role}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 mb-2">{ticket.message}</p>
                  {ticket.reply && (
                    <div className="bg-green-50 rounded-lg p-3 mt-3 text-sm">
                      <p className="font-medium text-green-800 text-xs mb-1">Admin Reply:</p>
                      <p className="text-green-700">{ticket.reply}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{new Date(ticket.createdAt).toLocaleString("en-IN")}</p>
                </div>
                {isAdmin && ticket.status === "open" && (
                  <button onClick={() => { setReplyModal(ticket); setReplyText(""); }}
                    className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">
                    Reply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

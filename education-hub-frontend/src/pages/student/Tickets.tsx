import { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Loader2, MessageSquare, Send } from "lucide-react";

interface Ticket {
  id: number;
  subject: string;
  category: string;
  status: string;
  created_at: string;
}

interface Message {
  id: number;
  message: string;
  sender_type: string;
  sender_name: string;
  created_at: string;
}

const categories = [
  "Admission", "Re-Registration", "Examination", "Marksheet",
  "Transcript", "Revaluation", "Migration", "Original Degree",
  "E-Learning", "Other"
];

export default function StudentTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [form, setForm] = useState({ subject: "", category: "Admission", message: "" });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const res = await api.get("/api/support/tickets");
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  async function createTicket() {
    if (!form.subject || !form.message) return;
    try {
      await api.post("/api/support/tickets", form);
      setShowCreate(false);
      setForm({ subject: "", category: "Admission", message: "" });
      loadTickets();
    } catch {
      // empty
    }
  }

  async function openTicket(ticket: Ticket) {
    setSelected(ticket);
    try {
      const res = await api.get(`/api/support/tickets/${ticket.id}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMessages([]);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selected) return;
    try {
      await api.post(`/api/support/tickets/${selected.id}/messages`, { message: newMessage });
      setNewMessage("");
      const res = await api.get(`/api/support/tickets/${selected.id}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      // empty
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support Tickets</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No tickets yet. Create one if you need help.</p>
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => openTicket(t)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{t.subject}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.category} &middot; {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  t.status === "open" ? "bg-blue-100 text-blue-700" :
                  t.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                  t.status === "resolved" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {t.status?.replace("_", " ")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Create New Ticket</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Describe your issue in detail..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button onClick={createTicket} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Ticket</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold">{selected.subject}</h2>
              <p className="text-xs text-gray-500">{selected.category} &middot; {selected.status}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No messages yet</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_type === "student" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      m.sender_type === "student" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}>
                      <p>{m.message}</p>
                      <p className={`text-xs mt-1 ${m.sender_type === "student" ? "text-blue-200" : "text-gray-400"}`}>
                        {m.sender_name} &middot; {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button onClick={sendMessage} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

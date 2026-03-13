import { useState, useEffect } from "react";
import api from "../../lib/api";
import { X, Send, Trash2, CheckSquare, Square, CheckCircle, Clock, AlertCircle, Search } from "lucide-react";

interface Ticket {
  id: number; subject: string; category: string; status: string; priority: string;
  student_name: string; solution: string; created_at: string; updated_at: string;
}
interface Message { id: number; message: string; sender_name: string; sender_role: string; created_at: string; }

const CATEGORIES = [
  "Admission", "Re-Registration", "Examination", "Marksheet", "Transcript",
  "Revaluation", "Migration", "Original Degree", "E-Learning", "Other"
];

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    let url = "/api/support/tickets?";
    if (filterCat) url += `category=${filterCat}&`;
    if (filterStatus) url += `status=${filterStatus}&`;
    api.get(url).then((r) => setTickets(r.data));
  };
  useEffect(() => { load(); }, [filterCat, filterStatus]);

  const openTicket = async (t: Ticket) => {
    setSelectedTicket(t);
    setSolutionText(t.solution || "");
    setShowSolutionForm(false);
    const res = await api.get(`/api/support/tickets/${t.id}`);
    setMessages(res.data.messages || []);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedTicket) return;
    await api.post(`/api/support/tickets/${selectedTicket.id}/messages`, { message: newMsg, ticket_id: selectedTicket.id });
    setNewMsg("");
    const res = await api.get(`/api/support/tickets/${selectedTicket.id}`);
    setMessages(res.data.messages || []);
  };

  const updateStatus = async (tid: number, status: string) => {
    await api.put(`/api/support/tickets/${tid}/status`, { status });
    load();
    if (selectedTicket?.id === tid) setSelectedTicket({ ...selectedTicket, status });
  };

  const submitSolution = async () => {
    if (!solutionText.trim() || !selectedTicket) return;
    await api.put(`/api/support/tickets/${selectedTicket.id}/solution`, { solution: solutionText });
    setShowSolutionForm(false);
    setSelectedTicket({ ...selectedTicket, solution: solutionText, status: "resolved" });
    const res = await api.get(`/api/support/tickets/${selectedTicket.id}`);
    setMessages(res.data.messages || []);
    load();
  };

  const deleteTicket = async (tid: number) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    await api.delete(`/api/support/tickets/${tid}`);
    if (selectedTicket?.id === tid) setSelectedTicket(null);
    load();
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} tickets?`)) return;
    setDeleting(true);
    try {
      await api.post("/api/support/tickets/bulk-delete", { ids: selectedIds });
      setSelectedIds([]);
      load();
    } catch { /* empty */ }
    setDeleting(false);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const filteredTickets = tickets.filter((t) => {
    if (!search) return true;
    return t.subject.toLowerCase().includes(search.toLowerCase()) ||
           (t.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
           String(t.id).includes(search);
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTickets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTickets.map((t) => t.id));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "in_progress": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "resolved": return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <X className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Support System</h1>
        <span className="text-sm text-gray-500">{stats.total} total tickets</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.open}</p>
          <p className="text-xs text-blue-600">Open</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{stats.inProgress}</p>
          <p className="text-xs text-yellow-600">In Progress</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          <p className="text-xs text-green-600">Resolved</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{stats.closed}</p>
          <p className="text-xs text-gray-500">Closed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg outline-none">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        {selectedIds.length > 0 && (
          <button onClick={bulkDelete} disabled={deleting} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
          </button>
        )}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                  {selectedIds.length === filteredTickets.length && filteredTickets.length > 0 ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ticket</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Student</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Priority</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Solution</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTickets.map((t) => (
              <tr key={t.id} className={`hover:bg-gray-50 cursor-pointer ${selectedIds.includes(t.id) ? "bg-blue-50" : ""}`}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleSelect(t.id)} className="text-gray-400 hover:text-gray-600">
                    {selectedIds.includes(t.id) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                  </button>
                </td>
                <td className="px-4 py-3" onClick={() => openTicket(t)}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-purple-100 rounded-lg flex items-center justify-center">
                      {getStatusIcon(t.status)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.subject}</p>
                      <p className="text-xs text-gray-500">#{t.id} - {t.created_at?.split("T")[0]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell capitalize" onClick={() => openTicket(t)}>{t.category}</td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell" onClick={() => openTicket(t)}>{t.student_name || "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell" onClick={() => openTicket(t)}>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(t.priority)}`}>{t.priority || "medium"}</span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select onChange={(e) => updateStatus(t.id, e.target.value)} value={t.status} className={`text-xs px-2 py-1 rounded-full border-0 font-medium outline-none ${t.status === "open" ? "bg-blue-100 text-blue-700" : t.status === "resolved" ? "bg-green-100 text-green-700" : t.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell" onClick={() => openTicket(t)}>
                  {t.solution ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Solution Provided</span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => deleteTicket(t.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTickets.length === 0 && <div className="p-8 text-center text-gray-500">No tickets found</div>}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-500">
                    #{selectedTicket.id} - {selectedTicket.category} - {selectedTicket.student_name || "No Student"} -
                    <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${selectedTicket.status === "open" ? "bg-blue-100 text-blue-700" : selectedTicket.status === "resolved" ? "bg-green-100 text-green-700" : selectedTicket.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                      {selectedTicket.status}
                    </span>
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
            </div>

            {/* Solution Section */}
            {selectedTicket.solution && (
              <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Solution Provided</h3>
                </div>
                <p className="text-sm text-green-700">{selectedTicket.solution}</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-96">
              {messages.map((m) => (
                <div key={m.id} className={`p-3 rounded-xl ${m.sender_role === "student" ? "bg-blue-50 ml-0 mr-12 border border-blue-100" : "bg-indigo-50 ml-12 mr-0 border border-indigo-100"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{m.sender_name} <span className="text-xs text-gray-400">({m.sender_role})</span></span>
                    <span className="text-xs text-gray-500">{m.created_at?.split("T")[0]}</span>
                  </div>
                  <p className={`text-sm ${m.message?.startsWith("[SOLUTION]") ? "font-medium text-green-700" : ""}`}>
                    {m.message?.startsWith("[SOLUTION]") ? m.message.replace("[SOLUTION] ", "") : m.message}
                  </p>
                </div>
              ))}
              {messages.length === 0 && <p className="text-gray-500 text-center py-4">No messages yet. Start the conversation below.</p>}
            </div>

            {/* Solution Form */}
            {showSolutionForm && (
              <div className="mx-6 mb-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h3 className="font-semibold text-yellow-800 mb-2">Provide Solution (visible to student)</h3>
                <textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Write the solution for this ticket... This will be visible to the student."
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg outline-none text-sm"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={submitSolution} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Submit Solution & Resolve
                  </button>
                  <button onClick={() => setShowSolutionForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
                </div>
              </div>
            )}

            {/* Actions & Reply */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your reply to the student..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                />
                <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {!showSolutionForm && selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                  <button onClick={() => setShowSolutionForm(true)} className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Provide Solution
                  </button>
                )}
                {selectedTicket.status !== "closed" && (
                  <button onClick={() => updateStatus(selectedTicket.id, "closed")} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                    <X className="h-3.5 w-3.5" /> Close Ticket
                  </button>
                )}
                {selectedTicket.status === "open" && (
                  <button onClick={() => updateStatus(selectedTicket.id, "in_progress")} className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Mark In Progress
                  </button>
                )}
                <button onClick={() => deleteTicket(selectedTicket.id)} className="text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 flex items-center gap-1 ml-auto">
                  <Trash2 className="h-3.5 w-3.5" /> Delete Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

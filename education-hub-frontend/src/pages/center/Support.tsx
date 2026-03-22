import { useState, useEffect } from "react";
import api from "../../lib/api";
import { X, Send, CheckCircle, Clock, AlertCircle, Search, MessageSquare } from "lucide-react";

interface Ticket {
  id: number; subject: string; category: string; status: string; priority: string;
  student_name: string; enrollment_no: string; solution: string; created_at: string; updated_at: string;
}
interface Message { id: number; message: string; sender_name: string; sender_role: string; created_at: string; }

const CATEGORIES = [
  "Admission", "Re-Registration", "Examination", "Marksheet", "Transcript",
  "Revaluation", "Migration", "Original Degree", "E-Learning", "Other"
];

export default function CenterSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [showSolutionForm, setShowSolutionForm] = useState(false);

  const load = () => {
    let url = "/api/support/tickets?";
    if (filterCat) url += `category=${filterCat}&`;
    if (filterStatus) url += `status=${filterStatus}&`;
    api.get(url).then((r) => setTickets(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [filterCat, filterStatus]);

  const openTicket = async (t: Ticket) => {
    setSelectedTicket(t);
    setSolutionText(t.solution || "");
    setShowSolutionForm(false);
    try {
      const res = await api.get(`/api/support/tickets/${t.id}`);
      setMessages(res.data.messages || []);
    } catch { setMessages([]); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedTicket) return;
    await api.post(`/api/support/tickets/${selectedTicket.id}/messages`, { message: newMsg, ticket_id: selectedTicket.id });
    setNewMsg("");
    try {
      const res = await api.get(`/api/support/tickets/${selectedTicket.id}`);
      setMessages(res.data.messages || []);
    } catch { /* empty */ }
  };

  const updateStatus = async (tid: number, status: string) => {
    try {
      await api.put(`/api/support/tickets/${tid}/status`, { status });
      load();
      if (selectedTicket?.id === tid) setSelectedTicket({ ...selectedTicket, status });
    } catch { /* empty */ }
  };

  const submitSolution = async () => {
    if (!solutionText.trim() || !selectedTicket) return;
    try {
      await api.put(`/api/support/tickets/${selectedTicket.id}/solution`, { solution: solutionText });
      setShowSolutionForm(false);
      setSelectedTicket({ ...selectedTicket, solution: solutionText, status: "resolved" });
      const res = await api.get(`/api/support/tickets/${selectedTicket.id}`);
      setMessages(res.data.messages || []);
      load();
    } catch { /* empty */ }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!search) return true;
    return t.subject.toLowerCase().includes(search.toLowerCase()) ||
           (t.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
           String(t.id).includes(search);
  });

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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Support Tickets</h1>
        <span className="text-sm text-gray-500">{stats.total} tickets from your students</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
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
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
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
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>No support tickets from your students yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((t) => (
              <div key={t.id} onClick={() => openTicket(t)} className="px-4 py-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-100 flex-shrink-0">
                    {getStatusIcon(t.status)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500">
                      #{t.id} &middot; {t.student_name || "Unknown"} &middot; {t.category} &middot; {t.created_at?.split("T")[0]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(t.priority)}`}>{t.priority || "medium"}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    t.status === "open" ? "bg-blue-100 text-blue-700" :
                    t.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                    t.status === "resolved" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>{t.status?.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
              {/* Status change */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">Change status:</span>
                <select onChange={(e) => updateStatus(selectedTicket.id, e.target.value)} value={selectedTicket.status} className={`text-xs px-2 py-1 rounded-full border-0 font-medium outline-none ${selectedTicket.status === "open" ? "bg-blue-100 text-blue-700" : selectedTicket.status === "resolved" ? "bg-green-100 text-green-700" : selectedTicket.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                {!selectedTicket.solution && !showSolutionForm && (
                  <button onClick={() => setShowSolutionForm(true)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-200">
                    Provide Solution
                  </button>
                )}
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
                <div key={m.id} className={`p-3 rounded-xl ${m.sender_role === "student" ? "bg-blue-50 ml-0 mr-12 border border-blue-100" : "bg-emerald-50 ml-12 mr-0 border border-emerald-100"}`}>
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
                  placeholder="Write the solution for this ticket..."
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg outline-none text-sm"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setShowSolutionForm(false)} className="text-xs px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button onClick={submitSolution} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">Submit Solution & Resolve</button>
                </div>
              </div>
            )}

            {/* Reply Input */}
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a reply to the student..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={sendMessage} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                <Send className="h-4 w-4" /> Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

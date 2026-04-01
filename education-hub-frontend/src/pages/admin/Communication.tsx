import { useState, useEffect, useRef } from "react";
import { Send, Plus, Pencil, Trash2, X, Mail, Megaphone, FileText, Bell, MessageCircle, Search, ArrowLeft } from "lucide-react";
import api from "../../lib/api";

const COMM_TABS = [
  { id: "reminders", label: "Fee Reminders", icon: Bell },
  { id: "messages", label: "Student Messages", icon: MessageCircle },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
];

interface Conversation {
  id: number; student_name: string; enrollment_no: string; subject: string;
  last_message: string; last_message_at: string; unread_count: number;
}
interface ChatMessage {
  id: number; sender_name: string; sender_role: string; message: string; created_at: string; sender_id: number;
}

export default function CommunicationAdmin() {
  const [tab, setTab] = useState("reminders");
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [tForm, setTForm] = useState({ name: "", channel: "email", subject: "", body: "", variables: "" });
  const [cForm, setCForm] = useState({ name: "", channel: "email", template_id: "", target_audience: "all_students", filters: "", status: "draft", scheduled_at: "" });
  const [showCForm, setShowCForm] = useState(false);
  const [editingC, setEditingC] = useState<any>(null);
  // Fee Reminders
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [reminderMsg, setReminderMsg] = useState("");
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderResult, setReminderResult] = useState<any>(null);
  // WhatsApp
  const [waTarget, setWaTarget] = useState("students");
  const [waMessage, setWaMessage] = useState("");
  const [waFilters, setWaFilters] = useState<any>({});
  const [waRecipients, setWaRecipients] = useState<any[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const [waSinglePhone, setWaSinglePhone] = useState("");
  const [waSingleMsg, setWaSingleMsg] = useState("");
  const [waUniversities, setWaUniversities] = useState<any[]>([]);
  const [waCategories, setWaCategories] = useState<any[]>([]);
  // Chat / Messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTemplates = () => { api.get("/api/communication/templates").then(r => setTemplates(r.data || [])).catch(() => {}); };
  const loadCampaigns = () => { api.get("/api/communication/campaigns").then(r => setCampaigns(r.data || [])).catch(() => {}); };
  const loadStats = () => { api.get("/api/communication/stats").then(r => setStats(r.data || {})).catch(() => {}); };
  const loadReminders = () => { api.get("/api/analytics/fee-reminders/students").then(r => setPendingStudents(r.data || [])).catch(() => {}); };
  const loadUniversities = () => { api.get("/api/universities").then(r => setWaUniversities(r.data || [])).catch(() => {}); };
  const loadCategories = (uniId: number) => { api.get("/api/categories?university_id=" + uniId).then(r => setWaCategories(r.data || [])).catch(() => {}); };

  // Chat functions
  const loadConversations = () => { setChatLoading(true); api.get("/api/chat/conversations").then(r => setConversations(r.data || [])).catch(() => {}).finally(() => setChatLoading(false)); };
  const loadChatMessages = (cid: number) => { api.get("/api/chat/conversations/" + cid + "/messages").then(r => setChatMessages(r.data || [])).catch(() => {}); };
  const sendChatMessage = async () => {
    if (!newMsg.trim() || !selectedConv) return;
    try { await api.post("/api/chat/conversations/" + selectedConv.id + "/messages", { message: newMsg }); setNewMsg(""); loadChatMessages(selectedConv.id); loadConversations(); } catch {}
  };
  const deleteConv = async (cid: number) => {
    if (!confirm("Delete this conversation?")) return;
    try { await api.delete("/api/chat/conversations/" + cid); setSelectedConv(null); loadConversations(); } catch {}
  };

  useEffect(() => {
    if (tab === "templates") { loadTemplates(); loadStats(); }
    if (tab === "campaigns") { loadCampaigns(); loadStats(); }
    if (tab === "reminders") loadReminders();
    if (tab === "messages") loadConversations();
    if (tab === "whatsapp") loadUniversities();
  }, [tab]);
  useEffect(() => { loadTemplates(); loadCampaigns(); loadStats(); }, []);

  // Chat polling
  useEffect(() => {
    if (selectedConv) {
      loadChatMessages(selectedConv.id);
      pollRef.current = setInterval(() => loadChatMessages(selectedConv.id), 5000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [selectedConv]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const saveTemplate = async () => {
    if (!tForm.name) return;
    if (editing) { await api.put("/api/communication/templates/" + editing.id, tForm); }
    else { await api.post("/api/communication/templates", tForm); }
    setShowForm(false); setEditing(null); setTForm({ name: "", channel: "email", subject: "", body: "", variables: "" }); loadTemplates();
  };

  const delTemplate = async (id: number) => { if (confirm("Delete?")) { await api.delete("/api/communication/templates/" + id); loadTemplates(); } };
  const editTemplate = (t: any) => { setTForm({ name: t.name, channel: t.channel, subject: t.subject || "", body: t.body || "", variables: t.variables || "" }); setEditing(t); setShowForm(true); };

  const saveCampaign = async () => {
    if (!cForm.name) return;
    const payload = { ...cForm, template_id: cForm.template_id ? parseInt(cForm.template_id) : null };
    if (editingC) { await api.put("/api/communication/campaigns/" + editingC.id, payload); }
    else { await api.post("/api/communication/campaigns", payload); }
    setShowCForm(false); setEditingC(null); setCForm({ name: "", channel: "email", template_id: "", target_audience: "all_students", filters: "", status: "draft", scheduled_at: "" }); loadCampaigns(); loadStats();
  };

  const delCampaign = async (id: number) => { if (confirm("Delete?")) { await api.delete("/api/communication/campaigns/" + id); loadCampaigns(); loadStats(); } };
  const editCampaign = (c: any) => { setCForm({ name: c.name, channel: c.channel, template_id: c.template_id?.toString() || "", target_audience: c.target_audience, filters: c.filters || "", status: c.status, scheduled_at: c.scheduled_at || "" }); setEditingC(c); setShowCForm(true); };
  const sendCampaign = async (id: number) => { if (confirm("Send this campaign to all target students?")) { const r = await api.post("/api/communication/campaigns/" + id + "/send"); alert(r.data.message); loadCampaigns(); loadStats(); } };

  // Fee Reminder handlers
  const toggleStudent = (id: number) => { setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]); };
  const selectAll = () => { if (selectedStudents.length === pendingStudents.length) setSelectedStudents([]); else setSelectedStudents(pendingStudents.map(s => s.id)); };
  const sendReminders = async () => {
    setReminderSending(true); setReminderResult(null);
    try { const r = await api.post("/api/analytics/fee-reminders/send", { student_ids: selectedStudents, message: reminderMsg }); setReminderResult(r.data); setSelectedStudents([]); }
    catch { setReminderResult({ message: "Error sending reminders" }); }
    setReminderSending(false);
  };
  const sendAllReminders = async () => {
    setReminderSending(true); setReminderResult(null);
    try { const r = await api.post("/api/analytics/fee-reminders/send-all", { message: reminderMsg }); setReminderResult(r.data); }
    catch { setReminderResult({ message: "Error sending reminders" }); }
    setReminderSending(false);
  };

  // WhatsApp
  const generateWaMessages = async () => {
    setWaLoading(true);
    try { const r = await api.post("/api/analytics/whatsapp/bulk-send", { target: waTarget, message: waMessage, filters: waFilters }); setWaRecipients(r.data.recipients || []); }
    catch { alert("Error generating messages"); }
    setWaLoading(false);
  };
  const sendSingleWa = () => {
    if (!waSinglePhone || !waSingleMsg) return;
    let phone = waSinglePhone.replace(/[\s\-\+]/g, "");
    if (phone.startsWith("0")) phone = "91" + phone.slice(1);
    else if (!phone.startsWith("91") && phone.length === 10) phone = "91" + phone;
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(waSingleMsg), "_blank");
  };

  const filteredConversations = conversations.filter(c =>
    (c.student_name || "").toLowerCase().includes(chatSearch.toLowerCase()) ||
    (c.subject || "").toLowerCase().includes(chatSearch.toLowerCase())
  );
  const formatTime = (d: string) => {
    if (!d) return "";
    const dt = new Date(d);
    const now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 86400000) return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return dt.toLocaleDateString("en-IN", { weekday: "short" });
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Megaphone className="h-7 w-7 text-violet-600" /> Communication</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[{ label: "Templates", val: stats.total_templates || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Campaigns", val: stats.total_campaigns || 0, icon: Megaphone, color: "text-violet-600", bg: "bg-violet-100" },
          { label: "Sent", val: stats.sent_campaigns || 0, icon: Send, color: "text-green-600", bg: "bg-green-100" },
          { label: "Messages Sent", val: stats.total_sent || 0, icon: Mail, color: "text-orange-600", bg: "bg-orange-100" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className={`${s.bg} p-2.5 rounded-lg`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-xl font-bold">{s.val}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {COMM_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "bg-white text-gray-600 border hover:bg-gray-50"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ===== FEE REMINDERS TAB ===== */}
      {tab === "reminders" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Bell className="h-6 w-6 text-orange-600" /> Automated Fee Reminders</h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={sendAllReminders} disabled={reminderSending} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                <Send className="h-4 w-4" /> Send to All ({pendingStudents.length})
              </button>
              <button onClick={sendReminders} disabled={reminderSending || selectedStudents.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <Send className="h-4 w-4" /> Send Selected ({selectedStudents.length})
              </button>
            </div>
          </div>
          {reminderResult && (
            <div className={`mb-4 p-4 rounded-xl border ${reminderResult.sent > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className="font-medium">{reminderResult.message}</p>
              {reminderResult.sent > 0 && <p className="text-sm text-green-600 mt-1">{reminderResult.sent} emails sent successfully</p>}
              {reminderResult.failed > 0 && <p className="text-sm text-red-600 mt-1">{reminderResult.failed} failed</p>}
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
            <label className="text-sm font-medium text-gray-700">Custom Message (optional)</label>
            <textarea value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="e.g. Last date for fee payment is 15th March 2026..." />
          </div>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left"><input type="checkbox" checked={selectedStudents.length === pendingStudents.length && pendingStudents.length > 0} onChange={selectAll} className="rounded" /></th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Total Fees</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Paid</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No students with pending fees</td></tr>
                  ) : pendingStudents.map(s => (
                    <tr key={s.id} className="border-b hover:bg-blue-50 cursor-pointer" onClick={() => toggleStudent(s.id)}>
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} className="rounded" /></td>
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.email || <span className="text-red-400">No email</span>}</td>
                      <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                      <td className="px-4 py-3 text-right font-medium">{(s.total_fees || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{(s.paid || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-bold">{(s.pending || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== STUDENT MESSAGES (CHAT) TAB ===== */}
      {tab === "messages" && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 340px)", minHeight: "400px" }}>
            {chatLoading ? (
              <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
            ) : (
              <div className="flex h-full">
                {/* Conversations List */}
                <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map(c => (
                      <div key={c.id} onClick={() => setSelectedConv(c)}
                        className={`flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedConv?.id === c.id ? "bg-blue-50" : ""}`}>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                          {(c.student_name || "S")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium truncate">{c.student_name || "Student"}</p>
                            <span className="text-xs text-gray-400">{formatTime(c.last_message_at)}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{c.last_message || c.subject}</p>
                        </div>
                        {c.unread_count > 0 && (
                          <span className="h-5 w-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{c.unread_count}</span>
                        )}
                      </div>
                    ))}
                    {filteredConversations.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No conversations</div>}
                  </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col ${!selectedConv ? "hidden md:flex" : "flex"}`}>
                  {selectedConv ? (
                    <>
                      <div className="p-3 border-b flex items-center gap-3">
                        <button onClick={() => setSelectedConv(null)} className="md:hidden"><ArrowLeft className="h-5 w-5" /></button>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {(selectedConv.student_name || "S")[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{selectedConv.student_name || "Student"}</p>
                          <p className="text-xs text-gray-400">{selectedConv.enrollment_no || ""}</p>
                        </div>
                        <button onClick={() => deleteConv(selectedConv.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {chatMessages.map(m => (
                          <div key={m.id} className={`flex ${m.sender_role !== "student" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                              m.sender_role !== "student" ? "bg-blue-600 text-white rounded-br-md" : "bg-white border rounded-bl-md"
                            }`}>
                              <p>{m.message}</p>
                              <p className={`text-xs mt-1 ${m.sender_role !== "student" ? "text-blue-200" : "text-gray-400"}`}>
                                {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={bottomRef} />
                      </div>
                      <div className="p-3 border-t bg-white">
                        <div className="flex gap-2">
                          <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                            placeholder="Type a message..." className="flex-1 px-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-blue-500" />
                          <button onClick={sendChatMessage} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                            <Send className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-30" />
                        <p>Select a conversation to start chatting</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== WHATSAPP TAB ===== */}
      {tab === "whatsapp" && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6"><MessageCircle className="h-6 w-6 text-green-600" /> WhatsApp Messaging</h2>
          <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Send className="h-4 w-4 text-green-600" /> Send Single Message</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input type="text" value={waSinglePhone} onChange={e => setWaSinglePhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Message</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={waSingleMsg} onChange={e => setWaSingleMsg(e.target.value)} placeholder="Type your message..." className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={e => e.key === 'Enter' && sendSingleWa()} />
                  <button onClick={sendSingleWa} disabled={!waSinglePhone || !waSingleMsg} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                    <Send className="h-4 w-4" /> Send
                  </button>
                </div>
              </div>
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green-600" /> Bulk WhatsApp Messages</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Compose Message</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Target Audience</label>
                  <select value={waTarget} onChange={e => { setWaTarget(e.target.value); setWaRecipients([]); setWaFilters({}); setWaCategories([]); }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                    <option value="students">Students</option>
                    <option value="leads">Leads</option>
                  </select>
                </div>
                {waTarget === "students" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Filter by Status</label>
                      <select value={waFilters.status || ""} onChange={e => setWaFilters({ ...waFilters, status: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                        <option value="">All Students</option>
                        <option value="active">Active Only</option>
                        <option value="pending">Pending Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Filter by University</label>
                      <select value={waFilters.university_id || ""} onChange={e => {
                        const uid = e.target.value;
                        setWaFilters({ ...waFilters, university_id: uid, category_id: "" });
                        setWaCategories([]);
                        if (uid) loadCategories(parseInt(uid));
                      }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                        <option value="">All Universities</option>
                        {waUniversities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    {waFilters.university_id && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Filter by Course</label>
                        <select value={waFilters.category_id || ""} onChange={e => setWaFilters({ ...waFilters, category_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                          <option value="">All Courses</option>
                          {waCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Message Template</label>
                  <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={4} placeholder={waTarget === "students" ? "Hi {name}, your pending fee is {pending}." : "Hi {name}, thank you for your interest!"} />
                  <p className="text-xs text-gray-400 mt-1">Variables: {waTarget === "students" ? "{name}, {total_fees}, {paid}, {pending}" : "{name}, {status}"}</p>
                </div>
                <button onClick={generateWaMessages} disabled={waLoading || !waMessage.trim()} className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4" /> {waLoading ? "Loading Recipients..." : "Load Recipients"}
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recipients ({waRecipients.length})</h3>
              </div>
              {waRecipients.length === 0 ? (
                <p className="text-gray-400 text-center py-12">Load recipients to see list</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {waRecipients.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 border-gray-200 hover:bg-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.phone}</p>
                      </div>
                      <a href={r.wa_link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1 flex-shrink-0">
                        <Send className="h-3.5 w-3.5" /> Send
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {tab === "templates" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setShowForm(true); setEditing(null); setTForm({ name: "", channel: "email", subject: "", body: "", variables: "" }); }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"><Plus className="h-4 w-4" /> New Template</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${t.channel === "email" ? "bg-blue-100 text-blue-700" : t.channel === "sms" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}>{t.channel}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editTemplate(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => delTemplate(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {t.subject && <p className="text-sm font-medium text-gray-700 mb-1">Subject: {t.subject}</p>}
                <p className="text-xs text-gray-500 line-clamp-3">{t.body}</p>
                {t.variables && <p className="text-xs text-gray-400 mt-2">Variables: {t.variables}</p>}
              </div>
            ))}
            {templates.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No templates yet</div>}
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {tab === "campaigns" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setShowCForm(true); setEditingC(null); setCForm({ name: "", channel: "email", template_id: "", target_audience: "all_students", filters: "", status: "draft", scheduled_at: "" }); }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"><Plus className="h-4 w-4" /> New Campaign</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Campaign</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Channel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Audience</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sent</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${c.channel === "email" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{c.channel}</span></td>
                    <td className="px-4 py-3 text-xs capitalize">{c.target_audience?.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${c.status === "sent" ? "bg-green-100 text-green-700" : c.status === "draft" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"}`}>{c.status}</span></td>
                    <td className="px-4 py-3">{c.sent_count || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.status === "draft" && <button onClick={() => sendCampaign(c.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Send"><Send className="h-4 w-4" /></button>}
                        <button onClick={() => editCampaign(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => delCampaign(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No campaigns yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">{editing ? "Edit Template" : "New Template"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} placeholder="Template Name *" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select value={tForm.channel} onChange={e => setTForm({ ...tForm, channel: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option>
              </select>
              <input value={tForm.subject} onChange={e => setTForm({ ...tForm, subject: e.target.value })} placeholder="Subject" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea value={tForm.body} onChange={e => setTForm({ ...tForm, body: e.target.value })} placeholder="Message Body" rows={6} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input value={tForm.variables} onChange={e => setTForm({ ...tForm, variables: e.target.value })} placeholder="Variables (comma separated)" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button onClick={saveTemplate} className="w-full py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">{editing ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Form Modal */}
      {showCForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 my-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">{editingC ? "Edit Campaign" : "New Campaign"}</h2>
              <button onClick={() => setShowCForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} placeholder="Campaign Name *" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={cForm.channel} onChange={e => setCForm({ ...cForm, channel: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option>
                </select>
                <select value={cForm.template_id} onChange={e => setCForm({ ...cForm, template_id: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">No Template</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <select value={cForm.target_audience} onChange={e => setCForm({ ...cForm, target_audience: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="all_students">All Students</option><option value="pending_students">Pending Students</option><option value="university_wise">University Wise</option>
              </select>
              <input type="datetime-local" value={cForm.scheduled_at} onChange={e => setCForm({ ...cForm, scheduled_at: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button onClick={saveCampaign} className="w-full py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">{editingC ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

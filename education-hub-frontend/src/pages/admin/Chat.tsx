import { useState, useEffect, useRef } from "react";
import api from "../../lib/api";
import { MessageCircle, Send, Search, ArrowLeft, Trash2 } from "lucide-react";

interface Conversation {
  id: number; student_name: string; enrollment_no: string; subject: string;
  last_message: string; last_message_at: string; unread_count: number;
}
interface Message {
  id: number; sender_name: string; sender_role: string; message: string; created_at: string; sender_id: number;
}

export default function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (selected) {
      loadMessages(selected.id);
      pollRef.current = setInterval(() => loadMessages(selected.id), 5000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadConversations() {
    try { const r = await api.get("/api/chat/conversations"); setConversations(r.data); } catch {} finally { setLoading(false); }
  }

  async function loadMessages(cid: number) {
    try { const r = await api.get("/api/chat/conversations/" + cid + "/messages"); setMessages(r.data); } catch {}
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selected) return;
    try {
      await api.post("/api/chat/conversations/" + selected.id + "/messages", { message: newMsg });
      setNewMsg("");
      loadMessages(selected.id);
      loadConversations();
    } catch {}
  }

  async function deleteConv(cid: number) {
    if (!confirm("Delete this conversation?")) return;
    try { await api.delete("/api/chat/conversations/" + cid); setSelected(null); loadConversations(); } catch {}
  }

  const filtered = conversations.filter(c =>
    (c.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.subject || "").toLowerCase().includes(search.toLowerCase())
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selected ? "hidden md:flex" : "flex"}`}>
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelected(c)}
                  className={`flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-50 ${selected?.id === c.id ? "bg-blue-50" : ""}`}>
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
              {filtered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No conversations</div>}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!selected ? "hidden md:flex" : "flex"}`}>
            {selected ? (
              <>
                <div className="p-3 border-b flex items-center gap-3">
                  <button onClick={() => setSelected(null)} className="md:hidden"><ArrowLeft className="h-5 w-5" /></button>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {(selected.student_name || "S")[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{selected.student_name || "Student"}</p>
                    <p className="text-xs text-gray-400">{selected.enrollment_no || ""}</p>
                  </div>
                  <button onClick={() => deleteConv(selected.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.map(m => (
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
                    <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..." className="flex-1 px-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-blue-500" />
                    <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
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
      </div>
    </div>
  );
}

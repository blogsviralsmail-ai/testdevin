"use client";

import { useState, useEffect, useRef } from "react";

interface ChatMsg {
  id: string;
  senderId: string;
  receiverId: string | null;
  roomId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatRoom {
  roomId: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  otherUser: { id: string; name: string; avatar: string | null; role: string } | null;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<ChatRoom["otherUser"]>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [allStudents, setAllStudents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      setCurrentUserId(data.user?.id || "");
      setCurrentUserRole(data.user?.role || "");
    });
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom);
      const interval = setInterval(() => fetchMessages(activeRoom), 3000);
      return () => clearInterval(interval);
    }
  }, [activeRoom]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRooms = () => {
    fetch("/api/chat?listRooms=true").then(r => r.json()).then(data => setRooms(data.rooms || []));
  };

  const fetchMessages = (roomId: string) => {
    fetch(`/api/chat?roomId=${roomId}`).then(r => r.json()).then(data => setMessages(data.messages || []));
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const receiverId = activeUser?.id;
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, message: text.trim() }),
    });
    setText("");
    setSending(false);
    if (activeRoom) fetchMessages(activeRoom);
    fetchRooms();
  };

  const startNewChat = async (userId: string, userName: string) => {
    const ids = [currentUserId, userId].sort();
    const roomId = `chat_${ids[0]}_${ids[1]}`;
    setActiveRoom(roomId);
    setActiveUser({ id: userId, name: userName, avatar: null, role: "student" });
    setShowNewChat(false);
    fetchMessages(roomId);
  };

  const loadStudents = () => {
    fetch("/api/students?limit=100").then(r => r.json()).then(data => {
      const students: { id: string; name: string; email: string }[] = [];
      if (data.students) {
        for (const s of data.students) {
          students.push({ id: s.id || s.studentId, name: s.name || s.student?.name, email: s.email || s.student?.email });
        }
      }
      if (data.enrollments) {
        for (const e of data.enrollments) {
          students.push({ id: e.student?.id || e.studentId, name: e.student?.name || "Student", email: e.student?.email || "" });
        }
      }
      setAllStudents(students);
    }).catch(() => {});
    setShowNewChat(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <h1 className="text-2xl font-bold text-white mb-4">Chat / Support</h1>

      <div className="flex flex-1 border rounded-xl bg-transparent overflow-hidden min-h-0">
        {/* Rooms List */}
        <div className={`${activeRoom ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-72 border-r`}>
          <div className="p-3 border-b flex items-center justify-between">
            <span className="font-semibold text-sm">Conversations</span>
            {["admin", "organization"].includes(currentUserRole) && (
              <button onClick={loadStudents} className="text-xs bg-[#0EA5B8] text-white px-2 py-1 rounded">+ New</button>
            )}
          </div>
          {showNewChat && (
            <div className="p-2 border-b bg-transparent max-h-40 overflow-y-auto">
              {allStudents.map(s => (
                <button key={s.id} onClick={() => startNewChat(s.id, s.name)}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-transparent rounded truncate">
                  {s.name} <span className="text-slate-500">({s.email})</span>
                </button>
              ))}
              {allStudents.length === 0 && <p className="text-xs text-slate-500 p-2">No students found</p>}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                {currentUserRole === "student" ? "Send a message to start a conversation with admin" : "No conversations yet"}
              </div>
            ) : rooms.map(room => (
              <button key={room.roomId} onClick={() => { setActiveRoom(room.roomId); setActiveUser(room.otherUser); }}
                className={`w-full text-left p-3 border-b hover:bg-transparent ${activeRoom === room.roomId ? "bg-transparent" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0EA5B8] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {room.otherUser?.name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{room.otherUser?.name || "User"}</span>
                      {room.unread > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{room.unread}</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{room.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${activeRoom ? "flex" : "hidden sm:flex"} flex-col flex-1`}>
          {activeRoom ? (
            <>
              <div className="p-3 border-b flex items-center gap-2">
                <button onClick={() => setActiveRoom(null)} className="sm:hidden text-slate-500 mr-1">←</button>
                <div className="w-8 h-8 rounded-full bg-[#0EA5B8] flex items-center justify-center text-white text-xs font-bold">
                  {activeUser?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold">{activeUser?.name || "User"}</p>
                  <p className="text-xs text-slate-500 capitalize">{activeUser?.role || ""}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-transparent">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      msg.senderId === currentUserId
                        ? "bg-[#0EA5B8] text-white rounded-br-sm"
                        : "bg-transparent border rounded-bl-sm"
                    }`}>
                      <p>{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${msg.senderId === currentUserId ? "text-indigo-200" : "text-slate-500"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={msgEndRef} />
              </div>

              <div className="p-3 border-t flex gap-2">
                <input type="text" value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button onClick={sendMessage} disabled={sending || !text.trim()}
                  className="bg-[#0EA5B8] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student: Direct message to admin */}
      {currentUserRole === "student" && !activeRoom && rooms.length === 0 && (
        <div className="mt-4 text-center">
          <button onClick={() => {
            fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Hello! I need help." }) })
              .then(() => { fetchRooms(); setTimeout(() => fetchRooms(), 1000); });
          }} className="bg-[#0EA5B8] text-white px-6 py-2 rounded-lg text-sm font-medium">
            Start Chat with Admin
          </button>
        </div>
      )}
    </div>
  );
}

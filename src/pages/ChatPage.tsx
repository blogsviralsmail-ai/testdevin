import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { MessageSquare, Send, ArrowLeft, User, Users, Search, Shield, Phone } from 'lucide-react';

interface Conversation { user_id: number; user_name: string; ground_id: number; ground_name: string; last_message: string; last_time: string; unread: number; phone?: string; }
interface Message { id: number; sender_id: number; receiver_id: number; message: string; created_at: string; is_mine: boolean; }
interface Contact { user_id: number; user_name: string; role: string; phone?: string; ground_id?: number; ground_name?: string; }

export default function ChatPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [showContacts, setShowContacts] = useState(true); // Auto-open contacts
  const [contactSearch, setContactSearch] = useState('');
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    loadConversations();
    loadContacts();
  }, []);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await api.getChatConversations();
      const normalized = (Array.isArray(data) ? data : []).map((c: Record<string, unknown>) => ({
        user_id: (c.user_id || c.other_id || 0) as number,
        user_name: String(c.user_name || c.other_name || 'Unknown'),
        ground_id: (c.ground_id || 0) as number,
        ground_name: String(c.ground_name || 'Direct Chat'),
        last_message: String(c.last_message || ''),
        last_time: String(c.last_msg_time || c.last_time || ''),
        unread: (c.unread || 0) as number,
        phone: String(c.phone || ''),
      }));
      setConversations(normalized);
      // If there are conversations, don't auto-show contacts and auto-open first one
      if (normalized.length > 0) {
        setShowContacts(false);
        // Auto-open first conversation
        if (!activeChat) {
          const first = normalized[0];
          try { const msgs = await api.getChatMessages(first.user_id, first.ground_id); setMessages(Array.isArray(msgs) ? msgs : []); } catch { setMessages([]); }
          setActiveChat(first);
        }
      }
    }
    catch { setConversations([]); }
    setLoading(false);
  };

  const loadContacts = async () => {
    try {
      const data = await api.getChatContacts();
      if (Array.isArray(data)) {
        setContacts(data.map((c: Record<string, unknown>) => ({
          user_id: (c.user_id || 0) as number,
          user_name: String(c.user_name || c.name || 'Unknown'),
          role: String(c.role || 'user'),
          phone: String(c.phone || ''),
          ground_id: (c.ground_id || 0) as number,
          ground_name: String(c.ground_name || ''),
        })));
      }
    }
    catch { setContacts([]); }
  };

  const openChat = async (conv: Conversation) => {
    setActiveChat(conv);
    setShowContacts(false);
    try { const data = await api.getChatMessages(conv.user_id, conv.ground_id); setMessages(Array.isArray(data) ? data : []); }
    catch { setMessages([]); }
  };

  const startChatWithContact = (contact: Contact) => {
    const conv: Conversation = {
      user_id: contact.user_id, user_name: contact.user_name,
      ground_id: contact.ground_id || 0, ground_name: contact.ground_name || 'Direct',
      last_message: '', last_time: '', unread: 0, phone: contact.phone || ''
    };
    openChat(conv);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChat) return;
    try {
      await api.sendChat(activeChat.user_id, newMsg, activeChat.ground_id || undefined);
      setNewMsg('');
      const data = await api.getChatMessages(activeChat.user_id, activeChat.ground_id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Failed to send message');
      alert(errMsg);
    }
  };

  // Deduplicate contacts
  const adminContacts = contacts.filter(c => c.role === 'admin');
  const uniqueAdmins: Contact[] = [];
  const seenAdminIds = new Set<number>();
  adminContacts.forEach(c => {
    if (!seenAdminIds.has(c.user_id)) {
      seenAdminIds.add(c.user_id);
      uniqueAdmins.push(c);
    }
  });

  const ownerContacts = contacts.filter(c => c.role === 'owner');
  const userContacts = contacts.filter(c => c.role === 'user');

  const formatPhone = (phone: string) => {
    if (!phone || phone === 'undefined' || phone === 'null') return '';
    return phone;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare size={28} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <button onClick={() => setShowContacts(!showContacts)} className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-blue-700">
            <Users size={16} /> {showContacts ? 'Hide Contacts' : 'New Chat'}
          </button>
        </div>

        {/* Contact List */}
        {showContacts && (
          <div className="bg-white rounded-xl shadow-sm mb-6 border">
            <div className="p-4 border-b">
              <h3 className="font-bold text-gray-800 mb-3">Start New Conversation</h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search contacts..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {/* Admin Section */}
              {uniqueAdmins.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-purple-50 text-purple-700 text-xs font-bold uppercase flex items-center gap-1"><Shield size={12} /> Admin / Support</div>
                  {uniqueAdmins.filter(c => !contactSearch || c.user_name.toLowerCase().includes(contactSearch.toLowerCase())).map(c => (
                    <button key={'admin-' + c.user_id} onClick={() => startChatWithContact(c)} className="w-full text-left px-4 py-3 border-b hover:bg-blue-50 flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">{(c.user_name || 'A')[0]}</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{c.user_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-purple-600">Admin Support</p>
                          {formatPhone(c.phone || '') && <p className="text-xs text-gray-500 flex items-center gap-0.5"><Phone size={10} /> {formatPhone(c.phone || '')}</p>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {/* Owner Section */}
              {ownerContacts.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold uppercase flex items-center gap-1"><User size={12} /> Ground Owners</div>
                  {ownerContacts.filter(c => !contactSearch || c.user_name.toLowerCase().includes(contactSearch.toLowerCase()) || (c.ground_name || '').toLowerCase().includes(contactSearch.toLowerCase())).map((c, idx) => (
                    <button key={'owner-' + c.user_id + '-' + (c.ground_id || 0) + '-' + idx} onClick={() => startChatWithContact(c)} className="w-full text-left px-4 py-3 border-b hover:bg-green-50 flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">{(c.user_name || 'O')[0]}</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{c.user_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{c.ground_name || 'Ground Owner'}</p>
                          {formatPhone(c.phone || '') && <p className="text-xs text-gray-400 flex items-center gap-0.5"><Phone size={10} /> {formatPhone(c.phone || '')}</p>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {/* User Section */}
              {userContacts.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold uppercase flex items-center gap-1"><User size={12} /> Users</div>
                  {userContacts.filter(c => !contactSearch || c.user_name.toLowerCase().includes(contactSearch.toLowerCase())).map((c, idx) => (
                    <button key={'user-' + c.user_id + '-' + idx} onClick={() => startChatWithContact(c)} className="w-full text-left px-4 py-3 border-b hover:bg-blue-50 flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">{(c.user_name || 'U')[0]}</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{c.user_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">User</p>
                          {formatPhone(c.phone || '') && <p className="text-xs text-gray-400 flex items-center gap-0.5"><Phone size={10} /> {formatPhone(c.phone || '')}</p>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {contacts.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No contacts found</p>}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '70vh' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-r flex-shrink-0 ${activeChat ? 'hidden md:block' : ''}`}>
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-bold text-gray-800">Conversations</h3>
              </div>
              <div className="overflow-y-auto" style={{ height: 'calc(70vh - 57px)' }}>
                {loading ? <p className="text-center py-8 text-gray-400">Loading...</p> : conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={40} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No conversations yet</p>
                    <p className="text-xs text-gray-400 mt-1">Select a contact above to start chatting</p>
                  </div>
                ) : conversations.map((c, idx) => (
                  <button key={c.user_id + '-' + c.ground_id + '-' + idx} onClick={() => openChat(c)}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${activeChat?.user_id === c.user_id ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{(c.user_name || 'U')[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{c.user_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 truncate">{c.ground_name}</p>
                          {formatPhone(c.phone || '') && <p className="text-xs text-blue-500 flex items-center gap-0.5"><Phone size={10} /> {formatPhone(c.phone || '')}</p>}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</p>
                      </div>
                      {c.unread > 0 && <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">{c.unread}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
              {activeChat ? (
                <>
                  <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
                    <button onClick={() => setActiveChat(null)} className="md:hidden text-gray-500"><ArrowLeft size={20} /></button>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">{(activeChat.user_name || 'U')[0]}</div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{activeChat.user_name}</p>
                      <p className="text-xs text-gray-500">{activeChat.ground_name}{activeChat.phone ? ` | ${activeChat.phone}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No messages yet. Start the conversation!</p>}
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.is_mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                          <p>{typeof m.message === 'string' ? m.message : String(m.message || '')}</p>
                          <p className={`text-xs mt-1 ${m.is_mine ? 'text-blue-200' : 'text-gray-400'}`}>{(m.created_at || '').split('T')[1]?.substring(0, 5) || (m.created_at || '').split(' ')[1]?.substring(0, 5) || ''}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEnd} />
                  </div>
                  <div className="p-4 border-t flex gap-2">
                    <input type="text" placeholder="Type a message..." className="flex-1 border rounded-xl px-4 py-2.5 outline-none focus:border-blue-400"
                      value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                    <button onClick={sendMessage} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700"><Send size={18} /></button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <User size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Select a conversation or start a new chat</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

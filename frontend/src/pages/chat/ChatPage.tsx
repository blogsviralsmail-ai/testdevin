import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import {
  Search, Paperclip, Smile, Send, Phone, Video, MoreVertical,
  Image, FileText, Mic, Check, CheckCheck, Clock, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

export default function ChatPage() {
  const { contactUid } = useParams();
  const { contacts, activeContact, messages, isTyping, setContacts, setActiveContact, setMessages } = useChatStore();
  const { joinChat, leaveChat, sendTyping } = useSocket();
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const { data } = await api.get('/whatsapp/contacts');
        setContacts(data.data || data);
      } catch (err) { console.error('Failed to load contacts', err); }
    };
    loadContacts();
  }, [setContacts]);

  // Load messages when contact changes
  useEffect(() => {
    if (activeContact) {
      const loadMessages = async () => {
        try {
          const { data } = await api.get(`/whatsapp/messages/${activeContact._id}`);
          setMessages(data.data || data);
          joinChat(activeContact._id);
          // Mark as read
          api.post(`/whatsapp/mark-read/${activeContact._id}`);
        } catch (err) { console.error('Failed to load messages', err); }
      };
      loadMessages();
      return () => { leaveChat(activeContact._id); };
    }
  }, [activeContact, setMessages, joinChat, leaveChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeContact) return;
    setLoading(true);
    try {
      await api.post('/whatsapp/send/text', {
        contactId: activeContact._id,
        message: messageText,
      });
      setMessageText('');
    } catch (err) { console.error('Failed to send message', err); }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectContact = (contact: typeof activeContact) => {
    setActiveContact(contact);
    setShowMobileChat(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check size={14} className="text-gray-400" />;
      case 'delivered': return <CheckCheck size={14} className="text-gray-400" />;
      case 'read': return <CheckCheck size={14} className="text-blue-500" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  const filteredContacts = contacts.filter((c) =>
    `${c.first_name} ${c.last_name} ${c.wa_id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden -m-4 lg:-m-6">
      {/* Contact List (Left Panel) */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-slate-700 flex flex-col
        ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact._id}
              onClick={() => selectContact(contact)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition
                ${activeContact?._id === contact._id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 font-medium text-sm shrink-0">
                {contact.first_name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm dark:text-white truncate">
                    {contact.first_name} {contact.last_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {contact.last_message_at ? format(new Date(contact.last_message_at), 'HH:mm') : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.wa_id}</span>
                  {contact.unread_count > 0 && (
                    <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {contact.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area (Right Panel) */}
      <div className={`flex-1 flex flex-col ${!showMobileChat && !activeContact ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMobileChat(false)} className="md:hidden text-gray-500">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 font-medium">
                  {activeContact.first_name?.[0] || '?'}
                </div>
                <div>
                  <h3 className="font-medium dark:text-white">{activeContact.first_name} {activeContact.last_name}</h3>
                  <p className="text-xs text-gray-500">{activeContact.wa_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500"><Phone size={18} /></button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500"><Video size={18} /></button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900/50">
              {messages.map((msg) => (
                <div key={msg._id} className={`flex ${msg.is_incoming_message === 1 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] px-4 py-2 shadow-sm ${
                    msg.is_incoming_message === 1
                      ? 'chat-bubble-incoming'
                      : 'chat-bubble-outgoing'
                  }`}>
                    {msg.media_url && msg.message_type === 'image' && (
                      <img src={msg.media_url} alt="" className="rounded-lg mb-2 max-w-full" />
                    )}
                    <p className="text-sm dark:text-white whitespace-pre-wrap">{msg.message}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {msg.messaged_at ? format(new Date(msg.messaged_at), 'HH:mm') : ''}
                      </span>
                      {msg.is_incoming_message === 0 && getStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="chat-bubble-incoming px-4 py-2">
                    <div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                  <Smile size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-lg border-none outline-none text-sm dark:text-white"
                />
                <button className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                  <Mic size={20} />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || loading}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquareIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

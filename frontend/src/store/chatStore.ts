import { create } from 'zustand';

interface Contact {
  _id: number;
  _uid: string;
  first_name: string;
  last_name: string;
  wa_id: string;
  unread_count: number;
  last_message_at: string;
}

interface Message {
  _id: number;
  _uid: string;
  message: string;
  message_type: string;
  is_incoming_message: number;
  status: string;
  messaged_at: string;
  media_url?: string;
}

interface ChatState {
  contacts: Contact[];
  activeContact: Contact | null;
  messages: Message[];
  isTyping: boolean;
  searchQuery: string;
  setContacts: (contacts: Contact[]) => void;
  setActiveContact: (contact: Contact | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: number, status: string) => void;
  setTyping: (isTyping: boolean) => void;
  setSearchQuery: (query: string) => void;
  updateContactUnread: (contactId: number, count: number) => void;
  moveContactToTop: (contactId: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  contacts: [],
  activeContact: null,
  messages: [],
  isTyping: false,
  searchQuery: '',
  setContacts: (contacts) => set({ contacts }),
  setActiveContact: (contact) => set({ activeContact: contact }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessageStatus: (messageId, status) =>
    set((state) => ({
      messages: state.messages.map((m) => (m._id === messageId ? { ...m, status } : m)),
    })),
  setTyping: (isTyping) => set({ isTyping }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  updateContactUnread: (contactId, count) =>
    set((state) => ({
      contacts: state.contacts.map((c) => (c._id === contactId ? { ...c, unread_count: count } : c)),
    })),
  moveContactToTop: (contactId) =>
    set((state) => {
      const contact = state.contacts.find((c) => c._id === contactId);
      if (!contact) return state;
      return { contacts: [contact, ...state.contacts.filter((c) => c._id !== contactId)] };
    }),
}));

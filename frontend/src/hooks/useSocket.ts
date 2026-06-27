import { useEffect, useCallback } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '../services/socket';
import { useChatStore } from '../store/chatStore';

export function useSocket() {
  useEffect(() => {
    const socket = connectSocket();

    socket.on('new_message', (data) => {
      const store = useChatStore.getState();
      if (store.activeContact && data.contactId === store.activeContact._id) {
        store.addMessage(data);
      }
      store.moveContactToTop(data.contactId || data.contact?.id);
      if (data.isIncoming) {
        store.updateContactUnread(data.contactId || data.contact?.id, (data.unreadCount || 0) + 1);
      }
    });

    socket.on('message_status', (data) => {
      useChatStore.getState().updateMessageStatus(data.messageId, data.status);
    });

    socket.on('typing_indicator', (data) => {
      useChatStore.getState().setTyping(data.isTyping);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const sendMessage = useCallback((contactId: number, message: string, type = 'text') => {
    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', { contactId, message, type });
    }
  }, []);

  const joinChat = useCallback((contactId: number) => {
    const socket = getSocket();
    if (socket) socket.emit('join_chat', { contactId });
  }, []);

  const leaveChat = useCallback((contactId: number) => {
    const socket = getSocket();
    if (socket) socket.emit('leave_chat', { contactId });
  }, []);

  const markRead = useCallback((contactId: number, messageIds: string[]) => {
    const socket = getSocket();
    if (socket) socket.emit('mark_read', { contactId, messageIds });
  }, []);

  const sendTyping = useCallback((contactId: number, isTyping: boolean) => {
    const socket = getSocket();
    if (socket) socket.emit('typing', { contactId, isTyping });
  }, []);

  return { sendMessage, joinChat, leaveChat, markRead, sendTyping };
}

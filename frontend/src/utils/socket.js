import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { LOCAL_API_URL } from '../config/env';

let socket = null;

export const initSocket = () => {
  const token = useAuthStore.getState().token;
  
  if (!token) return null;
  
  if (socket?.connected) return socket;

  socket = io(LOCAL_API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToMessages = (callback) => {
  if (!socket) return;
  socket.on('new_message', callback);
  return () => socket.off('new_message', callback);
};

export const subscribeToNotifications = (callback) => {
  if (!socket) return;
  socket.on('notification', callback);
  return () => socket.off('notification', callback);
};

export const subscribeToDeliveryUpdates = (deliveryId, callback) => {
  if (!socket) return;
  socket.emit('track_delivery', deliveryId);
  socket.on('delivery_update', callback);
  socket.on('location_update', callback);
  return () => {
    socket.off('delivery_update', callback);
    socket.off('location_update', callback);
  };
};

export const sendMessage = (chatId, message, recipientId) => {
  if (!socket) return;
  socket.emit('send_message', { chatId, message, recipientId });
};

export const joinChat = (chatId) => {
  if (!socket) return;
  socket.emit('join_chat', chatId);
};

export const leaveChat = (chatId) => {
  if (!socket) return;
  socket.emit('leave_chat', chatId);
};

export const emitTyping = (chatId) => {
  if (!socket) return;
  socket.emit('typing', { chatId });
};

export const emitStopTyping = (chatId) => {
  if (!socket) return;
  socket.emit('stop_typing', { chatId });
};

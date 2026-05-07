import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

export const useChat = (userId, roomId = null) => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef({});

  const { sendMessage: sendWsMessage, isConnected: wsConnected } = useWebSocket(
    process.env.REACT_APP_CHAT_WS_URL || 'wss://api.mkulimalink.com/chat',
    {
      onOpen: () => {
        setIsConnected(true);
        // Join room
        sendWsMessage({
          type: 'join',
          userId,
          roomId,
        });
      },
      onClose: () => {
        setIsConnected(false);
      },
      onMessage: (data) => {
        handleIncomingMessage(data);
      },
    }
  );

  const handleIncomingMessage = useCallback((data) => {
    switch (data.type) {
      case 'message':
        setMessages((prev) => [...prev, data.payload]);
        if (data.payload.senderId !== userId) {
          setUnreadCount((prev) => prev + 1);
        }
        break;
      
      case 'typing':
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
        
        // Clear typing indicator after delay
        clearTimeout(typingTimeoutRef.current[data.userId]);
        typingTimeoutRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }, 3000);
        break;
      
      case 'read_receipt':
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, read: true } : msg
          )
        );
        break;
      
      case 'user_joined':
        setMessages((prev) => [
          ...prev,
          {
            type: 'system',
            content: `${data.username} joined the chat`,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;
      
      case 'user_left':
        setMessages((prev) => [
          ...prev,
          {
            type: 'system',
            content: `${data.username} left the chat`,
            timestamp: new Date().toISOString(),
          },
        ]);
        break;
      
      default:
        break;
    }
  }, [userId]);

  const sendMessage = useCallback(
    (content, messageType = 'text') => {
      const message = {
        type: 'message',
        payload: {
          id: Date.now().toString(),
          senderId: userId,
          roomId,
          content,
          messageType,
          timestamp: new Date().toISOString(),
          read: false,
        },
      };

      sendWsMessage(message);
      setMessages((prev) => [...prev, message.payload]);
    },
    [userId, roomId, sendWsMessage]
  );

  const sendTypingIndicator = useCallback(() => {
    sendWsMessage({
      type: 'typing',
      userId,
      roomId,
    });
  }, [userId, roomId, sendWsMessage]);

  const markAsRead = useCallback(
    (messageId) => {
      sendWsMessage({
        type: 'read_receipt',
        messageId,
        userId,
        roomId,
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [userId, roomId, sendWsMessage]
  );

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
  }, []);

  return {
    messages,
    unreadCount,
    typingUsers,
    isConnected,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    markAllAsRead,
    clearHistory,
  };
};

// Hook for chat conversations list
export const useConversations = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // In production, fetch from API
      // const response = await api.get(`/api/chat/conversations/${userId}`);
      // setConversations(response.data);
      
      // Mock data
      setConversations([
        {
          id: 'conv1',
          participant: {
            id: 'user1',
            name: 'John Mwangi',
            avatar: null,
            isOnline: true,
          },
          lastMessage: {
            content: 'Is the maize still available?',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            unread: true,
          },
          unreadCount: 2,
          product: {
            id: 'prod1',
            name: 'Premium Maize',
            image: null,
          },
        },
        {
          id: 'conv2',
          participant: {
            id: 'user2',
            name: 'Sarah Ochieng',
            avatar: null,
            isOnline: false,
          },
          lastMessage: {
            content: 'Thank you for the purchase!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            unread: false,
          },
          unreadCount: 0,
          product: {
            id: 'prod2',
            name: 'Fresh Tomatoes',
            image: null,
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const startConversation = useCallback(async (participantId, productId) => {
    // Create new conversation
    const newConversation = {
      id: `conv_${Date.now()}`,
      participant: {
        id: participantId,
        name: 'New Contact',
        isOnline: true,
      },
      lastMessage: null,
      unreadCount: 0,
      product: {
        id: productId,
        name: 'Product',
      },
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversation(newConversation);
    
    return newConversation;
  }, []);

  const archiveConversation = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.filter((conv) => conv.id !== conversationId)
    );
  }, []);

  return {
    conversations,
    isLoading,
    activeConversation,
    setActiveConversation,
    fetchConversations,
    startConversation,
    archiveConversation,
  };
};

// Chat message types for formatting
export const MessageTypes = {
  TEXT: 'text',
  IMAGE: 'image',
  PRODUCT: 'product',
  LOCATION: 'location',
  OFFER: 'offer',
  SYSTEM: 'system',
};

// Format message timestamp
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than 24 hours
  if (diff < 1000 * 60 * 60 * 24) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  
  // Less than 7 days
  if (diff < 1000 * 60 * 60 * 24 * 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  // Default
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default useChat;

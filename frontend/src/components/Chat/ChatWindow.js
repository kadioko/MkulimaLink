import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image, MapPin, Phone, MoreVertical } from 'lucide-react';
import { useChat, formatMessageTime } from '../../hooks/useChat';
import OptimizedImage from '../OptimizedImage';

const ChatWindow = ({ 
  isOpen, 
  onClose, 
  userId, 
  roomId, 
  recipient,
  product = null,
}) => {
  const {
    messages,
    unreadCount,
    typingUsers,
    isConnected,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    markAllAsRead,
  } = useChat(userId, roomId);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when window opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  const handleSend = (e) => {
    e.preventDefault();
    const content = inputRef.current.value.trim();
    if (!content) return;

    sendMessage(content);
    inputRef.current.value = '';
  };

  const handleTyping = () => {
    sendTypingIndicator();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-green-600">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 font-bold">
                  {recipient.name?.[0]?.toUpperCase()}
                </div>
                {recipient.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{recipient.name}</h3>
                <p className="text-xs text-green-100">
                  {isConnected ? (recipient.isOnline ? 'Online' : 'Offline') : 'Connecting...'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Product context */}
          {product && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                  {product.image ? (
                    <OptimizedImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-sm text-green-600">{product.price} {product.currency}</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || index}
                message={msg}
                isOwn={msg.senderId === userId}
              />
            ))}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-100">•</span>
                <span className="animate-bounce delay-200">•</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
                <Image size={20} />
              </button>
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600">
                <MapPin size={20} />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                onChange={handleTyping}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MessageBubble = ({ message, isOwn }) => {
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-green-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
        }`}
      >
        <p>{message.content}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
          {formatMessageTime(message.timestamp)}
          {isOwn && message.read && <span className="ml-1">✓✓</span>}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatWindow;

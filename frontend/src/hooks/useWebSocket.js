import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const intentionallyClosedRef = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);
    intentionallyClosedRef.current = false;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectCountRef.current = 0;
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          data = event.data;
        }
        onMessage?.(data, event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.(event);

        if (!intentionallyClosedRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * reconnectCountRef.current);
        }
      };

      ws.onerror = (error) => {
        onError?.(error);
      };
    } catch (error) {
      setIsConnecting(false);
      onError?.(error);
    }
  }, [url, onOpen, onMessage, onClose, onError, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    intentionallyClosedRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
  };
};

// Hook specifically for real-time notifications
export const useRealtimeNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected, sendMessage } = useWebSocket(
    process.env.REACT_APP_WS_URL || 'wss://api.mkulimalink.com/ws',
    {
      onOpen: () => {
        // Subscribe to user notifications
        sendMessage({ type: 'subscribe', userId });
      },
      onMessage: (data) => {
        if (data.type === 'notification') {
          setNotifications(prev => [data.payload, ...prev]);
          setUnreadCount(prev => prev + 1);
        } else if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        }
      },
    }
  );

  const markAsRead = useCallback((notificationId) => {
    sendMessage({ type: 'mark_read', notificationId });
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [sendMessage]);

  const markAllAsRead = useCallback(() => {
    sendMessage({ type: 'mark_all_read' });
    setUnreadCount(0);
  }, [sendMessage]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
};

export default useWebSocket;

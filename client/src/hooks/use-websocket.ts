import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

interface UseWebSocketResult {
  connected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
}

export function useWebSocket(): UseWebSocketResult {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) {
      // Not authenticated, don't connect
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
      
      // Send authentication message
      sendAuthMessage();
    };

    socket.onclose = () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
        console.log('WebSocket message received:', message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      socket.close();
    };
  }, [user]);

  // Send authentication message when connected
  const sendAuthMessage = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && user) {
      socketRef.current.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    }
  }, [user]);

  // Send a message over the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    connected,
    lastMessage,
    sendMessage
  };
}

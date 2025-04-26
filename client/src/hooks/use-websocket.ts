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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function for websocket and timeout
  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Don't try to connect if user isn't authenticated
    if (!user) {
      cleanup();
      return;
    }

    const connectWebSocket = () => {
      try {
        // Clear any existing connection
        cleanup();
        
        // Get the host without port
        const host = window.location.hostname;
        // Use the default port for the server (5000)
        const port = "5000";
        // Use the appropriate protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        
        // Construct a valid WebSocket URL
        const wsUrl = `${protocol}//${host}:${port}/ws`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          setConnected(true);
          console.log('WebSocket connected successfully');
          
          // Send authentication message
          if (user) {
            socket.send(JSON.stringify({
              type: 'auth',
              userId: user.id
            }));
          }
        };

        socket.onclose = (event) => {
          setConnected(false);
          console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
          
          // Attempt to reconnect after a delay
          reconnectTimeoutRef.current = setTimeout(() => {
            if (user) connectWebSocket();
          }, 5000);
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
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        
        // Try to reconnect after a delay
        reconnectTimeoutRef.current = setTimeout(() => {
          if (user) connectWebSocket();
        }, 5000);
      }
    };

    // Initialize connection
    connectWebSocket();

    // Clean up on unmount
    return cleanup;
  }, [user, cleanup]);

  // Send a message over the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  }, []);

  return {
    connected,
    lastMessage,
    sendMessage
  };
}

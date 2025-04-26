import { useState, useEffect, useCallback, useRef } from 'react';
import { WS_MESSAGE_TYPES } from '@/lib/constants';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketResult {
  connected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  error: string | null;
}

export function useWebSocket(): UseWebSocketResult {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Create WebSocket connection using the correct protocol based on the current page
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setError(null);
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 5000);
      };
      
      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Failed to connect to server. Please try again later.');
        socket.close();
      };
      
      socketRef.current = socket;
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setError('Failed to initialize connection to server.');
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
    }
  }, []);

  // Connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Keep alive ping
  useEffect(() => {
    let pingInterval: number | null = null;
    
    if (connected) {
      // Send ping every 30 seconds to keep connection alive
      pingInterval = window.setInterval(() => {
        sendMessage({ type: WS_MESSAGE_TYPES.PING });
      }, 30000);
    }
    
    return () => {
      if (pingInterval) {
        window.clearInterval(pingInterval);
      }
    };
  }, [connected, sendMessage]);

  return {
    connected,
    sendMessage,
    lastMessage,
    error
  };
}
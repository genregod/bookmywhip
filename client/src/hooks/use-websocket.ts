import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_MESSAGE_TYPES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';

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

interface UseSocketOptions {
  namespace?: string;
  autoConnect?: boolean;
  mockMode?: boolean;
}

// Default options
const defaultOptions: UseSocketOptions = {
  namespace: '/riders', // Default to rider namespace
  autoConnect: true,
  mockMode: false // Set to true for demo/testing without actual connection
};

export function useWebSocket(options: UseSocketOptions = defaultOptions): UseWebSocketResult {
  const mergedOptions = { ...defaultOptions, ...options };
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    if (mergedOptions.mockMode) {
      console.log('Socket.IO in mock mode - No actual connection established');
      setConnected(true);
      return () => {};
    }
    
    if (!mergedOptions.autoConnect) {
      return () => {};
    }
    
    try {
      // Determine the WebSocket URL based on current protocol/host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      // Create Socket.IO connection with namespacing
      console.log(`Connecting to Socket.IO at ${protocol}//${host}/ws${mergedOptions.namespace}`);
      
      socketRef.current = io(mergedOptions.namespace!, {
        path: '/ws',
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
      // Connection event handlers
      socketRef.current.on('connect', () => {
        console.log('Socket.IO connected:', socketRef.current?.id);
        setConnected(true);
        setError(null);
        
        // Authenticate if we have a user
        if (user && user.id) {
          socketRef.current?.emit('auth', { userId: user.id });
        }
      });
      
      socketRef.current.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err.message);
        setError(`Connection error: ${err.message}`);
        setConnected(false);
      });
      
      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        setConnected(false);
      });
      
      socketRef.current.on('error', (err) => {
        console.error('Socket.IO error:', err);
        setError(`Socket error: ${err.message || JSON.stringify(err)}`);
      });
      
      // Listen for socket events and update lastMessage
      [
        'ride_accepted', 
        'ride_started', 
        'ride_completed', 
        'ride_cancelled',
        'driver_location_update',
        'driver_status_update'
      ].forEach(eventType => {
        socketRef.current?.on(eventType, (data) => {
          console.log(`Socket.IO event received: ${eventType}`, data);
          setLastMessage({
            type: eventType,
            ...data
          });
        });
      });
      
      // Custom event listeners
      socketRef.current.on('connect_success', (data) => {
        console.log('Socket.IO connect success:', data.message);
      });
      
      socketRef.current.on('auth_success', (data) => {
        console.log('Socket.IO authentication successful for user:', data.userId);
      });
      
      // Connect to the socket server
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      
      // Clean up the socket connection when component unmounts
      return () => {
        if (socketRef.current) {
          console.log('Cleaning up Socket.IO connection');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (err: any) {
      console.error('Error setting up Socket.IO:', err);
      setError(`Failed to connect: ${err.message}`);
      return () => {};
    }
  }, [mergedOptions.namespace, mergedOptions.autoConnect, mergedOptions.mockMode, user]);
  
  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (mergedOptions.mockMode) {
      console.log('Mock Socket.IO - Message sent:', message);
      
      // If it's a ping, simulate a pong response
      if (message.type === WS_MESSAGE_TYPES.PING) {
        setTimeout(() => {
          setLastMessage({
            type: WS_MESSAGE_TYPES.PONG,
            timestamp: Date.now()
          });
        }, 100);
      }
      return;
    }
    
    if (!socketRef.current || !connected) {
      console.warn('Cannot send message - socket not connected');
      return;
    }
    
    try {
      // Convert message.type to an event name and rest of the data as payload
      const { type, ...payload } = message;
      console.log(`Emitting Socket.IO event: ${type}`, payload);
      socketRef.current.emit(type, payload);
    } catch (err: any) {
      console.error('Error sending Socket.IO message:', err);
      setError(`Failed to send message: ${err.message}`);
    }
  }, [connected, mergedOptions.mockMode]);
  
  return {
    connected,
    sendMessage,
    lastMessage,
    error
  };
}
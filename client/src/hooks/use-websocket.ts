import { useState } from 'react';
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

// This is a mock version of the WebSocket hook for the demo
// It doesn't actually connect to any WebSocket server
export function useWebSocket(): UseWebSocketResult {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Mock send message function
  const sendMessage = (message: WebSocketMessage) => {
    console.log('Mock WebSocket - Message sent:', message);
    
    // If it's a ping, simulate a pong response
    if (message.type === WS_MESSAGE_TYPES.PING) {
      setTimeout(() => {
        setLastMessage({
          type: WS_MESSAGE_TYPES.PONG,
          timestamp: Date.now()
        });
      }, 100);
    }
  };

  return {
    connected: true, // Always pretend to be connected
    sendMessage,
    lastMessage,
    error: null
  };
}
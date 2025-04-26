import { useState, useCallback } from 'react';

export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

export interface UseWebSocketResult {
  connected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
}

// This hook has been completely disabled due to WebSocket connection issues
// In a real application, this would be replaced with a working WebSocket implementation
export function useWebSocket(): UseWebSocketResult {
  const [connected] = useState(false);
  const [lastMessage] = useState<WebSocketMessage | null>(null);
  
  // Dummy message sender
  const sendMessage = useCallback((message: WebSocketMessage) => {
    console.log('WebSocket is disabled. Message not sent:', message);
  }, []);

  return {
    connected,
    lastMessage,
    sendMessage
  };
}

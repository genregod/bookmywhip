import { useState, useEffect, useCallback, useRef } from 'react';
import { MobileWebSocketManager, createMobileWebSocketManager, ConnectionState, MessageType } from '@/lib/mobileWebSocket';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

/**
 * Hook for managing WebSocket connections in mobile applications
 * This hook provides a simple interface for interacting with the BookMyWhip WebSocket API
 */
export function useMobileWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const webSocketRef = useRef<MobileWebSocketManager | null>(null);
  const { user } = useAuth();
  
  /**
   * Initialize and connect to the WebSocket server
   */
  const connect = useCallback(async (serverUrl?: string) => {
    if (webSocketRef.current) {
      // Already have a connection or connecting
      if (webSocketRef.current.getState() === ConnectionState.CONNECTED) {
        return;
      }
    }
    
    setIsConnecting(true);
    
    try {
      const token = user?.id ? `user_${user.id}` : undefined;
      const wsManager = createMobileWebSocketManager(serverUrl, token);
      
      webSocketRef.current = wsManager;
      
      // Register event handlers
      wsManager.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
      });
      
      wsManager.on('disconnect', () => {
        setIsConnected(false);
      });
      
      wsManager.on('reconnect', () => {
        setIsConnected(true);
        toast({
          title: "Reconnected",
          description: "Connection to server restored",
        });
      });
      
      wsManager.on('error', (error: any) => {
        console.error("WebSocket error:", error);
        toast({
          title: "Connection Error",
          description: "Problem connecting to BookMyWhip server",
          variant: "destructive"
        });
      });
      
      await wsManager.connect();
    } catch (error) {
      console.error("Failed to connect to WebSocket server:", error);
      setIsConnecting(false);
      
      toast({
        title: "Connection Failed",
        description: "Could not connect to BookMyWhip server",
        variant: "destructive"
      });
    }
  }, [user]);
  
  /**
   * Disconnect from the WebSocket server
   */
  const disconnect = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.disconnect();
      webSocketRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  /**
   * Subscribe to specific message types
   */
  const subscribe = useCallback((type: string, handler: (data: any) => void) => {
    if (webSocketRef.current) {
      webSocketRef.current.subscribe(type, handler);
    }
  }, []);
  
  /**
   * Unsubscribe from specific message types
   */
  const unsubscribe = useCallback((type: string, handler?: (data: any) => void) => {
    if (webSocketRef.current) {
      webSocketRef.current.unsubscribe(type, handler);
    }
  }, []);
  
  /**
   * Send a message through the WebSocket
   */
  const send = useCallback((type: string, data: any = {}) => {
    if (webSocketRef.current) {
      webSocketRef.current.send(type, data);
    } else {
      toast({
        title: "Not Connected",
        description: "Cannot send message: not connected to server",
        variant: "destructive"
      });
    }
  }, []);
  
  /**
   * Send a ride request update
   */
  const sendRideUpdate = useCallback((rideId: number, status: string, data: any = {}) => {
    send(MessageType.RIDE_UPDATE, {
      rideId,
      status,
      ...data
    });
  }, [send]);
  
  /**
   * Send a driver location update
   */
  const sendDriverLocation = useCallback((latitude: number, longitude: number, heading?: number, speed?: number) => {
    send(MessageType.DRIVER_LOCATION, {
      latitude,
      longitude,
      heading,
      speed,
      timestamp: new Date().toISOString()
    });
  }, [send]);
  
  /**
   * Send a chat message
   */
  const sendChatMessage = useCallback((rideId: number, message: string, toUserId?: number) => {
    send(MessageType.CHAT_MESSAGE, {
      rideId,
      message,
      toUserId,
      timestamp: new Date().toISOString()
    });
  }, [send]);
  
  /**
   * Toggle background mode (for battery savings)
   */
  const setBackgroundMode = useCallback((enabled: boolean) => {
    if (webSocketRef.current) {
      webSocketRef.current.setBackgroundMode(enabled);
    }
  }, []);
  
  /**
   * Toggle battery saver mode
   */
  const setBatterySaverMode = useCallback((enabled: boolean) => {
    if (webSocketRef.current) {
      webSocketRef.current.setBatterySaverMode(enabled);
    }
  }, []);
  
  // Auto-connect when the hook is initialized and user is available
  useEffect(() => {
    if (user) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);
  
  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    sendRideUpdate,
    sendDriverLocation,
    sendChatMessage,
    setBackgroundMode,
    setBatterySaverMode
  };
}
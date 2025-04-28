/**
 * Real-time tracking service using WebSocket
 * This service provides real-time communication for ride tracking,
 * status updates, and notifications.
 */

import { API_CONFIG } from '../utils/config';

// WebSocket event types
export enum WebSocketEventType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  LOCATION_UPDATE = 'location_update',
  RIDE_STATUS_CHANGE = 'ride_status_change',
  DRIVER_ASSIGNED = 'driver_assigned',
  MESSAGE = 'message',
  ERROR = 'error',
}

// WebSocket message interface
export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
}

// Location update data
export interface LocationUpdate {
  userId: number;
  rideId: number;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: number;
}

// Ride status update data
export interface RideStatusUpdate {
  rideId: number;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  timestamp: number;
}

// WebSocket event callback type
export type WebSocketEventCallback = (data: any) => void;

/**
 * Real-time tracking service using WebSocket
 */
class RealTimeTrackingService {
  private socket: WebSocket | null = null;
  private eventListeners: Map<WebSocketEventType, WebSocketEventCallback[]> = new Map();
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;

  /**
   * Connect to the WebSocket server
   * @param userId User ID
   * @param authToken Authentication token
   */
  connect(userId: number, authToken: string): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    try {
      // Determine WebSocket protocol based on current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Determine the host based on the API config
      const baseUrl = API_CONFIG.BASE_URL.replace(/^https?:\/\//, '');
      
      // Construct WebSocket URL
      const wsUrl = `${protocol}//${baseUrl}/ws?userId=${userId}&auth=${authToken}`;
      
      // Create WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // WebSocket event listeners
      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.triggerEvent(WebSocketEventType.CONNECT, { connected: true });
        console.log('WebSocket connected');
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.triggerEvent(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        this.isConnecting = false;
        this.triggerEvent(WebSocketEventType.DISCONNECT, { connected: false });
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
      
      this.socket.onerror = (error) => {
        this.isConnecting = false;
        this.triggerEvent(WebSocketEventType.ERROR, { error });
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      this.isConnecting = false;
      console.error('Error connecting to WebSocket:', error);
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    this.reconnectAttempts = 0;
  }

  /**
   * Send a location update
   * @param update Location update data
   */
  sendLocationUpdate(update: LocationUpdate): void {
    this.sendMessage({
      type: WebSocketEventType.LOCATION_UPDATE,
      data: update,
    });
  }

  /**
   * Add an event listener
   * @param eventType Event type
   * @param callback Callback function
   */
  on(eventType: WebSocketEventType, callback: WebSocketEventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove an event listener
   * @param eventType Event type
   * @param callback Callback function to remove
   */
  off(eventType: WebSocketEventType, callback: WebSocketEventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      return;
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Check if WebSocket is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message to the WebSocket server
   * @param message WebSocket message
   */
  private sendMessage(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      console.warn('WebSocket not connected. Cannot send message.');
      return;
    }
    
    try {
      this.socket!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  /**
   * Trigger an event
   * @param eventType Event type
   * @param data Event data
   */
  private triggerEvent(eventType: WebSocketEventType, data: any): void {
    if (!this.eventListeners.has(eventType)) {
      return;
    }
    
    for (const callback of this.eventListeners.get(eventType)!) {
      callback(data);
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }
    
    this.reconnectAttempts++;
    
    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeoutId = setTimeout(() => {
      if (this.isConnecting) {
        return;
      }
      
      // Need to reimplement the connect logic with the same userId and authToken
      // For now, we'll just notify that reconnection is needed
      this.triggerEvent(WebSocketEventType.ERROR, {
        error: 'Reconnection required. User authentication needed.',
        reconnectRequired: true,
      });
    }, delay);
  }
}

export default new RealTimeTrackingService();
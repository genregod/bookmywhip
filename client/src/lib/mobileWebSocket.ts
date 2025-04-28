/**
 * Mobile-optimized WebSocket client for BookMyWhip
 * 
 * This client manages WebSocket connections for mobile applications,
 * with special attention to mobile-specific concerns:
 * - Battery efficiency
 * - Intermittent connectivity
 * - Background operation modes
 */

import { toast } from "@/hooks/use-toast";

// Connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting'
}

// Message types for the WebSocket protocol
export enum MessageType {
  AUTHENTICATION = 'auth',
  RIDE_UPDATE = 'ride_update',
  DRIVER_LOCATION = 'driver_location',
  CHAT_MESSAGE = 'chat_message',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

// WebSocket manager configuration
interface WebSocketConfig {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  useCompression?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
  token?: string;
  mobileMode?: 'active' | 'background' | 'battery-saver';
}

// Default configuration with mobile-optimized settings
const DEFAULT_CONFIG: WebSocketConfig = {
  url: '',
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  useCompression: true,
  logLevel: 'info',
  mobileMode: 'active'
};

export class MobileWebSocketManager {
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private pendingMessages: any[] = [];
  private handlers: {
    onConnect: (() => void) | null;
    onDisconnect: (() => void) | null;
    onReconnect: (() => void) | null;
    onError: ((error: any) => void) | null;
  } = {
    onConnect: null,
    onDisconnect: null,
    onReconnect: null,
    onError: null
  };

  constructor(config: WebSocketConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Apply mobile-specific optimizations
    if (this.config.mobileMode === 'background') {
      // When in background mode, reduce frequency of operations
      this.config.heartbeatInterval = 60000; // 1 minute
      this.config.reconnectInterval = 10000; // 10 seconds
    } else if (this.config.mobileMode === 'battery-saver') {
      // In battery saver mode, minimize network activity
      this.config.heartbeatInterval = 120000; // 2 minutes
      this.config.reconnectInterval = 20000; // 20 seconds
      this.config.maxReconnectAttempts = 5;
    }
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.changeState(ConnectionState.CONNECTING);
      this.log('info', 'Connecting to WebSocket server...');
      
      try {
        // Use compression if supported and enabled
        const options = this.config.useCompression ? { compression: true } : undefined;
        this.socket = new WebSocket(this.config.url, options);
        
        this.socket.onopen = () => {
          this.onConnected();
          resolve();
        };
        
        this.socket.onclose = (event) => {
          this.onDisconnected(event);
          if (!event.wasClean && this.connectionState === ConnectionState.CONNECTING) {
            reject(new Error(`Connection failed: ${event.code} ${event.reason}`));
          }
        };
        
        this.socket.onerror = (error) => {
          this.log('error', 'WebSocket error:', error);
          if (this.handlers.onError) {
            this.handlers.onError(error);
          }
          if (this.connectionState === ConnectionState.CONNECTING) {
            reject(error);
          }
        };
        
        this.socket.onmessage = (event) => this.handleMessage(event);
      } catch (error) {
        this.log('error', 'Failed to create WebSocket:', error);
        this.changeState(ConnectionState.DISCONNECTED);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.stopHeartbeat();
    this.stopReconnectTimer();
    
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN || 
            this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
        }
      } catch (error) {
        this.log('error', 'Error during disconnect:', error);
      }
      
      this.socket = null;
    }
    
    this.changeState(ConnectionState.DISCONNECTED);
    this.log('info', 'Disconnected from WebSocket server');
  }

  /**
   * Register event handlers
   */
  public on(event: 'connect' | 'disconnect' | 'reconnect' | 'error', callback: any): void {
    switch (event) {
      case 'connect':
        this.handlers.onConnect = callback;
        break;
      case 'disconnect':
        this.handlers.onDisconnect = callback;
        break;
      case 'reconnect':
        this.handlers.onReconnect = callback;
        break;
      case 'error':
        this.handlers.onError = callback;
        break;
    }
  }

  /**
   * Subscribe to specific message types
   * @param type Message type to subscribe to
   * @param handler Function to handle messages of this type
   */
  public subscribe(type: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    this.messageHandlers.get(type)?.push(handler);
  }

  /**
   * Unsubscribe from specific message types
   * @param type Message type to unsubscribe from
   * @param handler Handler to remove (optional - removes all if not specified)
   */
  public unsubscribe(type: string, handler?: (data: any) => void): void {
    if (!handler) {
      this.messageHandlers.delete(type);
      return;
    }
    
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      
      if (handlers.length === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  /**
   * Send a message through the WebSocket
   * @param type Message type
   * @param data Message data
   */
  public send(type: string, data: any = {}): void {
    const message = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.sendRaw(message);
  }

  /**
   * Send a raw message object through the WebSocket
   * @param message Message to send
   */
  public sendRaw(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      this.log('debug', 'Sent message:', message);
    } else {
      this.log('warn', 'Attempted to send message while disconnected:', message);
      
      // Store messages for sending when reconnected
      if (this.config.autoReconnect) {
        this.pendingMessages.push(message);
        this.log('info', 'Message queued for delivery after reconnection');
        
        // Attempt to reconnect
        if (this.connectionState === ConnectionState.DISCONNECTED) {
          this.reconnect();
        }
      } else {
        // Show error to user
        toast({
          title: "Connection Error",
          description: "Cannot send message: not connected to server",
          variant: "destructive"
        });
      }
    }
  }

  /**
   * Get the current connection state
   */
  public getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Enable/disable background mode (for battery savings)
   * @param enabled Whether to enable background mode
   */
  public setBackgroundMode(enabled: boolean): void {
    this.config.mobileMode = enabled ? 'background' : 'active';
    
    // Adjust intervals based on new mode
    if (enabled) {
      this.config.heartbeatInterval = 60000; // 1 minute
      
      // Restart heartbeat with new interval if connected
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.stopHeartbeat();
        this.startHeartbeat();
      }
    } else {
      this.config.heartbeatInterval = DEFAULT_CONFIG.heartbeatInterval;
      
      // Restart heartbeat with new interval if connected
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.stopHeartbeat();
        this.startHeartbeat();
      }
    }
  }

  /**
   * Enable/disable battery saver mode (minimal network activity)
   * @param enabled Whether to enable battery saver mode
   */
  public setBatterySaverMode(enabled: boolean): void {
    this.config.mobileMode = enabled ? 'battery-saver' : 'active';
    
    if (enabled) {
      this.config.heartbeatInterval = 120000; // 2 minutes
      
      // Restart heartbeat with new interval if connected
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.stopHeartbeat();
        this.startHeartbeat();
      }
    } else {
      this.config.heartbeatInterval = DEFAULT_CONFIG.heartbeatInterval;
      
      // Restart heartbeat with new interval if connected
      if (this.connectionState === ConnectionState.CONNECTED) {
        this.stopHeartbeat();
        this.startHeartbeat();
      }
    }
  }

  /**
   * Handle received messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.log('debug', 'Received message:', message);
      
      // Handle heartbeat responses
      if (message.type === MessageType.HEARTBEAT) {
        this.log('debug', 'Heartbeat received');
        return;
      }
      
      // Handle errors
      if (message.type === MessageType.ERROR) {
        this.log('error', 'Server error:', message.data);
        toast({
          title: "Server Error",
          description: message.data.message || "Unknown server error",
          variant: "destructive"
        });
        return;
      }
      
      // Dispatch to registered handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers && handlers.length > 0) {
        handlers.forEach(handler => handler(message.data));
      } else {
        this.log('warn', 'No handler registered for message type:', message.type);
      }
    } catch (error) {
      this.log('error', 'Error parsing message:', error, event.data);
    }
  }

  /**
   * Handle successful connection
   */
  private onConnected(): void {
    this.reconnectAttempts = 0;
    this.changeState(ConnectionState.CONNECTED);
    this.log('info', 'Connected to WebSocket server');
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Send authentication if token is provided
    if (this.config.token) {
      this.send(MessageType.AUTHENTICATION, { token: this.config.token });
    }
    
    // Send any pending messages
    if (this.pendingMessages.length > 0) {
      this.log('info', `Sending ${this.pendingMessages.length} pending messages`);
      
      while (this.pendingMessages.length > 0) {
        const message = this.pendingMessages.shift();
        if (message) {
          this.sendRaw(message);
        }
      }
    }
    
    // Notify listeners
    if (this.handlers.onConnect) {
      this.handlers.onConnect();
    }
  }

  /**
   * Handle disconnection
   */
  private onDisconnected(event: CloseEvent): void {
    this.stopHeartbeat();
    this.changeState(ConnectionState.DISCONNECTED);
    
    this.log('info', `Disconnected from WebSocket server: ${event.code} ${event.reason}`);
    
    // Notify listeners
    if (this.handlers.onDisconnect) {
      this.handlers.onDisconnect();
    }
    
    // Attempt to reconnect if enabled
    if (this.config.autoReconnect && 
        (!event.wasClean || event.code === 1006)) {
      this.reconnect();
    }
  }

  /**
   * Attempt to reconnect to the server
   */
  private reconnect(): void {
    if (this.reconnectTimer || 
        this.reconnectAttempts >= (this.config.maxReconnectAttempts || 0)) {
      return;
    }
    
    this.reconnectAttempts++;
    this.changeState(ConnectionState.RECONNECTING);
    
    this.log('info', `Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      
      this.connect().then(() => {
        if (this.handlers.onReconnect) {
          this.handlers.onReconnect();
        }
      }).catch(error => {
        this.log('error', 'Reconnection failed:', error);
        
        // Try again if we haven't reached the maximum attempts
        if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 0)) {
          this.reconnect();
        } else {
          this.log('error', 'Maximum reconnection attempts reached');
          this.changeState(ConnectionState.DISCONNECTED);
          
          toast({
            title: "Connection Failed",
            description: "Could not reconnect to the server after multiple attempts",
            variant: "destructive"
          });
        }
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Start sending heartbeat messages
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer || !this.config.heartbeatInterval) {
      return;
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send(MessageType.HEARTBEAT);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop sending heartbeat messages
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Stop the reconnect timer
   */
  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Change the connection state
   */
  private changeState(state: ConnectionState): void {
    this.connectionState = state;
    this.log('debug', `Connection state changed to: ${state}`);
  }

  /**
   * Log messages based on configured log level
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', ...args: any[]): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };
    const configLevel = this.config.logLevel || 'info';
    
    if (levels[level] >= levels[configLevel]) {
      const prefix = `[MobileWebSocket][${level.toUpperCase()}]`;
      
      switch (level) {
        case 'debug':
          console.debug(prefix, ...args);
          break;
        case 'info':
          console.info(prefix, ...args);
          break;
        case 'warn':
          console.warn(prefix, ...args);
          break;
        case 'error':
          console.error(prefix, ...args);
          break;
      }
    }
  }
}

/**
 * Create a new mobile WebSocket manager instance
 */
export function createMobileWebSocketManager(baseUrl?: string, token?: string): MobileWebSocketManager {
  // Determine the WebSocket URL based on environment
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = baseUrl || `${protocol}//${window.location.host}`;
  const wsUrl = `${host}/api/mobile/ws`;
  
  const config: WebSocketConfig = {
    url: wsUrl,
    token,
    autoReconnect: true,
    useCompression: true,
    logLevel: 'info'
  };
  
  return new MobileWebSocketManager(config);
}
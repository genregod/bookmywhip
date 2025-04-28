import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';

// Map to track active client connections by user ID
const activeClients = new Map<number, string[]>();

/**
 * WebSocket Service for real-time communications
 * 
 * Handles both Socket.IO connections (for browser clients)
 * and raw WebSocket connections (for mobile/native clients)
 */
export class WebSocketService {
  private io: SocketIOServer | null = null;
  private wss: WebSocketServer | null = null;
  
  /**
   * Initialize WebSocket server
   * @param httpServer The HTTP server to attach WebSocket to
   */
  initialize(httpServer: HttpServer) {
    // Initialize Socket.IO
    this.io = new SocketIOServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    // Initialize native WebSockets on a different path
    this.wss = new WebSocketServer({ 
      server: httpServer, 
      path: '/ws' 
    });
    
    this.setupSocketIOEvents();
    this.setupWebSocketEvents();
    
    console.log('WebSocket services initialized');
  }
  
  /**
   * Set up Socket.IO event handlers
   */
  private setupSocketIOEvents() {
    if (!this.io) return;
    
    this.io.on('connection', (socket) => {
      console.log('New Socket.IO client connected:', socket.id);
      
      // Handle client authentication
      socket.on('authenticate', (data: { userId: number }) => {
        const { userId } = data;
        if (!userId) return;
        
        // Store socket ID for this user
        if (!activeClients.has(userId)) {
          activeClients.set(userId, []);
        }
        
        activeClients.get(userId)?.push(socket.id);
        socket.data.userId = userId;
        
        console.log(`User ${userId} authenticated on socket ${socket.id}`);
        
        // Join user-specific room
        socket.join(`user-${userId}`);
      });
      
      // Handle ride-related events
      socket.on('join-ride', (rideId: number) => {
        socket.join(`ride-${rideId}`);
        console.log(`Socket ${socket.id} joined ride-${rideId}`);
      });
      
      socket.on('leave-ride', (rideId: number) => {
        socket.leave(`ride-${rideId}`);
        console.log(`Socket ${socket.id} left ride-${rideId}`);
      });
      
      // Handle location updates from drivers
      socket.on('driver-location', (data: { 
        driverId: number, 
        latitude: number, 
        longitude: number,
        heading: number,
        speed: number,
        timestamp: number 
      }) => {
        // Broadcast to all clients following this driver (e.g., active ride participants)
        this.io?.to(`driver-${data.driverId}`).emit('driver-location-update', data);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Socket.IO client disconnected:', socket.id);
        
        // Remove socket ID from active clients
        if (socket.data.userId) {
          const userSockets = activeClients.get(socket.data.userId) || [];
          const updatedSockets = userSockets.filter(id => id !== socket.id);
          
          if (updatedSockets.length > 0) {
            activeClients.set(socket.data.userId, updatedSockets);
          } else {
            activeClients.delete(socket.data.userId);
          }
        }
      });
    });
    
    // Create namespaces for specific features
    
    // Rides namespace
    const ridesNamespace = this.io.of('/rides');
    ridesNamespace.on('connection', (socket) => {
      console.log('Client connected to rides namespace:', socket.id);
      
      socket.on('get-nearby-drivers', (data: { latitude: number, longitude: number, radius: number }) => {
        // This would be handled by a service to find nearby drivers
        // Just acknowledge the request for now
        socket.emit('nearby-drivers-response', { success: true });
      });
    });
    
    // Drivers namespace
    const driversNamespace = this.io.of('/drivers');
    driversNamespace.on('connection', (socket) => {
      console.log('Client connected to drivers namespace:', socket.id);
      
      socket.on('set-driver-status', (data: { driverId: number, status: 'online' | 'offline' | 'busy' }) => {
        // Update driver status and notify interested parties
        driversNamespace.emit('driver-status-update', data);
      });
    });
  }
  
  /**
   * Set up native WebSocket event handlers
   */
  private setupWebSocketEvents() {
    if (!this.wss) return;
    
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket client connected');
      
      // Parse query params to get user ID
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = parseInt(url.searchParams.get('userId') || '0', 10);
      
      if (userId) {
        // Store connection for this user
        if (!activeClients.has(userId)) {
          activeClients.set(userId, []);
        }
        
        // We don't have socket IDs here, so use object reference as key
        (ws as any).userId = userId;
        
        console.log(`User ${userId} connected via WebSocket`);
      }
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle different message types
          switch (data.type) {
            case 'authenticate':
              break;
              
            case 'driver-location':
              this.broadcastDriverLocation(data.payload);
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        
        // Clean up user connection
        const userId = (ws as any).userId;
        if (userId && activeClients.has(userId)) {
          // For raw WebSockets, we don't have IDs, so we can't track multiple connections
          // per user as easily as with Socket.IO
          activeClients.delete(userId);
        }
      });
      
      // Send initial connection acknowledgment
      ws.send(JSON.stringify({ type: 'connection-ack', timestamp: Date.now() }));
    });
  }
  
  /**
   * Send a notification to a specific user across all their connected devices
   */
  notifyUser(userId: number, eventName: string, data: any) {
    if (!this.io) return;
    
    // Notify via Socket.IO
    this.io.to(`user-${userId}`).emit(eventName, data);
    
    // For native WebSockets, we'd need to iterate through connections and check userId
    // This is more complex and would require additional tracking
  }
  
  /**
   * Send a notification to all participants in a ride
   */
  notifyRide(rideId: number, eventName: string, data: any) {
    if (!this.io) return;
    
    this.io.to(`ride-${rideId}`).emit(eventName, data);
  }
  
  /**
   * Broadcast driver location update to interested parties
   */
  broadcastDriverLocation(data: { 
    driverId: number, 
    latitude: number, 
    longitude: number,
    heading?: number,
    speed?: number,
    timestamp: number 
  }) {
    if (!this.io) return;
    
    // Broadcast to Socket.IO clients
    this.io.to(`driver-${data.driverId}`).emit('driver-location-update', data);
    
    // For active ride associated with this driver, notify participants
    // This would require looking up active rides in a real implementation
  }
  
  /**
   * Broadcast a notification to all connected clients
   */
  broadcastAll(eventName: string, data: any) {
    if (!this.io) return;
    
    this.io.emit(eventName, data);
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

// Export the singleton as default
export default webSocketService;
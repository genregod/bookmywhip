import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { storage } from '../storage';

/**
 * WebSocket Service for real-time communications
 * 
 * Handles both Socket.IO connections (for browser clients)
 * and raw WebSocket connections (for mobile/native clients)
 */
export class WebSocketService {
  private io: SocketIOServer | null = null;
  private wss: WebSocketServer | null = null;
  private connections: Map<number, Set<WebSocket>> = new Map();
  private rideConnections: Map<number, Set<WebSocket>> = new Map();
  
  /**
   * Initialize WebSocket server
   * @param httpServer The HTTP server to attach WebSocket to
   */
  initialize(httpServer: HttpServer) {
    // Create WebSocket server with specific path
    // Using /ws path to not conflict with Vite's HMR WebSocket
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws'
    });
    
    this.setupWebSocketEvents();
    
    console.log('WebSocket services initialized');
  }
  
  /**
   * Set up native WebSocket event handlers
   */
  private setupWebSocketEvents() {
    if (!this.wss) return;
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      
      // Keep track of user ID if authenticated
      let userId: number | null = null;
      let subscribedRides: Set<number> = new Set();
      
      // Handle incoming messages
      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received message:', message);
          
          if (message.type === 'authenticate') {
            // Handle authentication
            userId = Number(message.payload?.userId);
            
            if (userId) {
              // Add client to user-specific connection list
              if (!this.connections.has(userId)) {
                this.connections.set(userId, new Set());
              }
              this.connections.get(userId)?.add(ws);
              
              // Send acknowledgment
              this.sendToClient(ws, {
                type: 'authenticated',
                payload: {
                  userId,
                  timestamp: new Date().toISOString()
                }
              });
              
              console.log(`WebSocket client authenticated with userId: ${userId}`);
            }
          } 
          else if (message.type === 'subscribe-ride') {
            // Handle ride subscription
            const rideId = Number(message.payload?.rideId);
            
            if (rideId) {
              // Add to ride-specific connection list
              if (!this.rideConnections.has(rideId)) {
                this.rideConnections.set(rideId, new Set());
              }
              this.rideConnections.get(rideId)?.add(ws);
              subscribedRides.add(rideId);
              
              // Send acknowledgment
              this.sendToClient(ws, {
                type: 'subscribed',
                payload: {
                  rideId,
                  timestamp: new Date().toISOString()
                }
              });
              
              console.log(`WebSocket client subscribed to ride: ${rideId}`);
            }
          }
          else if (message.type === 'driver-location') {
            // Handle driver location updates
            if (!userId) {
              this.sendToClient(ws, {
                type: 'error',
                payload: {
                  message: 'Not authenticated',
                  timestamp: new Date().toISOString()
                }
              });
              return;
            }
            
            // Check if this driver has an active ride
            storage.getActiveRideByDriverId(userId)
              .then(ride => {
                if (ride) {
                  // Broadcast to all clients subscribed to this ride
                  this.notifyRide(ride.id, 'driver-location', {
                    driverId: userId,
                    rideId: ride.id,
                    ...message.payload,
                    timestamp: new Date().toISOString()
                  });
                }
              })
              .catch(error => {
                console.error('Error processing driver location update:', error);
              });
          }
          else if (message.type === 'ride-request') {
            // Handle ride requests
            if (!userId) {
              this.sendToClient(ws, {
                type: 'error',
                payload: {
                  message: 'Not authenticated',
                  timestamp: new Date().toISOString()
                }
              });
              return;
            }
            
            // Process the ride request
            // For now, just broadcast to all available drivers
            // In a real implementation, we would use the proximity service to find nearby drivers
            const rideRequest = {
              type: 'new-ride-request',
              payload: {
                riderId: userId,
                ...message.payload,
                timestamp: new Date().toISOString()
              }
            };
            
            // Since we don't have a way to know which drivers are available,
            // we'll just send an acknowledgment for now
            this.sendToClient(ws, {
              type: 'ride-requested',
              payload: {
                success: true,
                message: 'Ride request received',
                timestamp: new Date().toISOString()
              }
            });
          }
          else if (message.type === 'ping') {
            // Handle ping messages (keep-alive)
            this.sendToClient(ws, {
              type: 'pong',
              payload: {
                timestamp: new Date().toISOString()
              }
            });
          }
          else {
            // Handle unknown message types
            console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        
        // Remove from connections map
        if (userId) {
          const userConnections = this.connections.get(userId);
          if (userConnections) {
            userConnections.delete(ws);
            if (userConnections.size === 0) {
              this.connections.delete(userId);
            }
          }
        }
        
        // Remove from ride subscriptions
        subscribedRides.forEach(rideId => {
          const rideConnections = this.rideConnections.get(rideId);
          if (rideConnections) {
            rideConnections.delete(ws);
            if (rideConnections.size === 0) {
              this.rideConnections.delete(rideId);
            }
          }
        });
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      // Send welcome message
      this.sendToClient(ws, {
        type: 'welcome',
        payload: {
          message: 'Connected to BookMyWhip real-time service',
          timestamp: new Date().toISOString()
        }
      });
    });
  }
  
  /**
   * Send a notification to a specific user across all their connected devices
   */
  notifyUser(userId: number, eventName: string, data: any) {
    const userConnections = this.connections.get(userId);
    
    if (userConnections && userConnections.size > 0) {
      const message = {
        type: eventName,
        payload: {
          ...data,
          timestamp: new Date().toISOString()
        }
      };
      
      userConnections.forEach(clientWs => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(message));
        }
      });
      
      console.log(`Notified user ${userId} with event ${eventName}`);
      return true;
    }
    
    console.log(`No active connections for user ${userId}`);
    return false;
  }
  
  /**
   * Send a notification to all participants in a ride
   */
  notifyRide(rideId: number, eventName: string, data: any) {
    const rideConnections = this.rideConnections.get(rideId);
    
    if (rideConnections && rideConnections.size > 0) {
      const message = {
        type: eventName,
        payload: {
          ...data,
          rideId,
          timestamp: new Date().toISOString()
        }
      };
      
      rideConnections.forEach(clientWs => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify(message));
        }
      });
      
      console.log(`Notified ride ${rideId} participants with event ${eventName}`);
      return true;
    }
    
    console.log(`No active connections for ride ${rideId}`);
    return false;
  }
  
  /**
   * Broadcast a notification to all connected clients
   */
  broadcastAll(eventName: string, data: any) {
    if (!this.wss) return false;
    
    const message = {
      type: eventName,
      payload: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };
    
    let clientCount = 0;
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        clientCount++;
      }
    });
    
    console.log(`Broadcasted event ${eventName} to ${clientCount} clients`);
    return clientCount > 0;
  }
  
  /**
   * Helper method to send a message to a specific client
   */
  private sendToClient(client: WebSocket, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

export const webSocketService = new WebSocketService();
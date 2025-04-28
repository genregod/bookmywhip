import { AzureFunction, Context, HttpRequest } from "@azure/functions";

/**
 * This Azure Function handles WebSocket connections for mobile clients
 * It provides low-latency communication for ride status updates, driver location tracking, etc.
 */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('Mobile WebSocket handler function processed a request.');
  
  // Extract userId and client type from request
  const userId = getUserId(req);
  const clientType = req.query.client_type || req.body?.client_type || 'unknown';
  
  if (!userId) {
    context.res = {
      status: 401,
      body: { error: "Authentication required" }
    };
    return;
  }
  
  const eventType = req.query.event || req.body?.event;
  
  switch (eventType) {
    case 'register-device':
      // Register a mobile device for push notifications
      try {
        const { deviceToken, platform } = req.body;
        
        if (!deviceToken || !platform) {
          context.res = {
            status: 400,
            body: { error: "Missing device information" }
          };
          return;
        }
        
        // In a real implementation, store the device token in a database
        // associated with the user for push notifications
        
        context.res = {
          status: 200,
          body: { 
            success: true,
            message: `Device registered for ${platform} notifications`
          }
        };
      } catch (error) {
        context.log.error('Error registering device:', error);
        context.res = {
          status: 500,
          body: { error: "Failed to register device" }
        };
      }
      break;
      
    case 'location-subscribe':
      // Subscribe to location updates for a specific ride or driver
      try {
        const { rideId, driverId } = req.body;
        
        if (!rideId && !driverId) {
          context.res = {
            status: 400,
            body: { error: "Must specify either rideId or driverId" }
          };
          return;
        }
        
        // In a real implementation, record this subscription in a database
        // and set up the necessary routing for SignalR messages
        
        // For now, just simulate a successful subscription
        context.res = {
          status: 200,
          body: { 
            success: true,
            subscriptionId: `sub_${Date.now()}`,
            subject: rideId ? `ride:${rideId}` : `driver:${driverId}`
          }
        };
      } catch (error) {
        context.log.error('Error creating subscription:', error);
        context.res = {
          status: 500,
          body: { error: "Failed to create subscription" }
        };
      }
      break;
      
    case 'heartbeat':
      // Simple heartbeat to maintain WebSocket connection
      context.res = {
        status: 200,
        body: { 
          timestamp: new Date().toISOString(),
          server: "BookMyWhip Azure",
          status: "healthy"
        }
      };
      break;
      
    case 'negotiate':
      // Mobile-specific WebSocket negotiation
      // This sets up lower-latency, more reliable mobile connections
      context.res = {
        status: 200,
        body: {
          url: process.env.SIGNALR_SERVICE_URL,
          accessToken: generateMobileAccessToken(userId, clientType),
          transports: ["WebSockets", "ServerSentEvents", "LongPolling"],
          features: {
            enableDetailedErrors: true,
            enableConnectionRetry: true,
            connectionRetryFrequency: 5000, // ms
            maxConnectionRetries: 10
          }
        }
      };
      break;
      
    default:
      context.res = {
        status: 400,
        body: { error: "Unknown event type" }
      };
  }
};

/**
 * Extract user ID from request
 * In a real implementation, this would validate the JWT token
 */
function getUserId(req: HttpRequest): string | null {
  // Get from Authorization header
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    // In a real implementation, we would validate the JWT token
    // and extract the user ID from it
    return `user-${token.substring(0, 8)}`; // Placeholder
  }
  
  // Fallback to query parameter for testing
  return req.query.userId || req.body?.userId || null;
}

/**
 * Generate a mobile-specific access token
 * In a real implementation, this would be a properly signed JWT
 */
function generateMobileAccessToken(userId: string, clientType: string): string {
  // This is just a placeholder
  // In production, use a proper JWT signing implementation
  return `mobile_token_${userId}_${clientType}_${Date.now()}`;
}

export default httpTrigger;
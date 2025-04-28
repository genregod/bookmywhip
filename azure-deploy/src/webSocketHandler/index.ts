import { AzureFunction, Context, HttpRequest } from "@azure/functions";

/**
 * This Azure Function handles WebSocket connections via Azure SignalR service
 * This enables real-time communication for the BookMyWhip mobile apps
 */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('WebSocket handler function processed a request.');
  
  // Extract userId from auth header or query param for authentication
  const userId = getUserId(req);
  
  if (!userId) {
    context.res = {
      status: 401,
      body: { error: "Authentication required" }
    };
    return;
  }
  
  // Handle different types of WebSocket events
  const eventType = req.query.event || req.body?.event;
  
  switch (eventType) {
    case 'negotiate':
      // Handle SignalR negotiation - return the connection info
      context.res = {
        status: 200,
        body: {
          // The negotiate endpoint would normally return connection info
          // In a real implementation, SignalR would handle this automatically
          url: process.env.SIGNALR_SERVICE_URL,
          accessToken: "dummy-token" // Would be a real JWT token in production
        }
      };
      break;
      
    case 'driver-location':
      // Process driver location update
      try {
        const { latitude, longitude, heading, speed } = req.body;
        
        if (!latitude || !longitude) {
          context.res = {
            status: 400,
            body: { error: "Missing location data" }
          };
          return;
        }
        
        // Broadcast to the appropriate ride participants via SignalR
        context.bindings.signalRMessages = [{
          target: 'locationUpdate',
          arguments: [{
            driverId: userId,
            latitude,
            longitude,
            heading,
            speed,
            timestamp: new Date().toISOString()
          }]
        }];
        
        context.res = {
          status: 200,
          body: { success: true }
        };
      } catch (error) {
        context.log.error('Error processing driver location:', error);
        context.res = {
          status: 500,
          body: { error: "Failed to process location update" }
        };
      }
      break;
      
    case 'ride-request':
      // Process new ride request
      try {
        const { pickupLocation, dropoffLocation, 
                fareEstimate, vehicleType } = req.body;
        
        if (!pickupLocation || !dropoffLocation) {
          context.res = {
            status: 400,
            body: { error: "Missing ride details" }
          };
          return;
        }
        
        // For non-mock implementation, we would store the ride in a database
        // and then broadcast to potential drivers
        
        // Broadcast the ride request to available drivers
        context.bindings.signalRMessages = [{
          target: 'newRideRequest',
          arguments: [{
            riderId: userId,
            pickupLocation,
            dropoffLocation,
            fareEstimate,
            vehicleType,
            requestTime: new Date().toISOString()
          }]
        }];
        
        context.res = {
          status: 200,
          body: { 
            success: true,
            message: "Ride request broadcast to nearby drivers"
          }
        };
      } catch (error) {
        context.log.error('Error processing ride request:', error);
        context.res = {
          status: 500,
          body: { error: "Failed to process ride request" }
        };
      }
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
    return "user-from-token"; // Placeholder
  }
  
  // Fallback to query parameter for testing
  return req.query.userId || req.body?.userId || null;
}

export default httpTrigger;
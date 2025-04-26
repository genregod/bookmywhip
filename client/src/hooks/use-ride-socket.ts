import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuth } from '@/hooks/use-auth';
import { WS_MESSAGE_TYPES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

type RideStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

interface DriverLocation {
  driverId: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface RideEvent {
  type: string;
  ride: any;
  timestamp?: string;
}

interface UseRideSocketResult {
  connected: boolean;
  requestRide: (rideData: any) => void;
  acceptRide: (rideId: number) => void;
  cancelRide: (rideId: number) => void;
  updateLocation: (latitude: number, longitude: number, accuracy?: number) => void;
  lastEvent: RideEvent | null;
  driverLocation: DriverLocation | null;
  error: string | null;
}

/**
 * Hook for ride-related real-time communication
 * 
 * This specialized hook builds on top of the useWebSocket hook to provide
 * ride-specific functionality for both riders and drivers
 */
export function useRideSocket(): UseRideSocketResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const [namespace, setNamespace] = useState<string>('/riders');
  const [lastEvent, setLastEvent] = useState<RideEvent | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  
  // Set the appropriate namespace based on the user's role
  useEffect(() => {
    if (user?.role === 'driver') {
      setNamespace('/drivers');
    } else if (user?.role === 'admin') {
      setNamespace('/admin');
    } else {
      setNamespace('/riders');
    }
  }, [user?.role]);
  
  // Use the WebSocket hook with the appropriate namespace
  const { connected, sendMessage, lastMessage, error } = useWebSocket({
    namespace,
    autoConnect: true,
    mockMode: false // Set to true for testing without actual connection
  });
  
  // Process incoming messages
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Processing ride event:', lastMessage.type);
    
    switch (lastMessage.type) {
      case 'ride_accepted':
      case 'ride_started':
      case 'ride_completed':
      case 'ride_cancelled':
        setLastEvent({
          type: lastMessage.type,
          ride: lastMessage.ride,
          timestamp: new Date().toISOString()
        });
        
        // Show toast notification for ride status updates
        const statusMap: Record<string, string> = {
          'ride_accepted': 'Driver accepted your ride',
          'ride_started': 'Your ride has started',
          'ride_completed': 'Your ride has been completed',
          'ride_cancelled': 'Your ride has been cancelled'
        };
        
        toast({
          title: statusMap[lastMessage.type] || 'Ride update',
          description: `Ride #${lastMessage.ride?.id} status updated to ${lastMessage.ride?.status}`,
        });
        break;
        
      case 'driver_location_update':
        setDriverLocation({
          driverId: lastMessage.driverId,
          latitude: lastMessage.latitude,
          longitude: lastMessage.longitude,
          timestamp: lastMessage.timestamp
        });
        break;
        
      case 'new_ride_request':
        // For drivers only
        if (user?.role === 'driver') {
          toast({
            title: 'New ride request',
            description: `Pickup: ${lastMessage.pickupLocation?.address}`,
          });
          
          setLastEvent({
            type: 'new_ride_request',
            ride: {
              id: lastMessage.rideId,
              pickupLocation: lastMessage.pickupLocation,
              destinationLocation: lastMessage.destinationLocation,
              estimatedFare: lastMessage.estimatedFare
            },
            timestamp: lastMessage.timestamp
          });
        }
        break;
        
      default:
        // Handle other message types
        break;
    }
  }, [lastMessage, toast, user?.role]);
  
  // Request a new ride (riders only)
  const requestRide = useCallback((rideData: any) => {
    if (user?.role !== 'rider') {
      console.warn('Only riders can request rides');
      return;
    }
    
    sendMessage({
      type: WS_MESSAGE_TYPES.RIDE_REQUEST,
      ...rideData,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage, user?.role]);
  
  // Accept a ride (drivers only)
  const acceptRide = useCallback((rideId: number) => {
    if (user?.role !== 'driver') {
      console.warn('Only drivers can accept rides');
      return;
    }
    
    sendMessage({
      type: 'accept_ride',
      rideId,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage, user?.role]);
  
  // Cancel a ride (both riders and drivers)
  const cancelRide = useCallback((rideId: number) => {
    sendMessage({
      type: 'cancel_ride',
      rideId,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);
  
  // Update driver location (drivers only)
  const updateLocation = useCallback((latitude: number, longitude: number, accuracy?: number) => {
    if (user?.role !== 'driver') {
      console.warn('Only drivers can update location');
      return;
    }
    
    sendMessage({
      type: WS_MESSAGE_TYPES.DRIVER_LOCATION_UPDATE,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage, user?.role]);
  
  return {
    connected,
    requestRide,
    acceptRide,
    cancelRide,
    updateLocation,
    lastEvent,
    driverLocation,
    error
  };
}
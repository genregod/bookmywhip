import { useState, useEffect } from 'react';
import { useRides, Ride } from '@/hooks/use-rides';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import MapView from '@/components/maps/MapView';
import { formatDistance, formatDuration } from '@/lib/mapUtils';
import { useLocation } from '@/hooks/use-location';
import { Card, CardContent } from '@/components/ui/card';

export default function DriverDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { rides, activeRide, acceptRide, startRide, completeRide, cancelRide, isLoading } = useRides();
  const { connected, lastMessage, sendMessage } = useWebSocket();
  const { currentLocation } = useLocation();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [showPendingRide, setShowPendingRide] = useState<Ride | null>(null);
  const [stats, setStats] = useState({
    earnings: 78.50,
    completedRides: 6,
    acceptanceRate: 95,
    onlineHours: 5.2
  });

  // Handle incoming WebSocket messages for new ride requests
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new_ride_request' && isOnline) {
      const rideId = lastMessage.rideId;
      
      // Simulate fetching the ride details
      // In a real app, we would fetch the ride details from the API
      setTimeout(() => {
        setShowPendingRide({
          id: rideId,
          riderId: 1,
          pickupAddress: '123 Main St',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          destinationAddress: 'Downtown Mall',
          destinationLatitude: 40.7228,
          destinationLongitude: -74.0060,
          status: 'requested',
          vehicleType: 'economy',
          baseFare: 5,
          perMileRate: 1.5,
          perMinuteRate: 0.15,
          estimatedDistance: 2.4,
          estimatedDuration: 12,
          estimatedFare: 12.50,
          createdAt: new Date().toISOString()
        } as Ride);
      }, 500);
    }
  }, [lastMessage, isOnline]);

  // Prepare map markers based on active ride
  const getMapMarkers = () => {
    const markers = [];
    
    if (activeRide) {
      // Add pickup marker
      markers.push({
        lat: activeRide.pickupLatitude,
        lng: activeRide.pickupLongitude,
        type: 'pickup' as const,
        label: 'Pickup'
      });
      
      // Add destination marker
      markers.push({
        lat: activeRide.destinationLatitude,
        lng: activeRide.destinationLongitude,
        type: 'destination' as const,
        label: 'Destination'
      });
    }
    
    // Add driver marker (current location)
    if (currentLocation) {
      markers.push({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        type: 'driver' as const
      });
    }
    
    return markers;
  };

  // Handle accepting a ride
  const handleAcceptRide = async (ride: Ride) => {
    try {
      await acceptRide(ride.id);
      setShowPendingRide(null);
      toast({
        title: 'Ride accepted',
        description: 'You have accepted the ride request',
      });
    } catch (error) {
      toast({
        title: 'Error accepting ride',
        description: 'Unable to accept the ride. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle starting a ride
  const handleStartRide = async () => {
    if (!activeRide) return;
    
    try {
      await startRide(activeRide.id);
      toast({
        title: 'Ride started',
        description: 'You have started the ride',
      });
    } catch (error) {
      toast({
        title: 'Error starting ride',
        description: 'Unable to start the ride. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle completing a ride
  const handleCompleteRide = async () => {
    if (!activeRide) return;
    
    try {
      await completeRide(activeRide.id);
      // Update stats
      setStats(prev => ({
        ...prev,
        earnings: prev.earnings + (activeRide.estimatedFare || 0),
        completedRides: prev.completedRides + 1
      }));
      toast({
        title: 'Ride completed',
        description: 'You have completed the ride',
      });
    } catch (error) {
      toast({
        title: 'Error completing ride',
        description: 'Unable to complete the ride. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle cancelling a ride
  const handleCancelRide = async () => {
    if (!activeRide) return;
    
    try {
      await cancelRide(activeRide.id);
      toast({
        title: 'Ride cancelled',
        description: 'You have cancelled the ride',
      });
    } catch (error) {
      toast({
        title: 'Error cancelling ride',
        description: 'Unable to cancel the ride. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Toggle online status
  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    // Send status to server via API call
    try {
      // In a real implementation, we would update the driver's status in the database
      // For now, we're just updating the state and showing a toast
      await fetch('/api/driver/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline: newStatus }),
      });
      
      // Also update the WebSocket status if connected
      if (connected && sendMessage) {
        sendMessage(JSON.stringify({
          type: 'driver_status_change',
          isOnline: newStatus,
          driverId: user?.id,
        }));
      }
      
      toast({
        title: newStatus ? 'You are now online' : 'You are now offline',
        description: newStatus ? 'You will now receive ride requests' : 'You will not receive ride requests',
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert state if API call fails
      setIsOnline(!newStatus);
      toast({
        title: 'Status update failed',
        description: 'Unable to update your status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Status pill content based on active ride status
  const getStatusText = () => {
    if (!isOnline) return 'Offline - Not accepting rides';
    
    if (activeRide) {
      switch (activeRide.status) {
        case 'accepted': return 'Accepted - En route to pickup';
        case 'in_progress': return 'In progress - Driving to destination';
        default: return 'Online - Waiting for rides';
      }
    }
    
    return 'Online - Waiting for rides';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-100 text-gray-800';
    
    if (activeRide) {
      switch (activeRide.status) {
        case 'accepted': return 'bg-blue-100 text-blue-800';
        case 'in_progress': return 'bg-blue-100 text-blue-800';
        default: return 'bg-green-100 text-green-800';
      }
    }
    
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Map Container */}
      <div className="bg-gray-200 flex-1 relative map-container">
        <MapView 
          markers={getMapMarkers()}
          path={activeRide ? {
            points: [
              { lat: activeRide.pickupLatitude, lng: activeRide.pickupLongitude },
              { lat: activeRide.destinationLatitude, lng: activeRide.destinationLongitude }
            ],
            color: '#4F46E5'
          } : undefined}
          center={currentLocation ? { 
            lat: currentLocation.latitude, 
            lng: currentLocation.longitude 
          } : undefined}
        />
        
        {/* Status pill */}
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 ${getStatusColor()} py-2 px-4 rounded-full shadow-md flex items-center space-x-2 text-sm`}>
          <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          <span className="font-medium">{getStatusText()}</span>
        </div>

        {/* Active Ride Card */}
        {activeRide && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-lg">
                    {activeRide.status === 'accepted' ? 'Pick up passenger' : 'Drive to destination'}
                  </h3>
                  <div className="text-sm font-medium text-primary">
                    {activeRide.status === 'accepted' 
                      ? formatDistance(activeRide.estimatedDistance / 2) 
                      : formatDistance(activeRide.estimatedDistance)}
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-8 flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${activeRide.status === 'in_progress' ? 'bg-gray-300' : 'bg-primary'}`}></div>
                    <div className="w-0.5 h-10 bg-gray-300"></div>
                    <div className={`w-3 h-3 rounded-full ${activeRide.status === 'in_progress' ? 'bg-primary' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex-grow ml-2">
                    <div className="mb-4">
                      <p className={`text-sm font-medium ${activeRide.status === 'in_progress' ? 'text-gray-500' : 'text-black'}`}>
                        {activeRide.pickupAddress}
                      </p>
                      <p className="text-xs text-gray-500">Pickup location</p>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${activeRide.status === 'in_progress' ? 'text-black' : 'text-gray-500'}`}>
                        {activeRide.destinationAddress}
                      </p>
                      <p className="text-xs text-gray-500">Drop-off location</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {activeRide.status === 'accepted' && (
                    <>
                      <Button 
                        className="flex-1" 
                        onClick={handleStartRide}
                      >
                        Start Ride
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleCancelRide}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  
                  {activeRide.status === 'in_progress' && (
                    <Button 
                      className="w-full" 
                      onClick={handleCompleteRide}
                    >
                      Complete Ride
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Ride Request */}
        {showPendingRide && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">New Ride Request</h3>
                <p className="text-sm text-gray-600 mb-4">A passenger is requesting a ride</p>
                
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-8 flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div className="w-0.5 h-10 bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-grow ml-2">
                    <div className="mb-4">
                      <p className="text-sm font-medium">{showPendingRide.pickupAddress}</p>
                      <p className="text-xs text-gray-500">Pickup location</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{showPendingRide.destinationAddress}</p>
                      <p className="text-xs text-gray-500">Drop-off location</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <p className="text-sm font-medium">Estimated fare</p>
                    <p className="text-xl font-bold">${showPendingRide.estimatedFare.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Distance</p>
                    <p className="text-xl font-bold">{formatDistance(showPendingRide.estimatedDistance)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handleAcceptRide(showPendingRide)}
                  >
                    Accept
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowPendingRide(null)}
                  >
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      <div className="bg-white p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Today's Earnings</p>
          <p className="text-2xl font-bold text-gray-900">${stats.earnings.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Rides Completed</p>
          <p className="text-2xl font-bold text-gray-900">{stats.completedRides}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Acceptance Rate</p>
          <p className="text-2xl font-bold text-gray-900">{stats.acceptanceRate}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Online Hours</p>
          <p className="text-2xl font-bold text-gray-900">{stats.onlineHours}h</p>
        </div>
      </div>

      {/* Online/Offline Toggle (for mobile) */}
      <div className="md:hidden fixed bottom-20 right-4 z-10">
        <button 
          onClick={toggleOnlineStatus}
          className={`p-4 rounded-full shadow-lg ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

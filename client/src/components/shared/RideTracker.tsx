import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatDistance, formatDuration } from '@/lib/mapUtils';
import { InfoIcon, MapPinIcon, CarIcon, DollarSignIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';

interface RideTrackerProps {
  mode?: 'rider' | 'driver';
  demoMode?: boolean;
}

/**
 * RideTracker component for tracking real-time ride status
 * Demonstrates the Socket.IO integration for real-time ride updates
 */
export function RideTracker({ mode = 'rider', demoMode = false }: RideTrackerProps) {
  const [activeTab, setActiveTab] = useState('status');
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [demoRide, setDemoRide] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(demoMode);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  
  // Demo mode implementation
  useEffect(() => {
    if (!isDemo) return;
    
    // Create a mock ride for demo purposes
    const mockRide = {
      id: 12345,
      status: 'requested',
      pickupAddress: '123 Main St, San Francisco, CA',
      destinationAddress: '456 Market St, San Francisco, CA',
      pickupLatitude: 37.7749,
      pickupLongitude: -122.4194,
      destinationLatitude: 37.7897,
      destinationLongitude: -122.4000,
      estimatedFare: 15.50,
      estimatedDistance: 2.3,
      estimatedDuration: 12,
      driverId: 789,
      riderId: 456,
      vehicleType: 'economy',
      createdAt: new Date().toISOString(),
    };
    
    setDemoRide(mockRide);
    setCurrentStatus('requested');
    
    // Simulate a ride flow in demo mode
    const demoTimeline = [
      { status: 'requested', delay: 0 },
      { status: 'accepted', delay: 5000 },
      { status: 'in_progress', delay: 10000 },
      { status: 'completed', delay: 20000 },
    ];
    
    const timers: NodeJS.Timeout[] = [];
    
    demoTimeline.forEach(step => {
      const timer = setTimeout(() => {
        setCurrentStatus(step.status);
        setDemoRide((prev: any) => ({ ...prev, status: step.status }));
      }, step.delay);
      timers.push(timer);
    });
    
    return () => {
      // Clear any timers
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isDemo]);
  
  // Socket connection setup
  useEffect(() => {
    if (isDemo) {
      // Don't establish real connections in demo mode
      setConnected(false);
      return;
    }
    
    // Connect to the appropriate Socket.IO namespace based on mode
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const namespace = mode === 'driver' ? 'drivers' : 'riders';
    const wsUrl = `${protocol}//${window.location.host}/ws/${namespace}`;
    
    console.log('Connecting to Socket.IO at', wsUrl);
    
    try {
      // Create a new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Set up event handlers
      socket.onopen = () => {
        console.log('Socket.IO connected');
        setConnected(true);
        setError(null);
        
        // Send authentication message if needed
        socket.send(JSON.stringify({
          type: 'authenticate',
          timestamp: new Date().toISOString()
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Socket.IO message received:', data);
          
          // Handle different event types
          if (data.type === 'ride_accepted' || 
              data.type === 'ride_started' || 
              data.type === 'ride_completed' || 
              data.type === 'ride_cancelled') {
            
            setLastEvent({
              type: data.type,
              ride: data.ride,
              timestamp: data.timestamp || new Date().toISOString()
            });
            
            setCurrentStatus(data.type.replace('ride_', ''));
            
            toast({
              title: 'Ride Update',
              description: `Status: ${data.type.replace('ride_', '')}`,
            });
          }
          
          if (data.type === 'driver_location_update') {
            setDriverLocation({
              driverId: data.driverId,
              latitude: data.latitude,
              longitude: data.longitude,
              timestamp: data.timestamp
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      socket.onclose = (event) => {
        console.log('Socket.IO disconnected:', event.reason);
        setConnected(false);
        
        if (!event.wasClean) {
          setError('Connection closed unexpectedly');
        }
      };
      
      socket.onerror = (event) => {
        console.error('Socket.IO error:', event);
        setError('Connection error');
        setConnected(false);
      };
      
      // Clean up function
      return () => {
        console.log('Cleaning up Socket.IO connection');
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (err) {
      console.error('Failed to connect to Socket.IO:', err);
      setError(`Failed to connect: ${err}`);
      return () => {};
    }
  }, [mode, isDemo, toast]);
  
  // Send a message over WebSocket
  const sendMessage = useCallback((data: any) => {
    if (isDemo || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.log('Socket.IO in mock mode - No actual message sent');
      return;
    }
    
    try {
      socketRef.current.send(JSON.stringify(data));
      console.log('Socket.IO message sent:', data);
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
      setError(`Failed to send message: ${err}`);
    }
  }, [isDemo]);
  
  // Ping functionality for testing
  const sendPing = useCallback(() => {
    if (isDemo) {
      console.log('Mock Socket.IO - Message sent:', { type: 'ping', timestamp: Date.now() });
      return;
    }
    
    sendMessage({ 
      type: 'ping', 
      timestamp: Date.now() 
    });
  }, [isDemo, sendMessage]);
  
  // Generate a demo ride request
  const handleDemoRideRequest = () => {
    if (isDemo) {
      setCurrentStatus('requested');
      
      // Reset the demo cycle
      setTimeout(() => setCurrentStatus('accepted'), 3000);
      setTimeout(() => setCurrentStatus('in_progress'), 6000);
      setTimeout(() => setCurrentStatus('completed'), 9000);
    } else {
      // In real mode, this would send an actual request
      sendMessage({
        type: 'ride_request',
        pickupLatitude: 37.7749,
        pickupLongitude: -122.4194,
        pickupAddress: '123 Main St, San Francisco, CA',
        destinationLatitude: 37.7897,
        destinationLongitude: -122.4000,
        destinationAddress: '456 Market St, San Francisco, CA',
        vehicleType: 'economy',
        timestamp: new Date().toISOString()
      });
    }
  };
  
  // Toggle between demo and real mode
  const toggleDemoMode = () => {
    setIsDemo(!isDemo);
  };
  
  // Get status badge color
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'requested': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'in_progress': return 'bg-green-500';
      case 'completed': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Get status display text
  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'requested': return 'Finding driver...';
      case 'accepted': return 'Driver on the way';
      case 'in_progress': return 'En route';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {mode === 'rider' ? 'BookMyWhip Ride' : 'Driver View'}
          </CardTitle>
          <Badge variant={connected && !isDemo ? 'default' : 'destructive'}>
            {connected && !isDemo ? 'Connected' : isDemo ? 'Demo Mode' : 'Disconnected'}
          </Badge>
        </div>
        <CardDescription>
          Real-time ride tracking with Socket.IO
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
          <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
          <TabsTrigger value="debug" className="flex-1">Debug</TabsTrigger>
        </TabsList>
        
        <CardContent className="p-4">
          <TabsContent value="status" className="mt-0 p-0">
            {currentStatus ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getStatusColor(currentStatus)} text-white mb-2`}>
                    <CarIcon size={32} />
                  </div>
                  <h3 className="text-xl font-bold">{getStatusText(currentStatus)}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <MapPinIcon size={14} className="mr-1" />
                      <span>Pickup</span>
                    </div>
                    <p className="text-sm">{demoRide?.pickupAddress || '123 Main St'}</p>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <MapPinIcon size={14} className="mr-1" />
                      <span>Destination</span>
                    </div>
                    <p className="text-sm">{demoRide?.destinationAddress || '456 Market St'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-muted/50 p-2 rounded-md text-center">
                    <div className="flex items-center justify-center text-sm text-muted-foreground mb-1">
                      <DollarSignIcon size={14} className="mr-1" />
                      <span>Fare</span>
                    </div>
                    <p className="font-medium">${demoRide?.estimatedFare || '15.50'}</p>
                  </div>
                  
                  <div className="bg-muted/50 p-2 rounded-md text-center">
                    <div className="flex items-center justify-center text-sm text-muted-foreground mb-1">
                      <ClockIcon size={14} className="mr-1" />
                      <span>ETA</span>
                    </div>
                    <p className="font-medium">{formatDuration(demoRide?.estimatedDuration || 12)}</p>
                  </div>
                  
                  <div className="bg-muted/50 p-2 rounded-md text-center">
                    <div className="flex items-center justify-center text-sm text-muted-foreground mb-1">
                      <InfoIcon size={14} className="mr-1" />
                      <span>Distance</span>
                    </div>
                    <p className="font-medium">{formatDistance(demoRide?.estimatedDistance || 2.3)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-muted-foreground mb-4">No active ride</div>
                <Button onClick={handleDemoRideRequest}>
                  {mode === 'rider' ? 'Request a Ride' : 'Look for Riders'}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="mt-0 p-0">
            <div className="space-y-4">
              <h3 className="font-medium">Driver Details</h3>
              {currentStatus === 'accepted' || currentStatus === 'in_progress' ? (
                <div className="bg-muted/30 p-3 rounded-lg flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <CarIcon size={20} />
                  </div>
                  <div>
                    <p className="font-medium">John Driver</p>
                    <div className="text-sm text-muted-foreground">
                      <span>Toyota Camry • </span>
                      <span>ABC-123 • </span>
                      <span>⭐ 4.8</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  {currentStatus === 'requested' 
                    ? 'Matching with a driver...' 
                    : 'No driver assigned'}
                </div>
              )}
              
              <h3 className="font-medium mt-4">Location Updates</h3>
              {driverLocation ? (
                <div className="text-sm">
                  <p>Driver is at: {driverLocation.latitude.toFixed(6)}, {driverLocation.longitude.toFixed(6)}</p>
                  <p className="text-muted-foreground mt-1">
                    Last updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No location updates available
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="debug" className="mt-0 p-0">
            <div className="space-y-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Connection Debug</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleDemoMode}
                >
                  {isDemo ? 'Use Real Connection' : 'Use Demo Mode'}
                </Button>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="text-xs font-mono bg-muted p-2 rounded h-24 overflow-auto">
                <div>Mode: {mode}</div>
                <div>Status: {currentStatus || 'idle'}</div>
                <div>Connected: {connected ? 'yes' : 'no'}</div>
                <div>Demo: {isDemo ? 'yes' : 'no'}</div>
                {lastEvent && (
                  <>
                    <div className="mt-2 font-semibold">Last Event:</div>
                    <div>Type: {lastEvent.type}</div>
                    <div>Time: {lastEvent.timestamp}</div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        {currentStatus && (
          <Button 
            variant="outline" 
            onClick={() => {
              if (isDemo) {
                setCurrentStatus('cancelled');
                setTimeout(() => setCurrentStatus(null), 2000);
              } else {
                sendMessage({
                  type: 'cancel_ride',
                  rideId: demoRide?.id || 0,
                  timestamp: new Date().toISOString()
                });
              }
            }}
          >
            Cancel
          </Button>
        )}
        
        {currentStatus === 'requested' && mode === 'driver' && (
          <Button 
            onClick={() => {
              if (isDemo) {
                setCurrentStatus('accepted');
              } else {
                sendMessage({
                  type: 'accept_ride',
                  rideId: demoRide?.id || 0,
                  timestamp: new Date().toISOString()
                });
              }
            }}
          >
            Accept Ride
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X, MinusCircle, Maximize2, MapPin, Navigation, CornerDownLeft, Car, Clock } from 'lucide-react';
import { getWazeDeepLink, getWazeRouteDeepLink } from '@/lib/wazeIntegration';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { estimateTravelTime, formatDuration, formatDistance } from '@/lib/mapUtils';

interface WazeEmbeddedNavigationProps {
  destination?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  route?: {
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    name?: string;
    distance?: number;
  };
  height?: string;
  width?: string;
  showAsModal?: boolean;
  onClose?: () => void;
  onArrived?: () => void; // Callback when navigation is complete
  onRideStart?: () => void; // Callback when driver has started the ride
}

// Navigation states
type NavigationStatus = 'loading' | 'navigating' | 'approaching' | 'arrived' | 'error';

export function WazeEmbeddedNavigation({
  destination,
  route,
  height = '500px',
  width = '100%',
  showAsModal = false,
  onClose,
  onArrived,
  onRideStart
}: WazeEmbeddedNavigationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(showAsModal);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [navigationStatus, setNavigationStatus] = useState<NavigationStatus>('loading');
  const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null);
  const [rideStarted, setRideStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Calculate estimated arrival time based on distance
  useEffect(() => {
    if (route?.distance) {
      // Calculate minutes based on distance
      const travelTimeMinutes = estimateTravelTime(route.distance);
      
      // Create estimated arrival time
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() + travelTimeMinutes);
      
      setEstimatedArrival(arrivalTime);
    }
  }, [route]);

  // Simulating navigation status changes
  // In a real implementation, this would come from WebSocket events or API polling
  useEffect(() => {
    if (!isLoading && route) {
      // Initial state after loading
      setNavigationStatus('navigating');
      
      // Simulate approach after a delay
      const approachTimer = setTimeout(() => {
        setNavigationStatus('approaching');
        
        // Simulate arrival after another delay
        const arrivalTimer = setTimeout(() => {
          setNavigationStatus('arrived');
          if (onArrived) onArrived();
        }, 30000); // 30 seconds to arrival
        
        return () => clearTimeout(arrivalTimer);
      }, 20000); // 20 seconds to approach
      
      return () => clearTimeout(approachTimer);
    }
  }, [isLoading, onArrived, route]);

  // Generate the appropriate Waze URL
  const getWazeUrl = () => {
    if (route) {
      return getWazeRouteDeepLink(
        route.startLatitude,
        route.startLongitude,
        route.endLatitude,
        route.endLongitude,
        route.name
      );
    } else if (destination) {
      return getWazeDeepLink(
        destination.latitude,
        destination.longitude,
        destination.name
      );
    }
    
    // Default to a fallback URL if no coordinates provided
    return 'https://waze.com';
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (showAsModal) setIsModalOpen(false);
  };
  
  const handleLoadComplete = () => {
    setIsLoading(false);
  };
  
  const handleStartRide = () => {
    setRideStarted(true);
    if (onRideStart) onRideStart();
  };

  // Minimize functionality
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Fullscreen functionality
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Calculate dimensions based on state
  const frameHeight = isMinimized ? '60px' : isFullscreen ? '100vh' : height;
  const frameWidth = isFullscreen ? '100%' : width;

  // Get navigation title based on props
  const getNavigationTitle = () => {
    if (route) {
      return route.name ? `Route to ${route.name}` : 'Route Navigation';
    } else if (destination) {
      return destination.name ? `Navigate to ${destination.name}` : 'Navigation';
    }
    return 'Navigation';
  };
  
  // Return navigation status badge
  const getStatusBadge = () => {
    switch (navigationStatus) {
      case 'loading':
        return <Badge variant="outline" className="bg-slate-100">Loading...</Badge>;
      case 'navigating':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Navigating</Badge>;
      case 'approaching':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Approaching</Badge>;
      case 'arrived':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Arrived</Badge>;
      case 'error':
        return <Badge variant="destructive">Navigation Error</Badge>;
      default:
        return null;
    }
  };

  // Format estimated arrival time
  const formatArrivalTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Create iframe content
  const navigationContent = (
    <Card 
      className={`waze-navigation-container ${isFullscreen ? 'fixed top-0 left-0 z-50 w-full h-full' : 'relative'}`}
      style={{ width: frameWidth }}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          <CardTitle className="text-base">{getNavigationTitle()}</CardTitle>
          <div className="ml-2">{getStatusBadge()}</div>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={toggleMinimize}
          >
            <MinusCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <>
          <CardContent className="p-0 relative" style={{ height: isFullscreen ? 'calc(100vh - 130px)' : (parseInt(frameHeight) - 130) + 'px' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading navigation...</span>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={getWazeUrl()}
              style={{ width: '100%', height: '100%', border: 'none' }}
              onLoad={handleLoadComplete}
              title="Waze Navigation"
              className="block"
            />
          </CardContent>
          
          <CardFooter className="p-3 pt-2 border-t">
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                {route?.distance && (
                  <div className="flex items-center text-sm">
                    <Car className="h-4 w-4 mr-1" />
                    <span>{formatDistance(route.distance)}</span>
                  </div>
                )}
                
                {estimatedArrival && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>ETA: {formatArrivalTime(estimatedArrival)}</span>
                  </div>
                )}
              </div>
              
              {!rideStarted && onRideStart && (
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={handleStartRide}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Start Ride
                </Button>
              )}
              
              {navigationStatus === 'arrived' && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleClose}
                >
                  <CornerDownLeft className="h-4 w-4 mr-2" />
                  Complete Navigation
                </Button>
              )}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );

  // Return content based on modal or inline mode
  if (showAsModal) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="p-0 max-w-[90vw] max-h-[90vh]" style={{ width: '90vw', height: '90vh' }}>
          {navigationContent}
        </DialogContent>
      </Dialog>
    );
  }

  return navigationContent;
}
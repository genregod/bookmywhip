import { useState, useEffect } from 'react';
import AzureMapView from './AzureMapView';
import { LocationTracker } from './LocationTracker';
import { Ride } from '@/hooks/use-rides';
import { useLocation } from '@/hooks/use-location';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistance, formatDuration } from '@/lib/mapUtils';

interface RideMapProps {
  ride: Ride;
  driverLocation?: { latitude: number; longitude: number } | null;
  showDriverControls?: boolean;
  showRiderControls?: boolean;
  className?: string;
}

export function RideMap({
  ride,
  driverLocation = null,
  showDriverControls = false,
  showRiderControls = false, 
  className = ''
}: RideMapProps) {
  const { currentLocation } = useLocation();
  const [markers, setMarkers] = useState<any[]>([]);
  const [path, setPath] = useState<any | undefined>(undefined);
  
  // Update markers when ride details or locations change
  useEffect(() => {
    const newMarkers = [];
    
    // Add pickup marker
    newMarkers.push({
      lat: ride.pickupLatitude,
      lng: ride.pickupLongitude,
      type: 'pickup',
      label: 'Pickup'
    });
    
    // Add destination marker
    newMarkers.push({
      lat: ride.destinationLatitude,
      lng: ride.destinationLongitude,
      type: 'destination',
      label: 'Destination'
    });
    
    // Add current rider location marker if we have it
    if (currentLocation && showRiderControls) {
      newMarkers.push({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        type: 'rider',
        label: 'You'
      });
    }
    
    // Add current driver location marker if we have it
    if (driverLocation && (ride.status === 'accepted' || ride.status === 'in_progress')) {
      newMarkers.push({
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
        type: 'driver',
        label: 'Driver'
      });
    }
    
    setMarkers(newMarkers);
    
    // Update path based on ride status
    if (ride.status === 'accepted') {
      // When accepted but not yet in progress, show path from driver to pickup
      if (driverLocation) {
        setPath({
          points: [
            { lat: driverLocation.latitude, lng: driverLocation.longitude },
            { lat: ride.pickupLatitude, lng: ride.pickupLongitude }
          ],
          color: '#3B82F6' // Blue
        });
      }
    } else if (ride.status === 'in_progress') {
      // When in progress, show path from current location to destination
      const startPoint = driverLocation 
        ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
        : { lat: ride.pickupLatitude, lng: ride.pickupLongitude };
        
      setPath({
        points: [
          startPoint,
          { lat: ride.destinationLatitude, lng: ride.destinationLongitude }
        ],
        color: '#10B981' // Green
      });
    } else {
      // For requested or other statuses, show pickup to destination
      setPath({
        points: [
          { lat: ride.pickupLatitude, lng: ride.pickupLongitude },
          { lat: ride.destinationLatitude, lng: ride.destinationLongitude }
        ],
        color: '#4F46E5' // Indigo
      });
    }
  }, [ride, driverLocation, currentLocation, showRiderControls]);
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        <div className="h-64 md:h-80">
          <AzureMapView 
            markers={markers}
            path={path}
            className="h-full w-full"
            center={driverLocation ? { 
              lat: driverLocation.latitude, 
              lng: driverLocation.longitude 
            } : undefined}
          />
        </div>
        
        {/* Ride Info Overlay */}
        <div className="absolute bottom-4 left-0 right-0 mx-4">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-3 flex flex-wrap justify-between items-center text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">
                  {getRideStatusText(ride.status)}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary"/>
                <span>
                  {formatDistance(ride.estimatedDistance)}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary"/>
                <span>
                  {formatDuration(ride.estimatedDuration)}
                </span>
              </div>
              <div className="font-semibold">
                ${ride.actualFare || ride.estimatedFare.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Location Tracker for drivers */}
        {showDriverControls && (
          <div className="absolute top-4 right-4">
            <Card className="w-auto bg-white/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-3">
                <LocationTracker 
                  shareLocation={true} 
                  showControls={true}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get human-readable ride status
function getRideStatusText(status: string): string {
  switch (status) {
    case 'requested': return 'Searching for driver';
    case 'accepted': return 'Driver on the way';
    case 'in_progress': return 'In progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return 'Unknown status';
  }
}
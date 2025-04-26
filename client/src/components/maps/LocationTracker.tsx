import { useState, useEffect, useRef } from 'react';
import { useLocation } from '@/hooks/use-location';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuth } from '@/hooks/use-auth';
import { WS_MESSAGE_TYPES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { MapPinIcon, AlertCircleIcon } from 'lucide-react';

interface LocationTrackerProps {
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  shareLocation?: boolean;
  showControls?: boolean;
  className?: string;
}

export function LocationTracker({
  onLocationUpdate,
  shareLocation = false,
  showControls = false,
  className = ''
}: LocationTrackerProps) {
  const { user } = useAuth();
  const { currentLocation, watchLocation, stopWatching, error: locationError } = useLocation();
  const { connected, sendMessage } = useWebSocket();
  const [isSharing, setIsSharing] = useState(shareLocation);
  const lastSentLocation = useRef<{ latitude: number; longitude: number } | null>(null);

  // Start location tracking when component mounts
  useEffect(() => {
    watchLocation();
    
    return () => {
      stopWatching();
    };
  }, [watchLocation, stopWatching]);

  // Report location changes to the parent component
  useEffect(() => {
    if (currentLocation && onLocationUpdate) {
      onLocationUpdate(currentLocation);
    }
  }, [currentLocation, onLocationUpdate]);

  // Share location via WebSocket if enabled
  useEffect(() => {
    if (!isSharing || !connected || !currentLocation || !user) return;
    
    // Only send if location changed significantly (more than 10 meters)
    const hasSignificantChange = !lastSentLocation.current || 
      calculateDistanceInMeters(
        lastSentLocation.current.latitude, 
        lastSentLocation.current.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      ) > 10;
    
    if (hasSignificantChange) {
      sendMessage({
        type: WS_MESSAGE_TYPES.DRIVER_LOCATION_UPDATE,
        userId: user.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: new Date().toISOString()
      });
      
      lastSentLocation.current = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      };
    }
  }, [currentLocation, connected, sendMessage, isSharing, user]);

  // Toggle location sharing
  const toggleSharing = () => {
    setIsSharing(prev => !prev);
  };

  return (
    <div className={`relative ${className}`}>
      {locationError && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm flex items-center space-x-2">
          <AlertCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span>
            {locationError === 'denied' 
              ? 'Location access denied. Please enable location services.'
              : 'Error accessing your location. Please try again.'}
          </span>
        </div>
      )}
      
      {currentLocation && (
        <div className="text-sm flex items-center space-x-1 text-muted-foreground">
          <MapPinIcon className="h-4 w-4" />
          <span>
            {`${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`}
          </span>
          {isSharing && connected && (
            <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
      )}
      
      {showControls && (
        <div className="mt-2">
          <Button 
            size="sm" 
            variant={isSharing ? "default" : "outline"}
            onClick={toggleSharing}
          >
            {isSharing ? 'Sharing Location' : 'Share Location'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate distance between two coordinates in meters
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
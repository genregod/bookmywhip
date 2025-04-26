import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';

type LocationError = 'denied' | 'unavailable' | 'timeout' | 'unknown';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

interface UseLocationResult {
  currentLocation: LocationState | null;
  watchLocation: () => void;
  stopWatching: () => void;
  error: LocationError | null;
  isWatching: boolean;
}

export function useLocation(): UseLocationResult {
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Success handler for geolocation API
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setError(null);
    setCurrentLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp
    });
  }, []);

  // Error handler for geolocation API
  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorType: LocationError = 'unknown';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorType = 'denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorType = 'unavailable';
        break;
      case error.TIMEOUT:
        errorType = 'timeout';
        break;
    }
    
    setError(errorType);
    
    // If position is completely unavailable, use default
    if (errorType === 'unavailable' && !currentLocation) {
      setCurrentLocation({
        latitude: DEFAULT_MAP_CENTER.lat,
        longitude: DEFAULT_MAP_CENTER.lng
      });
    }
  }, [currentLocation]);

  // Start watching position
  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('unavailable');
      return;
    }

    // Clear any existing watch
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });

    // Start watching position
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });

    setWatchId(id);
    setIsWatching(true);
  }, [handleSuccess, handleError, watchId]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
    }
  }, [watchId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    currentLocation,
    watchLocation,
    stopWatching,
    error,
    isWatching
  };
}
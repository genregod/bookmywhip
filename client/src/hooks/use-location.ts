import { useState, useEffect, useCallback, useRef } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface UseLocationResult {
  currentLocation: LocationData | null;
  watchLocation: () => void;
  stopWatching: () => void;
  error: string | null;
  isWatching: boolean;
}

/**
 * Hook for getting and tracking the user's location
 */
export function useLocation(): UseLocationResult {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Handle successful location acquisition
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    setCurrentLocation({
      latitude,
      longitude,
      accuracy,
      timestamp: position.timestamp
    });
    setError(null);
  }, []);

  // Handle location errors
  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'User denied the request for geolocation';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'The request to get user location timed out';
        break;
      default:
        errorMessage = 'An unknown error occurred';
        break;
    }
    setError(errorMessage);
  }, []);

  // Get current position once
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  }, [handleSuccess, handleError]);

  // Start watching position
  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsWatching(true);
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
    watchIdRef.current = watchId;
  }, [handleSuccess, handleError]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    currentLocation,
    watchLocation,
    stopWatching,
    error,
    isWatching
  };
}
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Location {
  id: number;
  userId?: number;
  name?: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  isFavorite: boolean;
}

interface CreateLocationData {
  name?: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: string;
  isFavorite?: boolean;
}

interface UseLocationResult {
  savedLocations: Location[];
  isLoading: boolean;
  currentLocation: GeolocationCoordinates | null;
  getCurrentAddress: () => Promise<string>;
  saveLocation: (location: CreateLocationData) => Promise<Location>;
  updateLocation: (id: number, location: Partial<CreateLocationData>) => Promise<Location>;
  deleteLocation: (id: number) => Promise<void>;
}

export function useLocation(): UseLocationResult {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);

  // Get saved locations
  const { 
    data: savedLocations = [], 
    isLoading,
  } = useQuery<Location[]>({ 
    queryKey: ['/api/locations'],
    enabled: !!queryClient.getQueryData(['/api/me']), // Only fetch if logged in
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: CreateLocationData) => {
      const response = await apiRequest('POST', '/api/locations', data);
      return response.json();
    },
    onSuccess: (newLocation) => {
      queryClient.setQueryData(
        ['/api/locations'], 
        (old: Location[] | undefined) => [...(old || []), newLocation]
      );
      toast({
        title: 'Location saved',
        description: `${newLocation.name || 'Location'} has been saved`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving location',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CreateLocationData> }) => {
      const response = await apiRequest('PATCH', `/api/locations/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedLocation) => {
      queryClient.setQueryData(
        ['/api/locations'], 
        (old: Location[] | undefined) => 
          (old || []).map(loc => loc.id === updatedLocation.id ? updatedLocation : loc)
      );
      toast({
        title: 'Location updated',
        description: `${updatedLocation.name || 'Location'} has been updated`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating location',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/locations/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        ['/api/locations'], 
        (old: Location[] | undefined) => 
          (old || []).filter(loc => loc.id !== id)
      );
      toast({
        title: 'Location deleted',
        description: 'The location has been deleted',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting location',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Get current location using browser geolocation API
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position.coords);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location access denied',
            description: 'Please enable location access for better experience',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Get address from coordinates using a geocoding service
  // In a real app, you would use a geocoding API like Google's
  const getCurrentAddress = useCallback(async (): Promise<string> => {
    if (!currentLocation) {
      throw new Error('Current location not available');
    }
    
    // In a real app, you would make an API call here
    // For now, we'll return a placeholder
    return Promise.resolve('Current Location');
  }, [currentLocation]);

  const saveLocation = useCallback(async (location: CreateLocationData): Promise<Location> => {
    return await createLocationMutation.mutateAsync(location);
  }, [createLocationMutation]);

  const updateLocation = useCallback(async (id: number, location: Partial<CreateLocationData>): Promise<Location> => {
    return await updateLocationMutation.mutateAsync({ id, data: location });
  }, [updateLocationMutation]);

  const deleteLocation = useCallback(async (id: number): Promise<void> => {
    await deleteLocationMutation.mutateAsync(id);
  }, [deleteLocationMutation]);

  return {
    savedLocations,
    isLoading,
    currentLocation,
    getCurrentAddress,
    saveLocation,
    updateLocation,
    deleteLocation,
  };
}

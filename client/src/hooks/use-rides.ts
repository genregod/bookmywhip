import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './use-auth';
import { FARE_CONSTANTS, VEHICLE_TYPES } from '@/lib/constants';
import { 
  calculateDistance, 
  calculateEstimatedDuration, 
  calculateEstimatedFare 
} from '@/lib/mapUtils';

export interface Ride {
  id: number;
  riderId: number;
  driverId?: number;
  vehicleId?: number;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  vehicleType: 'economy' | 'premium';
  baseFare: number;
  perMileRate: number;
  perMinuteRate: number;
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedFare: number;
  actualFare?: number;
  platformFee?: number;
  driverPayout?: number;
  paymentIntentId?: string;
  paymentStatus?: string;
  riderRating?: number;
  driverRating?: number;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface CreateRideData {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  vehicleType: 'economy' | 'premium';
}

interface UseRidesResult {
  rides: Ride[];
  activeRide: Ride | null;
  isLoading: boolean;
  isActive: boolean;
  createRide: (rideData: CreateRideData) => Promise<Ride>;
  acceptRide: (rideId: number) => Promise<Ride>;
  startRide: (rideId: number) => Promise<Ride>;
  completeRide: (rideId: number) => Promise<Ride>;
  cancelRide: (rideId: number) => Promise<Ride>;
  rateRide: (rideId: number, rating: number) => Promise<Ride>;
  calculateFare: (
    pickupLat: number, 
    pickupLng: number, 
    destLat: number, 
    destLng: number, 
    vehicleType: 'economy' | 'premium'
  ) => { 
    distance: number, 
    duration: number, 
    fare: number 
  };
}

export function useRides(): UseRidesResult {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get all rides
  const { 
    data: rides = [], 
    isLoading: isRidesLoading,
  } = useQuery<Ride[]>({ 
    queryKey: ['/api/rides'],
    enabled: !!user, // Only fetch if logged in
  });

  // Get active ride
  const { 
    data: activeRide = null, 
    isLoading: isActiveRideLoading,
  } = useQuery<Ride | null>({ 
    queryKey: ['/api/rides/active'],
    enabled: !!user, // Only fetch if logged in
    refetchInterval: 5000, // Poll for updates every 5 seconds
  });

  // Create ride mutation
  const createRideMutation = useMutation({
    mutationFn: async (data: CreateRideData) => {
      // Calculate distance and duration
      const distanceInKm = calculateDistance(
        data.pickupLatitude,
        data.pickupLongitude,
        data.destinationLatitude,
        data.destinationLongitude
      );
      
      const durationInMinutes = calculateEstimatedDuration(distanceInKm);
      
      // Get fare constants based on vehicle type
      const baseFare = FARE_CONSTANTS.BASE_FARE[data.vehicleType];
      const perMileRate = FARE_CONSTANTS.PER_MILE_RATE[data.vehicleType];
      const perMinuteRate = FARE_CONSTANTS.PER_MINUTE_RATE[data.vehicleType];
      
      // Calculate estimated fare
      const estimatedFare = calculateEstimatedFare(
        distanceInKm,
        durationInMinutes,
        baseFare,
        perMileRate,
        perMinuteRate
      );
      
      // Create the complete ride request
      const rideRequest = {
        ...data,
        baseFare,
        perMileRate,
        perMinuteRate,
        estimatedDistance: distanceInKm,
        estimatedDuration: durationInMinutes,
        estimatedFare: parseFloat(estimatedFare.toFixed(2)),
      };
      
      const response = await apiRequest('POST', '/api/rides', rideRequest);
      return response.json();
    },
    onSuccess: (newRide) => {
      queryClient.setQueryData(['/api/rides/active'], newRide);
      queryClient.setQueryData(
        ['/api/rides'], 
        (old: Ride[] | undefined) => [...(old || []), newRide]
      );
      toast({
        title: 'Ride requested',
        description: 'Looking for a driver...',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating ride',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Accept ride mutation (driver only)
  const acceptRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest('POST', `/api/rides/${rideId}/accept`);
      return response.json();
    },
    onSuccess: (updatedRide) => {
      queryClient.setQueryData(['/api/rides/active'], updatedRide);
      queryClient.setQueryData(
        ['/api/rides'], 
        (old: Ride[] | undefined) => 
          (old || []).map(ride => ride.id === updatedRide.id ? updatedRide : ride)
      );
      toast({
        title: 'Ride accepted',
        description: 'You have accepted the ride request',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error accepting ride',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Start ride mutation (driver only)
  const startRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest('POST', `/api/rides/${rideId}/start`);
      return response.json();
    },
    onSuccess: (updatedRide) => {
      queryClient.setQueryData(['/api/rides/active'], updatedRide);
      queryClient.setQueryData(
        ['/api/rides'], 
        (old: Ride[] | undefined) => 
          (old || []).map(ride => ride.id === updatedRide.id ? updatedRide : ride)
      );
      toast({
        title: 'Ride started',
        description: 'Your ride has started',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error starting ride',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Complete ride mutation (driver only)
  const completeRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest('POST', `/api/rides/${rideId}/complete`);
      return response.json();
    },
    onSuccess: (updatedRide) => {
      queryClient.setQueryData(['/api/rides/active'], null);
      queryClient.setQueryData(
        ['/api/rides'], 
        (old: Ride[] | undefined) => 
          (old || []).map(ride => ride.id === updatedRide.id ? updatedRide : ride)
      );
      toast({
        title: 'Ride completed',
        description: 'Your ride has been completed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error completing ride',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Cancel ride mutation
  const cancelRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest('POST', `/api/rides/${rideId}/cancel`);
      return response.json();
    },
    onSuccess: (updatedRide) => {
      queryClient.setQueryData(['/api/rides/active'], null);
      queryClient.setQueryData(
        ['/api/rides'], 
        (old: Ride[] | undefined) => 
          (old || []).map(ride => ride.id === updatedRide.id ? updatedRide : ride)
      );
      toast({
        title: 'Ride cancelled',
        description: 'Your ride has been cancelled',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error cancelling ride',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Rate ride mutation
  const rateRideMutation = useMutation({
    mutationFn: async ({ rideId, rating }: { rideId: number, rating: number }) => {
      const response = await apiRequest('POST', `/api/rides/${rideId}/rate`, { rating });
      return response.json();
    },
    onSuccess: (updatedRide) => {
      queryClient.setQueryData(
        ['/api/rides'], 
        (old: Ride[] | undefined) => 
          (old || []).map(ride => ride.id === updatedRide.id ? updatedRide : ride)
      );
      toast({
        title: 'Rating submitted',
        description: 'Thank you for your feedback',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error submitting rating',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Create a new ride
  const createRide = useCallback(async (rideData: CreateRideData): Promise<Ride> => {
    return await createRideMutation.mutateAsync(rideData);
  }, [createRideMutation]);

  // Accept a ride request (driver only)
  const acceptRide = useCallback(async (rideId: number): Promise<Ride> => {
    return await acceptRideMutation.mutateAsync(rideId);
  }, [acceptRideMutation]);

  // Start a ride (driver only)
  const startRide = useCallback(async (rideId: number): Promise<Ride> => {
    return await startRideMutation.mutateAsync(rideId);
  }, [startRideMutation]);

  // Complete a ride (driver only)
  const completeRide = useCallback(async (rideId: number): Promise<Ride> => {
    return await completeRideMutation.mutateAsync(rideId);
  }, [completeRideMutation]);

  // Cancel a ride
  const cancelRide = useCallback(async (rideId: number): Promise<Ride> => {
    return await cancelRideMutation.mutateAsync(rideId);
  }, [cancelRideMutation]);

  // Rate a ride
  const rateRide = useCallback(async (rideId: number, rating: number): Promise<Ride> => {
    return await rateRideMutation.mutateAsync({ rideId, rating });
  }, [rateRideMutation]);

  // Calculate fare for a potential ride
  const calculateFare = useCallback((
    pickupLat: number, 
    pickupLng: number, 
    destLat: number, 
    destLng: number, 
    vehicleType: 'economy' | 'premium'
  ) => {
    const distanceInKm = calculateDistance(pickupLat, pickupLng, destLat, destLng);
    const durationInMinutes = calculateEstimatedDuration(distanceInKm);
    
    const baseFare = FARE_CONSTANTS.BASE_FARE[vehicleType];
    const perMileRate = FARE_CONSTANTS.PER_MILE_RATE[vehicleType];
    const perMinuteRate = FARE_CONSTANTS.PER_MINUTE_RATE[vehicleType];
    
    const fare = calculateEstimatedFare(
      distanceInKm,
      durationInMinutes,
      baseFare,
      perMileRate,
      perMinuteRate
    );
    
    return {
      distance: distanceInKm,
      duration: durationInMinutes,
      fare: parseFloat(fare.toFixed(2))
    };
  }, []);

  return {
    rides,
    activeRide,
    isLoading: isRidesLoading || isActiveRideLoading,
    isActive: !!activeRide,
    createRide,
    acceptRide,
    startRide,
    completeRide,
    cancelRide,
    rateRide,
    calculateFare
  };
}

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { calculateDistance } from "@/lib/mapUtils";

// Define driver interface
interface Driver {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  vehicle: string;
  vehicleType: 'economy' | 'premium';
  isAvailable: boolean;
}

// Define driver with distance interface
interface DriverWithDistance extends Driver {
  distance: number;
}

// Define nearby drivers request interface
interface FindNearbyDriversRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  vehicleType?: 'economy' | 'premium';
  limit?: number;
}

/**
 * Hook for driver matching functionality
 * Provides access to the matching algorithm with Azure Functions fallback
 */
export function useDriverMatching() {
  const { toast } = useToast();
  const [nearbyDrivers, setNearbyDrivers] = useState<DriverWithDistance[]>([]);
  
  // Mutation for finding nearby drivers (using local computation)
  const findDriversMutation = useMutation({
    mutationFn: async (params: FindNearbyDriversRequest) => {
      const { latitude, longitude, radius = 5, vehicleType = 'economy', limit = 10 } = params;
      
      // Simulated API call to Azure Function (in production, this would be a real API call)
      // const response = await fetch(`${AZURE_FUNCTION_BASE_URL}/nearby-drivers`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(params),
      // });
      // return await response.json();
      
      // For now, simulate driver matching locally
      return simulateNearbyDrivers(latitude, longitude, vehicleType, radius, limit);
    },
    onSuccess: (data) => {
      setNearbyDrivers(data.drivers);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Finding Nearby Drivers',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Generate simulated drivers at given coordinates
  function simulateNearbyDrivers(
    latitude: number,
    longitude: number,
    vehicleType: 'economy' | 'premium' = 'economy',
    radius: number = 5,
    limit: number = 10
  ) {
    // Generate random drivers around the specified location
    const mockDrivers: Driver[] = [
      { id: 1, name: "John D.", latitude: latitude + 0.01, longitude: longitude + 0.01, rating: 4.8, vehicle: "Toyota Camry", vehicleType: "economy", isAvailable: true },
      { id: 2, name: "Emily S.", latitude: latitude - 0.005, longitude: longitude + 0.015, rating: 4.9, vehicle: "Tesla Model 3", vehicleType: "premium", isAvailable: true },
      { id: 3, name: "Michael K.", latitude: latitude + 0.02, longitude: longitude - 0.01, rating: 4.7, vehicle: "Honda Civic", vehicleType: "economy", isAvailable: true },
      { id: 4, name: "Jessica T.", latitude: latitude - 0.01, longitude: longitude - 0.02, rating: 4.6, vehicle: "BMW X5", vehicleType: "premium", isAvailable: true },
      { id: 5, name: "David L.", latitude: latitude + 0.03, longitude: longitude + 0.02, rating: 4.9, vehicle: "Ford Fusion", vehicleType: "economy", isAvailable: true },
      { id: 6, name: "Sarah M.", latitude: latitude - 0.02, longitude: longitude - 0.01, rating: 4.5, vehicle: "Toyota Prius", vehicleType: "economy", isAvailable: true },
      { id: 7, name: "Robert J.", latitude: latitude + 0.015, longitude: longitude + 0.025, rating: 4.7, vehicle: "Mercedes E-Class", vehicleType: "premium", isAvailable: true },
      { id: 8, name: "Lisa N.", latitude: latitude - 0.025, longitude: longitude + 0.01, rating: 4.8, vehicle: "Hyundai Sonata", vehicleType: "economy", isAvailable: true },
      { id: 9, name: "Kevin O.", latitude: latitude + 0.005, longitude: longitude - 0.015, rating: 4.6, vehicle: "Audi A6", vehicleType: "premium", isAvailable: true },
      { id: 10, name: "Amanda P.", latitude: latitude - 0.015, longitude: longitude - 0.005, rating: 4.9, vehicle: "Honda Accord", vehicleType: "economy", isAvailable: true }
    ];
    
    // Filter by vehicle type
    const filteredByType = mockDrivers.filter(driver => 
      driver.vehicleType === vehicleType
    );
    
    // Calculate distances
    const driversWithDistance = filteredByType.map(driver => {
      const distance = calculateDistance(
        latitude,
        longitude,
        driver.latitude,
        driver.longitude
      );
      
      return {
        ...driver,
        distance
      };
    });
    
    // Filter by radius
    const inRadius = driversWithDistance.filter(driver => 
      driver.distance <= radius
    );
    
    // Sort by distance
    const sorted = inRadius.sort((a, b) => 
      a.distance - b.distance
    );
    
    // Apply limit
    const limited = sorted.slice(0, limit);
    
    return {
      drivers: limited,
      total: limited.length,
      searchCenter: { latitude, longitude },
      radius,
      vehicleType
    };
  }
  
  /**
   * Find nearby drivers based on location and preferences
   */
  const findNearbyDriversByLocation = (params: FindNearbyDriversRequest) => {
    return findDriversMutation.mutateAsync(params);
  };
  
  /**
   * Update a driver's location
   */
  const updateDriverLocationById = (
    driverId: number, 
    latitude: number, 
    longitude: number,
    riderLatitude?: number,
    riderLongitude?: number
  ) => {
    // In a real implementation, this would call an Azure Function
    // Just update the local state for now
    setNearbyDrivers(prev => {
      return prev.map(driver => {
        if (driver.id === driverId) {
          // Recalculate distance if rider coordinates provided
          let newDistance = driver.distance;
          
          if (riderLatitude !== undefined && riderLongitude !== undefined) {
            newDistance = calculateDistance(
              riderLatitude,
              riderLongitude,
              latitude,
              longitude
            );
          }
          
          return {
            ...driver,
            latitude,
            longitude,
            distance: newDistance
          };
        }
        return driver;
      });
    });
    
    return Promise.resolve({
      message: "Driver location updated successfully",
      driverId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      distanceMoved: 0,
      calculatedSpeed: 0,
      heading: 0
    });
  };
  
  return {
    nearbyDrivers,
    setNearbyDrivers,
    findNearbyDriversByLocation,
    updateDriverLocationById,
    simulateNearbyDrivers,
    isLoading: findDriversMutation.isPending,
  };
}
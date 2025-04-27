/**
 * Azure Driver Matching Service
 * 
 * This module provides client-side functions to interact with the
 * Azure Functions that implement our advanced driver-rider matching algorithm.
 */

// Function endpoint URLs (these would be populated from environment variables in production)
const AZURE_FUNCTION_BASE_URL = import.meta.env.VITE_AZURE_FUNCTION_URL || 'https://bookmywhip-func.azurewebsites.net/api';
const AZURE_FUNCTION_KEY = import.meta.env.VITE_AZURE_FUNCTION_KEY || '';

/**
 * Headers for Azure Function calls with authentication
 */
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add function key if available
  if (AZURE_FUNCTION_KEY) {
    headers['x-functions-key'] = AZURE_FUNCTION_KEY;
  }
  
  return headers;
};

/**
 * Interface for nearby driver request parameters
 */
export interface FindNearbyDriversRequest {
  latitude: number;
  longitude: number;
  radius?: number;  // in kilometers, default: 5
  vehicleType?: 'economy' | 'premium';  // default: 'economy'
  limit?: number;  // max number of drivers to return, default: 10
}

/**
 * Interface for driver match result
 */
export interface DriverWithDistance {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;  // in kilometers
  rating: number;
  vehicle: string;
  vehicleType: string;
  isAvailable: boolean;
}

/**
 * Interface for nearby drivers response
 */
export interface FindNearbyDriversResponse {
  drivers: DriverWithDistance[];
  total: number;
  searchCenter: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  vehicleType: string;
}

/**
 * Interface for optimal driver match request
 */
export interface MatchOptimalDriverRequest {
  riders: Array<{
    id: number;
    latitude: number;
    longitude: number;
    destination?: {
      latitude: number;
      longitude: number;
    };
  }>;
  drivers: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    rating: number;
    vehicle: string;
    vehicleType: string;
    isAvailable: boolean;
  }>;
  preferences?: {
    vehicleType?: string;
  };
  priceMultipliers?: {
    surge?: number;
    time?: number;
    distance?: number;
  };
  maxWaitTime?: number;  // in minutes
  maxEta?: number;  // in minutes
  priorityDrivers?: number[];
  urgentRides?: number[];
}

/**
 * Interface for optimal driver match result
 */
export interface MatchOptimalDriverResponse {
  matches: Array<{
    riderId: number;
    match: {
      driverId: number;
      distance: number;
      pickupTime: number;
      tripDistance: number;
      tripDuration: number;
      estimatedFare: number;
      matchScore: number;
      driver: {
        id: number;
        name: string;
        rating: number;
        vehicle: string;
        vehicleType: string;
      };
    } | null;
    reason?: string;
  }>;
  totalMatches: number;
  unmatched: number;
  timestamp: string;
}

/**
 * Interface for driver location update request
 */
export interface UpdateDriverLocationRequest {
  driverId: number;
  latitude: number;
  longitude: number;
  isAvailable?: boolean;
  status?: 'online' | 'offline' | 'busy' | 'break';
  heading?: number;  // direction in degrees (0-360)
  speed?: number;  // in km/h
  timestamp?: string;  // ISO datetime string
  activeRideId?: number | null;
}

/**
 * Interface for driver location update response
 */
export interface UpdateDriverLocationResponse {
  message: string;
  driverId: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  distanceMoved: number;
  calculatedSpeed: number;
  heading: number;
}

/**
 * Finds nearby drivers based on location and preferences
 * @param params Request parameters
 * @returns Promise with nearby drivers information
 */
export async function findNearbyDrivers(
  params: FindNearbyDriversRequest
): Promise<FindNearbyDriversResponse> {
  try {
    const response = await fetch(`${AZURE_FUNCTION_BASE_URL}/nearby-drivers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error finding nearby drivers: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    throw error;
  }
}

/**
 * Matches riders with optimal drivers using advanced algorithm
 * @param params Request parameters
 * @returns Promise with match results
 */
export async function matchOptimalDriver(
  params: MatchOptimalDriverRequest
): Promise<MatchOptimalDriverResponse> {
  try {
    const response = await fetch(`${AZURE_FUNCTION_BASE_URL}/optimal-match`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error matching optimal driver: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error matching optimal driver:', error);
    throw error;
  }
}

/**
 * Updates a driver's location in real-time
 * @param params Request parameters
 * @returns Promise with update confirmation
 */
export async function updateDriverLocation(
  params: UpdateDriverLocationRequest
): Promise<UpdateDriverLocationResponse> {
  try {
    const response = await fetch(`${AZURE_FUNCTION_BASE_URL}/driver-location`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error updating driver location: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
}

// Export all functions and types
export default {
  findNearbyDrivers,
  matchOptimalDriver,
  updateDriverLocation,
};
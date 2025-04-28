/**
 * Azure Maps service for BookMyWhip mobile app
 * This service handles map-related functionality including:
 * - Route calculation
 * - Geocoding
 * - Search
 */

import axios from 'axios';
import { API_CONFIG } from '../utils/config';

// Types
export interface RouteRequest {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  waypoints?: Array<{lat: number; lng: number}>;
}

export interface RouteResponse {
  distance: number; // meters
  duration: number; // seconds
  legs: Array<{
    points: Array<{lat: number; lng: number}>;
    distance: number;
    duration: number;
  }>;
  boundingBox: {
    topLeft: {lat: number; lng: number};
    bottomRight: {lat: number; lng: number};
  };
}

export interface GeocodeRequest {
  address: string;
  maxResults?: number;
}

export interface GeocodeResponse {
  results: Array<{
    id: string;
    address: {
      freeformAddress: string;
      country: string;
      countryCode: string;
      countryCodeISO3: string;
      countrySubdivision: string;
      countrySecondarySubdivision: string;
      municipality: string;
      postalCode: string;
      streetName: string;
      streetNumber: string;
    };
    position: {
      lat: number;
      lng: number;
    };
    score: number;
    type: string;
  }>;
}

export interface SearchRequest {
  query: string;
  lat?: number;
  lng?: number;
  radius?: number; // meters
  limit?: number;
}

// Azure Maps API interface
// This is implemented as a facade that calls our backend, which then makes the Azure Maps API calls
// This approach keeps our Azure Maps credentials secure on the server
class AzureMapsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api`;
  }

  /**
   * Calculate a route between two points
   * @param request Route request parameters
   * @returns Route data including distance, duration, and waypoints
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/maps/route`, request);
      return response.data;
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }

  /**
   * Get coordinates from an address (geocoding)
   * @param request Geocode request parameters
   * @returns Location information including coordinates
   */
  async geocodeAddress(request: GeocodeRequest): Promise<GeocodeResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/maps/geocode`, {
        params: request,
      });
      return response.data;
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  /**
   * Search for locations based on query
   * @param request Search request parameters
   * @returns Search results with location information
   */
  async searchLocations(request: SearchRequest): Promise<GeocodeResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/maps/search`, {
        params: request,
      });
      return response.data;
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }

  /**
   * Get estimated time of arrival
   * @param request Route request parameters
   * @returns ETA in seconds
   */
  async getETA(request: RouteRequest): Promise<number> {
    try {
      const route = await this.calculateRoute(request);
      return route.duration;
    } catch (error) {
      console.error('Error getting ETA:', error);
      throw error;
    }
  }

  /**
   * Get estimated fare for a route
   * @param request Route request parameters
   * @param vehicleType Type of vehicle ('economy' or 'premium')
   * @returns Estimated fare in dollars
   */
  async getEstimatedFare(
    request: RouteRequest,
    vehicleType: 'economy' | 'premium'
  ): Promise<number> {
    try {
      const response = await axios.post(`${this.baseUrl}/fare/estimate`, {
        route: request,
        vehicleType,
      });
      return response.data.estimatedFare;
    } catch (error) {
      console.error('Error getting estimated fare:', error);
      throw error;
    }
  }
}

export default new AzureMapsService();
import { BASE_FARE, PER_MILE_RATE, PER_MINUTE_RATE } from './constants';

/**
 * Format a distance in miles to a human-readable string
 * @param distance Distance in miles
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    // Convert to feet for very short distances
    const feet = Math.round(distance * 5280);
    return `${feet} ft`;
  } else if (distance < 10) {
    // Show one decimal place for distances less than 10 miles
    return `${distance.toFixed(1)} mi`;
  } else {
    // No decimal places for longer distances
    return `${Math.round(distance)} mi`;
  }
}

/**
 * Format a duration in minutes to a human-readable string
 * @param minutes Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    // Convert to seconds for very short durations
    const seconds = Math.round(minutes * 60);
    return `${seconds} sec`;
  } else if (minutes < 60) {
    // Show just minutes for durations less than an hour
    return `${Math.round(minutes)} min`;
  } else {
    // Show hours and minutes for longer durations
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Calculate the estimated fare for a ride
 * There are two ways to call this function:
 * 1. With distance, duration, and vehicleType
 * 2. With distance, duration, baseFare, perMileRate, and perMinuteRate
 * 
 * @param distance Distance in miles
 * @param duration Duration in minutes
 * @param vehicleTypeOrBaseFare Vehicle type ('economy' or 'premium') or base fare
 * @param perMileRate Per mile rate (optional if vehicleType is provided)
 * @param perMinuteRate Per minute rate (optional if vehicleType is provided)
 * @returns Estimated fare in dollars
 */
export function calculateFare(
  distance: number,
  duration: number,
  vehicleTypeOrBaseFare: 'economy' | 'premium' | number,
  perMileRate?: number,
  perMinuteRate?: number
): number {
  let baseFareValue: number;
  let perMileRateValue: number;
  let perMinuteRateValue: number;
  
  // Determine if the 3rd parameter is a vehicle type or base fare
  if (typeof vehicleTypeOrBaseFare === 'string') {
    // It's a vehicle type
    baseFareValue = BASE_FARE[vehicleTypeOrBaseFare];
    perMileRateValue = PER_MILE_RATE[vehicleTypeOrBaseFare];
    perMinuteRateValue = PER_MINUTE_RATE[vehicleTypeOrBaseFare];
  } else {
    // It's a base fare
    baseFareValue = vehicleTypeOrBaseFare;
    perMileRateValue = perMileRate || 0;
    perMinuteRateValue = perMinuteRate || 0;
  }
  
  const distanceFare = distance * perMileRateValue;
  const timeFare = duration * perMinuteRateValue;
  
  // Apply surge pricing factor (would come from backend in real app)
  const surgeFactor = 1.0;
  
  // Calculate total fare
  const totalFare = (baseFareValue + distanceFare + timeFare) * surgeFactor;
  
  // Apply service fee (fixed at 15%)
  const serviceFee = totalFare * 0.15;
  
  // Round to nearest cent
  return Math.round((totalFare + serviceFee) * 100) / 100;
}

/**
 * Calculate the distance between two sets of coordinates using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Radius of the Earth in miles
  const R = 3958.8;
  
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lng1Rad = (lng1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lng2Rad = (lng2 * Math.PI) / 180;
  
  // Differences in coordinates
  const dlat = lat2Rad - lat1Rad;
  const dlng = lng2Rad - lng1Rad;
  
  // Haversine formula
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Estimate travel duration based on distance
 * @param distance Distance in miles
 * @param trafficFactor Traffic factor (1.0 = normal, >1.0 = heavy traffic)
 * @returns Estimated duration in minutes
 */
export function estimateDuration(distance: number, trafficFactor = 1.0): number {
  // Assume average speed of 30 mph in the city
  const averageSpeedMph = 30 / trafficFactor;
  
  // Calculate time in hours, then convert to minutes
  const timeHours = distance / averageSpeedMph;
  const timeMinutes = timeHours * 60;
  
  // Add a fixed time for pickup/dropoff
  const pickupDropoffTime = 2; // minutes
  
  return timeMinutes + pickupDropoffTime;
}

/**
 * Generate a curved path between two points for map rendering
 * @param startLat Start latitude
 * @param startLng Start longitude
 * @param endLat End latitude
 * @param endLng End longitude
 * @param numPoints Number of points to generate in the path
 * @returns Array of lat/lng points forming a path
 */
export function generateDummyMapPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numPoints = 8
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  
  // Start point
  points.push({ lat: startLat, lng: startLng });
  
  // Generate intermediate points with a slight curve
  const latDiff = endLat - startLat;
  const lngDiff = endLng - startLng;
  
  for (let i = 1; i < numPoints - 1; i++) {
    const ratio = i / (numPoints - 1);
    
    // Add a slight curve to the path
    const curveStrength = 0.005; // Adjust for more or less curve
    const curveFactor = Math.sin(ratio * Math.PI) * curveStrength;
    
    // Perpendicular offset direction
    const perpLat = -lngDiff;
    const perpLng = latDiff;
    
    // Normalize the perpendicular vector
    const length = Math.sqrt(perpLat * perpLat + perpLng * perpLng);
    const normPerpLat = perpLat / length;
    const normPerpLng = perpLng / length;
    
    const point = {
      lat: startLat + latDiff * ratio + normPerpLat * curveFactor,
      lng: startLng + lngDiff * ratio + normPerpLng * curveFactor
    };
    
    points.push(point);
  }
  
  // End point
  points.push({ lat: endLat, lng: endLng });
  
  return points;
}

/**
 * Format an address for better display
 * @param address The full address to format
 * @returns Formatted address string
 */
export function formatAddress(address: string): string {
  // If address is missing or too short, return as is
  if (!address || address.length < 5) return address;
  
  // Remove any country information for cleaner display (assuming US addresses)
  const withoutCountry = address.replace(/,\s*USA$|,\s*United States$/i, '');
  
  // If the address is too long, try to truncate with ellipsis
  if (withoutCountry.length > 40) {
    const parts = withoutCountry.split(',');
    if (parts.length > 2) {
      // Keep just the street address and city
      return `${parts[0].trim()}, ${parts[parts.length - 2].trim()}`;
    }
    // Truncate with ellipsis
    return withoutCountry.substring(0, 37) + '...';
  }
  
  return withoutCountry;
}
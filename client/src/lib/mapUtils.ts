/**
 * Format distance in kilometers or meters
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    // Convert to meters for very short distances
    return `${Math.round(distance * 1000)}m`;
  }
  
  return `${distance.toFixed(1)}km`;
}

/**
 * Format an address string for display purposes
 * If the address is too long, truncate it and add ellipsis
 * 
 * @param address The full address string
 * @param maxLength Maximum length before truncation (default: 40)
 * @returns Formatted address string
 */
export function formatAddress(address: string, maxLength: number = 40): string {
  if (!address) return '';
  
  // Remove extra whitespace
  const trimmedAddress = address.trim().replace(/\s+/g, ' ');
  
  // Truncate if necessary
  if (trimmedAddress.length > maxLength) {
    return trimmedAddress.substring(0, maxLength) + '...';
  }
  
  return trimmedAddress;
}

/**
 * Format duration in minutes
 * @param minutes Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearby points based on a given location and radius
 * Useful for finding nearby drivers or popular pickup locations
 * 
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param points Array of points with lat, lon properties
 * @param radiusKm Radius in kilometers (default: 5km)
 * @returns Array of points within the radius, sorted by distance
 */
export function findNearbyPoints<T extends { latitude: number; longitude: number }>(
  centerLat: number,
  centerLon: number,
  points: T[],
  radiusKm: number = 5
): (T & { distance: number })[] {
  // Calculate distance for each point
  const pointsWithDistance = points.map(point => {
    const distance = calculateDistance(
      centerLat,
      centerLon,
      point.latitude,
      point.longitude
    );
    return { ...point, distance };
  });
  
  // Filter points within the radius
  const nearbyPoints = pointsWithDistance.filter(
    point => point.distance <= radiusKm
  );
  
  // Sort by distance (closest first)
  return nearbyPoints.sort((a, b) => a.distance - b.distance);
}

/**
 * Creates a bounding box around a central point for efficient geo-queries
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusKm Radius in kilometers 
 * @returns Object with min/max latitude and longitude values
 */
export function getBoundingBox(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  // Earth's radius in km
  const R = 6371;
  
  // Angular distance in radians on a great circle
  const angularDistance = radiusKm / R;
  
  // Latitude bounds
  const latT = Math.asin(
    Math.sin(toRadians(centerLat)) * Math.cos(angularDistance) +
    Math.cos(toRadians(centerLat)) * Math.sin(angularDistance)
  );
  
  const latB = Math.asin(
    Math.sin(toRadians(centerLat)) * Math.cos(angularDistance) -
    Math.cos(toRadians(centerLat)) * Math.sin(angularDistance)
  );
  
  // Longitude bounds (much more complex for accuracy)
  // This is a simplification
  const lonR = Math.asin(
    Math.sin(angularDistance) / Math.cos(toRadians(centerLat))
  );
  
  const lonL = -lonR;
  
  return {
    minLat: (latB * 180) / Math.PI,
    maxLat: (latT * 180) / Math.PI,
    minLon: centerLon + (lonL * 180) / Math.PI,
    maxLon: centerLon + (lonR * 180) / Math.PI
  };
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimate travel time based on distance and average speed
 * @param distanceKm Distance in kilometers
 * @param speedKmh Average speed in km/h (defaults to 30 km/h for urban areas)
 * @returns Estimated travel time in minutes
 */
export function estimateDuration(
  distanceKm: number,
  speedKmh: number = 30
): number {
  // Calculate hours: distance / speed
  const hours = distanceKm / speedKmh;
  
  // Convert to minutes and round to nearest minute
  const minutes = Math.round(hours * 60);
  
  // Add a base time for pickup (2 minutes)
  return minutes + 2;
}

/**
 * Estimate travel time based on distance and average speed
 * @param distanceKm Distance in kilometers
 * @param speedKmh Average speed in km/h (defaults to 30 km/h for urban areas)
 * @returns Estimated travel time in minutes
 */
export function estimateTravelTime(
  distanceKm: number,
  speedKmh: number = 30
): number {
  // Time in hours = distance / speed
  const timeHours = distanceKm / speedKmh;
  // Convert to minutes
  return timeHours * 60;
}

/**
 * Calculates a simple fare estimation based on distance and time
 * @param distanceKm Distance in kilometers
 * @param durationMinutes Duration in minutes
 * @param baseRate Base rate in dollars (default: $2.50)
 * @param perKmRate Rate per kilometer in dollars (default: $1.25)
 * @param perMinuteRate Rate per minute in dollars (default: $0.35)
 * @returns Estimated fare in dollars
 */
export function estimateFare(
  distanceKm: number,
  durationMinutes: number,
  baseRate: number = 2.5,
  perKmRate: number = 1.25,
  perMinuteRate: number = 0.35
): number {
  const distanceCharge = distanceKm * perKmRate;
  const timeCharge = durationMinutes * perMinuteRate;
  const totalFare = baseRate + distanceCharge + timeCharge;
  
  // Round to 2 decimal places
  return Math.round(totalFare * 100) / 100;
}

/**
 * Calculate fare for a ride based on distance, duration, and vehicle type
 * 
 * @param distance Distance in kilometers
 * @param duration Duration in minutes
 * @param vehicleType Vehicle type (economy or premium)
 * @returns Calculated fare in dollars
 */
export function calculateFare(
  distance: number,
  duration: number,
  vehicleType: 'economy' | 'premium' = 'economy'
): number {
  // Base rates by vehicle type
  const baseRates = {
    economy: 2.5,
    premium: 5.0
  };
  
  // Per kilometer rates by vehicle type
  const perKmRates = {
    economy: 1.25,
    premium: 2.0
  };
  
  // Per minute rates by vehicle type
  const perMinuteRates = {
    economy: 0.35,
    premium: 0.5
  };
  
  // Get rates for the selected vehicle type
  const baseRate = baseRates[vehicleType];
  const perKmRate = perKmRates[vehicleType];
  const perMinuteRate = perMinuteRates[vehicleType];
  
  // Use the estimateFare function with the appropriate rates
  return estimateFare(
    distance,
    duration,
    baseRate,
    perKmRate,
    perMinuteRate
  );
}

/**
 * Generate a dummy path between two points by adding intermediate waypoints
 * This is a simplified version for demo purposes
 * In production, we would use a proper routing API
 * 
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @param pointCount Number of intermediate points to generate (default: 10)
 * @returns Array of latitude/longitude points
 */
export function generateDummyMapPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  pointCount: number = 10
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  
  // Add starting point
  points.push([startLat, startLng]);
  
  // Generate intermediate points with slight randomness
  for (let i = 1; i <= pointCount; i++) {
    const ratio = i / (pointCount + 1);
    
    // Linear interpolation between start and end
    const lat = startLat + (endLat - startLat) * ratio;
    const lng = startLng + (endLng - startLng) * ratio;
    
    // Add some randomness to make the path look more realistic
    // We use deterministic "randomness" based on the coordinates
    // This ensures the path is always the same for the same start/end points
    const seed = (lat * 1000 + lng) * i;
    const latOffset = (Math.sin(seed) * 0.001); // ~100m offset
    const lngOffset = (Math.cos(seed) * 0.001);
    
    points.push([lat + latOffset, lng + lngOffset]);
  }
  
  // Add ending point
  points.push([endLat, endLng]);
  
  return points;
}
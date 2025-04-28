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

/**
 * Fetch route data from Azure Maps API
 * 
 * @param startLat Starting latitude 
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @returns Promise that resolves to an array of [lat, lng] coordinates
 */
export async function fetchRouteFromAzureMaps(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<Array<[number, number]>> {
  console.log('Fetching route from Azure Maps API:', { startLat, startLng, endLat, endLng });
  
  try {
    // Construct the API URL with the appropriate parameters
    // Use routeRepresentation=polyline to get the detailed route path
    const apiUrl = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&query=${startLat},${startLng}:${endLat},${endLng}&routeRepresentation=polyline&subscription-key=${import.meta.env.VITE_AZURE_MAPS_SUBSCRIPTION_KEY}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Azure Maps API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found in the Azure Maps API response');
    }
    
    // Extract the route points
    // Azure Maps returns points in the format { latitude, longitude }
    const routePoints = data.routes[0].legs.flatMap((leg: any) => 
      leg.points.map((point: any) => [point.latitude, point.longitude] as [number, number])
    );
    
    console.log(`Received ${routePoints.length} route points from Azure Maps API`);
    return routePoints;
  } catch (error) {
    console.error('Error fetching route from Azure Maps API:', error);
    // Fall back to the simulated route in case of API failure
    console.warn('Falling back to simulated route generation');
    return generateSimulatedRoute(startLat, startLng, endLat, endLng);
  }
}

/**
 * Generate an enhanced route with curves and waypoints
 * Creates a more realistic route that follows roads rather than straight lines
 * 
 * This is a fallback when Azure Maps API is not available
 * 
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @param complexity How complex the route should be (1-10, higher means more waypoints)
 * @returns Array of latitude/longitude points representing the route
 */
export function generateSimulatedRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  complexity: number = 5
): Array<[number, number]> {
  console.log('Generating simulated route:', { startLat, startLng, endLat, endLng, complexity });
  
  const distance = calculateDistance(startLat, startLng, endLat, endLng);
  console.log('Direct distance between points:', distance, 'km');
  
  // Build a more realistic route with street-level simulation
  const route: Array<[number, number]> = [];
  
  // Add the start point
  route.push([startLat, startLng]);
  
  // We'll generate a realistic path with multiple segments and turns
  // 1. Find the general direction vector
  const dirLat = endLat - startLat;
  const dirLng = endLng - startLng;
  
  // 2. Calculate the main grid approach - we'll use a grid pattern to simulate city blocks
  // In most cities, streets follow a grid pattern at approximately 90-degree angles
  
  // Number of segments depends on distance and complexity
  const segmentCount = Math.max(4, Math.min(20, Math.floor(distance * complexity)));
  console.log('Creating route with', segmentCount, 'segments');
  
  // Create intermediate waypoints that follow a more realistic street pattern
  let currentLat = startLat;
  let currentLng = startLng;
  let remainingLat = dirLat;
  let remainingLng = dirLng;
  
  // Add some "character" to the route - major and minor roads
  // Longer segments represent main roads, shorter segments represent turns and side streets
  
  for (let i = 0; i < segmentCount; i++) {
    // Decide if we're going to move more in latitude or longitude direction
    // This simulates moving along different streets in a grid
    const moveLatitude = Math.random() < 0.5;
    
    // How much of the remaining distance to cover in this segment
    // We use a non-linear distribution to make some segments longer (main roads)
    const segmentRatio = Math.pow(Math.random(), 2) * 0.4 + 0.1; // Between 0.1 and 0.5
    
    // Calculate the movement for this segment
    let segmentLat = 0;
    let segmentLng = 0;
    
    if (moveLatitude) {
      segmentLat = remainingLat * segmentRatio;
      
      // Add a slight movement in the other direction too (not completely straight roads)
      // Smaller streets have more variation
      const lateralVariation = Math.random() * 0.0002 * complexity * 
                              (Math.random() < 0.5 ? 1 : -1);
      segmentLng = lateralVariation;
    } else {
      segmentLng = remainingLng * segmentRatio;
      
      // Add a slight movement in the other direction too
      const lateralVariation = Math.random() * 0.0002 * complexity * 
                              (Math.random() < 0.5 ? 1 : -1);
      segmentLat = lateralVariation;
    }
    
    // Calculate the new position
    currentLat += segmentLat;
    currentLng += segmentLng;
    
    // Generate points along this segment (simulate individual GPS pings)
    const pointsInSegment = Math.max(3, Math.floor(
      calculateDistance(currentLat - segmentLat, currentLng - segmentLng, currentLat, currentLng) * 20
    ));
    
    for (let j = 1; j <= pointsInSegment; j++) {
      const ratio = j / pointsInSegment;
      const lat = (currentLat - segmentLat) + segmentLat * ratio;
      const lng = (currentLng - segmentLng) + segmentLng * ratio;
      
      // Add very slight random noise to make the route look more natural
      // Real GPS data isn't perfectly straight even on straight roads
      const microVariation = 0.00001 * (Math.random() - 0.5);
      route.push([lat + microVariation, lng + microVariation]);
    }
    
    // Update the remaining distance
    remainingLat -= segmentLat;
    remainingLng -= segmentLng;
  }
  
  // For the final approach, create a more direct path to the destination
  // This simulates the last stretch to reach the exact destination
  const finalSegment = Math.max(5, Math.floor(
    calculateDistance(currentLat, currentLng, endLat, endLng) * 20
  ));
  
  for (let i = 1; i <= finalSegment; i++) {
    const ratio = i / finalSegment;
    const lat = currentLat + (endLat - currentLat) * ratio;
    const lng = currentLng + (endLng - currentLng) * ratio;
    
    // Add slight variation to the final approach
    const microVariation = 0.00001 * (Math.random() - 0.5);
    route.push([lat + microVariation, lng + microVariation]);
  }
  
  // Always add the exact end point
  route.push([endLat, endLng]);
  
  console.log('Generated simulated route with', route.length, 'points');
  return route;
}

/**
 * Generate an enhanced route with curves and waypoints
 * First tries to fetch from Azure Maps API, falls back to simulation if that fails
 * 
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @param complexity How complex the route should be (1-10, higher means more waypoints)
 * @returns Array of latitude/longitude points representing the route
 */
export async function generateEnhancedRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  complexity: number = 5
): Promise<Array<[number, number]>> {
  console.log('generateEnhancedRoute called with:', { startLat, startLng, endLat, endLng, complexity });
  
  try {
    // Try to fetch the route from Azure Maps first
    return await fetchRouteFromAzureMaps(startLat, startLng, endLat, endLng);
  } catch (error) {
    console.error('Error fetching route from Azure Maps, falling back to simulation:', error);
    // Fall back to simulated route generation
    return generateSimulatedRoute(startLat, startLng, endLat, endLng, complexity);
  }
}

/**
 * Non-async version of the enhanced route generation for backward compatibility
 * This immediately returns the simulated route without API calls
 * 
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @param complexity How complex the route should be
 * @returns Array of latitude/longitude points
 */
export function generateEnhancedRouteSync(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  complexity: number = 5
): Array<[number, number]> {
  console.log('generateEnhancedRouteSync called with:', { startLat, startLng, endLat, endLng, complexity });
  return generateSimulatedRoute(startLat, startLng, endLat, endLng, complexity);
}

/**
 * Calculate a camera animation path between two map views
 * 
 * @param startLat Starting center latitude
 * @param startLng Starting center longitude 
 * @param startZoom Starting zoom level
 * @param endLat Ending center latitude
 * @param endLng Ending center longitude
 * @param endZoom Ending zoom level
 * @param steps Number of animation steps
 * @returns Array of camera positions for the animation
 */
export function calculateCameraPath(
  startLat: number,
  startLng: number,
  startZoom: number,
  endLat: number,
  endLng: number,
  endZoom: number,
  steps: number = 30
): Array<{ center: [number, number], zoom: number }> {
  const path: Array<{ center: [number, number], zoom: number }> = [];
  
  // Use easing function for smoother animation
  // This creates an ease-in-out effect
  const easeInOut = (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const easedRatio = easeInOut(ratio);
    
    // Interpolate position
    const lat = startLat + (endLat - startLat) * easedRatio;
    const lng = startLng + (endLng - startLng) * easedRatio;
    
    // Zoom changes are special - we want to zoom out first, then move, then zoom in
    // This makes the animation feel more natural
    let zoom;
    if (startZoom < endZoom) {
      // Zooming in - zoom out slightly first, then zoom in more at the end
      if (ratio < 0.3) {
        zoom = startZoom - (startZoom * 0.05) * (ratio / 0.3);
      } else {
        const zoomRatio = (ratio - 0.3) / 0.7;
        zoom = (startZoom - (startZoom * 0.05)) + (endZoom - (startZoom - (startZoom * 0.05))) * easeInOut(zoomRatio);
      }
    } else if (startZoom > endZoom) {
      // Zooming out - just gradually zoom out
      zoom = startZoom + (endZoom - startZoom) * easedRatio;
    } else {
      // Same zoom level - no change
      zoom = startZoom;
    }
    
    path.push({
      center: [lat, lng],
      zoom: zoom
    });
  }
  
  return path;
}

/**
 * Generate intermediate route animation steps for progressively revealing a route
 * 
 * @param route The complete route as an array of coordinate points
 * @param steps Number of animation steps to generate
 * @returns Array of partial routes for each animation step
 */
export function generateRouteAnimationSteps(
  route: Array<[number, number]>,
  steps: number = 30
): Array<Array<[number, number]>> {
  console.log('generateRouteAnimationSteps called with route length:', route.length, 'steps:', steps);
  
  const animationSteps: Array<Array<[number, number]>> = [];
  
  if (route.length <= 1) {
    console.log('Route too short, filling with same route');
    return Array(steps).fill(route);
  }
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const pointIndex = Math.max(1, Math.min(route.length - 1, Math.floor(ratio * route.length)));
    
    // Include all points up to the current index
    const partialRoute = route.slice(0, pointIndex + 1);
    animationSteps.push(partialRoute);
  }
  
  console.log('Generated animation steps:', animationSteps.length);
  return animationSteps;
}

/**
 * Calculate a bounding box that contains all points in a route
 * 
 * @param route Array of coordinate points
 * @param padding Padding to add around the bounding box (in degrees)
 * @returns Object with bounding box coordinates
 */
export function getRouteBounds(
  route: Array<[number, number]>,
  padding: number = 0.01
): { minLat: number, maxLat: number, minLng: number, maxLng: number } {
  if (route.length === 0) {
    throw new Error('Route cannot be empty');
  }
  
  let minLat = route[0][0];
  let maxLat = route[0][0];
  let minLng = route[0][1];
  let maxLng = route[0][1];
  
  route.forEach(([lat, lng]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });
  
  return {
    minLat: minLat - padding,
    maxLat: maxLat + padding,
    minLng: minLng - padding,
    maxLng: maxLng + padding
  };
}
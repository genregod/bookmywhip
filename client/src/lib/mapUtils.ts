/**
 * Utility functions for working with maps and location data
 */

// Calculate distance between two points using the Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Convert degrees to radians
function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

// Calculate estimated trip duration in minutes based on distance
export function calculateEstimatedDuration(distanceInKm: number): number {
  // Assume average speed of 30 km/h in city
  const averageSpeedKmPerHour = 30;
  return Math.ceil((distanceInKm / averageSpeedKmPerHour) * 60);
}

// Calculate estimated fare
export function calculateEstimatedFare(
  distanceInKm: number,
  durationInMinutes: number,
  baseFare: number,
  perMileRate: number,
  perMinuteRate: number
): number {
  const distanceInMiles = distanceInKm * 0.621371; // Convert km to miles
  return (
    baseFare +
    distanceInMiles * perMileRate +
    durationInMinutes * perMinuteRate
  );
}

// Format distance for display
export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
}

// Format duration for display
export function formatDuration(durationInMinutes: number): string {
  if (durationInMinutes < 60) {
    return `${durationInMinutes} min`;
  }
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  return `${hours} h ${minutes} min`;
}

// Format an address string to be more concise
export function formatAddress(address: string): string {
  // Remove country and zip code for brevity
  const parts = address.split(',');
  if (parts.length > 2) {
    return parts.slice(0, -1).join(',');
  }
  return address;
}

// Generate dummy map data for demonstration purposes
// In a real app, this would be replaced with actual map API calls
export function generateDummyMapPath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): { lat: number; lng: number }[] {
  const waypoints = [];
  const numPoints = 10;
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    waypoints.push({
      lat: startLat + t * (endLat - startLat),
      lng: startLng + t * (endLng - startLng)
    });
  }
  
  return waypoints;
}

/**
 * A collection of geographic utility functions for the driver-rider matching algorithm
 */

/**
 * Convert degrees to radians
 * @param {number} degrees - The angle in degrees
 * @returns {number} The angle in radians
 */
function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Calculate the great-circle distance between two points on Earth
 * @param {number} lat1 - Latitude of the first point in decimal degrees
 * @param {number} lon1 - Longitude of the first point in decimal degrees
 * @param {number} lat2 - Latitude of the second point in decimal degrees
 * @param {number} lon2 - Longitude of the second point in decimal degrees
 * @returns {number} The distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Earth's radius in kilometers
  const R = 6371;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

/**
 * Creates a bounding box around a central point for efficient geo-queries
 * @param {number} latitude - The central latitude in decimal degrees
 * @param {number} longitude - The central longitude in decimal degrees
 * @param {number} radius - The radius to search in kilometers
 * @returns {Object} An object with the min/max lat/lng values of the bounding box
 */
function getBoundingBox(latitude, longitude, radius) {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Angular distance in radians on a great circle
  const radDist = radius / R;
  
  const radLat = toRadians(latitude);
  const radLon = toRadians(longitude);
  
  const minLat = radLat - radDist;
  const maxLat = radLat + radDist;
  
  // Delta longitude gets smaller as latitude increases
  let deltaLon;
  if (minLat > -Math.PI/2 && maxLat < Math.PI/2) {
    deltaLon = Math.asin(Math.sin(radDist) / Math.cos(radLat));
    const minLon = radLon - deltaLon;
    const maxLon = radLon + deltaLon;
    
    return {
      minLat: minLat * 180 / Math.PI,
      maxLat: maxLat * 180 / Math.PI,
      minLng: minLon * 180 / Math.PI,
      maxLng: maxLon * 180 / Math.PI
    };
  } else {
    // Edge case for poles and large radius near poles
    // We'll just use a global longitude range for simplicity
    return {
      minLat: Math.max(minLat * 180 / Math.PI, -90),
      maxLat: Math.min(maxLat * 180 / Math.PI, 90),
      minLng: -180,
      maxLng: 180
    };
  }
}

/**
 * Finds nearby points based on distance calculation
 * @param {number} centerLat - The latitude of the center point
 * @param {number} centerLng - The longitude of the center point
 * @param {Array} points - Array of points with lat/lng properties
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Array} Array of points with distance added
 */
function findNearbyPoints(centerLat, centerLng, points, maxDistance) {
  // First filter by bounding box for efficiency
  const boundingBox = getBoundingBox(centerLat, centerLng, maxDistance);
  
  // Filter points by bounding box
  const inBoundingBox = points.filter(point => {
    const lat = point.latitude || point.lat;
    const lng = point.longitude || point.lng;
    
    return (
      lat >= boundingBox.minLat &&
      lat <= boundingBox.maxLat &&
      lng >= boundingBox.minLng &&
      lng <= boundingBox.maxLng
    );
  });
  
  // Calculate actual distances
  const withDistances = inBoundingBox.map(point => {
    const lat = point.latitude || point.lat;
    const lng = point.longitude || point.lng;
    
    const distance = calculateDistance(centerLat, centerLng, lat, lng);
    
    // Only include points within the max distance
    if (distance <= maxDistance) {
      return {
        ...point,
        distance
      };
    }
    return null;
  }).filter(point => point !== null);
  
  // Sort by distance
  return withDistances.sort((a, b) => a.distance - b.distance);
}

/**
 * Estimates travel time in minutes based on distance
 * @param {number} distance - Distance in kilometers
 * @param {number} avgSpeed - Average speed in km/h (default: 30)
 * @returns {number} Estimated travel time in minutes
 */
function estimateTravelTime(distance, avgSpeed = 30) {
  // Time = distance / speed (hours)
  // Convert to minutes and add buffer time
  const baseTime = (distance / avgSpeed) * 60;
  const bufferTime = Math.min(10, baseTime * 0.1); // 10% buffer, max 10 minutes
  
  return Math.round(baseTime + bufferTime);
}

/**
 * Formats a distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

module.exports = {
  calculateDistance,
  getBoundingBox,
  findNearbyPoints,
  estimateTravelTime,
  formatDistance,
  toRadians
};
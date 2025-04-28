import { AzureFunction, Context, HttpRequest } from "@azure/functions";

/**
 * Distance calculation using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Creates a bounding box around a central point for efficient geo-queries
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
function getBoundingBox(
  latitude: number, 
  longitude: number, 
  radiusKm: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  // Earth's radius in km
  const R = 6371;

  // Angular distance in radians
  const radDist = radiusKm / R;
  
  // Current latitude in radians
  const radLat = latitude * Math.PI / 180;
  
  // Current longitude in radians
  const radLon = longitude * Math.PI / 180;
  
  // Min and max latitudes
  const minLat = radLat - radDist;
  const maxLat = radLat + radDist;
  
  // Calculate longitude bounds
  // Compensate for degrees longitude getting smaller with increasing latitude
  let deltaLon = Math.asin(Math.sin(radDist) / Math.cos(radLat));
  
  let minLon = radLon - deltaLon;
  let maxLon = radLon + deltaLon;
  
  // Convert back to degrees
  return {
    minLat: minLat * 180 / Math.PI,
    maxLat: maxLat * 180 / Math.PI,
    minLon: minLon * 180 / Math.PI,
    maxLon: maxLon * 180 / Math.PI
  };
}

interface Driver {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  vehicleType: string;
  isOnline: boolean;
}

// Mock database for demonstration purposes
// In a real implementation, this would be replaced with a database connection
const mockDrivers: Driver[] = [
  { id: 1, name: "John Driver", latitude: 37.7749, longitude: -122.4194, rating: 4.8, vehicleType: "economy", isOnline: true },
  { id: 2, name: "Sarah Driver", latitude: 37.7735, longitude: -122.4217, rating: 4.9, vehicleType: "premium", isOnline: true },
  { id: 3, name: "Mike Driver", latitude: 37.7831, longitude: -122.4159, rating: 4.7, vehicleType: "economy", isOnline: true },
  { id: 4, name: "Emily Driver", latitude: 37.7899, longitude: -122.4033, rating: 4.5, vehicleType: "premium", isOnline: true },
  { id: 5, name: "Dave Driver", latitude: 37.7569, longitude: -122.4148, rating: 4.6, vehicleType: "economy", isOnline: false }
];

/**
 * Azure Function to find nearby drivers based on proximity
 */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('Driver Matching function processed a request.');
    
  const latitude = parseFloat(req.query.latitude || req.body?.latitude);
  const longitude = parseFloat(req.query.longitude || req.body?.longitude);
  const radiusKm = parseFloat(req.query.radius || req.body?.radius || "5");
  const vehicleType = (req.query.vehicleType || req.body?.vehicleType || "economy").toLowerCase();
  
  if (isNaN(latitude) || isNaN(longitude)) {
    context.res = {
      status: 400,
      body: { error: "Valid latitude and longitude are required." }
    };
    return;
  }
  
  try {
    // Get the bounding box for efficient filtering
    const boundingBox = getBoundingBox(latitude, longitude, radiusKm);
    
    // Filter drivers by bounding box, status, and vehicle type
    const nearbyDrivers = mockDrivers
      .filter(driver => 
        driver.isOnline && 
        driver.vehicleType === vehicleType &&
        driver.latitude >= boundingBox.minLat &&
        driver.latitude <= boundingBox.maxLat &&
        driver.longitude >= boundingBox.minLon &&
        driver.longitude <= boundingBox.maxLon
      )
      .map(driver => ({
        ...driver,
        distance: calculateDistance(latitude, longitude, driver.latitude, driver.longitude)
      }))
      .filter(driver => driver.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
    
    context.res = {
      status: 200,
      body: {
        pickupLocation: { latitude, longitude },
        radius: radiusKm,
        vehicleType,
        driversFound: nearbyDrivers.length,
        drivers: nearbyDrivers
      }
    };
  } catch (error) {
    context.log.error('Error in driver matching:', error);
    context.res = {
      status: 500,
      body: { error: "Failed to match drivers.", details: error.message }
    };
  }
};

export default httpTrigger;
/**
 * Waze Integration Utility
 * 
 * Provides utilities for integrating with Waze navigation through Deep Links.
 * This implementation allows users to navigate to destinations using Waze without
 * requiring any paid API services.
 */

/**
 * Generate a Waze deep link URL
 * 
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param name - Optional location name/address for display in Waze
 * @returns Waze deep link URL
 */
export function getWazeDeepLink(latitude: number, longitude: number, name?: string): string {
  // Base URL with coordinates and navigation flag
  let wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
  
  // Add location name/address if provided
  if (name) {
    wazeUrl += `&q=${encodeURIComponent(name)}`;
  }
  
  return wazeUrl;
}

/**
 * Opens Waze with navigation to the specified destination
 * 
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param name - Optional location name/address
 * @param embedded - Whether to use embedded navigation or open in a new tab
 * @returns If embedded is true, returns the URL for iframe embedding
 */
export function navigateWithWaze(
  latitude: number, 
  longitude: number, 
  name?: string, 
  embedded: boolean = false
): string | void {
  const wazeUrl = getWazeDeepLink(latitude, longitude, name);
  
  if (embedded) {
    return wazeUrl;
  } else {
    window.open(wazeUrl, '_blank');
  }
}

/**
 * Generate a deep link for a specific route between two points
 * 
 * @param fromLat - Starting point latitude
 * @param fromLon - Starting point longitude
 * @param toLat - Destination latitude
 * @param toLon - Destination longitude
 * @param name - Optional destination name
 * @returns Waze deep link URL for the route
 */
export function getWazeRouteDeepLink(
  fromLat: number, 
  fromLon: number, 
  toLat: number, 
  toLon: number,
  name?: string
): string {
  // The from parameter specifies the starting point
  let wazeUrl = `https://waze.com/ul?ll=${toLat},${toLon}&navigate=yes&from=${fromLat},${fromLon}`;
  
  // Add destination name if provided
  if (name) {
    wazeUrl += `&q=${encodeURIComponent(name)}`;
  }
  
  return wazeUrl;
}

/**
 * Opens Waze with navigation for a specific route between two points
 * 
 * @param fromLat - Starting point latitude
 * @param fromLon - Starting point longitude
 * @param toLat - Destination latitude
 * @param toLon - Destination longitude
 * @param name - Optional destination name
 * @param embedded - Whether to use embedded navigation or open in a new tab
 * @returns If embedded is true, returns the URL for iframe embedding
 */
export function navigateRouteWithWaze(
  fromLat: number, 
  fromLon: number, 
  toLat: number, 
  toLon: number,
  name?: string,
  embedded: boolean = false
): string | void {
  const wazeUrl = getWazeRouteDeepLink(fromLat, fromLon, toLat, toLon, name);
  
  if (embedded) {
    return wazeUrl;
  } else {
    window.open(wazeUrl, '_blank');
  }
}
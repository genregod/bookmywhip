// Azure Maps integration module
import * as atlas from 'azure-maps-control';

// Types for our application
export interface MapMarker {
  position: atlas.data.Position;
  type: 'pickup' | 'destination' | 'driver' | 'rider';
  title?: string;
}

export interface MapRoute {
  points: atlas.data.Position[];
  color?: string;
}

// Azure Maps configuration
const createMap = (containerId: string, options?: atlas.ServiceOptions): atlas.Map => {
  const mapOptions: atlas.ServiceOptions = {
    authOptions: {
      authType: atlas.AuthenticationType.subscriptionKey,
      subscriptionKey: import.meta.env.VITE_AZURE_MAPS_SUBSCRIPTION_KEY as string
    },
    center: [-122.33, 47.6], // Default to Seattle
    zoom: 12,
    ...options
  };

  return new atlas.Map(containerId, mapOptions);
};

// Add a marker to the map
const addMarker = (map: atlas.Map, marker: MapMarker): atlas.HtmlMarker => {
  const color = getMarkerColor(marker.type);
  const options: atlas.HtmlMarkerOptions = {
    position: marker.position,
    color,
    text: marker.title,
    popup: marker.title ? new atlas.Popup({
      content: `<div>${marker.title}</div>`,
      pixelOffset: [0, -30]
    }) : undefined
  };

  const htmlMarker = new atlas.HtmlMarker(options);
  map.markers.add(htmlMarker);
  
  return htmlMarker;
};

// Add multiple markers to the map
const addMarkers = (map: atlas.Map, markers: MapMarker[]): atlas.HtmlMarker[] => {
  return markers.map(marker => addMarker(map, marker));
};

// Clear all markers from the map
const clearMarkers = (map: atlas.Map): void => {
  map.markers.clear();
};

// Helper to get marker color based on type
const getMarkerColor = (type: MapMarker['type']): string => {
  switch (type) {
    case 'pickup': return '#4F46E5'; // Primary color
    case 'destination': return '#10B981'; // Green
    case 'driver': return '#3B82F6'; // Blue
    case 'rider': return '#F59E0B'; // Yellow/Amber
    default: return '#4F46E5';
  }
};

// Draw a route line on the map
const drawRoute = (map: atlas.Map, route: MapRoute): atlas.layer.LineLayer => {
  const dataSource = new atlas.source.DataSource();
  map.sources.add(dataSource);

  const line = new atlas.data.LineString(route.points);
  dataSource.add(new atlas.data.Feature(line));

  const lineLayer = new atlas.layer.LineLayer(dataSource, `route-${Date.now()}`, {
    strokeColor: route.color || '#4F46E5',
    strokeWidth: 5,
    strokeOpacity: 0.7
  });

  map.layers.add(lineLayer);
  
  return lineLayer;
};

// Calculate a route between two points using Azure Maps Routing API
const calculateRoute = async (
  map: atlas.Map, 
  startPosition: atlas.data.Position, 
  endPosition: atlas.data.Position
): Promise<MapRoute> => {
  try {
    // Format the route request URL for Azure Maps
    const routeURL = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${
      import.meta.env.VITE_AZURE_MAPS_SUBSCRIPTION_KEY
    }&query=${startPosition[1]},${startPosition[0]}:${endPosition[1]},${endPosition[0]}&routeRepresentation=polyline&instructionsType=text&travelMode=car`;

    console.log('Fetching route from Azure Maps API...');
    const response = await fetch(routeURL);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found in Azure Maps response');
    }

    // Extract the route points from the response
    const route = data.routes[0];
    const legs = route.legs || [];
    const points: atlas.data.Position[] = [];

    // Process each leg of the route and collect the points
    legs.forEach((leg: any) => {
      const legPoints = leg.points || [];
      legPoints.forEach((point: any) => {
        // Azure Maps returns points as [lat, lng], but we need [lng, lat] for atlas.data.Position
        points.push([point.longitude, point.latitude]);
      });
    });

    console.log(`Successfully fetched route with ${points.length} points`);
    return { points };
  } catch (error) {
    console.error('Error fetching route from Azure Maps:', error);
    
    // Fallback to a simpler route if the API call fails
    console.warn('Falling back to simulated route...');
    const points = [
      startPosition,
      [
        startPosition[0] + (endPosition[0] - startPosition[0]) * 0.25,
        startPosition[1] + (endPosition[1] - startPosition[1]) * 0.3
      ],
      [
        startPosition[0] + (endPosition[0] - startPosition[0]) * 0.5,
        startPosition[1] + (endPosition[1] - startPosition[1]) * 0.6
      ],
      [
        startPosition[0] + (endPosition[0] - startPosition[0]) * 0.75,
        startPosition[1] + (endPosition[1] - startPosition[1]) * 0.7
      ],
      endPosition
    ];

    return { points: points as atlas.data.Position[] };
  }
};

// Fetch route from Azure Maps without requiring a map instance
export const fetchRouteFromAzureMaps = async (
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number
): Promise<[number, number][]> => {
  try {
    // Format the route request URL for Azure Maps
    const routeURL = `https://atlas.microsoft.com/route/directions/json?api-version=1.0&subscription-key=${
      import.meta.env.VITE_AZURE_MAPS_SUBSCRIPTION_KEY
    }&query=${startLat},${startLng}:${endLat},${endLng}&routeRepresentation=polyline&instructionsType=text&travelMode=car`;

    console.log('Fetching route from Azure Maps API...');
    const response = await fetch(routeURL);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found in Azure Maps response');
    }

    // Extract the route points from the response
    const route = data.routes[0];
    const legs = route.legs || [];
    const points: [number, number][] = [];

    // Process each leg of the route and collect the points
    legs.forEach((leg: any) => {
      const legPoints = leg.points || [];
      legPoints.forEach((point: any) => {
        // Return points as [lat, lng] format for Leaflet compatibility
        points.push([point.latitude, point.longitude]);
      });
    });

    console.log(`Successfully fetched route with ${points.length} points`);
    return points;
  } catch (error) {
    console.error('Error fetching route from Azure Maps:', error);
    throw error;
  }
};

// Get user's geolocation
const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

// Convert GeolocationPosition to Azure Maps Position
const geoToPosition = (position: GeolocationPosition): atlas.data.Position => {
  return [position.coords.longitude, position.coords.latitude];
};

// Search for a location by address or query
const searchLocation = async (query: string): Promise<atlas.data.Feature<atlas.data.Point, any>[]> => {
  try {
    const searchURL = `https://atlas.microsoft.com/search/address/json?subscription-key=${
      import.meta.env.VITE_AZURE_MAPS_SUBSCRIPTION_KEY
    }&api-version=1.0&query=${encodeURIComponent(query)}&limit=5`;

    const response = await fetch(searchURL);
    const data = await response.json();

    return data.results.map((result: any) => {
      const position: atlas.data.Position = [result.position.lon, result.position.lat];
      return new atlas.data.Feature(new atlas.data.Point(position), {
        name: result.address.freeformAddress,
        id: result.id,
        type: 'location',
        score: result.score
      });
    });
  } catch (error) {
    console.error('Error searching for location:', error);
    return [];
  }
};

// Center and zoom the map to show all markers
const fitMapToMarkers = (map: atlas.Map, markers: atlas.HtmlMarker[], padding: number = 50): void => {
  if (markers.length === 0) return;
  
  // Get bounds that contain all markers
  const positions = markers
    .map(m => m.getOptions().position)
    .filter((pos): pos is atlas.data.Position => pos !== undefined); // Filter out undefined positions
  
  if (positions.length === 0) return;
  
  const bounds = atlas.data.BoundingBox.fromPositions(positions);
  
  // Set the camera to include the bounds with padding
  map.setCamera({
    bounds: bounds,
    padding: padding
  });
};

export {
  createMap,
  addMarker,
  addMarkers,
  clearMarkers,
  drawRoute,
  calculateRoute,
  getCurrentPosition,
  geoToPosition,
  searchLocation,
  fitMapToMarkers
};
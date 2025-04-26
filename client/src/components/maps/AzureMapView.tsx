import { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import * as azureMaps from '@/lib/azureMaps';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';

// Define the marker types that match our application's needs
interface Marker {
  lat: number;
  lng: number;
  type: 'pickup' | 'destination' | 'driver' | 'rider' | 'current';
  label?: string;
}

// Define a path (route) structure
interface MapPath {
  points: { lat: number; lng: number }[];
  color?: string;
}

// Component props
interface AzureMapViewProps {
  markers?: Marker[];
  path?: MapPath;
  onMapClick?: (lat: number, lng: number) => void;
  showCurrentLocation?: boolean;
  className?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
}

export default function AzureMapView({
  markers = [],
  path,
  onMapClick,
  showCurrentLocation = true,
  className = '',
  zoom = DEFAULT_MAP_ZOOM,
  center = DEFAULT_MAP_CENTER
}: AzureMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<atlas.Map | null>(null);
  const markersRef = useRef<atlas.HtmlMarker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create the map instance
    const map = azureMaps.createMap(mapContainerRef.current.id, {
      center: [center.lng, center.lat], // Note: Azure Maps takes [longitude, latitude]
      zoom: zoom,
      style: 'road', // Choose from: road, satellite, hybrid, grayscale, dark, night, etc.
      language: 'en-US',
      view: 'Auto'
    });

    // Store map reference
    mapRef.current = map;

    // Set up map events
    map.events.add('ready', () => {
      setMapLoaded(true);
    });

    if (onMapClick) {
      map.events.add('click', (e: atlas.MapMouseEvent) => {
        const position = e.position;
        if (position) {
          onMapClick(position[1], position[0]); // Convert to lat, lng for app consistency
        }
      });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    };
  }, [center.lat, center.lng, zoom, onMapClick]);

  // Update map with markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    azureMaps.clearMarkers(mapRef.current);
    markersRef.current = [];

    // Convert our app markers to Azure Maps markers
    const azureMarkers: azureMaps.MapMarker[] = markers.map(marker => ({
      position: [marker.lng, marker.lat], // Convert to [longitude, latitude]
      type: marker.type === 'current' ? 'rider' : marker.type, // Map 'current' type to 'rider'
      title: marker.label
    }));

    // Add markers to the map
    if (azureMarkers.length > 0) {
      markersRef.current = azureMaps.addMarkers(mapRef.current, azureMarkers);
      
      // Fit map to markers if we have more than one
      if (markersRef.current.length > 1) {
        azureMaps.fitMapToMarkers(mapRef.current, markersRef.current);
      }
    }
  }, [markers, mapLoaded]);

  // Draw path/route if provided
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !path) return;

    // Convert path to Azure Maps format
    const azurePath: azureMaps.MapRoute = {
      points: path.points.map(point => [point.lng, point.lat]),
      color: path.color
    };

    // Draw the route
    azureMaps.drawRoute(mapRef.current, azurePath);
  }, [path, mapLoaded]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <div 
        id="azure-map" 
        ref={mapContainerRef} 
        className="w-full h-full"
      />
      
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Current location label if needed (outside the map for customization) */}
      {showCurrentLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-md flex items-center space-x-2 text-sm z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>Current Location</span>
        </div>
      )}
    </div>
  );
}
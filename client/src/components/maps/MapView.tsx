import { useEffect, useRef, useState } from 'react';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';
import { useLocation } from '@/hooks/use-location';
import { generateDummyMapPath } from '@/lib/mapUtils';

interface Marker {
  lat: number;
  lng: number;
  type: 'pickup' | 'destination' | 'driver' | 'current';
  label?: string;
}

interface MapPath {
  points: { lat: number; lng: number }[];
  color?: string;
}

interface MapViewProps {
  markers?: Marker[];
  path?: MapPath;
  onMapClick?: (lat: number, lng: number) => void;
  showCurrentLocation?: boolean;
  className?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
}

export default function MapView({
  markers = [],
  path,
  onMapClick,
  showCurrentLocation = true,
  className = '',
  zoom = DEFAULT_MAP_ZOOM,
  center = DEFAULT_MAP_CENTER
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { currentLocation } = useLocation();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Combine passed markers with current location if requested
  const allMarkers = [...markers];
  if (showCurrentLocation && currentLocation) {
    allMarkers.push({
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      type: 'current'
    });
  }

  // In a real implementation, this would initialize a Google Maps or similar map API
  // For this implementation, we'll use a static background with marker overlays
  useEffect(() => {
    if (mapRef.current) {
      setMapLoaded(true);
    }
  }, []);

  // Generate a dummy path if source and destination markers are present without a path
  const renderPath = path || (() => {
    const pickup = markers.find(m => m.type === 'pickup');
    const destination = markers.find(m => m.type === 'destination');
    
    if (pickup && destination) {
      return {
        points: generateDummyMapPath(pickup.lat, pickup.lng, destination.lat, destination.lng),
        color: '#4F46E5'
      };
    }
    return undefined;
  })();

  // Handle map click (for location selection)
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onMapClick || !mapRef.current) return;

    // In a real implementation, this would convert pixel coordinates to lat/lng
    // For this implementation, we'll use dummy coordinates near the center
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to a latitude/longitude offset from center
    const latOffset = ((rect.height / 2) - y) / 1000;
    const lngOffset = (x - (rect.width / 2)) / 1000;
    
    onMapClick(center.lat + latOffset, center.lng + lngOffset);
  };

  return (
    <div 
      ref={mapRef}
      className={`relative w-full h-full bg-gray-200 overflow-hidden ${className}`}
      onClick={onMapClick ? handleMapClick : undefined}
    >
      {/* Map background */}
      <div 
        className="w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=40.7128,-74.0060&zoom=13&size=800x800&scale=2&maptype=roadmap')"
        }}
      />

      {/* Path rendering */}
      {renderPath && renderPath.points.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            points={renderPath.points.map(p => {
              // Convert lat/lng to pixel coordinates (simplified)
              const x = ((p.lng - (center.lng - 0.02)) / 0.04) * 100 + '%';
              const y = (1 - ((p.lat - (center.lat - 0.02)) / 0.04)) * 100 + '%';
              return `${x},${y}`;
            }).join(' ')}
            stroke={renderPath.color || "#4F46E5"}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0,0"
          />
        </svg>
      )}

      {/* Markers */}
      {allMarkers.map((marker, index) => (
        <div
          key={index}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            // Convert lat/lng to pixel coordinates (simplified)
            left: `${((marker.lng - (center.lng - 0.02)) / 0.04) * 100}%`,
            top: `${(1 - ((marker.lat - (center.lat - 0.02)) / 0.04)) * 100}%`,
          }}
        >
          {marker.type === 'pickup' && (
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center animate-pulse-slow">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
          {marker.type === 'destination' && (
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center animate-pulse-slow">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
          {marker.type === 'driver' && (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4a1 1 0 00.2-.6V8a1 1 0 00-1-1h-3.9L11.1 3.6a1 1 0 00-.8-.4H4a1 1 0 00-1 1v.2" />
              </svg>
            </div>
          )}
          {marker.type === 'current' && (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {marker.label && (
            <div className="mt-1 bg-white px-2 py-1 rounded-md text-xs shadow-md whitespace-nowrap">
              {marker.label}
            </div>
          )}
        </div>
      ))}

      {/* Current location pill */}
      {showCurrentLocation && currentLocation && (
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

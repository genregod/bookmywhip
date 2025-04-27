import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { Button } from '@/components/ui/button';
import { navigateWithWaze, navigateRouteWithWaze } from '@/lib/wazeIntegration';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Create custom icons to fix the missing icon issue in react-leaflet
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icons for driver and rider
const driverIcon = new Icon({
  iconUrl: markerIcon, // Replace with custom driver icon
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'driver-marker'
});

const riderIcon = new Icon({
  iconUrl: markerIcon, // Replace with custom rider icon
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'rider-marker'
});

// Map view setter component (for dynamically changing map view)
interface MapViewProps {
  center: [number, number];
  zoom: number;
}

function MapView({ center, zoom }: MapViewProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

// Main MapDisplay component
interface MapDisplayProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  markers?: {
    position: [number, number];
    title: string;
    type?: 'default' | 'driver' | 'rider' | 'pickup' | 'dropoff';
    popupContent?: React.ReactNode;
  }[];
  routePoints?: {
    start: [number, number];
    end: [number, number];
    startTitle?: string;
    endTitle?: string;
  };
  showWazeNavigation?: boolean;
  userLocation?: [number, number];
}

export default function MapDisplay({
  center,
  zoom = 13,
  height = '400px',
  markers = [],
  routePoints,
  showWazeNavigation = true,
  userLocation
}: MapDisplayProps) {
  const mapRef = useRef(null);

  // Helper to get appropriate icon based on marker type
  const getMarkerIcon = (type: string = 'default') => {
    switch(type) {
      case 'driver':
        return driverIcon;
      case 'rider':
        return riderIcon;
      default:
        return defaultIcon;
    }
  };
  
  return (
    <div className="map-container relative" style={{ height }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
        ref={mapRef}
      >
        {/* Update view when center prop changes */}
        <MapView center={center} zoom={zoom} />
        
        {/* Base map layer - OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render markers */}
        {markers.map((marker, index) => (
          <Marker 
            key={`marker-${index}`}
            position={marker.position}
            icon={getMarkerIcon(marker.type)}
          >
            <Popup>
              <div>
                <h3 className="font-medium">{marker.title}</h3>
                {marker.popupContent}
                
                {showWazeNavigation && (
                  <Button 
                    onClick={() => navigateWithWaze(marker.position[0], marker.position[1], marker.title)}
                    className="mt-2 w-full bg-blue-500 hover:bg-blue-600"
                    size="sm"
                  >
                    Navigate with Waze
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Add Waze navigation button if route is specified */}
        {showWazeNavigation && routePoints && (
          <div className="absolute bottom-4 right-4 z-[1000]">
            <Button 
              onClick={() => {
                const { start, end, startTitle, endTitle } = routePoints;
                // If user location is available, use it as the starting point instead of the route start
                const startPoint = userLocation || start;
                navigateRouteWithWaze(startPoint[0], startPoint[1], end[0], end[1], endTitle);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Navigate with Waze
            </Button>
          </div>
        )}
      </MapContainer>
    </div>
  );
}
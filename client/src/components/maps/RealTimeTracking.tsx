import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngExpression, LatLng } from 'leaflet';
import { fetchRouteFromAzureMaps } from '@/lib/mapUtils';
import { Car, MapPin, Navigation, User } from 'lucide-react';

// Import marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom marker icons
const pickupIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'pickup-marker'
});

const destinationIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'destination-marker'
});

// Component to dynamically set the map view
function MapViewSetter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

// Create a custom marker component that can be positioned dynamically
function DynamicMarker({ 
  position, 
  icon, 
  rotation = 0, 
  type, 
  color
}: { 
  position: LatLngExpression; 
  icon?: Icon; 
  rotation?: number;
  type: 'driver' | 'rider';
  color: string;
}) {
  return (
    <Marker 
      position={position} 
      icon={icon || new Icon({
        iconUrl: markerIcon,
        iconRetinaUrl: markerIconRetina,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        className: `${type}-marker`
      })}
    >
      <div className="dynamic-marker-label" style={{ transform: `rotate(${rotation}deg)` }}>
        {type === 'driver' ? (
          <div className={`car-icon-container bg-${color}-100 p-2 rounded-full border border-${color}-500`}>
            <Car className={`text-${color}-500`} size={20} />
          </div>
        ) : (
          <div className={`rider-icon-container bg-${color}-100 p-2 rounded-full border border-${color}-500`}>
            <User className={`text-${color}-500`} size={20} />
          </div>
        )}
      </div>
    </Marker>
  );
}

// Custom HTML marker for driver with rotation
function createDriverMarker(rotation = 0) {
  return new Icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#4ADE80" stroke="#166534" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${rotation}deg)">
        <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/>
        <circle cx="6.5" cy="16.5" r="2.5"/>
        <circle cx="16.5" cy="16.5" r="2.5"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: 'driver-marker-container'
  });
}

// Custom HTML marker for rider
function createRiderMarker() {
  return new Icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: 'rider-marker-container'
  });
}

interface RealTimeTrackingProps {
  pickupPoint: [number, number]; // [lat, lng]
  destinationPoint: [number, number]; // [lat, lng]
  initialDriverPoint?: [number, number]; // [lat, lng]
  initialRiderPoint?: [number, number]; // [lat, lng]
  driverMovementSimulation?: boolean;
  showRoute?: boolean;
  routeColor?: string;
  routeWeight?: number;
  showLabels?: boolean;
  pickupLabel?: string;
  destinationLabel?: string;
  fitBounds?: boolean;
  boundsPadding?: number;
  updateInterval?: number; // in milliseconds
}

export default function RealTimeTracking({
  pickupPoint,
  destinationPoint,
  initialDriverPoint,
  initialRiderPoint,
  driverMovementSimulation = true,
  showRoute = true,
  routeColor = '#4F46E5',
  routeWeight = 4,
  showLabels = true,
  pickupLabel = 'Pickup',
  destinationLabel = 'Destination',
  fitBounds = true,
  boundsPadding = 0.05,
  updateInterval = 1000, // 1 second default
}: RealTimeTrackingProps) {
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [driverPosition, setDriverPosition] = useState<[number, number]>(initialDriverPoint || pickupPoint);
  const [riderPosition, setRiderPosition] = useState<[number, number]>(initialRiderPoint || [
    pickupPoint[0] + (Math.random() * 0.01 - 0.005),
    pickupPoint[1] + (Math.random() * 0.01 - 0.005)
  ]);
  const [driverRotation, setDriverRotation] = useState(0);
  const [routeIndex, setRouteIndex] = useState(0);
  const [isDriverMoving, setIsDriverMoving] = useState(driverMovementSimulation);
  
  // Load route on component mount
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        // Fetch route from Azure Maps
        const routePoints = await fetchRouteFromAzureMaps(
          pickupPoint[0], pickupPoint[1],
          destinationPoint[0], destinationPoint[1]
        );
        setRoute(routePoints);
        console.log(`Route loaded with ${routePoints.length} points`);
      } catch (error) {
        console.error('Error fetching route:', error);
        // Don't set any fallback route, as we follow the data integrity policy
      }
    };
    
    fetchRoute();
  }, [pickupPoint, destinationPoint]);

  // Simulate driver movement along the route
  useEffect(() => {
    if (!isDriverMoving || route.length === 0 || routeIndex >= route.length - 1) {
      return;
    }

    const intervalId = setInterval(() => {
      // Move driver along the route
      if (routeIndex < route.length - 1) {
        const nextIndex = routeIndex + 1;
        const nextPoint = route[nextIndex];
        setDriverPosition(nextPoint);
        setRouteIndex(nextIndex);
        
        // Calculate rotation based on direction
        const currentPoint = route[routeIndex];
        const dx = nextPoint[1] - currentPoint[1]; // lng difference
        const dy = nextPoint[0] - currentPoint[0]; // lat difference
        const angle = Math.atan2(dx, dy) * (180 / Math.PI);
        setDriverRotation(angle);
        
        // If we've reached the destination, stop
        if (nextIndex >= route.length - 1) {
          setIsDriverMoving(false);
          console.log('Driver reached destination');
        }
      }
    }, updateInterval);
    
    return () => clearInterval(intervalId);
  }, [route, routeIndex, isDriverMoving, updateInterval]);

  // Simulate realistic rider movement (random small movements)
  useEffect(() => {
    if (!riderPosition) return;
    
    const intervalId = setInterval(() => {
      // Small random movement
      const latDelta = (Math.random() * 0.0004 - 0.0002);
      const lngDelta = (Math.random() * 0.0004 - 0.0002);
      setRiderPosition(prev => [
        prev[0] + latDelta,
        prev[1] + lngDelta
      ]);
    }, updateInterval * 2); // Less frequent than driver updates
    
    return () => clearInterval(intervalId);
  }, [riderPosition, updateInterval]);

  return (
    <>
      {/* Render route polyline */}
      {showRoute && route.length > 0 && (
        <Polyline
          positions={route as LatLngExpression[]}
          pathOptions={{
            color: routeColor,
            weight: routeWeight,
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />
      )}
      
      {/* Pickup marker */}
      <Marker
        position={pickupPoint as LatLngExpression}
        icon={pickupIcon}
      >
        {showLabels && (
          <div className="marker-label pickup-label">{pickupLabel}</div>
        )}
      </Marker>
      
      {/* Destination marker */}
      <Marker
        position={destinationPoint as LatLngExpression}
        icon={destinationIcon}
      >
        {showLabels && (
          <div className="marker-label destination-label">{destinationLabel}</div>
        )}
      </Marker>
      
      {/* Driver marker */}
      <Marker
        position={driverPosition as LatLngExpression}
        icon={createDriverMarker(driverRotation)}
      />
      
      {/* Rider marker */}
      <Marker
        position={riderPosition as LatLngExpression}
        icon={createRiderMarker()}
      />
    </>
  );
}
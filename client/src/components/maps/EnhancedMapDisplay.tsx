import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon, LatLngExpression } from 'leaflet';
import { Play, Pause, RotateCcw, Navigation, Clock, Route } from 'lucide-react';
import AnimatedRoutePreview from './AnimatedRoutePreview';
import { calculateDistance, estimateTravelTime, formatDistance, formatDuration } from '@/lib/mapUtils';
import { navigateRouteWithWaze } from '@/lib/wazeIntegration';

// Import marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Create custom icons
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
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'driver-marker'
});

const riderIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'rider-marker'
});

// Component to dynamically set the map view
interface MapViewProps {
  center: [number, number];
  zoom: number;
}

function MapViewSetter({ center, zoom }: MapViewProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

// Main EnhancedMapDisplay component
interface EnhancedMapDisplayProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  markers?: {
    position: [number, number];
    title: string;
    type?: 'default' | 'driver' | 'rider' | 'pickup' | 'dropoff';
    popupContent?: React.ReactNode;
  }[];
  route?: {
    start: [number, number];
    end: [number, number];
    startLabel?: string;
    endLabel?: string;
    complexity?: number;
  };
  showRouteControls?: boolean;
  showRouteInfo?: boolean;
  autoPlayRoute?: boolean;
  showWazeNavigation?: boolean;
  userLocation?: [number, number];
  onAnimationComplete?: () => void;
}

export default function EnhancedMapDisplay({
  center,
  zoom = 13,
  height = '400px',
  markers = [],
  route,
  showRouteControls = true,
  showRouteInfo = true,
  autoPlayRoute = true,
  showWazeNavigation = true,
  userLocation,
  onAnimationComplete
}: EnhancedMapDisplayProps) {
  const mapRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

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

  // Handle animation start
  const handleAnimationStart = () => {
    setIsAnimating(true);
    setAnimationComplete(false);
  };

  // Handle animation complete
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setAnimationComplete(true);
    
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  // Calculate route metrics when route changes
  useEffect(() => {
    if (route) {
      const { start, end } = route;
      
      // Calculate direct distance between points
      const distance = calculateDistance(
        start[0], start[1],
        end[0], end[1]
      );
      
      setRouteDistance(distance);
      
      // Estimate travel time based on distance (30km/h average speed)
      const duration = estimateTravelTime(distance);
      setRouteDuration(duration);
    } else {
      setRouteDistance(null);
      setRouteDuration(null);
    }
  }, [route]);

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
        <MapViewSetter center={center} zoom={zoom} />
        
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
                    onClick={() => navigateRouteWithWaze(
                      userLocation ? userLocation[0] : marker.position[0],
                      userLocation ? userLocation[1] : marker.position[1],
                      marker.position[0],
                      marker.position[1],
                      marker.title
                    )}
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
        
        {/* Animated route preview */}
        {route && (
          <AnimatedRoutePreview
            startPoint={route.start}
            endPoint={route.end}
            startLabel={route.startLabel || 'Start'}
            endLabel={route.endLabel || 'Destination'}
            autoStart={autoPlayRoute}
            routeComplexity={route.complexity || 5}
            animationDuration={3000}
            showCarMarker={true}
            routeWeight={5}
            onAnimationStart={handleAnimationStart}
            onAnimationComplete={handleAnimationComplete}
            fitBounds={true}
            boundsPadding={0.05}
          />
        )}
      </MapContainer>
      
      {/* Route details info card */}
      {route && showRouteInfo && routeDistance && routeDuration && (
        <div className="route-info-box">
          <h3 className="font-semibold text-primary text-base mb-2">Route Details</h3>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <Route className="w-4 h-4 mr-2 text-primary" />
              <span className="text-sm">Distance: {formatDistance(routeDistance)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-primary" />
              <span className="text-sm">Duration: ~{formatDuration(routeDuration)}</span>
            </div>
            {animationComplete && (
              <Badge variant="outline" className="self-start mt-1 bg-green-50 text-green-700 border-green-200">
                Route Preview Complete
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Animation controls */}
      {route && showRouteControls && (
        <div className="animated-route-controls">
          {!isAnimating && !animationComplete && (
            <Button
              size="sm"
              onClick={() => {
                const animatedRoute = document.querySelector('.leaflet-animated-route');
                if (animatedRoute) {
                  (animatedRoute as any).startAnimation();
                } else {
                  // If the component doesn't expose a direct method, we can trigger a re-render
                  // that will start the animation due to autoStart being true
                  setAnimationComplete(false);
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Play className="w-4 h-4 mr-1" />
              Play Route
            </Button>
          )}
          
          {isAnimating && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const animatedRoute = document.querySelector('.leaflet-animated-route');
                if (animatedRoute) {
                  (animatedRoute as any).pauseAnimation();
                }
              }}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          
          {animationComplete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAnimationComplete(false);
                const animatedRoute = document.querySelector('.leaflet-animated-route');
                if (animatedRoute) {
                  (animatedRoute as any).resetAnimation();
                  (animatedRoute as any).startAnimation();
                }
              }}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Replay
            </Button>
          )}
          
          {showWazeNavigation && route && (
            <Button
              size="sm"
              onClick={() => {
                const { start, end } = route;
                const startPoint = userLocation || start;
                navigateRouteWithWaze(
                  startPoint[0],
                  startPoint[1],
                  end[0],
                  end[1],
                  route.endLabel || 'Destination'
                );
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Navigate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
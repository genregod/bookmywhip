import { useState, useEffect, useRef } from 'react';
import { useMap, Polyline, Marker } from 'react-leaflet';
import { LatLngBounds, LatLngExpression, Icon, DivIcon } from 'leaflet';
import { generateEnhancedRoute, calculateCameraPath, generateRouteAnimationSteps, getRouteBounds } from '@/lib/mapUtils';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom marker icons
const startIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'start-marker'
});

const endIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'end-marker'
});

// Create a custom car icon function to support rotation
function createCarIcon(rotation = 0) {
  return new DivIcon({
    html: `
      <div class="car-marker" style="transform: rotate(${rotation}deg)">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/>
          <circle cx="6.5" cy="16.5" r="2.5"/>
          <circle cx="16.5" cy="16.5" r="2.5"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: 'car-marker-container'
  });
}

// Route Colors
const ROUTE_COLORS = {
  base: '#6366F1',
  highlight: '#4ADE80',
  animating: '#F97316',
  completed: '#10B981',
  background: '#CBD5E1'
};

interface AnimatedRoutePreviewProps {
  startPoint: [number, number]; // [lat, lng]
  endPoint: [number, number]; // [lat, lng]
  autoStart?: boolean;
  routeComplexity?: number;
  animationDuration?: number;
  showCarMarker?: boolean;
  routeColor?: string;
  routeWeight?: number;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  showLabels?: boolean;
  startLabel?: string;
  endLabel?: string;
  fitBounds?: boolean;
  boundsPadding?: number;
}

export default function AnimatedRoutePreview({
  startPoint,
  endPoint,
  autoStart = true,
  routeComplexity = 5,
  animationDuration = 3000,
  showCarMarker = true,
  routeColor = ROUTE_COLORS.animating,
  routeWeight = 4,
  onAnimationStart,
  onAnimationComplete,
  showLabels = true,
  startLabel = 'Start',
  endLabel = 'Destination',
  fitBounds = true,
  boundsPadding = 0.05
}: AnimatedRoutePreviewProps) {
  const map = useMap();
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [visibleRoute, setVisibleRoute] = useState<Array<[number, number]>>([]);
  const [animatedCarPosition, setAnimatedCarPosition] = useState<[number, number] | null>(null);
  const [animationSteps, setAnimationSteps] = useState<Array<Array<[number, number]>>>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Generate route on component mount or when points change
  useEffect(() => {
    // Generate a realistic route
    const newRoute = generateEnhancedRoute(
      startPoint[0], startPoint[1],
      endPoint[0], endPoint[1],
      routeComplexity
    );
    
    setRoute(newRoute);
    
    // Reset animation state
    setVisibleRoute([]);
    setAnimatedCarPosition(null);
    setAnimationComplete(false);
    
    // Generate animation steps
    const newAnimationSteps = generateRouteAnimationSteps(newRoute, 60);
    setAnimationSteps(newAnimationSteps);
    
    // Fit map to route bounds if enabled
    if (fitBounds && newRoute.length > 0) {
      const bounds = getRouteBounds(newRoute, boundsPadding);
      map.fitBounds([
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng]
      ] as [[number, number], [number, number]]);
    }
    
    // Auto-start animation if enabled
    if (autoStart) {
      // Small delay to ensure map is ready
      setTimeout(() => {
        startAnimation();
      }, 300);
    }
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startPoint, endPoint, routeComplexity, autoStart, map, fitBounds, boundsPadding]);

  // Start the route animation
  const startAnimation = () => {
    if (isAnimating || animationComplete || animationSteps.length === 0) return;
    
    setIsAnimating(true);
    setAnimationComplete(false);
    setVisibleRoute([]);
    
    if (onAnimationStart) {
      onAnimationStart();
    }
    
    startTimeRef.current = Date.now();
    animateRoute();
  };

  // Animation frame handler
  const animateRoute = () => {
    const currentTime = Date.now();
    const elapsedTime = startTimeRef.current ? currentTime - startTimeRef.current : 0;
    const progress = Math.min(1, elapsedTime / animationDuration);
    
    if (progress < 1) {
      // Calculate which animation step to show based on progress
      const stepIndex = Math.min(
        animationSteps.length - 1,
        Math.floor(progress * animationSteps.length)
      );
      
      const currentStep = animationSteps[stepIndex];
      setVisibleRoute(currentStep);
      
      // Update car position (last point in the visible route)
      if (showCarMarker && currentStep.length > 0) {
        setAnimatedCarPosition(currentStep[currentStep.length - 1]);
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animateRoute);
    } else {
      // Animation complete
      setVisibleRoute(route);
      
      if (showCarMarker) {
        setAnimatedCarPosition(endPoint);
      }
      
      setIsAnimating(false);
      setAnimationComplete(true);
      
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }
  };

  // Reset animation state
  const resetAnimation = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setVisibleRoute([]);
    setAnimatedCarPosition(null);
    setIsAnimating(false);
    setAnimationComplete(false);
  };

  // Calculate the car icon rotation based on route direction
  const getCarRotation = (): number => {
    if (!animatedCarPosition || visibleRoute.length < 2) return 0;
    
    // Get the current point and the previous point to calculate direction
    const currentIndex = visibleRoute.findIndex(
      point => point[0] === animatedCarPosition[0] && point[1] === animatedCarPosition[1]
    );
    
    if (currentIndex <= 0) return 0;
    
    const currentPoint = visibleRoute[currentIndex];
    const prevPoint = visibleRoute[currentIndex - 1];
    
    // Calculate angle in degrees
    const dx = currentPoint[1] - prevPoint[1]; // lng difference
    const dy = currentPoint[0] - prevPoint[0]; // lat difference
    const angle = Math.atan2(dx, dy) * (180 / Math.PI);
    
    return angle;
  };

  return (
    <>
      {/* Render route polyline */}
      {route.length > 0 && (
        <Polyline
          positions={route as LatLngExpression[]}
          pathOptions={{
            color: ROUTE_COLORS.background,
            weight: routeWeight,
            opacity: 0.5,
            dashArray: '5, 5'
          }}
        />
      )}
      
      {/* Render animated route polyline */}
      {visibleRoute.length > 0 && (
        <Polyline
          positions={visibleRoute as LatLngExpression[]}
          pathOptions={{
            color: animationComplete ? ROUTE_COLORS.completed : routeColor,
            weight: routeWeight,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round'
          }}
        />
      )}
      
      {/* Start marker */}
      <Marker
        position={startPoint as LatLngExpression}
        icon={startIcon}
      >
        {showLabels && (
          <div className="marker-label start-label">{startLabel}</div>
        )}
      </Marker>
      
      {/* End marker */}
      <Marker
        position={endPoint as LatLngExpression}
        icon={endIcon}
      >
        {showLabels && (
          <div className="marker-label end-label">{endLabel}</div>
        )}
      </Marker>
      
      {/* Animated car marker */}
      {showCarMarker && animatedCarPosition && (
        <Marker
          position={animatedCarPosition as LatLngExpression}
          icon={createCarIcon(getCarRotation())}
        />
      )}
    </>
  );
}
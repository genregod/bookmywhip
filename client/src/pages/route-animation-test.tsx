import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Play, Pause, RotateCcw, RefreshCw } from 'lucide-react';
import AnimatedRoutePreview, { AnimatedRoutePreviewRef } from '@/components/maps/AnimatedRoutePreview';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Component to dynamically set the map view
function MapViewSetter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export default function RouteAnimationTest() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const routeAnimationRef = useRef<AnimatedRoutePreviewRef>(null);
  
  // Sample locations
  const startPoint: [number, number] = [37.7749, -122.4194]; // San Francisco
  const endPoint: [number, number] = [37.3382, -121.8863]; // San Jose
  
  const handleAnimationStart = () => {
    console.log('Animation started');
    setIsAnimating(true);
    setIsComplete(false);
    
    toast({
      title: 'Animation Started',
      description: 'Route animation is now playing',
    });
  };
  
  const handleAnimationComplete = () => {
    console.log('Animation completed');
    setIsAnimating(false);
    setIsComplete(true);
    
    toast({
      title: 'Animation Completed',
      description: 'Route animation has finished',
    });
  };
  
  const handlePlay = () => {
    if (routeAnimationRef.current) {
      console.log('Starting animation via ref');
      routeAnimationRef.current.startAnimation();
    } else {
      console.log('Route animation ref is not available');
      toast({
        title: 'Error',
        description: 'Could not start animation. Try refreshing the map.',
        variant: 'destructive',
      });
    }
  };
  
  const handlePause = () => {
    if (routeAnimationRef.current) {
      console.log('Pausing animation via ref');
      routeAnimationRef.current.pauseAnimation();
      setIsAnimating(false);
    }
  };
  
  const handleReset = () => {
    if (routeAnimationRef.current) {
      console.log('Resetting animation via ref');
      routeAnimationRef.current.resetAnimation();
      setIsAnimating(false);
      setIsComplete(false);
    }
  };
  
  const handleRestart = () => {
    if (routeAnimationRef.current) {
      console.log('Restarting animation via ref');
      routeAnimationRef.current.resetAnimation();
      setTimeout(() => {
        if (routeAnimationRef.current) {
          routeAnimationRef.current.startAnimation();
        }
      }, 50);
    }
  };
  
  // Force refresh the map - this recreates all components
  const refreshMap = () => {
    setRefreshKey(prev => prev + 1);
    setIsAnimating(false);
    setIsComplete(false);
    toast({
      title: 'Map Refreshed',
      description: 'The map has been refreshed and all components recreated',
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Route Animation Test</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Testing the RefPattern implementation of AnimatedRoutePreview
          </p>
        </div>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/demo">
            Back to Demos
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ref-Based Animation Control Test</CardTitle>
          <CardDescription>
            This demo tests the useImperativeHandle + forwardRef pattern for controlling animations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-[500px] w-full border rounded-md overflow-hidden" key={refreshKey}>
              <MapContainer 
                center={startPoint}
                zoom={9}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                attributionControl={true}
              >
                <MapViewSetter center={startPoint} zoom={9} />
                
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Animated route preview with ref */}
                <AnimatedRoutePreview
                  ref={routeAnimationRef}
                  startPoint={startPoint}
                  endPoint={endPoint}
                  startLabel="San Francisco"
                  endLabel="San Jose"
                  autoStart={false} // Important: We want to control this manually
                  routeComplexity={5}
                  animationDuration={5000} // Slower animation for testing
                  showCarMarker={true}
                  onAnimationStart={handleAnimationStart}
                  onAnimationComplete={handleAnimationComplete}
                  fitBounds={true}
                />
              </MapContainer>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {!isAnimating && !isComplete && (
                <Button onClick={handlePlay} className="bg-primary hover:bg-primary/90">
                  <Play className="w-4 h-4 mr-2" />
                  Play Animation
                </Button>
              )}
              
              {isAnimating && (
                <Button onClick={handlePause} variant="outline" className="border-primary text-primary">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {(isAnimating || isComplete) && (
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
              
              {isComplete && (
                <Button onClick={handleRestart} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Replay
                </Button>
              )}
              
              <Button onClick={refreshMap} variant="secondary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Map
              </Button>
            </div>
            
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Animation Status:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Is Animating:</span> 
                  <span className={isAnimating ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                    {isAnimating ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Is Complete:</span> 
                  <span className={isComplete ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                    {isComplete ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import RealTimeTracking from '@/components/maps/RealTimeTracking';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateDistance, formatDistance, formatDuration, estimateTravelTime } from '@/lib/mapUtils';

// Component to dynamically set the map view
function MapViewSetter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export default function RealTimeTrackingDemo() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDriverMoving, setIsDriverMoving] = useState(false);
  const [riderStatus, setRiderStatus] = useState<'waiting' | 'picked_up' | 'arrived'>('waiting');
  const [progressValue, setProgressValue] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  
  // Sample locations in San Francisco, CA
  const pickupPoint: [number, number] = [37.7749, -122.4194]; // San Francisco
  const destinationPoint: [number, number] = [37.8024, -122.4058]; // Fisherman's Wharf
  
  const initialDriverPoint: [number, number] = [37.7647, -122.4601]; // Golden Gate Park (a bit away from pickup)
  
  // Calculate direct distance for ETA estimation
  const directDistance = calculateDistance(
    pickupPoint[0], pickupPoint[1], 
    destinationPoint[0], destinationPoint[1]
  );
  
  useEffect(() => {
    if (isDriverMoving) {
      let progress = 0;
      const updateInterval = setInterval(() => {
        if (progress < 100) {
          progress += 0.5;
          setProgressValue(progress);
          
          // Update rider status based on progress
          if (progress > 40 && riderStatus === 'waiting') {
            setRiderStatus('picked_up');
            toast({
              title: "Rider Picked Up",
              description: "The driver has arrived at the pickup location and the rider is now in the vehicle.",
            });
          } else if (progress >= 100 && riderStatus === 'picked_up') {
            setRiderStatus('arrived');
            setIsDriverMoving(false);
            toast({
              title: "Destination Reached",
              description: "The rider has arrived at their destination.",
            });
          }
          
          // Update ETA (more accurate as we get closer)
          const remainingProgress = 100 - progress;
          const remainingDistance = (directDistance * remainingProgress) / 100;
          const updatedEta = Math.max(Math.round(estimateTravelTime(remainingDistance)), 1);
          setEta(updatedEta);
        } else {
          clearInterval(updateInterval);
        }
      }, 200);
      
      return () => clearInterval(updateInterval);
    }
  }, [isDriverMoving, directDistance, riderStatus, toast]);
  
  const handleStartDriving = () => {
    setIsDriverMoving(true);
    setProgressValue(0);
    setEta(Math.round(estimateTravelTime(directDistance)));
    
    toast({
      title: "Driver En Route",
      description: "The driver is heading to the pickup location.",
    });
  };
  
  const handlePauseDriving = () => {
    setIsDriverMoving(false);
    
    toast({
      title: "Driver Paused",
      description: "The driver has momentarily stopped.",
      variant: "destructive",
    });
  };
  
  // Force refresh the map - this recreates all components
  const refreshMap = () => {
    setRefreshKey(prev => prev + 1);
    setIsDriverMoving(false);
    setRiderStatus('waiting');
    setProgressValue(0);
    setEta(null);
    
    toast({
      title: 'Map Refreshed',
      description: 'The map has been refreshed and all components recreated',
    });
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Real-Time Tracking Demo</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Visualize real-time GPS tracking between riders and drivers using Azure Maps
          </p>
        </div>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/demo">
            Back to Demos
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Tracking Map</CardTitle>
            <CardDescription>
              Real-time position tracking of driver and rider with route visualization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full border rounded-md overflow-hidden" key={refreshKey}>
              <MapContainer 
                center={pickupPoint}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                attributionControl={true}
              >
                <MapViewSetter center={pickupPoint} zoom={14} />
                
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Real-time tracking component */}
                <RealTimeTracking
                  pickupPoint={pickupPoint}
                  destinationPoint={destinationPoint}
                  initialDriverPoint={initialDriverPoint}
                  driverMovementSimulation={isDriverMoving}
                  pickupLabel="Pickup (San Francisco)"
                  destinationLabel="Destination (Fisherman's Wharf)"
                  updateInterval={500}
                />
              </MapContainer>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {!isDriverMoving && (
                <Button onClick={handleStartDriving} className="bg-primary hover:bg-primary/90">
                  <Play className="w-4 h-4 mr-2" />
                  Start Driving
                </Button>
              )}
              
              {isDriverMoving && (
                <Button onClick={handlePauseDriving} variant="outline" className="border-primary text-primary">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button onClick={refreshMap} variant="secondary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Status</CardTitle>
              <CardDescription>
                Current status of the ride and driver position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Trip Progress</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progressValue)}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge variant={
                    riderStatus === 'arrived' ? 'secondary' : 
                    riderStatus === 'picked_up' ? 'default' : 
                    'outline'
                  }>
                    {riderStatus === 'waiting' ? 'En route to pickup' : 
                     riderStatus === 'picked_up' ? 'In progress' : 
                     'Arrived'}
                  </Badge>
                </div>
                
                {eta !== null && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">ETA:</span>
                    <span>{formatDuration(eta)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Distance:</span>
                  <span>{formatDistance(directDistance)}</span>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-800 mb-2">Azure Maps Integration</h3>
                  <p className="text-sm text-green-700">
                    This demo uses Azure Maps API to fetch real-world routes between locations, providing accurate navigation data for drivers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>About Real-Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                In a production environment, this system would:
              </p>
              <ul className="text-sm space-y-2 list-disc pl-5">
                <li>Receive GPS updates from drivers and riders via WebSockets</li>
                <li>Calculate optimal routes using Azure Maps API</li>
                <li>Update ETA based on real-time traffic conditions</li>
                <li>Notify users of driver proximity and status changes</li>
                <li>Track ride history and statistics for both parties</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
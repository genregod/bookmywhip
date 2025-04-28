import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';
import EnhancedMapDisplay from '@/components/maps/EnhancedMapDisplay';
import { Info, Car, MapPin, Navigation, Check } from 'lucide-react';

export default function RoutePreviewDemo() {
  const { toast } = useToast();
  const [startPoint, setStartPoint] = useState<[number, number]>([37.7749, -122.4194]); // San Francisco
  const [endPoint, setEndPoint] = useState<[number, number]>([37.3382, -121.8863]); // San Jose
  const [startLabel, setStartLabel] = useState('San Francisco');
  const [endLabel, setEndLabel] = useState('San Jose');
  const [routeComplexity, setRouteComplexity] = useState(5);
  const [showControls, setShowControls] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [tab, setTab] = useState('preview');

  // Try to get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords([
            position.coords.latitude,
            position.coords.longitude
          ]);
        },
        () => {
          console.log('Error getting location or permission denied');
        }
      );
    }
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate coordinates
      const startLat = parseFloat((document.getElementById('startLat') as HTMLInputElement).value);
      const startLng = parseFloat((document.getElementById('startLng') as HTMLInputElement).value);
      const endLat = parseFloat((document.getElementById('endLat') as HTMLInputElement).value);
      const endLng = parseFloat((document.getElementById('endLng') as HTMLInputElement).value);
      
      // Simple validation
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
        throw new Error('Coordinates must be valid numbers');
      }
      
      // Validate coordinate ranges
      if (startLat < -90 || startLat > 90 || endLat < -90 || endLat > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees');
      }
      
      if (startLng < -180 || startLng > 180 || endLng < -180 || endLng > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees');
      }
      
      setStartPoint([startLat, startLng]);
      setEndPoint([endLat, endLng]);
      
      // Get labels
      const newStartLabel = (document.getElementById('startLabel') as HTMLInputElement).value || 'Start';
      const newEndLabel = (document.getElementById('endLabel') as HTMLInputElement).value || 'Destination';
      
      setStartLabel(newStartLabel);
      setEndLabel(newEndLabel);
      
      // Switch to preview tab
      setTab('preview');
      
      // Show success toast
      toast({
        title: 'Route Updated',
        description: 'The route has been updated with your new coordinates',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Invalid Coordinates',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Handle route complexity change
  const handleComplexityChange = (value: number[]) => {
    setRouteComplexity(value[0]);
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    toast({
      title: 'Route Preview Complete',
      description: 'The route animation has finished',
      variant: 'default',
    });
  };

  // Set current location as start point
  const useCurrentLocationAsStart = () => {
    if (userCoords) {
      (document.getElementById('startLat') as HTMLInputElement).value = userCoords[0].toString();
      (document.getElementById('startLng') as HTMLInputElement).value = userCoords[1].toString();
      (document.getElementById('startLabel') as HTMLInputElement).value = 'My Location';
      
      toast({
        title: 'Current Location Set',
        description: 'Your current location has been set as the starting point',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Location Not Available',
        description: 'Could not get your current location',
        variant: 'destructive',
      });
    }
  };

  // Example locations for quick selection
  const exampleLocations = [
    { name: 'SF to San Jose', start: [37.7749, -122.4194], startLabel: 'San Francisco', end: [37.3382, -121.8863], endLabel: 'San Jose' },
    { name: 'NYC to Brooklyn', start: [40.7128, -74.0060], startLabel: 'Manhattan', end: [40.6782, -73.9442], endLabel: 'Brooklyn' },
    { name: 'London to Cambridge', start: [51.5074, -0.1278], startLabel: 'London', end: [52.2053, 0.1218], endLabel: 'Cambridge' },
    { name: 'Paris to Versailles', start: [48.8566, 2.3522], startLabel: 'Paris', end: [48.8049, 2.1204], endLabel: 'Versailles' },
  ];

  // Apply example location
  const applyExampleLocation = (index: number) => {
    const location = exampleLocations[index];
    
    (document.getElementById('startLat') as HTMLInputElement).value = location.start[0].toString();
    (document.getElementById('startLng') as HTMLInputElement).value = location.start[1].toString();
    (document.getElementById('startLabel') as HTMLInputElement).value = location.startLabel;
    
    (document.getElementById('endLat') as HTMLInputElement).value = location.end[0].toString();
    (document.getElementById('endLng') as HTMLInputElement).value = location.end[1].toString();
    (document.getElementById('endLabel') as HTMLInputElement).value = location.endLabel;
    
    toast({
      title: 'Example Location Applied',
      description: `Applied "${location.name}" route`,
      variant: 'default',
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gradient">Animated Route Preview</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Experience smooth map transitions and animated route displays for an engaging ride preview experience.
      </p>
      
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Route Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings & Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Route Animation</CardTitle>
              <CardDescription>
                Preview the route with smooth animations and transitions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <EnhancedMapDisplay
                  center={startPoint}
                  zoom={9}
                  height="600px"
                  markers={[
                    {
                      position: startPoint,
                      title: startLabel,
                      type: 'rider'
                    },
                    {
                      position: endPoint,
                      title: endLabel,
                      type: 'driver'
                    }
                  ]}
                  route={{
                    start: startPoint,
                    end: endPoint,
                    startLabel: startLabel,
                    endLabel: endLabel,
                    complexity: routeComplexity
                  }}
                  showRouteControls={showControls}
                  showRouteInfo={showInfo}
                  autoPlayRoute={autoPlay}
                  showWazeNavigation={true}
                  userLocation={userCoords || undefined}
                  onAnimationComplete={handleAnimationComplete}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Route Complexity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-2">
                  <Slider
                    defaultValue={[routeComplexity]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={handleComplexityChange}
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Simple</span>
                    <span>Value: {routeComplexity}</span>
                    <span>Complex</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Show Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-4">
                  <Label htmlFor="show-controls">Display Route Controls</Label>
                  <Switch
                    id="show-controls"
                    checked={showControls}
                    onCheckedChange={setShowControls}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Show Route Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-4">
                  <Label htmlFor="show-info">Display Route Information</Label>
                  <Switch
                    id="show-info"
                    checked={showInfo}
                    onCheckedChange={setShowInfo}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Auto-Play Animation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-4">
                  <Label htmlFor="auto-play">Start Animation Automatically</Label>
                  <Switch
                    id="auto-play"
                    checked={autoPlay}
                    onCheckedChange={setAutoPlay}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Configuration</CardTitle>
              <CardDescription>
                Set the start and end points for your route animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Starting Point */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Starting Point</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startLat">Latitude</Label>
                        <Input
                          id="startLat"
                          type="number"
                          step="0.0001"
                          placeholder="e.g. 37.7749"
                          defaultValue={startPoint[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startLng">Longitude</Label>
                        <Input
                          id="startLng"
                          type="number"
                          step="0.0001"
                          placeholder="e.g. -122.4194"
                          defaultValue={startPoint[1]}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="startLabel">Location Name</Label>
                      <Input
                        id="startLabel"
                        placeholder="e.g. San Francisco"
                        defaultValue={startLabel}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={useCurrentLocationAsStart}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Use My Current Location
                    </Button>
                  </div>
                  
                  {/* Destination Point */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Destination</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="endLat">Latitude</Label>
                        <Input
                          id="endLat"
                          type="number"
                          step="0.0001"
                          placeholder="e.g. 37.3382"
                          defaultValue={endPoint[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endLng">Longitude</Label>
                        <Input
                          id="endLng"
                          type="number"
                          step="0.0001"
                          placeholder="e.g. -121.8863"
                          defaultValue={endPoint[1]}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endLabel">Location Name</Label>
                      <Input
                        id="endLabel"
                        placeholder="e.g. San Jose"
                        defaultValue={endLabel}
                      />
                    </div>
                  </div>
                </div>
                
                <Button type="submit" className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Update Route
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Example Routes</CardTitle>
              <CardDescription>
                Try these pre-configured routes to see the animation in action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {exampleLocations.map((location, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center space-y-2"
                    onClick={() => applyExampleLocation(index)}
                  >
                    <span className="font-medium">{location.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {location.startLabel} → {location.endLabel}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>About Route Animation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium">How it works</h4>
                  <p className="text-sm text-muted-foreground">
                    The route animation uses spline interpolation to create realistic-looking
                    routes between two points. The animation gradually reveals the route to
                    give users a sense of journey and distance.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium">Route Complexity</h4>
                  <p className="text-sm text-muted-foreground">
                    Higher complexity values create more realistic routes with additional
                    waypoints and curves, simulating how actual roads might connect the points.
                    Lower values create more direct routes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium">Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    This feature enhances user experience by providing visual feedback
                    about ride routes. It can be integrated into the booking flow to help
                    users understand their journey before confirming a ride.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
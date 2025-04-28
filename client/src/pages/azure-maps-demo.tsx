import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { Map as LeafletMap, LatLngExpression, Icon } from 'leaflet';
import { Play, Pause, RotateCcw, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { fetchRouteFromAzureMaps } from '@/lib/mapUtils';

// Import Leaflet marker icons
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

// Component to dynamically set the map view
function MapViewSetter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export default function AzureMapsDemo() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [routePoints, setRoutePoints] = useState<Array<[number, number]>>([]);
  const mapRef = useRef<LeafletMap | null>(null);
  
  // Sample locations
  const startPoint: [number, number] = [37.7749, -122.4194]; // San Francisco
  const endPoint: [number, number] = [37.3382, -121.8863]; // San Jose
  
  const fetchRoute = async () => {
    setIsLoading(true);
    
    try {
      toast({
        title: 'Fetching Route',
        description: 'Requesting route data from Azure Maps API...',
      });
      
      // Try to fetch route directly from Azure Maps API
      const newRoute = await fetchRouteFromAzureMaps(
        startPoint[0], startPoint[1],
        endPoint[0], endPoint[1]
      );
      
      setRoutePoints(newRoute);
      
      // Fit map to show the entire route
      if (mapRef.current && newRoute.length > 0) {
        const bounds = [
          [
            Math.min(...newRoute.map(point => point[0])),
            Math.min(...newRoute.map(point => point[1]))
          ],
          [
            Math.max(...newRoute.map(point => point[0])),
            Math.max(...newRoute.map(point => point[1]))
          ]
        ] as [[number, number], [number, number]];
        
        mapRef.current.fitBounds(bounds);
      }
      
      toast({
        title: 'Route Fetched Successfully',
        description: `Retrieved ${newRoute.length} route points from Azure Maps`,
      });
    } catch (error) {
      console.error('Error fetching route:', error);
      toast({
        title: 'Error Fetching Route',
        description: 'Failed to fetch route from Azure Maps API',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Force refresh the map - this recreates all components
  const refreshMap = () => {
    setRefreshKey(prev => prev + 1);
    setRoutePoints([]);
    toast({
      title: 'Map Refreshed',
      description: 'The map has been refreshed and route cleared',
    });
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Azure Maps API Demo</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Testing the real-world route generation using Azure Maps API
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
          <CardTitle>Azure Maps Route Demo</CardTitle>
          <CardDescription>
            This demo shows how to fetch and display a real-world route using Azure Maps API
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
                ref={mapRef}
              >
                <MapViewSetter center={startPoint} zoom={9} />
                
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Route polyline */}
                {routePoints.length > 0 && (
                  <Polyline
                    positions={routePoints as LatLngExpression[]}
                    pathOptions={{
                      color: '#4ADE80',
                      weight: 4,
                      opacity: 1,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                )}
                
                {/* Start marker */}
                <Marker position={startPoint as LatLngExpression} icon={startIcon} />
                
                {/* End marker */}
                <Marker position={endPoint as LatLngExpression} icon={endIcon} />
              </MapContainer>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={fetchRoute} 
                className="bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Fetching Route...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Fetch Azure Maps Route
                  </>
                )}
              </Button>
              
              <Button onClick={refreshMap} variant="secondary" disabled={isLoading}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Map
              </Button>
            </div>
            
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Route Information:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Start Point:</span> 
                  <span className="ml-2">
                    San Francisco (37.7749, -122.4194)
                  </span>
                </div>
                <div>
                  <span className="font-medium">End Point:</span> 
                  <span className="ml-2">
                    San Jose (37.3382, -121.8863)
                  </span>
                </div>
                <div>
                  <span className="font-medium">Route Points:</span> 
                  <span className="ml-2">
                    {routePoints.length > 0 ? routePoints.length : 'None fetched yet'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Data Source:</span> 
                  <span className="text-green-600 ml-2">
                    Azure Maps API
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
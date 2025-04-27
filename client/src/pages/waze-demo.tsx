import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getWazeDeepLink, navigateWithWaze, getWazeRouteDeepLink, navigateRouteWithWaze } from '@/lib/wazeIntegration';
import MapDisplay from '@/components/maps/MapDisplay';
import { RideMap } from '@/components/maps/RideMap';
import { MusicPreferences } from '@/components/audio/MusicPreferences';
import { RideAudioSelector } from '@/components/audio/RideAudioSelector';
import { ExternalLink, Navigation, Map, Music } from 'lucide-react';
import WazeDemoNavMenu from '@/components/demo/WazeDemoNavMenu';

export default function WazeDemo() {
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    name: string;
  }>({
    lat: 40.7128,
    lng: -74.0060,
    name: 'New York City'
  });
  
  const [routeCoords, setRouteCoords] = useState<{
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
    name: string;
  }>({
    fromLat: 40.7128,
    fromLng: -74.0060,
    toLat: 34.0522,
    toLng: -118.2437,
    name: 'Los Angeles'
  });
  
  // Mock demo data for the ride map
  const mockRide = {
    pickup: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York City, NY'
    },
    dropoff: {
      latitude: 40.7831,
      longitude: -73.9712,
      address: 'Central Park, NY'
    },
    driver: {
      id: 1,
      name: 'John Driver',
      location: {
        latitude: 40.7200,
        longitude: -74.0100
      },
      vehicleDetails: 'Toyota Camry (ABC-1234)'
    },
    status: 'accepted' as const,
    estimatedArrival: '5 minutes'
  };
  
  return (
    <div className="container py-10">
      <WazeDemoNavMenu />
      <h1 className="text-3xl font-bold mb-6">Waze Integration Demo</h1>
      <p className="text-gray-600 mb-8">
        This demo showcases BookMyWhip's integration with Waze for navigation and audio services,
        creating a cost-efficient mapping solution without any API subscription costs.
      </p>
      
      <Tabs defaultValue="deep-links" className="w-full">
        <TabsList className="w-full mb-8">
          <TabsTrigger value="deep-links" className="flex-1">
            <Navigation className="mr-2 h-4 w-4" /> Waze Deep Links
          </TabsTrigger>
          <TabsTrigger value="maps" className="flex-1">
            <Map className="mr-2 h-4 w-4" /> Maps Integration
          </TabsTrigger>
          <TabsTrigger value="audio-kit" className="flex-1">
            <Music className="mr-2 h-4 w-4" /> Waze Audio Kit
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="deep-links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Waze Deep Links</CardTitle>
              <CardDescription>
                Waze Deep Links allow you to open the Waze app with a specific destination or route without
                any API costs or authentication requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Navigate to a Single Location</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input 
                        id="lat" 
                        type="number" 
                        placeholder="Latitude" 
                        value={coords.lat}
                        onChange={(e) => setCoords({ ...coords, lat: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input 
                        id="lng" 
                        type="number" 
                        placeholder="Longitude" 
                        value={coords.lng}
                        onChange={(e) => setCoords({ ...coords, lng: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="place-name">Place Name (Optional)</Label>
                    <Input 
                      id="place-name" 
                      placeholder="e.g. My Destination" 
                      value={coords.name}
                      onChange={(e) => setCoords({ ...coords, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={() => navigateWithWaze(coords.lat, coords.lng, coords.name)}
                      className="w-full"
                    >
                      Open in Waze <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Generated Deep Link:</p>
                      <code className="block mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                        {getWazeDeepLink(coords.lat, coords.lng, coords.name)}
                      </code>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Navigate a Route</h3>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Starting Point</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-lat">From Latitude</Label>
                        <Input 
                          id="from-lat" 
                          type="number" 
                          placeholder="From Latitude" 
                          value={routeCoords.fromLat}
                          onChange={(e) => setRouteCoords({ ...routeCoords, fromLat: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="from-lng">From Longitude</Label>
                        <Input 
                          id="from-lng" 
                          type="number" 
                          placeholder="From Longitude" 
                          value={routeCoords.fromLng}
                          onChange={(e) => setRouteCoords({ ...routeCoords, fromLng: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm font-medium mt-3">Destination</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="to-lat">To Latitude</Label>
                        <Input 
                          id="to-lat" 
                          type="number" 
                          placeholder="To Latitude" 
                          value={routeCoords.toLat}
                          onChange={(e) => setRouteCoords({ ...routeCoords, toLat: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="to-lng">To Longitude</Label>
                        <Input 
                          id="to-lng" 
                          type="number" 
                          placeholder="To Longitude" 
                          value={routeCoords.toLng}
                          onChange={(e) => setRouteCoords({ ...routeCoords, toLng: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dest-name">Destination Name (Optional)</Label>
                      <Input 
                        id="dest-name" 
                        placeholder="e.g. My Destination" 
                        value={routeCoords.name}
                        onChange={(e) => setRouteCoords({ ...routeCoords, name: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={() => navigateRouteWithWaze(
                        routeCoords.fromLat,
                        routeCoords.fromLng,
                        routeCoords.toLat,
                        routeCoords.toLng,
                        routeCoords.name
                      )}
                      className="w-full"
                    >
                      Open Route in Waze <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Generated Deep Link:</p>
                      <code className="block mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                        {getWazeRouteDeepLink(
                          routeCoords.fromLat,
                          routeCoords.fromLng,
                          routeCoords.toLat,
                          routeCoords.toLng,
                          routeCoords.name
                        )}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maps" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>OpenStreetMap Integration</CardTitle>
                <CardDescription>
                  BookMyWhip uses Leaflet.js with OpenStreetMap tiles for map display without any API costs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapDisplay 
                  center={[coords.lat, coords.lng]}
                  zoom={12}
                  height="300px"
                  markers={[
                    {
                      position: [coords.lat, coords.lng],
                      title: coords.name,
                      type: 'default',
                      popupContent: <p>This is a sample marker with a popup</p>
                    }
                  ]}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ride Map Example</CardTitle>
                <CardDescription>
                  Sample ride map with pickup, dropoff and driver locations.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <RideMap
                  pickup={mockRide.pickup}
                  dropoff={mockRide.dropoff}
                  driver={mockRide.driver}
                  status={mockRide.status}
                  estimatedArrival={mockRide.estimatedArrival}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="audio-kit" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <MusicPreferences userId={1} />
            
            <RideAudioSelector rideId={1} riderId={1} driverId={2} />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>About Waze Audio Kit</CardTitle>
              <CardDescription>
                The Waze Audio Kit integration allows riders to customize their audio experience during rides.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  The Waze Audio Kit is a platform that allows content providers to integrate their audio content
                  into the Waze navigation experience. For BookMyWhip, we've created a custom implementation that:
                </p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>Allows riders to set content preferences (music, podcasts, audiobooks)</li>
                  <li>Implements content filtering based on both rider and driver preferences</li>
                  <li>Automatically selects compatible content when a ride is matched</li>
                  <li>Provides a seamless audio experience during the ride</li>
                </ul>
                
                <div className="rounded-lg bg-green-50 p-4 border border-green-200 mt-4">
                  <h4 className="font-medium text-green-800">Key Advantages:</h4>
                  <ul className="list-disc pl-5 space-y-1 mt-2 text-green-700">
                    <li>No subscription costs or API keys required</li>
                    <li>Content filtering ensures comfortable experience for all parties</li>
                    <li>Seamless integration with the ride-hailing experience</li>
                    <li>Potential for artist feature placement and custom radio stations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
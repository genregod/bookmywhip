import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { Car, Navigation, MapPin, User, Users } from 'lucide-react';
import { Icon } from 'leaflet';
import { WazeEmbeddedNavigation } from '@/components/maps/WazeEmbeddedNavigation';
import { 
  calculateDistance, 
  formatDistance, 
  estimateDuration, 
  estimateFare,
  findNearbyPoints,
  getBoundingBox
} from '@/lib/mapUtils';

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
  className: 'driver-marker' // Add custom CSS styling
});

const riderIcon = new Icon({
  iconUrl: markerIcon, // Replace with custom rider icon
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'rider-marker' // Add custom CSS styling
});

// Sample data for demonstration
const mockDrivers = [
  { id: 1, name: 'John D.', latitude: 40.7580, longitude: -73.9855, rating: 4.8, vehicle: 'Toyota Camry', vehicleType: 'economy' },
  { id: 2, name: 'Emily S.', latitude: 40.7490, longitude: -73.9950, rating: 4.9, vehicle: 'Tesla Model 3', vehicleType: 'premium' },
  { id: 3, name: 'Michael K.', latitude: 40.7620, longitude: -73.9800, rating: 4.7, vehicle: 'Honda Civic', vehicleType: 'economy' },
  { id: 4, name: 'Jessica T.', latitude: 40.7530, longitude: -74.0010, rating: 4.6, vehicle: 'BMW X5', vehicleType: 'premium' },
  { id: 5, name: 'David L.', latitude: 40.7700, longitude: -73.9820, rating: 4.9, vehicle: 'Ford Fusion', vehicleType: 'economy' },
];

// Map view component to dynamically update map view
function MapViewUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  
  return null;
}

export default function NavigationDemo() {
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7580, -73.9855]); // Default to NYC
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(1.5); // km
  const [vehicleType, setVehicleType] = useState<'economy' | 'premium'>('economy');
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  
  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location Error',
            description: 'Could not get your location. Using default coordinates.',
            variant: 'destructive',
          });
        }
      );
    }
  }, [toast]);
  
  // Find nearby drivers when user location changes or search parameters change
  useEffect(() => {
    if (userLocation) {
      // Using our utility functions to find nearby drivers
      const driversWithDistance = findNearbyPoints(
        userLocation[0],
        userLocation[1],
        mockDrivers.filter(d => d.vehicleType === vehicleType),
        searchRadius
      );
      
      setNearbyDrivers(driversWithDistance);
    }
  }, [userLocation, searchRadius, vehicleType]);
  
  // Handle destination click on map
  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    setDestination([lat, lng]);
    
    toast({
      title: 'Destination Selected',
      description: `Destination set at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };
  
  // Request a ride with the selected driver
  const requestRide = (driver: any) => {
    if (!destination) {
      toast({
        title: 'No Destination',
        description: 'Please select a destination on the map first.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedDriver(driver);
    
    toast({
      title: 'Ride Requested',
      description: `Your ride with ${driver.name} is confirmed!`,
    });
  };
  
  // Start navigation
  const startNavigation = () => {
    if (!destination || !selectedDriver) {
      toast({
        title: 'Cannot Start Navigation',
        description: 'Please select a destination and driver first.',
        variant: 'destructive',
      });
      return;
    }
    
    setShowNavigation(true);
  };
  
  // Calculate estimated fare
  const estimateTrip = (driver: any) => {
    if (!destination) return null;
    
    const distance = calculateDistance(
      userLocation[0],
      userLocation[1],
      destination[0],
      destination[1]
    );
    
    const duration = estimateDuration(distance);
    const fare = estimateFare(
      distance,
      duration,
      driver.vehicleType === 'premium' ? 5.0 : 2.5,
      driver.vehicleType === 'premium' ? 2.0 : 1.25,
      driver.vehicleType === 'premium' ? 0.5 : 0.35
    );
    
    return {
      distance,
      duration,
      fare
    };
  };
  
  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Navigation & Proximity Demo</h1>
          <div className="flex items-center space-x-2">
            <Label>Search Radius:</Label>
            <Input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="ml-1">km</span>
            
            <Label className="ml-4">Vehicle Type:</Label>
            <select 
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as 'economy' | 'premium')}
              className="p-2 border rounded"
            >
              <option value="economy">Economy</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] relative">
                  <MapContainer
                    center={userLocation}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    onClick={handleMapClick}
                  >
                    <MapViewUpdater center={userLocation} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User marker */}
                    <Marker position={userLocation} icon={defaultIcon}>
                      <Popup>
                        <div>
                          <h3 className="font-medium">Your Location</h3>
                          <p className="text-sm">{userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}</p>
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Destination marker */}
                    {destination && (
                      <Marker position={destination} icon={riderIcon}>
                        <Popup>
                          <div>
                            <h3 className="font-medium">Your Destination</h3>
                            <p className="text-sm">{destination[0].toFixed(6)}, {destination[1].toFixed(6)}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Driver markers */}
                    {nearbyDrivers.map((driver) => (
                      <Marker 
                        key={driver.id} 
                        position={[driver.latitude, driver.longitude]} 
                        icon={driverIcon}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-medium">{driver.name}</h3>
                            <p className="text-sm">{driver.vehicle} ({driver.vehicleType})</p>
                            <p className="text-sm">⭐ {driver.rating} • {formatDistance(driver.distance)} away</p>
                            <Button 
                              onClick={() => requestRide(driver)} 
                              className="mt-2 w-full"
                              size="sm"
                            >
                              Request Ride
                            </Button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Driver list & navigation section */}
          <div>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Nearby Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nearbyDrivers.length > 0 ? (
                    nearbyDrivers.map((driver) => {
                      const estimate = estimateTrip(driver);
                      return (
                        <div 
                          key={driver.id} 
                          className={`p-3 rounded-lg border ${selectedDriver?.id === driver.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-6 w-6" />
                              </div>
                              <div className="ml-3">
                                <h3 className="font-medium">{driver.name}</h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Car className="h-3 w-3 mr-1" />
                                  <span>{driver.vehicle}</span>
                                  <span className="mx-1">•</span>
                                  <span>⭐ {driver.rating}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatDistance(driver.distance)}</div>
                              {estimate && (
                                <div className="text-sm text-muted-foreground">${estimate.fare.toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                          
                          {estimate && (
                            <div className="mt-2 text-sm text-muted-foreground grid grid-cols-2 gap-2">
                              <div>Distance: {formatDistance(estimate.distance)}</div>
                              <div>Time: ~{estimate.duration} mins</div>
                            </div>
                          )}
                          
                          <div className="mt-3">
                            <Button 
                              onClick={() => requestRide(driver)} 
                              variant={selectedDriver?.id === driver.id ? "secondary" : "outline"}
                              className="w-full"
                              size="sm"
                            >
                              {selectedDriver?.id === driver.id ? 'Selected' : 'Request Ride'}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No drivers found within {searchRadius}km.</p>
                      <p className="text-sm">Try increasing the search radius or changing vehicle type.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {selectedDriver && destination && (
              <Card>
                <CardHeader>
                  <CardTitle>Navigation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg border border-primary bg-primary/5">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Navigation className="h-6 w-6 text-primary" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium">Ready for Navigation</h3>
                          <p className="text-sm text-muted-foreground">
                            Driver: {selectedDriver.name}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-3" 
                        onClick={startNavigation}
                      >
                        Start Navigation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Navigation component */}
            {showNavigation && destination && (
              <WazeEmbeddedNavigation
                route={{
                  startLatitude: userLocation[0],
                  startLongitude: userLocation[1],
                  endLatitude: destination[0],
                  endLongitude: destination[1],
                  distance: calculateDistance(
                    userLocation[0],
                    userLocation[1],
                    destination[0],
                    destination[1]
                  )
                }}
                showAsModal={true}
                onClose={() => setShowNavigation(false)}
                onRideStart={() => {
                  toast({
                    title: 'Ride Started',
                    description: 'Your ride has begun. Safe travels!',
                  });
                }}
                onArrived={() => {
                  toast({
                    title: 'Destination Reached',
                    description: 'You have arrived at your destination.',
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
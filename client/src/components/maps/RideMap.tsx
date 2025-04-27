import { useState, useEffect } from 'react';
import MapDisplay from './MapDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { navigateWithWaze } from '@/lib/wazeIntegration';
import { MapPin, Navigation, Car } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface Driver {
  id: number;
  name: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  vehicleDetails?: string;
}

interface RideMapProps {
  pickup: Location;
  dropoff: Location;
  driver?: Driver;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  estimatedArrival?: string;
  userLocation?: [number, number];
}

export default function RideMap({
  pickup,
  dropoff,
  driver,
  status,
  estimatedArrival,
  userLocation
}: RideMapProps) {
  // Calculate center point between pickup and dropoff for initial map view
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    (pickup.latitude + dropoff.latitude) / 2,
    (pickup.longitude + dropoff.longitude) / 2
  ]);
  
  // Calculate appropriate zoom level based on distance
  const [zoom, setZoom] = useState<number>(12);
  
  // Set up markers array for the map
  const [markers, setMarkers] = useState<any[]>([]);
  
  // Update markers and map center based on props
  useEffect(() => {
    const newMarkers = [
      // Pickup marker
      {
        position: [pickup.latitude, pickup.longitude] as [number, number],
        title: 'Pickup Location',
        type: 'pickup',
        popupContent: (
          <div>
            <p className="text-sm text-gray-600">{pickup.address}</p>
            <Button 
              onClick={() => navigateWithWaze(pickup.latitude, pickup.longitude, pickup.address)}
              className="mt-2 w-full bg-blue-500 hover:bg-blue-600"
              size="sm"
            >
              Navigate to Pickup
            </Button>
          </div>
        )
      },
      // Dropoff marker
      {
        position: [dropoff.latitude, dropoff.longitude] as [number, number],
        title: 'Dropoff Location',
        type: 'dropoff',
        popupContent: (
          <div>
            <p className="text-sm text-gray-600">{dropoff.address}</p>
            <Button 
              onClick={() => navigateWithWaze(dropoff.latitude, dropoff.longitude, dropoff.address)}
              className="mt-2 w-full bg-blue-500 hover:bg-blue-600"
              size="sm"
            >
              Navigate to Destination
            </Button>
          </div>
        )
      }
    ];
    
    // Add driver marker if driver is assigned and location is available
    if (driver && driver.location) {
      newMarkers.push({
        position: [driver.location.latitude, driver.location.longitude] as [number, number],
        title: `Driver: ${driver.name}`,
        type: 'driver',
        popupContent: (
          <div>
            <p className="text-sm text-gray-600">{driver.vehicleDetails}</p>
            {status === 'accepted' && (
              <Badge className="mb-2 bg-blue-500">
                {estimatedArrival ? `Arriving in ${estimatedArrival}` : 'On the way'}
              </Badge>
            )}
          </div>
        )
      });
      
      // If driver is assigned and in progress, center map on driver
      if (status === 'in_progress' && driver.location) {
        setMapCenter([driver.location.latitude, driver.location.longitude]);
      }
    }
    
    setMarkers(newMarkers);
  }, [pickup, dropoff, driver, status, estimatedArrival]);
  
  // Get status display info
  const getStatusInfo = () => {
    switch (status) {
      case 'requested':
        return {
          title: 'Finding a driver...',
          description: 'We\'re connecting you with a nearby driver',
          color: 'bg-amber-500'
        };
      case 'accepted':
        return {
          title: 'Driver on the way',
          description: estimatedArrival ? `Arriving in ${estimatedArrival}` : 'Your driver is heading to pickup',
          color: 'bg-blue-500'
        };
      case 'in_progress':
        return {
          title: 'On the move',
          description: 'You\'re on your way to the destination',
          color: 'bg-green-500'
        };
      case 'completed':
        return {
          title: 'Ride Completed',
          description: 'You\'ve arrived at your destination',
          color: 'bg-green-600'
        };
      case 'cancelled':
        return {
          title: 'Ride Cancelled',
          description: 'This ride has been cancelled',
          color: 'bg-red-500'
        };
      default:
        return {
          title: 'Booking a ride',
          description: 'Setting up your ride details',
          color: 'bg-gray-500'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <Card className="mb-6">
      <CardHeader className={`${statusInfo.color} text-white`}>
        <CardTitle className="flex items-center text-xl">
          {status === 'in_progress' ? <Car className="mr-2" /> : <MapPin className="mr-2" />}
          {statusInfo.title}
        </CardTitle>
        <CardDescription className="text-white text-opacity-90">
          {statusInfo.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Map display */}
        <MapDisplay 
          center={mapCenter}
          zoom={zoom}
          height="300px"
          markers={markers}
          routePoints={{
            start: [pickup.latitude, pickup.longitude],
            end: [dropoff.latitude, dropoff.longitude],
            startTitle: pickup.address,
            endTitle: dropoff.address
          }}
          userLocation={userLocation}
        />
        
        {/* Navigation buttons */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <Button 
            onClick={() => navigateWithWaze(pickup.latitude, pickup.longitude, pickup.address)}
            variant="outline"
            className="flex items-center justify-center"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Navigate to Pickup
          </Button>
          
          <Button 
            onClick={() => navigateWithWaze(dropoff.latitude, dropoff.longitude, dropoff.address)}
            variant="outline"
            className="flex items-center justify-center"
          >
            <Navigation className="mr-2 h-4 w-4" />
            Navigate to Dropoff
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/use-location';
import { useRides } from '@/hooks/use-rides';
import RideTypeSelector from './RideTypeSelector';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { formatAddress } from '@/lib/mapUtils';
import { VEHICLE_TYPES } from '@/lib/constants';

interface RideBookingPanelProps {
  onBookRide: () => void;
  showModal: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

export default function RideBookingPanel({ 
  onBookRide, 
  showModal, 
  setIsLoading 
}: RideBookingPanelProps) {
  const { toast } = useToast();
  const { currentLocation, savedLocations } = useLocation();
  const { createRide, calculateFare } = useRides();
  
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<'economy' | 'premium'>(VEHICLE_TYPES.ECONOMY);
  const [fareEstimate, setFareEstimate] = useState<{
    fare: number;
    distance: number;
    duration: number;
  } | null>(null);

  // Set pickup location to current location on mount
  useEffect(() => {
    if (currentLocation) {
      setPickupCoords({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      });
      setPickupLocation('Current Location');
    }
  }, [currentLocation]);

  // Update fare estimate when both locations and vehicle type are set
  useEffect(() => {
    if (pickupCoords && destCoords) {
      const estimate = calculateFare(
        pickupCoords.lat,
        pickupCoords.lng,
        destCoords.lat,
        destCoords.lng,
        selectedVehicleType
      );
      setFareEstimate(estimate);
    }
  }, [pickupCoords, destCoords, selectedVehicleType, calculateFare]);

  // Handle booking a ride
  const handleBookRide = async () => {
    if (!pickupCoords || !destCoords) {
      toast({
        title: 'Missing location',
        description: 'Please select both pickup and destination',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      await createRide({
        pickupAddress: pickupLocation,
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lng,
        destinationAddress: destination,
        destinationLatitude: destCoords.lat,
        destinationLongitude: destCoords.lng,
        vehicleType: selectedVehicleType
      });
      
      setIsLoading(false);
      showModal(true);
      onBookRide();
    } catch (error) {
      setIsLoading(false);
      toast({
        title: 'Error booking ride',
        description: 'Unable to book your ride. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Set location from saved places
  const useSavedLocation = (location: any, isPickup: boolean) => {
    if (isPickup) {
      setPickupLocation(location.address);
      setPickupCoords({
        lat: location.latitude,
        lng: location.longitude
      });
    } else {
      setDestination(location.address);
      setDestCoords({
        lat: location.latitude,
        lng: location.longitude
      });
    }
  };

  // For demo purposes, set a default destination when input is focused
  const handleDestinationFocus = () => {
    if (!destination && !destCoords && currentLocation) {
      setDestination('Downtown Mall');
      setDestCoords({
        lat: currentLocation.latitude + 0.01,
        lng: currentLocation.longitude + 0.01
      });
    }
  };

  return (
    <div className="p-4 md:p-6 md:h-full md:overflow-y-auto">
      <h2 className="text-xl font-heading font-bold mb-4">Book a Ride</h2>
      
      {/* Location Form */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 flex justify-center">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
          </div>
          <div className="flex-grow">
            <Input
              placeholder="Current location"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 flex justify-center">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-grow">
            <Input
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onFocus={handleDestinationFocus}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* Saved Locations */}
      {savedLocations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Saved Places</h3>
          <div className="space-y-2">
            {savedLocations.map((location) => (
              <button 
                key={location.id} 
                className="w-full flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => useSavedLocation(location, false)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    {location.type === 'home' ? (
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    ) : location.type === 'work' ? (
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    )}
                  </svg>
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium">{location.name || 'Saved Location'}</p>
                  <p className="text-xs text-gray-500">{formatAddress(location.address)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Ride Types */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Select Ride Type</h3>
        <RideTypeSelector
          selectedType={selectedVehicleType}
          onChange={setSelectedVehicleType}
          fareEstimate={fareEstimate}
        />
      </div>
      
      {/* Payment Method */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h3>
        <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4H4ZM20 14H4V18H20V14ZM20 8H4V12H20V8Z" />
              </svg>
            </div>
            <span className="ml-3 text-sm font-medium">Visa ending in 4242</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Fare Estimate Card (only show if we have both locations) */}
      {fareEstimate && (
        <Card className="mb-6 bg-gray-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium">Estimated fare</p>
                <p className="text-xl font-bold">${fareEstimate.fare.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Estimated arrival</p>
                <p className="text-xl font-bold">{Math.ceil(fareEstimate.duration)} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Booking Button */}
      <Button 
        onClick={handleBookRide}
        className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
        disabled={!pickupCoords || !destCoords}
      >
        Book Now
      </Button>
    </div>
  );
}

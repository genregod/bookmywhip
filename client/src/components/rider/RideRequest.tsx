import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LocationSearch } from '@/components/maps/LocationSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AzureMapView from '@/components/maps/AzureMapView';
import { useToast } from '@/hooks/use-toast';
import { VEHICLE_TYPES, BASE_FARE, PER_MILE_RATE, PER_MINUTE_RATE } from '@/lib/constants';
import { 
  formatDistance, 
  formatDuration, 
  calculateFare,
  calculateDistance,
  estimateDuration
} from '@/lib/mapUtils';

// Define ride request form schema
const rideRequestSchema = z.object({
  pickupLocation: z.object({
    name: z.string().min(1, 'Pickup location is required'),
    lat: z.number(),
    lng: z.number(),
  }),
  destinationLocation: z.object({
    name: z.string().min(1, 'Destination is required'),
    lat: z.number(),
    lng: z.number(),
  }),
  vehicleType: z.enum(['economy', 'premium']),
});

type RideRequestFormValues = z.infer<typeof rideRequestSchema>;

interface RideEstimate {
  distance: number; // in miles
  duration: number; // in minutes
  fare: number; // in dollars
}

export default function RideRequest() {
  const { toast } = useToast();
  const [step, setStep] = useState<'location' | 'vehicle' | 'confirm'>('location');
  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Initialize form
  const form = useForm<RideRequestFormValues>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      vehicleType: 'economy',
    },
  });

  const pickupLocation = form.watch('pickupLocation');
  const destinationLocation = form.watch('destinationLocation');
  const vehicleType = form.watch('vehicleType');

  // Compute a ride estimate whenever locations change
  const computeEstimate = () => {
    if (!pickupLocation || !destinationLocation) return;
    
    // Calculate the distance and duration based on real coordinates
    const distance = calculateDistance(
      pickupLocation.lat,
      pickupLocation.lng,
      destinationLocation.lat,
      destinationLocation.lng
    );
    const duration = estimateDuration(distance);
    
    // Calculate the fare
    const fare = calculateFare(distance, duration, vehicleType);
    
    setEstimate({ distance, duration, fare });
  };

  // Handle form submission
  const onSubmit = async (data: RideRequestFormValues) => {
    setIsRequesting(true);
    
    try {
      // In a real app, we would call the backend to create a ride
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Ride requested!",
        description: "Looking for a driver near you...",
      });
      
      // Reset form and state
      form.reset();
      setEstimate(null);
      setStep('location');
    } catch (error) {
      toast({
        title: "Failed to request ride",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  // Prepare map markers
  const getMapMarkers = () => {
    const markers = [];
    
    if (pickupLocation) {
      markers.push({
        lat: pickupLocation.lat,
        lng: pickupLocation.lng,
        type: 'pickup' as const,
        label: 'Pickup'
      });
    }
    
    if (destinationLocation) {
      markers.push({
        lat: destinationLocation.lat,
        lng: destinationLocation.lng,
        type: 'destination' as const,
        label: 'Destination'
      });
    }
    
    return markers;
  };

  // Get map path for visualization
  const getMapPath = () => {
    if (!pickupLocation || !destinationLocation) return undefined;
    
    return {
      points: [
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: destinationLocation.lat, lng: destinationLocation.lng }
      ],
      color: '#4ade80' // Green color for the route
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Request a Ride</CardTitle>
        <CardDescription>
          Enter your pickup and destination locations to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={step} onValueChange={(value) => setStep(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="location">Locations</TabsTrigger>
                <TabsTrigger 
                  value="vehicle" 
                  disabled={!pickupLocation || !destinationLocation}
                >
                  Vehicle
                </TabsTrigger>
                <TabsTrigger 
                  value="confirm" 
                  disabled={!pickupLocation || !destinationLocation || !vehicleType}
                >
                  Confirm
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="location" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location</FormLabel>
                      <FormControl>
                        <LocationSearch
                          placeholder="Enter pickup location"
                          defaultValue={field.value?.name || ''}
                          onLocationSelect={(location) => {
                            field.onChange(location);
                            computeEstimate();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destinationLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <LocationSearch
                          placeholder="Enter destination"
                          defaultValue={field.value?.name || ''}
                          onLocationSelect={(location) => {
                            field.onChange(location);
                            computeEstimate();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="h-48 mt-4 rounded-md overflow-hidden">
                  <AzureMapView 
                    markers={getMapMarkers()}
                    path={getMapPath()}
                    className="h-full w-full"
                  />
                </div>
                
                <Button 
                  type="button" 
                  className="w-full"
                  disabled={!pickupLocation || !destinationLocation}
                  onClick={() => setStep('vehicle')}
                >
                  Continue
                </Button>
              </TabsContent>
              
              <TabsContent value="vehicle" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Select Vehicle Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-3"
                        >
                          {VEHICLE_TYPES.map((type) => (
                            <div
                              key={type.value}
                              className={`flex items-center justify-between rounded-lg border p-4 ${
                                field.value === type.value
                                  ? 'border-primary bg-primary/5'
                                  : 'border-input'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value={type.value} id={type.value} />
                                <div className="space-y-0.5">
                                  <label
                                    htmlFor={type.value}
                                    className="text-base font-medium"
                                  >
                                    {type.icon} {type.label}
                                  </label>
                                  <p className="text-sm text-muted-foreground">
                                    {type.description}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  Base: ${BASE_FARE[type.value as keyof typeof BASE_FARE].toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ${PER_MILE_RATE[type.value as keyof typeof PER_MILE_RATE].toFixed(2)}/mile
                                </p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setStep('location')}
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1"
                    onClick={() => {
                      computeEstimate();
                      setStep('confirm');
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="confirm" className="space-y-4 pt-4">
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <div className="w-0.5 h-10 bg-gray-300"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-grow">
                      <div className="mb-4">
                        <p className="text-sm font-medium">{pickupLocation?.name}</p>
                        <p className="text-xs text-muted-foreground">Pickup location</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{destinationLocation?.name}</p>
                        <p className="text-xs text-muted-foreground">Destination</p>
                      </div>
                    </div>
                  </div>
                  
                  {estimate && (
                    <div className="grid grid-cols-3 gap-2 bg-muted/50 p-3 rounded-md">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Distance</p>
                        <p className="text-sm font-semibold">{formatDistance(estimate.distance)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Duration</p>
                        <p className="text-sm font-semibold">{formatDuration(estimate.duration)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Estimated fare</p>
                        <p className="text-sm font-semibold">${estimate.fare.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center space-x-2">
                      {vehicleType === 'economy' ? (
                        <span className="text-lg">🚗</span>
                      ) : (
                        <span className="text-lg">🏎️</span>
                      )}
                      <span className="font-medium capitalize">{vehicleType}</span>
                    </div>
                    <div className="text-sm">
                      {VEHICLE_TYPES.find(t => t.value === vehicleType)?.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setStep('vehicle')}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isRequesting}
                  >
                    {isRequesting ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Requesting...
                      </>
                    ) : (
                      'Request Ride'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
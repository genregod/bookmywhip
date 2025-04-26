import { useState } from 'react';
import { RideProgressIndicator } from '@/components/rider/RideProgressIndicator';
import { RideTracker } from '@/components/rider/RideTracker';
import { DemoStatusModal } from '@/components/rider/DemoStatusModal';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function DemoPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRideStatus, setCurrentRideStatus] = useState<'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'>('requested');
  
  // Sample ride data for demonstration
  const sampleRide = {
    id: 1,
    riderId: 101,
    driverId: 201,
    vehicleId: 301,
    pickupAddress: '123 Main St',
    pickupLatitude: 37.7749,
    pickupLongitude: -122.4194,
    destinationAddress: '456 Market St',
    destinationLatitude: 37.7920,
    destinationLongitude: -122.4100,
    status: currentRideStatus,
    vehicleType: 'premium' as const,
    baseFare: 10.00,
    perMileRate: 2.50,
    perMinuteRate: 0.35,
    estimatedDistance: 2.5,
    estimatedDuration: 12,
    estimatedFare: 25.75,
    createdAt: new Date().toISOString(),
  };
  
  // Cycle through ride statuses
  const cycleRideStatus = () => {
    const statuses: any[] = ['requested', 'accepted', 'in_progress', 'completed'];
    const currentIndex = statuses.indexOf(currentRideStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    setCurrentRideStatus(statuses[nextIndex]);
    
    toast({
      title: "Ride Status Updated",
      description: `Status changed to: ${statuses[nextIndex]}`
    });
  };
  
  // Cancel the ride
  const cancelRide = () => {
    setCurrentRideStatus('cancelled');
    toast({
      title: "Ride Cancelled",
      description: "The ride has been cancelled successfully."
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 px-4 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">BookMyWhip UI Components Demo</h1>
          <p className="text-muted-foreground mt-2">
            This page demonstrates the animated ride status components for BookMyWhip.
          </p>
        </div>
        
        <Tabs defaultValue="progress">
          <TabsList className="mb-4">
            <TabsTrigger value="progress">Progress Indicators</TabsTrigger>
            <TabsTrigger value="trackers">Ride Trackers</TabsTrigger>
            <TabsTrigger value="modal">Status Modal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Horizontal Progress Indicators</CardTitle>
                <CardDescription>
                  Shows the current status of a ride with horizontally arranged steps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-sm font-medium mb-2">Requested Status</h3>
                  <RideProgressIndicator currentStatus="requested" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Accepted Status</h3>
                  <RideProgressIndicator currentStatus="accepted" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">In Progress Status</h3>
                  <RideProgressIndicator 
                    currentStatus="in_progress"
                    estimatedArrival="Arriving in 10 minutes"
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Completed Status</h3>
                  <RideProgressIndicator currentStatus="completed" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Cancelled Status</h3>
                  <RideProgressIndicator currentStatus="cancelled" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Vertical Progress Indicators</CardTitle>
                <CardDescription>
                  Shows the current status of a ride with vertically arranged steps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Requested Status</h3>
                    <RideProgressIndicator currentStatus="requested" vertical />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Accepted Status</h3>
                    <RideProgressIndicator currentStatus="accepted" vertical />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">In Progress Status</h3>
                    <RideProgressIndicator 
                      currentStatus="in_progress"
                      estimatedArrival="Arriving in 10 minutes"
                      vertical
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Completed Status</h3>
                    <RideProgressIndicator currentStatus="completed" vertical />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trackers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Ride Tracker</CardTitle>
                <CardDescription>
                  A comprehensive card that shows ride details and allows the user to interact with the current ride.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-x-3">
                  <Button onClick={cycleRideStatus}>
                    Cycle Status
                  </Button>
                  
                  {currentRideStatus !== 'cancelled' && (
                    <Button variant="destructive" onClick={cancelRide}>
                      Cancel Ride
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={() => setCurrentRideStatus('requested')}>
                    Reset Status
                  </Button>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Current Status: <span className="font-medium capitalize">{currentRideStatus}</span>
                  </p>
                </div>
                
                <RideTracker 
                  ride={{...sampleRide, status: currentRideStatus}}
                  driverLocation={currentRideStatus !== 'requested' ? { latitude: 37.7800, longitude: -122.4150 } : null}
                  onCancel={cancelRide}
                  onViewDetails={() => toast({ title: "View Details clicked" })}
                  expanded={true}
                  className="max-w-3xl mx-auto"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="modal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ride Status Modal</CardTitle>
                <CardDescription>
                  A modal dialog that shows detailed ride information including a map, progress indicator and driver details.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="mb-4 space-x-3">
                  <Button onClick={cycleRideStatus}>
                    Cycle Status
                  </Button>
                  
                  {currentRideStatus !== 'cancelled' && (
                    <Button variant="destructive" onClick={cancelRide}>
                      Cancel Ride
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={() => setCurrentRideStatus('requested')}>
                    Reset Status
                  </Button>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Current Status: <span className="font-medium capitalize">{currentRideStatus}</span>
                  </p>
                </div>
                
                <Button 
                  size="lg" 
                  onClick={() => setModalOpen(true)}
                  className="mb-8"
                >
                  Open Status Modal
                </Button>
                
                <DemoStatusModal 
                  open={modalOpen} 
                  onOpenChange={setModalOpen}
                  status={currentRideStatus}
                  onCancel={cancelRide}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
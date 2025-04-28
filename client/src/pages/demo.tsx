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
import { Link } from 'wouter';

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
        
        {/* Links to Demo Pages */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/route-preview-demo">
              Go to Route Preview Demo
            </Link>
          </Button>
          
          <Button variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800" asChild>
            <Link href="/route-animation-test">
              Animation Test Page
            </Link>
          </Button>
          
          <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800" asChild>
            <Link href="/azure-maps-demo">
              Azure Maps Demo
            </Link>
          </Button>
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
                
                <div className="max-w-3xl mx-auto border border-gray-200 rounded-md p-4 shadow-sm">
                  <div className="mb-3 flex justify-between">
                    <div>
                      <h3 className="font-medium">Ride from {sampleRide.pickupAddress} to {sampleRide.destinationAddress}</h3>
                      <p className="text-sm text-gray-500">2.5 miles • 12 minutes</p>
                    </div>
                    <div>
                      <span className={`
                        px-2 py-1 text-xs rounded-full font-medium
                        ${currentRideStatus === 'requested' ? 'bg-amber-100 text-amber-700' : 
                         currentRideStatus === 'accepted' ? 'bg-blue-100 text-blue-700' :
                         currentRideStatus === 'in_progress' ? 'bg-indigo-100 text-indigo-700' : 
                         currentRideStatus === 'completed' ? 'bg-green-100 text-green-700' : 
                         'bg-red-100 text-red-700'}
                      `}>
                        {currentRideStatus === 'requested' ? 'Requested' :
                         currentRideStatus === 'accepted' ? 'Driver Coming' :
                         currentRideStatus === 'in_progress' ? 'In Progress' :
                         currentRideStatus === 'completed' ? 'Completed' : 'Cancelled'}
                      </span>
                    </div>
                  </div>
                  
                  <RideProgressIndicator 
                    currentStatus={currentRideStatus}
                    estimatedArrival={currentRideStatus === 'in_progress' ? 'Arriving in 10 min' : undefined}
                    className="mb-4"
                  />
                  
                  <div className="bg-gray-100 h-40 rounded-md flex items-center justify-center mb-4">
                    <p className="text-gray-500">Map view placeholder</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => toast({ title: "View Details clicked" })}>
                      View Details
                    </Button>
                    
                    {currentRideStatus === 'requested' && (
                      <Button variant="destructive" onClick={cancelRide}>
                        Cancel Ride
                      </Button>
                    )}
                  </div>
                </div>
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
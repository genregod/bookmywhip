import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/use-auth';
import { useRides, Ride } from '@/hooks/use-rides';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import RideStatusModal from '@/components/rider/RideStatusModal';

export default function Rides() {
  const { user } = useAuth();
  const { rides, activeRide, isLoading, rateRide } = useRides();
  const { toast } = useToast();
  const [showRideModal, setShowRideModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Filter rides based on active tab
  useEffect(() => {
    if (!rides) return;

    if (activeTab === 'all') {
      setFilteredRides(rides);
    } else if (activeTab === 'active') {
      setFilteredRides(rides.filter(ride => 
        ride.status === 'requested' || 
        ride.status === 'accepted' || 
        ride.status === 'in_progress'
      ));
    } else if (activeTab === 'completed') {
      setFilteredRides(rides.filter(ride => ride.status === 'completed'));
    } else if (activeTab === 'cancelled') {
      setFilteredRides(rides.filter(ride => ride.status === 'cancelled'));
    }
  }, [rides, activeTab]);

  // Automatically show ride status modal if there's an active ride and coming back to this page
  useEffect(() => {
    if (activeRide) {
      setSelectedRide(activeRide);
    }
  }, [activeRide]);

  // Handle viewing ride details
  const handleViewRide = (ride: Ride) => {
    setSelectedRide(ride);
    setShowRideModal(true);
  };

  // Get status badge for a ride
  const getRideStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Requested</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Accepted</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingIndicator message="Loading rides..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900">Your Rides</h1>
          <p className="text-gray-600">View and manage your ride history</p>
        </div>

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {filteredRides.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500">No rides found</p>
                </CardContent>
              </Card>
            ) : (
              filteredRides.map((ride) => (
                <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  onView={handleViewRide} 
                  formatDate={formatDate}
                  getRideStatusBadge={getRideStatusBadge}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4">
            {filteredRides.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500">No active rides</p>
                </CardContent>
              </Card>
            ) : (
              filteredRides.map((ride) => (
                <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  onView={handleViewRide} 
                  formatDate={formatDate}
                  getRideStatusBadge={getRideStatusBadge}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {filteredRides.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500">No completed rides</p>
                </CardContent>
              </Card>
            ) : (
              filteredRides.map((ride) => (
                <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  onView={handleViewRide} 
                  formatDate={formatDate}
                  getRideStatusBadge={getRideStatusBadge}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="cancelled" className="space-y-4">
            {filteredRides.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500">No cancelled rides</p>
                </CardContent>
              </Card>
            ) : (
              filteredRides.map((ride) => (
                <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  onView={handleViewRide} 
                  formatDate={formatDate}
                  getRideStatusBadge={getRideStatusBadge}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
        
        {/* Ride Status Modal */}
        {selectedRide && (
          <RideStatusModal 
            isOpen={showRideModal} 
            onClose={() => setShowRideModal(false)} 
          />
        )}
      </div>
    </MainLayout>
  );
}

// Ride Card Component
interface RideCardProps {
  ride: Ride;
  onView: (ride: Ride) => void;
  formatDate: (date: string) => string;
  getRideStatusBadge: (status: string) => JSX.Element;
}

function RideCard({ ride, onView, formatDate, getRideStatusBadge }: RideCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4a1 1 0 00.2-.6V8a1 1 0 00-1-1h-3.9L11.1 3.6a1 1 0 00-.8-.4H4a1 1 0 00-1 1v.2" />
                </svg>
              </div>
              <div>
                <div className="flex items-center mb-1">
                  <p className="text-sm font-medium mr-2">
                    {ride.pickupAddress} → {ride.destinationAddress}
                  </p>
                  {getRideStatusBadge(ride.status)}
                </div>
                <p className="text-xs text-gray-500">{formatDate(ride.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 ml-13">
              <div className="mr-4">
                <span className="font-medium">${ride.estimatedFare.toFixed(2)}</span>
                <span className="text-xs ml-1">
                  {ride.vehicleType === 'premium' ? 'Premium' : 'Economy'}
                </span>
              </div>
              
              {ride.status === 'completed' && ride.riderRating && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{ride.riderRating}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2 md:mt-0"
            onClick={() => onView(ride)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

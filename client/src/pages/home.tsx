import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import MapView from '@/components/maps/MapView';
import RideBookingPanel from '@/components/rider/RideBookingPanel';
import RideStatusModal from '@/components/rider/RideStatusModal';
import DriverDashboard from '@/components/driver/DriverDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAuth } from '@/hooks/use-auth';
import { useRides } from '@/hooks/use-rides';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import { useLocation } from '@/hooks/use-location';

export default function Home() {
  const { user } = useAuth();
  const { isLoading: ridesLoading, activeRide } = useRides();
  const { currentLocation } = useLocation();
  const [showRideModal, setShowRideModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Safely handle activeRide
  const rideActive = Boolean(activeRide);

  // Automatically show ride status modal if there's an active ride
  useEffect(() => {
    if (rideActive && user?.role === 'rider') {
      setShowRideModal(true);
    }
  }, [rideActive, user]);

  // When a ride is booked, handle the UI state
  const handleBookRide = () => {
    setShowRideModal(true);
  };

  // Display loading state while ride data is loading
  if (ridesLoading) {
    return (
      <MainLayout>
        <LoadingIndicator message="Loading your BookMyWhip experience..." />
      </MainLayout>
    );
  }

  // Different dashboard based on user role
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'driver':
        return <DriverDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'rider':
      default:
        return (
          <div className="flex flex-col h-full">
            {/* Map Container */}
            <div className="bg-gray-200 flex-1 relative map-container">
              <MapView 
                markers={activeRide && activeRide.pickupLatitude ? [
                  { 
                    lat: activeRide.pickupLatitude, 
                    lng: activeRide.pickupLongitude, 
                    type: 'pickup',
                    label: 'Pickup'
                  },
                  { 
                    lat: activeRide.destinationLatitude, 
                    lng: activeRide.destinationLongitude, 
                    type: 'destination',
                    label: 'Destination'
                  }
                ] : []}
                showCurrentLocation={true}
              />
            </div>

            {/* Bottom Sheet (Mobile) / Side Panel (Desktop) */}
            <div className="bg-white md:absolute md:right-0 md:top-0 md:bottom-0 md:w-96 md:shadow-lg">
              <RideBookingPanel 
                onBookRide={handleBookRide}
                showModal={setShowRideModal}
                setIsLoading={setIsLoading}
              />
            </div>

            {/* Loading Indicator */}
            {isLoading && <LoadingIndicator />}

            {/* Ride Status Modal */}
            <RideStatusModal 
              isOpen={showRideModal} 
              onClose={() => setShowRideModal(false)} 
            />
          </div>
        );
    }
  };

  return (
    <MainLayout>
      {renderDashboard()}
    </MainLayout>
  );
}

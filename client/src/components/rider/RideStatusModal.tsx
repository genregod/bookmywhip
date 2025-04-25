import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRides, Ride } from '@/hooks/use-rides';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { formatDistance, formatDuration } from '@/lib/mapUtils';

interface RideStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RideStatusModal({ isOpen, onClose }: RideStatusModalProps) {
  const { toast } = useToast();
  const { activeRide, cancelRide, rateRide } = useRides();
  const { lastMessage } = useWebSocket();
  const [ride, setRide] = useState<Ride | null>(null);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [rating, setRating] = useState<number>(0);
  const [showRating, setShowRating] = useState<boolean>(false);

  // Set ride data and driver details
  useEffect(() => {
    if (activeRide) {
      setRide(activeRide);
      
      // In a real app, we'd fetch driver details if the ride is accepted
      if (activeRide.driverId) {
        setDriverDetails({
          name: 'Michael Chen',
          rating: 4.9,
          trips: 340,
          car: 'Silver Toyota Camry • ABC 123',
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
        });
      }
    }
  }, [activeRide]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'ride_accepted':
          setRide(lastMessage.ride);
          toast({
            title: 'Driver found!',
            description: 'Your ride has been accepted by a driver'
          });
          break;
        case 'ride_started':
          setRide(lastMessage.ride);
          toast({
            title: 'Ride started',
            description: 'Your ride has begun'
          });
          break;
        case 'ride_completed':
          setRide(lastMessage.ride);
          setShowRating(true);
          toast({
            title: 'Ride completed',
            description: 'Your ride has been completed'
          });
          break;
        case 'ride_cancelled':
          setRide(lastMessage.ride);
          toast({
            title: 'Ride cancelled',
            description: 'Your ride has been cancelled',
            variant: 'destructive'
          });
          break;
      }
    }
  }, [lastMessage, toast]);

  // Handle cancelling a ride
  const handleCancelRide = async () => {
    if (!ride) return;
    
    try {
      await cancelRide(ride.id);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel ride',
        variant: 'destructive'
      });
    }
  };

  // Handle submitting a rating
  const handleSubmitRating = async () => {
    if (!ride || !rating) return;
    
    try {
      await rateRide(ride.id, rating);
      toast({
        title: 'Rating submitted',
        description: 'Thank you for your feedback'
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive'
      });
    }
  };

  if (!isOpen || !ride) return null;

  // Determine what content to show based on ride status
  let content;
  
  if (showRating || ride.status === 'completed') {
    // Rating view
    content = (
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-heading font-bold mb-2">Ride Completed!</h2>
        <p className="text-gray-600 mb-6">Rate your experience with {driverDetails?.name}</p>
        
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className="focus:outline-none"
              onClick={() => setRating(star)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-8 w-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        
        <Button
          onClick={handleSubmitRating}
          className="w-full bg-primary text-white"
          disabled={!rating}
        >
          Submit Rating
        </Button>
      </div>
    );
  } else if (ride.status === 'cancelled') {
    // Cancelled view
    content = (
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-heading font-bold mb-2">Ride Cancelled</h2>
        <p className="text-gray-600">Your ride has been cancelled</p>
      </div>
    );
  } else if (ride.status === 'accepted' || ride.status === 'in_progress') {
    // Driver found / ride in progress view
    content = (
      <>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4a1 1 0 00.2-.6V8a1 1 0 00-1-1h-3.9L11.1 3.6a1 1 0 00-.8-.4H4a1 1 0 00-1 1v.2" />
            </svg>
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">
            {ride.status === 'in_progress' ? 'Ride in Progress!' : 'Driver Found!'}
          </h2>
          <p className="text-gray-600">
            {ride.status === 'in_progress' 
              ? 'You are on your way to your destination' 
              : 'Your ride will arrive in 3 minutes'}
          </p>
        </div>
        
        {driverDetails && (
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center">
              <img src={driverDetails.avatar} alt="Driver" className="w-16 h-16 rounded-full object-cover" />
              <div className="ml-4">
                <h3 className="font-medium">{driverDetails.name}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{driverDetails.rating}</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>{driverDetails.trips} trips</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{driverDetails.car}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  } else {
    // Requested / looking for driver view
    content = (
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-heading font-bold mb-2">Looking for Drivers...</h2>
        <p className="text-gray-600">Please wait while we find you a driver</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center md:items-center z-50">
      <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-md p-6 md:max-h-[90vh] md:overflow-y-auto animate-slide-up">
        {content}
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 w-8 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <div className="w-0.5 h-10 bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-grow ml-2">
              <div className="mb-4">
                <p className="text-sm font-medium">{ride.pickupAddress}</p>
                <p className="text-xs text-gray-500">Pickup location</p>
              </div>
              <div>
                <p className="text-sm font-medium">{ride.destinationAddress}</p>
                <p className="text-xs text-gray-500">Drop-off location</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Estimated fare</p>
              <p className="text-xl font-bold">${ride.estimatedFare.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Estimated arrival</p>
              <p className="text-xl font-bold">{formatDuration(ride.estimatedDuration)}</p>
            </div>
          </div>
        </div>
        
        {(ride.status === 'requested' || ride.status === 'accepted') && (
          <div className="flex space-x-3">
            {ride.status === 'accepted' && (
              <>
                <Button variant="outline" className="flex-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Call
                </Button>
                <Button variant="outline" className="flex-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Chat
                </Button>
              </>
            )}
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={handleCancelRide}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel
            </Button>
          </div>
        )}
        
        {(ride.status === 'completed' || ride.status === 'cancelled') && !showRating && (
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

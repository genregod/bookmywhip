import { useState, useEffect } from 'react';
import { Ride, useRides } from '@/hooks/use-rides';
import { RideMap } from '@/components/maps/RideMap';
import { LocationTracker } from '@/components/maps/LocationTracker';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RideProgressIndicator } from './RideProgressIndicator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PhoneIcon,
  MessageSquareIcon,
  ThumbsUpIcon,
  XCircleIcon,
  InfoIcon,
} from 'lucide-react';
import { formatDistance, formatDuration } from '@/lib/mapUtils';
import { WS_MESSAGE_TYPES } from '@/lib/constants';

interface RideStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RideStatusModal({ open, onOpenChange }: RideStatusModalProps) {
  const { activeRide, cancelRide, rateRide, isLoading } = useRides();
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  
  // Handle new driver location updates from WebSocket
  useEffect(() => {
    if (lastMessage?.type === WS_MESSAGE_TYPES.DRIVER_LOCATION_UPDATE && 
        activeRide?.driverId === lastMessage.userId) {
      setDriverLocation({
        latitude: lastMessage.latitude,
        longitude: lastMessage.longitude
      });
    }
  }, [lastMessage, activeRide]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowRating(false);
      setRating(5);
    }
  }, [open]);
  
  // Show rating UI when ride is completed
  useEffect(() => {
    if (activeRide?.status === 'completed' && !activeRide.riderRating) {
      setShowRating(true);
    }
  }, [activeRide]);
  
  const handleCancel = async () => {
    if (!activeRide) return;
    
    try {
      await cancelRide(activeRide.id);
      toast({
        title: 'Ride cancelled',
        description: 'Your ride has been cancelled successfully',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error cancelling ride',
        description: 'Failed to cancel your ride. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleRate = async () => {
    if (!activeRide) return;
    
    try {
      await rateRide(activeRide.id, rating);
      toast({
        title: 'Rating submitted',
        description: 'Thank you for your feedback!',
      });
      setShowRating(false);
    } catch (error) {
      toast({
        title: 'Error submitting rating',
        description: 'Failed to submit your rating. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // If no active ride, don't show the modal
  if (!activeRide) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {getStatusTitle(activeRide.status)}
          </DialogTitle>
          <DialogDescription>
            {getStatusDescription(activeRide)}
          </DialogDescription>
        </DialogHeader>
        
        {/* Animated progress indicator */}
        <div className="my-4">
          <RideProgressIndicator 
            currentStatus={activeRide.status as any}
            estimatedArrival={activeRide.status === 'in_progress' ? 
              `Arriving in ${formatDuration(activeRide.estimatedDuration)}` : undefined}
            className="mb-4"
          />
        </div>
        
        {/* Map showing the current ride */}
        <RideMap
          ride={activeRide}
          driverLocation={driverLocation}
          showRiderControls={true}
          className="my-4"
        />
        
        {/* Driver info if ride is accepted or in progress */}
        {(activeRide.status === 'accepted' || activeRide.status === 'in_progress') && activeRide.driverId && (
          <div className="bg-muted/30 p-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Driver Name</p>
                <div className="text-sm text-muted-foreground flex items-center">
                  <div className="flex items-center">
                    <ThumbsUpIcon className="h-3 w-3 mr-1" />
                    <span>4.8</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>Toyota Camry</span>
                  <span className="mx-2">•</span>
                  <span>ABC-123</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                      <PhoneIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Call driver</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                      <MessageSquareIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Message driver</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
        
        {/* Rating UI */}
        {showRating && (
          <div className="py-4">
            <h4 className="font-medium text-center mb-3">How was your ride?</h4>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    rating >= star ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          {activeRide.status === 'requested' && (
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel Ride
            </Button>
          )}
          
          {showRating && (
            <Button onClick={handleRate} disabled={isLoading}>
              Submit Rating
            </Button>
          )}
          
          {activeRide.status !== 'requested' && !showRating && (
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get status title
function getStatusTitle(status: string): string {
  switch (status) {
    case 'requested': return 'Finding a driver...';
    case 'accepted': return 'Driver on the way';
    case 'in_progress': return 'En route to destination';
    case 'completed': return 'Ride completed';
    case 'cancelled': return 'Ride cancelled';
    default: return 'Ride status';
  }
}

// Helper function to get status description
function getStatusDescription(ride: Ride): string {
  switch (ride.status) {
    case 'requested':
      return 'We\'re finding a driver nearby for your ride.';
    case 'accepted':
      return `Your driver is on the way to pick you up at ${ride.pickupAddress}.`;
    case 'in_progress':
      return `Heading to ${ride.destinationAddress}. Estimated arrival in ${formatDuration(ride.estimatedDuration)}.`;
    case 'completed':
      return `Your ride to ${ride.destinationAddress} has been completed.`;
    case 'cancelled':
      return 'This ride has been cancelled.';
    default:
      return 'Current ride information';
  }
}

export default RideStatusModal;
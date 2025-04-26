import { useState, useEffect } from 'react';
import { RideMap } from '@/components/maps/RideMap';
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
} from 'lucide-react';
import { formatDistance, formatDuration } from '@/lib/mapUtils';

interface DemoStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  onCancel?: () => void;
}

export function DemoStatusModal({ open, onOpenChange, status, onCancel }: DemoStatusModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [showRating, setShowRating] = useState(status === 'completed');
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowRating(false);
      setRating(5);
    }
  }, [open]);
  
  // Show rating UI when ride is completed
  useEffect(() => {
    if (status === 'completed') {
      setShowRating(true);
    } else {
      setShowRating(false);
    }
  }, [status]);
  
  const handleCancel = () => {
    if (onCancel) onCancel();
    toast({
      title: 'Ride cancelled',
      description: 'Your ride has been cancelled successfully',
    });
  };
  
  const handleRate = () => {
    toast({
      title: 'Rating submitted',
      description: 'Thank you for your feedback!',
    });
    setShowRating(false);
  };
  
  // Sample ride data
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
    status: status,
    vehicleType: 'premium' as const,
    baseFare: 10.00,
    perMileRate: 2.50,
    perMinuteRate: 0.35,
    estimatedDistance: 2.5,
    estimatedDuration: 12,
    estimatedFare: 25.75,
    createdAt: new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {getStatusTitle(status)}
          </DialogTitle>
          <DialogDescription>
            {getStatusDescription(sampleRide)}
          </DialogDescription>
        </DialogHeader>
        
        {/* Animated progress indicator */}
        <div className="my-4">
          <RideProgressIndicator 
            currentStatus={status}
            estimatedArrival={status === 'in_progress' ? 
              `Arriving in ${formatDuration(sampleRide.estimatedDuration)}` : undefined}
            className="mb-4"
          />
        </div>
        
        {/* Map placeholder - actual map component is causing issues in demo */}
        <div className="my-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 font-medium mb-2">Map View</p>
            <p className="text-sm text-gray-400">
              {status === 'requested' ? 'Searching for nearby drivers...' : 
               status === 'accepted' ? 'Driver is on the way to your location' :
               status === 'in_progress' ? 'En route to destination' : 
               status === 'completed' ? 'Ride completed' : 'Ride cancelled'}
            </p>
          </div>
        </div>
        
        {/* Driver info if ride is accepted or in progress */}
        {(status === 'accepted' || status === 'in_progress') && (
          <div className="bg-muted/30 p-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">John Driver</p>
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
          {status === 'requested' && (
            <Button 
              variant="destructive" 
              onClick={handleCancel}
            >
              Cancel Ride
            </Button>
          )}
          
          {showRating && (
            <Button onClick={handleRate}>
              Submit Rating
            </Button>
          )}
          
          {status !== 'requested' && !showRating && (
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
function getStatusDescription(ride: any): string {
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
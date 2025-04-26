import { useState, useEffect } from 'react';
import { Ride } from '@/hooks/use-rides';
import { RideProgressIndicator } from './RideProgressIndicator';
import { RideMap } from '@/components/maps/RideMap';
import { formatDistance, formatDuration, calculateDistance } from '@/lib/mapUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PhoneIcon, MessageSquareIcon, XCircleIcon, CarFront, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface RideTrackerProps {
  ride: Ride;
  driverLocation?: { latitude: number; longitude: number } | null;
  onCancel?: () => void;
  onViewDetails?: () => void;
  expanded?: boolean;
  className?: string;
}

export function RideTracker({
  ride,
  driverLocation = null,
  onCancel,
  onViewDetails,
  expanded = false,
  className = ''
}: RideTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Auto-expand for active rides
  useEffect(() => {
    if (ride.status === 'accepted' || ride.status === 'in_progress') {
      setIsExpanded(true);
    }
  }, [ride.status]);
  
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(ride.estimatedFare);
  
  // Get ETA
  const getEta = () => {
    if (ride.status === 'in_progress') {
      return `${formatDuration(ride.estimatedDuration)} to destination`;
    } else if (ride.status === 'accepted') {
      // Assuming 5 minutes for driver to arrive, could be dynamic
      return '5 min until pickup';
    }
    return null;
  };
  
  const eta = getEta();
  
  // Get status badge color
  const getStatusColor = () => {
    switch (ride.status) {
      case 'requested': return 'bg-amber-500';
      case 'accepted': return 'bg-blue-500';
      case 'in_progress': return 'bg-indigo-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Format status text
  const getStatusText = () => {
    switch (ride.status) {
      case 'requested': return 'Finding Driver';
      case 'accepted': return 'Driver En Route';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };
  
  return (
    <Card className={`overflow-hidden shadow-md border-l-4 ${getStatusColor()} ${className}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base font-bold">{ride.pickupAddress} → {ride.destinationAddress}</CardTitle>
            <CardDescription>
              {formatDistance(ride.estimatedDistance)} • Est. {formatDuration(ride.estimatedDuration)}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="capitalize">
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-3">
        <div className="flex items-center justify-between mb-3 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <CarFront className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize text-muted-foreground">{ride.vehicleType}</span>
          </div>
          
          <div className="font-semibold">{formattedPrice}</div>
        </div>
        
        {/* Animated expanding section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Progress indicator */}
              <RideProgressIndicator 
                currentStatus={ride.status as any}
                estimatedArrival={eta || undefined}
                className="mb-4"
              />
              
              {/* Map */}
              <RideMap
                ride={ride}
                driverLocation={driverLocation}
                className="h-48 rounded-md mb-4"
              />
              
              {/* Driver info if available */}
              {ride.driverId && (ride.status === 'accepted' || ride.status === 'in_progress') && (
                <div className="bg-muted/20 p-3 rounded-md flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <CarFront className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Driver Name</p>
                      <p className="text-xs text-muted-foreground">Toyota Camry • ABC-123</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <PhoneIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MessageSquareIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
        
        <div className="flex space-x-2">
          {ride.status === 'requested' && onCancel && (
            <Button variant="destructive" size="sm" onClick={onCancel}>
              <XCircleIcon className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              Details
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
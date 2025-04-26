import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, CarFront, Flag, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RideStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

interface RideStatusStep {
  status: RideStatus;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface RideProgressIndicatorProps {
  currentStatus: RideStatus;
  estimatedArrival?: string;
  className?: string;
  vertical?: boolean;
}

export function RideProgressIndicator({
  currentStatus,
  estimatedArrival,
  className = '',
  vertical = false
}: RideProgressIndicatorProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps: RideStatusStep[] = [
    {
      status: 'requested',
      label: 'Requested',
      icon: <Clock className="h-5 w-5" />,
      description: 'Looking for nearby drivers',
      color: 'bg-amber-500'
    },
    {
      status: 'accepted',
      label: 'Accepted',
      icon: <MapPin className="h-5 w-5" />,
      description: 'Driver is on the way',
      color: 'bg-blue-500'
    },
    {
      status: 'in_progress',
      label: 'In Progress',
      icon: <CarFront className="h-5 w-5" />,
      description: 'En route to destination',
      color: 'bg-indigo-500'
    },
    {
      status: 'completed',
      label: 'Completed',
      icon: <CheckCircle className="h-5 w-5" />,
      description: 'Ride completed successfully',
      color: 'bg-green-500'
    }
  ];

  // Special case for cancelled status
  const cancelledStep: RideStatusStep = {
    status: 'cancelled',
    label: 'Cancelled',
    icon: <XCircle className="h-5 w-5" />,
    description: 'Ride has been cancelled',
    color: 'bg-red-500'
  };

  // Update active step based on current status
  useEffect(() => {
    if (currentStatus === 'cancelled') {
      // For cancelled status, we don't update the progress
      return;
    }
    
    const index = steps.findIndex(step => step.status === currentStatus);
    if (index !== -1) {
      setActiveStep(index);
    }
  }, [currentStatus]);

  // If ride is cancelled, show special cancelled view
  if (currentStatus === 'cancelled') {
    return (
      <div className={cn("p-4 rounded-lg bg-red-50 border border-red-200", className)}>
        <div className="flex items-center space-x-3 text-red-600">
          <XCircle className="h-6 w-6" />
          <div>
            <h3 className="font-medium">Ride Cancelled</h3>
            <p className="text-sm text-red-500">This ride has been cancelled.</p>
          </div>
        </div>
      </div>
    );
  }

  const containerClass = vertical 
    ? "flex flex-col space-y-4" 
    : "flex items-center justify-between";

  const progressLineClass = vertical
    ? "absolute left-6 top-10 bottom-2 w-0.5 bg-gray-200"
    : "absolute top-6 left-[3.25rem] right-[3.25rem] h-0.5 bg-gray-200";

  // Calculate progress width based on active step
  const progressPercentage = (activeStep / (steps.length - 1)) * 100;

  return (
    <div className={cn("relative p-4", className)}>
      {/* Background progress line */}
      <div className={progressLineClass}></div>
      
      {/* Animated progress line */}
      <motion.div 
        className={vertical 
          ? cn("absolute left-6 top-10 w-0.5", steps[activeStep].color) 
          : cn("absolute top-6 left-[3.25rem] h-0.5", steps[activeStep].color)
        }
        style={vertical 
          ? { height: `${progressPercentage}%` } 
          : { width: `${progressPercentage}%` }
        }
        initial={vertical ? { height: "0%" } : { width: "0%" }}
        animate={vertical ? { height: `${progressPercentage}%` } : { width: `${progressPercentage}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      ></motion.div>
      
      {/* Steps */}
      <div className={containerClass}>
        {steps.map((step, index) => {
          const isActive = index <= activeStep;
          const isCurrentStep = index === activeStep;
          
          return (
            <div 
              key={step.status} 
              className={vertical ? "flex items-start space-x-3" : "flex flex-col items-center text-center relative z-10"}
            >
              {/* Step dot */}
              <motion.div 
                className={cn(
                  "rounded-full flex items-center justify-center border-2", 
                  isActive ? cn(step.color, "border-white text-white") : "bg-white border-gray-300 text-gray-400",
                  vertical ? "h-10 w-10" : "h-12 w-12"
                )}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: isCurrentStep ? [1, 1.1, 1] : 1,
                  backgroundColor: isActive ? step.color : "#fff",
                }}
                transition={{ 
                  duration: isCurrentStep ? 0.5 : 0.3,
                  repeat: isCurrentStep ? Infinity : 0,
                  repeatType: "reverse",
                  repeatDelay: 1
                }}
              >
                {step.icon}
              </motion.div>
              
              {/* Step content */}
              <div className={vertical ? "" : "mt-2 w-24"}>
                <p className={cn(
                  "font-medium text-sm",
                  isActive ? "text-gray-900" : "text-gray-500"
                )}>
                  {step.label}
                </p>
                <p className={cn(
                  "text-xs",
                  isActive ? "text-gray-700" : "text-gray-400"
                )}>
                  {step.description}
                </p>
                
                {/* Show estimated arrival time for in progress step if provided */}
                {isCurrentStep && step.status === 'in_progress' && estimatedArrival && (
                  <motion.p 
                    className="text-xs font-medium text-indigo-600 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {estimatedArrival}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Destination flag for horizontal view */}
      {!vertical && (
        <div className="absolute right-0 top-[1.1rem] text-gray-400">
          <Flag className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
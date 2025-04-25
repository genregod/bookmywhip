import { VEHICLE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface RideTypeSelectorProps {
  selectedType: 'economy' | 'premium';
  onChange: (type: 'economy' | 'premium') => void;
  fareEstimate: {
    fare: number;
    distance: number;
    duration: number;
  } | null;
}

export default function RideTypeSelector({ 
  selectedType, 
  onChange, 
  fareEstimate 
}: RideTypeSelectorProps) {
  // Calculate premium fare from economy fare (50% more)
  const economyFare = fareEstimate?.fare || 12.50;
  const premiumFare = fareEstimate ? fareEstimate.fare * 1.5 : 18.75;

  return (
    <div className="grid grid-cols-2 gap-3">
      <button 
        onClick={() => onChange(VEHICLE_TYPES.ECONOMY)}
        className={cn(
          "p-4 border rounded-lg flex flex-col items-center",
          selectedType === VEHICLE_TYPES.ECONOMY 
            ? "bg-primary-50 border-primary" 
            : "hover:bg-gray-50 border-gray-200"
        )}
      >
        <div className="w-12 h-12 flex items-center justify-center mb-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={cn(
              "h-8 w-8", 
              selectedType === VEHICLE_TYPES.ECONOMY ? "text-primary" : "text-gray-700"
            )} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        </div>
        <span className="text-sm font-medium">Economy</span>
        <span className="text-xs text-gray-500 mt-1">${economyFare.toFixed(2)}</span>
      </button>
      
      <button 
        onClick={() => onChange(VEHICLE_TYPES.PREMIUM)}
        className={cn(
          "p-4 border rounded-lg flex flex-col items-center",
          selectedType === VEHICLE_TYPES.PREMIUM 
            ? "bg-primary-50 border-primary" 
            : "hover:bg-gray-50 border-gray-200"
        )}
      >
        <div className="w-12 h-12 flex items-center justify-center mb-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={cn(
              "h-8 w-8", 
              selectedType === VEHICLE_TYPES.PREMIUM ? "text-primary" : "text-gray-700"
            )} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M5 9l2 -4h7.5c.4 0 .5 .1 .6 .2l3.5 4.8" />
            <path d="M5 12v-3h13" />
            <path d="M5 14h4" />
            <path d="M19 14h-4" />
          </svg>
        </div>
        <span className="text-sm font-medium">Premium</span>
        <span className="text-xs text-gray-500 mt-1">${premiumFare.toFixed(2)}</span>
      </button>
    </div>
  );
}

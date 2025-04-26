import { toast } from "@/hooks/use-toast";

/**
 * Event types that should trigger toast notifications
 */
export enum NotificationEventType {
  RIDE_REQUEST = 'ride_request',
  RIDE_ACCEPTED = 'ride_accepted',
  RIDE_STARTED = 'ride_started',
  RIDE_COMPLETED = 'ride_completed',
  RIDE_CANCELLED = 'ride_cancelled',
  DRIVER_ARRIVED = 'driver_arrived',
  DRIVER_LOCATION_UPDATE = 'driver_location_update',
  PAYMENT_COMPLETED = 'payment_completed',
  ERROR = 'error',
}

/**
 * Notification severity levels that determine the visual style
 */
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * Configuration for creating a notification
 */
interface NotificationConfig {
  title: string;
  description: string;
  severity?: NotificationSeverity;
  duration?: number; // milliseconds
}

/**
 * Map of event types to their default notification configurations
 */
const defaultNotificationConfigs: Record<NotificationEventType, Omit<NotificationConfig, 'description'>> = {
  [NotificationEventType.RIDE_REQUEST]: {
    title: 'New Ride Request',
    severity: 'info',
    duration: 6000,
  },
  [NotificationEventType.RIDE_ACCEPTED]: {
    title: 'Ride Accepted',
    severity: 'success',
    duration: 5000,
  },
  [NotificationEventType.RIDE_STARTED]: {
    title: 'Ride Started',
    severity: 'info',
    duration: 4000,
  },
  [NotificationEventType.RIDE_COMPLETED]: {
    title: 'Ride Completed',
    severity: 'success',
    duration: 6000,
  },
  [NotificationEventType.RIDE_CANCELLED]: {
    title: 'Ride Cancelled',
    severity: 'warning',
    duration: 6000,
  },
  [NotificationEventType.DRIVER_ARRIVED]: {
    title: 'Driver Arrived',
    severity: 'info',
    duration: 8000,
  },
  [NotificationEventType.DRIVER_LOCATION_UPDATE]: {
    title: 'Driver Location Updated',
    severity: 'info',
    duration: 3000,
  },
  [NotificationEventType.PAYMENT_COMPLETED]: {
    title: 'Payment Completed',
    severity: 'success',
    duration: 5000,
  },
  [NotificationEventType.ERROR]: {
    title: 'Error',
    severity: 'error',
    duration: 8000,
  },
};

/**
 * Creates and displays a toast notification
 * 
 * @param eventType - The type of event to notify about
 * @param description - The description text for the notification
 * @param customConfig - Optional custom configuration to override defaults
 */
export function showNotification(
  eventType: NotificationEventType,
  description: string,
  customConfig?: Partial<NotificationConfig>
): void {
  const defaultConfig = defaultNotificationConfigs[eventType];
  const config = { ...defaultConfig, description, ...customConfig };

  toast({
    title: config.title,
    description: config.description,
    variant: config.severity === 'error' ? 'destructive' : 'default',
    duration: config.duration,
  });

  // Log notification for debugging
  console.log(`[Notification] ${config.title}: ${config.description}`);
}

/**
 * Creates and displays a toast notification for ride status changes
 * 
 * @param eventType - The type of event to notify about
 * @param ride - The ride object with details to include in the notification
 */
export function showRideNotification(
  eventType: NotificationEventType,
  ride: any
): void {
  let description = '';

  switch (eventType) {
    case NotificationEventType.RIDE_REQUEST:
      description = `New ride request from ${ride.pickupLocation?.address || 'unknown location'}`;
      break;
    case NotificationEventType.RIDE_ACCEPTED:
      description = `Your ride to ${ride.destinationLocation?.address || 'destination'} has been accepted`;
      break;
    case NotificationEventType.RIDE_STARTED:
      description = `Your ride has started. Estimated arrival: ${ride.estimatedArrival || 'calculating...'}`;
      break;
    case NotificationEventType.RIDE_COMPLETED:
      description = `Your ride has been completed. Thank you for riding with BookMyWhip!`;
      break;
    case NotificationEventType.RIDE_CANCELLED:
      description = `Your ride has been cancelled${ride.cancellationReason ? `: ${ride.cancellationReason}` : ''}`;
      break;
    case NotificationEventType.DRIVER_ARRIVED:
      description = `Your driver has arrived at the pickup location`;
      break;
    case NotificationEventType.PAYMENT_COMPLETED:
      description = `Payment of $${ride.actualFare || ride.estimatedFare} has been processed successfully`;
      break;
    default:
      description = `Ride #${ride.id} status updated to ${ride.status}`;
  }

  showNotification(eventType, description);
}
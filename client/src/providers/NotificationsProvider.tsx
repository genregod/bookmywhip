import { ReactNode, useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuth } from '@/hooks/use-auth';
import { NotificationEventType, showRideNotification } from '@/lib/notifications';

interface NotificationsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that sets up global notifications and toasts
 * 
 * This component:
 * 1. Renders the Toaster component for displaying toast notifications
 * 2. Listens to socket events and automatically displays notifications
 */
export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { user } = useAuth();
  const notificationSystemReady = useRef(false);
  
  // Determine the appropriate namespace based on user role
  const namespace = user?.role === 'driver' 
    ? '/drivers' 
    : user?.role === 'admin' 
      ? '/admin' 
      : '/riders';
  
  // Connect to the WebSocket server but only listen for notifications
  const { connected, lastMessage } = useWebSocket({
    namespace,
    autoConnect: !!user, // Only connect if user is logged in
    mockMode: false
  });

  // Process socket events for notifications
  useEffect(() => {
    if (!notificationSystemReady.current) {
      notificationSystemReady.current = true;
      console.log('Global notification system initialized');
    }
  }, []);
  
  // Process incoming messages for notifications
  useEffect(() => {
    if (!lastMessage || !user) return;
    
    // Map WebSocket event types to notification types
    const eventTypeMap: Record<string, NotificationEventType> = {
      'ride_accepted': NotificationEventType.RIDE_ACCEPTED,
      'ride_started': NotificationEventType.RIDE_STARTED,
      'ride_completed': NotificationEventType.RIDE_COMPLETED,
      'ride_cancelled': NotificationEventType.RIDE_CANCELLED,
      'driver_arrived': NotificationEventType.DRIVER_ARRIVED,
      'payment_completed': NotificationEventType.PAYMENT_COMPLETED,
      'new_ride_request': NotificationEventType.RIDE_REQUEST,
    };
    
    const notificationType = eventTypeMap[lastMessage.type];
    
    if (notificationType) {
      // Trigger notification for this event
      const eventData = {
        ...lastMessage.ride || {},
        ...lastMessage
      };
      
      // Only show driver notifications to drivers and rider notifications to riders
      const shouldNotify = (
        (user.role === 'driver' && lastMessage.type === 'new_ride_request') ||
        (user.role === 'rider' && lastMessage.type !== 'new_ride_request') ||
        (user.role === 'admin') // Admins see all notifications
      );
      
      if (shouldNotify) {
        showRideNotification(notificationType, eventData);
      }
    }
  }, [lastMessage, user]);
  
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
import { useEffect } from 'react';
import { SocketConnectionStatus } from '@/components/shared/SocketConnectionStatus';
import { useToast } from '@/hooks/use-toast';

export default function SocketDemo() {
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: 'Socket.IO Demo',
      description: 'Use this page to test Socket.IO connectivity in different namespaces'
    });
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Socket.IO Connection Demo</h1>
      
      <div className="mb-8">
        <p className="mb-4">
          This page demonstrates the BookMyWhip platform's Socket.IO implementation, 
          which provides real-time communication between riders, drivers, and the system.
        </p>
        <p className="mb-4">
          You can test different namespaces and observe the connection status and message exchange.
          The Socket.IO server is configured with three separate namespaces:
        </p>
        <ul className="list-disc list-inside mb-4 ml-4">
          <li><strong>/riders</strong> - For rider clients (booking rides, receiving driver updates)</li>
          <li><strong>/drivers</strong> - For driver clients (accepting rides, sending location updates)</li>
          <li><strong>/admin</strong> - For administrative monitoring and operations</li>
        </ul>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Connection Testing</h2>
          <SocketConnectionStatus />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Socket.IO Features</h2>
          <div className="bg-muted/20 p-4 rounded-lg border border-border">
            <h3 className="font-medium mb-2">Implemented Enhancements</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Automatic reconnection with configurable attempts</li>
              <li>Dedicated namespaces for user roles</li>
              <li>User-specific rooms for targeted messaging</li>
              <li>Authentication on connection</li>
              <li>Heartbeat with configurable intervals</li>
              <li>Connection state management</li>
              <li>Better error handling and reporting</li>
              <li>Mock mode for development/testing</li>
            </ul>
            
            <h3 className="font-medium mt-4 mb-2">Event Types</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>• ride_request</div>
              <div>• ride_accepted</div>
              <div>• ride_started</div>
              <div>• ride_completed</div>
              <div>• ride_cancelled</div>
              <div>• driver_location_update</div>
              <div>• driver_status_update</div>
              <div>• new_ride_request</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
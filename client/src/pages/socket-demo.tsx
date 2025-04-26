import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RideTracker } from "@/components/shared/RideTracker";
import { SocketConnectionStatus } from "@/components/shared/SocketConnectionStatus";

/**
 * Demo page for testing WebSocket functionality
 * Provides components to test different WebSocket features
 */
export default function SocketDemo() {
  const [activeTab, setActiveTab] = useState('connection');
  
  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col items-center space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Socket.IO Connection Demo</h1>
        <p className="text-muted-foreground">
          Test the real-time communication capabilities of the BookMyWhip platform
        </p>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connection">Socket Status</TabsTrigger>
          <TabsTrigger value="ride-tracker">Ride Tracker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Socket.IO Connection Testing</CardTitle>
              <CardDescription>
                Connect to different WebSocket namespaces and monitor their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocketConnectionStatus />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Connection Details</CardTitle>
              <CardDescription>
                Technical information about Socket.IO implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="font-medium">Namespace Structure:</div>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code>/ws/riders</code> - For rider clients</li>
                  <li><code>/ws/drivers</code> - For driver clients</li>
                  <li><code>/ws/admin</code> - For administrative dashboards</li>
                </ul>
              </div>
              
              <div>
                <div className="font-medium">Common Message Types:</div>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code>authenticate</code> - Authenticate the connection</li>
                  <li><code>ride_request</code> - New ride request created</li>
                  <li><code>ride_accepted</code> - Driver accepted a ride</li>
                  <li><code>ride_started</code> - Ride has begun</li>
                  <li><code>ride_completed</code> - Ride finished successfully</li>
                  <li><code>ride_cancelled</code> - Ride was cancelled</li>
                  <li><code>location_update</code> - Driver/rider position changed</li>
                  <li><code>ping</code> - Test connection with a ping</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ride-tracker" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rider View</CardTitle>
                <CardDescription>
                  Monitor a ride from the rider's perspective
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RideTracker mode="rider" demoMode={true} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Driver View</CardTitle>
                <CardDescription>
                  Monitor a ride from the driver's perspective
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RideTracker mode="driver" demoMode={true} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
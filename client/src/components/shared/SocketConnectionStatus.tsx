import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, SendIcon } from 'lucide-react';

/**
 * Component for testing Socket.IO connection status
 * Allows connecting to different namespaces and sending test messages
 */
export function SocketConnectionStatus() {
  const [activeTab, setActiveTab] = useState('riders');
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Connect to the selected namespace
  useEffect(() => {
    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setConnected(false);
    setLastMessage(null);
    setError(null);
    
    // Create a new WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const namespace = activeTab; // 'riders', 'drivers', or 'admin'
    
    console.log(`Connecting to Socket.IO at ${wsUrl} namespace: /${namespace}`);
    
    try {
      // Use the namespace in the URL
      const socket = new WebSocket(`${wsUrl}/${namespace}`);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('Socket.IO connected:', socketRef.current?.url);
        setConnected(true);
        setError(null);
        
        // Send connect success message
        socket.send(JSON.stringify({
          type: 'authenticate',
          timestamp: new Date().toISOString()
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Socket.IO connect success:', data.message || event.data);
          
          setLastMessage(
            typeof data === 'object' 
              ? JSON.stringify(data, null, 2)
              : String(data)
          );
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          setLastMessage(String(event.data));
        }
      };
      
      socket.onclose = (event) => {
        console.log('Socket.IO disconnected:', event.reason);
        setConnected(false);
        
        if (!event.wasClean) {
          setError(`Connection closed unexpectedly: ${event.reason || 'Unknown reason'}`);
        }
      };
      
      socket.onerror = (event) => {
        console.error('Socket.IO error:', event);
        setError('Connection error');
        setConnected(false);
      };
      
      // Clean up function
      return () => {
        console.log('Cleaning up Socket.IO connection');
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (err) {
      console.error('Failed to connect to Socket.IO:', err);
      setError(`Failed to connect: ${err}`);
      return () => {};
    }
  }, [activeTab]);
  
  // Send a ping message
  const sendPing = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected');
      return;
    }
    
    try {
      const message = {
        type: 'ping',
        timestamp: Date.now()
      };
      
      socketRef.current.send(JSON.stringify(message));
      console.log('Emitting Socket.IO event: ping', message);
    } catch (err) {
      console.error('Error sending ping message:', err);
      setError(`Failed to send message: ${err}`);
    }
  };
  
  return (
    <Card className="p-4">
      <Tabs 
        defaultValue="riders" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Socket.IO Connection Tester</h3>
          <Badge variant={connected ? 'default' : 'destructive'}>
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        
        <TabsList className="w-full mb-4">
          <TabsTrigger value="riders" className="flex-1">Riders</TabsTrigger>
          <TabsTrigger value="drivers" className="flex-1">Drivers</TabsTrigger>
          <TabsTrigger value="admin" className="flex-1">Admin</TabsTrigger>
        </TabsList>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center">
              {connected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">Connected to {activeTab} namespace</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {error || `Not connected to ${activeTab} namespace`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mb-4">
          <Button
            size="sm"
            onClick={sendPing}
            disabled={!connected}
            className="flex items-center"
          >
            <SendIcon className="mr-1 h-4 w-4" />
            Send Ping
          </Button>
        </div>
        
        {lastMessage && (
          <div className="mt-4">
            <div className="text-sm text-muted-foreground mb-1">Last message:</div>
            <pre className="bg-muted text-xs p-2 rounded max-h-32 overflow-auto">
              {lastMessage}
            </pre>
          </div>
        )}
      </Tabs>
    </Card>
  );
}
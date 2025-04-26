import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, SendIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

/**
 * Component for testing Socket.IO connection status
 * Allows connecting to different namespaces and sending test messages
 */
export function SocketConnectionStatus() {
  const [activeTab, setActiveTab] = useState('riders');
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Connect to the selected namespace
  useEffect(() => {
    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setConnected(false);
    setLastMessage(null);
    setError(null);
    
    // Create a new Socket.IO connection with namespace
    const namespace = activeTab.startsWith('/') ? activeTab : `/${activeTab}`;
    
    console.log(`Connecting to Socket.IO namespace: ${namespace}, path: /ws`);
    
    try {
      // Create Socket.IO instance with the proper namespace
      const socket = io(namespace, {
        path: '/ws',
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      socketRef.current = socket;
      
      socket.on('connect', () => {
        console.log('Socket.IO connected:', socket.id);
        setConnected(true);
        setError(null);
        
        // Send authenticate message
        socket.emit('authenticate', {
          timestamp: new Date().toISOString()
        });
      });
      
      socket.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err.message);
        setError(`Connection error: ${err.message}`);
        setConnected(false);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        setConnected(false);
        
        if (reason !== 'io client disconnect') {
          setError(`Connection closed: ${reason || 'Unknown reason'}`);
        }
      });
      
      socket.on('error', (err) => {
        console.error('Socket.IO error:', err);
        setError(`Socket error: ${typeof err === 'string' ? err : JSON.stringify(err)}`);
      });
      
      // Listen for any message
      socket.onAny((eventName, ...args) => {
        console.log(`Socket.IO event received: ${eventName}`, args);
        setLastMessage(JSON.stringify({ event: eventName, data: args[0] }, null, 2));
      });
      
      // Explicit handlers for specific events
      socket.on('pong', (data) => {
        console.log('Received pong response:', data);
        setLastMessage(JSON.stringify({ event: 'pong', data }, null, 2));
      });
      
      // Connect to the socket server
      if (!socket.connected) {
        socket.connect();
      }
      
      // Clean up function
      return () => {
        console.log('Cleaning up Socket.IO connection');
        if (socket.connected) {
          socket.disconnect();
        }
      };
    } catch (err: any) {
      console.error('Failed to connect to Socket.IO:', err);
      setError(`Failed to connect: ${err.message}`);
      return () => {};
    }
  }, [activeTab]);
  
  // Send a ping message
  const sendPing = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      setError('Not connected');
      return;
    }
    
    try {
      const message = {
        timestamp: Date.now()
      };
      
      socketRef.current.emit('ping', message);
      console.log('Emitting Socket.IO event: ping', message);
    } catch (err: any) {
      console.error('Error sending ping message:', err);
      setError(`Failed to send message: ${err.message}`);
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
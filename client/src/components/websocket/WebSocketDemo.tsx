import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, RotateCw, Plug, WifiOff } from 'lucide-react';

/**
 * WebSocket Demo Component
 * 
 * This component demonstrates real-time communication using WebSockets
 * for ride status updates and notifications in the BookMyWhip platform.
 */
export function WebSocketDemo() {
  const [activeConnection, setActiveConnection] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [messages, setMessages] = useState<{type: string, content: any, timestamp: Date}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const { toast } = useToast();
  
  // Set up WebSocket connection
  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (activeConnection) {
        activeConnection.close();
      }
    };
  }, [activeConnection]);
  
  // Connect to WebSocket server
  const connect = () => {
    try {
      setConnectionStatus('connecting');
      
      // Get the WebSocket URL (protocol + host + path)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      
      // Set up event handlers
      ws.onopen = () => {
        setConnectionStatus('connected');
        setActiveConnection(ws);
        
        // Display connection success message
        addMessage('system', 'Connected to BookMyWhip WebSocket server');
        
        // Show toast notification
        toast({
          title: 'WebSocket Connected',
          description: 'Successfully connected to the real-time server',
        });
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage('received', data);
        } catch (error) {
          // Handle non-JSON messages
          addMessage('received', { raw: event.data });
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addMessage('error', { message: 'Connection error' });
        
        toast({
          title: 'WebSocket Error',
          description: 'Failed to connect to the server',
          variant: 'destructive',
        });
      };
      
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setActiveConnection(null);
        
        addMessage('system', 'Disconnected from WebSocket server');
        
        toast({
          title: 'WebSocket Disconnected',
          description: 'The connection to the real-time server was closed',
        });
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('disconnected');
      
      toast({
        title: 'Connection Failed',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  // Disconnect from WebSocket server
  const disconnect = () => {
    if (activeConnection) {
      activeConnection.close();
      setActiveConnection(null);
      setConnectionStatus('disconnected');
    }
  };
  
  // Add a message to the message list
  const addMessage = (type: string, content: any) => {
    setMessages(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }]);
  };
  
  // Send a message to the WebSocket server
  const sendMessage = () => {
    if (!activeConnection || connectionStatus !== 'connected') {
      toast({
        title: 'Not Connected',
        description: 'Please connect to the WebSocket server first',
        variant: 'destructive',
      });
      return;
    }
    
    if (!inputMessage.trim()) {
      toast({
        title: 'Empty Message',
        description: 'Please enter a message to send',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Try to parse as JSON
      let messageContent;
      try {
        messageContent = JSON.parse(inputMessage);
      } catch (e) {
        // If not valid JSON, send as plain text
        messageContent = { text: inputMessage };
      }
      
      // Send the message
      activeConnection.send(JSON.stringify({
        type: 'message',
        payload: messageContent,
        timestamp: new Date().toISOString()
      }));
      
      // Add to message history
      addMessage('sent', messageContent);
      
      // Clear input
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      
      toast({
        title: 'Failed to Send Message',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  // Send predefined test messages
  const sendTestMessage = (messageType: string) => {
    switch (messageType) {
      case 'authenticate':
        // Example authentication message
        sendPredefinedMessage({
          type: 'authenticate',
          payload: {
            userId: 123,
            role: 'rider'
          }
        });
        break;
        
      case 'driverLocation':
        // Example driver location update
        sendPredefinedMessage({
          type: 'driver-location',
          payload: {
            driverId: 456,
            latitude: 37.7749,
            longitude: -122.4194,
            heading: 90,
            speed: 25,
            timestamp: new Date().toISOString()
          }
        });
        break;
        
      case 'rideRequest':
        // Example ride request
        sendPredefinedMessage({
          type: 'ride-request',
          payload: {
            riderId: 123,
            pickupLocation: {
              latitude: 37.7749,
              longitude: -122.4194,
              address: '123 Main St, San Francisco, CA'
            },
            dropoffLocation: {
              latitude: 37.3382,
              longitude: -121.8863,
              address: '456 Park Ave, San Jose, CA'
            },
            timestamp: new Date().toISOString()
          }
        });
        break;
        
      case 'ping':
        // Simple ping message
        sendPredefinedMessage({
          type: 'ping',
          payload: {
            timestamp: new Date().toISOString()
          }
        });
        break;
    }
  };
  
  // Helper function to send predefined messages
  const sendPredefinedMessage = (message: any) => {
    if (!activeConnection || connectionStatus !== 'connected') {
      toast({
        title: 'Not Connected',
        description: 'Please connect to the WebSocket server first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Convert to string and send
      const messageString = JSON.stringify(message);
      activeConnection.send(messageString);
      
      // Add to message history
      addMessage('sent', message);
    } catch (error) {
      console.error('Error sending test message:', error);
      
      toast({
        title: 'Failed to Send Test Message',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  // Format message for display
  const formatMessage = (message: {type: string, content: any, timestamp: Date}) => {
    const timeString = message.timestamp.toLocaleTimeString();
    
    let badge;
    switch (message.type) {
      case 'sent':
        badge = <Badge variant="default">Sent</Badge>;
        break;
      case 'received':
        badge = <Badge variant="secondary">Received</Badge>;
        break;
      case 'error':
        badge = <Badge variant="destructive">Error</Badge>;
        break;
      case 'system':
        badge = <Badge variant="outline">System</Badge>;
        break;
      default:
        badge = <Badge variant="outline">Info</Badge>;
    }
    
    return (
      <div className="flex flex-col mb-2 p-2 border rounded">
        <div className="flex justify-between items-center mb-1">
          <div>{badge}</div>
          <div className="text-xs text-gray-500">{timeString}</div>
        </div>
        <div className="text-sm font-mono overflow-auto">
          {typeof message.content === 'string' 
            ? message.content 
            : JSON.stringify(message.content, null, 2)}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>WebSocket Real-Time Demo</CardTitle>
        <CardDescription>
          Test real-time communication for ride status updates and notifications
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {connectionStatus === 'connected' ? (
              <Badge className="bg-green-500">Connected</Badge>
            ) : connectionStatus === 'connecting' ? (
              <Badge className="bg-yellow-500">Connecting...</Badge>
            ) : (
              <Badge variant="destructive">Disconnected</Badge>
            )}
          </div>
          
          <div className="ml-auto">
            {connectionStatus !== 'connected' ? (
              <Button 
                size="sm" 
                variant="default" 
                className="flex items-center gap-1" 
                onClick={connect}
                disabled={connectionStatus === 'connecting'}
              >
                <Plug className="h-4 w-4" />
                Connect
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-1" 
                onClick={disconnect}
              >
                <WifiOff className="h-4 w-4" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="messages">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="test">Test Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="messages" className="space-y-4">
            <div className="h-64 overflow-y-auto border rounded p-2 bg-muted/20 mb-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx}>{formatMessage(msg)}</div>
                ))
              )}
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter a message or JSON data..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                  disabled={connectionStatus !== 'connected'}
                />
              </div>
              <Button 
                onClick={sendMessage} 
                disabled={connectionStatus !== 'connected' || !inputMessage.trim()}
                className="flex items-center gap-1"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="test">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => sendTestMessage('authenticate')}
                disabled={connectionStatus !== 'connected'}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <div className="w-full text-left font-semibold">Authentication</div>
                <div className="w-full text-left text-xs text-muted-foreground">
                  Send user authentication data
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => sendTestMessage('driverLocation')}
                disabled={connectionStatus !== 'connected'}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <div className="w-full text-left font-semibold">Driver Location</div>
                <div className="w-full text-left text-xs text-muted-foreground">
                  Send driver location update
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => sendTestMessage('rideRequest')}
                disabled={connectionStatus !== 'connected'}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <div className="w-full text-left font-semibold">Ride Request</div>
                <div className="w-full text-left text-xs text-muted-foreground">
                  Request a new ride
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => sendTestMessage('ping')}
                disabled={connectionStatus !== 'connected'}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <div className="w-full text-left font-semibold">Ping Server</div>
                <div className="w-full text-left text-xs text-muted-foreground">
                  Send a simple ping message
                </div>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setMessages([])}
          disabled={messages.length === 0}
          className="flex items-center gap-1"
        >
          Clear Messages
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={() => {
            disconnect();
            setTimeout(connect, 500);
          }}
          className="flex items-center gap-1"
        >
          <RotateCw className="h-4 w-4" />
          Reconnect
        </Button>
      </CardFooter>
    </Card>
  );
}

export default WebSocketDemo;
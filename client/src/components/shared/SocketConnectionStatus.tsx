import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { Button } from '@/components/ui/button';
import { WS_MESSAGE_TYPES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

/**
 * Component to display the current Socket.IO connection status
 * and allow testing basic functionality
 */
export function SocketConnectionStatus() {
  const { toast } = useToast();
  const [socketOptions, setSocketOptions] = useState({
    namespace: '/riders',
    mockMode: false
  });
  const { connected, sendMessage, lastMessage, error } = useWebSocket(socketOptions);
  const [messageCount, setMessageCount] = useState(0);

  // Track received messages
  useEffect(() => {
    if (lastMessage) {
      setMessageCount(prev => prev + 1);
    }
  }, [lastMessage]);

  // Send a ping to test connection
  const handlePing = () => {
    sendMessage({
      type: WS_MESSAGE_TYPES.PING,
      timestamp: Date.now()
    });
    toast({
      title: 'Ping sent',
      description: 'Waiting for server response...'
    });
  };

  // Handle namespace change
  const changeNamespace = (namespace: string) => {
    setSocketOptions(prev => ({
      ...prev,
      namespace
    }));
    toast({
      title: 'Namespace changed',
      description: `Connecting to ${namespace} namespace`
    });
  };

  // Toggle mock mode
  const toggleMockMode = () => {
    setSocketOptions(prev => ({
      ...prev,
      mockMode: !prev.mockMode
    }));
    toast({
      title: `${socketOptions.mockMode ? 'Enabling real' : 'Enabling mock'} connection`,
      description: socketOptions.mockMode ? 'Connecting to actual Socket.IO server' : 'Using mock Socket.IO communication'
    });
  };

  return (
    <div className="bg-muted/20 p-4 rounded-lg border border-border">
      <h3 className="text-lg font-medium mb-2">Socket.IO Connection Status</h3>
      
      <div className="flex items-center gap-2 mb-4">
        <div 
          className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          title={connected ? 'Connected' : 'Disconnected'}
        />
        <span className="text-sm">
          {connected ? 'Connected' : 'Disconnected'} 
          {socketOptions.mockMode && ' (Mock Mode)'}
        </span>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Button 
          size="sm" 
          variant={socketOptions.namespace === '/riders' ? 'default' : 'outline'}
          onClick={() => changeNamespace('/riders')}
        >
          Riders
        </Button>
        <Button 
          size="sm"
          variant={socketOptions.namespace === '/drivers' ? 'default' : 'outline'}
          onClick={() => changeNamespace('/drivers')}
        >
          Drivers
        </Button>
        <Button 
          size="sm"
          variant={socketOptions.namespace === '/admin' ? 'default' : 'outline'}
          onClick={() => changeNamespace('/admin')}
        >
          Admin
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={toggleMockMode}
        >
          {socketOptions.mockMode ? 'Use Real Connection' : 'Use Mock Mode'}
        </Button>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button onClick={handlePing} size="sm" disabled={!connected}>
          Send Ping
        </Button>
      </div>
      
      <div className="text-sm">
        <p>Messages received: {messageCount}</p>
        {lastMessage && (
          <div className="mt-2 p-2 bg-muted rounded-sm overflow-x-auto max-h-24">
            <pre className="text-xs">{JSON.stringify(lastMessage, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
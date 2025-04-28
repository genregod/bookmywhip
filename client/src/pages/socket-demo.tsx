import WebSocketDemo from '@/components/websocket/WebSocketDemo';

export default function SocketDemoPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">BookMyWhip Real-Time Communication</h1>
        <p className="text-muted-foreground">
          This demo showcases the real-time communication capabilities used in the BookMyWhip platform. 
          The WebSocket connection enables instant updates for ride status, driver location tracking, and notifications.
        </p>
      </div>
      
      <WebSocketDemo />
      
      <div className="mt-8 bg-muted/30 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">How It Works</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Click <strong>Connect</strong> to establish a WebSocket connection with the server</li>
          <li>Use the <strong>Test Messages</strong> tab to send predefined messages for common ride-hailing scenarios</li>
          <li>Enter custom JSON or plain text messages in the input field to test different message formats</li>
          <li>All messages sent and received are displayed in real-time with timestamps</li>
        </ul>
        
        <h2 className="font-semibold mt-4 mb-2">Implementation Details</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>The WebSocket server handles both Socket.IO and native WebSocket connections</li>
          <li>Namespaces separate different concerns (riders, drivers, admin)</li>
          <li>Authentication ensures secure communication between clients and the server</li>
          <li>Events are used to communicate specific actions and updates in real-time</li>
        </ul>
      </div>
    </div>
  );
}
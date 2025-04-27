import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X, MinusCircle, Maximize2, MapPin } from 'lucide-react';
import { getWazeDeepLink, getWazeRouteDeepLink } from '@/lib/wazeIntegration';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface WazeEmbeddedNavigationProps {
  destination?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  route?: {
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    name?: string;
  };
  height?: string;
  width?: string;
  showAsModal?: boolean;
  onClose?: () => void;
}

export function WazeEmbeddedNavigation({
  destination,
  route,
  height = '500px',
  width = '100%',
  showAsModal = false,
  onClose
}: WazeEmbeddedNavigationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(showAsModal);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate the appropriate Waze URL
  const getWazeUrl = () => {
    if (route) {
      return getWazeRouteDeepLink(
        route.startLatitude,
        route.startLongitude,
        route.endLatitude,
        route.endLongitude,
        route.name
      );
    } else if (destination) {
      return getWazeDeepLink(
        destination.latitude,
        destination.longitude,
        destination.name
      );
    }
    
    // Default to a fallback URL if no coordinates provided
    return 'https://waze.com';
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (showAsModal) setIsModalOpen(false);
  };
  
  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  // Minimize functionality
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Fullscreen functionality
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Calculate dimensions based on state
  const frameHeight = isMinimized ? '60px' : isFullscreen ? '100vh' : height;
  const frameWidth = isFullscreen ? '100%' : width;

  // Get navigation title based on props
  const getNavigationTitle = () => {
    if (route) {
      return route.name ? `Route to ${route.name}` : 'Route Navigation';
    } else if (destination) {
      return destination.name ? `Navigate to ${destination.name}` : 'Navigation';
    }
    return 'Navigation';
  };

  // Create iframe content
  const navigationContent = (
    <Card 
      className={`waze-navigation-container ${isFullscreen ? 'fixed top-0 left-0 z-50 w-full h-full' : 'relative'}`}
      style={{ width: frameWidth }}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          <CardTitle className="text-base">{getNavigationTitle()}</CardTitle>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={toggleMinimize}
          >
            <MinusCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-0 relative" style={{ height: frameHeight }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading navigation...</span>
            </div>
          )}
          <iframe
            src={getWazeUrl()}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={handleLoadComplete}
            title="Waze Navigation"
            className="block"
          />
        </CardContent>
      )}
    </Card>
  );

  // Return content based on modal or inline mode
  if (showAsModal) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="p-0 max-w-[90vw] max-h-[90vh]" style={{ width: '90vw', height: '90vh' }}>
          {navigationContent}
        </DialogContent>
      </Dialog>
    );
  }

  return navigationContent;
}
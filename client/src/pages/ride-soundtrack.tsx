import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Music, RefreshCcw, Clock, Disc3 } from 'lucide-react';

export default function RideSoundtrackPage() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rideId, setRideId] = useState<number | null>(null);
  
  // Extract ride ID from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const id = params.get('rideId');
    if (id && !isNaN(parseInt(id))) {
      setRideId(parseInt(id));
    }
  }, [location]);
  
  // Fetch ride details
  const { data: ride, isLoading: isLoadingRide } = useQuery({
    queryKey: ['/api/rides', rideId],
    enabled: !!rideId,
  });
  
  // Fetch soundtrack for the ride
  const { 
    data: soundtrack, 
    isLoading: isLoadingsoundtrack,
    isError: soundtrackError
  } = useQuery({
    queryKey: ['/api/rides', rideId, 'soundtrack'],
    enabled: !!rideId,
    retry: false,
  });
  
  // Generate soundtrack mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!rideId) throw new Error("No ride ID provided");
      const response = await apiRequest("POST", `/api/rides/${rideId}/generate-soundtrack`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/rides', rideId, 'soundtrack'],
      });
      toast({
        title: "Success",
        description: "Soundtrack generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate soundtrack: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Format total duration
  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };
  
  if (!rideId) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Ride Soundtrack</CardTitle>
            <CardDescription>
              No ride ID provided. Please select a ride to view its soundtrack.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (isLoadingRide || isLoadingsoundtrack) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Loading Ride Soundtrack</CardTitle>
            <CardDescription>
              Please wait while we load your soundtrack...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-6 w-6 text-green-500" />
              <CardTitle>Ride Soundtrack</CardTitle>
            </div>
            {ride && (
              <Badge variant="outline" className="text-md">
                {ride.status}
              </Badge>
            )}
          </div>
          <CardDescription>
            {ride ? (
              <>
                From {ride.pickupAddress} to {ride.destinationAddress}
              </>
            ) : (
              "Ride details not available"
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {soundtrackError || !soundtrack ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                No soundtrack has been generated for this ride yet.
              </p>
              <Button 
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="bg-green-500 hover:bg-green-600"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Music className="mr-2 h-4 w-4" />
                    Generate Soundtrack
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="relative w-28 h-28 rounded-md overflow-hidden flex-shrink-0">
                  {soundtrack.coverImage ? (
                    <img 
                      src={soundtrack.coverImage} 
                      alt={soundtrack.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-green-100 flex items-center justify-center">
                      <Music className="h-12 w-12 text-green-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold">{soundtrack.name}</h3>
                  <p className="text-muted-foreground">{soundtrack.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {soundtrack.genre && (
                      <Badge variant="secondary">
                        {soundtrack.genre}
                      </Badge>
                    )}
                    {soundtrack.mood && (
                      <Badge variant="secondary">
                        {soundtrack.mood}
                      </Badge>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {formatTotalDuration(soundtrack.duration || 0)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Disc3 className="mr-1 h-4 w-4" />
                      {soundtrack.trackCount} tracks
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Track list */}
              <div className="space-y-2">
                <h3 className="font-medium">Playlist Tracks</h3>
                <div className="space-y-2">
                  {soundtrack.tracks && soundtrack.tracks.length > 0 ? (
                    soundtrack.tracks.map((track: any, index: number) => (
                      <div 
                        key={track.id || index} 
                        className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{track.title}</h4>
                            <p className="text-sm text-muted-foreground">{track.artist}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(track.duration || 0)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No tracks in this playlist</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Ride
          </Button>
          
          {soundtrack && (
            <Button 
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              variant="outline"
              className="text-green-500 border-green-500"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh Soundtrack
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
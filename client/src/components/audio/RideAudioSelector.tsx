import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Music, Headphones, Check, Radio, BookOpen } from 'lucide-react';
import { AudioContent, ContentRating, ContentType, generateRidePlaylist, setRidePlaylist } from '@/lib/wazeAudioKit';

interface RideAudioSelectorProps {
  rideId: number;
  riderId: number;
  driverId: number;
  onPlaylistSelected?: (playlistId: string) => void;
}

export function RideAudioSelector({ rideId, riderId, driverId, onPlaylistSelected }: RideAudioSelectorProps) {
  const [availableContent, setAvailableContent] = useState<AudioContent[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<AudioContent[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch available content
  useEffect(() => {
    async function fetchAvailableContent() {
      try {
        const playlist = await generateRidePlaylist(rideId, riderId, driverId);
        setAvailableContent(playlist);
        
        // Filter content by type for playlists tab
        const playlists = playlist.filter(item => item.contentType === ContentType.MUSIC);
        setFilteredPlaylists(playlists);
      } catch (error) {
        console.error('Error fetching audio content:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAvailableContent();
  }, [rideId, riderId, driverId]);
  
  // Handle selection of a playlist
  const handleSelectPlaylist = (contentId: string) => {
    setSelectedPlaylistId(contentId);
  };
  
  // Handle saving the selected playlist for the ride
  const handleSaveSelection = async () => {
    if (!selectedPlaylistId) return;
    
    setIsSaving(true);
    
    try {
      await setRidePlaylist(rideId, selectedPlaylistId);
      
      if (onPlaylistSelected) {
        onPlaylistSelected(selectedPlaylistId);
      }
    } catch (error) {
      console.error('Error setting ride playlist:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Filter content by type
  const handleFilterChange = (contentType: ContentType) => {
    const filtered = availableContent.filter(item => item.contentType === contentType);
    setFilteredPlaylists(filtered);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Headphones className="mr-2 h-5 w-5" />
          Ride Audio Selection
        </CardTitle>
        <CardDescription>
          Choose what you'd like to listen to during your ride
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="playlists">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="playlists" className="flex-1" onClick={() => handleFilterChange(ContentType.MUSIC)}>
              <Music className="mr-2 h-4 w-4" /> Music
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="flex-1" onClick={() => handleFilterChange(ContentType.PODCAST)}>
              <Radio className="mr-2 h-4 w-4" /> Podcasts
            </TabsTrigger>
            <TabsTrigger value="audiobooks" className="flex-1" onClick={() => handleFilterChange(ContentType.AUDIOBOOK)}>
              <BookOpen className="mr-2 h-4 w-4" /> Audiobooks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="playlists" className="mt-0">
            <ScrollArea className="h-60">
              {filteredPlaylists.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <Music className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-500">No compatible playlists found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your content rating preferences
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPlaylists.map((content) => (
                    <div 
                      key={content.id} 
                      className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                        selectedPlaylistId === content.id ? 'bg-primary/10' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectPlaylist(content.id)}
                    >
                      <Avatar className="h-12 w-12 rounded-md border">
                        {content.coverUrl ? (
                          <img src={content.coverUrl} alt={content.title} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200">
                            <Music className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </Avatar>
                      <div className="ml-3 flex-1">
                        <h4 className="font-medium text-sm">{content.title}</h4>
                        <p className="text-xs text-gray-500">{content.artist || 'Unknown Artist'}</p>
                      </div>
                      {selectedPlaylistId === content.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="podcasts" className="mt-0">
            <div className="flex flex-col items-center justify-center h-60 py-8">
              <Radio className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-gray-500">Podcast selection coming soon</p>
            </div>
          </TabsContent>
          
          <TabsContent value="audiobooks" className="mt-0">
            <div className="flex flex-col items-center justify-center h-60 py-8">
              <BookOpen className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-gray-500">Audiobook selection coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveSelection} 
          disabled={!selectedPlaylistId || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </span>
          ) : selectedPlaylistId ? 'Save Selection' : 'Select a Playlist'}
        </Button>
      </CardFooter>
    </Card>
  );
}
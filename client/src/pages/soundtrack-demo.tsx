import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Music, 
  Clock, 
  Disc3, 
  MapPin, 
  Car, 
  User, 
  Headphones
} from 'lucide-react';

// Demo ride data
const DEMO_RIDES = [
  {
    id: 1,
    riderId: 1,
    driverId: 2,
    pickupAddress: "1234 Main St",
    destinationAddress: "5678 Market Ave",
    status: "in_progress",
    estimatedDistance: 5.2,
    estimatedDuration: 15,
    vehicleType: "economy"
  },
  {
    id: 2,
    riderId: 1,
    driverId: 3,
    pickupAddress: "Downtown Office",
    destinationAddress: "Sunset Beach Resort",
    status: "completed",
    estimatedDistance: 12.8,
    estimatedDuration: 28,
    vehicleType: "premium"
  }
];

// Demo user data
const DEMO_USERS = {
  1: { id: 1, username: "alex_rider", role: "rider" },
  2: { id: 2, username: "dave_driver", role: "driver" },
  3: { id: 3, username: "sarah_driver", role: "driver" }
};

export default function SoundtrackDemoPage() {
  const { toast } = useToast();
  const [selectedRide, setSelectedRide] = useState<any>(DEMO_RIDES[0]);
  const [soundtrack, setSoundtrack] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    favoriteGenres: ["pop", "jazz"],
    contentRating: "clean",
    preferredMoods: ["relaxed", "happy"],
    allowPersonalization: true
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
  
  // Generate a soundtrack based on user preferences
  const generateSoundtrack = () => {
    setIsGenerating(true);
    
    // Define the mood and genre based on user preferences
    const genre = userPreferences.favoriteGenres[0] || "pop";
    const mood = userPreferences.preferredMoods[0] || "relaxed";
    
    // Create tracks based on genre and mood
    let tracks;
    
    if (genre === "classical") {
      tracks = [
        {
          id: "cls_1",
          title: "Symphony No. 5",
          artist: "Ludwig van Beethoven",
          duration: 425,
          genre: "classical",
          mood: mood
        },
        {
          id: "cls_2",
          title: "Four Seasons: Spring",
          artist: "Antonio Vivaldi",
          duration: 238,
          genre: "classical",
          mood: mood
        },
        {
          id: "cls_3",
          title: "Moonlight Sonata",
          artist: "Ludwig van Beethoven",
          duration: 312,
          genre: "classical",
          mood: mood
        }
      ];
    } else if (genre === "jazz") {
      tracks = [
        {
          id: "jazz_1",
          title: "Take Five",
          artist: "Dave Brubeck",
          duration: 325,
          genre: "jazz",
          mood: mood
        },
        {
          id: "jazz_2",
          title: "So What",
          artist: "Miles Davis",
          duration: 289,
          genre: "jazz",
          mood: mood
        },
        {
          id: "jazz_3",
          title: "Autumn Leaves",
          artist: "Cannonball Adderley",
          duration: 342,
          genre: "jazz",
          mood: mood
        }
      ];
    } else if (genre === "electronic") {
      tracks = [
        {
          id: "elec_1",
          title: "Strobe",
          artist: "Deadmau5",
          duration: 310,
          genre: "electronic",
          mood: mood
        },
        {
          id: "elec_2",
          title: "Clair de Lune (Remix)",
          artist: "Flight Facilities",
          duration: 245,
          genre: "electronic",
          mood: mood
        },
        {
          id: "elec_3",
          title: "Midnight City",
          artist: "M83",
          duration: 237,
          genre: "electronic",
          mood: mood
        }
      ];
    } else {
      // Default to pop
      tracks = [
        {
          id: "pop_1",
          title: "Shape of You",
          artist: "Ed Sheeran",
          duration: 233,
          genre: "pop",
          mood: mood
        },
        {
          id: "pop_2",
          title: "Uptown Funk",
          artist: "Mark Ronson ft. Bruno Mars",
          duration: 270,
          genre: "pop",
          mood: mood
        },
        {
          id: "pop_3",
          title: "Blinding Lights",
          artist: "The Weeknd",
          duration: 203,
          genre: "pop",
          mood: mood
        }
      ];
    }
    
    // Add mood-specific tracks
    if (mood === "energetic") {
      tracks.push({
        id: "mood_1",
        title: "Eye of the Tiger",
        artist: "Survivor",
        duration: 244,
        genre: genre,
        mood: "energetic"
      });
    } else if (mood === "relaxed") {
      tracks.push({
        id: "mood_1",
        title: "Weightless",
        artist: "Marconi Union",
        duration: 286,
        genre: genre,
        mood: "relaxed"
      });
    } else if (mood === "happy") {
      tracks.push({
        id: "mood_1",
        title: "Happy",
        artist: "Pharrell Williams",
        duration: 232,
        genre: genre,
        mood: "happy"
      });
    }
    
    // Calculate total duration
    const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
    
    // Create playlist
    const newSoundtrack = {
      id: Date.now(),
      rideId: selectedRide.id,
      name: `${selectedRide.pickupAddress} to ${selectedRide.destinationAddress} Mix`,
      description: `A personalized ${genre} playlist with a ${mood} mood for your ride`,
      trackCount: tracks.length,
      duration: totalDuration,
      genre: genre,
      mood: mood,
      tracks: tracks,
      coverImage: `https://placehold.co/400x400/4CAF50/FFFFFF/png?text=${encodeURIComponent(genre.charAt(0).toUpperCase() + genre.slice(1))}`
    };
    
    // Simulate API call delay
    setTimeout(() => {
      setSoundtrack(newSoundtrack);
      setIsGenerating(false);
      
      toast({
        title: "Soundtrack Generated",
        description: "Your personalized ride soundtrack is ready!",
      });
    }, 2000);
  };
  
  // Save preferences
  const savePreferences = () => {
    toast({
      title: "Preferences Saved",
      description: "Your audio preferences have been updated.",
    });
    setPreferencesOpen(false);
  };
  
  return (
    <div className="container max-w-4xl py-10">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-green-500" />
            <CardTitle>Soundtrack Generator Demo</CardTitle>
          </div>
          <CardDescription>
            Experience personalized soundtracks for your BookMyWhip rides
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Select a Demo Ride</h3>
              <Select 
                value={String(selectedRide.id)}
                onValueChange={(value) => {
                  const ride = DEMO_RIDES.find(r => r.id === parseInt(value));
                  if (ride) {
                    setSelectedRide(ride);
                    setSoundtrack(null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a ride" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_RIDES.map((ride) => (
                    <SelectItem key={ride.id} value={String(ride.id)}>
                      {ride.pickupAddress} to {ride.destinationAddress}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Ride Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">From</div>
                      <div className="text-sm text-muted-foreground">{selectedRide.pickupAddress}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">To</div>
                      <div className="text-sm text-muted-foreground">{selectedRide.destinationAddress}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Vehicle Type</div>
                      <div className="text-sm text-muted-foreground capitalize">{selectedRide.vehicleType}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Estimated Duration</div>
                      <div className="text-sm text-muted-foreground">{selectedRide.estimatedDuration} minutes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Audio Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm font-medium">Music Preferences</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreferencesOpen(true)}
                    >
                      Edit
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Favorite Genres</div>
                    <div className="flex flex-wrap gap-1">
                      {userPreferences.favoriteGenres.map(genre => (
                        <Badge key={genre} variant="secondary" className="capitalize">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Preferred Moods</div>
                    <div className="flex flex-wrap gap-1">
                      {userPreferences.preferredMoods.map(mood => (
                        <Badge key={mood} variant="secondary" className="capitalize">
                          {mood}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Content Rating</div>
                    <Badge variant="secondary" className="capitalize">
                      {userPreferences.contentRating}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={generateSoundtrack}
                disabled={isGenerating}
                className="bg-green-500 hover:bg-green-600"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Soundtrack...
                  </>
                ) : (
                  <>
                    <Music className="mr-2 h-5 w-5" />
                    Generate Ride Soundtrack
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {soundtrack && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Disc3 className="h-6 w-6 text-green-500" />
              <CardTitle>Generated Soundtrack</CardTitle>
            </div>
            <CardDescription>
              Your personalized soundtrack for the ride
            </CardDescription>
          </CardHeader>
          
          <CardContent>
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
                      <Badge variant="secondary" className="capitalize">
                        {soundtrack.genre}
                      </Badge>
                    )}
                    {soundtrack.mood && (
                      <Badge variant="secondary" className="capitalize">
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
          </CardContent>
        </Card>
      )}
      
      {/* Preferences Dialog */}
      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Audio Preferences</DialogTitle>
            <DialogDescription>
              Customize your audio preferences for personalized soundtracks
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Favorite Genres</Label>
              <div className="grid grid-cols-2 gap-2">
                {["pop", "rock", "jazz", "classical", "electronic"].map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={`genre-${genre}`}
                      checked={userPreferences.favoriteGenres.includes(genre)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setUserPreferences({
                            ...userPreferences,
                            favoriteGenres: [...userPreferences.favoriteGenres, genre]
                          });
                        } else {
                          setUserPreferences({
                            ...userPreferences,
                            favoriteGenres: userPreferences.favoriteGenres.filter(g => g !== genre)
                          });
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`genre-${genre}`}
                      className="text-sm font-normal capitalize"
                    >
                      {genre}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Preferred Moods</Label>
              <div className="grid grid-cols-2 gap-2">
                {["energetic", "relaxed", "happy", "focused", "romantic"].map((mood) => (
                  <div key={mood} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mood-${mood}`}
                      checked={userPreferences.preferredMoods.includes(mood)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setUserPreferences({
                            ...userPreferences,
                            preferredMoods: [...userPreferences.preferredMoods, mood]
                          });
                        } else {
                          setUserPreferences({
                            ...userPreferences,
                            preferredMoods: userPreferences.preferredMoods.filter(m => m !== mood)
                          });
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`mood-${mood}`}
                      className="text-sm font-normal capitalize"
                    >
                      {mood}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Content Rating</Label>
              <Select 
                value={userPreferences.contentRating}
                onValueChange={(value) => {
                  setUserPreferences({
                    ...userPreferences,
                    contentRating: value
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean Only</SelectItem>
                  <SelectItem value="explicit">Allow Explicit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="allow-personalization"
                checked={userPreferences.allowPersonalization}
                onCheckedChange={(checked) => {
                  setUserPreferences({
                    ...userPreferences,
                    allowPersonalization: !!checked
                  });
                }}
              />
              <Label 
                htmlFor="allow-personalization"
                className="text-sm font-normal"
              >
                Enable ride music personalization
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPreferencesOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={savePreferences}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Music, Radio, BookOpen, Newspaper, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContentRating, ContentType, UserAudioPreferences, getUserAudioPreferences } from '@/lib/wazeAudioKit';

interface MusicPreferencesProps {
  userId: number;
  onPreferencesSaved?: () => void;
}

export function MusicPreferences({ userId, onPreferencesSaved }: MusicPreferencesProps) {
  const [preferences, setPreferences] = useState<UserAudioPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch user preferences
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const userPrefs = await getUserAudioPreferences(userId);
        setPreferences(userPrefs);
      } catch (error) {
        console.error('Error fetching audio preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPreferences();
  }, [userId]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;
    
    setIsSaving(true);
    
    try {
      // In a real implementation, this would save to your backend
      await fetch(`/api/users/${userId}/audio-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      if (onPreferencesSaved) {
        onPreferencesSaved();
      }
    } catch (error) {
      console.error('Error saving audio preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Update content rating preference
  const handleRatingChange = (rating: ContentRating) => {
    if (preferences) {
      setPreferences({
        ...preferences,
        contentRatingPreference: rating
      });
    }
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
  
  if (!preferences) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Unable to load audio preferences</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Music className="mr-2 h-5 w-5" />
          Ride Audio Preferences
        </CardTitle>
        <CardDescription>
          Customize your audio experience during rides with our Waze Audio Kit integration
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Content Filtering</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select your preferred content rating. This will be matched with your driver's preferences
              to ensure a comfortable ride experience for everyone.
            </p>
            
            <RadioGroup 
              value={preferences.contentRatingPreference} 
              onValueChange={(val) => handleRatingChange(val as ContentRating)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ContentRating.FAMILY_FRIENDLY} id="family_friendly" />
                <Label htmlFor="family_friendly" className="font-medium">Family Friendly</Label>
                <Badge className="ml-2 bg-green-500">G</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Content suitable for all ages with no explicit language or themes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ContentRating.MILD} id="mild" />
                <Label htmlFor="mild" className="font-medium">Mild Content</Label>
                <Badge className="ml-2 bg-yellow-500">PG</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">May contain some mild language or themes, but no explicit content</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ContentRating.EXPLICIT} id="explicit" />
                <Label htmlFor="explicit" className="font-medium">Explicit Content</Label>
                <Badge className="ml-2 bg-red-500">E</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">May contain explicit language or adult themes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-3">Content Type Preferences</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="music" checked />
                <Label htmlFor="music" className="flex items-center">
                  <Music className="mr-2 h-4 w-4" /> Music
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="podcasts" />
                <Label htmlFor="podcasts" className="flex items-center">
                  <Radio className="mr-2 h-4 w-4" /> Podcasts
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="audiobooks" />
                <Label htmlFor="audiobooks" className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" /> Audiobooks
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="news" />
                <Label htmlFor="news" className="flex items-center">
                  <Newspaper className="mr-2 h-4 w-4" /> News
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </span>
            ) : 'Save Preferences'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
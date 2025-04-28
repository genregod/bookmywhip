import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Music, Volume2, Headphones } from 'lucide-react';

// Form schema for audio preferences
const audioPreferencesSchema = z.object({
  favoriteGenres: z.array(z.string()).min(1, "Select at least one genre"),
  contentRating: z.enum(["clean", "explicit"]),
  volume: z.number().min(0).max(100),
  preferredMoods: z.array(z.string()),
  allowPersonalization: z.boolean().default(true),
});

type AudioPreferencesValues = z.infer<typeof audioPreferencesSchema>;

// Available music genres
const musicGenres = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "jazz", label: "Jazz" },
  { value: "classical", label: "Classical" },
  { value: "electronic", label: "Electronic" },
  { value: "hiphop", label: "Hip Hop" },
  { value: "country", label: "Country" },
  { value: "rnb", label: "R&B" },
  { value: "latin", label: "Latin" },
  { value: "ambient", label: "Ambient" },
  { value: "indie", label: "Indie" },
];

// Available moods
const musicMoods = [
  { value: "energetic", label: "Energetic" },
  { value: "relaxed", label: "Relaxed" },
  { value: "happy", label: "Happy" },
  { value: "melancholic", label: "Melancholic" },
  { value: "focused", label: "Focused" },
  { value: "romantic", label: "Romantic" },
  { value: "party", label: "Party" },
];

export default function AudioPreferencesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Get current user
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    onSuccess: (data) => {
      setCurrentUser(data);
    },
    onError: () => {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your audio preferences.",
        variant: "destructive",
      });
    },
  });
  
  // Fetch existing audio preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/users', currentUser?.id, 'audio-preferences'],
    enabled: !!currentUser?.id,
    retry: false,
  });

  // Form setup
  const form = useForm<AudioPreferencesValues>({
    resolver: zodResolver(audioPreferencesSchema),
    defaultValues: {
      favoriteGenres: [],
      contentRating: "clean",
      volume: 70,
      preferredMoods: [],
      allowPersonalization: true,
    },
  });
  
  // Update form with existing preferences when data is loaded
  useEffect(() => {
    if (preferences) {
      form.reset({
        favoriteGenres: preferences.favoriteGenres || [],
        contentRating: preferences.contentRating || "clean",
        volume: preferences.volume || 70,
        preferredMoods: preferences.preferredMoods || [],
        allowPersonalization: preferences.allowPersonalization !== false,
      });
    }
  }, [preferences, form]);

  // Save audio preferences mutation
  const mutation = useMutation({
    mutationFn: async (data: AudioPreferencesValues) => {
      if (!currentUser?.id) throw new Error("Not authenticated");
      const response = await apiRequest("POST", `/api/users/${currentUser.id}/audio-preferences`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/users', currentUser?.id, 'audio-preferences'],
      });
      toast({
        title: "Success",
        description: "Your audio preferences have been saved!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save preferences: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: AudioPreferencesValues) => {
    mutation.mutate(data);
  };

  if (!currentUser) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Audio Preferences</CardTitle>
            <CardDescription>
              Please log in to manage your audio preferences for rides.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.href = "/auth"}>Log In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-green-500" />
            <CardTitle>Ride Music Preferences</CardTitle>
          </div>
          <CardDescription>
            Customize your music preferences for a personalized ride experience
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Favorite Genres */}
              <div className="space-y-4">
                <FormLabel>Favorite Music Genres</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select your favorite music genres to personalize your ride playlists
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {musicGenres.map((genre) => (
                    <FormField
                      key={genre.value}
                      control={form.control}
                      name="favoriteGenres"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-2 rounded-md border">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(genre.value)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, genre.value]);
                                } else {
                                  field.onChange(
                                    currentValues.filter((value) => value !== genre.value)
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-sm font-normal">
                            {genre.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                {form.formState.errors.favoriteGenres && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.favoriteGenres.message}
                  </p>
                )}
              </div>

              <Separator />

              {/* Preferred Moods */}
              <div className="space-y-4">
                <FormLabel>Preferred Moods</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select the moods you prefer during your rides
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {musicMoods.map((mood) => (
                    <FormField
                      key={mood.value}
                      control={form.control}
                      name="preferredMoods"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-2 rounded-md border">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(mood.value)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, mood.value]);
                                } else {
                                  field.onChange(
                                    currentValues.filter((value) => value !== mood.value)
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-sm font-normal">
                            {mood.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Content Rating */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="contentRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Rating</FormLabel>
                      <p className="text-sm text-muted-foreground mb-2">
                        Choose your preferred content rating for music
                      </p>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clean">Clean Content Only</SelectItem>
                          <SelectItem value="explicit">Allow Explicit Content</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Volume Preference */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Volume</FormLabel>
                      <div className="flex items-center gap-4">
                        <Volume2 className="h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                            className="flex-1"
                          />
                        </FormControl>
                        <div className="w-12 text-center">
                          {field.value}%
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Allow Personalization */}
              <FormField
                control={form.control}
                name="allowPersonalization"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Ride Music Personalization</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow BookMyWhip to generate personalized soundtracks for your rides
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => form.reset()}>Reset</Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={mutation.isPending}
            className="bg-green-500 hover:bg-green-600"
          >
            {mutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
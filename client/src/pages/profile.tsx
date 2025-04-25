import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth, User } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      await updateProfile(data);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update failed',
        description: 'Something went wrong while updating your profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingIndicator message="Loading profile..." />
        </div>
      </MainLayout>
    );
  }

  const getUserInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user.username) {
      return user.username[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl p-4 md:p-6 space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center">
              <Avatar className="h-16 w-16 mr-4">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-primary text-white">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">My Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingIndicator message="Updating profile..." fullScreen={false} />
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {user.role === 'rider' && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Saved Locations</CardTitle>
              <CardDescription>Manage your frequently visited places</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Home</h3>
                        <p className="text-sm text-gray-500">123 Main St</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Work</h3>
                        <p className="text-sm text-gray-500">456 Office Park</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Location
              </Button>
            </CardContent>
          </Card>
        )}

        {user.role === 'driver' && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">My Vehicles</CardTitle>
              <CardDescription>Manage your registered vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4a1 1 0 00.2-.6V8a1 1 0 00-1-1h-3.9L11.1 3.6a1 1 0 00-.8-.4H4a1 1 0 00-1 1v.2" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium">Toyota Camry</h3>
                        <p className="text-sm text-gray-500">Silver • 2020 • ABC123</p>
                      </div>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Active
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Button variant="outline" className="w-full mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Vehicle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Car, PersonStanding } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters long',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters long',
  }),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters long',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters long',
  }),
  confirmPassword: z.string().min(6, {
    message: 'Password must be at least 6 characters long',
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState<'rider' | 'driver'>('rider');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiRequest('POST', '/api/login', data);
      if (response.ok) {
        toast({
          title: 'Login successful',
          description: `Welcome back to BookMyWhip!`,
        });
        setLocation('/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid username or password');
      }
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    // Remove the confirmPassword field as it's not needed in the API
    const { confirmPassword, ...registerData } = data;
    
    try {
      const response = await apiRequest('POST', '/api/register', {
        ...registerData,
        role: userType, // Add user type (rider or driver)
      });
      
      if (response.ok) {
        toast({
          title: 'Registration successful',
          description: `Welcome to BookMyWhip! You're now registered as a ${userType}.`,
        });
        setLocation('/');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left panel - Auth forms */}
      <div className="w-full lg:w-1/2 p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">BookMyWhip</CardTitle>
            <CardDescription>
              {activeTab === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">I am a:</div>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant={userType === 'rider' ? 'default' : 'outline'} 
                  className={`h-auto py-6 flex flex-col items-center justify-center ${userType === 'rider' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setUserType('rider')}
                >
                  <PersonStanding className="h-8 w-8 mb-2" />
                  <span>I need a ride</span>
                </Button>
                <Button 
                  variant={userType === 'driver' ? 'default' : 'outline'} 
                  className={`h-auto py-6 flex flex-col items-center justify-center ${userType === 'driver' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setUserType('driver')}
                >
                  <Car className="h-8 w-8 mb-2" />
                  <span>I have a whip</span>
                </Button>
              </div>
            </div>

            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'login' | 'register')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="yourusername" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Sign In
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="name@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(123) 456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Account
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center">
            <div className="text-sm text-muted-foreground">
              {activeTab === 'login' ? (
                <div>
                  Don't have an account?{" "}
                  <span 
                    className="text-primary cursor-pointer underline"
                    onClick={() => setActiveTab('register')}
                  >
                    Register
                  </span>
                </div>
              ) : (
                <div>
                  Already have an account?{" "}
                  <span 
                    className="text-primary cursor-pointer underline"
                    onClick={() => setActiveTab('login')}
                  >
                    Sign in
                  </span>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right panel - Hero image and content */}
      <div className="hidden lg:block w-1/2 bg-gradient-to-br from-green-400 to-green-700 text-white p-12">
        <div className="h-full flex flex-col justify-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to BookMyWhip</h1>
          <p className="text-xl mb-6">
            The modern ride-hailing platform that connects you with drivers for a seamless transportation experience.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Quick and Reliable Rides</h3>
                <p className="text-white/80">
                  Get matched with nearby drivers and arrive at your destination on time, every time.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <PersonStanding className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Earn on Your Schedule</h3>
                <p className="text-white/80">
                  Drivers can earn competitive rates by providing rides when it fits their schedule.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
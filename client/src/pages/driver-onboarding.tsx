import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, AlertCircle, FileText, Shield, Car, Upload, ClipboardCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

// Driver onboarding steps
enum DriverOnboardingStep {
  BASIC_INFO = 1,
  VEHICLE_INFO = 2,
  DOCUMENT_UPLOAD = 3,
  BACKGROUND_CHECK = 4,
  REVIEW = 5,
  COMPLETED = 6
}

// Type definitions
interface OnboardingStatus {
  userId: number;
  currentStep: DriverOnboardingStep;
  isDriverApproved: boolean;
  steps: {
    [key: number]: {
      name: string;
      completed: boolean;
    }
  };
  backgroundCheckStatus: string;
  vehicles?: any[];
  backgroundCheck?: {
    candidate: any;
    report?: any;
  };
}

// Form schemas
const basicInfoSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required")
});

const vehicleInfoSchema = z.object({
  make: z.string().min(2, "Make is required"),
  model: z.string().min(2, "Model is required"),
  year: z.coerce.number().min(2000, "Year must be 2000 or newer"),
  color: z.string().min(2, "Color is required"),
  licensePlate: z.string().min(2, "License plate is required"),
  type: z.enum(["economy", "premium"])
});

const documentUploadSchema = z.object({
  driverLicenseNumber: z.string().min(5, "Driver license number is required"),
  driverLicenseState: z.string().min(2, "State is required"),
  driverLicenseExpiry: z.string().min(10, "Expiry date is required"),
  documents: z.array(z.any()).min(1, "At least one document is required")
});

const backgroundCheckSchema = z.object({
  ssn: z.string().min(9, "Social Security Number is required"),
  dob: z.string().min(10, "Date of birth is required"),
  zipcode: z.string().min(5, "Zip code is required")
});

// Main component
export default function DriverOnboarding() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeStep, setActiveStep] = useState<DriverOnboardingStep>(DriverOnboardingStep.BASIC_INFO);
  const [documents, setDocuments] = useState<{ name: string, type: string, size: number, dataUrl: string }[]>([]);

  // Fetch onboarding status
  const { data: onboardingStatus, isLoading, error } = useQuery({
    queryKey: ['/api/driver-onboarding/status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const response = await apiRequest('GET', `/api/driver-onboarding/status/${user.id}`);
      return response.json();
    },
    enabled: !!user,
  });

  // Update active step based on status
  useEffect(() => {
    if (onboardingStatus) {
      setActiveStep(onboardingStatus.currentStep);
    }
  }, [onboardingStatus]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation('/auth');
    }
  }, [user, isAuthLoading, setLocation]);

  // Basic info form
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || ''
    }
  });

  // Vehicle info form
  const vehicleInfoForm = useForm<z.infer<typeof vehicleInfoSchema>>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: {
      make: '',
      model: '',
      year: 2023,
      color: '',
      licensePlate: '',
      type: 'economy'
    }
  });

  // Document upload form
  const documentUploadForm = useForm<z.infer<typeof documentUploadSchema>>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      driverLicenseNumber: user?.driverLicenseNumber || '',
      driverLicenseState: '',
      driverLicenseExpiry: '',
      documents: []
    }
  });

  // Background check form
  const backgroundCheckForm = useForm<z.infer<typeof backgroundCheckSchema>>({
    resolver: zodResolver(backgroundCheckSchema),
    defaultValues: {
      ssn: '',
      dob: '',
      zipcode: ''
    }
  });

  // Submit basic info mutation
  const basicInfoMutation = useMutation({
    mutationFn: async (data: z.infer<typeof basicInfoSchema>) => {
      if (!user) throw new Error('User not authenticated');
      const response = await apiRequest('POST', `/api/driver-onboarding/basic-info/${user.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Basic information saved",
        description: "Your basic information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver-onboarding/status', user?.id] });
      setActiveStep(DriverOnboardingStep.VEHICLE_INFO);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save basic information: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Submit vehicle info mutation
  const vehicleInfoMutation = useMutation({
    mutationFn: async (data: z.infer<typeof vehicleInfoSchema>) => {
      if (!user) throw new Error('User not authenticated');
      const response = await apiRequest('POST', `/api/driver-onboarding/vehicle-info/${user.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vehicle information saved",
        description: "Your vehicle information has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver-onboarding/status', user?.id] });
      setActiveStep(DriverOnboardingStep.DOCUMENT_UPLOAD);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save vehicle information: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Submit documents mutation
  const documentUploadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof documentUploadSchema>) => {
      if (!user) throw new Error('User not authenticated');
      
      // Include the document data
      const uploadData = {
        ...data,
        documents
      };
      
      const response = await apiRequest('POST', `/api/driver-onboarding/documents/${user.id}`, uploadData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documents uploaded",
        description: "Your documents have been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver-onboarding/status', user?.id] });
      setActiveStep(DriverOnboardingStep.BACKGROUND_CHECK);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload documents: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Submit background check mutation
  const backgroundCheckMutation = useMutation({
    mutationFn: async (data: z.infer<typeof backgroundCheckSchema>) => {
      if (!user) throw new Error('User not authenticated');
      const response = await apiRequest('POST', `/api/driver-onboarding/background-check/${user.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Background check initiated",
        description: "Your background check has been initiated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver-onboarding/status', user?.id] });
      setActiveStep(DriverOnboardingStep.REVIEW);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to initiate background check: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mock file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Process each file
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newDocument = {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: dataUrl
        };
        
        setDocuments(prev => [...prev, newDocument]);
        // Update the form value
        const currentDocs = documentUploadForm.getValues('documents') || [];
        documentUploadForm.setValue('documents', [...currentDocs, newDocument], { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    });
  };

  // Loading state
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your driver onboarding information...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold mt-4">Authentication Required</h1>
        <p className="text-muted-foreground mt-2">Please log in to access the driver onboarding process.</p>
        <Button className="mt-4" onClick={() => setLocation('/auth')}>Go to Login</Button>
      </div>
    );
  }

  // Main content
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Driver Onboarding</h1>
      <p className="text-muted-foreground mb-6">Complete the steps below to become a BookMyWhip driver.</p>
      
      {/* Progress bar */}
      <div className="mb-8">
        <Progress value={(activeStep / 6) * 100} className="h-2" />
        <div className="flex justify-between mt-2 text-sm">
          <span>Start</span>
          <span>Basic Info</span>
          <span>Vehicle</span>
          <span>Documents</span>
          <span>Background</span>
          <span>Review</span>
        </div>
      </div>
      
      {/* Onboarding steps */}
      <Tabs value={activeStep.toString()} className="w-full">
        <TabsList className="grid grid-cols-6 mb-6">
          <TabsTrigger value="1" disabled={activeStep < 1}>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground mb-1">
                {onboardingStatus?.steps[1]?.completed ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <span className="text-sm font-medium">1</span>
                }
              </div>
              <span className="text-xs">Basic Info</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="2" disabled={activeStep < 2}>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground mb-1">
                {onboardingStatus?.steps[2]?.completed ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <span className="text-sm font-medium">2</span>
                }
              </div>
              <span className="text-xs">Vehicle</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="3" disabled={activeStep < 3}>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground mb-1">
                {onboardingStatus?.steps[3]?.completed ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <span className="text-sm font-medium">3</span>
                }
              </div>
              <span className="text-xs">Documents</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="4" disabled={activeStep < 4}>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground mb-1">
                {onboardingStatus?.steps[4]?.completed ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <span className="text-sm font-medium">4</span>
                }
              </div>
              <span className="text-xs">Background</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="5" disabled={activeStep < 5}>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground mb-1">
                {onboardingStatus?.steps[5]?.completed ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <span className="text-sm font-medium">5</span>
                }
              </div>
              <span className="text-xs">Review</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="6" disabled={activeStep < 6}>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground mb-1">
                {onboardingStatus?.steps[6]?.completed ? 
                  <CheckCircle2 className="h-5 w-5 text-primary" /> : 
                  <span className="text-sm font-medium">6</span>
                }
              </div>
              <span className="text-xs">Completed</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Step 1: Basic Information */}
        <TabsContent value="1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Provide your personal information to get started as a driver.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...basicInfoForm}>
                <form onSubmit={basicInfoForm.handleSubmit(data => basicInfoMutation.mutate(data))}>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={basicInfoForm.control}
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
                      control={basicInfoForm.control}
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
                    <FormField
                      control={basicInfoForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={basicInfoForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button 
                      type="submit" 
                      disabled={basicInfoMutation.isPending}
                    >
                      {basicInfoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save & Continue
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Step 2: Vehicle Information */}
        <TabsContent value="2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="mr-2 h-5 w-5" />
                Vehicle Information
              </CardTitle>
              <CardDescription>
                Provide details about the vehicle you'll be using.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...vehicleInfoForm}>
                <form onSubmit={vehicleInfoForm.handleSubmit(data => vehicleInfoMutation.mutate(data))}>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={vehicleInfoForm.control}
                      name="make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make</FormLabel>
                          <FormControl>
                            <Input placeholder="Toyota" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleInfoForm.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="Camry" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleInfoForm.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input type="number" min="2000" max="2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleInfoForm.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input placeholder="Silver" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleInfoForm.control}
                      name="licensePlate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Plate</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vehicleInfoForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vehicle type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="economy">Economy</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button 
                      type="submit" 
                      disabled={vehicleInfoMutation.isPending}
                    >
                      {vehicleInfoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save & Continue
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Step 3: Document Upload */}
        <TabsContent value="3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload required documents and provide your driver's license information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...documentUploadForm}>
                <form onSubmit={documentUploadForm.handleSubmit(data => documentUploadMutation.mutate(data))}>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={documentUploadForm.control}
                      name="driverLicenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driver's License Number</FormLabel>
                          <FormControl>
                            <Input placeholder="DL12345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={documentUploadForm.control}
                      name="driverLicenseState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State of Issue</FormLabel>
                          <FormControl>
                            <Input placeholder="CA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={documentUploadForm.control}
                      name="driverLicenseExpiry"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <FormField
                      control={documentUploadForm.control}
                      name="documents"
                      render={() => (
                        <FormItem>
                          <FormLabel>Upload Documents</FormLabel>
                          <FormDescription>
                            Please upload the following documents: Driver's License (front and back), Vehicle Registration, and Insurance Card.
                          </FormDescription>
                          <div className="border-2 border-dashed rounded-md p-6 mt-2">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Drag and drop files here or click to browse</p>
                              <Input
                                type="file"
                                multiple
                                className="max-w-sm"
                                onChange={handleFileUpload}
                              />
                            </div>
                          </div>
                          <FormMessage />
                          
                          {/* Document preview */}
                          {documents.length > 0 && (
                            <div className="mt-4">
                              <h3 className="text-sm font-medium mb-2">Uploaded Documents:</h3>
                              <div className="space-y-2">
                                {documents.map((doc, i) => (
                                  <div key={i} className="flex items-center p-2 bg-secondary/50 rounded">
                                    <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{doc.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(doc.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newDocs = documents.filter((_, index) => index !== i);
                                        setDocuments(newDocs);
                                        documentUploadForm.setValue('documents', newDocs, { shouldValidate: true });
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button 
                      type="submit" 
                      disabled={documentUploadMutation.isPending || documents.length === 0}
                    >
                      {documentUploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save & Continue
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Step 4: Background Check */}
        <TabsContent value="4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Background Check
              </CardTitle>
              <CardDescription>
                Provide information for your background check. This information will be securely handled by our verification partner, Checkr.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...backgroundCheckForm}>
                <form onSubmit={backgroundCheckForm.handleSubmit(data => backgroundCheckMutation.mutate(data))}>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={backgroundCheckForm.control}
                      name="ssn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Security Number</FormLabel>
                          <FormControl>
                            <Input placeholder="XXX-XX-XXXX" type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your SSN is required for the background check and will be securely encrypted.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={backgroundCheckForm.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={backgroundCheckForm.control}
                      name="zipcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6 bg-secondary/30 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Consent for Background Check</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      By submitting this form, you authorize BookMyWhip and its partners to conduct a background check, which may include checking your criminal record, driving record, and credit history. This information will be used solely for the purpose of determining your eligibility as a driver.
                    </p>
                    <Label className="flex items-center gap-2">
                      <input type="checkbox" required className="h-4 w-4" />
                      <span className="text-sm">I consent to a background check</span>
                    </Label>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button 
                      type="submit" 
                      disabled={backgroundCheckMutation.isPending}
                    >
                      {backgroundCheckMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit for Verification
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Step 5: Review */}
        <TabsContent value="5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardCheck className="mr-2 h-5 w-5" />
                Application Review
              </CardTitle>
              <CardDescription>
                Your application is being reviewed. This process may take 1-3 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center p-4 bg-primary/10 rounded-md">
                  <Loader2 className="h-6 w-6 mr-3 text-primary animate-spin" />
                  <div>
                    <h3 className="font-medium">Background Check in Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Status: {onboardingStatus?.backgroundCheckStatus || 'Pending'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">What happens next?</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Our team will review your documents and information</li>
                    <li>The background check will be completed by our partner Checkr</li>
                    <li>You'll receive an email notification when your application is approved</li>
                    <li>Once approved, you can start accepting ride requests</li>
                  </ol>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Application Summary</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <p className="text-muted-foreground">Name:</p>
                    <p>{user.firstName} {user.lastName}</p>
                    <p className="text-muted-foreground">Email:</p>
                    <p>{user.email}</p>
                    <p className="text-muted-foreground">Phone:</p>
                    <p>{user.phoneNumber}</p>
                    <p className="text-muted-foreground">Vehicle:</p>
                    <p>
                      {onboardingStatus?.vehicles && onboardingStatus.vehicles[0] ? 
                        `${onboardingStatus.vehicles[0].year} ${onboardingStatus.vehicles[0].make} ${onboardingStatus.vehicles[0].model}` : 
                        'Not specified'}
                    </p>
                    <p className="text-muted-foreground">License:</p>
                    <p>
                      {user.driverLicenseNumber ? 
                        `${user.driverLicenseNumber} (${user.driverLicenseState})` : 
                        'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setLocation('/rides')}>
                Back to Home
              </Button>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/driver-onboarding/status', user?.id] })}>
                Refresh Status
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Step 6: Completed */}
        <TabsContent value="6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Application Approved
              </CardTitle>
              <CardDescription>
                Congratulations! Your application has been approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">You're Ready to Drive!</h2>
                <p className="text-center text-muted-foreground mb-6 max-w-md">
                  Your driver account has been fully approved. You can now start accepting ride requests and earning with BookMyWhip.
                </p>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full max-w-md">
                  <Button onClick={() => setLocation('/rides')}>
                    View Available Rides
                  </Button>
                  <Button variant="outline" onClick={() => setLocation('/profile')}>
                    Go to Driver Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
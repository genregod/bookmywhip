import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ApiEndpoint, azureApiManagement } from '@/lib/azureApiManagement';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, RefreshCcw, Upload, Shield, BarChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const ApiManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isApimInitialized, setIsApimInitialized] = useState(false);

  // Query Azure API Management APIs
  const { data: apiList, isLoading: isLoadingApis, error: apisError, refetch: refetchApis } = useQuery({
    queryKey: ['/api/azure/apim/apis'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/azure/apim/apis');
        const data = await response.json();
        return data.apis || [];
      } catch (error) {
        console.error('Error fetching API list:', error);
        throw error;
      }
    },
    enabled: isApimInitialized,
  });

  // Mutation to initialize API Management
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/azure/apim/initialize');
      return response.json();
    },
    onSuccess: () => {
      setIsApimInitialized(true);
      toast({
        title: 'API Management Initialized',
        description: 'Successfully connected to Azure API Management service',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Initialization Failed',
        description: error.message || 'Failed to connect to Azure API Management',
        variant: 'destructive',
      });
    },
  });

  // Mutation to register BookMyWhip APIs
  const registerApisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/azure/apim/register-apis');
      return response.json();
    },
    onSuccess: () => {
      refetchApis();
      toast({
        title: 'APIs Registered',
        description: 'Successfully registered BookMyWhip APIs',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register APIs',
        variant: 'destructive',
      });
    },
  });

  // Mutation to apply standard policies
  const applyPoliciesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/azure/apim/apply-policies');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Policies Applied',
        description: 'Successfully applied standard API policies',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Policy Application Failed',
        description: error.message || 'Failed to apply API policies',
        variant: 'destructive',
      });
    },
  });

  // Initialize Azure API Management client when component mounts
  useEffect(() => {
    // Try to initialize client-side API Management client
    const initClient = async () => {
      try {
        await azureApiManagement.initialize();
      } catch (error) {
        console.error('Failed to initialize client-side API Management client:', error);
      }
    };
    
    initClient();
  }, []);

  const handleInitialize = () => {
    initializeMutation.mutate();
  };

  const handleRegisterApis = () => {
    registerApisMutation.mutate();
  };

  const handleApplyPolicies = () => {
    applyPoliciesMutation.mutate();
  };

  // Render API cards
  const renderApiCards = () => {
    if (isLoadingApis) {
      return Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-24 mr-2" />
            <Skeleton className="h-8 w-24" />
          </CardFooter>
        </Card>
      ));
    }

    if (apisError) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading APIs</AlertTitle>
          <AlertDescription>
            There was a problem loading the API list. Please try again.
          </AlertDescription>
        </Alert>
      );
    }

    if (!apiList || apiList.length === 0) {
      return (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No APIs Found</AlertTitle>
          <AlertDescription>
            No APIs are currently registered. Click "Register APIs" to create the BookMyWhip APIs.
          </AlertDescription>
        </Alert>
      );
    }

    return apiList.map((api: any, index: number) => (
      <Card key={index} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{api.displayName || api.name}</CardTitle>
            <Badge>{api.apiRevision || '1.0'}</Badge>
          </div>
          <CardDescription>{api.description || 'No description available'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Path:</strong> {api.path}</div>
            <div><strong>Protocol:</strong> {api.protocols?.join(', ') || 'HTTP'}</div>
            <div><strong>Service URL:</strong> {api.serviceUrl || 'Not specified'}</div>
            <div><strong>Subscription Required:</strong> {api.subscriptionRequired ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" className="mr-2" onClick={() => window.open(api.serviceUrl, '_blank')}>
            View API
          </Button>
          <Button variant="outline" size="sm">
            <BarChart className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Azure API Management</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Management Status</CardTitle>
                <CardDescription>Current status of Azure API Management integration</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${isApimInitialized ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span>Connection Status: {isApimInitialized ? 'Connected' : 'Not Connected'}</span>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${apiList && apiList.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span>APIs Registered: {apiList ? apiList.length : 0}</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-green-500" />
                  <span>Environment Ready</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleInitialize} disabled={initializeMutation.isPending || isApimInitialized}>
                  {initializeMutation.isPending ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : isApimInitialized ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Connected
                    </>
                  ) : (
                    'Connect to API Management'
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Management Actions</CardTitle>
                <CardDescription>Common API Management tasks</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Register BookMyWhip APIs with Azure API Management to expose your services through an API gateway.</p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button 
                  onClick={handleRegisterApis} 
                  disabled={registerApisMutation.isPending || !isApimInitialized}
                >
                  {registerApisMutation.isPending ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Register APIs
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleApplyPolicies} 
                  disabled={applyPoliciesMutation.isPending || !isApimInitialized}
                >
                  {applyPoliciesMutation.isPending ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Apply Policies
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="apis">
          <div className="grid md:grid-cols-2 gap-6">
            {renderApiCards()}
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>API Management Settings</CardTitle>
              <CardDescription>Configure Azure API Management settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These settings control how BookMyWhip interacts with Azure API Management. Changes may require redeployment.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">API Gateway URL</h3>
                  <p className="text-sm text-muted-foreground">
                    {import.meta.env.VITE_AZURE_APIM_URL || 'Not configured'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Environment</h3>
                  <Badge>{import.meta.env.NODE_ENV || 'development'}</Badge>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Deployment Instructions</h3>
                  <p className="text-sm text-muted-foreground">
                    To deploy or update the API Management service, run the deployment script:
                  </p>
                  <pre className="bg-muted p-2 rounded-md mt-2 text-xs">
                    <code>./deploy-apim.sh</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiManagement;
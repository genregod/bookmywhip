import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import { AlertCircle, CheckCircle, Loader2, Server, ShieldAlert } from 'lucide-react';

interface ApiInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  serviceUrl: string;
  path: string;
}

export default function ApiManagement() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apis, setApis] = useState<ApiInfo[]>([]);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [newApiName, setNewApiName] = useState('');
  const [newApiDisplayName, setNewApiDisplayName] = useState('');
  const [newApiPath, setNewApiPath] = useState('');
  const [newApiDescription, setNewApiDescription] = useState('');
  const [policyXml, setPolicyXml] = useState('');
  const [missingSecrets, setMissingSecrets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/azure/apim/initialize');
      const data = await response.json();
      setIsInitialized(data.initialized);
      setMissingSecrets(data.missingSecrets || []);
      
      if (data.initialized) {
        fetchApis();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to check API Management initialization:', error);
      toast({
        title: 'Initialization Check Failed',
        description: 'Unable to check if Azure API Management is initialized.',
        variant: 'destructive',
      });
      setIsInitialized(false);
      setIsLoading(false);
    }
  };

  const fetchApis = async () => {
    try {
      const response = await apiRequest('GET', '/api/azure/apim/apis');
      const data = await response.json();
      setApis(data.apis || []);
    } catch (error) {
      console.error('Failed to fetch APIs:', error);
      toast({
        title: 'API Fetch Failed',
        description: 'Unable to retrieve API list from Azure API Management.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterBookMyWhipApis = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/azure/apim/register-apis');
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'APIs Registered',
          description: 'BookMyWhip APIs have been registered with Azure API Management.',
        });
        fetchApis();
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to register BookMyWhip APIs:', error);
      toast({
        title: 'API Registration Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStandardPolicies = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/azure/apim/apply-policies');
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Policies Applied',
          description: 'Standard policies have been applied to BookMyWhip APIs.',
        });
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to apply standard policies:', error);
      toast({
        title: 'Policy Application Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiName || !newApiDisplayName || !newApiPath) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/azure/apim/create-api', {
        apiId: newApiName,
        displayName: newApiDisplayName,
        path: newApiPath,
        description: newApiDescription,
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'API Created',
          description: `API '${newApiDisplayName}' has been created.`,
        });
        // Reset form
        setNewApiName('');
        setNewApiDisplayName('');
        setNewApiPath('');
        setNewApiDescription('');
        fetchApis();
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to create API:', error);
      toast({
        title: 'API Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isInitialized === null) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingIndicator size="lg" />
      </div>
    );
  }

  // If not initialized or missing required secrets
  if (isInitialized === false || missingSecrets.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-600">
            <AlertCircle className="mr-2 h-6 w-6" />
            Azure API Management Setup Required
          </CardTitle>
          <CardDescription>
            Azure API Management integration requires additional configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>
              {missingSecrets.length > 0 ? (
                <>
                  The following environment variables are missing:
                  <ul className="list-disc ml-6 mt-2">
                    {missingSecrets.map((secret) => (
                      <li key={secret}>{secret}</li>
                    ))}
                  </ul>
                </>
              ) : (
                'Azure API Management is not properly configured.'
              )}
            </AlertDescription>
          </Alert>

          <div className="mb-4">
            <h3 className="font-medium text-lg mb-2">Setup Instructions</h3>
            <p className="mb-4">To enable Azure API Management integration, please add the following environment variables to your application:</p>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md mb-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                AZURE_SUBSCRIPTION_ID=your-subscription-id
                AZURE_TENANT_ID=your-tenant-id
                AZURE_RESOURCE_GROUP=BookMyWhip-ResourceGroup
                AZURE_CLIENT_ID=your-client-id
                AZURE_CLIENT_SECRET=your-client-secret
                AZURE_APIM_NAME=BookMyWhipAPIManagement
              </pre>
            </div>
            
            <p>After adding these variables, restart the application to enable Azure API Management integration.</p>
          </div>
          
          <Button onClick={checkInitialization}>
            Check Configuration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-blue-600">
          <Server className="mr-2 h-6 w-6" />
          Azure API Management
        </CardTitle>
        <CardDescription>
          Manage and monitor your BookMyWhip APIs with Azure API Management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="apis">API Catalog</TabsTrigger>
            <TabsTrigger value="create">Create API</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <h3 className="font-medium text-green-800">API Management Connected</h3>
                  <p className="text-green-600 text-sm">Connection to Azure API Management is active</p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center">
                <Server className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-800">API Catalog</h3>
                  <p className="text-blue-600 text-sm">{apis.length} APIs registered</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleRegisterBookMyWhipApis} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Register BookMyWhip APIs
                </Button>
                <Button onClick={handleApplyStandardPolicies} disabled={isLoading} variant="outline">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Apply Standard Policies
                </Button>
                <Button onClick={() => setActiveTab('create')} variant="outline">
                  Create New API
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-3">Recently Registered APIs</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apis.length > 0 ? (
                      apis.slice(0, 5).map((api) => (
                        <TableRow key={api.id}>
                          <TableCell className="font-medium">{api.displayName}</TableCell>
                          <TableCell>/{api.path}</TableCell>
                          <TableCell className="text-sm text-gray-500 truncate max-w-[200px]">
                            {api.serviceUrl}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('apis')}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          No APIs registered yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="apis">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="font-medium text-lg">API Catalog</h3>
              <Button size="sm" onClick={fetchApis} variant="outline">
                Refresh
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingIndicator />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Backend URL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apis.length > 0 ? (
                      apis.map((api) => (
                        <TableRow key={api.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{api.displayName}</div>
                              <div className="text-sm text-gray-500">{api.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">/{api.path}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 truncate max-w-[200px]">
                            {api.serviceUrl}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                          No APIs found. Click "Register BookMyWhip APIs" to add the default APIs.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Create New API</h3>
              <p className="text-gray-600 mb-4">
                Register a new API with Azure API Management to expose your backend services securely.
              </p>
            </div>
            
            <form onSubmit={handleCreateApi} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiId">API ID (unique identifier)</Label>
                  <Input
                    id="apiId"
                    value={newApiName}
                    onChange={(e) => setNewApiName(e.target.value)}
                    placeholder="e.g., bookings-api"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Unique identifier used in the system (no spaces)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={newApiDisplayName}
                    onChange={(e) => setNewApiDisplayName(e.target.value)}
                    placeholder="e.g., Bookings API"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Human-readable name displayed in the portal
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="path">API Path</Label>
                <div className="flex items-center">
                  <span className="bg-gray-100 px-3 py-2 text-gray-500 border border-r-0 rounded-l-md">
                    /
                  </span>
                  <Input
                    id="path"
                    value={newApiPath}
                    onChange={(e) => setNewApiPath(e.target.value)}
                    placeholder="e.g., bookings"
                    className="rounded-l-none"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  URL path segment that identifies this API in the gateway
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newApiDescription}
                  onChange={(e) => setNewApiDescription(e.target.value)}
                  placeholder="Describe the purpose and functionality of this API"
                  rows={3}
                />
              </div>
              
              <div className="pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create API
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="policies">
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">API Policies</h3>
              <p className="text-gray-600 mb-4">
                Manage security, access control, and traffic management policies for your APIs.
              </p>
            </div>
            
            <div className="mb-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center mb-4">
                <ShieldAlert className="h-6 w-6 text-amber-500 mr-3" />
                <p className="text-amber-800 text-sm">
                  Policies define rules that are applied to API requests and responses.
                </p>
              </div>
              
              <Button onClick={handleApplyStandardPolicies} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply Standard Policies to All APIs
              </Button>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h4 className="font-medium mb-3">Standard Policy Configuration</h4>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-[300px]">
{`<policies>
  <inbound>
    <cors>
      <allowed-origins>
        <origin>https://bookmywhip.com</origin>
        <origin>https://*.bookmywhip.com</origin>
        <origin>http://localhost:*</origin>
      </allowed-origins>
      <allowed-methods>
        <method>GET</method>
        <method>POST</method>
        <method>PUT</method>
        <method>DELETE</method>
        <method>PATCH</method>
      </allowed-methods>
      <allowed-headers>
        <header>Content-Type</header>
        <header>Authorization</header>
      </allowed-headers>
    </cors>
    <rate-limit calls="5" renewal-period="60" />
    <base />
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>`}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
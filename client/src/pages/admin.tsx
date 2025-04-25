import { useState } from 'react';
import { useLocation } from 'wouter';
import MainLayout from '@/components/layout/MainLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoadingIndicator from '@/components/shared/LoadingIndicator';

export default function Admin() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for tables
  // In a real implementation, this would be fetched from the API
  const mockUsers = [
    { 
      id: 1, 
      name: 'Alex Johnson', 
      email: 'alex@example.com', 
      role: 'rider', 
      createdAt: '2023-01-15', 
      status: 'active',
      rides: 12
    },
    { 
      id: 2, 
      name: 'Michael Chen', 
      email: 'michael@example.com', 
      role: 'driver', 
      createdAt: '2023-02-10', 
      status: 'active',
      rides: 340
    },
    { 
      id: 3, 
      name: 'Sarah Miller', 
      email: 'sarah@example.com', 
      role: 'rider', 
      createdAt: '2023-03-05', 
      status: 'inactive',
      rides: 8
    }
  ];

  const mockRides = [
    {
      id: 238921,
      customer: 'Alex Johnson',
      driver: 'Michael Chen',
      amount: 12.50,
      status: 'completed',
      date: 'Today, 10:24 AM'
    },
    {
      id: 238920,
      customer: 'Sarah Miller',
      driver: 'David Kim',
      amount: 18.75,
      status: 'in_progress',
      date: 'Today, 10:18 AM'
    },
    {
      id: 238919,
      customer: 'James Wilson',
      driver: 'Lisa Wong',
      amount: 9.25,
      status: 'cancelled',
      date: 'Today, 9:52 AM'
    }
  ];

  // Filter users based on search query
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter rides based on search query
  const filteredRides = mockRides.filter(ride => 
    ride.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ride.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ride.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ride.id.toString().includes(searchQuery)
  );

  // Check if the user is an admin
  if (!user || user.role !== 'admin') {
    return (
      <MainLayout>
        <div className="container max-w-4xl p-4 md:p-6 text-center">
          <h1 className="text-2xl font-heading font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin panel.</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, rides, and platform settings</p>
        </div>

        <Tabs 
          defaultValue="dashboard" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="rides">Rides</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 w-60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rides</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : user.role === 'driver'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-green-100 text-green-800 border-green-300'
                            }>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.rides}</TableCell>
                          <TableCell>{user.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rides">
            <Card>
              <CardHeader>
                <CardTitle>Ride Management</CardTitle>
                <CardDescription>View and manage ride history across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Ride ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRides.map((ride) => (
                        <TableRow key={ride.id}>
                          <TableCell className="font-medium">#{ride.id}</TableCell>
                          <TableCell>{ride.customer}</TableCell>
                          <TableCell>{ride.driver}</TableCell>
                          <TableCell>${ride.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              ride.status === 'completed'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : ride.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-red-100 text-red-800 border-red-300'
                            }>
                              {ride.status === 'completed'
                                ? 'Completed'
                                : ride.status === 'in_progress'
                                  ? 'In Progress'
                                  : 'Cancelled'}
                            </Badge>
                          </TableCell>
                          <TableCell>{ride.date}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Settings</CardTitle>
                  <CardDescription>Configure ride fare calculation parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Economy Base Fare</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                          <Input className="pl-8" type="number" defaultValue="5.00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Premium Base Fare</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                          <Input className="pl-8" type="number" defaultValue="8.00" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Per Mile Rate (Economy)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                          <Input className="pl-8" type="number" defaultValue="1.50" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Per Mile Rate (Premium)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                          <Input className="pl-8" type="number" defaultValue="2.25" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Per Minute Rate (Economy)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                          <Input className="pl-8" type="number" defaultValue="0.15" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Per Minute Rate (Premium)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                          <Input className="pl-8" type="number" defaultValue="0.25" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Platform Commission Rate (%)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">%</span>
                        <Input className="pl-8" type="number" defaultValue="15" />
                      </div>
                    </div>
                    
                    <Button className="w-full">Save Pricing Settings</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Configure global application settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Driver Search Radius (miles)</label>
                      <Input type="number" defaultValue="5" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Driver Request Timeout (seconds)</label>
                      <Input type="number" defaultValue="30" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Minimum Driver Rating</label>
                      <Input type="number" defaultValue="4.0" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Maximum Concurrent Ride Requests</label>
                      <Input type="number" defaultValue="3" />
                    </div>
                    
                    <Button className="w-full">Save Platform Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

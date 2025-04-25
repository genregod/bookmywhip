import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from './StatCard';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminStats {
  totalRides: number;
  activeDrivers: number;
  revenue: number;
  averageRating: number;
}

interface RecentRide {
  id: number;
  customer: string;
  driver: string;
  amount: number;
  status: 'completed' | 'in_progress' | 'cancelled';
  date: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Fetch admin stats data
  const { 
    data: stats = { 
      totalRides: 1258,
      activeDrivers: 87,
      revenue: 15840,
      averageRating: 4.8
    }, 
    isLoading: isStatsLoading 
  } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'admin',
  });

  // Mock recent rides data
  // In a real app, this would be fetched from the API
  const recentRides: RecentRide[] = [
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
    },
    {
      id: 238918,
      customer: 'Emily Davis',
      driver: 'Robert Martinez',
      amount: 15.30,
      status: 'completed',
      date: 'Today, 9:45 AM'
    },
    {
      id: 238917,
      customer: 'Sophia Brown',
      driver: 'John Smith',
      amount: 22.15,
      status: 'completed',
      date: 'Today, 9:30 AM'
    }
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);

  return (
    <div className="bg-gray-50 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor and manage ride activity across the platform</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Rides"
          value={stats.totalRides.toLocaleString()}
          icon="car"
          iconColor="primary"
          change={{ value: 12.5, type: 'increase' }}
        />
        
        <StatCard
          title="Active Drivers"
          value={stats.activeDrivers.toString()}
          icon="user"
          iconColor="blue"
          change={{ value: 4.2, type: 'increase' }}
        />
        
        <StatCard
          title="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon="dollar"
          iconColor="green"
          change={{ value: 8.7, type: 'increase' }}
        />
        
        <StatCard
          title="Avg Rating"
          value={stats.averageRating.toString()}
          icon="star"
          iconColor="yellow"
          change={{ value: 0.2, type: 'increase' }}
        />
      </div>
      
      {/* Recent Rides Table */}
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-700">Recent Rides</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[100px]">Ride ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell className="font-medium">#{ride.id}</TableCell>
                    <TableCell>{ride.customer}</TableCell>
                    <TableCell>{ride.driver}</TableCell>
                    <TableCell>${ride.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ride.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : ride.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {ride.status === 'completed' 
                          ? 'Completed' 
                          : ride.status === 'in_progress'
                            ? 'In Progress'
                            : 'Cancelled'}
                      </div>
                    </TableCell>
                    <TableCell>{ride.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">97</span> results
            </span>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

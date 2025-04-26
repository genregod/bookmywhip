import { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useRides } from '@/hooks/use-rides';

export default function Earnings() {
  const { user } = useAuth();
  const { rides } = useRides();
  const [selectedRange, setSelectedRange] = useState('week');
  
  if (!user || user.role !== 'driver') {
    return (
      <div className="container mx-auto px-4 py-8 md:pl-72">
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="mt-4">Only drivers can access the earnings page.</p>
      </div>
    );
  }

  // Calculate some demo earnings data
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Generate some sample earnings data by day
  const weeklyEarnings = weekDays.map(day => ({
    date: day,
    amount: Math.floor(Math.random() * 100) + 20, // Random amount between 20-120
    rides: Math.floor(Math.random() * 10) + 1, // Random number of rides between 1-10
    hours: Math.floor(Math.random() * 8) + 1, // Random hours between 1-8
  }));
  
  const totalEarnings = weeklyEarnings.reduce((sum, day) => sum + day.amount, 0);
  const totalRides = weeklyEarnings.reduce((sum, day) => sum + day.rides, 0);
  const totalHours = weeklyEarnings.reduce((sum, day) => sum + day.hours, 0);
  
  // Recent transactions (example data)
  const recentTransactions = [
    { id: 1, date: subDays(today, 1), amount: 45.00, type: 'Ride Fare', status: 'completed' },
    { id: 2, date: subDays(today, 2), amount: 62.50, type: 'Ride Fare + Tip', status: 'completed' },
    { id: 3, date: subDays(today, 3), amount: 38.75, type: 'Ride Fare', status: 'completed' },
    { id: 4, date: subDays(today, 5), amount: 110.25, type: 'Weekly Bonus', status: 'completed' },
    { id: 5, date: subDays(today, 7), amount: 52.00, type: 'Ride Fare', status: 'completed' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:pl-72">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Earnings</h1>
          <p className="text-gray-500 mt-1">Track your earnings and manage your payments</p>
        </div>
        <Button variant="outline" className="mt-4 md:mt-0">
          Download Statement
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-500">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-sm text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-500">Total Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRides}</div>
            <p className="text-sm text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-500">Hours Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalHours}</div>
            <p className="text-sm text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="daily" className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
        
        <TabsContent value="daily" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Daily Earnings</CardTitle>
              <CardDescription>
                Earnings breakdown for {format(today, 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="flex items-center h-64 space-x-2">
                  {weeklyEarnings.map((day, index) => (
                    <div key={index} className="flex flex-col items-center justify-end h-full">
                      <div 
                        className="w-16 bg-primary rounded-t-md" 
                        style={{ height: `${(day.amount / 120) * 180}px` }}
                      ></div>
                      <p className="text-xs mt-2 font-medium">{format(day.date, 'EEE')}</p>
                      <p className="text-xs text-gray-500">${day.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Earnings</CardTitle>
              <CardDescription>
                Earnings breakdown for week of {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyEarnings.map((day, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <p className="font-medium">{format(day.date, 'EEEE')}</p>
                      <p className="text-sm text-gray-500">{format(day.date, 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${day.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{day.rides} rides • {day.hours} hrs</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monthly" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
              <CardDescription>
                Earnings breakdown for {format(today, 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium mb-1">Monthly breakdown coming soon</h3>
                <p className="text-center text-gray-500">We're working on providing monthly earning reports. Check back soon!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your recent earnings activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-2">Date</th>
                  <th className="text-left font-medium p-2">Type</th>
                  <th className="text-right font-medium p-2">Amount</th>
                  <th className="text-right font-medium p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-2">{format(transaction.date, 'MMM d, yyyy')}</td>
                    <td className="p-2">{transaction.type}</td>
                    <td className="p-2 text-right">${transaction.amount.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useElements, useStripe, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  createSetupIntent, 
  getSavedPaymentMethods, 
  addPaymentMethod, 
  setDefaultPaymentMethod, 
  deletePaymentMethod,
  confirmCardSetup
} from '@/lib/stripe';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import { Trash2, Check, CreditCard } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/utils';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 
  'pk_test_placeholder'
);

// Interface for payment method from API
interface PaymentMethod {
  id: number;
  userId: number;
  stripePaymentMethodId: string;
  type: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

// Interface for ride history
interface RidePayment {
  id: number;
  date: string;
  description: string;
  status: string;
  amount: number;
}

function SetupForm({ onSuccess }: { onSuccess: (paymentMethodId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(undefined);

    try {
      // Use the card element to create a payment method
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setErrorMessage(result.error.message);
        toast({
          title: "Setup Failed",
          description: result.error.message || "An error occurred while saving your card",
          variant: "destructive",
        });
      } else if (result.setupIntent && result.setupIntent.status === 'succeeded') {
        toast({
          title: "Card Saved",
          description: "Your card has been saved successfully",
        });
        
        // Call the onSuccess callback with the paymentMethod ID
        if (result.setupIntent.payment_method) {
          onSuccess(result.setupIntent.payment_method as string);
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      toast({
        title: "Setup Error",
        description: error.message || "An error occurred while saving your card",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : "Save Card"}
      </Button>
    </form>
  );
}

function PaymentMethodsList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch saved payment methods
  const { data: paymentMethods = [], isLoading, error } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: getSavedPaymentMethods,
  });
  
  // Mutation for setting a payment method as default
  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Default Updated",
        description: "Your default payment method has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default payment method",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a payment method
  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Card Removed",
        description: "Your payment method has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method",
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
    return <div className="py-4 text-center">Loading payment methods...</div>;
  }
  
  if (error) {
    return <div className="py-4 text-center text-red-500">Error loading payment methods</div>;
  }
  
  if (paymentMethods.length === 0) {
    return <div className="py-4 text-center text-gray-500">No saved payment methods</div>;
  }
  
  return (
    <div className="space-y-3">
      {paymentMethods.map((method: PaymentMethod) => (
        <Card key={method.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <CreditCard className="h-5 w-5 text-blue-800" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {method.brand ? (method.brand.charAt(0).toUpperCase() + method.brand.slice(1)) : 'Card'} {method.last4 ? `ending in ${method.last4}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {method.expiryMonth && method.expiryYear ? `Expires ${method.expiryMonth}/${method.expiryYear}` : ''}
                    {method.isDefault && " • Default"}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                {!method.isDefault && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDefaultMutation.mutate(method.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Set as default</span>
                  </Button>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove this payment method? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate(method.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PaymentHistory() {
  // This would be fetched from the API in a real implementation
  const recentRides: RidePayment[] = [
    {
      id: 1,
      date: '2023-06-15T14:30:00Z',
      description: 'Ride to Downtown Mall',
      status: 'completed',
      amount: 12.50
    },
    {
      id: 2,
      date: '2023-06-12T09:15:00Z',
      description: 'Ride to Airport',
      status: 'completed',
      amount: 35.75
    }
  ];
  
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-4 p-4 bg-gray-50 text-sm font-medium text-gray-500 border-b">
        <div>Date</div>
        <div>Description</div>
        <div>Status</div>
        <div className="text-right">Amount</div>
      </div>
      
      <div className="divide-y">
        {recentRides.map(ride => (
          <div key={ride.id} className="grid grid-cols-4 p-4 text-sm">
            <div className="text-gray-500">{formatDate(new Date(ride.date))}</div>
            <div>{ride.description}</div>
            <div>
              <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                ride.status === 'completed' ? 'bg-green-100 text-green-800' : 
                ride.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
              </div>
            </div>
            <div className="text-right font-medium">${ride.amount.toFixed(2)}</div>
          </div>
        ))}
        
        {recentRides.length === 0 && (
          <div className="p-4 text-center text-gray-500">No payment history available</div>
        )}
      </div>
    </div>
  );
}

export default function Payment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientSecret, setClientSecret] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mutation for adding a payment method
  const addPaymentMethodMutation = useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      setIsAddingCard(false);
      toast({
        title: "Card Added",
        description: "Your payment method has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method",
        variant: "destructive",
      });
    },
  });

  // Handle successful setup
  const handleSetupSuccess = (paymentMethodId: string) => {
    addPaymentMethodMutation.mutate(paymentMethodId);
  };

  // Fetch client secret for setup intent
  useEffect(() => {
    const getSetupIntent = async () => {
      try {
        setIsLoading(true);
        const secret = await createSetupIntent();
        setClientSecret(secret);
      } catch (error) {
        console.error('Error getting setup intent:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment setup",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAddingCard && !clientSecret) {
      getSetupIntent();
    }
  }, [isAddingCard, toast, clientSecret]);

  if (isLoading && isAddingCard) {
    return (
      <MainLayout>
        <LoadingIndicator message="Preparing payment setup..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Manage your payment methods and view transaction history</p>
        </div>

        <Tabs defaultValue="payment-methods" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="transaction-history">Transaction History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payment-methods">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Saved Payment Methods</CardTitle>
                    <CardDescription>Your saved cards and payment options</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PaymentMethodsList />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsAddingCard(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {isAddingCard && clientSecret && (
                <div>
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>Add New Payment Method</CardTitle>
                      <CardDescription>Enter your card details below</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <SetupForm onSuccess={handleSetupSuccess} />
                      </Elements>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => setIsAddingCard(false)}
                      >
                        Cancel
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="transaction-history">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Recent payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

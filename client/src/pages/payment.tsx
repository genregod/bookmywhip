import { useState, useEffect } from 'react';
import { useElements, useStripe, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createPaymentIntent } from '@/lib/stripe';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import { apiRequest } from '@/lib/queryClient';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 
  'pk_test_placeholder'
);

function PaymentForm() {
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
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message);
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred while processing your payment",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: "Your payment was processed successfully",
        });
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred while processing your payment",
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
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
}

function PaymentMethodsList() {
  // This would be fetched from the API in a real implementation
  const savedPaymentMethods = [
    {
      id: 'pm_1',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2024,
      isDefault: true
    }
  ];
  
  return (
    <div className="space-y-3">
      {savedPaymentMethods.map((method) => (
        <Card key={method.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  {method.brand === 'visa' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-800" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4H4ZM20 14H4V18H20V14ZM20 8H4V12H20V8Z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} ending in {method.last4}
                  </p>
                  <p className="text-xs text-gray-500">
                    Expires {method.expMonth}/{method.expYear}
                    {method.isDefault && " • Default"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                </svg>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Payment() {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client secret for setup intent
  useEffect(() => {
    // In a real implementation, we would have an API endpoint to get a client secret
    // Here we're using the payment intent creation as a stand-in
    const getClientSecret = async () => {
      try {
        setIsLoading(true);
        const clientSecret = await createPaymentIntent(10); // $10 placeholder amount
        setClientSecret(clientSecret);
      } catch (error) {
        console.error('Error getting client secret:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getClientSecret();
  }, []);

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingIndicator message="Loading payment information..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Manage your payment information</p>
        </div>

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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
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
                    <PaymentForm />
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

          <div className="md:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Recent payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-4 bg-gray-50 text-sm font-medium text-gray-500 border-b">
                    <div>Date</div>
                    <div>Description</div>
                    <div>Status</div>
                    <div className="text-right">Amount</div>
                  </div>
                  
                  <div className="divide-y">
                    <div className="grid grid-cols-4 p-4 text-sm">
                      <div className="text-gray-500">Jun 15, 2023</div>
                      <div>Ride to Downtown Mall</div>
                      <div>
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </div>
                      </div>
                      <div className="text-right font-medium">$12.50</div>
                    </div>
                    
                    <div className="grid grid-cols-4 p-4 text-sm">
                      <div className="text-gray-500">Jun 12, 2023</div>
                      <div>Ride to Airport</div>
                      <div>
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </div>
                      </div>
                      <div className="text-right font-medium">$35.75</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

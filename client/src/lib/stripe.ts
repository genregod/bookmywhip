import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from './queryClient';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 
  'pk_test_placeholder'
);

// Create a payment intent for a ride
export async function createPaymentIntent(amount: number, rideId?: number) {
  try {
    const response = await apiRequest('POST', '/api/create-payment-intent', {
      amount,
      rideId
    });
    
    const { clientSecret } = await response.json();
    return clientSecret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Confirm card payment
export async function confirmCardPayment(clientSecret: string, paymentMethod: any) {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}

export default stripePromise;

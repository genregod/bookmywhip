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

// Create a setup intent for adding a new payment method
export async function createSetupIntent() {
  try {
    const response = await apiRequest('POST', '/api/setup-intent');
    const { clientSecret } = await response.json();
    return clientSecret;
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
}

// Get saved payment methods
export async function getSavedPaymentMethods() {
  try {
    const response = await apiRequest('GET', '/api/payment-methods');
    return await response.json();
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
}

// Add a new payment method
export async function addPaymentMethod(paymentMethodId: string) {
  try {
    const response = await apiRequest('POST', '/api/payment-methods', {
      paymentMethodId
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
}

// Set a payment method as default
export async function setDefaultPaymentMethod(paymentMethodId: number) {
  try {
    const response = await apiRequest('POST', `/api/payment-methods/${paymentMethodId}/default`);
    return await response.json();
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw error;
  }
}

// Delete a payment method
export async function deletePaymentMethod(paymentMethodId: number) {
  try {
    await apiRequest('DELETE', `/api/payment-methods/${paymentMethodId}`);
    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
}

// Create a subscription
export async function createSubscription(priceId: string, paymentMethodId?: string) {
  try {
    const response = await apiRequest('POST', '/api/subscriptions', {
      priceId,
      paymentMethodId
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Get user's subscriptions
export async function getSubscriptions() {
  try {
    const response = await apiRequest('GET', '/api/subscriptions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: number, cancelAtPeriodEnd = true) {
  try {
    const response = await apiRequest('POST', `/api/subscriptions/${subscriptionId}/cancel`, {
      cancelAtPeriodEnd
    });
    return await response.json();
  } catch (error) {
    console.error('Error cancelling subscription:', error);
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

// Confirm card setup (for saving a payment method)
export async function confirmCardSetup(clientSecret: string, paymentMethod: any) {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }
    
    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: paymentMethod
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return setupIntent;
  } catch (error) {
    console.error('Error confirming card setup:', error);
    throw error;
  }
}

export default stripePromise;

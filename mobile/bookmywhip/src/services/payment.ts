/**
 * Payment processing service for BookMyWhip mobile app
 * This service integrates with Stripe to handle payments and payment methods.
 * The actual payment processing happens through our backend API for security.
 */

import axios from 'axios';
import { API_CONFIG } from '../utils/config';

// Types
export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

// Subscription statuses from Stripe
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api`;
  }

  /**
   * Create a setup intent to add a payment method
   * @returns Promise with Stripe setup intent client secret
   */
  async createSetupIntent(): Promise<{ clientSecret: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/setup-intent`);
      return response.data;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw error;
    }
  }

  /**
   * Get all saved payment methods for the current user
   * @returns Array of payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/payment-methods`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Add a new payment method
   * @param paymentMethodId Stripe payment method ID
   * @returns The added payment method
   */
  async addPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    try {
      const response = await axios.post(`${this.baseUrl}/payment-methods`, {
        paymentMethodId,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  /**
   * Set a payment method as default
   * @param paymentMethodId Stripe payment method ID
   * @returns Updated payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payment-methods/${paymentMethodId}/default`
      );
      return response.data;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }

  /**
   * Delete a payment method
   * @param paymentMethodId Stripe payment method ID
   * @returns Success status
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/payment-methods/${paymentMethodId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent to charge a user
   * @param amount Amount to charge in dollars (will be converted to cents)
   * @returns Payment intent with client secret for Stripe SDK
   */
  async createPaymentIntent(amount: number): Promise<PaymentIntent> {
    try {
      const response = await axios.post(`${this.baseUrl}/create-payment-intent`, {
        amount,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a subscription
   * @param priceId Stripe price ID
   * @returns Subscription data
   */
  async createSubscription(priceId: string): Promise<{
    subscriptionId: string;
    clientSecret: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/subscriptions`, {
        priceId,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get current subscription
   * @returns Current subscription data
   */
  async getSubscription(): Promise<Subscription | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/subscriptions`);
      return response.data;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param subscriptionId Stripe subscription ID
   * @returns Success status
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/subscriptions/${subscriptionId}/cancel`
      );
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }
}

export default new PaymentService();
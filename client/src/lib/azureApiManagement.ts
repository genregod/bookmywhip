import { apiRequest } from './queryClient';

/**
 * Interface representing an API endpoint configuration in Azure API Management
 */
export interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  path: string;
  url: string;
}

/**
 * Azure API Management Client
 * 
 * This client interacts with the Azure API Management service to:
 * 1. Get API endpoints for different BookMyWhip services
 * 2. Get subscription keys for APIs
 * 3. Track API usage
 */
class AzureApiManagementClient {
  private baseUrl: string = '';
  private endpoints: Record<string, ApiEndpoint> = {};
  private initialized: boolean = false;

  constructor() {
    // Base URL will be configured during initialization
  }

  /**
   * Initialize the Azure API Management client
   * 
   * @param baseUrl The base URL for the API Management instance (e.g., https://bookmywhip.azure-api.net)
   */
  async initialize(baseUrl?: string): Promise<void> {
    try {
      if (baseUrl) {
        this.baseUrl = baseUrl;
      } else {
        // If no baseUrl is provided, try to load it from configuration
        const config = await this.loadConfig();
        this.baseUrl = config.baseUrl;
      }
      
      // Define known endpoints
      this.endpoints = {
        rides: {
          id: 'bookmywhip-ride-api',
          name: 'BookMyWhip Ride API',
          description: 'API for booking and managing rides',
          path: 'rides',
          url: `${this.baseUrl}/rides`,
        },
        drivers: {
          id: 'bookmywhip-driver-api',
          name: 'BookMyWhip Driver API',
          description: 'API for driver management and status updates',
          path: 'drivers',
          url: `${this.baseUrl}/drivers`,
        },
        payments: {
          id: 'bookmywhip-payment-api',
          name: 'BookMyWhip Payment API',
          description: 'API for processing payments and managing payment methods',
          path: 'payments',
          url: `${this.baseUrl}/payments`,
        },
      };
      
      this.initialized = true;
      console.log('Azure API Management client initialized with base URL:', this.baseUrl);
    } catch (error) {
      console.error('Failed to initialize Azure API Management client:', error);
      throw error;
    }
  }

  /**
   * Load API Management configuration
   */
  private async loadConfig(): Promise<{ baseUrl: string }> {
    try {
      // This would typically come from a configuration endpoint or environment variable
      // For now, we'll use a default value or environment variable if available
      const baseUrl = import.meta.env.VITE_AZURE_APIM_URL || 'https://bookmywhip-api.azure-api.net';
      return { baseUrl };
    } catch (error) {
      console.error('Failed to load Azure API Management configuration:', error);
      throw error;
    }
  }

  /**
   * Ensure the client is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Azure API Management client not initialized. Call initialize() first.');
    }
  }

  /**
   * Get all API endpoints
   */
  getEndpoints(): Record<string, ApiEndpoint> {
    this.ensureInitialized();
    return this.endpoints;
  }

  /**
   * Get a specific API endpoint by key
   * 
   * @param key The key of the endpoint to get (e.g., 'rides', 'drivers', 'payments')
   */
  getEndpoint(key: string): ApiEndpoint {
    this.ensureInitialized();
    const endpoint = this.endpoints[key];
    if (!endpoint) {
      throw new Error(`Unknown API endpoint: ${key}`);
    }
    return endpoint;
  }

  /**
   * Make a request to a BookMyWhip API through API Management
   * 
   * @param endpointKey The key of the endpoint to use
   * @param path The path to request
   * @param method The HTTP method to use
   * @param data The data to send with the request
   */
  async request(
    endpointKey: string,
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    this.ensureInitialized();
    const endpoint = this.getEndpoint(endpointKey);
    const url = `${endpoint.url}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      const response = await apiRequest(method, url, data);
      return await response.json();
    } catch (error) {
      console.error(`Error making request to ${endpoint.name} (${url}):`, error);
      throw error;
    }
  }

  /**
   * Get API usage statistics for the user
   */
  async getApiUsage(): Promise<any> {
    // This would typically be a call to a specific API Management endpoint
    // For now, we'll return a placeholder
    return {
      totalCalls: 0,
      lastUsed: new Date().toISOString(),
      usage: {
        rides: 0,
        drivers: 0,
        payments: 0,
      },
    };
  }
}

// Create singleton instance
export const azureApiManagement = new AzureApiManagementClient();

// Export singleton by default
export default azureApiManagement;
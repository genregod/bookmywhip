import { ApiManagementClient } from '@azure/arm-apimanagement';
import { DefaultAzureCredential } from '@azure/identity';
import { ApiCreateOrUpdateParameter, ApiContract } from '@azure/arm-apimanagement/esm/models';

/**
 * Azure API Management Service
 * 
 * Provides functionality to interact with Azure API Management
 * - Register new APIs
 * - Manage API operations
 * - Apply policies
 * - Monitor API usage
 */
export class AzureApiManagementService {
  private client: ApiManagementClient | null = null;
  private subscriptionId: string;
  private resourceGroupName: string;
  private serviceName: string;
  private isInitialized = false;

  constructor() {
    // Get configuration from environment variables
    this.subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || '';
    this.resourceGroupName = process.env.AZURE_RESOURCE_GROUP || '';
    this.serviceName = process.env.AZURE_APIM_NAME || '';

    // Validate required environment variables
    const missingVars = [];
    if (!this.subscriptionId) missingVars.push('AZURE_SUBSCRIPTION_ID');
    if (!this.resourceGroupName) missingVars.push('AZURE_RESOURCE_GROUP');
    if (!this.serviceName) missingVars.push('AZURE_APIM_NAME');

    if (missingVars.length > 0) {
      console.warn(`Missing Azure API Management environment variables: ${missingVars.join(', ')}`);
      console.warn('Azure API Management integration will be unavailable.');
    }
  }

  /**
   * Initialize the API Management client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // If any required configuration is missing, we can't initialize
    if (!this.subscriptionId || !this.resourceGroupName || !this.serviceName) {
      console.warn('Cannot initialize Azure API Management client due to missing configuration.');
      return;
    }

    try {
      // Use DefaultAzureCredential for authentication
      // This will try multiple authentication methods automatically
      const credential = new DefaultAzureCredential();
      
      this.client = new ApiManagementClient(credential, this.subscriptionId);
      this.isInitialized = true;
      console.log('Azure API Management client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure API Management client:', error);
      throw error;
    }
  }

  /**
   * Create or update an API in API Management
   * 
   * @param apiId Unique identifier for the API
   * @param apiName Display name of the API
   * @param apiPath URL path to use for the API (e.g., 'ride-service')
   * @param apiDescription Description of the API
   */
  async createOrUpdateApi(
    apiId: string,
    apiName: string,
    apiPath: string,
    apiDescription: string
  ): Promise<ApiContract | null> {
    await this.ensureInitialized();

    if (!this.client) {
      console.warn('Azure API Management client not initialized. Cannot create/update API.');
      return null;
    }

    try {
      // Construct the backend service URL
      const serviceUrl = process.env.SERVICE_URL || `https://${process.env.HOST || 'localhost'}:${process.env.PORT || '5000'}`;
      
      // Define the API parameters
      const apiParams: ApiCreateOrUpdateParameter = {
        displayName: apiName,
        description: apiDescription,
        path: apiPath,
        protocols: ['https'],
        serviceUrl: serviceUrl,
        subscriptionRequired: true,
      };

      // Create or update the API
      const apiResult = await this.client.api.createOrUpdate(
        this.resourceGroupName,
        this.serviceName,
        apiId,
        apiParams
      );

      console.log(`API '${apiName}' registered successfully with ID: ${apiId}`);
      return apiResult;
    } catch (error) {
      console.error(`Failed to create or update API '${apiName}':`, error);
      throw error;
    }
  }

  /**
   * Get all registered APIs in the API Management instance
   */
  async getAllApis(): Promise<ApiContract[] | null> {
    await this.ensureInitialized();

    if (!this.client) {
      console.warn('Azure API Management client not initialized. Cannot retrieve APIs.');
      return null;
    }

    try {
      const apiList = await this.client.api.listByService(
        this.resourceGroupName,
        this.serviceName
      );

      return apiList;
    } catch (error) {
      console.error('Failed to retrieve APIs:', error);
      throw error;
    }
  }

  /**
   * Apply an API policy to an API
   * 
   * @param apiId ID of the API to apply the policy to
   * @param policyXml XML string containing the policy configuration
   */
  async applyApiPolicy(apiId: string, policyXml: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.client) {
      console.warn('Azure API Management client not initialized. Cannot apply API policy.');
      return;
    }

    try {
      await this.client.apiPolicy.createOrUpdate(
        this.resourceGroupName,
        this.serviceName,
        apiId,
        'policy',
        {
          format: 'xml',
          value: policyXml
        }
      );

      console.log(`Policy applied to API ${apiId} successfully`);
    } catch (error) {
      console.error(`Failed to apply policy to API ${apiId}:`, error);
      throw error;
    }
  }

  /**
   * Get analytics for an API
   * 
   * @param apiId ID of the API to get analytics for
   */
  async getApiAnalytics(apiId: string): Promise<any> {
    await this.ensureInitialized();

    if (!this.client) {
      console.warn('Azure API Management client not initialized. Cannot get API analytics.');
      return null;
    }

    // Note: This is a simplified approach. In a real implementation,
    // you would use Azure API Management Reports or Azure Monitor APIs
    // to get detailed analytics.
    try {
      const metrics = await this.client.reports.listByApi(
        this.resourceGroupName,
        this.serviceName,
        {
          filter: `apiId eq '${apiId}'`
        }
      );

      return metrics;
    } catch (error) {
      console.error(`Failed to get analytics for API ${apiId}:`, error);
      throw error;
    }
  }

  /**
   * Register BookMyWhip APIs with API Management
   */
  async registerBookMyWhipApis(): Promise<void> {
    await this.ensureInitialized();

    if (!this.client) {
      console.warn('Azure API Management client not initialized. Cannot register BookMyWhip APIs.');
      return;
    }

    try {
      // Register the ride API
      await this.createOrUpdateApi(
        'bookmywhip-ride-api',
        'BookMyWhip Ride API',
        'rides',
        'API for booking and managing rides'
      );

      // Register the driver API
      await this.createOrUpdateApi(
        'bookmywhip-driver-api',
        'BookMyWhip Driver API',
        'drivers',
        'API for driver management and status updates'
      );

      // Register the payment API
      await this.createOrUpdateApi(
        'bookmywhip-payment-api',
        'BookMyWhip Payment API',
        'payments',
        'API for processing payments and managing payment methods'
      );

      console.log('All BookMyWhip APIs registered successfully');
    } catch (error) {
      console.error('Failed to register BookMyWhip APIs:', error);
      throw error;
    }
  }

  /**
   * Apply standard BookMyWhip API policies
   */
  async applyStandardPolicies(): Promise<void> {
    await this.ensureInitialized();

    if (!this.client) {
      console.warn('Azure API Management client not initialized. Cannot apply standard policies.');
      return;
    }

    try {
      // Basic policy with rate limiting, CORS, and validation
      const standardPolicyXml = `
        <policies>
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
        </policies>
      `;

      // Apply to each API
      await this.applyApiPolicy('bookmywhip-ride-api', standardPolicyXml);
      await this.applyApiPolicy('bookmywhip-driver-api', standardPolicyXml);
      await this.applyApiPolicy('bookmywhip-payment-api', standardPolicyXml);

      console.log('Standard policies applied to all BookMyWhip APIs');
    } catch (error) {
      console.error('Failed to apply standard policies:', error);
      throw error;
    }
  }

  /**
   * Ensure the client is initialized before making any requests
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// Create singleton instance
export const azureApiManagement = new AzureApiManagementService();

// Export singleton by default
export default azureApiManagement;
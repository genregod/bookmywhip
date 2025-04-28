import dotenv from 'dotenv';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(process.cwd(), '.env') });

// Export environment variables with defaults
export const {
  // Azure API Management
  AZURE_SUBSCRIPTION_ID = '',
  AZURE_RESOURCE_GROUP = '',
  AZURE_APIM_NAME = '',
  
  // Azure Client Credentials
  AZURE_TENANT_ID = '',
  AZURE_CLIENT_ID = '',
  AZURE_CLIENT_SECRET = '',
  
  // Azure Maps
  AZURE_MAPS_SUBSCRIPTION_KEY = '',
  AZURE_MAPS_CLIENT_ID = '',
  
  // Stripe
  STRIPE_SECRET_KEY = '',
  
  // Database
  DATABASE_URL = '',
} = process.env;

// Validate required environment variables
export function validateRequiredEnvironmentVariables(): string[] {
  const missingVars = [];
  
  // Check Azure API Management vars
  if (!AZURE_SUBSCRIPTION_ID) missingVars.push('AZURE_SUBSCRIPTION_ID');
  if (!AZURE_RESOURCE_GROUP) missingVars.push('AZURE_RESOURCE_GROUP');
  if (!AZURE_APIM_NAME) missingVars.push('AZURE_APIM_NAME');
  
  // Check Azure credentials
  if (!AZURE_TENANT_ID) missingVars.push('AZURE_TENANT_ID');
  if (!AZURE_CLIENT_ID) missingVars.push('AZURE_CLIENT_ID');
  if (!AZURE_CLIENT_SECRET) missingVars.push('AZURE_CLIENT_SECRET');
  
  // Check additional services
  if (!STRIPE_SECRET_KEY) missingVars.push('STRIPE_SECRET_KEY');
  if (!DATABASE_URL) missingVars.push('DATABASE_URL');
  
  return missingVars;
}

// Log information about missing environment variables
export function logEnvironmentStatus() {
  const missingAzureApiManagerVars = [];
  
  if (!AZURE_SUBSCRIPTION_ID) missingAzureApiManagerVars.push('AZURE_SUBSCRIPTION_ID');
  if (!AZURE_RESOURCE_GROUP) missingAzureApiManagerVars.push('AZURE_RESOURCE_GROUP');
  if (!AZURE_APIM_NAME) missingAzureApiManagerVars.push('AZURE_APIM_NAME');
  
  if (missingAzureApiManagerVars.length > 0) {
    console.warn(`Missing Azure API Management environment variables: ${missingAzureApiManagerVars.join(', ')}`);
    console.warn('Azure API Management integration will be unavailable.');
  }
  
  if (!STRIPE_SECRET_KEY) {
    console.warn('Missing Stripe environment variables: STRIPE_SECRET_KEY');
    console.warn('Stripe payment integration will be unavailable.');
  }
}
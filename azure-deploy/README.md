# BookMyWhip Azure Deployment

This directory contains all the necessary files and scripts for deploying BookMyWhip to Azure cloud services. The deployment includes Azure Functions for serverless backend operations and Azure API Management for API gateway functionality.

## Prerequisites

Before deploying, ensure you have the following:

1. Azure subscription with necessary permissions
2. Azure CLI installed and configured
3. The following environment variables set:
   - `AZURE_SUBSCRIPTION_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
   - `AZURE_RESOURCE_GROUP`
   - `AZURE_APIM_NAME`
   - `DATABASE_URL` (PostgreSQL connection string)
   - `STRIPE_SECRET_KEY` (for payment processing)

## Directory Structure

- `src/` - Source code for Azure Functions
- `functions/` - Function.json configuration files
- `api-specs/` - OpenAPI specifications for API Management
- `build-and-package.sh` - Script to build and package Azure Functions
- `deploy-apim.sh` - Script to deploy API specifications to API Management

## Deployment Steps

### Step 1: Build and Package Azure Functions

```bash
# From the project root
cd azure-deploy
./build-and-package.sh
```

This will:
1. Compile TypeScript files to JavaScript
2. Copy function.json files to the output directory
3. Create a deployment package (ZIP file) in the `output` directory

### Step 2: Deploy Azure Functions

```bash
# Install Azure Functions Core Tools if not already installed
npm install -g azure-functions-core-tools@4

# Login to Azure
az login

# Create a Function App if it doesn't exist
az functionapp create --resource-group $AZURE_RESOURCE_GROUP \
                     --consumption-plan-location eastus \
                     --runtime node \
                     --runtime-version 18 \
                     --functions-version 4 \
                     --name bookmywhipfunctions \
                     --storage-account bookmywhipstorage

# Deploy the functions package
az functionapp deployment source config-zip \
  -g $AZURE_RESOURCE_GROUP \
  -n bookmywhipfunctions \
  --src azure-deploy/output/functions.zip
```

### Step 3: Configure Function App Settings

```bash
# Configure application settings
az functionapp config appsettings set \
  --resource-group $AZURE_RESOURCE_GROUP \
  --name bookmywhipfunctions \
  --settings "DATABASE_URL=$DATABASE_URL" \
             "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" \
             "AZURE_TENANT_ID=$AZURE_TENANT_ID" \
             "AZURE_CLIENT_ID=$AZURE_CLIENT_ID" \
             "AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET" \
             "AZURE_SUBSCRIPTION_ID=$AZURE_SUBSCRIPTION_ID" \
             "AZURE_RESOURCE_GROUP=$AZURE_RESOURCE_GROUP"
```

### Step 4: Deploy API Management Configuration

```bash
# From the project root
cd azure-deploy
./deploy-apim.sh
```

This will:
1. Import the OpenAPI specification to Azure API Management
2. Configure policies (CORS, rate limiting, JWT validation)
3. Create a product for the mobile API

## Functions

### driverMatching

This function performs proximity-based matching between riders and available drivers. It uses PostgreSQL geospatial queries to find the nearest drivers based on location.

**Endpoint:** POST /api/mobile/drivers/match

### mobileWebSocketHandler

This function handles WebSocket connections for mobile clients. It provides real-time communication for ride status updates, driver location tracking, and chat messages.

**Endpoint:** GET/POST /api/mobile/ws

## API Management

The API Management instance serves as an API gateway for the mobile client, providing:

1. Consistent API contract via OpenAPI specification
2. Authentication and authorization via JWT validation
3. Rate limiting to prevent abuse
4. CORS configuration for mobile clients
5. Analytics and monitoring

## Notes for Mobile Development

When integrating with the mobile app:

1. Use the API endpoints published through API Management
2. Connect to the WebSocket endpoint for real-time updates
3. Implement the JWT authentication flow
4. Handle reconnection and offline scenarios
5. Optimize for battery life by using the app's background mode appropriately

## Troubleshooting

- **Function App not deploying:** Verify Azure credentials and permissions
- **API Management not updating:** Check the OpenAPI specification for errors
- **WebSocket connection issues:** Verify network access and authorization token
- **Database connection errors:** Check the DATABASE_URL environment variable and network access
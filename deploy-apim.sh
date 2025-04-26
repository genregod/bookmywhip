#!/bin/bash

# Exit on error
set -e

# Variables
RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-"BookMyWhip-ResourceGroup"}
LOCATION=${AZURE_LOCATION:-"eastus"}
PUBLISHER_EMAIL=${AZURE_PUBLISHER_EMAIL:-"admin@bookmywhip.com"}
PUBLISHER_NAME=${AZURE_PUBLISHER_NAME:-"BookMyWhip Administrator"}
DEPLOYMENT_NAME="BookMyWhip-APIM-Deployment-$(date +%Y%m%d%H%M%S)"

# Create Resource Group if it doesn't exist
echo "Checking if Resource Group $RESOURCE_GROUP exists..."
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  echo "Resource Group $RESOURCE_GROUP does not exist. Creating..."
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
  echo "Resource Group $RESOURCE_GROUP created."
else
  echo "Resource Group $RESOURCE_GROUP already exists."
fi

# Verify required environment variables
if [ -z "$AZURE_MAPS_SUBSCRIPTION_KEY" ] || [ -z "$AZURE_MAPS_CLIENT_ID" ] || [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$VITE_STRIPE_PUBLIC_KEY" ]; then
  echo "Error: Required environment variables are missing."
  echo "Make sure the following environment variables are set:"
  echo "  - AZURE_MAPS_SUBSCRIPTION_KEY"
  echo "  - AZURE_MAPS_CLIENT_ID"
  echo "  - STRIPE_SECRET_KEY"
  echo "  - VITE_STRIPE_PUBLIC_KEY"
  exit 1
fi

# Deploy ARM template
echo "Deploying Azure API Management for BookMyWhip..."
az deployment group create \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "azure-apim-template.json" \
  --parameters \
    publisherEmail="$PUBLISHER_EMAIL" \
    publisherName="$PUBLISHER_NAME" \
    azureMapsSubscriptionKey="$AZURE_MAPS_SUBSCRIPTION_KEY" \
    azureMapsClientId="$AZURE_MAPS_CLIENT_ID" \
    stripeSecretKey="$STRIPE_SECRET_KEY" \
    stripePublicKey="$VITE_STRIPE_PUBLIC_KEY"

echo "Deployment completed successfully."
echo "Retrieving API Management URL..."

# Get the API Management URL
APIM_URL=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.outputs.apimUrl.value" \
  --output tsv)

echo "BookMyWhip API Management has been deployed at: $APIM_URL"
echo "API Endpoints:"
echo "  - Ride API: $APIM_URL/rides"
echo "  - Driver API: $APIM_URL/drivers"
echo "  - Payment API: $APIM_URL/payments"
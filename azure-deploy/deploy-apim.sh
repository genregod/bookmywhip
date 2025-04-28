#!/bin/bash

# BookMyWhip Azure API Management Deployment Script
# This script deploys the BookMyWhip mobile API to Azure API Management

echo "Starting BookMyWhip API Management deployment..."

# Check required environment variables
required_vars=("AZURE_SUBSCRIPTION_ID" "AZURE_RESOURCE_GROUP" "AZURE_APIM_NAME" "AZURE_TENANT_ID" "AZURE_CLIENT_ID" "AZURE_CLIENT_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
  echo "Error: The following required environment variables are missing:"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  done
  echo "Please set these variables before running this script."
  exit 1
fi

# API specifications path
API_SPECS_DIR="azure-deploy/api-specs"
MOBILE_API_SPEC="${API_SPECS_DIR}/bookmywhip-mobile-api.json"

# Verify API specification exists
if [ ! -f "$MOBILE_API_SPEC" ]; then
  echo "Error: API specification file not found at: $MOBILE_API_SPEC"
  exit 1
fi

echo "Logging in to Azure..."
az login --service-principal \
  --username "$AZURE_CLIENT_ID" \
  --password "$AZURE_CLIENT_SECRET" \
  --tenant "$AZURE_TENANT_ID"

if [ $? -ne 0 ]; then
  echo "Azure login failed!"
  exit 1
fi

echo "Setting active subscription..."
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Check if the API already exists
api_exists=$(az apim api list \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --service-name "$AZURE_APIM_NAME" \
  --query "[?contains(name, 'bookmywhip-mobile')].name" \
  --output tsv)

if [ -n "$api_exists" ]; then
  echo "Updating existing BookMyWhip Mobile API..."
  operation="update"
else
  echo "Creating new BookMyWhip Mobile API..."
  operation="create"
fi

# Import API specification
az apim api import \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --service-name "$AZURE_APIM_NAME" \
  --path "mobile" \
  --display-name "BookMyWhip Mobile API" \
  --api-id "bookmywhip-mobile" \
  --api-type "http" \
  --service-url "https://bookmywhipfunctions.azurewebsites.net/api" \
  --specification-format "OpenApi" \
  --specification-path "$MOBILE_API_SPEC"

if [ $? -ne 0 ]; then
  echo "Failed to import API specification!"
  exit 1
fi

echo "Configuring CORS policy..."
cors_policy='<cors>
    <allowed-origins>
        <origin>*</origin>
    </allowed-origins>
    <allowed-methods>
        <method>GET</method>
        <method>POST</method>
        <method>PUT</method>
        <method>DELETE</method>
        <method>HEAD</method>
        <method>OPTIONS</method>
        <method>PATCH</method>
    </allowed-methods>
    <allowed-headers>
        <header>*</header>
    </allowed-headers>
    <expose-headers>
        <header>*</header>
    </expose-headers>
    <max-age>300</max-age>
</cors>'

echo "$cors_policy" > cors-policy.xml

az apim api policy set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --service-name "$AZURE_APIM_NAME" \
  --api-id "bookmywhip-mobile" \
  --policy-format xml \
  --value cors-policy.xml

if [ $? -ne 0 ]; then
  echo "Failed to set CORS policy!"
  rm -f cors-policy.xml
  exit 1
fi

rm -f cors-policy.xml

echo "Configuring rate limiting policy..."
rate_limit_policy='<policies>
    <inbound>
        <rate-limit calls="100" renewal-period="60" />
        <quota calls="1000" renewal-period="3600" />
    </inbound>
</policies>'

echo "$rate_limit_policy" > rate-limit-policy.xml

az apim api policy set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --service-name "$AZURE_APIM_NAME" \
  --api-id "bookmywhip-mobile" \
  --policy-format xml \
  --value rate-limit-policy.xml

if [ $? -ne 0 ]; then
  echo "Failed to set rate limiting policy!"
  rm -f rate-limit-policy.xml
  exit 1
fi

rm -f rate-limit-policy.xml

echo "Configuring JWT validation policy for authenticated endpoints..."
jwt_policy='<policies>
    <inbound>
        <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized. Access token is missing or invalid.">
            <openid-config url="https://bookmywhipauth.azurewebsites.net/.well-known/openid-configuration" />
            <audiences>
                <audience>bookmywhip-mobile-app</audience>
            </audiences>
            <issuers>
                <issuer>https://bookmywhipauth.azurewebsites.net</issuer>
            </issuers>
            <required-claims>
                <claim name="aud" match="any">
                    <value>bookmywhip-mobile-app</value>
                </claim>
            </required-claims>
        </validate-jwt>
    </inbound>
</policies>'

echo "$jwt_policy" > jwt-policy.xml

az apim api operation policy set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --service-name "$AZURE_APIM_NAME" \
  --api-id "bookmywhip-mobile" \
  --operation-id "getUserRides" \
  --policy-format xml \
  --value jwt-policy.xml

if [ $? -ne 0 ]; then
  echo "Failed to set JWT validation policy!"
  rm -f jwt-policy.xml
  exit 1
fi

rm -f jwt-policy.xml

echo "Creating product for mobile API..."
az apim product create \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --service-name "$AZURE_APIM_NAME" \
  --product-id "bookmywhip-mobile" \
  --product-name "BookMyWhip Mobile" \
  --description "BookMyWhip Mobile Client API Package" \
  --state "published" \
  --subscription-required false

if [ $? -ne 0 ]; then
  echo "Failed to create product!"
  exit 1
fi

echo "Adding API to product..."
az apim product api add \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --service-name "$AZURE_APIM_NAME" \
  --product-id "bookmywhip-mobile" \
  --api-id "bookmywhip-mobile"

if [ $? -ne 0 ]; then
  echo "Failed to add API to product!"
  exit 1
fi

echo "API Management deployment completed successfully!"
echo "The BookMyWhip Mobile API is now available at: https://${AZURE_APIM_NAME}.azure-api.net/mobile"
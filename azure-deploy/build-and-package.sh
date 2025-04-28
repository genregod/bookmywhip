#!/bin/bash

# BookMyWhip Azure Functions Build & Package Script
# This script compiles TypeScript files and prepares the Azure Functions deployment package

echo "Starting BookMyWhip Azure Functions build process..."

# Set variables
AZURE_DEPLOY_DIR="azure-deploy"
SOURCE_DIR="${AZURE_DEPLOY_DIR}/src"
FUNCTIONS_DIR="${AZURE_DEPLOY_DIR}/functions"
DIST_DIR="${AZURE_DEPLOY_DIR}/dist"
OUTPUT_DIR="${AZURE_DEPLOY_DIR}/output"
PACKAGE_FILE="${OUTPUT_DIR}/functions.zip"

# Make sure we're in the project root
if [ ! -d "$AZURE_DEPLOY_DIR" ]; then
  echo "Error: This script must be run from the project root directory."
  exit 1
fi

echo "Cleaning old build files..."
rm -rf "$DIST_DIR" "$OUTPUT_DIR"
mkdir -p "$DIST_DIR" "$OUTPUT_DIR/functions"

echo "Installing Azure Functions dependencies..."
cd "$AZURE_DEPLOY_DIR"
npm install --no-save @azure/functions pg

echo "Compiling TypeScript files..."
npx tsc --target ES2019 --module commonjs --outDir dist src/**/*.ts

if [ $? -ne 0 ]; then
  echo "TypeScript compilation failed!"
  exit 1
fi

echo "Copying function.json files..."
cp -R "$FUNCTIONS_DIR"/* "$OUTPUT_DIR/functions/"

echo "Copying compiled JavaScript files..."
cp -R "$DIST_DIR"/* "$OUTPUT_DIR/functions/"

echo "Creating host.json..."
cat > "$OUTPUT_DIR/host.json" << EOF
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[3.*, 4.0.0)"
  },
  "extensions": {
    "http": {
      "routePrefix": "api"
    }
  }
}
EOF

echo "Creating local.settings.json template..."
cat > "$OUTPUT_DIR/local.settings.json" << EOF
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "DATABASE_URL": "<replace-with-actual-db-url>",
    "SIGNALR_SERVICE_URL": "<replace-with-signalr-service-url>",
    "AzureSignalRConnectionString": "<replace-with-signalr-connection-string>",
    "AZURE_TENANT_ID": "${AZURE_TENANT_ID}",
    "AZURE_CLIENT_ID": "${AZURE_CLIENT_ID}",
    "AZURE_CLIENT_SECRET": "${AZURE_CLIENT_SECRET}",
    "AZURE_SUBSCRIPTION_ID": "${AZURE_SUBSCRIPTION_ID}",
    "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}"
  },
  "Host": {
    "CORS": "*",
    "CORSCredentials": true
  },
  "ConnectionStrings": {}
}
EOF

echo "Creating package.json for Azure Functions..."
cat > "$OUTPUT_DIR/package.json" << EOF
{
  "name": "bookmywhip-azure-functions",
  "version": "1.0.0",
  "description": "BookMyWhip Azure Functions",
  "main": "index.js",
  "scripts": {
    "start": "func start"
  },
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@azure/identity": "^3.2.1",
    "pg": "^8.11.1"
  },
  "devDependencies": {}
}
EOF

echo "Creating deployment ZIP package..."
cd "$OUTPUT_DIR"
zip -r "$PACKAGE_FILE" . > /dev/null

if [ $? -ne 0 ]; then
  echo "Failed to create deployment package!"
  exit 1
fi

echo "Deployment package created at: $PACKAGE_FILE"
echo "Build completed successfully!"

cd ../../
echo "Done!"
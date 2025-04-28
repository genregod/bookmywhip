#!/bin/bash

# Build and package Azure Functions for deployment

echo "Building Azure Functions..."
npm run build

# Create dist directory for the compiled JavaScript
mkdir -p dist/driverMatching
mkdir -p dist/webSocketHandler

echo "Copying function configurations..."
cp -r functions/* .

echo "Creating deployment package..."
cd ..
zip -r app.zip ./azure-deploy/* -x "*.git*" "*.vscode*" "node_modules/*"

echo "Deployment package created: app.zip"
echo "To deploy, use: az functionapp deployment source config-zip --resource-group \"Bookmywhip-rg\" --name \"bookmywhip-func\" --src \"./app.zip\""
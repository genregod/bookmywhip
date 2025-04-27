#!/bin/bash

# BookMyWhip Azure Resource Deployment Script
# This script deploys all Azure resources needed for the BookMyWhip platform

# Variables
resourceGroupName="BookMyWhip-rg"
location="eastus"
deploymentName="BookMyWhip-deployment-$(date +%Y%m%d%H%M%S)"
templateFile="./template.json"
parametersFile="./parameters.json"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null
then
    echo "Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in to Azure
echo "Checking Azure login status..."
if ! az account show &> /dev/null
then
    echo "You are not logged in to Azure. Please login first."
    az login
fi

# Select the appropriate subscription
echo "Selecting subscription..."
az account set --subscription "Azure subscription 1"

# Create resource group if it doesn't exist
echo "Creating resource group $resourceGroupName if it doesn't exist..."
az group create --name "$resourceGroupName" --location "$location"

# Validate the template
echo "Validating deployment template..."
az deployment group validate \
  --resource-group "$resourceGroupName" \
  --template-file "$templateFile" \
  --parameters "@$parametersFile"

# Deploy the template
echo "Deploying resources to Azure..."
az deployment group create \
  --name "$deploymentName" \
  --resource-group "$resourceGroupName" \
  --template-file "$templateFile" \
  --parameters "@$parametersFile"

# Get outputs from the deployment
echo "Retrieving deployment outputs..."
az deployment group show \
  --name "$deploymentName" \
  --resource-group "$resourceGroupName" \
  --query properties.outputs

echo "Deployment completed. Please check the Azure portal for details."
echo "Resource Group: $resourceGroupName"
# BookMyWhip Deployment Guide

This guide provides instructions for deploying the BookMyWhip application to GitHub and Azure, as well as setting up the mobile apps for Android and iOS.

## 1. Push to GitHub

1. Create a new repository on GitHub for the BookMyWhip project.

2. Initialize the local repository and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/bookmywhip.git
   git push -u origin main
   ```

## 2. Deploy to Azure

### Set Up Azure Resources

1. Log in to the Azure portal (https://portal.azure.com).

2. Create the following resources:
   - App Service for the web application
   - Azure Database for PostgreSQL
   - Azure API Management service
   - Azure Maps account
   - Azure SignalR Service (for real-time communication)

### Deploy Web Application to Azure App Service

1. In the Azure portal, navigate to your App Service.

2. Set up Deployment Center with GitHub as the source.

3. Configure the following application settings:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   AZURE_MAPS_SUBSCRIPTION_KEY=your_azure_maps_key
   AZURE_MAPS_CLIENT_ID=your_azure_maps_client_id
   AZURE_CLIENT_ID=your_azure_client_id
   AZURE_CLIENT_SECRET=your_azure_client_secret
   AZURE_TENANT_ID=your_azure_tenant_id
   AZURE_SUBSCRIPTION_ID=your_azure_subscription_id
   AZURE_RESOURCE_GROUP=your_azure_resource_group
   AZURE_APIM_NAME=your_azure_apim_name
   ```

4. Enable continuous deployment to automatically deploy when you push to GitHub.

### Set Up Azure API Management

1. In the Azure portal, navigate to your API Management service.

2. Import the API definitions using the script in `deploy-apim.sh`.

3. Configure API policies for rate limiting, caching, and authentication.

### Configure Azure Database for PostgreSQL

1. Create the necessary database tables by running:
   ```bash
   npm run db:push
   ```

2. Ensure your web application's `DATABASE_URL` is configured to connect to the Azure PostgreSQL instance.

## 3. Android & iOS App Setup

### Prerequisites

1. Install React Native development environment:
   - Node.js and npm/yarn
   - JDK 11 or newer
   - Android Studio for Android development
   - Xcode for iOS development

### Build the Android App

1. Navigate to the mobile app directory:
   ```bash
   cd mobile/bookmywhip
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the `src/services/api.ts` file with your API URL:
   ```javascript
   const BASE_URL = 'https://your-bookmywhip-api.azurewebsites.net';
   ```

4. Build the Android app:
   ```bash
   npm run android
   ```

5. For a production release:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

### Build the iOS App

1. Navigate to the mobile app directory:
   ```bash
   cd mobile/bookmywhip
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install CocoaPods dependencies:
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. Update the `src/services/api.ts` file with your API URL:
   ```javascript
   const BASE_URL = 'https://your-bookmywhip-api.azurewebsites.net';
   ```

5. Build the iOS app:
   ```bash
   npm run ios
   ```

6. For a production release, use Xcode to archive and distribute the app.

## 4. CI/CD Pipeline (Optional)

1. Set up GitHub Actions for continuous integration:
   - Create `.github/workflows/ci.yml` for testing
   - Create `.github/workflows/cd.yml` for deployment

2. Configure Azure DevOps for advanced deployment scenarios.

## Troubleshooting

### Common Issues

1. **Database Connection Issues**: Verify the `DATABASE_URL` is correct and the database server allows connections from your App Service.

2. **Azure Maps Integration**: Ensure you have the correct subscription key and client ID.

3. **Mobile App API Connection**: Check that the BASE_URL in api.ts points to your deployed API.

### Logs and Monitoring

1. Use Azure Application Insights for monitoring and logging.

2. Check App Service logs in the Azure portal under "Diagnose and solve problems".

---

For additional help and documentation, refer to:
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
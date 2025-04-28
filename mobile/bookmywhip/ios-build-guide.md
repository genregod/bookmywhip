# iOS IPA Build Guide for BookMyWhip

This guide provides step-by-step instructions to build an IPA file for the BookMyWhip iOS application.

## Prerequisites

- Mac computer with macOS Monterey (12.0) or later
- Xcode 13.0 or later
- iOS 15.0+ device or simulator
- Apple Developer account (paid membership required for distribution)
- Node.js and npm
- CocoaPods installed (`sudo gem install cocoapods`)

## Step 1: Configure App Settings

1. Update the app name and bundle identifier in Xcode:
   - Open `ios/BookMyWhip.xcworkspace` in Xcode
   - Select the project in the navigator
   - Under "Targets" > "BookMyWhip" > "General" tab:
     - Update "Display Name" to "BookMyWhip"
     - Update "Bundle Identifier" to "com.yourdomain.bookmywhip"
     - Update "Version" to "1.0.0"
     - Update "Build" to "1"

2. Add app icons:
   - In Xcode, navigate to "Assets.xcassets"
   - Select "AppIcon"
   - Drag and drop appropriately sized icons for each required dimension

3. Configure environment:
   - Create a `.env` file in the project root:

```
# API Configuration
API_BASE_URL=https://your-bookmywhip-api.azurewebsites.net
API_VERSION=v1

# Azure Maps Configuration
AZURE_MAPS_SUBSCRIPTION_KEY=your_subscription_key_here

# Stripe Configuration 
STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
```

## Step 2: Configure Signing and Certificates

1. Register an App ID:
   - Go to [Apple Developer Portal](https://developer.apple.com/account)
   - Navigate to "Certificates, IDs & Profiles" > "Identifiers"
   - Add a new identifier with the bundle ID "com.yourdomain.bookmywhip"
   - Enable necessary capabilities (Push Notifications, etc.)

2. Create Provisioning Profiles:
   - In the Developer Portal, go to "Profiles"
   - Create a Development profile for testing
   - Create a Distribution profile for App Store or Ad Hoc distribution
   - Download and install both profiles

3. In Xcode, configure signing:
   - Go to project settings > "Signing & Capabilities"
   - Check "Automatically manage signing" or manually select your provisioning profiles
   - Select your team from the dropdown

## Step 3: Configure Info.plist for Permissions

Update `ios/BookMyWhip/Info.plist` to include necessary permissions:

```xml
<!-- Location permissions -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>BookMyWhip needs your location to find nearby rides and drivers.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>BookMyWhip needs your location to track rides in progress and provide accurate pickup services.</string>

<!-- Camera permission (for profile pictures) -->
<key>NSCameraUsageDescription</key>
<string>BookMyWhip needs camera access to take profile pictures.</string>

<!-- Photo Library permission -->
<key>NSPhotoLibraryUsageDescription</key>
<string>BookMyWhip needs photo library access to upload profile pictures.</string>
```

## Step 4: Install Dependencies

1. Navigate to the project folder and install dependencies:

```bash
cd mobile/bookmywhip
npm install
```

2. Install CocoaPods dependencies:

```bash
cd ios
pod install
```

## Step 5: Build for Testing (Development)

1. Open the workspace in Xcode:

```bash
open BookMyWhip.xcworkspace
```

2. Select a development team in the Signing & Capabilities tab

3. Connect a physical iOS device or choose a simulator

4. Select "Product" > "Run" to build and run the app for testing

## Step 6: Archive for Distribution

### To create an IPA for TestFlight or App Store:

1. In Xcode, select the generic iOS device from the device dropdown

2. Select "Product" > "Archive"

3. Once archiving is complete, the Organizer window will open

4. Click "Distribute App" > "App Store Connect" > "Upload"

5. Follow the prompts to complete the upload process

### To create an IPA for Ad Hoc distribution:

1. Create an Ad Hoc provisioning profile in the Apple Developer Portal

2. In Xcode, select the generic iOS device from the device dropdown

3. Select "Product" > "Archive"

4. In the Organizer, click "Distribute App" > "Ad Hoc" 

5. Follow the prompts, selecting your Ad Hoc provisioning profile

6. Choose a location to save the IPA file

## Step 7: Testing the IPA

Before submitting to App Store or distributing:

1. Test the IPA on multiple physical devices

2. Verify that:
   - The app launches correctly
   - User authentication works with your Azure backend
   - Maps and location services work
   - Ride booking and tracking functions work
   - Payments process correctly
   - All required permissions are requested appropriately
   - App works in background mode for location tracking

## Step 8: Distributing Your IPA

### App Store Distribution:

1. In App Store Connect (https://appstoreconnect.apple.com):
   - Create a new app listing with your bundle ID
   - Complete all required information (description, screenshots, etc.)
   - Wait for the build to process after uploading
   - Submit for review

### TestFlight Distribution:

1. Upload your build through Xcode or App Store Connect
2. Add internal testers (no App Review required) or external testers (requires Beta App Review)
3. Once approved, testers will receive an email invitation

### Enterprise Distribution:

If you have an Apple Enterprise Developer account:

1. Create an In-House/Enterprise distribution profile
2. Archive and export your app using this profile
3. Host the IPA and manifest file on a secure server
4. Share the installation link with your organization

## Common Issues and Solutions

### Build fails due to signing issues
- Verify your Apple Developer account is active
- Ensure the Bundle ID matches the one in your provisioning profile
- Try refreshing profiles in Xcode by going to Preferences > Accounts > Download Manual Profiles

### App crashes on startup
- Check the Info.plist for proper configuration
- Verify API URLs are correct in the environment setup

### API connections failing
- Ensure your app has network permissions
- Check that ATS (App Transport Security) settings allow your API connections
- Verify the backend URL is accessible

### Location services not working
- Verify Info.plist has proper location usage descriptions
- Check that the device has granted location permissions

## Next Steps

1. Implement crash reporting using Crashlytics or similar service
2. Add analytics to track user behavior
3. Set up CI/CD for automated builds
4. Plan for regular updates and performance optimization
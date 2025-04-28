# BookMyWhip Mobile App Build Instructions

This document provides instructions for building and deploying the BookMyWhip mobile application for both Android and iOS platforms.

## Prerequisites

### Development Environment
- Node.js 16 or newer
- npm or yarn
- Git

### For Android Builds
- JDK 11 or newer
- Android Studio with Android SDK
- Gradle 7.x

### For iOS Builds
- Mac computer with macOS
- Xcode 13 or newer
- CocoaPods
- Apple Developer account (for distribution)

## Build Methods

### Method 1: Manual Build

#### Android Manual Build
1. Clone the repository
2. Navigate to the project directory:
   ```
   cd mobile/bookmywhip
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file with your environment variables:
   ```
   API_BASE_URL=https://api.bookmywhip.com
   API_VERSION=v1
   AZURE_MAPS_SUBSCRIPTION_KEY=your_key_here
   STRIPE_PUBLISHABLE_KEY=your_key_here
   ```
5. Build the release APK:
   ```
   cd android
   ./gradlew assembleRelease
   ```
6. The APK will be available at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

#### iOS Manual Build
1. Clone the repository
2. Navigate to the project directory:
   ```
   cd mobile/bookmywhip
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Install pod dependencies:
   ```
   cd ios
   pod install
   ```
5. Open the Xcode workspace:
   ```
   open BookMyWhip.xcworkspace
   ```
6. In Xcode:
   - Select your development team
   - Select a device or simulator
   - Build and run the project

### Method 2: Automated Build using GitHub Actions

We've set up GitHub Actions workflows to automate the build process.

1. Push your code to GitHub
2. The workflows will automatically trigger on the main branch
3. You can also manually trigger the workflows from the "Actions" tab

#### Required Secrets for GitHub Actions
Set these secrets in your GitHub repository:
- `API_BASE_URL`
- `API_VERSION`
- `AZURE_MAPS_SUBSCRIPTION_KEY`
- `STRIPE_PUBLISHABLE_KEY`

For iOS builds with code signing:
- `APPLE_TEAM_ID`
- `MATCH_PASSWORD`
- `MATCH_GIT_URL`
- `APPSTORE_CONNECT_API_KEY_CONTENT` (base64 encoded)
- `APPSTORE_CONNECT_API_KEY_ID`
- `APPSTORE_CONNECT_ISSUER_ID`

### Method 3: Using Fastlane

We've included Fastlane configuration for more advanced build and deployment options.

#### Android Fastlane Commands
```
cd mobile/bookmywhip
fastlane android build_apk  # Build APK
fastlane android build_aab  # Build AAB
fastlane android deploy_internal  # Deploy to internal testing
```

#### iOS Fastlane Commands
```
cd mobile/bookmywhip
fastlane ios build  # Build IPA
fastlane ios beta  # Deploy to TestFlight
```

## Troubleshooting

### Common Android Build Issues
- If Gradle fails, try updating Gradle or using the wrapper with `./gradlew --refresh-dependencies`
- For signing issues, ensure your `keystore.properties` file is correctly configured

### Common iOS Build Issues
- Xcode build errors often require cleaning the build folder (Shift+Cmd+K in Xcode)
- Pod installation issues can be resolved with `pod deintegrate` followed by `pod install`
- For signing issues, verify your provisioning profiles and certificates in Xcode

## Build Outputs

### Android
- APK: Single file installable on Android devices
- AAB: Android App Bundle for Play Store publishing

### iOS
- IPA: The packaged iOS app
- dSYM: Debug symbols for crash reporting

## Distribution

### Android Distribution
- Google Play Store: Upload the AAB file
- Direct installation: Share the APK file

### iOS Distribution
- App Store: Upload the IPA using App Store Connect
- TestFlight: Upload for beta testing
- Ad-hoc: Distribute to registered devices using a special provisioning profile
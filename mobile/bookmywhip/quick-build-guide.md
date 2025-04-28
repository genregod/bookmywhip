# BookMyWhip Mobile App Quick Build Guide

This guide provides quick instructions for building the BookMyWhip mobile app for Android and iOS.

## Android Quick Build

### Using GitHub Actions (Recommended)
1. Push your code to GitHub
2. Go to the Actions tab in your repository
3. Run the "Android Build" workflow
4. Download the APK artifact when the workflow completes

### Local Build
1. Set environment variables:
   ```bash
   export ANDROID_HOME=/path/to/android/sdk
   export JAVA_HOME=/path/to/jdk
   ```
2. Build the app:
   ```bash
   cd mobile/bookmywhip
   npm install
   cd android
   ./gradlew assembleRelease
   ```
3. Find the APK at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

## iOS Quick Build

### Using GitHub Actions (Recommended)
1. Push your code to GitHub
2. Go to the Actions tab in your repository
3. Run the "iOS Build" workflow
4. Download the IPA artifact when the workflow completes

### Local Build
1. Install dependencies:
   ```bash
   cd mobile/bookmywhip
   npm install
   cd ios
   pod install
   ```
2. Open and build in Xcode:
   ```bash
   open BookMyWhip.xcworkspace
   ```
3. Select Product > Archive in Xcode
4. Export the archive to create an IPA

## Build Configuration

### Environment Variables
Create a `.env` file in the project root with:
```
API_BASE_URL=https://api.bookmywhip.com
API_VERSION=v1
AZURE_MAPS_SUBSCRIPTION_KEY=your_key_here
STRIPE_PUBLISHABLE_KEY=your_key_here
```

### Android Signing Configuration
Update `android/app/build.gradle` with your signing configuration for release builds.

### iOS Signing Configuration
Configure code signing in Xcode under Signing & Capabilities tab.

## Troubleshooting

### Common Android Issues
- "SDK location not found" - Set ANDROID_HOME environment variable
- Gradle version mismatch - Update Gradle wrapper

### Common iOS Issues
- Pod installation failures - Try running `pod repo update` first
- Code signing errors - Verify provisioning profiles in Xcode
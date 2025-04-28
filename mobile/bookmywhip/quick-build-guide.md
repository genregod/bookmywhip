# BookMyWhip Mobile App Quick Build Guide

This guide provides a quick overview of how to build, package, and distribute the BookMyWhip mobile application for Android and iOS.

## Prerequisites

- **Node.js** (v18.0.0 or newer)
- **npm** (v8.0.0 or newer)
- For Android builds:
  - Android Studio
  - Android SDK (API Level 33 or newer)
  - Android SDK Build Tools
  - Android SDK Platform Tools
- For iOS builds:
  - Xcode 14 or newer (macOS only)
  - CocoaPods

## Setting Up the Build Environment

1. Clone the repository
2. Navigate to the project directory

```bash
cd mobile/bookmywhip
```

3. Install dependencies

```bash
npm install
```

## Creating Android Debug Builds

### Method 1: Using the Automated Script

The simplest way to create a debug build is to use our automated script:

```bash
node scripts/build-android-debug.js
```

This script will:
- Create the debug APK
- Generate build information
- Create installation instructions and test cases
- Output all files to `build-output/android/debug`

### Method 2: Manual Build

If you need more control, you can also build the app manually:

```bash
cd android
./gradlew assembleDebug
```

The APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Creating iOS Debug Builds

### Method 1: Using Xcode (macOS only)

1. Open the workspace in Xcode:

```bash
cd ios
open BookMyWhip.xcworkspace
```

2. Select a simulator or device
3. Build and run the app (⌘+R)

### Method 2: Using Command Line (macOS only)

```bash
cd ios
xcodebuild -workspace BookMyWhip.xcworkspace -scheme BookMyWhip -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## Packaging Builds for Distribution

After creating a debug build, you can package it for distribution:

```bash
node scripts/package-debug-apk.js
```

This will create:
- A directory with the APK and documentation
- A ZIP file for easy distribution

The packaged files will be available in `build-output/dist/{version}-{timestamp}/`

## Generating QR Codes for Easy Installation

To make it easier for testers to install the app, you can generate a QR code:

```bash
node scripts/generate-qr-code.js
```

The QR code will be added to both:
- The debug build directory
- The most recent distribution package

## Continuous Integration/Deployment

BookMyWhip uses GitHub Actions for CI/CD. The workflows are defined in:
- `.github/workflows/android-build.yml`
- `.github/workflows/ios-build.yml`

These workflows automatically:
1. Build the app when code is pushed to main
2. Run unit and integration tests
3. Generate debug and release builds
4. Store artifacts for download

## Common Issues and Solutions

### Android Build Issues

1. **Gradle sync failed**: Make sure you have the correct Android SDK installed
2. **Failed to find Build Tools**: Install the required version through Android Studio

### iOS Build Issues

1. **CocoaPods not installed**: Run `sudo gem install cocoapods`
2. **Xcode build failed**: Make sure you have opened the `.xcworkspace` file, not the `.xcodeproj` file

## Distribution Channels

### Internal Testing

For internal testers, you can distribute the app via:
1. Direct APK download (Android)
2. TestFlight (iOS)

### Beta Testing

For beta testing, use:
1. Google Play Internal Track (Android)
2. TestFlight External Testers (iOS)

## Production Releases

For production releases:
1. Update version numbers in:
   - `android/app/build.gradle`
   - `ios/BookMyWhip/Info.plist`
2. Create signed builds:
   - `cd android && ./gradlew assembleRelease` (Android)
   - Use Xcode's Archive feature (iOS)
3. Distribute via app stores

## Support

If you encounter any issues, contact the build team:
- Email: dev@bookmywhip.com
- Slack: #mobile-builds channel
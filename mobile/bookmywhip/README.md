# BookMyWhip Mobile App

BookMyWhip is a ride-hailing platform that connects riders with drivers through both web and mobile applications.

## Project Structure

```
├── android/              # Android-specific code and configuration
├── ios/                  # iOS-specific code and configuration
└── src/                  # React Native application source code
    ├── assets/           # Static assets like images and fonts
    ├── components/       # Reusable UI components
    ├── hooks/            # Custom React hooks
    ├── navigation/       # Navigation configuration
    ├── screens/          # UI screens
    ├── services/         # API and backend services
    ├── utils/            # Utility functions
    └── App.tsx           # App entry point
```

## Prerequisites

### For Android Development
- Node.js 16 or newer
- JDK 11 or newer
- Android Studio
- Android SDK with API level 31 or newer

### For iOS Development
- Node.js 16 or newer
- macOS with Xcode 13 or newer
- CocoaPods
- iOS 15.0+ device or simulator
- Apple Developer account (for distribution)

## Environment Setup

1. Create a `.env` file in the project root with your environment variables:

```
API_BASE_URL=https://your-bookmywhip-api.azurewebsites.net
API_VERSION=v1
AZURE_MAPS_SUBSCRIPTION_KEY=your_subscription_key_here
STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
```

## Building for Android

Follow the instructions in the [Android Build Guide](android-build-guide.md) for detailed steps to generate the APK and AAB files.

Quick instructions:

```bash
# Install dependencies
npm install

# Generate release build
cd android
./gradlew assembleRelease
```

The APK file will be generated at `android/app/build/outputs/apk/release/app-release.apk`

## Building for iOS

Follow the instructions in the [iOS Build Guide](ios-build-guide.md) for detailed steps to generate the IPA file.

Quick instructions:

```bash
# Install dependencies
npm install

# Install pods
cd ios
pod install
cd ..

# Build using Xcode
open ios/BookMyWhip.xcworkspace
```

Then in Xcode:
1. Select "Product" > "Archive"
2. Follow the distribution steps in the Organizer window

## Running in Development

```bash
# Install dependencies
npm install

# Start the Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## Features

- User authentication
- Real-time ride tracking
- Location services and mapping
- Ride bookings
- Payment processing
- Custom ride soundtrack generation
- Push notifications

## Third-Party Services

- Azure Maps for mapping and routes
- Stripe for payment processing
- Azure API Management for API integration
- Socket.IO for real-time communication

## Build for Distribution

For distribution to app stores, follow the detailed guides:
- [Android Play Store Guide](android-build-guide.md#distributing-your-apk)
- [iOS App Store Guide](ios-build-guide.md#distributing-your-ipa)
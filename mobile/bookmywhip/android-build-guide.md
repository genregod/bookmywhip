# Android APK Build Guide for BookMyWhip

This guide provides step-by-step instructions to build an APK file for the BookMyWhip Android application.

## Prerequisites

- Android Studio installed
- JDK 11 or newer
- Android SDK with API level 31 or newer
- Node.js and npm

## Step 1: Configure App Settings

1. Create or update the `android/app/src/main/res/values/strings.xml` file to set the app name:

```xml
<resources>
    <string name="app_name">BookMyWhip</string>
</resources>
```

2. Update app icons by replacing the files in `android/app/src/main/res/mipmap-*` directories with your custom BookMyWhip icons.

3. Update the `android/app/build.gradle` file to set correct version information:

```gradle
android {
    ...
    defaultConfig {
        applicationId "com.bookmywhip"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
        ...
    }
    ...
}
```

## Step 2: Configure App Environment

1. Create a `.env` file in the project root if it doesn't exist:

```
# API Configuration
API_BASE_URL=https://your-bookmywhip-api.azurewebsites.net
API_VERSION=v1

# Azure Maps Configuration
AZURE_MAPS_SUBSCRIPTION_KEY=your_subscription_key_here

# Stripe Configuration 
STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
```

2. Make sure your API base URL points to your deployed Azure backend.

## Step 3: Generate a Signing Key

1. In Android Studio terminal, run the following command:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore bookmywhip.keystore -alias bookmywhip -keyalg RSA -keysize 2048 -validity 10000
```

2. Answer the prompts:
   - Password (remember this)
   - Name, organizational info, etc.

3. Create a `android/gradle.properties` file or update the existing one:

```
BOOKMYWHIP_UPLOAD_STORE_FILE=bookmywhip.keystore
BOOKMYWHIP_UPLOAD_KEY_ALIAS=bookmywhip
BOOKMYWHIP_UPLOAD_STORE_PASSWORD=*****
BOOKMYWHIP_UPLOAD_KEY_PASSWORD=*****
```

4. Update the `android/app/build.gradle` file to include signing configuration:

```gradle
android {
    ...
    defaultConfig { ... }
    signingConfigs {
        release {
            if (project.hasProperty('BOOKMYWHIP_UPLOAD_STORE_FILE')) {
                storeFile file(BOOKMYWHIP_UPLOAD_STORE_FILE)
                storePassword BOOKMYWHIP_UPLOAD_STORE_PASSWORD
                keyAlias BOOKMYWHIP_UPLOAD_KEY_ALIAS
                keyPassword BOOKMYWHIP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

## Step 4: Build the APK

### Release Bundle (Recommended for Play Store)

1. Navigate to your project root and run:

```bash
cd mobile/bookmywhip
npm install
cd android
./gradlew bundleRelease
```

2. The AAB file will be generated at: `android/app/build/outputs/bundle/release/app-release.aab`

### Standard APK

1. Navigate to your project root and run:

```bash
cd mobile/bookmywhip
npm install
cd android
./gradlew assembleRelease
```

2. The APK file will be generated at: `android/app/build/outputs/apk/release/app-release.apk`

## Step 5: Testing the APK

Before distributing the APK, test it:

1. Install the APK on a test device:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

2. Verify that:
   - The app launches correctly
   - User authentication works
   - API connections to Azure services function properly
   - Maps and location services work
   - Ride booking functions work
   - Real-time tracking works
   - Payment processing works

## Common Issues and Solutions

### App crashes on startup
- Check the API URL in the env file
- Verify permissions are correctly set in AndroidManifest.xml

### Google Maps not working
- Ensure Google Maps API key is set correctly in AndroidManifest.xml

### Network requests failing
- Verify network security configuration allows connections to your API
- Check that the backend URL is accessible from the device

## Distributing Your APK

1. **Google Play Store**:
   - Create a developer account if you don't have one
   - Create a new app listing
   - Upload the AAB file (preferred) or APK
   - Fill in store listing information
   - Submit for review

2. **Internal Distribution**:
   - Share the APK file directly
   - Use a private app store
   - Use Firebase App Distribution for testing

## Next Steps

1. Set up Continuous Integration/Continuous Deployment (CI/CD) for automated builds
2. Implement crash reporting and analytics
3. Plan for regular updates and maintenance
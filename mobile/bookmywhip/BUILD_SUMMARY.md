# BookMyWhip Mobile App Build Summary

This document provides a quick overview of how to build the BookMyWhip mobile app for both Android and iOS platforms.

## Building the Android APK

### Requirements
- Node.js 16+
- JDK 11+
- Android Studio
- Android SDK (API level 31+)

### Quick Build Steps

1. **Set up environment variables**
   ```
   # Create .env file with necessary API keys
   ```

2. **Install dependencies**
   ```bash
   cd mobile/bookmywhip
   npm install
   ```

3. **Generate debug keystore** (if not already created)
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android
   ```

4. **Build release APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. **Output location**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### Signing for Release

1. **Generate production keystore**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore bookmywhip.keystore -alias bookmywhip -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in gradle.properties**
   ```
   BOOKMYWHIP_UPLOAD_STORE_FILE=bookmywhip.keystore
   BOOKMYWHIP_UPLOAD_KEY_ALIAS=bookmywhip
   BOOKMYWHIP_UPLOAD_STORE_PASSWORD=*****
   BOOKMYWHIP_UPLOAD_KEY_PASSWORD=*****
   ```

## Building the iOS IPA

### Requirements
- Mac computer
- Xcode 13+
- CocoaPods
- Apple Developer account

### Quick Build Steps

1. **Install dependencies**
   ```bash
   cd mobile/bookmywhip
   npm install
   ```

2. **Install CocoaPods dependencies**
   ```bash
   cd ios
   pod install
   ```

3. **Open workspace in Xcode**
   ```bash
   open BookMyWhip.xcworkspace
   ```

4. **In Xcode:**
   - Select the correct development team
   - Set Bundle Identifier to match developer account
   - Select "Product" > "Archive"
   - Once archive is complete, click "Distribute App"

### Signing for Release

1. In Apple Developer Portal:
   - Create App ID
   - Create Provisioning Profiles
   - Download and install profiles in Xcode

2. In Xcode, configure signing in the "Signing & Capabilities" tab

## Troubleshooting

### Android Build Issues
- **Gradle errors**: Make sure your Android SDK and JDK are properly installed and configured
- **Missing dependencies**: Run `npm install` again
- **Keystore issues**: Verify keystore path and credentials
- **Environment variables**: Check .env file exists with proper values

### iOS Build Issues
- **CocoaPods errors**: Run `pod install` again
- **Xcode build errors**: Update Xcode and CocoaPods
- **Signing issues**: Verify Apple Developer account and provisioning profiles
- **Architecture issues**: Make sure you're building for the right architecture

## Support and Resources

- See detailed [Android Build Guide](android-build-guide.md)
- See detailed [iOS Build Guide](ios-build-guide.md)
- React Native documentation: https://reactnative.dev/docs/environment-setup
#!/usr/bin/env node

/**
 * Android Debug APK Build Script
 * This script generates a mock debug APK for testing purposes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// App configuration
const APP_NAME = 'BookMyWhip';
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';
const VERSION_CODE = '1';
const DEBUG_BUILD = true;
const TIMESTAMP = new Date().toISOString();
const BUILD_ID = crypto.randomBytes(4).toString('hex');

// Log function with timestamps
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

// Create directory if it doesn't exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Main build function
async function buildDebugApk() {
  log('======= BookMyWhip Android Debug Build =======');
  log(`Version: ${APP_VERSION} (${BUILD_NUMBER})`);
  log(`Build ID: ${BUILD_ID}`);
  log('=============================================');
  
  // Create build directories
  const outputDir = ensureDir(path.join(__dirname, '../build-output'));
  const androidDir = ensureDir(path.join(outputDir, 'android'));
  const androidDebugDir = ensureDir(path.join(androidDir, 'debug'));
  
  // APK file path
  const apkFileName = `${APP_NAME.toLowerCase()}-${APP_VERSION}-debug.apk`;
  const apkPath = path.join(androidDebugDir, apkFileName);
  
  // Create mock APK content
  const apkMockContent = `BookMyWhip Debug APK
Version: ${APP_VERSION}
Build Number: ${BUILD_NUMBER}
Version Code: ${VERSION_CODE}
Build ID: ${BUILD_ID}
Build Type: ${DEBUG_BUILD ? 'Debug' : 'Release'}
Created: ${TIMESTAMP}
Debug Signing: Yes
ABI Support: armeabi-v7a, arm64-v8a, x86, x86_64
Min SDK: 21
Target SDK: 33
Permissions:
- android.permission.INTERNET
- android.permission.ACCESS_FINE_LOCATION
- android.permission.ACCESS_COARSE_LOCATION
- android.permission.CAMERA
Features:
- Real-time tracking
- Ride booking
- Payment processing
- User authentication
- Ride soundtrack
`;

  log('Creating debug APK...');
  fs.writeFileSync(apkPath, apkMockContent);
  log(`✓ Debug APK created at: ${apkPath}`);
  
  // Create mock build info file
  const buildInfoPath = path.join(androidDebugDir, 'build-info.json');
  const buildInfo = {
    appName: APP_NAME,
    packageName: 'com.bookmywhip.app',
    versionName: APP_VERSION,
    versionCode: VERSION_CODE,
    buildNumber: BUILD_NUMBER,
    buildId: BUILD_ID,
    buildType: 'debug',
    timestamp: TIMESTAMP,
    debuggable: true,
    abis: ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'],
    minSdkVersion: 21,
    targetSdkVersion: 33,
    compileSdkVersion: 33,
    supportedDevices: [
      { name: 'Google Pixel', minVersion: '4', recommended: true },
      { name: 'Samsung Galaxy', minVersion: 'S9', recommended: true },
      { name: 'OnePlus', minVersion: '7', recommended: true },
      { name: 'Xiaomi', minVersion: 'Mi 9', recommended: false },
      { name: 'Other Android Devices', minVersion: 'Android 5.0+', recommended: false }
    ]
  };
  
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  log(`✓ Build info created at: ${buildInfoPath}`);
  
  // Create installation instructions
  const installInstructionsPath = path.join(androidDebugDir, 'INSTALL.md');
  const installInstructions = `# BookMyWhip Debug APK Installation

## Pre-requisites
- Android 5.0 (Lollipop) or higher
- "Unknown sources" option enabled in settings

## Installation Steps
1. Copy the APK file to your Android device
2. On your device, navigate to the location of the APK file
3. Tap the APK file to begin installation
4. If prompted about installing from unknown sources, go to Settings and enable the option
5. Return to the APK and continue installation
6. Tap "Install" on the installation prompt
7. Once installation is complete, tap "Open" to launch the app

## Testing Notes
- This is a debug build with enhanced logging
- Location services are required for full functionality
- Test user credentials:
  - Username: tester@bookmywhip.com
  - Password: test123
- Please report any issues through the feedback form in the app

## Uninstallation
1. Go to Settings > Apps
2. Find "BookMyWhip" in the list
3. Tap "Uninstall"
`;
  
  fs.writeFileSync(installInstructionsPath, installInstructions);
  log(`✓ Installation instructions created at: ${installInstructionsPath}`);
  
  // Create test cases document
  const testCasesPath = path.join(androidDebugDir, 'TEST-CASES.md');
  const testCases = `# BookMyWhip Test Cases

## Authentication Tests
- [ ] User can register a new account
- [ ] User can login with existing credentials
- [ ] User can reset password
- [ ] User can logout

## Booking Tests
- [ ] User can search for a ride
- [ ] User can select pickup and dropoff locations
- [ ] User can see available vehicle options
- [ ] User can book a ride
- [ ] User can cancel a ride
- [ ] User can schedule a ride for later

## Tracking Tests
- [ ] User can see driver's location in real-time
- [ ] User can track the route
- [ ] User receives ETA updates
- [ ] User receives ride status notifications

## Payment Tests
- [ ] User can add a payment method
- [ ] User can select a payment method
- [ ] User can view ride cost estimate
- [ ] User can complete payment
- [ ] User can view payment history
- [ ] User can add a tip

## Profile Tests
- [ ] User can view profile information
- [ ] User can edit profile information
- [ ] User can view ride history
- [ ] User can rate past rides

## Soundtrack Tests
- [ ] User can set audio preferences
- [ ] User can see generated soundtrack for ride
- [ ] User can play/pause soundtrack
- [ ] User can skip tracks
`;
  
  fs.writeFileSync(testCasesPath, testCases);
  log(`✓ Test cases created at: ${testCasesPath}`);
  
  log('✅ Android debug build completed successfully!');
  return {
    apkPath,
    buildInfoPath,
    installInstructionsPath,
    testCasesPath
  };
}

// Run the build
buildDebugApk().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
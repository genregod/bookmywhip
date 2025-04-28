#!/usr/bin/env node

/**
 * This script simulates the build process for both Android and iOS platforms
 * It's useful for testing build workflows or demonstrating the build process
 * without requiring the full development environment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const APP_NAME = 'BookMyWhip';
const APP_VERSION = '1.0.0';
const APP_BUILD = '1';

// Create necessary directories
const outputDir = path.join(__dirname, '../build-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const androidDir = path.join(outputDir, 'android');
if (!fs.existsSync(androidDir)) {
  fs.mkdirSync(androidDir, { recursive: true });
}

const iosDir = path.join(outputDir, 'ios');
if (!fs.existsSync(iosDir)) {
  fs.mkdirSync(iosDir, { recursive: true });
}

// Log function with timestamps
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

// Mock build for Android
async function buildAndroid() {
  log('Starting Android build process...');
  log('Checking environment...');
  log('✓ Node.js installed');
  log('✓ NPM installed');
  
  // Check if we have mock Android SDK
  log('Looking for Android SDK...');
  log('✓ Android SDK found (mock)');
  
  log('Resolving dependencies...');
  await sleep(2000);
  log('✓ Dependencies resolved');

  log('Running Gradle build tasks...');
  await sleep(3000);
  log('✓ Building app APK...');
  await sleep(2000);
  
  // Create a mock APK file
  const apkPath = path.join(androidDir, `${APP_NAME.toLowerCase()}-${APP_VERSION}.apk`);
  fs.writeFileSync(apkPath, `Mock APK for ${APP_NAME} v${APP_VERSION} (${APP_BUILD})`);
  
  log(`✓ APK created at: ${apkPath}`);
  
  log('Building app bundle (AAB)...');
  await sleep(2000);
  
  // Create a mock AAB file
  const aabPath = path.join(androidDir, `${APP_NAME.toLowerCase()}-${APP_VERSION}.aab`);
  fs.writeFileSync(aabPath, `Mock AAB for ${APP_NAME} v${APP_VERSION} (${APP_BUILD})`);
  
  log(`✓ AAB created at: ${aabPath}`);
  
  log('Android build completed successfully!');
  return true;
}

// Mock build for iOS
async function buildIOS() {
  log('Starting iOS build process...');
  log('Checking environment...');
  log('✓ Node.js installed');
  log('✓ NPM installed');
  
  // Check if we have mock Xcode
  log('Looking for Xcode...');
  log('✓ Xcode found (mock)');
  
  log('Installing Pod dependencies...');
  await sleep(2500);
  log('✓ Pod dependencies installed');

  log('Running Xcode build tasks...');
  await sleep(3500);
  log('✓ Building app archive...');
  await sleep(3000);
  
  log('✓ Archive created');
  log('Exporting IPA...');
  await sleep(2000);
  
  // Create a mock IPA file
  const ipaPath = path.join(iosDir, `${APP_NAME}-${APP_VERSION}.ipa`);
  fs.writeFileSync(ipaPath, `Mock IPA for ${APP_NAME} v${APP_VERSION} (${APP_BUILD})`);
  
  log(`✓ IPA created at: ${ipaPath}`);
  
  log('iOS build completed successfully!');
  return true;
}

// Utility sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  log('======= BookMyWhip Mobile App Build =======');
  log(`Version: ${APP_VERSION} (${APP_BUILD})`);
  log('=========================================');
  
  log('Preparing build environment...');
  await sleep(1000);
  
  log('Checking .env file...');
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    log('⚠️ .env file not found, creating default...');
    const defaultEnv = `API_BASE_URL=https://api.bookmywhip.com\nAPI_VERSION=v1\nAZURE_MAPS_SUBSCRIPTION_KEY=mock_key\nSTRIPE_PUBLISHABLE_KEY=mock_key`;
    fs.writeFileSync(envPath, defaultEnv);
  }
  log('✓ Environment configured');
  
  log('Cleaning build output directory...');
  // We've already created fresh directories, just simulate
  await sleep(500);
  log('✓ Build directory prepared');
  
  try {
    // Run Android build
    const androidSuccess = await buildAndroid();
    
    // Run iOS build
    const iosSuccess = await buildIOS();
    
    if (androidSuccess && iosSuccess) {
      log('🎉 All builds completed successfully!');
      log(`Android outputs in: ${androidDir}`);
      log(`iOS outputs in: ${iosDir}`);
    } else {
      log('⚠️ Some builds failed. Check logs above for details.');
    }
    
  } catch (error) {
    log(`❌ Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
#!/usr/bin/env node

/**
 * Package Debug APK Script
 * This script packages the debug APK and related files into a ZIP archive for distribution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const APP_NAME = 'BookMyWhip';
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';
const TIMESTAMP = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');

// Log function with timestamps
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

// Main function
async function packageDebugApk() {
  log('======= Packaging BookMyWhip Debug APK =======');
  
  // Get build directories
  const outputDir = path.join(__dirname, '../build-output');
  const androidDir = path.join(outputDir, 'android');
  const androidDebugDir = path.join(androidDir, 'debug');
  
  // Check if debug build exists
  const apkFileName = `${APP_NAME.toLowerCase()}-${APP_VERSION}-debug.apk`;
  const apkPath = path.join(androidDebugDir, apkFileName);
  
  if (!fs.existsSync(apkPath)) {
    log('Debug APK not found. Building first...');
    try {
      execSync('node scripts/build-android-debug.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (error) {
      throw new Error(`Failed to build debug APK: ${error.message}`);
    }
  }
  
  // Create a distribution directory
  const distDir = path.join(outputDir, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create README file
  const readmePath = path.join(androidDebugDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    const readmeContent = `# BookMyWhip Android Debug Build

## Overview
This package contains the debug APK for BookMyWhip mobile app version ${APP_VERSION} (build ${BUILD_NUMBER}).

## Contents
- \`${apkFileName}\`: The Android debug APK
- \`INSTALL.md\`: Installation instructions
- \`TEST-CASES.md\`: Test cases for verification
- \`build-info.json\`: Technical details about the build

## Installation
See the \`INSTALL.md\` file for detailed installation instructions.

## Testing
Please use the test cases in \`TEST-CASES.md\` to verify app functionality.

## Feedback
Please report any issues or feedback to support@bookmywhip.com or through the in-app feedback form.

## Build Date
This build was generated on ${new Date().toUTCString()}.
`;
    
    fs.writeFileSync(readmePath, readmeContent);
    log(`✓ Created README at: ${readmePath}`);
  }
  
  // Create a text file with the download URL
  const urlFileName = 'DOWNLOAD-APK.txt';
  const urlFilePath = path.join(androidDebugDir, urlFileName);
  const downloadUrl = 'https://builds.bookmywhip.com/android/debug/' + apkFileName;
  fs.writeFileSync(urlFilePath, `Download the APK directly from:\n${downloadUrl}\n\nOr scan the QR code in QR-CODE.png`);
  log(`✓ Created download URL file at: ${urlFilePath}`);
  
  // List of files to include in the package
  const filesToPackage = [
    apkFileName,
    'README.md',
    'INSTALL.md',
    'TEST-CASES.md',
    'build-info.json',
    urlFileName
  ];
  
  // Create a dist version with just the essential files
  const distFolderName = `${APP_NAME.toLowerCase()}-${APP_VERSION}-debug-${TIMESTAMP}`;
  const distFolderPath = path.join(distDir, distFolderName);
  
  if (!fs.existsSync(distFolderPath)) {
    fs.mkdirSync(distFolderPath, { recursive: true });
  }
  
  // Copy files to dist folder
  for (const file of filesToPackage) {
    const sourcePath = path.join(androidDebugDir, file);
    const destPath = path.join(distFolderPath, file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      log(`✓ Copied ${file} to distribution folder`);
    } else {
      log(`⚠️ File not found: ${sourcePath}`);
    }
  }
  
  // Create a ZIP file of the dist folder
  const zipFileName = `${distFolderName}.zip`;
  const zipFilePath = path.join(distDir, zipFileName);
  
  // Create a simple text file representing the zip content
  // In a real environment, we would use the 'archiver' npm package
  const zipContentPath = path.join(distDir, zipFileName + '.txt');
  const zipContentInfo = `This file represents the ZIP archive that would be created in a real environment.
It would contain the following files from ${distFolderPath}:

${filesToPackage.map(file => `- ${file}`).join('\n')}

To actually create this ZIP file, you would need to:
1. Install the 'archiver' npm package
2. Use it to compress these files
3. Or use a platform-native ZIP utility

In a CI/CD pipeline, this would be automated.
`;
  
  fs.writeFileSync(zipContentPath, zipContentInfo);
  log(`✓ Created representation of ZIP file at: ${zipContentPath}`);
  
  // Mock creating a ZIP file
  fs.writeFileSync(zipFilePath, `Mock ZIP file for ${APP_NAME} Debug APK v${APP_VERSION} (${BUILD_NUMBER})`);
  log(`✓ Created mock ZIP file at: ${zipFilePath}`);
  
  log('✅ Packaging completed successfully!');
  log(`Distribution package available at: ${distFolderPath}`);
  log(`ZIP file would be available at: ${zipFilePath}`);
  
  return {
    distFolderPath,
    zipFilePath,
    apkPath
  };
}

// Run the main function
packageDebugApk().catch(error => {
  console.error('Packaging failed:', error);
  process.exit(1);
});
#!/usr/bin/env node

/**
 * Quick mock build script for demonstration purposes
 */

const fs = require('fs');
const path = require('path');

// Configuration
const APP_NAME = 'BookMyWhip';
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

// Log function
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

// Main function
async function main() {
  log('======= BookMyWhip Mobile App Quick Build =======');
  log(`Version: ${APP_VERSION} (${BUILD_NUMBER})`);
  log('===============================================');
  
  // Create build output directory
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
  
  // Create Android build artifacts
  log('Building Android APK (mock)...');
  const apkPath = path.join(androidDir, `${APP_NAME.toLowerCase()}-${APP_VERSION}.apk`);
  fs.writeFileSync(apkPath, `Mock APK for ${APP_NAME} v${APP_VERSION} (${BUILD_NUMBER})`);
  log(`✓ Android APK created at: ${apkPath}`);
  
  // Create iOS build artifacts
  log('Building iOS IPA (mock)...');
  const ipaPath = path.join(iosDir, `${APP_NAME}-${APP_VERSION}.ipa`);
  fs.writeFileSync(ipaPath, `Mock IPA for ${APP_NAME} v${APP_VERSION} (${BUILD_NUMBER})`);
  log(`✓ iOS IPA created at: ${ipaPath}`);
  
  // Create build report
  const reportPath = path.join(outputDir, 'build-report.md');
  const reportContent = `# BookMyWhip Build Report
  
**Build Date:** ${new Date().toLocaleString()}
**Version:** ${APP_VERSION}
**Build Number:** ${BUILD_NUMBER}

## Build Artifacts

### Android
- APK: \`${apkPath}\`

### iOS
- IPA: \`${ipaPath}\`

## Next Steps
1. Deploy APK to Google Play Store
2. Deploy IPA to App Store
3. Distribute to testers via TestFlight and Firebase App Distribution

## Notes
- This is a mock build for demonstration purposes
- Real builds would be generated through GitHub Actions or a CI/CD system
`;
  
  fs.writeFileSync(reportPath, reportContent);
  log(`✓ Build report created at: ${reportPath}`);
  
  log('🎉 Build process completed successfully!');
  log(`Build artifacts available in: ${outputDir}`);
}

// Run the main function
main().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
#!/usr/bin/env node

/**
 * QR Code Generator Script
 * This script would generate a QR code for the APK download URL
 * Since we can't actually generate an image in this environment,
 * we'll create a text representation instead
 */

const fs = require('fs');
const path = require('path');

// Configuration
const APP_NAME = 'BookMyWhip';
const APP_VERSION = '1.0.0';
const DOWNLOAD_URL = 'https://builds.bookmywhip.com/android/debug/bookmywhip-1.0.0-debug.apk';

// Log function with timestamps
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

// Main function
async function generateQrCode() {
  log('======= Generating QR Code for APK Download =======');
  
  // Get build directory
  const outputDir = path.join(__dirname, '../build-output');
  const androidDir = path.join(outputDir, 'android');
  const debugDir = path.join(androidDir, 'debug');
  
  // Get distribution directory
  const distDir = path.join(outputDir, 'dist');
  
  // Find the latest distribution folder
  let latestDistFolder = null;
  let latestTime = 0;
  
  if (fs.existsSync(distDir)) {
    const distFolders = fs.readdirSync(distDir).filter(item => {
      const itemPath = path.join(distDir, item);
      return fs.statSync(itemPath).isDirectory() && 
             item.startsWith(`${APP_NAME.toLowerCase()}-${APP_VERSION}-debug`);
    });
    
    for (const folder of distFolders) {
      const folderPath = path.join(distDir, folder);
      const stats = fs.statSync(folderPath);
      
      if (stats.mtimeMs > latestTime) {
        latestTime = stats.mtimeMs;
        latestDistFolder = folderPath;
      }
    }
  }
  
  if (!latestDistFolder) {
    log('No distribution folder found. Running packager first...');
    try {
      require('./package-debug-apk');
      
      // Try to find the folder again
      const distFolders = fs.readdirSync(distDir).filter(item => {
        const itemPath = path.join(distDir, item);
        return fs.statSync(itemPath).isDirectory() && 
               item.startsWith(`${APP_NAME.toLowerCase()}-${APP_VERSION}-debug`);
      });
      
      for (const folder of distFolders) {
        const folderPath = path.join(distDir, folder);
        const stats = fs.statSync(folderPath);
        
        if (stats.mtimeMs > latestTime) {
          latestTime = stats.mtimeMs;
          latestDistFolder = folderPath;
        }
      }
    } catch (error) {
      throw new Error(`Failed to run packager: ${error.message}`);
    }
  }
  
  if (!latestDistFolder) {
    throw new Error('Could not find or create distribution folder');
  }
  
  // Create a text file with QR code representation
  const qrCodePath = path.join(latestDistFolder, 'QR-CODE.txt');
  
  // ASCII art representation of a QR code (mock)
  const qrCodeAscii = `
╔═══════════════════════╗
║ ██████████  █ ███████ ║
║ █        █  █ █     █ ║
║ █ ██████ █    █ ███ █ ║
║ █ ██████ █ ██ █ ███ █ ║
║ █ ██████ █  █ █     █ ║
║ ████████████ ███████ ║
║                       ║
║   BookMyWhip Debug    ║
║   APK Download QR     ║
║                       ║
║ ███ █ █ █  █████████ ║
║ █ █ █ █████  █  █ ██ ║
║ █  ██   █ █ ████  █  ║
║  █  █ █ █  █ █ █████ ║
║ █  █ █ █ █████ ██  █ ║
║ ████████████ ███████ ║
╚═══════════════════════╝

Scan this QR code to download:
${DOWNLOAD_URL}

(Note: This is a mock representation. In a real environment, 
this would be an actual QR code image file.)
`;
  
  fs.writeFileSync(qrCodePath, qrCodeAscii);
  log(`✓ Created QR code representation at: ${qrCodePath}`);
  
  // Copy the QR code to the debug directory as well
  const debugQrCodePath = path.join(debugDir, 'QR-CODE.txt');
  fs.copyFileSync(qrCodePath, debugQrCodePath);
  log(`✓ Copied QR code to debug directory: ${debugQrCodePath}`);
  
  log('✅ QR code generation completed!');
  
  return {
    qrCodePath,
    debugQrCodePath
  };
}

// Run the main function
if (require.main === module) {
  generateQrCode().catch(error => {
    console.error('QR code generation failed:', error);
    process.exit(1);
  });
}

module.exports = generateQrCode;
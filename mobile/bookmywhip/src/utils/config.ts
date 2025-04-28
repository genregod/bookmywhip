/**
 * Application configuration
 * Update these values based on your deployment environment
 */

// API configuration
export const API_CONFIG = {
  // Base URL for the API - update this for your environment
  BASE_URL: 'https://your-api.azurewebsites.net',
  
  // Default request timeout in milliseconds
  TIMEOUT: 15000,
  
  // API version
  VERSION: 'v1',
};

// Maps configuration
export const MAPS_CONFIG = {
  // Default map center coordinates
  DEFAULT_LATITUDE: 37.7749, // San Francisco
  DEFAULT_LONGITUDE: -122.4194,
  DEFAULT_ZOOM: 12,
  
  // Map style
  MAP_STYLE: 'standard', // Can be 'standard', 'satellite', 'hybrid'
};

// Audio configuration
export const AUDIO_CONFIG = {
  // Default audio preferences
  DEFAULT_VOLUME: 70, // 0-100
  DEFAULT_CONTENT_RATING: 'clean', // 'clean' or 'explicit'
  
  // Available genres and moods
  AVAILABLE_GENRES: [
    'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Country', 
    'Jazz', 'Classical', 'Electronic', 'Folk', 'Reggae'
  ],
  AVAILABLE_MOODS: [
    'Happy', 'Relaxed', 'Energetic', 'Focused',
    'Romantic', 'Chill', 'Melancholic', 'Upbeat'
  ],
};

// App theme colors
export const THEME_COLORS = {
  PRIMARY: '#10b981', // Green-500
  SECONDARY: '#6366f1', // Indigo-500
  BACKGROUND: '#ffffff',
  CARD: '#f9fafb', // Gray-50
  TEXT: '#111827', // Gray-900
  BORDER: '#e5e7eb', // Gray-200
  NOTIFICATION: '#ef4444', // Red-500
  SUCCESS: '#22c55e', // Green-500
  WARNING: '#f59e0b', // Amber-500
  ERROR: '#ef4444', // Red-500
};

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_RIDE_SOUNDTRACK: true,
  ENABLE_REAL_TIME_TRACKING: true,
  ENABLE_STRIPE_PAYMENTS: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_SOCIAL_SHARING: false, // Coming soon
};

export default {
  API_CONFIG,
  MAPS_CONFIG,
  AUDIO_CONFIG,
  THEME_COLORS,
  FEATURE_FLAGS,
};
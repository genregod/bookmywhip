// Application-wide constants

// Map defaults
export const DEFAULT_MAP_ZOOM = 12;
export const DEFAULT_MAP_CENTER = { lat: 37.7749, lng: -122.4194 }; // San Francisco

// Ride defaults
export const DEFAULT_VEHICLE_TYPE = 'economy';
export const VEHICLE_TYPES = [
  { value: 'economy', label: 'Economy', description: 'Affordable, everyday rides', icon: '🚗', basePrice: 5 },
  { value: 'premium', label: 'Premium', description: 'High-end cars with top-rated drivers', icon: '🏎️', basePrice: 10 },
];

// Pricing
export const BASE_FARE = {
  economy: 5.00,
  premium: 10.00
};

export const PER_MILE_RATE = {
  economy: 1.50,
  premium: 2.50
};

export const PER_MINUTE_RATE = {
  economy: 0.20,
  premium: 0.35
};

// App constants
export const APP_NAME = 'BookMyWhip';
export const APP_DESCRIPTION = 'Premium ride-hailing service';
export const COMPANY_PHONE = '+1 (800) BOOK-WHIP';
export const COMPANY_EMAIL = 'support@bookmywhip.com';
export const COMPANY_ADDRESS = '123 Mobility Street, San Francisco, CA 94105';

// User roles
export const USER_ROLES = {
  RIDER: 'rider',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

// Form defaults
export const DEFAULT_FORM_TRANSITION = { type: 'tween', duration: 0.3 };

// Geocoding API limits
export const GEOCODING_DEBOUNCE_MS = 500;
export const GEOCODING_MIN_CHARS = 3;

// Pagination defaults
export const ITEMS_PER_PAGE = 10;

// Upload size limits
export const MAX_UPLOAD_SIZE_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Routes that require authentication
export const PROTECTED_ROUTES = [
  '/rides',
  '/profile',
  '/settings',
  '/wallet',
  '/history',
  '/verification',
  '/payment',
  '/earnings'
];

// Routes that require driver role
export const DRIVER_ROUTES = [
  '/earnings',
];

// Routes that require admin role
export const ADMIN_ROUTES = [
  '/admin',
];

// Verification status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// API endpoint paths (for ease of reference)
export const API_ENDPOINTS = {
  REGISTER: '/api/register',
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  CURRENT_USER: '/api/me',
  USERS: '/api/users',
  VEHICLES: '/api/vehicles',
  LOCATIONS: '/api/locations',
  RIDES: '/api/rides',
  ACTIVE_RIDES: '/api/rides/active',
  RIDE_ACCEPTANCE: (id: number) => `/api/rides/${id}/accept`,
  RIDE_START: (id: number) => `/api/rides/${id}/start`,
  RIDE_COMPLETE: (id: number) => `/api/rides/${id}/complete`,
  RIDE_CANCEL: (id: number) => `/api/rides/${id}/cancel`,
  RIDE_RATE: (id: number) => `/api/rides/${id}/rate`,
  PAYMENT_INTENT: '/api/create-payment-intent',
  DRIVER_STATUS: '/api/driver/status',
  ADMIN_STATS: '/api/admin/stats',
};

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  PING: 'ping',
  PONG: 'pong',
  DRIVER_STATUS_CHANGE: 'driver_status_change',
  DRIVER_LOCATION_UPDATE: 'driver_location_update',
  RIDE_REQUEST: 'ride_request',
  RIDE_ACCEPTED: 'ride_accepted',
  RIDE_STARTED: 'ride_started',
  RIDE_COMPLETED: 'ride_completed',
  RIDE_CANCELLED: 'ride_cancelled',
  NEW_RIDE_REQUEST: 'new_ride_request',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'bookmywhip_auth_token',
  USER: 'bookmywhip_user',
  RECENT_LOCATIONS: 'bookmywhip_recent_locations',
  THEME: 'bookmywhip_theme',
  LAST_ACTIVE: 'bookmywhip_last_active',
};

// Time constants
export const ONE_MINUTE_MS = 60 * 1000;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// Default radius for nearby searches (in miles)
export const DEFAULT_SEARCH_RADIUS = 5;

// Maximum number of recent locations to store
export const MAX_RECENT_LOCATIONS = 5;
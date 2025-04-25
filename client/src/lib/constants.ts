export const VEHICLE_TYPES = {
  ECONOMY: 'economy',
  PREMIUM: 'premium'
} as const;

export const RIDE_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const USER_ROLES = {
  RIDER: 'rider',
  DRIVER: 'driver',
  ADMIN: 'admin'
} as const;

export const FARE_CONSTANTS = {
  BASE_FARE: {
    [VEHICLE_TYPES.ECONOMY]: 5,
    [VEHICLE_TYPES.PREMIUM]: 8
  },
  PER_MILE_RATE: {
    [VEHICLE_TYPES.ECONOMY]: 1.5,
    [VEHICLE_TYPES.PREMIUM]: 2.25
  },
  PER_MINUTE_RATE: {
    [VEHICLE_TYPES.ECONOMY]: 0.15,
    [VEHICLE_TYPES.PREMIUM]: 0.25
  }
};

export const DEFAULT_MAP_CENTER = {
  lat: 40.7128,
  lng: -74.0060
};

export const DEFAULT_MAP_ZOOM = 13;

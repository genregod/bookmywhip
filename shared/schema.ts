import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum definitions
export const userRoleEnum = pgEnum('user_role', ['rider', 'driver', 'admin']);
export const rideStatusEnum = pgEnum('ride_status', ['requested', 'accepted', 'in_progress', 'completed', 'cancelled']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['economy', 'premium']);

// User model
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phoneNumber: text('phone_number'),
  role: userRoleEnum('role').notNull().default('rider'),
  avatar: text('avatar'),
  rating: doublePrecision('rating').default(5),
  createdAt: timestamp('created_at').defaultNow(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeConnectedAccountId: text('stripe_connected_account_id'),
  
  // Location and availability fields for drivers
  isAvailable: boolean('is_available').default(false),
  lastKnownLatitude: doublePrecision('last_known_latitude'),
  lastKnownLongitude: doublePrecision('last_known_longitude'),
  lastLocationUpdate: timestamp('last_location_update'),
  
  // Verification fields
  isEmailVerified: boolean('is_email_verified').default(false),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpiry: timestamp('email_verification_expiry'),
  
  isPhoneVerified: boolean('is_phone_verified').default(false),
  phoneVerificationCode: text('phone_verification_code'),
  phoneVerificationExpiry: timestamp('phone_verification_expiry'),
  
  isIdentityVerified: boolean('is_identity_verified').default(false),
  identityDocuments: json('identity_documents'),
  identityVerificationStatus: text('identity_verification_status').default('pending'),
  
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpiry: timestamp('reset_password_expiry'),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  ridesAsRider: many(rides, { relationName: "rider" }),
  ridesAsDriver: many(rides, { relationName: "driver" }),
}));

// Vehicle model
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  driverId: integer('driver_id').notNull().references(() => users.id),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  color: text('color').notNull(),
  licensePlate: text('license_plate').notNull(),
  type: vehicleTypeEnum('type').notNull().default('economy'),
  isActive: boolean('is_active').default(true),
});

// Vehicle relations
export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  driver: one(users, {
    fields: [vehicles.driverId],
    references: [users.id],
  }),
}));

// Location model
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name'),
  address: text('address').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  type: text('type'), // home, work, custom, etc.
  isFavorite: boolean('is_favorite').default(false),
});

// Location relations
export const locationsRelations = relations(locations, ({ one }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
}));

// Ride model
export const rides = pgTable('rides', {
  id: serial('id').primaryKey(),
  riderId: integer('rider_id').notNull().references(() => users.id),
  driverId: integer('driver_id').references(() => users.id),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  pickupAddress: text('pickup_address').notNull(),
  pickupLatitude: doublePrecision('pickup_latitude').notNull(),
  pickupLongitude: doublePrecision('pickup_longitude').notNull(),
  destinationAddress: text('destination_address').notNull(),
  destinationLatitude: doublePrecision('destination_latitude').notNull(),
  destinationLongitude: doublePrecision('destination_longitude').notNull(),
  status: rideStatusEnum('status').default('requested'),
  vehicleType: vehicleTypeEnum('vehicle_type').notNull(),
  baseFare: doublePrecision('base_fare').notNull(),
  perMileRate: doublePrecision('per_mile_rate').notNull(),
  perMinuteRate: doublePrecision('per_minute_rate').notNull(),
  estimatedDistance: doublePrecision('estimated_distance').notNull(),
  estimatedDuration: integer('estimated_duration').notNull(),
  estimatedFare: doublePrecision('estimated_fare').notNull(),
  actualFare: doublePrecision('actual_fare'),
  platformFee: doublePrecision('platform_fee'),
  driverPayout: doublePrecision('driver_payout'),
  paymentIntentId: text('payment_intent_id'),
  paymentStatus: text('payment_status'),
  riderRating: integer('rider_rating'),
  driverRating: integer('driver_rating'),
  createdAt: timestamp('created_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
});

// Ride relations
export const ridesRelations = relations(rides, ({ one }) => ({
  rider: one(users, {
    fields: [rides.riderId],
    references: [users.id],
    relationName: "rider",
  }),
  driver: one(users, {
    fields: [rides.driverId],
    references: [users.id],
    relationName: "driver",
  }),
  vehicle: one(vehicles, {
    fields: [rides.vehicleId],
    references: [vehicles.id],
  }),
}));

// Settings model for platform settings
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: json('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create schemas for inserts and selects
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true });
export const selectVehicleSchema = createSelectSchema(vehicles);

export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const selectLocationSchema = createSelectSchema(locations);

export const insertRideSchema = createInsertSchema(rides).omit({ 
  id: true, 
  createdAt: true, 
  acceptedAt: true, 
  startedAt: true, 
  completedAt: true, 
  cancelledAt: true,
  actualFare: true,
  platformFee: true,
  driverPayout: true,
  paymentIntentId: true,
  paymentStatus: true,
  riderRating: true,
  driverRating: true
});
export const selectRideSchema = createSelectSchema(rides);

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;

export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

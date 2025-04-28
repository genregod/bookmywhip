import { 
  users, 
  User, 
  InsertUser, 
  vehicles, 
  Vehicle, 
  InsertVehicle, 
  locations, 
  Location, 
  InsertLocation, 
  rides, 
  Ride, 
  InsertRide,
  settings,
  Setting,
  InsertSetting,
  paymentMethods,
  PaymentMethod,
  InsertPaymentMethod,
  subscriptions,
  Subscription,
  InsertSubscription,
  audioPreferences,
  AudioPreference,
  InsertAudioPreference,
  soundtrackPlaylists,
  SoundtrackPlaylist,
  InsertSoundtrackPlaylist
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, inArray, sql, desc, asc, or } from "drizzle-orm";
import { generatePasswordHash, verifyPassword } from "./auth";

// Map utility functions for distance calculations
// These functions are duplicated here to avoid cross-import issues between server and client code
/**
 * Calculate distance between two coordinates using the Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Creates a bounding box around a central point for efficient geo-queries
 */
function getBoundingBox(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  // Earth's radius in km
  const R = 6371;
  
  // Angular distance in radians on a great circle
  const angularDistance = radiusKm / R;
  
  // Simplified bounding box calculation (approximation)
  // 1 degree of latitude is approximately 111 kilometers
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(centerLat)));
  
  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta
  };
}

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  getNearbyDrivers(latitude: number, longitude: number, radius: number, vehicleType: string): Promise<User[]>;
  
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesByDriverId(driverId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  
  // Location operations
  getLocation(id: number): Promise<Location | undefined>;
  getLocationsByUserId(userId: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, locationData: Partial<InsertLocation>): Promise<Location | undefined>;
  
  // Ride operations
  getRide(id: number): Promise<Ride | undefined>;
  getRidesByRiderId(riderId: number): Promise<Ride[]>;
  getRidesByDriverId(driverId: number): Promise<Ride[]>;
  getActiveRideByRiderId(riderId: number): Promise<Ride | undefined>;
  getActiveRideByDriverId(driverId: number): Promise<Ride | undefined>;
  createRide(ride: InsertRide): Promise<Ride>;
  updateRide(id: number, rideData: Partial<InsertRide>): Promise<Ride | undefined>;
  acceptRide(id: number, driverId: number, vehicleId: number): Promise<Ride | undefined>;
  startRide(id: number): Promise<Ride | undefined>;
  completeRide(id: number, actualFare: number): Promise<Ride | undefined>;
  cancelRide(id: number, reason?: string): Promise<Ride | undefined>;
  rateRide(id: number, rating: number, isDriverRating: boolean): Promise<Ride | undefined>;
  
  // Payment method operations
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  getPaymentMethodByStripeId(stripePaymentMethodId: string): Promise<PaymentMethod | undefined>;
  getPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]>;
  getDefaultPaymentMethod(userId: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, paymentMethodData: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<void>;
  
  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  getSubscriptionsByUserId(userId: number): Promise<Subscription[]>;
  getActiveSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscriptionData: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  cancelSubscription(id: number, cancelAtPeriodEnd: boolean): Promise<Subscription | undefined>;
  
  // Stripe related operations
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId?: string, stripeConnectedAccountId?: string, defaultPaymentMethodId?: string, stripeSubscriptionId?: string, subscriptionStatus?: string, subscriptionTier?: string, subscriptionStartDate?: Date, subscriptionEndDate?: Date }): Promise<User | undefined>;
  updateRidePaymentInfo(rideId: number, paymentInfo: { paymentIntentId: string, paymentStatus: string }): Promise<Ride | undefined>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: any): Promise<Setting | undefined>;
  
  // Audio preferences operations
  getAudioPreferences(userId: number): Promise<AudioPreference | undefined>;
  createAudioPreferences(data: InsertAudioPreference): Promise<AudioPreference>;
  updateAudioPreferences(userId: number, data: Partial<InsertAudioPreference>): Promise<AudioPreference | undefined>;
  
  // Soundtrack playlist operations
  getSoundtrackPlaylist(id: number): Promise<SoundtrackPlaylist | undefined>;
  getSoundtrackPlaylistByRideId(rideId: number): Promise<SoundtrackPlaylist | undefined>;
  createSoundtrackPlaylist(data: InsertSoundtrackPlaylist): Promise<SoundtrackPlaylist>;
  updateSoundtrackPlaylist(id: number, data: Partial<InsertSoundtrackPlaylist>): Promise<SoundtrackPlaylist | undefined>;
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await generatePasswordHash(userData.password);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    // If password is being updated, hash it
    if (userData.password) {
      userData.password = await generatePasswordHash(userData.password);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async getNearbyDrivers(latitude: number, longitude: number, radius: number, vehicleType: string): Promise<User[]> {
    // Get all active drivers with vehicles of the requested type
    const result = await db
      .select()
      .from(users)
      .innerJoin(vehicles, and(
        eq(users.id, vehicles.driverId),
        eq(vehicles.type, vehicleType),
        eq(vehicles.isActive, true)
      ))
      .where(and(
        eq(users.role, 'driver'),
        eq(users.isAvailable, true)
      ));
    
    // Extract driver records
    const driversWithVehicles = result.map(({users: driver, vehicles: vehicle}) => ({
      ...driver,
      vehicle
    }));
    
    // We need to filter by proximity
    // This is still a simplified version, but improved from before
    // In a production environment with PostgreSQL, you would use PostGIS for efficient geospatial queries

    // Get a rectangular bounding box to first filter the data
    const {minLat, maxLat, minLon, maxLon} = getBoundingBox(latitude, longitude, radius);
    
    // Filter drivers whose last known location is within the bounding box
    const driversInBoundingBox = driversWithVehicles.filter(driver => {
      if (!driver.lastKnownLatitude || !driver.lastKnownLongitude) {
        return false; // Skip drivers without location data
      }
      
      return (
        driver.lastKnownLatitude >= minLat && 
        driver.lastKnownLatitude <= maxLat &&
        driver.lastKnownLongitude >= minLon &&
        driver.lastKnownLongitude <= maxLon
      );
    });
    
    // Now do a precise calculation for each driver in the bounding box
    const nearbyDrivers = driversInBoundingBox.map(driver => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        driver.lastKnownLatitude!, 
        driver.lastKnownLongitude!
      );
      
      return {
        ...driver,
        distance
      };
    })
    .filter(driver => driver.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
    
    // Return just the user records
    return nearbyDrivers.map(({distance, vehicle, ...driver}) => driver);
  }

  // Vehicle operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehiclesByDriverId(driverId: number): Promise<Vehicle[]> {
    return db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicleData)
      .where(eq(vehicles.id, id))
      .returning();
    
    return updatedVehicle;
  }

  // Location operations
  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async getLocationsByUserId(userId: number): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.userId, userId));
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async updateLocation(id: number, locationData: Partial<InsertLocation>): Promise<Location | undefined> {
    const [updatedLocation] = await db
      .update(locations)
      .set(locationData)
      .where(eq(locations.id, id))
      .returning();
    
    return updatedLocation;
  }

  // Ride operations
  async getRide(id: number): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    return ride;
  }

  async getRidesByRiderId(riderId: number): Promise<Ride[]> {
    return db
      .select()
      .from(rides)
      .where(eq(rides.riderId, riderId))
      .orderBy(desc(rides.createdAt));
  }

  async getRidesByDriverId(driverId: number): Promise<Ride[]> {
    return db
      .select()
      .from(rides)
      .where(eq(rides.driverId, driverId))
      .orderBy(desc(rides.createdAt));
  }

  async getActiveRideByRiderId(riderId: number): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(
        and(
          eq(rides.riderId, riderId),
          inArray(rides.status, ['requested', 'accepted', 'in_progress'])
        )
      );
    
    return ride;
  }

  async getActiveRideByDriverId(driverId: number): Promise<Ride | undefined> {
    const [ride] = await db
      .select()
      .from(rides)
      .where(
        and(
          eq(rides.driverId, driverId),
          inArray(rides.status, ['accepted', 'in_progress'])
        )
      );
    
    return ride;
  }

  async createRide(ride: InsertRide): Promise<Ride> {
    const [newRide] = await db.insert(rides).values(ride).returning();
    return newRide;
  }

  async updateRide(id: number, rideData: Partial<InsertRide>): Promise<Ride | undefined> {
    const [updatedRide] = await db
      .update(rides)
      .set(rideData)
      .where(eq(rides.id, id))
      .returning();
    
    return updatedRide;
  }

  async acceptRide(id: number, driverId: number, vehicleId: number): Promise<Ride | undefined> {
    const now = new Date();
    const [acceptedRide] = await db
      .update(rides)
      .set({
        driverId,
        vehicleId,
        status: 'accepted',
        acceptedAt: now
      })
      .where(
        and(
          eq(rides.id, id),
          eq(rides.status, 'requested')
        )
      )
      .returning();
    
    return acceptedRide;
  }

  async startRide(id: number): Promise<Ride | undefined> {
    const now = new Date();
    const [startedRide] = await db
      .update(rides)
      .set({
        status: 'in_progress',
        startedAt: now
      })
      .where(
        and(
          eq(rides.id, id),
          eq(rides.status, 'accepted')
        )
      )
      .returning();
    
    return startedRide;
  }

  async completeRide(id: number, actualFare: number): Promise<Ride | undefined> {
    const now = new Date();
    const [completedRide] = await db
      .update(rides)
      .set({
        status: 'completed',
        completedAt: now,
        actualFare
      })
      .where(
        and(
          eq(rides.id, id),
          eq(rides.status, 'in_progress')
        )
      )
      .returning();
    
    return completedRide;
  }

  async cancelRide(id: number): Promise<Ride | undefined> {
    const now = new Date();
    const [cancelledRide] = await db
      .update(rides)
      .set({
        status: 'cancelled',
        cancelledAt: now
      })
      .where(
        and(
          eq(rides.id, id),
          inArray(rides.status, ['requested', 'accepted'])
        )
      )
      .returning();
    
    return cancelledRide;
  }

  async rateRide(id: number, rating: number, isDriverRating: boolean): Promise<Ride | undefined> {
    const field = isDriverRating ? "driverRating" : "riderRating";
    const updateData: any = {};
    updateData[field] = rating;
    
    const [ratedRide] = await db
      .update(rides)
      .set(updateData)
      .where(eq(rides.id, id))
      .returning();
    
    // Update user's average rating
    if (ratedRide) {
      const userId = isDriverRating ? ratedRide.riderId : ratedRide.driverId;
      
      // Get all ratings for this user
      const userRides = await db
        .select()
        .from(rides)
        .where(
          isDriverRating 
            ? and(eq(rides.riderId, userId), sql`${rides.driverRating} IS NOT NULL`) 
            : and(eq(rides.driverId, userId), sql`${rides.riderRating} IS NOT NULL`)
        );
      
      // Calculate average rating
      if (userRides.length > 0) {
        const ratings = userRides.map(ride => isDriverRating ? (ride.driverRating || 0) : (ride.riderRating || 0));
        const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        
        // Update user's rating
        await db
          .update(users)
          .set({ rating: averageRating })
          .where(eq(users.id, userId));
      }
    }
    
    return ratedRide;
  }

  // Stripe related operations
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId?: string, stripeConnectedAccountId?: string }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId,
        stripeConnectedAccountId: stripeInfo.stripeConnectedAccountId
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async updateRidePaymentInfo(rideId: number, paymentInfo: { paymentIntentId: string, paymentStatus: string }): Promise<Ride | undefined> {
    const [updatedRide] = await db
      .update(rides)
      .set({
        paymentIntentId: paymentInfo.paymentIntentId,
        paymentStatus: paymentInfo.paymentStatus
      })
      .where(eq(rides.id, rideId))
      .returning();
    
    return updatedRide;
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    
    return setting;
  }

  async updateSetting(key: string, value: any): Promise<Setting | undefined> {
    // Check if setting exists
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      // Update existing setting
      const [updatedSetting] = await db
        .update(settings)
        .set({
          value,
          updatedAt: new Date()
        })
        .where(eq(settings.key, key))
        .returning();
      
      return updatedSetting;
    } else {
      // Create new setting
      const [newSetting] = await db
        .insert(settings)
        .values({
          key,
          value,
          updatedAt: new Date()
        })
        .returning();
      
      return newSetting;
    }
  }

  // Payment method operations
  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return paymentMethod;
  }

  async getPaymentMethodByStripeId(stripePaymentMethodId: string): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.stripePaymentMethodId, stripePaymentMethodId));
    return paymentMethod;
  }

  async getPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]> {
    return db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(desc(paymentMethods.isDefault), asc(paymentMethods.id));
  }

  async getDefaultPaymentMethod(userId: number): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isDefault, true)
        )
      );
    return paymentMethod;
  }

  async createPaymentMethod(paymentMethodData: InsertPaymentMethod): Promise<PaymentMethod> {
    // If this is set as default, we need to reset any existing default payment methods
    if (paymentMethodData.isDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(
          and(
            eq(paymentMethods.userId, paymentMethodData.userId),
            eq(paymentMethods.isDefault, true)
          )
        );
    }
    
    const [paymentMethod] = await db
      .insert(paymentMethods)
      .values(paymentMethodData)
      .returning();
      
    return paymentMethod;
  }

  async updatePaymentMethod(id: number, paymentMethodData: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    // If this is set as default, we need to reset any existing default payment methods
    if (paymentMethodData.isDefault) {
      const [existingPaymentMethod] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, id));
        
      if (existingPaymentMethod) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(
            and(
              eq(paymentMethods.userId, existingPaymentMethod.userId),
              eq(paymentMethods.isDefault, true),
              sql`${paymentMethods.id} != ${id}`
            )
          );
      }
    }
    
    const [updatedPaymentMethod] = await db
      .update(paymentMethods)
      .set(paymentMethodData)
      .where(eq(paymentMethods.id, id))
      .returning();
      
    return updatedPaymentMethod;
  }

  async setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<PaymentMethod | undefined> {
    // Reset all payment methods to non-default
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(
        and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isDefault, true)
        )
      );
      
    // Set the new default
    const [updatedPaymentMethod] = await db
      .update(paymentMethods)
      .set({ isDefault: true })
      .where(
        and(
          eq(paymentMethods.id, paymentMethodId),
          eq(paymentMethods.userId, userId)
        )
      )
      .returning();
      
    if (updatedPaymentMethod) {
      // Update the user's default payment method
      await db
        .update(users)
        .set({ defaultPaymentMethodId: updatedPaymentMethod.stripePaymentMethodId })
        .where(eq(users.id, userId));
    }
      
    return updatedPaymentMethod;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id));
      
    if (paymentMethod && paymentMethod.isDefault) {
      // If this was the default payment method, clear the user's default payment method
      await db
        .update(users)
        .set({ defaultPaymentMethodId: null })
        .where(eq(users.id, paymentMethod.userId));
    }
      
    await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id));
  }
  
  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return subscription;
  }

  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getActiveSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      );
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
      
    // Update the user's subscription info
    await db
      .update(users)
      .set({ 
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        subscriptionStatus: subscriptionData.status,
        subscriptionTier: subscriptionData.tier,
        subscriptionStartDate: subscriptionData.currentPeriodStart,
        subscriptionEndDate: subscriptionData.currentPeriodEnd
      })
      .where(eq(users.id, subscriptionData.userId));
      
    return subscription;
  }

  async updateSubscription(id: number, subscriptionData: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, id))
      .returning();
      
    if (updatedSubscription) {
      // Update the user's subscription info if status, tier, or period changes
      const userUpdate: any = {};
      
      if (subscriptionData.status) {
        userUpdate.subscriptionStatus = subscriptionData.status;
      }
      
      if (subscriptionData.tier) {
        userUpdate.subscriptionTier = subscriptionData.tier;
      }
      
      if (subscriptionData.currentPeriodStart) {
        userUpdate.subscriptionStartDate = subscriptionData.currentPeriodStart;
      }
      
      if (subscriptionData.currentPeriodEnd) {
        userUpdate.subscriptionEndDate = subscriptionData.currentPeriodEnd;
      }
      
      if (Object.keys(userUpdate).length > 0) {
        await db
          .update(users)
          .set(userUpdate)
          .where(eq(users.id, updatedSubscription.userId));
      }
    }
      
    return updatedSubscription;
  }

  async cancelSubscription(id: number, cancelAtPeriodEnd: boolean): Promise<Subscription | undefined> {
    const [cancelledSubscription] = await db
      .update(subscriptions)
      .set({ 
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        cancelAtPeriodEnd,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
      
    if (cancelledSubscription) {
      // Update the user's subscription status
      await db
        .update(users)
        .set({ 
          subscriptionStatus: cancelAtPeriodEnd ? 'active' : 'canceled'
        })
        .where(eq(users.id, cancelledSubscription.userId));
    }
      
    return cancelledSubscription;
  }
}

export const storage = new DatabaseStorage();

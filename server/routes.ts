import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { 
  insertUserSchema, 
  insertRideSchema, 
  insertVehicleSchema, 
  insertLocationSchema,
  insertAudioPreferenceSchema,
  insertSoundtrackPlaylistSchema,
  musicGenreEnum,
  contentRatingEnum,
  moodEnum
} from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { verifyPassword } from "./auth";
import * as azureApiManagementController from './routes/azureApiManagement';
import driverOnboardingRoutes from './routes/driverOnboarding';
import { webSocketService } from './services/webSocketService';
import { 
  STRIPE_SECRET_KEY,
  logEnvironmentStatus
} from './env';

const SessionStore = MemoryStore(session);

// Initialize Stripe
if (!STRIPE_SECRET_KEY) {
  console.warn('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = STRIPE_SECRET_KEY 
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" as any })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Log environment status
  logEnvironmentStatus();
  // Audio preferences routes
  app.get('/api/users/:id/audio-preferences', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      // Fetch audio preferences from database
      const preferences = await storage.getAudioPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ message: 'Audio preferences not found' });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching audio preferences:', error);
      res.status(500).json({ message: 'Failed to fetch audio preferences' });
    }
  });
  
  app.post('/api/users/:id/audio-preferences', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      // Validate the request body
      const preferencesData = insertAudioPreferenceSchema.parse({
        ...req.body,
        userId
      });
      
      // Create or update preferences
      const preferences = await storage.updateAudioPreferences(userId, preferencesData);
      
      res.status(200).json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error saving audio preferences:', error);
      res.status(500).json({ message: 'Failed to save audio preferences' });
    }
  });
  
  // Soundtrack playlist routes
  app.get('/api/soundtrack-playlists/:id', async (req: Request, res: Response) => {
    try {
      const playlistId = parseInt(req.params.id, 10);
      
      // Fetch soundtrack playlist from database
      const playlist = await storage.getSoundtrackPlaylist(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Soundtrack playlist not found' });
      }
      
      res.json(playlist);
    } catch (error) {
      console.error('Error fetching soundtrack playlist:', error);
      res.status(500).json({ message: 'Failed to fetch soundtrack playlist' });
    }
  });
  
  app.get('/api/rides/:id/soundtrack', async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id, 10);
      
      // Fetch soundtrack playlist for the ride
      const playlist = await storage.getSoundtrackPlaylistByRideId(rideId);
      
      if (!playlist) {
        return res.status(404).json({ message: 'No soundtrack playlist found for this ride' });
      }
      
      res.json(playlist);
    } catch (error) {
      console.error('Error fetching ride soundtrack:', error);
      res.status(500).json({ message: 'Failed to fetch ride soundtrack' });
    }
  });
  
  app.post('/api/rides/:id/soundtrack', async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id, 10);
      
      // Get the ride to make sure it exists
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Check if this ride already has a soundtrack
      const existingPlaylist = await storage.getSoundtrackPlaylistByRideId(rideId);
      
      if (existingPlaylist) {
        // Update existing playlist
        const updatedPlaylist = await storage.updateSoundtrackPlaylist(existingPlaylist.id, req.body);
        return res.json(updatedPlaylist);
      } else {
        // Create new playlist
        const playlistData = insertSoundtrackPlaylistSchema.parse({
          ...req.body,
          rideId
        });
        
        const newPlaylist = await storage.createSoundtrackPlaylist(playlistData);
        return res.status(201).json(newPlaylist);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error saving ride soundtrack:', error);
      res.status(500).json({ message: 'Failed to save ride soundtrack' });
    }
  });
  
  // Generate a personalized soundtrack
  app.post('/api/rides/:id/generate-soundtrack', async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id, 10);
      
      // Get the ride to make sure it exists
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Get rider's audio preferences
      const riderPreferences = await storage.getAudioPreferences(ride.riderId);
      
      // Get driver's audio preferences if available
      let driverPreferences = null;
      if (ride.driverId) {
        driverPreferences = await storage.getAudioPreferences(ride.driverId);
      }
      
      // Generate a playlist based on preferences and ride details
      // For now, we're creating a simple playlist structure
      // In a real implementation, this would call a music service API
      
      const playlistName = `Ride ${ride.id} Soundtrack`;
      
      // Use rider preferences with fallbacks
      const genre = riderPreferences?.favoriteGenres?.[0] || 'pop';
      const mood = riderPreferences?.preferredMoods?.[0] || 'relaxed';
      const contentRating = riderPreferences?.contentRating || 'clean';
      
      // Create the playlist with placeholder tracks
      // In a real implementation, we would get actual tracks from a music API
      const tracks = [
        {
          id: "track_1",
          title: "Relaxing Journey",
          artist: "BookMyWhip Radio",
          duration: 180, // 3 minutes
          genre: genre,
          mood: mood
        },
        {
          id: "track_2",
          title: "Smooth Ride",
          artist: "BookMyWhip Radio",
          duration: 210, // 3.5 minutes
          genre: genre,
          mood: mood
        },
        {
          id: "track_3",
          title: "City Cruising",
          artist: "BookMyWhip Radio",
          duration: 195, // 3.25 minutes
          genre: genre,
          mood: mood
        }
      ];
      
      // Calculate total duration
      const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
      
      // Create or update soundtrack playlist
      const existingPlaylist = await storage.getSoundtrackPlaylistByRideId(rideId);
      
      if (existingPlaylist) {
        // Update existing playlist
        const updatedPlaylist = await storage.updateSoundtrackPlaylist(existingPlaylist.id, {
          name: playlistName,
          genre,
          mood,
          tracks,
          trackCount: tracks.length,
          duration: totalDuration
        });
        
        return res.json(updatedPlaylist);
      } else {
        // Create new playlist
        const playlistData = {
          rideId,
          name: playlistName,
          description: `Personalized soundtrack for your ride`,
          genre,
          mood,
          tracks,
          trackCount: tracks.length,
          duration: totalDuration,
          coverImage: `https://placehold.co/400x400/4CAF50/FFFFFF/png?text=${encodeURIComponent(playlistName)}`
        };
        
        const newPlaylist = await storage.createSoundtrackPlaylist(playlistData);
        return res.status(201).json(newPlaylist);
      }
    } catch (error) {
      console.error('Error generating soundtrack:', error);
      res.status(500).json({ message: 'Failed to generate soundtrack' });
    }
  });
  // Serve the demo page directly
  app.get('/demo-components', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'client', 'demo.html'));
  });

  // Set up session management
  app.use(session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'bookmywhip-secret'
  }));

  // Set up Passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) return done(null, false, { message: 'User not found' });
      
      const passwordValid = await verifyPassword(password, user.password);
      if (!passwordValid) return done(null, false, { message: 'Invalid password' });
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication routes
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Check email if provided
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      
      const newUser = await storage.createUser(userData);
      
      // Strip password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to register user' });
    }
  });

  app.post('/api/login', (req: Request, res: Response, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || 'Authentication failed' });
      
      req.logIn(user, (err) => {
        if (err) return next(err);
        
        // Strip password from response
        const { password, ...userWithoutPassword } = user;
        
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.get('/api/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.sendStatus(200);
    });
  });

  app.get('/api/me', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Strip password from response
    const { password, ...userWithoutPassword } = req.user as any;
    
    res.json(userWithoutPassword);
  });

  // User routes
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Only return public user information
      const { password, ...publicUserInfo } = user;
      
      res.json(publicUserInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      const userId = parseInt(req.params.id);
      
      // Only allow users to update their own profile unless they're an admin
      if (currentUser.id !== userId && currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Strip password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Vehicle routes
  app.get('/api/vehicles', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      // If driverId is provided and user is admin or the driver, get vehicles for that driver
      if (req.query.driverId) {
        const driverId = parseInt(req.query.driverId as string);
        
        if (currentUser.id !== driverId && currentUser.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }
        
        const driverVehicles = await storage.getVehiclesByDriverId(driverId);
        return res.json(driverVehicles);
      }
      
      // If no driverId, only admins can see all vehicles
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // For admins, we would typically implement pagination here
      res.status(501).json({ message: 'Not implemented' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get vehicles' });
    }
  });

  app.post('/api/vehicles', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      // Only drivers can add vehicles
      if (currentUser.role !== 'driver' && currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const vehicleData = insertVehicleSchema.parse({
        ...req.body,
        driverId: currentUser.role === 'driver' ? currentUser.id : req.body.driverId
      });
      
      const newVehicle = await storage.createVehicle(vehicleData);
      
      res.status(201).json(newVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create vehicle' });
    }
  });

  app.patch('/api/vehicles/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      const vehicleId = parseInt(req.params.id);
      
      // Get the vehicle to check ownership
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      
      // Only the owner or an admin can update the vehicle
      if (vehicle.driverId !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Don't allow changing the driverId unless it's an admin
      if (req.body.driverId && currentUser.role !== 'admin') {
        delete req.body.driverId;
      }
      
      const updatedVehicle = await storage.updateVehicle(vehicleId, req.body);
      
      res.json(updatedVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update vehicle' });
    }
  });

  // Location routes
  app.get('/api/locations', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      // If userId is provided and user is admin or the user, get locations for that user
      if (req.query.userId) {
        const userId = parseInt(req.query.userId as string);
        
        if (currentUser.id !== userId && currentUser.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }
        
        const userLocations = await storage.getLocationsByUserId(userId);
        return res.json(userLocations);
      }
      
      // If no userId is provided, return the current user's locations
      const userLocations = await storage.getLocationsByUserId(currentUser.id);
      res.json(userLocations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get locations' });
    }
  });

  app.post('/api/locations', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      const locationData = insertLocationSchema.parse({
        ...req.body,
        userId: currentUser.id
      });
      
      const newLocation = await storage.createLocation(locationData);
      
      res.status(201).json(newLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create location' });
    }
  });

  app.patch('/api/locations/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      const locationId = parseInt(req.params.id);
      
      // Get the location to check ownership
      const location = await storage.getLocation(locationId);
      
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      
      // Only the owner or an admin can update the location
      if (location.userId !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Don't allow changing the userId unless it's an admin
      if (req.body.userId && currentUser.role !== 'admin') {
        delete req.body.userId;
      }
      
      const updatedLocation = await storage.updateLocation(locationId, req.body);
      
      res.json(updatedLocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update location' });
    }
  });

  // Ride routes
  app.get('/api/rides', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      // Get rides based on role
      if (currentUser.role === 'rider') {
        const rides = await storage.getRidesByRiderId(currentUser.id);
        return res.json(rides);
      } else if (currentUser.role === 'driver') {
        const rides = await storage.getRidesByDriverId(currentUser.id);
        return res.json(rides);
      } else if (currentUser.role === 'admin') {
        // For admin, we would implement pagination and filtering
        return res.status(501).json({ message: 'Not implemented for admin' });
      }
      
      res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get rides' });
    }
  });

  app.get('/api/rides/active', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      // Get active ride based on role
      if (currentUser.role === 'rider') {
        const ride = await storage.getActiveRideByRiderId(currentUser.id);
        return res.json(ride || null);
      } else if (currentUser.role === 'driver') {
        const ride = await storage.getActiveRideByDriverId(currentUser.id);
        return res.json(ride || null);
      }
      
      res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get active ride' });
    }
  });

  app.post('/api/rides', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      // Only riders can create rides
      if (currentUser.role !== 'rider') {
        return res.status(403).json({ message: 'Only riders can create rides' });
      }
      
      // Check if rider already has an active ride
      const activeRide = await storage.getActiveRideByRiderId(currentUser.id);
      if (activeRide) {
        return res.status(400).json({ message: 'You already have an active ride' });
      }
      
      // Set the riderId to the current user
      const rideData = insertRideSchema.parse({
        ...req.body,
        riderId: currentUser.id
      });
      
      const newRide = await storage.createRide(rideData);
      
      // Notify available drivers about new ride request using WebSocket service
      // In a real app, we would implement proximity-based notification
      webSocketService.broadcastAll('new-ride-request', {
        rideId: newRide.id,
        pickupLocation: {
          latitude: newRide.pickupLatitude,
          longitude: newRide.pickupLongitude,
          address: newRide.pickupAddress
        },
        destinationLocation: {
          latitude: newRide.destinationLatitude,
          longitude: newRide.destinationLongitude,
          address: newRide.destinationAddress
        },
        estimatedFare: newRide.estimatedFare,
        estimatedDistance: newRide.estimatedDistance,
        estimatedDuration: newRide.estimatedDuration
      });
      
      res.status(201).json(newRide);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create ride' });
    }
  });

  app.post('/api/rides/:id/accept', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      const rideId = parseInt(req.params.id);
      
      // Only drivers can accept rides
      if (currentUser.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can accept rides' });
      }
      
      // Check if driver already has an active ride
      const activeRide = await storage.getActiveRideByDriverId(currentUser.id);
      if (activeRide) {
        return res.status(400).json({ message: 'You already have an active ride' });
      }
      
      // Check if driver has any vehicles
      const vehicles = await storage.getVehiclesByDriverId(currentUser.id);
      if (!vehicles || vehicles.length === 0) {
        return res.status(400).json({ message: 'No available vehicles' });
      }
      
      // Get the ride
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      if (ride.status !== 'requested') {
        return res.status(400).json({ message: 'Ride is not available for acceptance' });
      }
      
      // Find a matching vehicle type
      const matchingVehicle = vehicles.find(v => v.type === ride.vehicleType && v.isActive);
      if (!matchingVehicle) {
        return res.status(400).json({ message: `No available ${ride.vehicleType} vehicles` });
      }
      
      // Accept the ride
      const acceptedRide = await storage.acceptRide(rideId, currentUser.id, matchingVehicle.id);
      
      if (!acceptedRide) {
        return res.status(400).json({ message: 'Failed to accept ride' });
      }
      
      // Notify the rider using WebSocket service
      webSocketService.notifyUser(ride.riderId, 'ride-accepted', {
        ride: acceptedRide
      });
      
      res.json(acceptedRide);
    } catch (error) {
      res.status(500).json({ message: 'Failed to accept ride' });
    }
  });

  app.post('/api/rides/:id/start', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      const rideId = parseInt(req.params.id);
      
      // Get the ride
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Only the assigned driver can start the ride
      if (ride.driverId !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      if (ride.status !== 'accepted') {
        return res.status(400).json({ message: 'Ride cannot be started' });
      }
      
      // Start the ride
      const startedRide = await storage.startRide(rideId);
      
      if (!startedRide) {
        return res.status(400).json({ message: 'Failed to start ride' });
      }
      
      // Notify the rider using WebSocket service
      webSocketService.notifyUser(ride.riderId, 'ride-started', {
        ride: startedRide
      });
      
      res.json(startedRide);
    } catch (error) {
      res.status(500).json({ message: 'Failed to start ride' });
    }
  });

  app.post('/api/rides/:id/complete', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      const rideId = parseInt(req.params.id);
      
      // Get the ride
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Only the assigned driver can complete the ride
      if (ride.driverId !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      if (ride.status !== 'in_progress') {
        return res.status(400).json({ message: 'Ride cannot be completed' });
      }
      
      // For simplicity, use the estimated fare as the actual fare
      // In a real app, this would be calculated based on actual distance and time
      const actualFare = ride.estimatedFare;
      
      // Complete the ride
      const completedRide = await storage.completeRide(rideId, actualFare);
      
      if (!completedRide) {
        return res.status(400).json({ message: 'Failed to complete ride' });
      }
      
      // Process payment if Stripe is configured
      if (stripe) {
        try {
          // Create a payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(actualFare * 100), // convert to cents
            currency: 'usd',
            description: `Ride #${rideId}`,
            metadata: {
              rideId: rideId.toString()
            }
          });
          
          // Update ride with payment information
          await storage.updateRidePaymentInfo(rideId, {
            paymentIntentId: paymentIntent.id,
            paymentStatus: paymentIntent.status
          });
          
          // In a real app, we'd capture the payment here or redirect to payment page
        } catch (stripeError) {
          console.error('Stripe error:', stripeError);
          // Continue with ride completion even if payment fails
          // In a real app, we'd handle this more gracefully
        }
      }
      
      // Notify the rider using WebSocket service
      webSocketService.notifyUser(ride.riderId, 'ride-completed', {
        ride: completedRide
      });
      
      res.json(completedRide);
    } catch (error) {
      res.status(500).json({ message: 'Failed to complete ride' });
    }
  });

  app.post('/api/rides/:id/cancel', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      const rideId = parseInt(req.params.id);
      
      // Get the ride
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Only the rider, assigned driver, or admin can cancel the ride
      if (ride.riderId !== currentUser.id && 
          ride.driverId !== currentUser.id && 
          currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      if (ride.status !== 'requested' && ride.status !== 'accepted') {
        return res.status(400).json({ message: 'Ride cannot be cancelled' });
      }
      
      // Cancel the ride
      const cancelledRide = await storage.cancelRide(rideId);
      
      if (!cancelledRide) {
        return res.status(400).json({ message: 'Failed to cancel ride' });
      }
      
      // Notify the other party using WebSocket service
      if (currentUser.id === ride.riderId && ride.driverId) {
        // Rider cancelled, notify driver
        webSocketService.notifyUser(ride.driverId, 'ride-cancelled', {
          ride: cancelledRide
        });
      } else if (currentUser.id === ride.driverId) {
        // Driver cancelled, notify rider
        webSocketService.notifyUser(ride.riderId, 'ride-cancelled', {
          ride: cancelledRide
        });
      }
      
      res.json(cancelledRide);
    } catch (error) {
      res.status(500).json({ message: 'Failed to cancel ride' });
    }
  });

  app.post('/api/rides/:id/rate', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      const rideId = parseInt(req.params.id);
      const { rating } = req.body;
      
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
      }
      
      // Get the ride
      const ride = await storage.getRide(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Only the rider or the driver can rate the ride
      if (ride.riderId !== currentUser.id && ride.driverId !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      if (ride.status !== 'completed') {
        return res.status(400).json({ message: 'Only completed rides can be rated' });
      }
      
      // Determine if this is the driver rating the rider or vice versa
      const isDriverRating = currentUser.id === ride.driverId;
      
      // Check if already rated
      if ((isDriverRating && ride.driverRating) || (!isDriverRating && ride.riderRating)) {
        return res.status(400).json({ message: 'Ride already rated' });
      }
      
      // Rate the ride
      const ratedRide = await storage.rateRide(rideId, rating, isDriverRating);
      
      if (!ratedRide) {
        return res.status(400).json({ message: 'Failed to rate ride' });
      }
      
      res.json(ratedRide);
    } catch (error) {
      res.status(500).json({ message: 'Failed to rate ride' });
    }
  });

  // Stripe payment routes
  if (stripe) {
    // Create a setup intent for adding a new payment method
    app.post('/api/setup-intent', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        
        // Get or create a Stripe customer for the user
        let stripeCustomerId = user.stripeCustomerId;
        
        if (!stripeCustomerId) {
          // Create a new customer
          const customer = await stripe.customers.create({
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
            email: user.email,
            metadata: {
              userId: user.id.toString()
            }
          });
          
          stripeCustomerId = customer.id;
          
          // Update user with Stripe customer ID
          await storage.updateUserStripeInfo(user.id, { stripeCustomerId });
        }
        
        // Create a setup intent for the customer
        const setupIntent = await stripe.setupIntents.create({
          customer: stripeCustomerId,
          usage: 'off_session', // Allow the payment method to be used for future payments
        });
        
        res.json({ clientSecret: setupIntent.client_secret });
      } catch (error: any) {
        res.status(500).json({ message: 'Error creating setup intent: ' + error.message });
      }
    });
    
    // Retrieve saved payment methods
    app.get('/api/payment-methods', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        
        if (!user.stripeCustomerId) {
          return res.json([]);
        }
        
        // Get saved payment methods from database
        const savedPaymentMethods = await storage.getPaymentMethodsByUserId(user.id);
        
        res.json(savedPaymentMethods);
      } catch (error: any) {
        res.status(500).json({ message: 'Error retrieving payment methods: ' + error.message });
      }
    });
    
    // Add a new payment method
    app.post('/api/payment-methods', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        const { paymentMethodId } = req.body;
        
        if (!user.stripeCustomerId) {
          return res.status(400).json({ message: 'No Stripe customer ID found for user' });
        }
        
        if (!paymentMethodId) {
          return res.status(400).json({ message: 'Payment method ID is required' });
        }
        
        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: user.stripeCustomerId,
        });
        
        // Retrieve the payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        
        // Check if this is the first payment method (make it default if so)
        const existingPaymentMethods = await storage.getPaymentMethodsByUserId(user.id);
        const isDefault = existingPaymentMethods.length === 0;
        
        if (isDefault) {
          // Set as default payment method for the customer
          await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        }
        
        // Save payment method in database
        const card = paymentMethod.card;
        const newPaymentMethod = await storage.createPaymentMethod({
          userId: user.id,
          stripePaymentMethodId: paymentMethodId,
          type: paymentMethod.type,
          isDefault,
          brand: card ? card.brand : undefined,
          last4: card ? card.last4 : undefined,
          expiryMonth: card ? card.exp_month : undefined,
          expiryYear: card ? card.exp_year : undefined,
        });
        
        res.status(201).json(newPaymentMethod);
      } catch (error: any) {
        res.status(500).json({ message: 'Error adding payment method: ' + error.message });
      }
    });
    
    // Set a payment method as default
    app.post('/api/payment-methods/:id/default', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        const paymentMethodId = parseInt(req.params.id);
        
        if (!user.stripeCustomerId) {
          return res.status(400).json({ message: 'No Stripe customer ID found for user' });
        }
        
        // Get the payment method from database
        const paymentMethod = await storage.getPaymentMethod(paymentMethodId);
        
        if (!paymentMethod) {
          return res.status(404).json({ message: 'Payment method not found' });
        }
        
        if (paymentMethod.userId !== user.id) {
          return res.status(403).json({ message: 'You do not have permission to update this payment method' });
        }
        
        // Set as default in Stripe
        await stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.stripePaymentMethodId,
          },
        });
        
        // Set as default in database
        const updatedPaymentMethod = await storage.setDefaultPaymentMethod(user.id, paymentMethodId);
        
        res.json(updatedPaymentMethod);
      } catch (error: any) {
        res.status(500).json({ message: 'Error setting default payment method: ' + error.message });
      }
    });
    
    // Delete a payment method
    app.delete('/api/payment-methods/:id', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        const paymentMethodId = parseInt(req.params.id);
        
        // Get the payment method from database
        const paymentMethod = await storage.getPaymentMethod(paymentMethodId);
        
        if (!paymentMethod) {
          return res.status(404).json({ message: 'Payment method not found' });
        }
        
        if (paymentMethod.userId !== user.id) {
          return res.status(403).json({ message: 'You do not have permission to delete this payment method' });
        }
        
        // Detach from Stripe customer
        await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
        
        // Delete from database
        await storage.deletePaymentMethod(paymentMethodId);
        
        res.status(204).end();
      } catch (error: any) {
        res.status(500).json({ message: 'Error deleting payment method: ' + error.message });
      }
    });
    
    // Create a subscription
    app.post('/api/subscriptions', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        const { priceId, paymentMethodId } = req.body;
        
        if (!user.stripeCustomerId) {
          return res.status(400).json({ message: 'No Stripe customer ID found for user' });
        }
        
        if (!priceId) {
          return res.status(400).json({ message: 'Price ID is required' });
        }
        
        // Get the price details
        const price = await stripe.prices.retrieve(priceId);
        
        // Check for existing active subscription
        const existingSubscription = await storage.getActiveSubscription(user.id);
        
        if (existingSubscription) {
          return res.status(400).json({ 
            message: 'You already have an active subscription', 
            subscriptionId: existingSubscription.id 
          });
        }
        
        // Create subscription
        const subscriptionData: any = {
          customer: user.stripeCustomerId,
          items: [{ price: priceId }],
          expand: ['latest_invoice.payment_intent'],
        };
        
        // If a specific payment method is provided, use it
        if (paymentMethodId) {
          subscriptionData.default_payment_method = paymentMethodId;
        }
        
        const subscription = await stripe.subscriptions.create(subscriptionData);
        
        // Save subscription in database
        const newSubscription = await storage.createSubscription({
          userId: user.id,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          tier: price.nickname || 'default',
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        
        // If the subscription requires payment, return the payment intent client secret
        let clientSecret = null;
        if (subscription.latest_invoice && subscription.latest_invoice.payment_intent) {
          clientSecret = subscription.latest_invoice.payment_intent.client_secret;
        }
        
        res.status(201).json({
          subscription: newSubscription,
          clientSecret
        });
      } catch (error: any) {
        res.status(500).json({ message: 'Error creating subscription: ' + error.message });
      }
    });
    
    // Get user's subscriptions
    app.get('/api/subscriptions', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        
        // Get subscriptions from database
        const subscriptions = await storage.getSubscriptionsByUserId(user.id);
        
        res.json(subscriptions);
      } catch (error: any) {
        res.status(500).json({ message: 'Error retrieving subscriptions: ' + error.message });
      }
    });
    
    // Cancel a subscription
    app.post('/api/subscriptions/:id/cancel', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        const subscriptionId = parseInt(req.params.id);
        const { cancelAtPeriodEnd = true } = req.body;
        
        // Get the subscription from database
        const subscription = await storage.getSubscription(subscriptionId);
        
        if (!subscription) {
          return res.status(404).json({ message: 'Subscription not found' });
        }
        
        if (subscription.userId !== user.id) {
          return res.status(403).json({ message: 'You do not have permission to cancel this subscription' });
        }
        
        // Cancel in Stripe
        if (cancelAtPeriodEnd) {
          // Cancel at the end of the current period
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        } else {
          // Cancel immediately
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        }
        
        // Update in database
        const updatedSubscription = await storage.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
        
        res.json(updatedSubscription);
      } catch (error: any) {
        res.status(500).json({ message: 'Error cancelling subscription: ' + error.message });
      }
    });
    
    // Create a payment intent for one-time payments
    app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const user = req.user as any;
        const { amount, rideId } = req.body;
        
        if (!amount || typeof amount !== 'number') {
          return res.status(400).json({ message: 'Invalid amount' });
        }
        
        const paymentIntentData: any = {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            userId: user.id.toString(),
            rideId: rideId ? rideId.toString() : undefined
          }
        };
        
        // If user has a Stripe customer ID, associate the payment with the customer
        if (user.stripeCustomerId) {
          paymentIntentData.customer = user.stripeCustomerId;
          
          // If the user has a default payment method, use it
          if (user.defaultPaymentMethodId) {
            paymentIntentData.payment_method = user.defaultPaymentMethodId;
            paymentIntentData.off_session = true;
            paymentIntentData.confirm = true;
          }
        }
        
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res.status(500).json({ message: 'Error creating payment intent: ' + error.message });
      }
    });
    
    // Stripe webhook handler
    app.post('/api/stripe-webhook', async (req: Request, res: Response) => {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).json({ message: 'Stripe webhook secret not configured' });
      }
      
      try {
        const event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            // Update ride payment status if this is a ride payment
            if (paymentIntent.metadata.rideId) {
              await storage.updateRidePaymentInfo(
                parseInt(paymentIntent.metadata.rideId),
                {
                  paymentIntentId: paymentIntent.id,
                  paymentStatus: paymentIntent.status
                }
              );
            }
            break;
            
          case 'payment_method.attached':
            const paymentMethod = event.data.object as Stripe.PaymentMethod;
            // Payment method was attached to a customer
            console.log('Payment method attached:', paymentMethod.id);
            break;
            
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
            const subscription = event.data.object as Stripe.Subscription;
            // Update subscription in database
            const dbSubscription = await storage.getSubscriptionByStripeId(subscription.id);
            
            if (dbSubscription) {
              await storage.updateSubscription(dbSubscription.id, {
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              });
            }
            break;
            
          case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object as Stripe.Subscription;
            // Update subscription in database as canceled
            const deletedDbSubscription = await storage.getSubscriptionByStripeId(deletedSubscription.id);
            
            if (deletedDbSubscription) {
              await storage.updateSubscription(deletedDbSubscription.id, {
                status: 'canceled',
              });
            }
            break;
            
          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.json({ received: true });
      } catch (error: any) {
        console.error('Webhook error:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    });
  }

  // Driver status update endpoint
  // Azure API Management routes
  app.get('/api/azure/apim/initialize', async (req: Request, res: Response) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can access Azure API Management' });
    }
    
    return azureApiManagementController.initializeAzureApiManagement(req, res);
  });

  app.get('/api/azure/apim/apis', async (req: Request, res: Response) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can access Azure API Management' });
    }
    
    return azureApiManagementController.getAllApis(req, res);
  });

  app.post('/api/azure/apim/register-apis', async (req: Request, res: Response) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can access Azure API Management' });
    }
    
    return azureApiManagementController.registerBookMyWhipApis(req, res);
  });

  app.post('/api/azure/apim/apply-policies', async (req: Request, res: Response) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can access Azure API Management' });
    }
    
    return azureApiManagementController.applyStandardPolicies(req, res);
  });

  app.post('/api/azure/apim/create-api', async (req: Request, res: Response) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can access Azure API Management' });
    }
    
    return azureApiManagementController.createOrUpdateApi(req, res);
  });

  app.get('/api/azure/apim/analytics/:apiId', async (req: Request, res: Response) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can access Azure API Management' });
    }
    
    return azureApiManagementController.getApiAnalytics(req, res);
  });

  app.post('/api/driver/status', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      if (currentUser.role !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can update status' });
      }
      
      const { isOnline } = req.body;
      
      if (typeof isOnline !== 'boolean') {
        return res.status(400).json({ message: 'Invalid status. Expected boolean value.' });
      }
      
      // In a real implementation, we would update the driver's status in the database
      // For now, we'll just return success
      
      // Notify all clients about the driver's status change using WebSocket service
      webSocketService.broadcastAll('driver-status-update', {
        driverId: currentUser.id,
        isOnline: isOnline
      });
      
      res.json({ success: true, isOnline });
    } catch (error) {
      console.error('Error updating driver status:', error);
      res.status(500).json({ message: 'Failed to update driver status' });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const currentUser = req.user as any;
      
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // In a real app, this would query the database for actual statistics
      // For this implementation, we'll return mock data
      res.json({
        totalRides: 0,
        activeDrivers: 0,
        revenue: 0,
        averageRating: 0
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get admin stats' });
    }
  });

  // Set up HTTP server
  const httpServer = createServer(app);
  
  // Initialize the WebSocket service
  webSocketService.initialize(httpServer);
  
  // WebSocket API routes for administration
  app.get('/api/websocket/status', (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can access WebSocket status' });
    }
    
    res.json({
      status: 'running',
      timestamp: new Date().toISOString()
    });
  });
  
  // API route to send a notification to a specific user
  app.post('/api/notifications/user/:userId', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const currentUser = req.user as any;
      const userId = parseInt(req.params.userId, 10);
      const { event, data } = req.body;
      
      if (!event) {
        return res.status(400).json({ message: 'Event name is required' });
      }
      
      // Only admins can send notifications to other users
      if (currentUser.id !== userId && currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Send notification through WebSocket service
      webSocketService.notifyUser(userId, event, data || {});
      
      res.json({ success: true, message: `Notification sent to user ${userId}` });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  });
  
  // API route to broadcast ride status updates
  app.post('/api/notifications/ride/:rideId', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const currentUser = req.user as any;
      const rideId = parseInt(req.params.rideId, 10);
      const { event, data } = req.body;
      
      if (!event) {
        return res.status(400).json({ message: 'Event name is required' });
      }
      
      // Get the ride to verify the user has access
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      // Only the rider, driver, or admin can send notifications for a ride
      if (currentUser.id !== ride.riderId && 
          currentUser.id !== ride.driverId && 
          currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Send notification to all ride participants
      webSocketService.notifyRide(rideId, event, data || {});
      
      res.json({ success: true, message: `Notification sent to ride ${rideId}` });
    } catch (error) {
      console.error('Error sending ride notification:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  });

  // Register driver onboarding routes
  app.use('/api/driver-onboarding', driverOnboardingRoutes);

  return httpServer;
}

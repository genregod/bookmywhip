import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { insertUserSchema, insertRideSchema, insertVehicleSchema, insertLocationSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { verifyPassword } from "./auth";

const SessionStore = MemoryStore(session);

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

// Store active WebSocket connections
const clients = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
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
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || 'Authentication failed' });
      
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
      
      // Notify available drivers about new ride request
      // In a real app, we would implement proximity-based notification
      clients.forEach((ws, userId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'new_ride_request',
            rideId: newRide.id
          }));
        }
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
      
      // Notify the rider
      const riderWs = clients.get(ride.riderId);
      if (riderWs && riderWs.readyState === WebSocket.OPEN) {
        riderWs.send(JSON.stringify({
          type: 'ride_accepted',
          ride: acceptedRide
        }));
      }
      
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
      
      // Notify the rider
      const riderWs = clients.get(ride.riderId);
      if (riderWs && riderWs.readyState === WebSocket.OPEN) {
        riderWs.send(JSON.stringify({
          type: 'ride_started',
          ride: startedRide
        }));
      }
      
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
      
      // Notify the rider
      const riderWs = clients.get(ride.riderId);
      if (riderWs && riderWs.readyState === WebSocket.OPEN) {
        riderWs.send(JSON.stringify({
          type: 'ride_completed',
          ride: completedRide
        }));
      }
      
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
      
      // Notify the other party
      if (currentUser.id === ride.riderId && ride.driverId) {
        // Rider cancelled, notify driver
        const driverWs = clients.get(ride.driverId);
        if (driverWs && driverWs.readyState === WebSocket.OPEN) {
          driverWs.send(JSON.stringify({
            type: 'ride_cancelled',
            ride: cancelledRide
          }));
        }
      } else if (currentUser.id === ride.driverId) {
        // Driver cancelled, notify rider
        const riderWs = clients.get(ride.riderId);
        if (riderWs && riderWs.readyState === WebSocket.OPEN) {
          riderWs.send(JSON.stringify({
            type: 'ride_cancelled',
            ride: cancelledRide
          }));
        }
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
    app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const { amount, rideId } = req.body;
        
        if (!amount || typeof amount !== 'number') {
          return res.status(400).json({ message: 'Invalid amount' });
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            rideId: rideId ? rideId.toString() : undefined
          }
        });
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res.status(500).json({ message: 'Error creating payment intent: ' + error.message });
      }
    });
  }

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
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth' && data.userId) {
          userId = parseInt(data.userId);
          clients.set(userId, ws);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  return httpServer;
}

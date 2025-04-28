import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Pool } from 'pg';

// PostgreSQL connection
let pool: Pool | null = null;

/**
 * Advanced driver matching Azure Function
 * Performs proximity-based matching between riders and available drivers
 */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('Driver matching function processed a request.');
  
  try {
    // Initialize database connection if needed
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    }
    
    // Extract request parameters
    const {
      latitude,
      longitude,
      rideId,
      vehicleType = 'economy',
      maxDistance = 10, // km
      maxDrivers = 3  
    } = req.body;
    
    // Validate required parameters
    if (!latitude || !longitude) {
      context.res = {
        status: 400,
        body: { error: "Missing required location parameters" }
      };
      return;
    }
    
    // Find nearby available drivers
    const drivers = await findNearbyDrivers(
      parseFloat(latitude),
      parseFloat(longitude),
      vehicleType,
      parseFloat(maxDistance),
      parseInt(maxDrivers)
    );
    
    if (drivers.length === 0) {
      context.res = {
        status: 200,
        body: { 
          message: "No available drivers found",
          drivers: []
        }
      };
      return;
    }
    
    // If a specific ride ID is provided, automatically assign the closest driver
    if (rideId) {
      const closestDriver = drivers[0];
      await assignDriverToRide(rideId, closestDriver.id);
      
      context.res = {
        status: 200,
        body: { 
          message: "Driver assigned to ride",
          rideId,
          driverId: closestDriver.id,
          driverName: closestDriver.name,
          estimatedArrival: closestDriver.eta,
          allDrivers: drivers
        }
      };
    } else {
      // Just return the list of nearby drivers
      context.res = {
        status: 200,
        body: { 
          drivers,
          count: drivers.length
        }
      };
    }
    
  } catch (error) {
    context.log.error('Error in driver matching:', error);
    context.res = {
      status: 500,
      body: { error: "Failed to match drivers" }
    };
  }
};

/**
 * Find nearby available drivers using PostgreSQL geospatial queries
 */
async function findNearbyDrivers(
  latitude: number,
  longitude: number,
  vehicleType: string,
  maxDistance: number,
  limit: number
): Promise<any[]> {
  if (!pool) {
    throw new Error('Database connection not initialized');
  }
  
  const query = `
    WITH available_drivers AS (
      SELECT 
        u.id, 
        u.first_name || ' ' || u.last_name AS name,
        l.latitude, 
        l.longitude,
        v.type AS vehicle_type,
        v.id AS vehicle_id,
        v.make || ' ' || v.model AS vehicle_name,
        v.color AS vehicle_color,
        v.license_plate,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(l.latitude)) *
            cos(radians(l.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(l.latitude))
          )
        ) AS distance
      FROM users u
      JOIN locations l ON u.id = l.user_id
      JOIN vehicles v ON u.id = v.driver_id
      WHERE u.role = 'driver'
      AND v.type = $3
      AND l.updated_at > NOW() - INTERVAL '15 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM rides r
        WHERE r.driver_id = u.id
        AND r.status IN ('accepted', 'in_progress')
      )
    )
    SELECT 
      id, 
      name, 
      latitude, 
      longitude, 
      vehicle_type,
      vehicle_id,
      vehicle_name,
      vehicle_color,
      license_plate,
      distance,
      ROUND(distance * 2) AS eta_minutes
    FROM available_drivers
    WHERE distance <= $4
    ORDER BY distance
    LIMIT $5
  `;
  
  const result = await pool.query(query, [
    latitude, 
    longitude, 
    vehicleType,
    maxDistance,
    limit
  ]);
  
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    location: {
      latitude: row.latitude,
      longitude: row.longitude
    },
    distance: {
      km: parseFloat(row.distance.toFixed(2)),
      miles: parseFloat((row.distance * 0.621371).toFixed(2))
    },
    eta: {
      minutes: row.eta_minutes,
      text: `${row.eta_minutes} min`
    },
    vehicle: {
      id: row.vehicle_id,
      type: row.vehicle_type,
      name: row.vehicle_name,
      color: row.vehicle_color,
      licensePlate: row.license_plate
    }
  }));
}

/**
 * Assign a driver to a ride
 */
async function assignDriverToRide(rideId: string, driverId: number): Promise<void> {
  if (!pool) {
    throw new Error('Database connection not initialized');
  }
  
  // Get the first available vehicle for this driver
  const vehicleResult = await pool.query(
    'SELECT id FROM vehicles WHERE driver_id = $1 AND is_active = true LIMIT 1',
    [driverId]
  );
  
  if (vehicleResult.rows.length === 0) {
    throw new Error('No active vehicle found for driver');
  }
  
  const vehicleId = vehicleResult.rows[0].id;
  
  // Update the ride with the assigned driver and vehicle
  await pool.query(
    `UPDATE rides 
     SET driver_id = $1, vehicle_id = $2, status = 'accepted', accept_time = NOW() 
     WHERE id = $3 AND status = 'requested'`,
    [driverId, vehicleId, rideId]
  );
}

export default httpTrigger;
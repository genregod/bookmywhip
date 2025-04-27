const { calculateDistance } = require('../shared/geo-utils');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request to update driver location.');

    // Check request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: { error: "Request body is required" }
        };
        return;
    }

    const { 
        driverId, 
        latitude, 
        longitude, 
        isAvailable = true,
        status = 'online',
        heading = 0,
        speed = 0,
        timestamp = new Date().toISOString(),
        activeRideId = null
    } = req.body;

    // Validate required parameters
    if (!driverId || latitude === undefined || longitude === undefined) {
        context.res = {
            status: 400,
            body: { error: "Driver ID, latitude, and longitude are required" }
        };
        return;
    }

    try {
        // Simulate reading the previous location (would come from database)
        let previousLocation = context.bindings.previousLocation;
        
        // If no previous location, we'll simulate one
        if (!previousLocation) {
            previousLocation = {
                driverId,
                latitude: latitude - 0.0001 * (Math.random() - 0.5),
                longitude: longitude - 0.0001 * (Math.random() - 0.5),
                timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
                status: 'online',
                isAvailable: true
            };
        }
        
        // Calculate distance moved from previous location if available
        const distanceMoved = calculateDistance(
            previousLocation.latitude,
            previousLocation.longitude,
            latitude,
            longitude
        );
        
        // Calculate time elapsed in seconds
        const prevTime = new Date(previousLocation.timestamp).getTime();
        const currentTime = new Date(timestamp).getTime();
        const timeElapsedSeconds = (currentTime - prevTime) / 1000;
        
        // Calculate average speed (km/h) if time elapsed is valid
        const calculatedSpeed = timeElapsedSeconds > 0 
            ? (distanceMoved / timeElapsedSeconds) * 3600 
            : 0;
        
        // Calculate heading (direction) in degrees from previous location
        let calculatedHeading = heading;
        if (distanceMoved > 0.001) { // Only calculate heading if moved more than 1 meter
            const dLat = latitude - previousLocation.latitude;
            const dLon = longitude - previousLocation.longitude;
            calculatedHeading = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360;
        }
        
        // Prepare the location data to store
        const locationUpdate = {
            driverId,
            latitude,
            longitude,
            status,
            isAvailable,
            heading: calculatedHeading,
            speed: calculatedSpeed || speed, // Use calculated speed if available
            timestamp,
            distanceMoved,
            timeElapsedSeconds,
            activeRideId,
            previousLocation: {
                latitude: previousLocation.latitude,
                longitude: previousLocation.longitude,
                timestamp: previousLocation.timestamp
            }
        };
        
        // In a real implementation, we would save this to a database
        // db.collection('driver_locations').updateOne(
        //   { driverId: driverId },
        //   { $set: locationUpdate },
        //   { upsert: true }
        // );
        
        // For SignalR integration - we would push this update to connected clients
        // In a real implementation, this might trigger a notification to nearby riders
        // or update the location displayed on the rider's map
        if (context.bindings.signalRMessages) {
            context.bindings.signalRMessages = [{
                target: 'driverLocationUpdate',
                arguments: [locationUpdate]
            }];
        }

        // Return success response
        context.res = {
            status: 200,
            body: {
                message: "Driver location updated successfully",
                driverId,
                latitude,
                longitude,
                timestamp,
                distanceMoved,
                calculatedSpeed,
                heading: calculatedHeading
            }
        };
    } catch (error) {
        context.log.error('Error updating driver location:', error);
        
        context.res = {
            status: 500,
            body: { error: "Internal server error", message: error.message }
        };
    }
};
const { calculateDistance, estimateTravelTime } = require('../shared/geo-utils');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request to match optimal driver.');

    // Check request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: { error: "Request body is required" }
        };
        return;
    }

    const { 
        riders = [], 
        drivers = [], 
        preferences = {},
        priceMultipliers = { surge: 1.0, time: 1.0, distance: 1.0 },
        maxWaitTime = 15, // maximum wait time in minutes
        maxEta = 30,      // maximum ETA in minutes
        priorityDrivers = [],
        urgentRides = []
    } = req.body;

    // Validate required parameters
    if (!riders.length || !drivers.length) {
        context.res = {
            status: 400,
            body: { error: "Riders and drivers arrays are required and must not be empty" }
        };
        return;
    }

    try {
        // Get all possible rider-driver combinations
        const allMatches = [];
        const assignedDrivers = new Set(); // Track assigned drivers to avoid duplicates
        const matchResults = [];

        // Build the initial match pool
        riders.forEach(rider => {
            const riderLocation = [rider.latitude, rider.longitude];
            const destination = rider.destination ? 
                [rider.destination.latitude, rider.destination.longitude] : null;
                
            const isUrgent = urgentRides.includes(rider.id);
            
            // Filter available drivers
            const availableDrivers = drivers.filter(driver => 
                !assignedDrivers.has(driver.id) && 
                driver.isAvailable &&
                (!preferences.vehicleType || driver.vehicleType === preferences.vehicleType)
            );
            
            availableDrivers.forEach(driver => {
                const driverLocation = [driver.latitude, driver.longitude];
                
                // Calculate distance between rider and driver
                const distance = calculateDistance(
                    riderLocation[0], 
                    riderLocation[1], 
                    driverLocation[0], 
                    driverLocation[1]
                );
                
                // Calculate estimated pickup time
                const pickupTime = estimateTravelTime(distance);
                
                // Skip if pickup time exceeds max wait time
                if (pickupTime > maxWaitTime) {
                    return;
                }
                
                // Calculate trip metrics if destination exists
                let tripDistance = 0;
                let tripDuration = 0;
                let estimatedFare = 0;
                
                if (destination) {
                    tripDistance = calculateDistance(
                        riderLocation[0],
                        riderLocation[1],
                        destination[0],
                        destination[1]
                    );
                    
                    tripDuration = estimateTravelTime(tripDistance);
                    
                    // Skip if total ETA exceeds max
                    if (pickupTime + tripDuration > maxEta) {
                        return;
                    }
                    
                    // Calculate fare based on distance, time, and other factors
                    const baseFare = 2.5; // Base fare in currency units
                    const distanceRate = driver.vehicleType === 'premium' ? 2.0 : 1.25; // Per km
                    const timeRate = driver.vehicleType === 'premium' ? 0.5 : 0.35; // Per minute
                    
                    estimatedFare = (
                        baseFare +
                        (tripDistance * distanceRate * priceMultipliers.distance) +
                        (tripDuration * timeRate * priceMultipliers.time)
                    ) * priceMultipliers.surge;
                }
                
                // Calculate match score - lower is better
                // Weighted sum of different factors
                const pickupTimeWeight = 0.5;
                const driverRatingWeight = -0.3; // Negative because higher rating is better
                const fareWeight = 0.1;
                const priorityDriverWeight = -0.2; // Bonus for priority drivers
                const urgentRideWeight = -0.4; // Bonus for urgent rides
                
                let matchScore = (pickupTime * pickupTimeWeight) + 
                                 (driver.rating * driverRatingWeight) + 
                                 (estimatedFare * fareWeight);
                
                // Apply priority driver bonus if applicable
                if (priorityDrivers.includes(driver.id)) {
                    matchScore += priorityDriverWeight;
                }
                
                // Apply urgent ride bonus if applicable
                if (isUrgent) {
                    matchScore += urgentRideWeight;
                }
                
                allMatches.push({
                    riderId: rider.id,
                    driverId: driver.id,
                    distance,
                    pickupTime,
                    tripDistance,
                    tripDuration,
                    estimatedFare,
                    matchScore,
                    driver: {
                        id: driver.id,
                        name: driver.name,
                        rating: driver.rating,
                        vehicle: driver.vehicle,
                        vehicleType: driver.vehicleType
                    }
                });
            });
        });
        
        // Sort all matches by match score (lower is better)
        allMatches.sort((a, b) => a.matchScore - b.matchScore);
        
        // Process matching algorithm 
        // For each rider, find the best driver and assign
        riders.forEach(rider => {
            // Get best match for this rider that hasn't been assigned yet
            const bestMatch = allMatches.find(match => 
                match.riderId === rider.id && 
                !assignedDrivers.has(match.driverId)
            );
            
            if (bestMatch) {
                // Mark driver as assigned
                assignedDrivers.add(bestMatch.driverId);
                
                // Add to results
                matchResults.push({
                    riderId: rider.id,
                    match: bestMatch
                });
            } else {
                // No match found for this rider
                matchResults.push({
                    riderId: rider.id,
                    match: null,
                    reason: "No suitable driver found"
                });
            }
        });

        // Return the optimal matches
        context.res = {
            status: 200,
            body: {
                matches: matchResults,
                totalMatches: matchResults.filter(r => r.match !== null).length,
                unmatched: matchResults.filter(r => r.match === null).length,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        context.log.error('Error matching optimal driver:', error);
        
        context.res = {
            status: 500,
            body: { error: "Internal server error", message: error.message }
        };
    }
};
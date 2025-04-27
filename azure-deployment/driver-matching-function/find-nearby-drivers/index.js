const { getBoundingBox, calculateDistance } = require('../shared/geo-utils');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request to find nearby drivers.');

    // Check request body
    if (!req.body) {
        context.res = {
            status: 400,
            body: { error: "Request body is required" }
        };
        return;
    }

    const { latitude, longitude, radius = 5, vehicleType = 'economy', limit = 10 } = req.body;

    // Validate required parameters
    if (!latitude || !longitude) {
        context.res = {
            status: 400,
            body: { error: "Latitude and longitude are required" }
        };
        return;
    }

    try {
        // Get drivers from database (simulated here)
        // In production, this would query a database using the bounding box for efficiency
        const { minLat, maxLat, minLng, maxLng } = getBoundingBox(latitude, longitude, radius);
        
        // Log the bounding box for debugging
        context.log(`Bounding box: ${minLat}, ${maxLat}, ${minLng}, ${maxLng}`);

        // In a real implementation, we would query our database like:
        // const drivers = await db.query(`
        //   SELECT * FROM users 
        //   WHERE role = 'driver' 
        //   AND is_available = true
        //   AND latitude BETWEEN ${minLat} AND ${maxLat}
        //   AND longitude BETWEEN ${minLng} AND ${maxLng}
        //   AND EXISTS (
        //     SELECT 1 FROM vehicles 
        //     WHERE vehicles.driver_id = users.id 
        //     AND vehicles.type = '${vehicleType}'
        //   )
        // `);

        // Simulated drivers nearby
        const allDrivers = [
            { id: 1, name: "John D.", latitude: latitude + 0.01, longitude: longitude + 0.01, rating: 4.8, vehicle: "Toyota Camry", vehicleType: "economy", isAvailable: true },
            { id: 2, name: "Emily S.", latitude: latitude - 0.005, longitude: longitude + 0.015, rating: 4.9, vehicle: "Tesla Model 3", vehicleType: "premium", isAvailable: true },
            { id: 3, name: "Michael K.", latitude: latitude + 0.02, longitude: longitude - 0.01, rating: 4.7, vehicle: "Honda Civic", vehicleType: "economy", isAvailable: true },
            { id: 4, name: "Jessica T.", latitude: latitude - 0.01, longitude: longitude - 0.02, rating: 4.6, vehicle: "BMW X5", vehicleType: "premium", isAvailable: false },
            { id: 5, name: "David L.", latitude: latitude + 0.03, longitude: longitude + 0.02, rating: 4.9, vehicle: "Ford Fusion", vehicleType: "economy", isAvailable: true },
            { id: 6, name: "Sarah M.", latitude: latitude - 0.02, longitude: longitude - 0.01, rating: 4.5, vehicle: "Toyota Prius", vehicleType: "economy", isAvailable: true },
            { id: 7, name: "Robert J.", latitude: latitude + 0.015, longitude: longitude + 0.025, rating: 4.7, vehicle: "Mercedes E-Class", vehicleType: "premium", isAvailable: true },
            { id: 8, name: "Lisa N.", latitude: latitude - 0.025, longitude: longitude + 0.01, rating: 4.8, vehicle: "Hyundai Sonata", vehicleType: "economy", isAvailable: true },
            { id: 9, name: "Kevin O.", latitude: latitude + 0.005, longitude: longitude - 0.015, rating: 4.6, vehicle: "Audi A6", vehicleType: "premium", isAvailable: true },
            { id: 10, name: "Amanda P.", latitude: latitude - 0.015, longitude: longitude - 0.005, rating: 4.9, vehicle: "Honda Accord", vehicleType: "economy", isAvailable: true }
        ];

        // Filter drivers by availability and vehicle type
        const filteredDrivers = allDrivers.filter(driver => 
            driver.isAvailable && 
            driver.vehicleType === vehicleType &&
            driver.latitude >= minLat &&
            driver.latitude <= maxLat &&
            driver.longitude >= minLng &&
            driver.longitude <= maxLng
        );

        // Calculate actual distance for each driver
        const driversWithDistance = filteredDrivers.map(driver => {
            const distance = calculateDistance(
                latitude, 
                longitude, 
                driver.latitude, 
                driver.longitude
            );
            
            // Only include drivers within the specified radius
            if (distance <= radius) {
                return {
                    ...driver,
                    distance
                };
            }
            return null;
        }).filter(driver => driver !== null);

        // Sort by distance (nearest first)
        driversWithDistance.sort((a, b) => a.distance - b.distance);

        // Apply limit if needed
        const result = driversWithDistance.slice(0, limit);

        // Return the nearby drivers
        context.res = {
            status: 200,
            body: {
                drivers: result,
                total: result.length,
                searchCenter: { latitude, longitude },
                radius,
                vehicleType
            }
        };
    } catch (error) {
        context.log.error('Error finding nearby drivers:', error);
        
        context.res = {
            status: 500,
            body: { error: "Internal server error", message: error.message }
        };
    }
};
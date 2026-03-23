module.exports = function setupSocketIo(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Rider joins their personal room to get their ride updates
        socket.on('join:rider', (riderId) => {
            if (riderId) {
                socket.join(`rider_${riderId}`);
                console.log(`🧑 Rider ${riderId} joined`);
            }
        });

        // Driver joins personal room to get new requests assigned to them
        // and broadcast their location
        socket.on('join:driver', (driverId) => {
            if (driverId) {
                socket.join(`driver_${driverId}`);
                // Drivers also join a global "available_drivers" room
                socket.join('available_drivers');
                console.log(`🧑‍✈️ Driver ${driverId} joined`);
            }
        });

        // Handle real-time GPS location updates from driver app
        socket.on('driver:location', (data) => {
            // Broadcast this driver's location to the global map or specific ride room
            // data: { driverId, lat, lng, bearing }
            io.emit('driver:location:update', data);
        });

        // Handle ride requests from rider app
        socket.on('ride:request', (data) => {
            // In a real app we'd find the nearest drivers and only emit to them
            console.log('New ride request:', data);
            io.to('available_drivers').emit('ride:new', data);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};

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
                socket.driverId = driverId;
                console.log(`🧑‍✈️ Driver ${driverId} joined`);
            }
        });

        // Handle real-time GPS location updates from driver app
        socket.on('driver:location', (data) => {
            // data: { driverId, lat, lng, bearing }
            // Broadcast to admin live map
            io.emit('driver:location:update', data);

            // Also send to any rider whose ride is being handled by this driver
            if (data.driverId) {
                // Emit to a ride-specific room if active
                io.to(`ride_driver_${data.driverId}`).emit('driver:location:live', data);
            }
        });

        // Handle ride requests from rider app
        socket.on('ride:request', (data) => {
            console.log('New ride request:', data);
            io.to('available_drivers').emit('ride:new', data);
        });

        // Driver accepts a ride — remove from available_drivers, notify rider
        socket.on('driver:accept', (data) => {
            // data: { rideId, driverId, riderId }
            if (data.driverId) {
                socket.leave('available_drivers');
                // Join ride-specific room for GPS tracking
                socket.join(`ride_driver_${data.driverId}`);
            }
            if (data.riderId) {
                io.to(`rider_${data.riderId}`).emit('ride:accepted', data);
            }
            console.log(`✅ Driver ${data.driverId} accepted ride ${data.rideId}`);
        });

        // Ride cancelled — driver rejoins available pool
        socket.on('ride:cancel', (data) => {
            // data: { rideId, driverId, riderId, cancelledBy }
            if (data.driverId) {
                socket.join('available_drivers');
                socket.leave(`ride_driver_${data.driverId}`);
            }
            if (data.riderId) {
                io.to(`rider_${data.riderId}`).emit('ride:updated', {
                    id: data.rideId,
                    status: 'cancelled'
                });
            }
            if (data.driverId && data.cancelledBy === 'rider') {
                io.to(`driver_${data.driverId}`).emit('ride:updated', {
                    id: data.rideId,
                    status: 'cancelled'
                });
            }
            console.log(`❌ Ride ${data.rideId} cancelled by ${data.cancelledBy}`);
        });

        // Ride completed — driver rejoins available pool
        socket.on('ride:completed', (data) => {
            // data: { rideId, driverId, riderId }
            if (data.driverId) {
                socket.join('available_drivers');
                socket.leave(`ride_driver_${data.driverId}`);
            }
            console.log(`🎉 Ride ${data.rideId} completed`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};

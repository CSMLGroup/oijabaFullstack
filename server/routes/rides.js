const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all ride routes
router.use(authMiddleware);

/* ── POST /api/rides ─────────────────────────
   Create a new ride request                  */
router.post('/', async (req, res) => {
    try {
        const { pickup_name, pickup_lat, pickup_lng, destination_name, destination_lat, destination_lng, vehicle_type, fare_estimate, payment_method } = req.body;

        // Generate simple ref like OIJ-8479
        const rideRef = 'OIJ-' + Math.floor(1000 + Math.random() * 9000);

        const result = await query(
            `INSERT INTO rides (ride_ref, rider_id, pickup_name, pickup_lat, pickup_lng, destination_name, destination_lat, destination_lng, vehicle_type, fare_estimate, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'searching')
       RETURNING *`,
            [rideRef, req.user.id, pickup_name, pickup_lat, pickup_lng, destination_name, destination_lat, destination_lng, vehicle_type, fare_estimate, payment_method]
        );

        const ride = result.rows[0];

        // In a real app, emit to drivers in the area via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('ride:new', ride);
        }

        res.json({ success: true, ride });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create ride request' });
    }
});

/* ── POST /api/rides/dummy ───────────────────
   Create a completed dummy ride for rating tests */
router.post('/dummy', async (req, res) => {
    try {
        const targetId = req.body?.target_id;
        if (!targetId) {
            return res.status(400).json({ error: 'target_id is required' });
        }

        let riderId = null;
        let driverId = null;

        if (req.user.role === 'rider') {
            const driver = await queryOne('SELECT id FROM drivers WHERE id = $1', [targetId]);
            if (!driver) return res.status(404).json({ error: 'Driver not found' });
            riderId = req.user.id;
            driverId = targetId;
        } else if (req.user.role === 'driver') {
            const rider = await queryOne('SELECT id FROM riders WHERE id = $1', [targetId]);
            if (!rider) return res.status(404).json({ error: 'Rider not found' });
            riderId = targetId;
            driverId = req.user.id;
        } else {
            return res.status(403).json({ error: 'Only rider or driver can create dummy rides' });
        }

        if (riderId === driverId) {
            return res.status(400).json({ error: 'Self pairing is not allowed' });
        }

        const rideRef = 'DMY-' + Math.floor(100000 + Math.random() * 900000);
        const result = await query(
            `INSERT INTO rides (
                ride_ref, rider_id, driver_id, vehicle_type,
                pickup_name, destination_name,
                status, fare_estimate, fare_final,
                accepted_at, started_at, completed_at
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6,
                'completed', $7, $8,
                NOW(), NOW(), NOW()
            ) RETURNING *`,
            [
                rideRef,
                riderId,
                driverId,
                'dummy',
                'Dummy Pickup',
                'Dummy Destination',
                50,
                50
            ]
        );

        res.json({
            success: true,
            message: 'Dummy completed ride created',
            ride: result.rows[0]
        });
    } catch (err) {
        console.error('POST /api/rides/dummy error', err);
        res.status(500).json({ error: 'Failed to create dummy ride' });
    }
});

/* ── GET /api/rides ──────────────────────────
   List rides (Admin: all, Rider: own, Driver: assigned) */
router.get('/', async (req, res) => {
    try {
        let result;
        if (req.user.role === 'admin') {
            const driverIdFilter = req.query.driver_id;
            const riderIdFilter = req.query.rider_id;
            if (driverIdFilter) {
                result = await query(`
          SELECT r.*, rd.name as rider_name, rd.phone as rider_phone, dr.name as driver_name, dr.phone as driver_phone
          FROM rides r
          LEFT JOIN riders rd ON r.rider_id = rd.id
          LEFT JOIN drivers dr ON r.driver_id = dr.id
          WHERE r.driver_id = $1
          ORDER BY r.created_at DESC
        `, [driverIdFilter]);
            } else if (riderIdFilter) {
                result = await query(`
          SELECT r.*, rd.name as rider_name, rd.phone as rider_phone, dr.name as driver_name, dr.phone as driver_phone
          FROM rides r
          LEFT JOIN riders rd ON r.rider_id = rd.id
          LEFT JOIN drivers dr ON r.driver_id = dr.id
          WHERE r.rider_id = $1
          ORDER BY r.created_at DESC
        `, [riderIdFilter]);
            } else {
                result = await query(`
          SELECT r.*, rd.name as rider_name, rd.phone as rider_phone, dr.name as driver_name, dr.phone as driver_phone
          FROM rides r
          LEFT JOIN riders rd ON r.rider_id = rd.id
          LEFT JOIN drivers dr ON r.driver_id = dr.id
          ORDER BY r.created_at DESC
          LIMIT 50
        `);
            }
        } else if (req.user.role === 'driver') {
            result = await query(`
        SELECT r.*, rd.name as rider_name, rd.phone as rider_phone
        FROM rides r
        LEFT JOIN riders rd ON r.rider_id = rd.id
        WHERE r.driver_id = $1
        ORDER BY r.created_at DESC
      `, [req.user.id]);
        } else {
            result = await query(`
        SELECT r.*, dr.name as driver_name, dr.phone as driver_phone, dr.vehicle_plate as driver_plate
        FROM rides r
        LEFT JOIN drivers dr ON r.driver_id = dr.id
        WHERE r.rider_id = $1
        ORDER BY r.created_at DESC
      `, [req.user.id]);
        }

        res.json({ rides: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch rides' });
    }
});

/* ── GET /api/rides/:id ──────────────────────
   Fetch a single ride (admins see any; riders/drivers see only their own) */
router.get('/:id', async (req, res) => {
    try {
        const rideId = req.params.id;
        const result = await query(`
            SELECT r.*,
                   rd.name as rider_name, rd.phone as rider_phone,
                   dr.name as driver_name, dr.phone as driver_phone, dr.vehicle_plate as driver_plate
            FROM rides r
            LEFT JOIN riders rd ON r.rider_id = rd.id
            LEFT JOIN drivers dr ON r.driver_id = dr.id
            WHERE r.id = $1
        `, [rideId]);

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        const ride = result.rows[0];

        // Access control: non-admins can only see rides they are part of
        if (req.user.role !== 'admin') {
            if (ride.rider_id !== req.user.id && ride.driver_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json({ ride });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ride' });
    }
});

/* ── PATCH /api/rides/:id/status ────────────
   Update ride status (accepted, started, etc) */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const rideId = req.params.id;

        // Simple validation
        const validStatuses = ['accepted', 'pickup', 'started', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        let updateQuery = 'UPDATE rides SET status = $1 ';
        const params = [status, rideId];
        let paramIndex = 3;

        // Set timestamps based on status
        if (status === 'accepted') {
            updateQuery += `, accepted_at = NOW(), driver_id = $${paramIndex++}`;
            params.push(req.user.id);
        } else if (status === 'started') {
            updateQuery += ', started_at = NOW()';
        } else if (status === 'completed') {
            updateQuery += ', completed_at = NOW()';
            // In a real app, calculate true final fare here
        }

        updateQuery += ` WHERE id = $2 RETURNING *`;

        const result = await query(updateQuery, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        const ride = result.rows[0];

        // Emit to the specific rider via socket API
        const io = req.app.get('io');
        if (io) {
            io.to(`rider_${ride.rider_id}`).emit('ride:updated', ride);
        }

        res.json({ success: true, ride });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update ride' });
    }
});

/* ── PATCH /api/rides/:id/rate ──────────────
   Rider rates driver OR driver rates rider after completed ride */
router.patch('/:id/rate', async (req, res) => {
    try {
        const rideId = req.params.id;
        const rating = Number(req.body?.rating);
        const parseOptionalIntegerRating = (value, fieldName) => {
            if (value == null) return null;
            const parsed = Number(value);
            if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
                throw new Error(`${fieldName} must be an integer between 1 and 5`);
            }
            return parsed;
        };

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
        }

        const ride = await queryOne('SELECT * FROM rides WHERE id = $1', [rideId]);
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        if (ride.status !== 'completed') {
            return res.status(400).json({ error: 'You can rate only after ride completion' });
        }

        if (req.user.role === 'rider') {
            if (ride.rider_id !== req.user.id) {
                return res.status(403).json({ error: 'You can rate only your own rides' });
            }
            if (!ride.driver_id) {
                return res.status(400).json({ error: 'No assigned driver to rate' });
            }
            if (ride.driver_rating !== null && ride.driver_rating !== undefined) {
                return res.status(409).json({ error: 'Driver already rated for this ride' });
            }
            if (ride.driver_id === ride.rider_id) {
                return res.status(400).json({ error: 'Self-rating is not allowed' });
            }

            // Accept optional per-category ratings (1-5) and comment
            let ratingDriving;
            let ratingBehavior;
            let ratingCleanliness;
            try {
                ratingDriving = parseOptionalIntegerRating(req.body?.rating_driving, 'rating_driving');
                ratingBehavior = parseOptionalIntegerRating(req.body?.rating_behavior, 'rating_behavior');
                ratingCleanliness = parseOptionalIntegerRating(req.body?.rating_cleanliness, 'rating_cleanliness');
            } catch (validationError) {
                return res.status(400).json({ error: validationError.message });
            }
            const ratingComment    = typeof req.body?.rating_comment === 'string' ? req.body.rating_comment.slice(0, 500) : null;

            const updatedRide = await queryOne(
                `UPDATE rides SET driver_rating=$1, rating_driving=$2, rating_behavior=$3, rating_cleanliness=$4, rating_comment=$5
                 WHERE id=$6 RETURNING *`,
                [rating, ratingDriving, ratingBehavior, ratingCleanliness, ratingComment, rideId]
            );

            await query(
                'UPDATE drivers SET rating_sum = COALESCE(rating_sum,0) + $1, rating_count = COALESCE(rating_count,0) + 1 WHERE id = $2',
                [rating, ride.driver_id]
            );

            return res.json({ success: true, rated: 'driver', ride: updatedRide });
        }

        if (req.user.role === 'driver') {
            if (ride.driver_id !== req.user.id) {
                return res.status(403).json({ error: 'You can rate only rides assigned to you' });
            }
            if (!ride.rider_id) {
                return res.status(400).json({ error: 'No rider to rate' });
            }
            if (ride.rider_rating !== null && ride.rider_rating !== undefined) {
                return res.status(409).json({ error: 'Rider already rated for this ride' });
            }
            if (ride.driver_id === ride.rider_id) {
                return res.status(400).json({ error: 'Self-rating is not allowed' });
            }

            let riderBehavior;
            let riderWaitTime;
            try {
                riderBehavior = parseOptionalIntegerRating(req.body?.rating_rider_behavior, 'rating_rider_behavior');
                riderWaitTime = parseOptionalIntegerRating(req.body?.rating_rider_wait_time, 'rating_rider_wait_time');
            } catch (validationError) {
                return res.status(400).json({ error: validationError.message });
            }
            const riderComment  = typeof req.body?.rating_rider_comment === 'string'
                ? req.body.rating_rider_comment.trim().slice(0, 500) || null
                : null;

            const updatedRide = await queryOne(
                `UPDATE rides
                 SET rider_rating            = $1,
                     rating_rider_behavior   = $2,
                     rating_rider_wait_time  = $3,
                     rating_rider_comment    = $4
                 WHERE id = $5 RETURNING *`,
                [rating, riderBehavior, riderWaitTime, riderComment, rideId]
            );

            await query(
                'UPDATE riders SET rating_sum = COALESCE(rating_sum,0) + $1, rating_count = COALESCE(rating_count,0) + 1 WHERE id = $2',
                [rating, ride.rider_id]
            );

            return res.json({ success: true, rated: 'rider', ride: updatedRide });
        }

        return res.status(403).json({ error: 'Only rider or driver can submit ratings' });
    } catch (err) {
        console.error('PATCH /api/rides/:id/rate error', err);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
});

module.exports = router;

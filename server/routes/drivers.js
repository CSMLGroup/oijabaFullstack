const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db');
const authMiddleware = require('../middleware/auth');

async function syncDriverPrimaryVehicle(driverId) {
    const primary = await queryOne(
        `SELECT vehicle_type, vehicle_model, vehicle_plate
         FROM driver_vehicles
         WHERE driver_id = $1 AND is_primary = TRUE
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1`,
        [driverId]
    );

    await query(
        `UPDATE drivers
         SET vehicle_type = $1,
             vehicle_model = $2,
             vehicle_plate = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [primary?.vehicle_type || null, primary?.vehicle_model || null, primary?.vehicle_plate || null, driverId]
    );
}

/* ── GET /api/drivers ────────────────────────
   List drivers (Public for admin dashboard)  */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let dbQuery = 'SELECT * FROM drivers ORDER BY created_at DESC';
        let params = [];

        if (status && status !== 'all') {
            dbQuery = 'SELECT * FROM drivers WHERE status = $1 ORDER BY created_at DESC';
            params.push(status);
        }

        const result = await query(dbQuery, params);
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});

/* ── PATCH /api/drivers/:id/approve ─────────
   Approve or reject a driver (Admin only)    */
router.patch('/:id/approve', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { action } = req.body; // 'approve' or 'reject'
        const newStatus = action === 'approve' ? 'active' : 'rejected';

        const result = await query(
            'UPDATE drivers SET status = $1 WHERE id = $2 RETURNING *',
            [newStatus, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.json({ success: true, driver: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update driver status' });
    }
});

/* ── PATCH /api/drivers/location ────────────
   Driver updates their real-time location    */
router.patch('/location', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Driver access required' });
        }

        const { lat, lng } = req.body;

        await query(
            'UPDATE drivers SET current_lat = $1, current_lng = $2, is_online = TRUE WHERE id = $3',
            [lat, lng, req.user.id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update location' });
    }
});

/* ── PATCH /api/drivers/online-status ─────────
   Driver toggles their online / offline status  */
router.patch('/online-status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Driver access required' });
        }
        const { is_online } = req.body;
        if (typeof is_online !== 'boolean') {
            return res.status(400).json({ error: 'is_online must be a boolean' });
        }
        await query(
            'UPDATE drivers SET is_online = $1 WHERE id = $2',
            [is_online, req.user.id]
        );
        res.json({ success: true, is_online });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update online status' });
    }
});

/* ── PATCH /api/drivers/profile ──────────────
   Driver updates their profile after OTP login */
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        // PATCH /api/drivers/profile — persist driver profile fields and images
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Driver access required' });
        }

            const {
                name,
                name_bn,
                area,
                district,
                upazilla,
                house_no,
                road_no,
                landmark,
                post_office,
                vehicle_type,
                vehicle_model,
                vehicle_plate,
                nid_number,
                driver_license,
                driver_license_image,
                profile_image
            } = req.body;

        const result = await query(
            `/* drivers profile update v2 */ UPDATE drivers SET 
                name = COALESCE($1, name),
                name_bn = COALESCE($2, name_bn),
                area = COALESCE($3, area),
                district = COALESCE($4, district),
                upazilla = COALESCE($5, upazilla),
                house_no = COALESCE($6, house_no),
                road_no = COALESCE($7, road_no),
                landmark = COALESCE($8, landmark),
                post_office = COALESCE($9, post_office),
                vehicle_type = COALESCE($10, vehicle_type),
                vehicle_model = COALESCE($11, vehicle_model),
                vehicle_plate = COALESCE($12, vehicle_plate),
                nid_number = COALESCE($13, nid_number),
                driver_license = COALESCE($14::text, driver_license),
                updated_at = NOW()
             WHERE id = $15 RETURNING *`,
            [
                name,
                name_bn,
                area,
                district,
                upazilla,
                house_no,
                road_no,
                landmark,
                post_office,
                vehicle_type,
                vehicle_model,
                vehicle_plate,
                nid_number,
                driver_license || null,
                req.user.id
            ]
        );

        // Persist image fields in separate statements to avoid type/cast issues
        // Only update when a real data URL is provided (non-null, non-empty)
        if (driver_license_image) {
            await query(`UPDATE drivers SET driver_license_image = $1, updated_at = NOW() WHERE id = $2`, [driver_license_image, req.user.id]);
        }
        if (profile_image) {
            await query(`UPDATE drivers SET profile_image = $1, updated_at = NOW() WHERE id = $2`, [profile_image, req.user.id]);
        }

        const fresh = await query('SELECT * FROM drivers WHERE id = $1', [req.user.id]);
        res.json({ success: true, user: fresh.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/* ── GET /api/drivers/vehicles ─────────────
   Driver lists all own vehicles             */
router.get('/vehicles', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Driver access required' });
        }

        const result = await query(
            `SELECT *
             FROM driver_vehicles
             WHERE driver_id = $1
             ORDER BY is_primary DESC, created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, vehicles: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch driver vehicles' });
    }
});

/* ── POST /api/drivers/vehicles ────────────
   Driver adds a new vehicle                 */
router.post('/vehicles', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Driver access required' });
        }

        const vehicleType = String(req.body?.vehicle_type || '').trim();
        const vehicleModel = req.body?.vehicle_model == null ? null : String(req.body.vehicle_model).trim() || null;
        const vehiclePlate = String(req.body?.vehicle_plate || '').trim();
        const driverLicense = req.body?.driver_license == null ? null : String(req.body.driver_license).trim() || null;
        const color = req.body?.color == null ? null : String(req.body.color).trim() || null;
        const year = req.body?.year == null ? null : String(req.body.year).trim() || null;
        const capacity = req.body?.capacity == null ? null : String(req.body.capacity).trim() || null;
        const registrationNumber = req.body?.registration_number == null ? null : String(req.body.registration_number).trim() || null;
        const engineChassisNumber = req.body?.engine_chassis_number == null ? null : String(req.body.engine_chassis_number).trim() || null;
        const notes = req.body?.notes == null ? null : String(req.body.notes).trim() || null;
        const vehicleFrontImage = req.body?.vehicle_front_image == null ? null : String(req.body.vehicle_front_image).trim() || null;
        const vehicleRearImage = req.body?.vehicle_rear_image == null ? null : String(req.body.vehicle_rear_image).trim() || null;
        const vehicleLeftImage = req.body?.vehicle_left_image == null ? null : String(req.body.vehicle_left_image).trim() || null;
        const vehicleRightImage = req.body?.vehicle_right_image == null ? null : String(req.body.vehicle_right_image).trim() || null;

        if (!vehicleType || !vehiclePlate) {
            return res.status(400).json({ error: 'vehicle_type and vehicle_plate are required' });
        }

        const existingCount = await queryOne(
            'SELECT COUNT(*)::int AS count FROM driver_vehicles WHERE driver_id = $1',
            [req.user.id]
        );
        const setPrimary = Number(existingCount?.count || 0) === 0;

        const inserted = await queryOne(
            `INSERT INTO driver_vehicles (
                driver_id,
                vehicle_type,
                vehicle_model,
                vehicle_plate,
                color,
                year,
                capacity,
                registration_number,
                engine_number,
                notes,
                vehicle_front_image,
                vehicle_rear_image,
                vehicle_left_image,
                vehicle_right_image,
                is_primary,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
            RETURNING *`,
            [
                req.user.id,
                vehicleType,
                vehicleModel,
                vehiclePlate,
                color,
                year,
                capacity,
                registrationNumber || driverLicense,
                engineChassisNumber,
                notes,
                vehicleFrontImage,
                vehicleRearImage,
                vehicleLeftImage,
                vehicleRightImage,
                setPrimary
            ]
        );

        if (setPrimary) {
            await syncDriverPrimaryVehicle(req.user.id);
        }

        const vehicles = await query(
            `SELECT *
             FROM driver_vehicles
             WHERE driver_id = $1
             ORDER BY is_primary DESC, created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, vehicle: inserted, vehicles: vehicles.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add driver vehicle' });
    }
});

/* ── PATCH /api/drivers/vehicles/:id/active ─
   Driver selects one active vehicle          */
router.patch('/vehicles/:id/active', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Driver access required' });
        }

        const ownedVehicle = await queryOne(
            'SELECT id FROM driver_vehicles WHERE id = $1 AND driver_id = $2 LIMIT 1',
            [req.params.id, req.user.id]
        );

        if (!ownedVehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        await query(
            'UPDATE driver_vehicles SET is_primary = FALSE, updated_at = NOW() WHERE driver_id = $1',
            [req.user.id]
        );

        const activeVehicle = await queryOne(
            'UPDATE driver_vehicles SET is_primary = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        await syncDriverPrimaryVehicle(req.user.id);

        const vehicles = await query(
            `SELECT *
             FROM driver_vehicles
             WHERE driver_id = $1
             ORDER BY is_primary DESC, created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, active_vehicle: activeVehicle, vehicles: vehicles.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to set active vehicle' });
    }
});

/* ── DELETE /api/drivers/vehicles/:id ─────
   Driver deletes one own vehicle            */
router.delete('/vehicles/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Driver access required' });
        }

        const allVehicles = await query(
            `SELECT id, is_primary
             FROM driver_vehicles
             WHERE driver_id = $1
             ORDER BY is_primary DESC, created_at ASC`,
            [req.user.id]
        );

        const vehicles = allVehicles.rows;
        const target = vehicles.find((item) => item.id === req.params.id);

        if (!target) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (vehicles.length <= 1) {
            return res.status(400).json({ error: 'At least one active vehicle is required' });
        }

        await query('DELETE FROM driver_vehicles WHERE id = $1 AND driver_id = $2', [req.params.id, req.user.id]);

        if (target.is_primary) {
            const nextActive = await queryOne(
                `SELECT id
                 FROM driver_vehicles
                 WHERE driver_id = $1
                 ORDER BY created_at ASC
                 LIMIT 1`,
                [req.user.id]
            );

            if (nextActive?.id) {
                await query(
                    'UPDATE driver_vehicles SET is_primary = TRUE, updated_at = NOW() WHERE id = $1',
                    [nextActive.id]
                );
            }
        }

        await syncDriverPrimaryVehicle(req.user.id);

        const updatedVehicles = await query(
            `SELECT *
             FROM driver_vehicles
             WHERE driver_id = $1
             ORDER BY is_primary DESC, created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, vehicles: updatedVehicles.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

/* ── POST /api/drivers/ratings/disputes ─────
   Driver submits a rating dispute for a ride */
router.post('/ratings/disputes', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Driver access required' });
        }

        const rideRef = String(req.body?.ride_ref || '').trim();
        const reason = String(req.body?.reason || '').trim();

        if (!rideRef || !reason) {
            return res.status(400).json({ error: 'ride_ref and reason are required' });
        }

        const ride = await queryOne(
            'SELECT id, ride_ref, driver_id, driver_rating FROM rides WHERE ride_ref = $1 LIMIT 1',
            [rideRef]
        );

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found for this reference' });
        }

        if (ride.driver_id !== req.user.id) {
            return res.status(403).json({ error: 'You can dispute ratings only for your own rides' });
        }

        const inserted = await queryOne(
            `INSERT INTO driver_rating_disputes (driver_id, ride_id, ride_ref, current_rating, reason, status)
             VALUES ($1, $2, $3, $4, $5, 'open')
             RETURNING *`,
            [req.user.id, ride.id, ride.ride_ref, ride.driver_rating, reason]
        );

        res.json({ success: true, dispute: inserted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit rating dispute' });
    }
});

/* ── GET /api/drivers/ratings/disputes ──────
   Driver: own disputes, Admin: all disputes   */
router.get('/ratings/disputes', authMiddleware, async (req, res) => {
    try {
        if (!['driver', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Driver or admin access required' });
        }

        let result;

        if (req.user.role === 'admin') {
            result = await query(
                `SELECT d.*, dr.name AS driver_name, dr.phone AS driver_phone
                 FROM driver_rating_disputes d
                 LEFT JOIN drivers dr ON dr.id = d.driver_id
                 ORDER BY d.created_at DESC`
            );
        } else {
            result = await query(
                `SELECT *
                 FROM driver_rating_disputes
                 WHERE driver_id = $1
                 ORDER BY created_at DESC`,
                [req.user.id]
            );
        }

        res.json({ disputes: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch rating disputes' });
    }
});

/* ── GET /api/drivers/:id ─────────────────────
   Admin fetches a single driver by ID           */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const driver = await queryOne(
            `SELECT d.*,
                    COUNT(DISTINCT r.id)::int AS rides_count,
                    COALESCE(SUM(COALESCE(r.fare_final, r.fare_estimate, 0)), 0) AS earnings
             FROM drivers d
             LEFT JOIN rides r ON r.driver_id = d.id AND r.status = 'completed'
             WHERE d.id = $1
             GROUP BY d.id`,
            [req.params.id]
        );
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json({ success: true, user: driver });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch driver' });
    }
});

/* ── GET /api/drivers/:id/vehicles ───────────
   Admin fetches all vehicles for a driver      */
router.get('/:id/vehicles', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const result = await query(
            `SELECT * FROM driver_vehicles WHERE driver_id = $1 ORDER BY is_primary DESC, created_at DESC`,
            [req.params.id]
        );
        res.json({ success: true, vehicles: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch driver vehicles' });
    }
});

/* ── POST /api/drivers/:id/vehicles ─────────
   Admin adds a vehicle for a driver          */
router.post('/:id/vehicles', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const driverId = req.params.id;
        const driver = await queryOne('SELECT id FROM drivers WHERE id = $1 LIMIT 1', [driverId]);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        const vehicleType = String(req.body?.vehicle_type || '').trim();
        const vehicleModel = req.body?.vehicle_model == null ? null : String(req.body.vehicle_model).trim() || null;
        const vehiclePlate = String(req.body?.vehicle_plate || '').trim();
        const driverLicense = req.body?.driver_license == null ? null : String(req.body.driver_license).trim() || null;
        const color = req.body?.color == null ? null : String(req.body.color).trim() || null;
        const capacity = req.body?.capacity == null ? null : String(req.body.capacity).trim() || null;
        const registrationNumber = req.body?.registration_number == null ? null : String(req.body.registration_number).trim() || null;
        const engineChassisNumber = req.body?.engine_chassis_number == null ? null : String(req.body.engine_chassis_number).trim() || null;
        const notes = req.body?.notes == null ? null : String(req.body.notes).trim() || null;
        const vehicleFrontImage = req.body?.vehicle_front_image == null ? null : String(req.body.vehicle_front_image).trim() || null;
        const vehicleRearImage = req.body?.vehicle_rear_image == null ? null : String(req.body.vehicle_rear_image).trim() || null;
        const vehicleLeftImage = req.body?.vehicle_left_image == null ? null : String(req.body.vehicle_left_image).trim() || null;
        const vehicleRightImage = req.body?.vehicle_right_image == null ? null : String(req.body.vehicle_right_image).trim() || null;

        if (!vehicleType || !vehiclePlate) {
            return res.status(400).json({ error: 'vehicle_type and vehicle_plate are required' });
        }

        const existingCount = await queryOne(
            'SELECT COUNT(*)::int AS count FROM driver_vehicles WHERE driver_id = $1',
            [driverId]
        );
        const setPrimary = Number(existingCount?.count || 0) === 0;

        const inserted = await queryOne(
            `INSERT INTO driver_vehicles (
                driver_id,
                vehicle_type,
                vehicle_model,
                vehicle_plate,
                color,
                capacity,
                registration_number,
                engine_number,
                notes,
                vehicle_front_image,
                vehicle_rear_image,
                vehicle_left_image,
                vehicle_right_image,
                is_primary,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
            RETURNING *`,
            [
                driverId,
                vehicleType,
                vehicleModel,
                vehiclePlate,
                color,
                capacity,
                registrationNumber || driverLicense,
                engineChassisNumber,
                notes,
                vehicleFrontImage,
                vehicleRearImage,
                vehicleLeftImage,
                vehicleRightImage,
                setPrimary
            ]
        );

        if (setPrimary) {
            await syncDriverPrimaryVehicle(driverId);
        }

        const vehicles = await query(
            `SELECT * FROM driver_vehicles WHERE driver_id = $1 ORDER BY is_primary DESC, created_at DESC`,
            [driverId]
        );

        res.json({ success: true, vehicle: inserted, vehicles: vehicles.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add driver vehicle' });
    }
});

/* ── PATCH /api/drivers/:id ──────────────────
   Admin updates any driver profile field       */
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const allowed = ['name', 'name_bn', 'phone', 'area', 'district', 'upazilla', 'house_no', 'road_no', 'landmark', 'post_office', 'vehicle_type', 'vehicle_model', 'vehicle_plate', 'nid_number', 'driver_license', 'status', 'is_online', 'profile_image', 'driver_license_image'];
        const updates = [];
        const values = [];
        let idx = 1;

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                updates.push(`${key} = $${idx++}`);
                if (key === 'is_online') {
                    const raw = req.body[key];
                    const boolValue = raw === true || raw === 'true' || raw === 1 || raw === '1';
                    values.push(boolValue);
                } else {
                    values.push(req.body[key] === '' ? null : req.body[key]);
                }
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        updates.push(`updated_at = NOW()`);
        values.push(req.params.id);

        const updated = await queryOne(
            `UPDATE drivers SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        if (!updated) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json({ success: true, user: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update driver' });
    }
});

/* ── PATCH /api/drivers/:id/vehicles/:vid/primary ──
   Admin sets a vehicle as primary for a driver     */
router.patch('/:id/vehicles/:vid/primary', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const vehicle = await queryOne(
            'SELECT id FROM driver_vehicles WHERE id = $1 AND driver_id = $2 LIMIT 1',
            [req.params.vid, req.params.id]
        );
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        await query(
            'UPDATE driver_vehicles SET is_primary = FALSE, updated_at = NOW() WHERE driver_id = $1',
            [req.params.id]
        );
        await query(
            'UPDATE driver_vehicles SET is_primary = TRUE, updated_at = NOW() WHERE id = $1',
            [req.params.vid]
        );
        await syncDriverPrimaryVehicle(req.params.id);

        const vehicles = await query(
            `SELECT * FROM driver_vehicles WHERE driver_id = $1 ORDER BY is_primary DESC, created_at DESC`,
            [req.params.id]
        );
        res.json({ success: true, vehicles: vehicles.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to set primary vehicle' });
    }
});

/* ── PATCH /api/drivers/:id/vehicles/:vid ─────
   Admin updates a vehicle record               */
router.patch('/:id/vehicles/:vid', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const allowed = [
            'vehicle_type',
            'vehicle_model',
            'vehicle_plate',
            'color',
            'year',
            'capacity',
            'registration_number',
            'engine_number',
            'notes',
            'vehicle_front_image',
            'vehicle_rear_image',
            'vehicle_left_image',
            'vehicle_right_image'
        ];
        const updates = [];
        const values = [];
        let idx = 1;

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                updates.push(`${key} = $${idx++}`);
                values.push(req.body[key] === '' ? null : req.body[key]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        updates.push(`updated_at = NOW()`);
        values.push(req.params.vid);
        values.push(req.params.id);

        const updated = await queryOne(
            `UPDATE driver_vehicles SET ${updates.join(', ')} WHERE id = $${idx} AND driver_id = $${idx + 1} RETURNING *`,
            values
        );

        if (!updated) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({ success: true, vehicle: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

/* ── DELETE /api/drivers/:id/vehicles/:vid ────
   Admin deletes a vehicle record               */
router.delete('/:id/vehicles/:vid', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const deleted = await queryOne(
            `DELETE FROM driver_vehicles WHERE id = $1 AND driver_id = $2 RETURNING id`,
            [req.params.vid, req.params.id]
        );

        if (!deleted) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

/* ── PATCH /api/drivers/ratings/disputes/:id ─
   Admin updates dispute status/note            */
router.patch('/ratings/disputes/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const allowedStatus = ['open', 'under_review', 'resolved', 'rejected'];
        const status = String(req.body?.status || '').trim();
        const adminNote = req.body?.admin_note == null ? null : String(req.body.admin_note);

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await queryOne(
            `UPDATE driver_rating_disputes
             SET status = $1,
                 admin_note = $2,
                 updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [status, adminNote, req.params.id]
        );

        if (!updated) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        res.json({ success: true, dispute: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update dispute' });
    }
});

module.exports = router;

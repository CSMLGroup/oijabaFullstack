const express = require('express');
const router = express.Router();
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/* ── POST /api/parcels ───────────────────────
   Create a new parcel request                 */
router.post('/', async (req, res) => {
    try {
        const {
            sender_name, sender_phone, receiver_name, receiver_phone,
            pickup_location, delivery_location, item_type, item_size,
            delivery_fee, payment_method
        } = req.body;

        const parcelRef = 'OIJ-P-' + Math.floor(10000 + Math.random() * 90000);

        const result = await query(
            `INSERT INTO parcels 
        (parcel_ref, sender_name, sender_phone, receiver_name, receiver_phone, pickup_location, delivery_location, item_type, item_size, delivery_fee, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING *`,
            [parcelRef, sender_name, sender_phone, receiver_name, receiver_phone, pickup_location, delivery_location, item_type, item_size, delivery_fee, payment_method]
        );

        const parcel = result.rows[0];

        // Notify admin/drivers
        const io = req.app.get('io');
        if (io) {
            io.emit('parcel:new', parcel);
        }

        res.json({ success: true, parcel });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create parcel request' });
    }
});

/* ── GET /api/parcels/:id ────────────────────
   Get parcel detail (tracking)                */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let dbQuery;
        let params;

        // We can search by UUID or by reference string "OIJ-P-XXXX"
        if (id.startsWith('OIJ-P-')) {
            dbQuery = 'SELECT * FROM parcels WHERE parcel_ref = $1';
            params = [id];
        } else {
            dbQuery = 'SELECT * FROM parcels WHERE id = $1';
            params = [id];
        }

        const result = await query(dbQuery, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Parcel not found' });
        }

        res.json({ parcel: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch parcel' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/vehicles - List all vehicles
router.get('/', async (req, res) => {
    try {
        const includeDisabled = req.query.include_disabled === 'true';
        const sql = includeDisabled
            ? 'SELECT * FROM vehicles ORDER BY sort_order ASC, name ASC'
            : 'SELECT * FROM vehicles WHERE enabled = TRUE ORDER BY sort_order ASC, name ASC';

        const vehicles = await db.query(sql);
        res.json({ success: true, vehicles: vehicles.rows });
    } catch (err) {
        console.error('Error fetching vehicles:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch vehicles' });
    }
});

// PATCH /api/vehicles/:id - Update vehicle settings
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        enabled,
        fare,
        capacity,
        base_fare,
        per_km_rate,
        min_fare,
        fare_rule_en,
        fare_rule_bn,
        sort_order
    } = req.body;

    try {
        const result = await db.query(
            `UPDATE vehicles
             SET enabled = COALESCE($1, enabled),
                 fare = COALESCE($2, fare),
                 capacity = COALESCE($3, capacity),
                 base_fare = COALESCE($4, base_fare),
                 per_km_rate = COALESCE($5, per_km_rate),
                 min_fare = COALESCE($6, min_fare),
                 fare_rule_en = COALESCE($7, fare_rule_en),
                 fare_rule_bn = COALESCE($8, fare_rule_bn),
                 sort_order = COALESCE($9, sort_order),
                 updated_at = NOW()
             WHERE id = $10
             RETURNING *`,
            [enabled, fare, capacity, base_fare, per_km_rate, min_fare, fare_rule_en, fare_rule_bn, sort_order, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Vehicle not found' });
        }

        res.json({ success: true, vehicle: result.rows[0] });
    } catch (err) {
        console.error('Error updating vehicle:', err);
        res.status(500).json({ success: false, error: 'Failed to update vehicle' });
    }
});

module.exports = router;

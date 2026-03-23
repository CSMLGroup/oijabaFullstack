const express = require('express');
const router = express.Router();
const { query } = require('../db');
const authMiddleware = require('../middleware/auth');

/* ── GET /api/riders ─────────────────────────
   List all riders (Public for admin dashboard) */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let dbQuery = `
            SELECT r.*,
                   CAST(COUNT(rides.id) AS INTEGER) as rides_completed
            FROM riders r
            LEFT JOIN rides ON r.id = rides.rider_id
            ${status && status !== 'all' ? 'WHERE r.status = $1' : ''}
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `;
        let params = [];

        if (status && status !== 'all') {
            params.push(status);
        }

        const result = await query(dbQuery, params);
        res.json({ data: result.rows });
    } catch (err) {
        console.error('GET /api/riders error', err);
        res.status(500).json({ error: 'Failed to fetch riders' });
    }
});


/* ── POST /api/riders/register ───────────────
   Rider registration via phone + OTP (static 1234)
   NOTE: OTP is validated on client for now; server only creates the rider.
*/
router.post('/register', async (req, res) => {
    try {
        const { name, phone } = req.body || {};
        if (!phone || !/^\d{11}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number.' });
        }

        // Check if rider already exists
        const exists = await query('SELECT id FROM riders WHERE phone = $1', [phone]);
        if (exists.rowCount > 0) {
            return res.status(400).json({ success: false, message: 'This mobile number is already registered. Please log in instead.' });
        }

        // Insert new rider
        const result = await query(
            'INSERT INTO riders (name, phone) VALUES ($1, $2) RETURNING *',
            [name || null, phone]
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('POST /api/riders/register error', err);
        res.status(500).json({ success: false, message: 'Registration failed.' });
    }
});


/* ── GET /api/riders/:id ─────────────────────
   Get rider profile + history                 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const riderRes = await query('SELECT * FROM riders WHERE id = $1', [req.params.id]);
        if (riderRes.rowCount === 0) {
            return res.status(404).json({ error: 'Rider not found' });
        }

        const rider = riderRes.rows[0];

        // Fetch ride history
        const historyRes = await query(`
      SELECT r.*, d.name as driver_name, d.phone as driver_phone, d.vehicle_type
      FROM rides r
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.rider_id = $1
      ORDER BY r.created_at DESC LIMIT 10
    `, [rider.id]);

        res.json({ rider, recent_rides: historyRes.rows });
    } catch (err) {
        console.error('GET /api/riders/:id error', err);
        res.status(500).json({ error: 'Failed to fetch rider profile' });
    }
});


/* ── PATCH /api/riders/profile ──────────────
   Rider updates their profile after OTP login */
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'rider') {
            return res.status(403).json({ error: 'Rider access required' });
        }

        const { name, name_bn, district, upazilla, house_no, road_no, landmark, post_office, profile_image } = req.body;
        const areaDisplay = [house_no, road_no, upazilla, district].filter(Boolean).join(', ') || null;

        const result = await query(
            `UPDATE riders SET 
                name = CASE
                    WHEN (name IS NULL OR name = '') THEN COALESCE($1, name)
                    ELSE name
                END,
                name_bn      = COALESCE($2, name_bn),
                district     = COALESCE($3, district),
                upazilla     = COALESCE($4, upazilla),
                house_no     = COALESCE($5, house_no),
                road_no      = COALESCE($6, road_no),
                landmark     = COALESCE($7, landmark),
                post_office  = COALESCE($8, post_office),
                area         = COALESCE($9, area),
                profile_image = COALESCE($10, profile_image),
                updated_at   = NOW()
             WHERE id = $11 RETURNING *`,
            [name, name_bn, district || null, upazilla || null,
             house_no || null, road_no || null, landmark || null,
             post_office || null, areaDisplay, profile_image || null, req.user.id]
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('PATCH /api/riders/profile error', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/* ── PATCH /api/riders/:id ──────────────────
   Admin dashboard update */
router.patch('/:id', async (req, res) => {
    try {
        const { name, name_bn, phone, nid_number, district, upazilla, house_no, road_no, landmark, post_office, membership, status, profile_image } = req.body;
        const areaDisplay = [house_no, road_no, upazilla, district].filter(Boolean).join(', ') || null;

        const result = await query(
            `UPDATE riders SET
                name         = COALESCE($1, name),
                name_bn      = COALESCE($2, name_bn),
                phone        = COALESCE($3, phone),
                nid_number   = COALESCE($4, nid_number),
                district     = COALESCE($5, district),
                upazilla     = COALESCE($6, upazilla),
                house_no     = COALESCE($7, house_no),
                road_no      = COALESCE($8, road_no),
                landmark     = COALESCE($9, landmark),
                post_office  = COALESCE($10, post_office),
                area         = COALESCE($11, area),
                membership   = COALESCE($12, membership),
                status       = COALESCE($13, status),
                profile_image = COALESCE($14, profile_image),
                updated_at   = NOW()
             WHERE id = $15 RETURNING *`,
            [name || null, name_bn || null, phone || null, nid_number || null,
             district || null, upazilla || null,
             house_no || null, road_no || null, landmark || null,
             post_office || null, areaDisplay,
             membership || null, status || null, profile_image || null, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Rider not found' });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('PATCH /api/riders/:id error', err);
        res.status(500).json({ error: 'Failed to update rider' });
    }
});

/* ── DELETE /api/riders/:id ─────────────────
   Admin dashboard delete rider safely */
router.delete('/:id', async (req, res) => {
    try {
        await query('UPDATE rides SET rider_id = NULL WHERE rider_id = $1', [req.params.id]);

        const result = await query('DELETE FROM riders WHERE id = $1 RETURNING id, name, phone', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Rider not found' });
        }

        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('DELETE /api/riders/:id error', err);
        res.status(500).json({ error: 'Failed to delete rider' });
    }
});

module.exports = router;

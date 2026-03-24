const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db');
const jwt = require('jsonwebtoken');

const OTP_EXPIRY_MINUTES = 10;

/* ── POST /api/auth/send-otp ──────────────────
   Send (mock) OTP to phone number             */
router.post('/send-otp', async (req, res) => {
    try {
        let body = req.body;
        if (!body || typeof body !== 'object') {
            try {
                body = JSON.parse(req.body);
            } catch (err) {
                console.error('Body parse error:', err);
                body = {};
            }
        }

        const { phone, user_type = 'rider', mode = 'login' } = body;
        if (!phone) {
            console.error('Missing phone in request body:', body);
            return res.status(400).json({ error: 'Phone number required' });
        }
        if (!['rider', 'driver', 'admin'].includes(user_type)) {
            console.error('Invalid user_type:', user_type);
            return res.status(400).json({ error: 'Invalid user type' });
        }
        if (user_type === 'admin' && mode !== 'login') {
            console.error('Admin registration attempted:', body);
            return res.status(400).json({ error: 'Admin registration is disabled' });
        }

        // Use your queryOne helper for DB queries
        if (mode === 'register') {
            const table = user_type === 'driver' ? 'drivers' : 'riders';
            const exists = await queryOne(`SELECT id FROM ${table} WHERE phone = $1`, [phone]);
            if (exists) {
                return res.status(409).json({ error: 'This mobile number is already registered. Please log in instead.' });
            }
        }
        if (user_type === 'admin') {
            const admin = await queryOne('SELECT id FROM admins WHERE phone = $1 AND status = $2', [phone, 'active']);
            if (!admin) {
                return res.status(403).json({ error: 'admin_only', message: 'Admin account not found or inactive.' });
            }
        }
        if (mode === 'login' && user_type === 'rider') {
            const isDriver = await queryOne('SELECT id FROM drivers WHERE phone = $1', [phone]);
            if (isDriver) {
                const isAlsoRider = await queryOne('SELECT id FROM riders WHERE phone = $1', [phone]);
                if (!isAlsoRider) {
                    return res.status(403).json({ error: 'driver_portal', message: 'This number is registered as a driver. Please use the Driver Portal to log in.' });
                }
            }
        }
        // Generate OTP (for demo, always 1234)
        const otp = '1234';

        // Store in database so verify-otp can find it
        await query(
            'INSERT INTO otps (phone, otp, user_type, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'10 minutes\')',
            [phone, otp, user_type]
        );

        // In production, send OTP via SMS here
        return res.status(200).json({ success: true, otp });
    } catch (err) {
        console.error('Handler error:', err);
        res.status(500).json({ error: 'Failed to process send-otp', details: err.message });
    }
});

/* ── POST /api/auth/verify-otp ───────────────
   Verify OTP → return JWT                    */
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp, user_type = 'rider' } = req.body;
        if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
        if (!['rider', 'driver', 'admin'].includes(user_type)) {
            return res.status(400).json({ error: 'Invalid user type' });
        }

        const otpRecord = await queryOne(
            `SELECT * FROM otps
       WHERE phone = $1 AND otp = $2 AND user_type = $3 AND used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
            [phone, otp, user_type]
        );

        if (!otpRecord) return res.status(401).json({ error: 'Invalid or expired OTP' });

        // Mark OTP used
        await query('UPDATE otps SET used = TRUE WHERE id = $1', [otpRecord.id]);

        // Find or create user
        let user = null;
        let isNew = false;
        if (user_type === 'driver') {
            user = await queryOne('SELECT * FROM drivers WHERE phone = $1', [phone]);
            if (!user) {
                user = (await query(
                    'INSERT INTO drivers (phone, status) VALUES ($1, $2) RETURNING *', [phone, 'pending']
                )).rows[0];
                isNew = true;
            } else if (!user.name) {
                isNew = true; // Exists but registration not completed
            }
        } else if (user_type === 'admin') {
            user = await queryOne('SELECT * FROM admins WHERE phone = $1 AND status = $2', [phone, 'active']);
            if (!user) {
                return res.status(403).json({ error: 'Admin account not found or inactive' });
            }
        } else {
            user = await queryOne('SELECT * FROM riders WHERE phone = $1', [phone]);
            if (!user) {
                user = (await query(
                    'INSERT INTO riders (phone) VALUES ($1) RETURNING *', [phone]
                )).rows[0];
                isNew = true;
            }
        }

        // Sign JWT
        const token = jwt.sign(
            { id: user.id, phone, role: user_type },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            is_new: isNew,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user_type,
                status: user.status
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

/* ── GET /api/auth/me ─────────────────────── */
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        let user;
        if (req.user.role === 'driver') {
            user = await queryOne('SELECT * FROM drivers WHERE id = $1', [req.user.id]);
        } else if (req.user.role === 'admin') {
            user = await queryOne('SELECT * FROM admins WHERE id = $1', [req.user.id]);
        } else {
            user = await queryOne('SELECT * FROM riders WHERE id = $1', [req.user.id]);
        }
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: { ...user, role: req.user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;

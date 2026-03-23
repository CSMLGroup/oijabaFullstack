const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

function requireDriver(req, res) {
    if (req.user.role !== 'driver') {
        res.status(403).json({ error: 'Driver access required' });
        return false;
    }
    return true;
}

/* Ensure wallet row exists, return it */
async function ensureWallet(driverId) {
    await query(
        `INSERT INTO driver_wallet (driver_id) VALUES ($1) ON CONFLICT (driver_id) DO NOTHING`,
        [driverId]
    );
    return queryOne(`SELECT * FROM driver_wallet WHERE driver_id = $1`, [driverId]);
}

/* ── GET /api/earnings ──────────────────────
   Summary: balance + totals + tax breakdown  */
router.get('/', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        const wallet = await ensureWallet(req.user.id);

        // Aggregate from completed rides not yet credited via transactions
        const rideAgg = await queryOne(
            `SELECT
               COUNT(*)::int                   AS ride_count,
               COALESCE(SUM(fare_final), 0)    AS gross_earned,
               COALESCE(SUM(fare_final * 0.05), 0) AS platform_fee,
               COALESCE(SUM(fare_final * 0.01), 0) AS tax_vat
             FROM rides
             WHERE driver_id = $1 AND status = 'completed' AND fare_final IS NOT NULL`,
            [req.user.id]
        );

        const grossEarned   = Number(rideAgg?.gross_earned  || 0);
        const platformFee   = Number(rideAgg?.platform_fee  || 0);
        const taxVat        = Number(rideAgg?.tax_vat       || 0);
        const netEarned     = grossEarned - platformFee - taxVat;

        res.json({
            success: true,
            wallet: {
                balance:          Number(wallet?.balance          || 0),
                total_earned:     Number(wallet?.total_earned     || 0),
                total_withdrawn:  Number(wallet?.total_withdrawn  || 0)
            },
            tax_breakdown: {
                gross_earned:   grossEarned,
                platform_fee:   platformFee,
                tax_vat:        taxVat,
                net_earned:     netEarned,
                ride_count:     rideAgg?.ride_count || 0
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch earnings' });
    }
});

/* ── GET /api/earnings/chart ───────────────────
   Daily / Weekly / Monthly earnings breakdown   */
router.get('/chart', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        const period = ['daily', 'weekly', 'monthly'].includes(String(req.query.period)) ? String(req.query.period) : 'weekly';

        let sql;
        if (period === 'daily') {
            sql = `SELECT
                     TO_CHAR(completed_at AT TIME ZONE 'Asia/Dhaka', 'Mon DD') AS label,
                     COALESCE(SUM(fare_final), 0)::float                        AS amount,
                     COUNT(*)::int                                               AS rides
                   FROM rides
                   WHERE driver_id = $1
                     AND status = 'completed'
                     AND fare_final IS NOT NULL
                     AND completed_at >= NOW() - INTERVAL '7 days'
                   GROUP BY TO_CHAR(completed_at AT TIME ZONE 'Asia/Dhaka', 'Mon DD'),
                            DATE_TRUNC('day', completed_at AT TIME ZONE 'Asia/Dhaka')
                   ORDER BY DATE_TRUNC('day', completed_at AT TIME ZONE 'Asia/Dhaka')`;
        } else if (period === 'monthly') {
            sql = `SELECT
                     TO_CHAR(completed_at AT TIME ZONE 'Asia/Dhaka', 'Mon YYYY') AS label,
                     COALESCE(SUM(fare_final), 0)::float                          AS amount,
                     COUNT(*)::int                                                 AS rides
                   FROM rides
                   WHERE driver_id = $1
                     AND status = 'completed'
                     AND fare_final IS NOT NULL
                     AND completed_at >= NOW() - INTERVAL '6 months'
                   GROUP BY TO_CHAR(completed_at AT TIME ZONE 'Asia/Dhaka', 'Mon YYYY'),
                            DATE_TRUNC('month', completed_at)
                   ORDER BY DATE_TRUNC('month', completed_at)`;
        } else {
            sql = `SELECT
                     'W' || TO_CHAR(completed_at, 'IW') AS label,
                     COALESCE(SUM(fare_final), 0)::float  AS amount,
                     COUNT(*)::int                         AS rides
                   FROM rides
                   WHERE driver_id = $1
                     AND status = 'completed'
                     AND fare_final IS NOT NULL
                     AND completed_at >= NOW() - INTERVAL '4 weeks'
                   GROUP BY TO_CHAR(completed_at, 'IW'), DATE_TRUNC('week', completed_at)
                   ORDER BY DATE_TRUNC('week', completed_at)`;
        }

        const rows = await query(sql, [req.user.id]);
        res.json({ success: true, period, data: rows.rows || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

/* ── GET /api/earnings/transactions ─────────
   Paginated transaction list                */
router.get('/transactions', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        const limit  = Math.min(Number(req.query.limit)  || 30, 100);
        const offset = Math.max(Number(req.query.offset) || 0,  0);

        const result = await query(
            `SELECT * FROM driver_transactions
             WHERE driver_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );
        const total = await queryOne(
            `SELECT COUNT(*)::int AS count FROM driver_transactions WHERE driver_id = $1`,
            [req.user.id]
        );
        res.json({ success: true, transactions: result.rows, total: total?.count || 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

/* ── GET /api/earnings/recipients ───────────
   List payment recipients for this driver   */
router.get('/recipients', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        const rows = await query(
            `SELECT id, gateway, number, label, verified, created_at
             FROM driver_payment_recipients
             WHERE driver_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, recipients: rows.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recipients' });
    }
});

/* ── POST /api/earnings/recipients ──────────
   Add a bkash/nagad number — sends OTP first */
router.post('/recipients', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        const gateway = String(req.body?.gateway || '').trim().toLowerCase();
        const number  = String(req.body?.number  || '').trim();
        const label   = req.body?.label == null ? null : String(req.body.label).trim() || null;

        if (!['bkash', 'nagad'].includes(gateway))
            return res.status(400).json({ error: 'gateway must be bkash or nagad' });
        if (!/^01[3-9]\d{8}$/.test(number))
            return res.status(400).json({ error: 'Invalid Bangladesh mobile number' });

        const otp        = String(Math.floor(1000 + Math.random() * 9000));
        const otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        // Upsert: reset OTP if already exists unverified; reject if verified
        const existing = await queryOne(
            `SELECT id, verified FROM driver_payment_recipients
             WHERE driver_id = $1 AND gateway = $2 AND number = $3`,
            [req.user.id, gateway, number]
        );
        if (existing?.verified)
            return res.status(409).json({ error: 'This number is already a verified recipient' });

        if (existing) {
            await query(
                `UPDATE driver_payment_recipients
                 SET otp = $1, otp_expires = $2, label = COALESCE($3, label), verified = FALSE
                 WHERE id = $4`,
                [otp, otp_expires, label, existing.id]
            );
        } else {
            await query(
                `INSERT INTO driver_payment_recipients (driver_id, gateway, number, label, otp, otp_expires)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [req.user.id, gateway, number, label, otp, otp_expires]
            );
        }

        // In production send OTP via SMS; here we log it and always expose in dev
        console.log(`[DEV] Recipient OTP for ${number} (${gateway}): ${otp}`);

        res.json({ success: true, message: `OTP sent to ${number}`, dev_otp: otp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add recipient' });
    }
});

/* ── POST /api/earnings/recipients/verify ───
   Verify OTP to confirm recipient           */
router.post('/recipients/verify', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        const gateway = String(req.body?.gateway || '').trim().toLowerCase();
        const number  = String(req.body?.number  || '').trim();
        const otp     = String(req.body?.otp     || '').trim();

        const row = await queryOne(
            `SELECT id, otp, otp_expires, verified
             FROM driver_payment_recipients
             WHERE driver_id = $1 AND gateway = $2 AND number = $3`,
            [req.user.id, gateway, number]
        );

        if (!row)         return res.status(404).json({ error: 'Recipient not found' });
        if (row.verified) return res.status(400).json({ error: 'Already verified' });
        const isBypass = otp === '1234';
        if (!isBypass && new Date(row.otp_expires) < new Date())
                          return res.status(400).json({ error: 'OTP expired' });
        if (!isBypass && row.otp !== otp)
                          return res.status(400).json({ error: 'Invalid OTP' });

        await query(
            `UPDATE driver_payment_recipients SET verified = TRUE, otp = NULL, otp_expires = NULL WHERE id = $1`,
            [row.id]
        );
        res.json({ success: true, message: 'Recipient verified' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to verify recipient' });
    }
});

/* ── DELETE /api/earnings/recipients/:id ────
   Remove a recipient                        */
router.delete('/recipients/:id', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        const result = await query(
            `DELETE FROM driver_payment_recipients WHERE id = $1 AND driver_id = $2 RETURNING id`,
            [req.params.id, req.user.id]
        );
        if (!result.rows.length)
            return res.status(404).json({ error: 'Recipient not found' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete recipient' });
    }
});

/* ── POST /api/earnings/withdraw/send-otp ───
   Generate OTP before a withdrawal           */
router.post('/withdraw/send-otp', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        // Fetch driver phone to send OTP
        const driver = await queryOne('SELECT phone FROM drivers WHERE id = $1', [req.user.id]);
        if (!driver) return res.status(404).json({ error: 'Driver not found' });

        const otp = String(Math.floor(1000 + Math.random() * 9000));
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        // Upsert into otps table (re-use existing auth OTP infra)
        await query(
            `DELETE FROM otps WHERE phone = $1 AND user_type = 'withdraw'`,
            [driver.phone]
        );
        await query(
            `INSERT INTO otps (phone, otp, user_type, expires_at) VALUES ($1, $2, 'withdraw', $3)`,
            [driver.phone, otp, expires]
        );

        console.log(`[DEV] Withdrawal OTP for ${driver.phone}: ${otp}`);
        res.json({ success: true, message: 'OTP sent', dev_otp: otp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

/* ── POST /api/earnings/withdraw ────────────
   Initiate withdrawal to a verified recipient */
router.post('/withdraw', async (req, res) => {
    if (!requireDriver(req, res)) return;
    try {
        const recipientId = String(req.body?.recipient_id || '').trim();
        const amount      = Number(req.body?.amount);
        const otp         = String(req.body?.otp || '').trim();

        if (!recipientId || isNaN(amount) || amount < 10)
            return res.status(400).json({ error: 'recipient_id and amount (min ৳10) are required' });
        if (!otp)
            return res.status(400).json({ error: 'OTP is required' });

        // Validate OTP (bypass 1234 for dev)
        const isBypass = otp === '1234';
        if (!isBypass) {
            const driver = await queryOne('SELECT phone FROM drivers WHERE id = $1', [req.user.id]);
            const otpRow = await queryOne(
                `SELECT otp, expires_at, used FROM otps WHERE phone = $1 AND user_type = 'withdraw' ORDER BY created_at DESC LIMIT 1`,
                [driver?.phone]
            );
            if (!otpRow)                             return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
            if (otpRow.used)                         return res.status(400).json({ error: 'OTP already used' });
            if (new Date(otpRow.expires_at) < new Date()) return res.status(400).json({ error: 'OTP expired' });
            if (otpRow.otp !== otp)                  return res.status(400).json({ error: 'Invalid OTP' });
            // Mark OTP used
            await query(`UPDATE otps SET used = TRUE WHERE phone = $1 AND user_type = 'withdraw'`, [driver?.phone]);
        }

        const recipient = await queryOne(
            `SELECT id, gateway, number, verified FROM driver_payment_recipients
             WHERE id = $1 AND driver_id = $2`,
            [recipientId, req.user.id]
        );
        if (!recipient)          return res.status(404).json({ error: 'Recipient not found' });
        if (!recipient.verified) return res.status(400).json({ error: 'Recipient is not verified' });

        const wallet = await ensureWallet(req.user.id);
        const balance = Number(wallet?.balance || 0);
        if (balance < amount)
            return res.status(400).json({ error: `Insufficient balance (৳${balance.toFixed(2)})` });

        // Deduct and record
        await query(
            `UPDATE driver_wallet
             SET balance = balance - $1, total_withdrawn = total_withdrawn + $1, updated_at = NOW()
             WHERE driver_id = $2`,
            [amount, req.user.id]
        );

        const txn = await queryOne(
            `INSERT INTO driver_transactions
               (driver_id, type, amount, direction, gateway, recipient_number, note, status)
             VALUES ($1, 'withdrawal', $2, 'debit', $3, $4, $5, 'completed')
             RETURNING *`,
            [req.user.id, amount, recipient.gateway, recipient.number,
             `Withdrawal to ${recipient.gateway} ${recipient.number}`]
        );

        console.log(`[DEV] Mock withdrawal ৳${amount} via ${recipient.gateway} to ${recipient.number}`);

        res.json({ success: true, transaction: txn, message: `৳${amount} withdrawal initiated` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process withdrawal' });
    }
});

module.exports = router;

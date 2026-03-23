const express = require('express');
const router = express.Router();
const { query } = require('../db');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/* ── POST /api/payments/bkash/initiate ────────
   Mock bKash payment gateway                   */
router.post('/bkash/initiate', async (req, res) => {
    try {
        const { ride_id, amount } = req.body;

        // Create pending payment record
        const result = await query(
            `INSERT INTO payments (reference_id, reference_type, gateway, amount, status)
       VALUES ($1, 'ride', 'bkash', $2, 'pending')
       RETURNING *`,
            [ride_id, amount]
        );

        const payment = result.rows[0];

        // MOCK: Generate a fake URL that redirects back to our app
        // In production, you would call bKash tokenized API here:
        // 1. Get Token from process.env.BKASH_BASE_URL/tokenized/checkout/token/grant
        // 2. Create Payment from process.env.BKASH_BASE_URL/tokenized/checkout/create

        const redirectUrl = `${process.env.APP_URL}/api/payments/mock-callback?trx_id=${uuidv4()}&payment_id=${payment.id}&gateway=bkash&status=success`;

        res.json({ success: true, redirect_url: redirectUrl, payment_id: payment.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to initiate bKash payment' });
    }
});

/* ── POST /api/payments/nagad/initiate ────────
   Mock Nagad payment gateway                   */
router.post('/nagad/initiate', async (req, res) => {
    try {
        const { ride_id, amount } = req.body;

        const result = await query(
            `INSERT INTO payments (reference_id, reference_type, gateway, amount, status)
       VALUES ($1, 'ride', 'nagad', $2, 'pending')
       RETURNING *`,
            [ride_id, amount]
        );

        const payment = result.rows[0];

        // MOCK URL for Nagad gateway
        const redirectUrl = `${process.env.APP_URL}/api/payments/mock-callback?trx_id=${uuidv4()}&payment_id=${payment.id}&gateway=nagad&status=success`;

        res.json({ success: true, redirect_url: redirectUrl, payment_id: payment.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to initiate Nagad payment' });
    }
});

/* ── GET /api/payments/mock-callback ──────────
   Mock webhook to receive gateway success      */
router.get('/mock-callback', async (req, res) => {
    try {
        // Note: The mock callback is a GET and intentionally has no authMiddleware
        // since it's simulating a browser redirect from the gateway. 
        // Usually webhooks are POST and you verify signature hashes.
        const { payment_id, trx_id, status } = req.query;

        if (status === 'success') {
            const result = await query(
                `UPDATE payments SET status = 'paid', gateway_trx_id = $1, completed_at = NOW()
         WHERE id = $2 RETURNING *`,
                [trx_id, payment_id]
            );

            const payment = result.rows[0];
            if (payment.reference_type === 'ride') {
                await query('UPDATE rides SET payment_status = $1 WHERE id = $2', ['paid', payment.reference_id]);
            }

            // Redirect back to frontend success page
            res.redirect(`${process.env.FRONTEND_URL}/?payment=success&trx=${trx_id}`);
        } else {
            await query(`UPDATE payments SET status = 'failed' WHERE id = $1`, [payment_id]);
            res.redirect(`${process.env.FRONTEND_URL}/?payment=failed`);
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Payment callback failed');
    }
});

module.exports = router;

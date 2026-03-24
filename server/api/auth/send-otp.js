// Vercel API route for /api/auth/send-otp with CORS headers

import { Pool } from 'pg';
// Use a global pool to avoid exhausting connections in serverless
let pool;
if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}
pool = global._pgPool;

export default async function handler(req, res) {
  // Robust CORS: always set headers, handle OPTIONS early
  const allowedOrigin = 'https://oijaba-front.vercel.app';
  const origin = req.headers.origin;
  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Uncomment if you need cookies/auth headers
  // res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request before any body parsing
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Handle preflight OPTIONS request before any body parsing
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }


  // Parse JSON body if not already parsed
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
    res.status(400).json({ error: 'Phone number required' });
    return;
  }
  if (!['rider', 'driver', 'admin'].includes(user_type)) {
    console.error('Invalid user_type:', user_type);
    res.status(400).json({ error: 'Invalid user type' });
    return;
  }
  if (user_type === 'admin' && mode !== 'login') {
    console.error('Admin registration attempted:', body);
    res.status(400).json({ error: 'Admin registration is disabled' });
    return;
  }

  try {
    if (mode === 'register') {
      const table = user_type === 'driver' ? 'drivers' : 'riders';
      const exists = await pool.query(`SELECT id FROM ${table} WHERE phone = $1`, [phone]);
      if (exists.rows.length > 0) {
        res.status(409).json({ error: 'This mobile number is already registered. Please log in instead.' });
        return;
      }
    }
    if (user_type === 'admin') {
      const admin = await pool.query('SELECT id FROM admins WHERE phone = $1 AND status = $2', [phone, 'active']);
      if (admin.rows.length === 0) {
        res.status(403).json({ error: 'admin_only', message: 'Admin account not found or inactive.' });
        return;
      }
    }
    if (mode === 'login' && user_type === 'rider') {
      const isDriver = await pool.query('SELECT id FROM drivers WHERE phone = $1', [phone]);
      if (isDriver.rows.length > 0) {
        const isAlsoRider = await pool.query('SELECT id FROM riders WHERE phone = $1', [phone]);
        if (isAlsoRider.rows.length === 0) {
          res.status(403).json({ error: 'driver_portal', message: 'This number is registered as a driver. Please use the Driver Portal to log in.' });
          return;
        }
      }
    }
    // Generate OTP (for demo, always 1234)
    const otp = '1234';
    // In production, send OTP via SMS here
    res.status(200).json({ success: true, otp });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

const { Pool } = require('pg');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: require('path').join(__dirname, '.env') });
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // In production add SSL:
    // ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
    if (process.env.NODE_ENV !== 'test') {
        console.log('✅ PostgreSQL connected');
    }
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL error:', err.message);
});

// Keep existing DBs compatible for admin OTP authentication.
(async function ensureAdminsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                phone VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(120) UNIQUE,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_admins_phone
            ON admins(phone)
        `);

        await pool.query(`
            INSERT INTO admins (id, phone, name, email, status)
            VALUES
              ('c0000003-0000-0000-0000-000000000001', '01900000000', 'Platform Admin', 'admin@oijaba.local', 'active')
            ON CONFLICT (phone) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              status = EXCLUDED.status,
              updated_at = NOW()
        `);
    } catch (err) {
        console.error('⚠️ Admin table migration skipped:', err.message);
    }
})();

// Lightweight runtime migration for vehicle fare rules.
// Keeps existing local DBs compatible without manual ALTER steps.
(async function ensureVehicleColumns() {
    try {
        await pool.query(`
            ALTER TABLE vehicles
            ADD COLUMN IF NOT EXISTS base_fare NUMERIC(8,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS per_km_rate NUMERIC(8,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS min_fare NUMERIC(8,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS fare_rule_en VARCHAR(250),
            ADD COLUMN IF NOT EXISTS fare_rule_bn VARCHAR(250),
            ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 100
        `);

        // Seed/refresh core vehicle options with fare rules.
        await pool.query(`
            INSERT INTO vehicles (id, name, name_bn, img, emoji, enabled, fare, base_fare, per_km_rate, min_fare, fare_rule_en, fare_rule_bn, capacity, sort_order)
            VALUES
              ('auto',    'Auto Rickshaw',       'অটো-রিকশা',           '/assets/vehicles/easybike.jpg',  NULL, TRUE, 40, 35, 12, 40,  'Base ৳35 + ৳12/km (min ৳40)',       'বেস ৳৩৫ + ৳১২/কিমি (ন্যূনতম ৳৪০)', 3, 1),
              ('bike',    'Motorbike',           'মোটরবাইক',            '/assets/vehicles/motorbike.jpg', NULL, TRUE, 20, 20, 10, 25,  'Base ৳20 + ৳10/km (min ৳25)',       'বেস ৳২০ + ৳১০/কিমি (ন্যূনতম ৳২৫)', 1, 2),
              ('rickshaw','Battery Rickshaw',    'ব্যাটারি রিকশা',       '/assets/vehicles/rickshaw.jpg',  NULL, TRUE, 25, 22, 8,  25,  'Base ৳22 + ৳8/km (min ৳25)',        'বেস ৳২২ + ৳৮/কিমি (ন্যূনতম ৳২৫)',  2, 3),
              ('van',     'Van Rickshaw',        'ভ্যান রিকশা',         '/assets/vehicles/van.jpg',       NULL, TRUE, 15, 18, 7,  20,  'Base ৳18 + ৳7/km (min ৳20)',        'বেস ৳১৮ + ৳৭/কিমি (ন্যূনতম ৳২০)',  5, 4),
              ('boat',    'Boat / Nouka',        'নৌকা',                NULL,                              '⛵', TRUE, 30, 30, 14, 35,  'Base ৳30 + ৳14/km (min ৳35)',       'বেস ৳৩০ + ৳১৪/কিমি (ন্যূনতম ৳৩৫)', 8, 5),
              ('tractor', 'Tractor Transport',   'ট্রাক্টর পরিবহন',      NULL,                              '🚜', TRUE, 80, 70, 20, 80,  'Base ৳70 + ৳20/km (min ৳80)',       'বেস ৳৭০ + ৳২০/কিমি (ন্যূনতম ৳৮০)', 1, 6),
              ('shared',  'Shared Auto Rickshaw','শেয়ার্ড অটো-রিকশা',   '/assets/vehicles/easybike.jpg',  NULL, TRUE, 15, 12, 6,  15,  'Per seat: base ৳12 + ৳6/km',        'প্রতি সিট: বেস ৳১২ + ৳৬/কিমি',      3, 7),
              ('car',     'Private Car',         'প্রাইভেট কার',         NULL,                              '🚗', TRUE, 120,95, 25, 120, 'Base ৳95 + ৳25/km (min ৳120)',      'বেস ৳৯৫ + ৳২৫/কিমি (ন্যূনতম ৳১২০)',4, 8)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              name_bn = EXCLUDED.name_bn,
              img = EXCLUDED.img,
              emoji = EXCLUDED.emoji,
              enabled = EXCLUDED.enabled,
              fare = EXCLUDED.fare,
              base_fare = EXCLUDED.base_fare,
              per_km_rate = EXCLUDED.per_km_rate,
              min_fare = EXCLUDED.min_fare,
              fare_rule_en = EXCLUDED.fare_rule_en,
              fare_rule_bn = EXCLUDED.fare_rule_bn,
              capacity = EXCLUDED.capacity,
              sort_order = EXCLUDED.sort_order,
              updated_at = NOW()
        `);
    } catch (err) {
        console.error('⚠️ Vehicle column migration skipped:', err.message);
    }
})();

// Keep existing DBs compatible for rider rating aggregates.
(async function ensureRiderRatingColumns() {
    try {
        await pool.query(`
            ALTER TABLE riders
            ADD COLUMN IF NOT EXISTS rating_sum INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0
        `);
    } catch (err) {
        console.error('⚠️ Rider rating migration skipped:', err.message);
    }
})();

// Add nid_number and other admin-editable profile fields to riders table.
(async function ensureRiderProfileFields() {
    try {
        await pool.query(`
            ALTER TABLE riders
            ADD COLUMN IF NOT EXISTS nid_number VARCHAR(30),
            ADD COLUMN IF NOT EXISTS name_bn VARCHAR(200),
            ADD COLUMN IF NOT EXISTS district VARCHAR(100),
            ADD COLUMN IF NOT EXISTS upazilla VARCHAR(100),
            ADD COLUMN IF NOT EXISTS house_no VARCHAR(100),
            ADD COLUMN IF NOT EXISTS road_no VARCHAR(100),
            ADD COLUMN IF NOT EXISTS landmark VARCHAR(200),
            ADD COLUMN IF NOT EXISTS post_office VARCHAR(100)
        `);
    } catch (err) {
        console.error('⚠️ Rider profile fields migration skipped:', err.message);
    }
})();

// Keep existing DBs compatible for richer driver profiles and vehicle management.
(async function ensureDriverProfileAndVehicles() {
    try {
        await pool.query(`
            ALTER TABLE riders
            ADD COLUMN IF NOT EXISTS profile_image TEXT
        `);

        await pool.query(`
            ALTER TABLE riders
            ALTER COLUMN avatar TYPE TEXT
        `);

        await pool.query(`
            ALTER TABLE drivers
            ADD COLUMN IF NOT EXISTS driver_license VARCHAR(50),
            ADD COLUMN IF NOT EXISTS driver_license_image TEXT,
            ADD COLUMN IF NOT EXISTS nid_number VARCHAR(30),
            ADD COLUMN IF NOT EXISTS profile_image TEXT
        `);

        await pool.query(`
            ALTER TABLE drivers
            ALTER COLUMN avatar TYPE TEXT
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver_vehicles (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
                vehicle_type VARCHAR(50) NOT NULL,
                vehicle_model VARCHAR(100),
                vehicle_plate VARCHAR(30) NOT NULL,
                vehicle_front_image TEXT,
                vehicle_rear_image TEXT,
                vehicle_left_image TEXT,
                vehicle_right_image TEXT,
                color VARCHAR(50),
                year VARCHAR(20),
                capacity VARCHAR(20),
                registration_number VARCHAR(50),
                engine_number VARCHAR(80),
                notes TEXT,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver
            ON driver_vehicles(driver_id)
        `);

        await pool.query(`
            ALTER TABLE driver_vehicles
            ADD COLUMN IF NOT EXISTS vehicle_front_image TEXT,
            ADD COLUMN IF NOT EXISTS vehicle_rear_image TEXT,
            ADD COLUMN IF NOT EXISTS vehicle_left_image TEXT,
            ADD COLUMN IF NOT EXISTS vehicle_right_image TEXT
        `);

        await pool.query(`
            UPDATE riders
            SET profile_image = avatar
            WHERE profile_image IS NULL
              AND avatar IS NOT NULL
              AND avatar <> ''
              AND avatar <> '🧑'
        `);

        await pool.query(`
            UPDATE drivers
            SET profile_image = avatar
            WHERE profile_image IS NULL
              AND avatar IS NOT NULL
              AND avatar <> ''
              AND avatar <> '🧑'
        `);

        await pool.query(`
            INSERT INTO driver_vehicles (
                driver_id,
                vehicle_type,
                vehicle_model,
                vehicle_plate,
                is_primary
            )
            SELECT d.id, d.vehicle_type, d.vehicle_model, d.vehicle_plate, TRUE
            FROM drivers d
            WHERE COALESCE(TRIM(d.vehicle_plate), '') <> ''
              AND NOT EXISTS (
                SELECT 1
                FROM driver_vehicles dv
                WHERE dv.driver_id = d.id
                  AND LOWER(COALESCE(dv.vehicle_plate, '')) = LOWER(COALESCE(d.vehicle_plate, ''))
              )
        `);
    } catch (err) {
        console.error('⚠️ Driver profile/vehicle migration skipped:', err.message);
    }
})();

// Keep existing DBs compatible for driver rating dispute workflow.
(async function ensureDriverRatingDisputes() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver_rating_disputes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
                ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
                ride_ref VARCHAR(30) NOT NULL,
                current_rating SMALLINT,
                reason TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'open',
                admin_note TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_driver_rating_disputes_driver
            ON driver_rating_disputes(driver_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_driver_rating_disputes_status
            ON driver_rating_disputes(status)
        `);
    } catch (err) {
        console.error('⚠️ Driver rating dispute migration skipped:', err.message);
    }
})();

// Earnings / wallet tables migration
(async function ensureEarningsTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver_wallet (
                id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                driver_id       UUID NOT NULL UNIQUE REFERENCES drivers(id) ON DELETE CASCADE,
                balance         NUMERIC(12,2) DEFAULT 0,
                total_earned    NUMERIC(12,2) DEFAULT 0,
                total_withdrawn NUMERIC(12,2) DEFAULT 0,
                updated_at      TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver_transactions (
                id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                driver_id        UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
                type             VARCHAR(40) NOT NULL,
                amount           NUMERIC(12,2) NOT NULL,
                direction        VARCHAR(6) NOT NULL CHECK (direction IN ('credit','debit')),
                reference_id     UUID,
                reference_type   VARCHAR(30),
                gateway          VARCHAR(20),
                recipient_number VARCHAR(20),
                note             TEXT,
                status           VARCHAR(20) DEFAULT 'completed',
                created_at       TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_driver_transactions_driver
            ON driver_transactions(driver_id)
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver_payment_recipients (
                id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                driver_id   UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
                gateway     VARCHAR(20) NOT NULL,
                number      VARCHAR(20) NOT NULL,
                label       VARCHAR(80),
                verified    BOOLEAN DEFAULT FALSE,
                otp         VARCHAR(10),
                otp_expires TIMESTAMPTZ,
                created_at  TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE (driver_id, gateway, number)
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_driver_payment_recipients_driver
            ON driver_payment_recipients(driver_id)
        `);
    } catch (err) {
        console.error('⚠️ Earnings migration skipped:', err.message);
    }
})();

// Helper: query with error bubbling
async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL) {
        console.log('SQL:', { text, duration, rows: res.rowCount });
    }
    return res;
}

// Helper: get single row
async function queryOne(text, params) {
    const res = await query(text, params);
    return res.rows[0] || null;
}

module.exports = { pool, query, queryOne };

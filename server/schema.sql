-- =============================================
-- OIJABA Database Schema
-- Run: psql -U postgres -d oijaba -f schema.sql
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PostGIS is optional - comment out if not installed
-- CREATE EXTENSION IF NOT EXISTS "postgis";  -- For GPS coords (optional, falls back to lat/lon columns)

-- ─── RIDERS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS riders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(20) UNIQUE NOT NULL,
  name        VARCHAR(100),
  name_bn     VARCHAR(100),
  area        VARCHAR(200),
  district    VARCHAR(100),
  upazilla    VARCHAR(100),
  house_no    VARCHAR(50),
  road_no     VARCHAR(50),
  landmark    VARCHAR(100),
  post_office VARCHAR(100),
  avatar      TEXT DEFAULT '🧑',
  profile_image TEXT,
  membership  VARCHAR(20) DEFAULT 'New',  -- New / Regular / Frequent
  rating_sum  INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  status      VARCHAR(20) DEFAULT 'active',  -- active / suspended
  suspend_reason TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DRIVERS ────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone           VARCHAR(20) UNIQUE NOT NULL,
  name            VARCHAR(100),
  name_bn         VARCHAR(100),
  area            VARCHAR(200),
  district        VARCHAR(100),
  upazilla        VARCHAR(100),
  house_no        VARCHAR(50),
  road_no         VARCHAR(50),
  landmark        VARCHAR(100),
  post_office     VARCHAR(100),
  vehicle_type    VARCHAR(50),  -- cng / motorbike / van / boat / tractor / battery / car
  vehicle_model   VARCHAR(100),
  vehicle_plate   VARCHAR(30),
  driver_license  VARCHAR(50),
  driver_license_image TEXT,
  nid_number      VARCHAR(30),
  nid_verified    BOOLEAN DEFAULT FALSE,
  avatar          TEXT DEFAULT '🧑',
  profile_image   TEXT,
  status          VARCHAR(20) DEFAULT 'pending',  -- pending / active / rejected / suspended
  is_online       BOOLEAN DEFAULT FALSE,
  current_lat     DOUBLE PRECISION,
  current_lng     DOUBLE PRECISION,
  current_area    VARCHAR(200),
  rating_sum      INTEGER DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  total_rides     INTEGER DEFAULT 0,
  total_earned    NUMERIC(12,2) DEFAULT 0,
  today_earned    NUMERIC(12,2) DEFAULT 0,
  today_rides     INTEGER DEFAULT 0,
  suspend_reason  TEXT,
  badges          TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ADMINS ────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(20) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(120) UNIQUE,
  status      VARCHAR(20) DEFAULT 'active',  -- active / suspended
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── OTPs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(20) NOT NULL,
  otp         VARCHAR(10) NOT NULL,
  user_type   VARCHAR(10) DEFAULT 'rider',  -- rider / driver / admin
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RIDES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS rides (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_ref        VARCHAR(20) UNIQUE NOT NULL,  -- OIJ-XXXXX
  rider_id        UUID REFERENCES riders(id),
  driver_id       UUID REFERENCES drivers(id),
  vehicle_type    VARCHAR(50),
  pickup_name     VARCHAR(200) NOT NULL,
  pickup_lat      DOUBLE PRECISION,
  pickup_lng      DOUBLE PRECISION,
  destination_name VARCHAR(200) NOT NULL,
  destination_lat  DOUBLE PRECISION,
  destination_lng  DOUBLE PRECISION,
  ride_type       VARCHAR(20) DEFAULT 'instant',  -- instant / scheduled / shared
  status          VARCHAR(30) DEFAULT 'searching',
    -- searching / accepted / pickup / started / completed / cancelled
  fare_estimate   NUMERIC(8,2),
  fare_final      NUMERIC(8,2),
  payment_method  VARCHAR(20) DEFAULT 'cash',  -- cash / bkash / nagad / rocket
  payment_status  VARCHAR(20) DEFAULT 'pending',  -- pending / paid / failed
  rider_rating    SMALLINT,
  driver_rating   SMALLINT,
  scheduled_at    TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PARCELS ────────────────────────────────
CREATE TABLE IF NOT EXISTS parcels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_ref      VARCHAR(20) UNIQUE NOT NULL,  -- OIJ-P-XXXXX
  sender_name     VARCHAR(100),
  sender_phone    VARCHAR(20),
  receiver_name   VARCHAR(100),
  receiver_phone  VARCHAR(20),
  pickup_location VARCHAR(200),
  delivery_location VARCHAR(200),
  item_type       VARCHAR(50),   -- medicine / groceries / documents / farm / package
  item_size       VARCHAR(20) DEFAULT 'small',  -- small / medium / large
  weight_kg       NUMERIC(5,2),
  driver_id       UUID REFERENCES drivers(id),
  status          VARCHAR(20) DEFAULT 'pending',
    -- pending / assigned / transit / delivered / failed
  delivery_fee    NUMERIC(8,2),
  payment_method  VARCHAR(20) DEFAULT 'cash',
  payment_status  VARCHAR(20) DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENTS ───────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id    UUID,           -- ride_id or parcel_id
  reference_type  VARCHAR(20),    -- ride / parcel
  gateway         VARCHAR(20),    -- cash / bkash / nagad / sslcommerz
  amount          NUMERIC(10,2),
  currency        VARCHAR(5) DEFAULT 'BDT',
  gateway_trx_id  VARCHAR(100),   -- transaction ID from gateway
  gateway_payload JSONB,          -- full gateway response stored
  status          VARCHAR(20) DEFAULT 'pending',  -- pending / paid / failed / refunded
  initiated_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ─── COMPLAINTS ─────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_ref   VARCHAR(15) UNIQUE NOT NULL,  -- C-XXX
  reporter_type   VARCHAR(10),   -- rider / driver
  reporter_id     UUID,
  against_type    VARCHAR(10),   -- rider / driver
  against_id      UUID,
  complaint_type  VARCHAR(30),   -- Safety / Overcharge / No Show / Dispute / Other
  detail          TEXT,
  priority        VARCHAR(10) DEFAULT 'medium',  -- low / medium / high
  status          VARCHAR(20) DEFAULT 'open',    -- open / investigating / resolved / closed
  resolution_note TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- ─── SERVICE AREAS ──────────────────────────
CREATE TABLE IF NOT EXISTS service_areas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200) NOT NULL,
  name_bn     VARCHAR(200),
  district    VARCHAR(100),
  division    VARCHAR(100),
  status      VARCHAR(20) DEFAULT 'active',  -- active / pending / inactive
  driver_count INTEGER DEFAULT 0,
  ride_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VEHICLES ──────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id              VARCHAR(50) PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  name_bn         VARCHAR(100) NOT NULL,
  img             VARCHAR(200),
  emoji           VARCHAR(10),
  enabled         BOOLEAN DEFAULT TRUE,
  fare            NUMERIC(8,2) DEFAULT 0,
  base_fare       NUMERIC(8,2) DEFAULT 0,
  per_km_rate     NUMERIC(8,2) DEFAULT 0,
  min_fare        NUMERIC(8,2) DEFAULT 0,
  fare_rule_en    VARCHAR(250),
  fare_rule_bn    VARCHAR(250),
  capacity        INTEGER DEFAULT 1,
  sort_order      INTEGER DEFAULT 100,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DRIVER VEHICLES ──────────────────────
CREATE TABLE IF NOT EXISTS driver_vehicles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id           UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_type        VARCHAR(50) NOT NULL,
  vehicle_model       VARCHAR(100),
  vehicle_plate       VARCHAR(30) NOT NULL,
  vehicle_front_image TEXT,
  vehicle_rear_image  TEXT,
  vehicle_left_image  TEXT,
  vehicle_right_image TEXT,
  color               VARCHAR(50),
  year                VARCHAR(20),
  capacity            VARCHAR(20),
  registration_number VARCHAR(50),
  engine_number       VARCHAR(80),
  notes               TEXT,
  is_primary          BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rides_rider    ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver   ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status   ON rides(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_admins_phone   ON admins(phone);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver ON driver_vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_otps_phone     ON otps(phone);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);

-- ─── ADDRESS MIGRATION (safe for existing DBs) ──────────
ALTER TABLE riders ADD COLUMN IF NOT EXISTS district    VARCHAR(100);
ALTER TABLE riders ADD COLUMN IF NOT EXISTS upazilla    VARCHAR(100);
ALTER TABLE riders ADD COLUMN IF NOT EXISTS house_no    VARCHAR(50);
ALTER TABLE riders ADD COLUMN IF NOT EXISTS road_no     VARCHAR(50);
ALTER TABLE riders ADD COLUMN IF NOT EXISTS landmark    VARCHAR(100);
ALTER TABLE riders ADD COLUMN IF NOT EXISTS post_office VARCHAR(100);
ALTER TABLE riders ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS nid_number VARCHAR(30);
ALTER TABLE riders ALTER COLUMN avatar TYPE TEXT;

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS district    VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS upazilla    VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS house_no    VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS road_no     VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS landmark    VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS post_office VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_license VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_license_image TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE drivers ALTER COLUMN avatar TYPE TEXT;

ALTER TABLE driver_vehicles ADD COLUMN IF NOT EXISTS vehicle_front_image TEXT;
ALTER TABLE driver_vehicles ADD COLUMN IF NOT EXISTS vehicle_rear_image TEXT;
ALTER TABLE driver_vehicles ADD COLUMN IF NOT EXISTS vehicle_left_image TEXT;
ALTER TABLE driver_vehicles ADD COLUMN IF NOT EXISTS vehicle_right_image TEXT;

-- ─── DRIVER WALLET ──────────────────────────
CREATE TABLE IF NOT EXISTS driver_wallet (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id    UUID UNIQUE NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  balance      NUMERIC(12,2) DEFAULT 0,
  total_earned NUMERIC(12,2) DEFAULT 0,
  total_withdrawn NUMERIC(12,2) DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DRIVER TRANSACTIONS ────────────────────
CREATE TABLE IF NOT EXISTS driver_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL,
    -- ride_earning / withdrawal / platform_fee / tax / adjustment / refund
  amount          NUMERIC(12,2) NOT NULL,
  direction       VARCHAR(10) NOT NULL DEFAULT 'credit',  -- credit / debit
  reference_id    UUID,
  reference_type  VARCHAR(30),   -- ride / parcel / withdrawal
  gateway         VARCHAR(20),   -- bkash / nagad / cash / internal
  recipient_number VARCHAR(20),
  note            TEXT,
  status          VARCHAR(20) DEFAULT 'completed',  -- completed / pending / failed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DRIVER PAYMENT RECIPIENTS ──────────────
CREATE TABLE IF NOT EXISTS driver_payment_recipients (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id    UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  gateway      VARCHAR(20) NOT NULL,  -- bkash / nagad
  number       VARCHAR(20) NOT NULL,
  label        VARCHAR(60),
  verified     BOOLEAN DEFAULT FALSE,
  otp          VARCHAR(10),
  otp_expires  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, gateway, number)
);

CREATE INDEX IF NOT EXISTS idx_driver_txn_driver   ON driver_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_txn_created  ON driver_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_driver_recipients_d ON driver_payment_recipients(driver_id);

-- ─── RATING CATEGORY MIGRATION ──────────────
-- Add detailed rating parameters for drivers and riders
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_driving     SMALLINT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_behavior    SMALLINT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_cleanliness SMALLINT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_comment     TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_rider_behavior   SMALLINT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_rider_wait_time  SMALLINT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_rider_comment    TEXT;

'use strict';
const { query } = require('./db');

async function run() {
  await query(`
    ALTER TABLE rides
      ADD COLUMN IF NOT EXISTS rating_driving     SMALLINT,
      ADD COLUMN IF NOT EXISTS rating_behavior    SMALLINT,
      ADD COLUMN IF NOT EXISTS rating_cleanliness SMALLINT,
      ADD COLUMN IF NOT EXISTS rating_comment     TEXT
  `);
  console.log('Migration: rating category columns added (or already exist).');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });

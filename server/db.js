const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Run a SQL query and return the full result object.
 * Usage: const result = await query('SELECT * FROM users WHERE id = $1', [1]);
 *        result.rows => [{...}, ...]
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a SQL query and return only the first row (or null).
 * Usage: const user = await queryOne('SELECT * FROM users WHERE id = $1', [1]);
 */
async function queryOne(text, params) {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

module.exports = { pool, query, queryOne };

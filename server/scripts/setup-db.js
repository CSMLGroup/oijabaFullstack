#!/usr/bin/env node

/**
 * Database Setup Script
 * Initializes PostgreSQL database with schema and seed data
 * 
 * Usage: npm run setup-db
 * 
 * This script:
 * 1. Connects to PostgreSQL
 * 2. Creates all required tables (schema.sql)
 * 3. Inserts sample data (seed.sql)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    console.error('Please create a .env file with DATABASE_URL set');
    process.exit(1);
}

console.log('🔧 Starting database setup...');
console.log(`📝 Database: ${DATABASE_URL.split('@')[1]?.split('/')[1] || 'unknown'}`);

const pool = new Pool({ connectionString: DATABASE_URL });

async function executeFile(filePath, description) {
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`\n📋 ${description}...`);
        
        // Split by semicolon and filter empty statements
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
            await pool.query(statement);
        }
        
        console.log(`✅ ${description} completed`);
        return true;
    } catch (err) {
        console.error(`❌ ${description} failed:`, err.message);
        return false;
    }
}

async function setupDatabase() {
    try {
        // Test connection
        console.log('\n🔗 Testing database connection...');
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');
        
        // Execute schema
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`schema.sql not found at ${schemaPath}`);
        }
        const schemaSuccess = await executeFile(schemaPath, 'Creating database schema');
        
        if (!schemaSuccess) {
            throw new Error('Schema creation failed');
        }
        
        // Execute seed data
        const seedPath = path.join(__dirname, '..', 'seed.sql');
        if (!fs.existsSync(seedPath)) {
            console.warn('⚠️  seed.sql not found - skipping seed data');
        } else {
            const seedSuccess = await executeFile(seedPath, 'Inserting seed data');
            if (!seedSuccess) {
                console.warn('⚠️  Seed data insertion had errors (may be expected if data already exists)');
            }
        }
        
        // Verify data
        console.log('\n📊 Verifying setup...');
        const tables = [
            { name: 'admins', label: 'Admins' },
            { name: 'drivers', label: 'Drivers' },
            { name: 'riders', label: 'Riders' },
            { name: 'rides', label: 'Rides' },
            { name: 'service_areas', label: 'Service Areas' }
        ];
        
        for (const table of tables) {
            const res = await pool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
            const count = res.rows[0]?.count || 0;
            console.log(`  • ${table.label}: ${count} rows`);
        }
        
        console.log('\n✅ Database setup completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Start the server: npm start');
        console.log('  2. Visit: http://localhost:3001');
        console.log('  3. Admin login: 01900000000 (OTP: 1234 in dev)');
        console.log('  4. Check admin dashboard for drivers, riders, rides');
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Database setup failed:', err.message);
        console.error('\nTroubleshooting:');
        console.error('  1. Check DATABASE_URL in .env file');
        console.error('  2. Ensure PostgreSQL is running');
        console.error('  3. Verify schema.sql and seed.sql files exist');
        console.error('  4. Check database user permissions');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run setup
setupDatabase();

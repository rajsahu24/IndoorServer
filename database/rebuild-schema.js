const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function rebuildSchema() {
  try {
    console.log('Starting schema rebuild...');
    
    // Drop all tables in correct order (respecting foreign key constraints)
    const dropQueries = [
      'DROP TABLE IF EXISTS guest_events CASCADE;',
      'DROP TABLE IF EXISTS notifications CASCADE;',
      'DROP TABLE IF EXISTS guest_devices CASCADE;',
      'DROP TABLE IF EXISTS events CASCADE;',
      'DROP TABLE IF EXISTS room_allocations CASCADE;',
      'DROP TABLE IF EXISTS guests CASCADE;',
      'DROP TABLE IF EXISTS bookings CASCADE;',
      'DROP TABLE IF EXISTS venues CASCADE;',
      'DROP TABLE IF EXISTS rooms CASCADE;',
      'DROP TABLE IF EXISTS floors CASCADE;',
      'DROP TABLE IF EXISTS hotels CASCADE;',
      'DROP TABLE IF EXISTS buildings CASCADE;',
      'DROP TABLE IF EXISTS routes CASCADE;',
      'DROP TABLE IF EXISTS pois CASCADE;',
      'DROP TABLE IF EXISTS units CASCADE;',
      'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;'
    ];

    for (const query of dropQueries) {
      await pool.query(query);
    }
    
    console.log('Existing tables dropped successfully');
    
    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    
    console.log('Database schema rebuilt successfully');
  } catch (error) {
    console.error('Error rebuilding schema:', error);
  } finally {
    await pool.end();
  }
}

async function createSchemaOnly() {
  try {
    console.log('Creating schema (without dropping existing tables)...');
    
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split schema into individual statements and execute with IF NOT EXISTS where possible
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await pool.query(trimmed + ';');
        } catch (error) {
          // Skip errors for already existing objects
          if (error.code !== '42P07' && error.code !== '42723') {
            console.error('Error executing statement:', error.message);
          }
        }
      }
    }
    
    console.log('Schema creation completed');
  } catch (error) {
    console.error('Error creating schema:', error);
  } finally {
    await pool.end();
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'rebuild') {
  rebuildSchema();
} else if (command === 'create') {
  createSchemaOnly();
} else {
  console.log('Usage:');
  console.log('  node rebuild-schema.js rebuild  - Drop all tables and recreate schema');
  console.log('  node rebuild-schema.js create   - Create schema without dropping existing tables');
  process.exit(1);
}
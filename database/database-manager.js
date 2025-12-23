const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration for different environments
const configs = {
  local: {
    user: 'postgres',
    host: 'localhost',
    database: 'indoorloop',
    password: process.env.LOCAL_DB_PASSWORD || 'your_password',
    port: 5432,
  },
  supabase: {
    connectionString: "postgresql://postgres.ahpovyxfdjeymsukyjpa:Raju824%40@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  }
};

async function setupDatabase(environment = 'local') {
  const config = configs[environment];
  const pool = new Pool(config);

  try {
    console.log(`Setting up database for ${environment} environment...`);
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Enable extensions
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('Extensions enabled');

    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await pool.query(trimmed + ';');
        } catch (error) {
          // Skip errors for already existing objects
          if (error.code !== '42P07' && error.code !== '42723' && error.code !== '42710') {
            console.error('Error executing statement:', error.message);
          }
        }
      }
    }
    
    console.log('Database schema created successfully');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Created tables:', result.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

// Export data from current database
async function exportData(environment = 'supabase') {
  const config = configs[environment];
  const pool = new Pool(config);

  try {
    console.log(`Exporting data from ${environment}...`);
    
    const tables = ['buildings', 'hotels', 'floors', 'rooms', 'venues', 'pois', 'units', 'routes'];
    const exportData = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        exportData[table] = result.rows;
        console.log(`Exported ${result.rows.length} rows from ${table}`);
      } catch (error) {
        console.log(`Table ${table} does not exist or is empty`);
        exportData[table] = [];
      }
    }
    
    // Save to file
    fs.writeFileSync(
      path.join(__dirname, 'exported_data.json'), 
      JSON.stringify(exportData, null, 2)
    );
    
    console.log('Data exported to exported_data.json');
    
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await pool.end();
  }
}

// Import data to database
async function importData(environment = 'local') {
  const config = configs[environment];
  const pool = new Pool(config);

  try {
    console.log(`Importing data to ${environment}...`);
    
    const dataFile = path.join(__dirname, 'exported_data.json');
    if (!fs.existsSync(dataFile)) {
      console.log('No exported_data.json file found');
      return;
    }
    
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    for (const [table, rows] of Object.entries(data)) {
      if (rows.length > 0) {
        console.log(`Importing ${rows.length} rows to ${table}...`);
        
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          const query = `
            INSERT INTO ${table} (${columns.join(', ')}) 
            VALUES (${placeholders})
            ON CONFLICT (id) DO NOTHING
          `;
          
          try {
            await pool.query(query, values);
          } catch (error) {
            console.error(`Error inserting into ${table}:`, error.message);
          }
        }
      }
    }
    
    console.log('Data import completed');
    
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await pool.end();
  }
}

// Command line interface
const command = process.argv[2];
const environment = process.argv[3] || 'local';

switch (command) {
  case 'setup':
    setupDatabase(environment);
    break;
  case 'export':
    exportData(environment);
    break;
  case 'import':
    importData(environment);
    break;
  default:
    console.log('Usage:');
    console.log('  node database-manager.js setup [local|supabase]   - Setup database schema');
    console.log('  node database-manager.js export [local|supabase]  - Export data from database');
    console.log('  node database-manager.js import [local|supabase]  - Import data to database');
    console.log('');
    console.log('Examples:');
    console.log('  node database-manager.js export supabase  - Export from Supabase');
    console.log('  node database-manager.js setup local      - Setup local database');
    console.log('  node database-manager.js import local     - Import to local database');
    break;
}
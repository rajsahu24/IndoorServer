const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const useSsl = (process.env.PGSSLMODE === 'require') || (process.env.DATABASE_SSL === 'true');
const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: {
    rejectUnauthorized: false // This is required for Render's self-signed certificates
  },
  connectionTimeoutMillis: 10000,
      }
    : {
        user: process.env.PGUSER || 'postgres',
        host: process.env.PGHOST || 'localhost',
        database: process.env.PGDATABASE || 'postgres',
        password: process.env.PGPASSWORD,
        port: parseInt(process.env.PGPORT || '5432', 10),
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      }
);

module.exports = pool;

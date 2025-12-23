console.log('🚀 db-test.js started');

const { Pool } = require('pg');
require('dotenv').config();

console.log('📦 pg loaded');

console.log('🔎 DATABASE_URL present:', typeof process.env.DATABASE_URL, process.env.DATABASE_URL ? 'yes' : 'no');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('🔌 Pool created');

(async () => {
  console.log('⏳ Running query...');
  try {
    const res = await pool.query('SELECT 1');
    console.log('✅ Database connected:', res.rows);
    await pool.end();
    console.log('🔚 Pool closed');
  } catch (err) {
    console.error('❌ Database error:', err);
  }
})();

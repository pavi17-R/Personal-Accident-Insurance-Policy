// -----------------------------------------------------------------------
// MySQL connection pool configuration
// -----------------------------------------------------------------------
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pa_insurance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Quick sanity check on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] Connected to MySQL database:', process.env.DB_NAME || 'pa_insurance');
    conn.release();
  } catch (err) {
    console.error('[DB] Failed to connect to MySQL. Did you run database/schema.sql and set backend/.env correctly?');
    console.error(err.message);
  }
})();

module.exports = pool;

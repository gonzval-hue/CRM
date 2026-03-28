const mariadb = require('mariadb');
const logger = require('../utils/logger');
require('dotenv').config();

// Database connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crm_ingemedia',
  connectionLimit: 10,
  acquireTimeout: 10000,
  idleTimeout: 60000,
});

// Test database connection
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    logger.info('Database connection established successfully');
    const version = await conn.query('SELECT VERSION() as version');
    logger.info(`MariaDB version: ${version[0].version}`);
  } catch (err) {
    logger.error('Database connection failed:', err.message);
  } finally {
    if (conn) conn.end();
  }
}

// Get connection from pool
async function getConnection() {
  return await pool.getConnection();
}

// Query helper
async function query(sql, params) {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query(sql, params);
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  pool,
  getConnection,
  query,
  testConnection,
};

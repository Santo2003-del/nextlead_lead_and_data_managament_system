/**
 * ── MongoDB Connection Manager ──────────────────────────────────
 * 
 * Handles database connectivity for the NexLead platform.
 * Features:
 *   - Connection pooling (maxPoolSize) for concurrent request handling
 *   - Automatic reconnection with exponential backoff
 *   - Event-based monitoring for disconnect/reconnect/error
 *   - Health check function for /api/health endpoint
 *   - Graceful error handling — never calls process.exit()
 *     (PM2 manages restart policy)
 * 
 * Data is stored in the local VPS MongoDB instance.
 */

const mongoose = require('mongoose');
const logger = require('./logger');

// ── Reconnection state ───────────────────────────────────────
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 20;
const BASE_RECONNECT_DELAY_MS = 1000;

/**
 * Connects to MongoDB with production-safe options.
 * Uses connection pooling and timeouts to prevent DB-related crashes.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_CONNECTION_URL, {
      // ── Connection Pool ─────────────────────────────────────
      // Allows up to 20 concurrent operations per connection
      maxPoolSize: 20,
      minPoolSize: 5,

      // ── Timeouts ────────────────────────────────────────────
      // How long to wait for initial server selection
      serverSelectionTimeoutMS: 10000,
      // How long to wait for a socket connection
      connectTimeoutMS: 15000,
      // How long a socket can be idle before closing
      socketTimeoutMS: 45000,
      // Frequency of heartbeat checks to detect server issues
      heartbeatFrequencyMS: 10000,
    });

    reconnectAttempts = 0; // Reset on successful connection
    logger.info(`✅ MongoDB Connected: ${conn.connection.host} (Pool: 20)`);
  } catch (err) {
    logger.error(`❌ MongoDB Connection Error: ${err.message}`);
    // Do NOT call process.exit() — let PM2 handle restart policy.
    // Attempt automatic reconnection instead.
    scheduleReconnect();
  }
};

/**
 * Schedules a reconnection attempt with exponential backoff.
 * Prevents flooding the DB server with rapid reconnect attempts.
 */
const scheduleReconnect = () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error(`❌ MongoDB: Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1), 30000);
  logger.info(`🔄 MongoDB: Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);

  setTimeout(async () => {
    try {
      await mongoose.connect(process.env.DB_CONNECTION_URL);
      reconnectAttempts = 0;
      logger.info('✅ MongoDB: Reconnected successfully');
    } catch (err) {
      logger.error(`❌ MongoDB: Reconnection failed — ${err.message}`);
      scheduleReconnect();
    }
  }, delay);
};

// ── Mongoose Connection Event Monitoring ──────────────────────
// These events fire automatically when the connection state changes.

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB: Connection lost');
  if (reconnectAttempts === 0) {
    scheduleReconnect();
  }
});

mongoose.connection.on('reconnected', () => {
  reconnectAttempts = 0;
  logger.info('✅ MongoDB: Reconnected after disconnect');
});

mongoose.connection.on('error', (err) => {
  logger.error(`❌ MongoDB: Connection error — ${err.message}`);
});

/**
 * Returns the current MongoDB connection health status.
 * Used by the /api/health endpoint for monitoring.
 * 
 * States: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
 */
const getDBHealth = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    status: stateMap[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'N/A',
    name: mongoose.connection.name || 'N/A',
  };
};

/**
 * Gracefully closes the MongoDB connection.
 * Called during SIGTERM/SIGINT shutdown sequence.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB: Connection closed gracefully');
  } catch (err) {
    logger.error(`❌ MongoDB: Error closing connection — ${err.message}`);
  }
};

module.exports = { connectDB, getDBHealth, disconnectDB };

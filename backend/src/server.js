require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const mongoSanitize = require('express-mongo-sanitize');

const routes = require('./api/routes');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/error');
const { ensureIndex } = require('./config/elasticsearch');
const logger = require('./config/logger');

// ── Background Workers (In-Memory) ───────────────────────────
require('./workers/exportWorker');
require('./workers/scrapeWorker');

const app = express();
app.set('trust proxy', 1); // Trust first proxy to fix rate limit X-Forwarded-For error

// ── Create required dirs ──────────────────────────────────────
['./uploads', './exports', './logs'].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── Security middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: false // Handled manually or disabled for APIs
}));

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes('*')) return callback(null, true);
    
    // Check strict match or local network variations
    const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin === allowed + '/');
    if (isAllowed || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: process.env.MAX_UPLOAD_SIZE_MB ? `${process.env.MAX_UPLOAD_SIZE_MB}mb` : '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize()); // Prevent NoSQL injection

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '300'),
  standardHeaders: true, legacyHeaders: false,
}));

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
}));

// ── Routes ────────────────────────────────────────────────────
app.use('/api', routes);

// ── Serve exported files ──────────────────────────────────────
app.use('/exports', express.static(path.resolve('./exports')));

// ── Serve Frontend in Production ──────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.resolve(__dirname, '../../frontend/build');
  if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendBuild, 'index.html'));
    });
    logger.info('📦 Serving frontend from build/ directory');
  }
}

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const basePort = parseInt(process.env.PORT || '5055');

const startServer = (port) => {
  const server = app.listen(port, async () => {
    logger.info(`🚀 NexLead API running on port ${port} [${process.env.NODE_ENV}]`);
    if (port !== basePort) {
      logger.info(`⚠️ Port switched due to conflict. Original: ${basePort}, New: ${port}`);
    }
    try {
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-this-to-a-long-random-secret-in-production') {
        logger.warn('⚠️ WARNING: Using default or empty JWT_SECRET. This is a severe security risk.');
      }
      await connectDB();
      await ensureIndex();
      logger.info('✅ System successfully initialized (MongoDB Ready)');
    } catch (err) {
      logger.error('❌ Critical Startup error:', err.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} is busy, switching to ${port + 1}`);
      startServer(port + 1);
    } else {
      logger.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer(basePort);
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;

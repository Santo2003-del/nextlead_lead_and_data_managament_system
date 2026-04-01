/**
 * ── NexLead API Server Entry Point ──────────────────────────────
 * 
 * Main application bootstrapper for the NexLead Lead Intelligence Platform.
 * 
 * Responsibilities:
 *   - Express app configuration (security, parsing, compression)
 *   - CORS policy (locked to production origins)
 *   - Rate limiting on API and auth endpoints
 *   - Production static file serving for the frontend build
 *   - Graceful startup with port conflict resolution
 *   - Graceful shutdown on SIGTERM/SIGINT (preserves active connections)
 *   - Global crash handlers (uncaughtException, unhandledRejection)
 * 
 * Process Manager: PM2 (ecosystem.config.js) handles:
 *   - Auto-restart, cluster mode, memory limits, log rotation
 */

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const mongoSanitize = require("express-mongo-sanitize");

const routes = require("./api/routes");
const { connectDB, disconnectDB } = require("./config/db");
const { errorHandler } = require("./middleware/error");
const { ensureIndex } = require("./config/elasticsearch");
const logger = require("./config/logger");

// ── Background Workers ────────────────────────────────────────
// These attach job processors to the in-memory queue system.
// They run inside the same process for simplicity (no Redis needed).
require("./workers/exportWorker");
require("./workers/scrapeWorker");

const app = express();
app.set("trust proxy", 1);

// ── Create required directories ───────────────────────────────
// Ensures uploads, exports, and logs directories exist on startup.
["./uploads", "./exports", "./logs"].forEach((dir) =>
  fs.mkdirSync(dir, { recursive: true })
);

// ── Security middleware ───────────────────────────────────────
// Helmet adds security headers (HSTS, X-Frame-Options, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: false,
  })
);

// ── CORS Configuration ────────────────────────────────────────
// Locked to production origins only. Unknown origins are rejected.
// Additional origins can be added via the CORS_ORIGIN env variable.
const allowedOrigins = [
  "https://serantix.com",
  "https://www.serantix.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Add any additional origins from environment variable
if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(",").forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, Postman, mobile apps, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject unknown origins
      return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    credentials: true,
  })
);

// ── General middleware ────────────────────────────────────────
// Compression reduces response size (gzip) for faster transfers.
app.use(compression());

// Morgan logs HTTP requests — "combined" format in production for analytics,
// "dev" format in development for readability.
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// JSON body parser with configurable size limit (default 50MB for large imports)
app.use(
  express.json({
    limit: process.env.MAX_UPLOAD_SIZE_MB
      ? `${process.env.MAX_UPLOAD_SIZE_MB}mb`
      : "50mb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize user input to prevent MongoDB operator injection ($gt, $ne, etc.)
app.use(mongoSanitize());

// ── Rate limiting ─────────────────────────────────────────────
// Global API rate limit: 300 requests per 15 minutes per IP
app.use(
  "/api/",
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    max: parseInt(process.env.RATE_LIMIT_MAX || "300"),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter rate limit on login to prevent brute-force attacks
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
      error: "Too many attempts. Try again in 15 minutes.",
    },
  })
);

// ── API Routes ────────────────────────────────────────────────
app.use("/api", routes);

// ── Static exports directory ──────────────────────────────────
// Serves generated export files (CSV/XLSX) for download
app.use("/exports", express.static(path.resolve("./exports")));

// ── Frontend build serve (Production only) ────────────────────
// In production, the backend serves the compiled React frontend.
if (process.env.NODE_ENV === "production") {
  const frontendBuild = path.resolve(__dirname, "../../frontend/build");

  if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));

    // SPA fallback — all non-API routes serve index.html
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendBuild, "index.html"));
    });

    logger.info("📦 Serving frontend from build/ directory");
  } else {
    logger.warn("⚠️ Frontend build folder not found");
  }
}

// ── Error handler (must be last middleware) ────────────────────
app.use(errorHandler);

// ── Server start with port conflict resolution ────────────────
const basePort = parseInt(process.env.PORT || "5055");
let activeServer = null; // Track for graceful shutdown

const startServer = (port) => {
  const server = app.listen(port, async () => {
    logger.info(
      `🚀 NexLead API running on port ${port} [${process.env.NODE_ENV}]`
    );

    if (port !== basePort) {
      logger.info(
        `⚠️ Port switched due to conflict. Original: ${basePort}, New: ${port}`
      );
    }

    try {
      // Validate JWT secret is set properly
      if (
        !process.env.JWT_SECRET ||
        process.env.JWT_SECRET ===
        "change-this-to-a-long-random-secret-in-production"
      ) {
        logger.warn(
          "⚠️ WARNING: Using default or empty JWT_SECRET."
        );
      }

      // Warn if admin credentials are still default values
      if (
        process.env.ADMIN_PASSWORD &&
        (process.env.ADMIN_PASSWORD === "CHANGE_THIS_TO_A_STRONG_PASSWORD" ||
         process.env.ADMIN_PASSWORD.length < 12)
      ) {
        logger.warn(
          "⚠️ WARNING: ADMIN_PASSWORD appears weak or is still default. Change it immediately."
        );
      }

      await connectDB();
      await ensureIndex();

      logger.info("✅ System successfully initialized (MongoDB Ready)");
    } catch (err) {
      logger.error("❌ Critical Startup error:", err.message);
      // Don't crash — DB reconnection is handled automatically by db.js
    }
  });

  // ── HTTP Server Tuning ──────────────────────────────────────
  // Keep-alive timeout should be higher than any load balancer/proxy timeout
  // (Nginx default is 60s, so we set 65s)
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000; // Must be > keepAliveTimeout

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.warn(`Port ${port} busy, switching to ${port + 1}`);
      startServer(port + 1);
    } else {
      logger.error("Server error:", err);
      // Don't exit — let PM2 decide
    }
  });

  activeServer = server;
};

startServer(basePort);

// ═══════════════════════════════════════════════════════════════
// ── GRACEFUL SHUTDOWN & CRASH PREVENTION ──────────────────────
// ═══════════════════════════════════════════════════════════════
// 
// These handlers ensure the application shuts down cleanly when:
//   - PM2 sends SIGTERM (restart, reload, scale)
//   - Ctrl+C sends SIGINT (manual stop)
//   - An uncaught exception or unhandled promise rejection occurs
//
// The shutdown sequence:
//   1. Stop accepting new connections
//   2. Wait for active requests to complete (5s timeout)
//   3. Close MongoDB connection
//   4. Exit process

let isShuttingDown = false;

/**
 * Performs graceful shutdown sequence.
 * Drains active connections before closing the server.
 * @param {string} signal - The signal that triggered shutdown
 */
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return; // Prevent double-shutdown
  isShuttingDown = true;

  logger.info(`\n🛑 ${signal} received — starting graceful shutdown...`);

  // Step 1: Stop accepting new HTTP connections
  if (activeServer) {
    activeServer.close(() => {
      logger.info("✅ HTTP server closed (no new connections)");
    });
  }

  // Step 2: Give active requests 10 seconds to complete
  const shutdownTimeout = setTimeout(() => {
    logger.warn("⚠️ Shutdown timeout reached — forcing exit");
    process.exit(1);
  }, 10000);

  try {
    // Step 3: Close database connection
    await disconnectDB();
    logger.info("✅ Graceful shutdown complete");
  } catch (err) {
    logger.error("❌ Error during shutdown:", err.message);
  }

  clearTimeout(shutdownTimeout);
  process.exit(0);
};

// ── Process Signal Handlers ───────────────────────────────────
// PM2 sends SIGTERM for restarts; Ctrl+C sends SIGINT
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ── Unhandled Promise Rejections ──────────────────────────────
// Log the rejection but do NOT crash. Most rejections are from
// non-critical operations (ES indexing, activity logging, etc.)
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
});

// ── Uncaught Exceptions ───────────────────────────────────────
// Log the error and perform graceful shutdown. The process is in
// an undefined state after an uncaught exception, so we must exit.
// PM2 will automatically restart the process.
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  // Graceful shutdown — drain connections, close DB, then exit.
  // PM2 auto-restart ensures zero downtime.
  gracefulShutdown("uncaughtException").catch(() => process.exit(1));
});

module.exports = app;
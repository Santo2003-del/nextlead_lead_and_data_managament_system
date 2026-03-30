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
const { connectDB } = require("./config/db");
const { errorHandler } = require("./middleware/error");
const { ensureIndex } = require("./config/elasticsearch");
const logger = require("./config/logger");

// ── Background Workers ────────────────────────────────────────
require("./workers/exportWorker");
require("./workers/scrapeWorker");

const app = express();
app.set("trust proxy", 1);

// ── Create required directories ───────────────────────────────
["./uploads", "./exports", "./logs"].forEach((dir) =>
  fs.mkdirSync(dir, { recursive: true })
);

// ── Security middleware ───────────────────────────────────────
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

// ── CORS FIXED (single clean middleware) ──────────────────────
const allowedOrigins = [
  "http://157.173.219.253:5055",
  "http://157.173.219.253",
  "http://serantix.com",
  "https://serantix.com",
  "http://www.serantix.com",
  "https://www.serantix.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow curl / postman / mobile apps
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }

      // temporary allow all while testing
      return callback(null, true);
    },
    credentials: true,
  })
);

// ── General middleware ────────────────────────────────────────
app.use(compression());
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

app.use(
  express.json({
    limit: process.env.MAX_UPLOAD_SIZE_MB
      ? `${process.env.MAX_UPLOAD_SIZE_MB}mb`
      : "50mb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());

// ── Rate limiting ─────────────────────────────────────────────
app.use(
  "/api/",
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    max: parseInt(process.env.RATE_LIMIT_MAX || "300"),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

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

// ── Static exports ────────────────────────────────────────────
app.use("/exports", express.static(path.resolve("./exports")));

// ── Frontend build serve ──────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const frontendBuild = path.resolve(__dirname, "../../frontend/build");

  if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));

    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendBuild, "index.html"));
    });

    logger.info("📦 Serving frontend from build/ directory");
  } else {
    logger.warn("⚠️ Frontend build folder not found");
  }
}

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Server start ──────────────────────────────────────────────
const basePort = parseInt(process.env.PORT || "5055");

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
      if (
        !process.env.JWT_SECRET ||
        process.env.JWT_SECRET ===
        "change-this-to-a-long-random-secret-in-production"
      ) {
        logger.warn(
          "⚠️ WARNING: Using default or empty JWT_SECRET."
        );
      }

      await connectDB();
      await ensureIndex();

      logger.info("✅ System successfully initialized (MongoDB Ready)");
    } catch (err) {
      logger.error("❌ Critical Startup error:", err.message);
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.warn(`Port ${port} busy, switching to ${port + 1}`);
      startServer(port + 1);
    } else {
      logger.error("Server error:", err);
      process.exit(1);
    }
  });
};

startServer(basePort);

// ── Global process handlers ───────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

module.exports = app;
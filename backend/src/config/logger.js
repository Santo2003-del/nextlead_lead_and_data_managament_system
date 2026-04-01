/**
 * ── Winston Logger Configuration ────────────────────────────────
 * 
 * Centralized logging for the NexLead platform.
 * Features:
 *   - Console output with colorized levels in development
 *   - Structured JSON output in production
 *   - Daily rotating file transport (auto-cleanup after 14 days)
 *   - Separate error log file for quick issue triage
 *   - Max 20MB per log file to prevent disk exhaustion
 *   - Timestamps and stack traces on all error logs
 */

const winston = require('winston');
const path = require('path');

// ── Log format: timestamp + level + message + metadata ────────
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}${stackStr}`;
  })
);

// ── Build transports array ────────────────────────────────────
const transports = [
  // Always log to console
  new winston.transports.Console({
    format: winston.format.combine(
      process.env.NODE_ENV !== 'production'
        ? winston.format.colorize({ all: true })
        : winston.format.uncolorize(),
      logFormat
    ),
  }),
];

// ── Production file transports with rotation ──────────────────
if (process.env.NODE_ENV === 'production') {
  try {
    // Attempt to use daily-rotate-file if available
    const DailyRotateFile = require('winston-daily-rotate-file');

    transports.push(
      // Combined log — all levels, rotated daily
      new DailyRotateFile({
        filename: path.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',        // Max 20MB per file
        maxFiles: '14d',       // Keep logs for 14 days
        zippedArchive: true,   // Compress old logs
        format: winston.format.combine(
          winston.format.uncolorize(),
          winston.format.json()
        ),
      }),
      // Error-only log — for quick issue triage
      new DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',       // Keep error logs longer (30 days)
        zippedArchive: true,
        format: winston.format.combine(
          winston.format.uncolorize(),
          winston.format.json()
        ),
      })
    );
  } catch {
    // Fallback to basic file transports if daily-rotate-file is not installed
    transports.push(
      new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        maxsize: 20 * 1024 * 1024,  // 20MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join('logs', 'combined.log'),
        maxsize: 20 * 1024 * 1024,
        maxFiles: 5,
      })
    );
  }
}

// ── Create logger instance ────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  // Do not exit on uncaught errors within the logger itself
  exitOnError: false,
});

module.exports = logger;

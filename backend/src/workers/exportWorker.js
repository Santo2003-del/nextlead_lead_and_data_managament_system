/**
 * ── Export Worker ────────────────────────────────────────────────
 * 
 * Background job processor for CSV/XLSX export generation.
 * 
 * Listens to the 'export' queue and processes jobs by:
 *   1. Reading lead/scraped data from MongoDB
 *   2. Generating a CSV or XLSX file in the exports/ directory
 *   3. Updating the Export record with file path and status
 * 
 * Crash Protection:
 *   - uncaughtException triggers graceful exit (PM2 auto-restarts)
 *   - unhandledRejection is logged but does NOT crash the worker
 *   - SIGTERM/SIGINT close the queue before exit
 *   - Individual job failures are caught and logged per-job
 * 
 * Concurrency: 2 jobs processed simultaneously
 */

require('dotenv').config();
const { queues } = require('../config/redis');
const connectDB = require('../config/db').connectDB;
const Export = require('../models/Export');
const { exportCSV, exportExcel } = require('../services/exportService');
const logger = require('../config/logger');

// ── Connect to MongoDB ────────────────────────────────────────
// db.js handles reconnection automatically — no process.exit on failure
connectDB();

logger.info('[ExportWorker] Starting...');

// ── Job Processor ─────────────────────────────────────────────
// Processes up to 2 export jobs concurrently.
// Each job generates a file and updates the Export document.
queues.export.process(2, async (job) => {
  const { exportId, filters, format, collection = 'leads' } = job.data;

  try {
    // Mark job as processing
    await Export.findByIdAndUpdate(exportId, { $set: { status: 'processing' } });

    // Generate the export file (CSV or XLSX)
    const result = format === 'xlsx'
      ? await exportExcel(filters, exportId, collection)
      : await exportCSV(filters, exportId, collection);

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Update export record with file details
    await Export.findByIdAndUpdate(exportId, {
      $set: {
        status: 'ready',
        file_path: result.path,
        file_size: result.size,
        row_count: result.count,
        expires_at: expiresAt
      }
    });

    logger.info(`[Export] ${exportId} ready: ${result.count} rows`);
    return result;
  } catch (err) {
    logger.error(`[Export] Processing error ${exportId}:`, err.message);
    // Mark export as failed so the UI can show an error
    await Export.findByIdAndUpdate(exportId, { $set: { status: 'failed' } }).catch(() => { });
    throw err;
  }
});

// ── Queue Event Handlers ──────────────────────────────────────
queues.export.on('failed', (job, err) => {
  logger.error('[Export] Job failed:', err.message);
});

// ── Graceful Shutdown ─────────────────────────────────────────
// PM2 sends SIGTERM on restart/reload. Ctrl+C sends SIGINT.
// Close the queue to prevent picking up new jobs before exiting.
const shutdownWorker = async (signal) => {
  logger.info(`[ExportWorker] ${signal} received — shutting down...`);
  await queues.export.close().catch(() => { });
  process.exit(0);
};

process.on('SIGTERM', () => shutdownWorker('SIGTERM'));
process.on('SIGINT', () => shutdownWorker('SIGINT'));

// ── Crash Safety ──────────────────────────────────────────────
// Log rejections but don't crash — most are non-critical
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[ExportWorker] Unhandled Rejection:', reason);
});

// Uncaught exceptions leave the process in an undefined state.
// Log and exit gracefully — PM2 auto-restarts the worker.
process.on('uncaughtException', (error) => {
  logger.error('[ExportWorker] Uncaught Exception:', error);
  shutdownWorker('uncaughtException').catch(() => process.exit(1));
});

require('dotenv').config();
const { queues } = require('../config/redis');
const connectDB = require('../config/db').connectDB;
const Export = require('../models/Export');
const { exportCSV, exportExcel } = require('../services/exportService');
const logger = require('../config/logger');

// Connect to MongoDB
connectDB();

logger.info('[ExportWorker] Starting...');

queues.export.process(2, async (job) => {
  const { exportId, filters, format, collection = 'leads' } = job.data;

  try {
    await Export.findByIdAndUpdate(exportId, { $set: { status: 'processing' } });

    const result = format === 'xlsx'
      ? await exportExcel(filters, exportId, collection)
      : await exportCSV(filters, exportId, collection);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

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
    await Export.findByIdAndUpdate(exportId, { $set: { status: 'failed' } }).catch(() => { });
    throw err;
  }
});

queues.export.on('failed', (job, err) => {
  logger.error('[Export] Job failed:', err.message);
});

process.on('SIGTERM', async () => {
  await queues.export.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

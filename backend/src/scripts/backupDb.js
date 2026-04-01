/**
 * ── MongoDB Backup Script ───────────────────────────────────────
 * 
 * Automated database backup using mongodump.
 * Creates date-stamped backup directories and cleans up old backups.
 * 
 * Features:
 *   - Full database dump to ./backups/{date}/ directory
 *   - Automatic cleanup of backups older than 7 days
 *   - Works with local and remote MongoDB instances
 *   - Can be triggered manually or via cron/PM2 cron
 * 
 * Usage:
 *   node src/scripts/backupDb.js
 * 
 * PM2 Cron (daily at 2 AM):
 *   Add to ecosystem.config.js:
 *   {
 *     name: 'nexlead-backup',
 *     script: 'src/scripts/backupDb.js',
 *     cron_restart: '0 2 * * *',
 *     autorestart: false
 *   }
 * 
 * System Cron (alternative):
 *   0 2 * * * cd /path/to/backend && node src/scripts/backupDb.js >> logs/backup.log 2>&1
 * 
 * Prerequisites:
 *   - mongodump must be installed and available in PATH
 *   - Install: https://www.mongodb.com/docs/database-tools/mongodump/
 * 
 * ═══════════════════════════════════════════════════════════════
 * RESTORE GUIDE
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. FULL DATABASE RESTORE (replace entire database):
 *    mongorestore --uri="mongodb://127.0.0.1:27017" \
 *      --db NexleadDb \
 *      --gzip \
 *      --drop \
 *      ./backups/2026-04-01/NexleadDb/
 * 
 *    --drop: Drops each collection before importing (clean restore)
 *    --gzip: Required because backups are gzip-compressed
 * 
 * 2. SINGLE COLLECTION RESTORE (e.g., restore only leads):
 *    mongorestore --uri="mongodb://127.0.0.1:27017" \
 *      --db NexleadDb \
 *      --collection leads \
 *      --gzip \
 *      --drop \
 *      ./backups/2026-04-01/NexleadDb/leads.bson.gz
 * 
 * 3. RESTORE TO STAGING (test before overwriting production):
 *    mongorestore --uri="mongodb://127.0.0.1:27017" \
 *      --db NexleadDb_staging \
 *      --gzip \
 *      ./backups/2026-04-01/NexleadDb/
 * 
 *    Then verify data in staging before renaming databases.
 * 
 * 4. VERIFY BACKUP INTEGRITY:
 *    mongorestore --uri="mongodb://127.0.0.1:27017" \
 *      --db NexleadDb_verify \
 *      --gzip \
 *      --dryRun \
 *      ./backups/2026-04-01/NexleadDb/
 * 
 * ⚠️ IMPORTANT: Always test restores on a staging database first!
 *    Never restore directly to production without verification.
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || './backups');
const MONGO_URI = process.env.DB_CONNECTION_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/NexleadDb';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7');

const log = (msg) => process.stdout.write(`[Backup] ${new Date().toISOString()} - ${msg}\n`);

async function runBackup() {
  try {
    // ── Create date-stamped backup directory ─────────────────
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const backupPath = path.join(BACKUP_DIR, dateStr);
    fs.mkdirSync(backupPath, { recursive: true });

    log(`Starting backup to ${backupPath}...`);

    // ── Run mongodump ───────────────────────────────────────
    // --uri: MongoDB connection string
    // --out: Output directory for the dump
    // --gzip: Compress the dump files
    const cmd = `mongodump --uri="${MONGO_URI}" --out="${backupPath}" --gzip`;

    try {
      execSync(cmd, { stdio: 'pipe', timeout: 300000 }); // 5 min timeout
      log(`✅ Backup completed successfully: ${backupPath}`);
    } catch (dumpErr) {
      // mongodump might not be installed
      if (dumpErr.message.includes('not recognized') || dumpErr.message.includes('not found')) {
        log('❌ mongodump is not installed. Install MongoDB Database Tools:');
        log('   https://www.mongodb.com/docs/database-tools/installation/');
        log('');
        log('   For Ubuntu/Debian: sudo apt install mongodb-database-tools');
        log('   For Windows: Download from the MongoDB Tools page above');
        process.exit(1);
      }
      throw dumpErr;
    }

    // ── Calculate backup size ────────────────────────────────
    const getSize = (dirPath) => {
      let total = 0;
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            total += getSize(fullPath);
          } else {
            total += fs.statSync(fullPath).size;
          }
        }
      } catch {}
      return total;
    };
    const sizeMB = (getSize(backupPath) / 1024 / 1024).toFixed(2);
    log(`   Backup size: ${sizeMB} MB`);

    // ── Cleanup old backups ─────────────────────────────────
    log(`Cleaning up backups older than ${RETENTION_DAYS} days...`);
    const now = Date.now();
    const cutoff = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });
    let cleaned = 0;
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(BACKUP_DIR, entry.name);
      try {
        const stat = fs.statSync(fullPath);
        if (now - stat.mtimeMs > cutoff) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          log(`   Removed old backup: ${entry.name}`);
          cleaned++;
        }
      } catch {}
    }
    log(`   Cleaned ${cleaned} old backup(s)`);

    log('✅ Backup process complete');
    process.exit(0);
  } catch (err) {
    log(`❌ Backup failed: ${err.message}`);
    process.exit(1);
  }
}

runBackup();

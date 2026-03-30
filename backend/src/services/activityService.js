const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

const log = async ({ userId, action, entityType, entityId, metadata, req }) => {
  try {
    await ActivityLog.create({
      user_id: userId || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      metadata: metadata || {},
      ip_address: req?.ip || null,
      user_agent: req?.headers?.['user-agent'] || null
    });
  } catch (err) {
    logger.warn('[Activity] Log failed:', err.message);
  }
};

module.exports = { log };

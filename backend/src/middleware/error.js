/**
 * ── Express Error Handling Middleware ────────────────────────────
 * 
 * Centralized error handler for all API routes.
 * 
 * Features:
 *   - Unique Request ID tracking per error (for log correlation)
 *   - Mongoose/MongoDB error type detection (CastError, validation, duplicate key)
 *   - Network and timeout error handling
 *   - Payload size limit handling
 *   - JSON parse error handling (malformed request bodies)
 *   - Production-safe error messages (no stack traces leaked to client)
 *   - asyncHandler wrapper for clean async/await in route handlers
 */

const logger = require('../config/logger');

/**
 * Global error handler middleware.
 * Catches all errors thrown or passed via next(err) in route handlers.
 * Maps known error types to appropriate HTTP status codes.
 * 
 * @param {Error} err - The error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response  
 * @param {Function} next - Express next (required for Express to recognize as error handler)
 */
const errorHandler = (err, req, res, next) => {
    // Generate a unique request ID for log correlation
    const reqId = req.headers['x-request-id'] || require('crypto').randomUUID();
    logger.error(`[ReqID: ${reqId}] ${err.stack || err.message}`);

    let status = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // ── Mongoose: Invalid ObjectId (e.g., /leads/not-a-valid-id) ──
    if (err.name === 'CastError') {
        message = 'Resource not found';
        status = 404;
    }

    // ── MongoDB: Duplicate key violation (unique index) ───────────
    if (err.code === 11000) {
        message = 'Duplicate field value entered';
        status = 400;
    }

    // ── Mongoose: Schema validation error ─────────────────────────
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        message = errors.join(', ');
        status = 400;
    }

    // ── Mongoose: Query timeout (maxTimeMS exceeded) ──────────────
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
        message = 'Database operation timed out. Please try again.';
        status = 503;
    }

    // ── MongoDB: Network error (connection lost mid-query) ────────
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError') {
        message = 'Database temporarily unavailable. Please try again.';
        status = 503;
    }

    // ── MongoDB: Timeout during server selection ──────────────────
    if (err.name === 'MongoServerSelectionError') {
        message = 'Database connection unavailable. Please try again shortly.';
        status = 503;
    }

    // ── Express: Request body too large ───────────────────────────
    if (err.type === 'entity.too.large') {
        message = `Request body too large. Maximum size is ${process.env.MAX_UPLOAD_SIZE_MB || 50}MB.`;
        status = 413;
    }

    // ── Express: Malformed JSON in request body ───────────────────
    if (err.type === 'entity.parse.failed') {
        message = 'Invalid JSON in request body.';
        status = 400;
    }

    // ── JWT: Token errors (handled in auth middleware too) ────────
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid authentication token.';
        status = 401;
    }
    if (err.name === 'TokenExpiredError') {
        message = 'Authentication token has expired.';
        status = 401;
    }

    // In production, never expose raw error messages for server errors
    // to prevent leaking internal details (file paths, DB schema, etc.)
    const safeMessage = (process.env.NODE_ENV === 'production' && status >= 500)
        ? 'Internal server error'
        : message;

    res.status(status).json({
        success: false,
        error: safeMessage,
        reqId: reqId
    });
};

/**
 * Wraps async route handlers to automatically catch rejected promises.
 * Eliminates the need for try/catch in every route handler.
 * 
 * Usage: router.get('/leads', asyncHandler(async (req, res) => { ... }));
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware that catches async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };

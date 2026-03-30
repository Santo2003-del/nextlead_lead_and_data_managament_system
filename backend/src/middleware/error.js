const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    const reqId = req.headers['x-request-id'] || require('crypto').randomUUID();
    logger.error(`[ReqID: ${reqId}] ${err.stack}`);

    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'CastError') {
        message = 'Resource not found';
        status = 404;
    }

    if (err.code === 11000) {
        message = 'Duplicate field value entered';
        status = 400;
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        message = errors.join(', ');
        status = 400;
    }

    // In production, never expose raw error messages for server errors
    const safeMessage = (process.env.NODE_ENV === 'production' && status >= 500)
        ? 'Internal server error'
        : message;

    res.status(status).json({
        success: false,
        error: safeMessage,
        reqId: reqId
    });
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };

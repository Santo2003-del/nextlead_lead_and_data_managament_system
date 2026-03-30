const { body, param, query, validationResult } = require('express-validator');

// Validation Result Checker
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation Error', 
            details: errors.array().map(e => e.msg) 
        });
    }
    next();
};

// ── Auth Validators ───────────────
const loginValidator = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

const createUserValidator = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('role').optional().isIn(['super_admin', 'superadmin', 'admin', 'manager', 'marketing', 'employee'])
        .withMessage('Invalid role'),
    validate
];

// ── General Params ────────────────
const objectIdValidator = (paramName) => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
    validate
];

// ── Lead Validators ───────────────
const createLeadValidator = [
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('keyword').trim().notEmpty().withMessage('Keyword is required'),
    body('lead_score').optional().isNumeric().isInt({ min: 0, max: 100 }).withMessage('Lead score must be between 0 and 100'),
    validate
];

const bulkDeleteValidator = [
    body('ids').isArray({ min: 1 }).withMessage('An array of valid IDs is required'),
    body('ids.*').isMongoId().withMessage('Invalid ID format in array'),
    validate
];

// ── Scrape Validators ─────────────
const createJobValidator = [
    body('name').trim().notEmpty().withMessage('Job name is required'),
    body('source').trim().notEmpty().withMessage('Scrape source is required'),
    body('config').isObject().withMessage('Config object is required'),
    validate
];

module.exports = {
    loginValidator,
    createUserValidator,
    objectIdValidator,
    createLeadValidator,
    bulkDeleteValidator,
    createJobValidator,
    validate
};

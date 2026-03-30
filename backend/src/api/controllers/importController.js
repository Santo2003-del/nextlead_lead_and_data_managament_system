const ImportHistory = require('../../models/ImportHistory');
const logger = require('../../config/logger');

const ADMIN_ROLES = ['admin', 'manager', 'super_admin', 'superadmin'];

// GET /api/imports
// Returns user-scoped history for employee/marketing, full history for admin roles
const getImportHistory = async (req, res) => {
    try {
        const filter = {};
        if (!ADMIN_ROLES.includes(req.user.role)) {
            filter.uploaded_by = req.user._id;
        }

        const history = await ImportHistory.find(filter)
            .sort({ created_at: -1 })
            .limit(100)
            .populate('uploaded_by', 'name')
            .lean();

        const formatted = history.map(h => ({
            id: h._id.toString(),
            file_name: h.file_name,
            uploaded_by_name: h.uploaded_by ? h.uploaded_by.name : 'Unknown',
            source: h.source,
            created_at: h.created_at,
            total_rows: h.total_rows,
            valid_rows: h.valid_rows
        }));

        res.json({ data: formatted });
    } catch (err) {
        logger.error('[Import] getImportHistory error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getImportHistory };


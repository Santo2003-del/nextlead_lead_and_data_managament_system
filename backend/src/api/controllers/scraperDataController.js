const svc = require('../../services/scraperService');
const { log } = require('../../services/activityService');
const logger = require('../../config/logger');

const list = async (req, res) => {
    try {
        const { page = 1, limit = 50, sort = 'created_at', order = 'desc', ...filters } = req.query;
        if (!['admin', 'manager', 'super_admin', 'superadmin'].includes(req.user.role)) {
            filters.created_by = req.user.id;
        }
        const result = await svc.listScrapedData({ filters, page: +page, limit: +limit, sort, order });
        res.json(result);
    } catch (err) {
        logger.error('[ScraperData] list error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const convert = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });

        const result = await svc.convertToLeads(ids, req.user);
        
        await log({
            userId: req.user.id, action: 'convert', entityType: 'scraped_data',
            metadata: { count: ids.length, leads_inserted: result.inserted }, req
        });

        res.json({ message: `Successfully converted ${result.inserted} records to leads`, ...result });
    } catch (err) {
        logger.error('[ScraperData] convert error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const exportData = async (req, res) => {
    try {
        const { filters = {}, format = 'csv', name = 'Scraper Export', selected_columns = [] } = req.body;
        if (selected_columns.length) filters.selected_columns = selected_columns;
        const job = await svc.queueExport({ filters, format, userId: req.user.id, name });
        
        await log({
            userId: req.user.id, action: 'export', entityType: 'scraped_data',
            metadata: { format, filters }, req
        });

        res.json({ exportId: job._id.toString(), message: 'Export queued' });
    } catch (err) {
        logger.error('[ScraperData] exportData error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const directExport = async (req, res) => {
    try {
        const { format = 'csv', selected_columns } = req.query;
        // pass all query params as filters (keyword, search, etc)
        const filters = { ...req.query };
        delete filters.format;
        if (selected_columns) {
            filters.selected_columns = Array.isArray(selected_columns) ? selected_columns : selected_columns.split(',');
        }
        
        // Log the action right as it starts
        await log({
            userId: req.user?.id, action: 'direct_export', entityType: 'scraped_data',
            metadata: { format, filters }, req
        });

        await svc.streamExport({ filters, format, res });
    } catch (err) { 
        if (!res.headersSent) {
            res.status(err.status || 500).json({ error: err.message }); 
        }
    }
};

const updateRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const ScrapedData = require('../../models/ScrapedData');
        const allowedFields = ['first_name', 'last_name', 'email', 'company_name', 'job_title', 'country'];
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        const updatedRecord = await ScrapedData.findByIdAndUpdate(id, { $set: filteredUpdates }, { new: true });
        
        if (!updatedRecord) {
            return res.status(404).json({ error: 'Record not found' });
        }

        await log({
            userId: req.user.id, action: 'update', entityType: 'scraped_data', entityId: id,
            metadata: { updates: filteredUpdates }, req
        });

        res.json({ message: 'Record updated successfully', record: updatedRecord });
    } catch (err) {
        logger.error('[ScraperData] updateRecord error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const ScrapedData = require('../../models/ScrapedData');
        const record = await ScrapedData.findByIdAndDelete(id);
        
        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        await log({
            userId: req.user.id, action: 'delete', entityType: 'scraped_data', entityId: id, req
        });

        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        logger.error('[ScraperData] deleteRecord error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteAll = async (req, res) => {
    try {
        const deletedCount = await svc.deleteAllScrapedData();
        
        await log({
            userId: req.user.id, action: 'delete_all', entityType: 'scraped_data',
            metadata: { deletedCount }, req
        });

        res.json({ message: `Successfully deleted all ${deletedCount} records.` });
    } catch (err) {
        logger.error('[ScraperData] deleteAll error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { list, convert, exportData, directExport, updateRecord, deleteRecord, deleteAll };

const ScrapedData = require('../models/ScrapedData');
const ImportHistory = require('../models/ImportHistory');
const Lead = require('../models/Lead');
const leadService = require('./leadService');
const logger = require('../config/logger');
const { queues } = require('../config/redis');
const Export = require('../models/Export');
const fastcsv = require('fast-csv');
const ExcelJS = require('exceljs');

const buildScrapedFilterClause = (filters) => {
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {};
    if (filters.keyword) {
        if (Array.isArray(filters.keyword)) {
            query.keyword = { $in: filters.keyword.map(k => new RegExp(escapeRegExp(k), 'i')) };
        } else {
            // Also support comma-separated strings if passed from URL
            const kws = filters.keyword.split(',').map(k => k.trim()).filter(Boolean);
            query.keyword = kws.length > 1 ? { $in: kws.map(k => new RegExp(escapeRegExp(k), 'i')) } : new RegExp(escapeRegExp(kws[0] || filters.keyword), 'i');
        }
    }
    if (filters.country) query.country = new RegExp(escapeRegExp(filters.country), 'i');
    if (filters.job_title) query.job_title = new RegExp(escapeRegExp(filters.job_title), 'i');
    if (filters.company_name) query.company_name = new RegExp(escapeRegExp(filters.company_name), 'i');
    if (filters.email_domain) {
        // e.g., "gmail.com" matches "@gmail.com"
        query.email = new RegExp(`@${escapeRegExp(filters.email_domain)}$`, 'i');
    }
    if (filters.status) query.status = filters.status;
    
    // ── Role-based data isolation ─────────────────────────────
    // created_by is set by the controller for non-admin roles
    if (filters.created_by) {
        const mongoose = require('mongoose');
        query.$or = [
            { created_by: new mongoose.Types.ObjectId(filters.created_by) },
            { uploadedBy: new mongoose.Types.ObjectId(filters.created_by) }
        ];
    }

    if (filters.search) {
        const srch = new RegExp(escapeRegExp(filters.search), 'i');
        // If we already have $or from created_by, use $and to combine
        const searchOr = [
            { first_name: srch },
            { last_name: srch },
            { email: srch },
            { company_name: srch },
            { job_title: srch },
            { keyword: srch }
        ];
        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                { $or: searchOr }
            ];
            delete query.$or;
        } else {
            query.$or = searchOr;
        }
    }
    return query;
};

const listScrapedData = async ({ filters = {}, page = 1, limit = 50, sort = 'created_at', order = 'desc' }) => {
    const query = buildScrapedFilterClause(filters);

    const offset = (page - 1) * limit;
    const [total, data] = await Promise.all([
        ScrapedData.countDocuments(query),
        ScrapedData.find(query)
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip(offset)
            .limit(limit)
            .lean()
    ]);

    return {
        data: data.map(d => ({ ...d, id: d._id.toString() })),
        total,
        page: parseInt(page),
        limit: parseInt(limit)
    };
};

const convertToLeads = async (ids, user) => {
    const query = { _id: { $in: ids }, status: { $ne: 'converted' } };
    if (!['admin', 'manager', 'super_admin', 'superadmin'].includes(user.role)) {
        query.created_by = user._id || user.id;
    }
    const rawData = await ScrapedData.find(query);
    if (!rawData.length) return { converted: 0 };

    const leadDocs = rawData.map(d => {
        // Unpack the Mongoose Map natively
        const rawObj = d.rawData instanceof Map ? Object.fromEntries(d.rawData) : (d.rawData || {});
        
        // Target specifically recognized fields if they exist inside rawData but not root
        let website = rawObj.website || rawObj.company_website || '';
        if (!website && (d.website || d.company_website)) website = d.website || d.company_website;

        // Build the description block using all extra unidentified keys
        const standardKeys = ['first_name', 'last_name', 'email', 'company_name', 'company_phone', 'contact_number', 'job_title', 'country', 'keyword'];
        const descArr = [];
        for (const [k, v] of Object.entries(rawObj)) {
            if (!standardKeys.includes(k) && v && String(v).trim() !== '') {
                // Capitalize snake_case keys for readability
                const readableKey = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                descArr.push(`${readableKey}: ${v}`);
            }
        }
        const companyDesc = descArr.join(' | ');

        return {
            first_name: d.first_name,
            last_name: d.last_name,
            email: d.email,
            company: d.company_name,
            phone: d.company_phone || d.contact_number || '',
            website: website,
            job_title: d.job_title,
            country: d.country,
            company_desc: companyDesc,
            keyword: d.keyword,
            keywordId: d.keywordId,
            source: d.source || 'Manual',
            added_by: user._id || user.id,
            createdBy: user._id || user.id,
            createdByName: user.name,
            keywordCreatedBy: d.uploadedBy || (user._id || user.id),
            keywordCreatedByName: d.uploadedByName || user.name,
            createdAt: new Date(),
            status: 'new',
            metadata: d.metadata
        };
    });

    // Use lead service bulk create for consistency (handled dedup)
    const result = await leadService.bulkCreate(leadDocs, user._id || user.id);
    
    // Mark as converted
    await ScrapedData.updateMany({ _id: { $in: ids } }, { $set: { status: 'converted' } });

    return result;
};

const queueExport = async ({ filters, format, userId, name }) => {
    const job = await Export.create({
        name: name || 'Scraper Export',
        filters,
        format,
        created_by: userId,
        status: 'pending'
    });

    await queues.export.add({ 
        exportId: job._id.toString(), 
        filters, 
        format,
        collection: 'scraped_data' // Hint for the worker
    });

    return job;
};

const streamExport = async ({ filters, format, res }) => {
    const query = buildScrapedFilterClause(filters);
    
    // Quick count to ensure we don't return an empty file
    const count = await ScrapedData.countDocuments(query);
    if (count === 0) {
        const error = new Error('No records found for this keyword');
        error.status = 404;
        throw error;
    }

    const cursor = ScrapedData.find(query).cursor();

    const defaultCols = [
        { header: 'Keyword', key: 'keyword', width: 20 },
        { header: 'First Name', key: 'first_name', width: 20 },
        { header: 'Last Name', key: 'last_name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Company', key: 'company_name', width: 25 },
        { header: 'Job Title', key: 'job_title', width: 25 },
        { header: 'Country', key: 'country', width: 15 }
    ];
    let activeCols = defaultCols;
    if (filters.selected_columns && filters.selected_columns.length) {
        activeCols = defaultCols.filter(c => filters.selected_columns.includes(c.key));
    }

    if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="scraped_data.csv"');

        const csvStream = fastcsv.format({ headers: true });
        csvStream.pipe(res);

        for await (const doc of cursor) {
            const row = {};
            activeCols.forEach(c => row[c.header] = doc[c.key] || '');
            csvStream.write(row);
        }
        csvStream.end();

    } else if (format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="scraped_data.xlsx"');

        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
        const worksheet = workbook.addWorksheet('Scraped Data');

        worksheet.columns = activeCols;

        // Style the header row (Bold text, colored background)
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0EA5E9' } // Light blue
        };

        for await (const doc of cursor) {
            const row = {};
            activeCols.forEach(c => row[c.key] = doc[c.key] || '');
            worksheet.addRow(row).commit();
        }

        await workbook.commit();
    } else {
        const error = new Error('Unsupported export format');
        error.status = 400;
        throw error;
    }
};

const deleteAllScrapedData = async () => {
    const r1 = await ScrapedData.deleteMany({});
    const r2 = await ImportHistory.deleteMany({});
    const r3 = await Lead.deleteMany({});
    const r4 = await Export.deleteMany({});
    
    // Attempting to clear activity logs tied to leads/imports as well
    try {
        const Activity = require('../models/Activity');
        await Activity.deleteMany({ entityType: { $in: ['lead', 'scraped_data', 'import', 'export'] } });
    } catch(e) {}

    return (r1.deletedCount || 0) + (r2.deletedCount || 0) + (r3.deletedCount || 0) + (r4.deletedCount || 0);
};

module.exports = { listScrapedData, convertToLeads, queueExport, streamExport, buildScrapedFilterClause, deleteAllScrapedData };

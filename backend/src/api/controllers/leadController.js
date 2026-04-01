const multer = require('multer');
const csvParser = require('csv-parser');
const crypto = require('crypto');
const ImportHistory = require('../../models/ImportHistory');
const { Readable } = require('stream');
const svc = require('../../services/leadService');
const es = require('../../config/elasticsearch');
const { queues } = require('../../config/redis');
const { log } = require('../../services/activityService');
const Lead = require('../../models/Lead');
const Export = require('../../models/Export');
const ActivityLog = require('../../models/ActivityLog');
const logger = require('../../config/logger');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const ExcelJS = require('exceljs');

// GET /leads
const list = async (req, res) => {
  try {
    const { page = 1, limit = 50, sort, order, ...filters } = req.query;
    if (!['admin', 'manager', 'super_admin', 'superadmin'].includes(req.user.role)) {
      filters.added_by = req.user.id;
    }
    const result = await svc.listLeads({ filters, page: +page, limit: Math.min(+limit, 200), sort, order });
    res.json(result);
  } catch (err) {
    logger.error('[Leads] list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /leads/search  (Elasticsearch)
const search = async (req, res) => {
  try {
    const { q, page = 1, size = 50, ...filters } = req.query;
    if (!['admin', 'manager', 'super_admin', 'superadmin'].includes(req.user.role)) {
      filters.added_by = req.user.id;
    }
    const result = await es.searchLeads({ q, filters, page: +page, size: Math.min(+size, 200) });
    res.json(result);
  } catch (err) {
    logger.error('[Leads] search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /leads/stats
const stats = async (req, res) => {
  try { res.json(await svc.getStats(req.user)); }
  catch (err) {
    logger.error('[Leads] stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /leads/filter-options
const filterOptions = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const matchQuery = {};
    if (!['admin', 'manager', 'super_admin', 'superadmin'].includes(req.user.role)) {
      matchQuery.added_by = new mongoose.Types.ObjectId(req.user.id);
    }

    const [industries, countries, jobTitles, companies] = await Promise.all([
      Lead.distinct('industry', { ...matchQuery, industry: { $ne: null, $ne: '' } }),
      Lead.distinct('country', { ...matchQuery, country: { $ne: null, $ne: '' } }),
      Lead.distinct('job_title', { ...matchQuery, job_title: { $ne: null, $ne: '' } }),
      Lead.distinct('company', { ...matchQuery, company: { $ne: null, $ne: '' } }),
    ]);
    res.json({
      industries: industries.slice(0, 300),
      countries: countries.slice(0, 300),
      jobTitles: jobTitles.slice(0, 300),
      companies: companies.slice(0, 300),
    });
  } catch (err) {
    logger.error('[Leads] filterOptions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /leads/:id
const getOne = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('added_by', 'name').lean();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const formattedLead = {
      ...lead,
      id: lead._id.toString(),
      added_by_name: lead.added_by ? lead.added_by.name : null
    };

    res.json({ lead: formattedLead });
  } catch (err) {
    logger.error('[Leads] getOne error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /leads
const create = async (req, res) => {
  try {
    const lead = await svc.createLead(req.body, req.user.id);
    await log({
      userId: req.user.id, action: 'create', entityType: 'lead', entityId: lead._id,
      metadata: { company: lead.company, person: `${lead.first_name} ${lead.last_name}` }, req
    });
    res.status(201).json({ lead });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// PUT /leads/:id
const update = async (req, res) => {
  try {
    const lead = await svc.updateLead(req.params.id, req.body);
    await log({ userId: req.user.id, action: 'update', entityType: 'lead', entityId: lead._id, req });
    res.json({ lead });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
};

// DELETE /leads/:id  (Admin)
const remove = async (req, res) => {
  try {
    const { _id, company, first_name, last_name } = await svc.deleteLead(req.params.id);
    await log({
      userId: req.user.id, action: 'delete', entityType: 'lead', entityId: _id,
      metadata: { company, person: `${first_name} ${last_name}` }, req
    });
    res.json({ message: 'Lead deleted', id: _id.toString() });
  } catch (err) { res.status(err.status || 500).json({ error: err.message }); }
};

// POST /leads/bulk-delete  (Admin)
const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });

    await Lead.deleteMany({ _id: { $in: ids } });
    ids.forEach(id => es.deleteLead(id).catch(() => { }));

    res.json({ deleted: ids.length });
  } catch (err) {
    logger.error('[Leads] bulkDelete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /leads/import
const importLeads = upload.single('file');
const processImport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required (CSV or XLSX)' });



    // ── Security: File type validation ────────────────────────────
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const ALLOWED_EXT = ['csv', 'xlsx'];
    const ALLOWED_MIME = [
      'text/csv', 'application/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream' // some browsers send this for xlsx
    ];
    if (!ALLOWED_EXT.includes(ext)) {
      return res.status(400).json({ error: `Invalid file type ".${ext}". Only CSV and XLSX files are allowed.` });
    }
    if (!ALLOWED_MIME.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `Invalid MIME type "${req.file.mimetype}". Upload rejected for security.` });
    }
    if (req.file.size > (parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 50) * 1024 * 1024) {
      return res.status(400).json({ error: `File size exceeds ${(process.env.MAX_UPLOAD_SIZE_MB || 50)}MB limit.` });
    }

    // Magic Byte validation
    const headerBytes = req.file.buffer.toString('hex', 0, 4);
    if (ext === 'xlsx' && headerBytes !== '504b0304') {
      return res.status(400).json({ error: 'Invalid file signature. File is corrupted or tampered.' });
    }
    if (ext === 'csv' && ['504b0304', '4d5a9000', '7f454c46', '25504446'].includes(headerBytes)) {
      return res.status(400).json({ error: 'Invalid CSV file format detected.' });
    }

    // Content scanning — detect XSS, script injection, and Excel macro attacks
    const contentPreview = req.file.buffer.toString('utf8', 0, Math.min(req.file.buffer.length, 4096));
    const badPattern = /(<\s*script|eval\s*\(|document\.|window\.|require\s*\(|child_process)|(=CMD|=SYSTEM|=1\+)/i;
    if (badPattern.test(contentPreview)) {
      return res.status(400).json({ error: 'Suspicious content or macro injection detected in file.' });
    }

    // 1. Calculate file hash for tracking
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    
    let records = [];

    if (ext === 'csv') {
      await new Promise((resolve, reject) => {
        Readable.from(req.file.buffer)
          .pipe(csvParser())
          .on('data', r => records.push(r))
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (ext === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);
      const headers = [];
      worksheet.getRow(1).eachCell(cell => {
        const val = cell.value;
        headers.push(val && typeof val === 'object' ? (val.result || val.text || JSON.stringify(val)) : val);
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const record = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (!header) return;

          let val = cell.value;
          // Fix for React crash: extract result from formula objects
          if (val && typeof val === 'object') {
            if (val.formula) val = val.result !== undefined ? val.result : '';
            else if (val.richText) val = val.richText.map(t => t.text).join('');
            else if (val.text) val = val.text;
            else val = JSON.stringify(val);
          }
          record[header] = val;
        });
        records.push(record);
      });
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Use CSV or XLSX.' });
    }

    if (!records.length) return res.status(400).json({ error: 'File is empty' });
    if (records.length > 50000) return res.status(400).json({ error: 'Max 50,000 records per import' });

    // ── Phase 6: Required Column Validation ──────────────────────
    const fileHeaders = Object.keys(records[0]).map(h => h.toLowerCase().replace(/[\s_]/g, ''));

    const REQUIRED_COLUMN_CHECKS = [
      { name: 'Keyword', aliases: ['keyword'] },
      { name: 'First Name', aliases: ['firstname', 'first_name'] },
      { name: 'Email', aliases: ['email'] },
      { name: 'Company Name', aliases: ['company', 'companyname', 'company_name', 'domain', 'website', 'company_website', 'organization'] },
      { name: 'Job Title', aliases: ['jobtitle', 'job_title'] },
      { name: 'Country', aliases: ['country', 'location', 'region'] },
    ];

    const missingColumns = [];
    for (const check of REQUIRED_COLUMN_CHECKS) {
      const found = check.aliases.some(alias => fileHeaders.includes(alias));
      if (!found) missingColumns.push(check.name);
    }

    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: `Required columns missing: ${missingColumns.join(', ')}.`
      });
    }

    // 2. Data Validation and Mapping
    const ScrapedData = require('../../models/ScrapedData');
    const Keyword = require('../../models/Keyword');

    // Pre-calculate keywords
    const uniqueKeywords = [...new Set(records.map(r => {
      const k = r.keyword || r.Keyword || (r.keywords ? r.keywords.split('|')[0] : '');
      return k && typeof k === 'string' ? k.trim() : '';
    }).filter(Boolean))];

    if (uniqueKeywords.length > 0) {
      const kwOps = uniqueKeywords.map(kw => ({
        updateOne: {
          filter: { name: kw },
          update: { $setOnInsert: { name: kw, createdBy: req.user.id } },
          upsert: true
        }
      }));
      await Keyword.bulkWrite(kwOps, { ordered: false }).catch(() => { });
    }

    const kwDocs = await Keyword.find({ name: { $in: uniqueKeywords } }).lean();
    const keywordMap = {};
    kwDocs.forEach(d => keywordMap[d.name] = d._id);

    const docs = [];
    let validRows = 0;

    for (const r of records) {
      // Phase 1 + 3: Normalize ALL headers and store full row in rawData
      const rawData = {};
      Object.keys(r).forEach(k => {
        if (!k) return;
        const normKey = String(k).trim().toLowerCase().replace(/[\s\.-]+/g, '_');
        rawData[normKey] = r[k];
      });

      // Phase 2: Required Field Mapping
      const email = rawData.email || rawData.e_mail || '';
      const keyword = rawData.keyword || '';
      let fName = rawData.first_name || rawData.firstname || '';
      let lName = rawData.last_name || rawData.lastname || '';
      const fullName = rawData.full_name || rawData.fullname || rawData.name || '';

      if (!fName && !lName && fullName) {
        const parts = String(fullName).trim().split(/\s+/);
        fName = parts[0] || '';
        lName = parts.slice(1).join(' ') || '';
      }

      // Phase 10: Import Validation — strict rejection row by row
      if (!keyword || !email || !fName) {
        continue;
      }

      let companyName = rawData.company_name || rawData.company || '';
      const domain = rawData.domain || rawData.website || '';
      if (!companyName && domain) companyName = domain;

      const companyPhone = rawData.company_phone || rawData.phone || rawData.contact_number || '';
      const jobTitle = rawData.job_title || rawData.jobtitle || rawData.title || '';
      const country = rawData.country || '';
      const linkedin = rawData.linkedin || rawData.linkedin_url || '';
      const industry = rawData.industry || '';

      // Phase 9: No data loss - full rawData pushed to DB
      const mapped = {
        first_name: fName,
        last_name: lName,
        email: email,
        company_name: companyName,
        company_phone: companyPhone,
        job_title: jobTitle,
        country: country,
        keyword: keyword,
        keywordId: keywordMap[keyword] || null,
        contact_number: companyPhone, // fallback matching DB structure
        linkedin: linkedin,
        industry: industry,
        company_website: domain,
        source_file: req.file.originalname,
        source: rawData.source || 'Imported',
        importedAt: new Date(),
        uploadedBy: req.user.id,
        uploadedByName: req.user.name || 'Unknown',
        created_by: req.user.id,
        metadata: {},
        rawData: rawData
      };

      docs.push(mapped);
      validRows++;
    }

    if (!docs.length) {
      return res.status(400).json({ error: 'No valid rows found in file. Ensure minimum required fields: keyword, email, first_name.' });
    }

    let actualInserted = 0;
    try {
      // Phase 11: Performance - Use bulkWrite
      const bulkOps = docs.map(doc => ({
        insertOne: { document: doc }
      }));
      const result = await ScrapedData.bulkWrite(bulkOps, { ordered: false });
      actualInserted = result.insertedCount;
    } catch (err) {
      if (err.name !== 'MongoBulkWriteError' && err.code !== 11000) {
        throw err;
      }
      actualInserted = err.insertedCount || (err.result && err.result.nInserted ? err.result.nInserted : 0);
      logger.info(`Import partial success: some duplicates skipped in file ${req.file.originalname}. Inserted: ${actualInserted}`);
    }

    if (actualInserted === 0) {
      return res.status(409).json({ error: 'Upload rejected: This exact dataset (or all its keywords + emails) already exists perfectly in the system. No new data found.' });
    }

    // 3. Store Import Status tracking success
    await ImportHistory.create({
      file_name: req.file.originalname,
      file_hash: fileHash,
      size: req.file.size,
      uploaded_by: req.user.id,
      source: req.body.source || 'Unknown',
      imported_tab: req.body.imported_tab || 'Unknown',
      total_rows: records.length,
      valid_rows: actualInserted
    });

    await log({
      userId: req.user.id, action: 'import', entityType: 'scraped_data',
      metadata: { total: records.length, valid: actualInserted, format: ext, filename: req.file.originalname }, req
    });

    res.json({ message: `Successfully imported ${actualInserted} out of ${records.length} records.`, inserted: actualInserted });
  } catch (err) {
    logger.error('[Leads] processImport error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /leads/export
const exportLeads = async (req, res) => {
  try {
    const { filters = {}, format = 'csv', name = 'Export', selected_columns = [] } = req.body;
    if (selected_columns.length) filters.selected_columns = selected_columns;

    const exportJob = await Export.create({
      name,
      filters,
      format,
      created_by: req.user.id
    });

    const exportId = exportJob._id.toString();

    await queues.export.add({ exportId, filters, format }, { attempts: 2 });

    await log({
      userId: req.user.id, action: 'export', entityType: 'lead',
      metadata: { format, filters }, req
    });

    res.json({ exportId, message: 'Export queued. Poll /leads/exports/:id for status.' });
  } catch (err) {
    logger.error('[Leads] exportLeads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /leads/exports/:id
const exportStatus = async (req, res) => {
  try {
    const exportJob = await Export.findById(req.params.id);
    if (!exportJob) return res.status(404).json({ error: 'Export not found' });
    res.json({ export: exportJob });
  } catch (err) {
    logger.error('[Leads] exportStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /leads/exports/:id/download
const downloadExport = async (req, res) => {
  try {
    const exp = await Export.findOne({ _id: req.params.id, created_by: req.user.id });
    if (!exp) return res.status(404).json({ error: 'Not found' });
    if (exp.status !== 'ready') return res.status(400).json({ error: `Export is ${exp.status}` });

    const ext = exp.format === 'xlsx' ? 'xlsx' : 'csv';
    res.download(exp.file_path, `leads_${exp._id}.${ext}`);
  } catch (err) {
    logger.error('[Leads] downloadExport error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /leads/:id/enrich  (manual re-enrich)
const triggerEnrich = async (req, res) => {
  try {
    const { id } = req.params;
    const exists = await Lead.findById(id);
    if (!exists) return res.status(404).json({ error: 'Lead not found' });

    await queues.enrich.add({ leadId: id }, { attempts: 3 });

    res.json({ message: 'Enrichment queued' });
  } catch (err) {
    logger.error('[Leads] triggerEnrich error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /leads/activity
const activityLog = async (req, res) => {
  try {
    const { limit = 50, page = 1, action } = req.query;
    const limitNum = Math.min(+limit, 200);
    const skipNum = (+page - 1) * limitNum;

    const matchQuery = {};
    const mongoose = require('mongoose');
    if (req.user && !['admin', 'manager', 'super_admin', 'superadmin'].includes(req.user.role)) {
      matchQuery.user_id = new mongoose.Types.ObjectId(req.user.id);
    }
    if (action) {
      if (action === 'logins') matchQuery.action = 'login';
      else if (action === 'logouts') matchQuery.action = 'logout';
      else matchQuery.action = action;
    }

    const [total, logs] = await Promise.all([
      ActivityLog.countDocuments(matchQuery),
      ActivityLog.aggregate([
        { $match: matchQuery },
        { $sort: { created_at: -1 } },
        { $skip: skipNum },
        { $limit: limitNum },
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { action: 1, entity_type: 1, entity_id: 1, metadata: 1, ip_address: 1, created_at: 1, user_name: '$user.name' } }
      ])
    ]);
    res.json({ logs, total, pages: Math.ceil(total / limitNum), page: +page });
  } catch (err) {
    logger.error('[Leads] activityLog error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  list, search, stats, filterOptions, getOne, create, update, remove,
  bulkDelete, importLeads, processImport, exportLeads, exportStatus,
  downloadExport, triggerEnrich, activityLog,
};

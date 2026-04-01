const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const mongoose = require('mongoose');
const es = require('../config/elasticsearch');
const { queues } = require('../config/redis');
const logger = require('../config/logger');

// ── Build Mongoose filter object from query params ─────────────
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFilterClause(filters) {
  const query = {};

  if (filters.industry) query.industry = new RegExp(escapeRegExp(filters.industry), 'i');
  if (filters.country) query.country = new RegExp(escapeRegExp(filters.country), 'i');
  if (filters.domain) query.domain = new RegExp(escapeRegExp(filters.domain), 'i');
  if (filters.email_domain) query.email = new RegExp(`@${escapeRegExp(filters.email_domain)}$`, 'i');
  if (filters.keyword) {
    const kw = new RegExp(escapeRegExp(filters.keyword), 'i');
    query.$or = [
      { job_title: kw },
      { company: kw },
      { industry: kw }
    ];
  }
  if (filters.job_title) query.job_title = new RegExp(escapeRegExp(filters.job_title), 'i');
  if (filters.company) query.company = new RegExp(escapeRegExp(filters.company), 'i');
  if (filters.status) query.status = filters.status;
  if (filters.source) query.source = new RegExp(escapeRegExp(filters.source), 'i');
  if (filters.employee_size) query.employee_size = filters.employee_size;

  if (filters.score_min !== undefined || filters.score_max !== undefined) {
    query.lead_score = {};
    if (filters.score_min !== undefined) query.lead_score.$gte = parseInt(filters.score_min);
    if (filters.score_max !== undefined) query.lead_score.$lte = parseInt(filters.score_max);
  }

  if (filters.date_from || filters.date_to) {
    query.created_at = {};
    if (filters.date_from) query.created_at.$gte = new Date(filters.date_from);
    if (filters.date_to) query.created_at.$lte = new Date(filters.date_to);
  }

  if (filters.added_by) {
    try {
      query.added_by = new mongoose.Types.ObjectId(filters.added_by);
    } catch {
      query.added_by = filters.added_by;
    }
  }
  if (filters.search) query.$text = { $search: filters.search };

  return query;
}

// ── List leads (paginated, filtered) ─────────────────────────
const listLeads = async ({ filters = {}, page = 1, limit = 50, sort = 'created_at', order = 'desc' }) => {
  const ALLOWED_SORT = ['lead_score', 'created_at', 'company', 'first_name', 'last_name', 'country', 'industry'];
  const safeSort = ALLOWED_SORT.includes(sort) ? sort : 'created_at';
  const sortObj = { [safeSort]: order === 'asc' ? 1 : -1 };
  const offset = (page - 1) * limit;

  const mongoQuery = buildFilterClause(filters);

  const [count, data] = await Promise.all([
    Lead.countDocuments(mongoQuery),
    Lead.find(mongoQuery)
      .sort(sortObj)
      .skip(offset)
      .limit(limit)
      .populate('added_by', 'name')
      .lean()
  ]);

  // Format data to match old structure expecting `added_by_name` and new schema
  const formattedData = data.map(lead => ({
    ...lead,
    id: lead._id.toString(),
    added_by_name: lead.added_by ? lead.added_by.name : null,
    createdByName: lead.createdByName || (lead.createdBy ? (lead.createdBy.name || '') : ''),
    keywordCreatedByName: lead.keywordCreatedByName || '',
    createdAt: lead.createdAt || lead.created_at
  }));

  return {
    data: formattedData,
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(count / limit),
  };
};

// ── Create lead ───────────────────────────────────────────────
const createLead = async (data, userId) => {
  let {
    first_name, last_name, job_title, email, phone, linkedin, company, domain, website,
    industry, country, city, employee_size, revenue, client_description,
    keywords = [], keyword, notes, source = 'Manual', status = 'new', name,
  } = data;

  // ── Phase 9: Backend Validation — reject if critical fields missing ──
  if (!keyword || !keyword.trim()) {
    throw Object.assign(new Error('Keyword is required. Cannot save lead without a keyword.'), { status: 400 });
  }
  if (!email || !email.trim()) {
    throw Object.assign(new Error('Email is required. Cannot save lead without an email.'), { status: 400 });
  }
  if (!first_name || !first_name.trim()) {
    throw Object.assign(new Error('First Name is required. Cannot save lead without a first name.'), { status: 400 });
  }
  if (!job_title || !job_title.trim()) {
    throw Object.assign(new Error('Job Title is required. Cannot save lead without a job title.'), { status: 400 });
  }
  if (!country || !country.trim()) {
    throw Object.assign(new Error('Country is required. Cannot save lead without a country.'), { status: 400 });
  }

  const user = await User.findById(userId);
  const createdByName = user?.name || 'System';

  let kwOwnerId = userId;
  let kwOwnerName = createdByName;
  let resolvedKeywordId = null;

  if (keyword) {
    const Keyword = require('../models/Keyword');
    const kwText = keyword.trim();
    if (kwText) {
      const kwDoc = await Keyword.findOneAndUpdate(
        { name: kwText },
        { $setOnInsert: { name: kwText, createdBy: userId } },
        { upsert: true, new: true }
      );
      resolvedKeywordId = kwDoc._id;
    }
  }

  // Handle full name field from frontend form
  if (name && !first_name && !last_name) {
    const parts = name.trim().split(/\s+/);
    first_name = parts[0] || '';
    last_name = parts.slice(1).join(' ') || '';
  }

  // Dedup check
  if (email) {
    const dup = await Lead.findOne({ email: email.toLowerCase() });
    if (dup) throw Object.assign(new Error('Duplicate: email already exists'), { status: 409 });
  }
  if (domain) {
    const dup = await Lead.findOne({ domain: domain.toLowerCase() });
    if (dup) throw Object.assign(new Error('Duplicate: domain already exists'), { status: 409 });
  }

  const lead = await Lead.create({
    first_name, last_name, job_title, email: email?.toLowerCase()?.trim(), phone, linkedin,
    company, domain: domain?.toLowerCase()?.trim(), website,
    industry, country, city, employee_size, revenue, client_description,
    keywords, keyword, keywordId: resolvedKeywordId, notes, source: source || 'Manual', status, added_by: userId,
    createdBy: userId,
    createdByName,
    keywordCreatedBy: kwOwnerId,
    keywordCreatedByName: kwOwnerName,
    createdAt: new Date()
  });

  // Index in ES (best effort)
  es.indexLead({ ...lead.toJSON(), id: lead._id.toString() }).catch(e => logger.warn('[ES] Index failed:', e.message));

  return lead;
};

// ── Bulk create (import) ──────────────────────────────────────
const bulkCreate = async (records, userId) => {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const user = await User.findById(userId);
  const createdByName = user?.name || 'System';

  const FIXED_FIELDS = [
    'first_name', 'last_name', 'job_title', 'email', 'company', 'domain', 'country', 'industry',
    'keywords', 'phone', 'company_phone', 'linkedin', 'notes', 'source', 'employee_size', 'revenue'
  ];

  // Validate all records have keywords before proceeding (Phase 12 strict rule)
  const missingKeywordRecords = records.filter(r => {
    const kwString = r.keyword || (Array.isArray(r.keywords) ? r.keywords[0] : (r.keywords || '').split('|')[0]);
    return !kwString || !kwString.trim();
  });

  if (missingKeywordRecords.length > 0) {
    throw new Error('Import rejected: One or more rows are missing the required "keyword" field.');
  }

  // Data processing: Duplicate removal, Invalid email detection, Empty row removal, Normalization
  const processedRecords = records.filter(r => {
    // Empty row removal: must have at least company or email
    if (!r.company && !r.email && !r.first_name && !r.last_name) return false;

    // Invalid email detection (basic check)
    if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())) {
      r.email = undefined;
    }
    return true;
  }).map(r => {
    // Normalization & Name Split
    let first_name = r.first_name?.trim() || r.firstName?.trim();
    let last_name = r.last_name?.trim() || r.lastName?.trim();
    const fullName = r.full_name || r.name || r.FullName || r.Name || '';

    if (!first_name && !last_name && fullName) {
      const parts = fullName.trim().split(/\s+/);
      first_name = parts[0] || '';
      last_name = parts.slice(1).join(' ') || '';
    }

    const email = r.email?.toLowerCase()?.trim();
    const domain = r.domain?.toLowerCase()?.trim();
    const job_title = r.job_title?.trim() || r.jobTitle?.trim();

    const kw = Array.isArray(r.keywords)
      ? r.keywords
      : (r.keywords || '').split('|').map(k => k.trim()).filter(Boolean);

    // Capture extra fields into metadata
    const metadata = {};
    Object.keys(r).forEach(key => {
      const lowKey = key.toLowerCase();
      if (!FIXED_FIELDS.includes(lowKey) && r[key] !== undefined) {
        metadata[key] = r[key];
      }
    });

    const extractedKeyword = r.keyword || (Array.isArray(r.keywords) ? r.keywords[0] : (r.keywords || '').split('|')[0]);

    return {
      first_name, last_name, job_title, email, company: r.company?.trim(), domain,
      country: r.country?.trim(), industry: r.industry?.trim(),
      keywords: kw, keyword: extractedKeyword, keywordId: r.keywordId, phone: r.phone?.trim() || r.company_phone?.trim(), linkedin: r.linkedin?.trim(),
      notes: r.notes, employee_size: r.employee_size, revenue: r.revenue,
      source: r.source || 'import', 
      added_by: r.added_by || userId, 
      metadata,
      keywordCreatedBy: r.keywordCreatedBy || userId,
      keywordCreatedByName: r.keywordCreatedByName || createdByName,
      createdBy: r.createdBy || userId,
      createdByName: r.createdByName || createdByName,
    };
  });

  // Simple duplicate removal based on email in the batch itself
  const uniqueInBatch = [];
  const seenEmails = new Set();
  processedRecords.forEach(r => {
    if (r.email) {
      if (!seenEmails.has(r.email)) {
        seenEmails.add(r.email);
        uniqueInBatch.push(r);
      }
    } else {
      uniqueInBatch.push(r);
    }
  });

  const ops = uniqueInBatch.map(r => {
    const filter = r.email ? { email: r.email } : { first_name: r.first_name, last_name: r.last_name, company: r.company };
    return {
      updateOne: {
        filter,
        update: { 
          $setOnInsert: {
            ...r,
            keywordId: r.keywordId,
            added_by: r.added_by,
            createdBy: r.createdBy,
            createdByName: r.createdByName,
            keywordCreatedBy: r.keywordCreatedBy,
            keywordCreatedByName: r.keywordCreatedByName,
            createdAt: new Date()
          }
        },
        upsert: true
      }
    };
  });

  try {
    const result = await Lead.bulkWrite(ops, { ordered: false });
    inserted = result.upsertedCount;
    skipped = records.length - inserted;

    const upsertedIds = Object.values(result.upsertedIds || {});
  } catch (err) {
    // Handling bulk write errors (duplicate keys, etc)
    if (err.writeErrors) {
      errors = err.writeErrors.length;
      inserted = records.length - errors - skipped;
    } else {
      errors = records.length;
    }
  }

  // Reindex in background
  const recentLeads = await Lead.find({ added_by: userId }).sort({ created_at: -1 }).limit(inserted).lean();
  if (recentLeads.length) es.bulkIndexLeads(recentLeads.map(l => ({ ...l, id: l._id.toString() }))).catch(() => { });

  return { inserted, skipped, errors, total: records.length };
};

// ── Update lead ───────────────────────────────────────────────
const updateLead = async (id, data) => {
  const FIELDS = ['first_name', 'last_name', 'job_title', 'keyword', 'name', 'email', 'phone', 'linkedin', 'company', 'domain', 'website',
    'industry', 'country', 'city', 'employee_size', 'revenue', 'client_description',
    'keywords', 'notes', 'source', 'status', 'lead_score'];
  const updateData = {};

  for (const f of FIELDS) {
    if (data[f] !== undefined) {
      updateData[f] = f === 'email' || f === 'domain' ? data[f]?.toLowerCase() : data[f];
    }
  }

  if (Object.keys(updateData).length === 0) throw new Error('No fields to update');

  const lead = await Lead.findByIdAndUpdate(id, updateData, { new: true });
  if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404 });

  es.indexLead({ ...lead.toJSON(), id: lead._id.toString() }).catch(() => { });
  return lead;
};

// ── Delete lead ───────────────────────────────────────────────
const deleteLead = async (id) => {
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404 });
  es.deleteLead(id).catch(() => { });
  return lead;
};

// ── Stats for dashboard ───────────────────────────────────────
const getStats = async (user) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const matchQuery = {};
  if (user && !['admin', 'manager', 'super_admin', 'superadmin'].includes(user.role)) {
    matchQuery.added_by = user._id || user.id;
  }

  const [
    totalCount,
    avgScoreAggr,
    todayCount,
    topIndustriesAggr,
    topCountriesAggr,
    byScoreAggr,
    recentActivityAggr,
    topEmployeesAggr
  ] = await Promise.all([
    Lead.countDocuments(matchQuery),
    Lead.aggregate([{ $match: matchQuery }, { $group: { _id: null, avgScore: { $avg: '$lead_score' } } }]),
    Lead.countDocuments({ ...matchQuery, created_at: { $gte: startOfDay } }),
    Lead.aggregate([
      { $match: { ...matchQuery, industry: { $ne: null } } },
      { $group: { _id: '$industry', cnt: { $sum: 1 } } },
      { $sort: { cnt: -1 } },
      { $limit: 8 },
      { $project: { industry: '$_id', cnt: 1, _id: 0 } }
    ]),
    Lead.aggregate([
      { $match: { ...matchQuery, country: { $ne: null } } },
      { $group: { _id: '$country', cnt: { $sum: 1 } } },
      { $sort: { cnt: -1 } },
      { $limit: 8 },
      { $project: { country: '$_id', cnt: 1, _id: 0 } }
    ]),
    Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          hot: { $sum: { $cond: [{ $gte: ['$lead_score', 80] }, 1, 0] } },
          warm: { $sum: { $cond: [{ $and: [{ $gte: ['$lead_score', 50] }, { $lt: ['$lead_score', 80] }] }, 1, 0] } },
          cold: { $sum: { $cond: [{ $lt: ['$lead_score', 50] }, 1, 0] } }
        }
      }
    ]),
    ActivityLog.aggregate([
      { $match: matchQuery.added_by ? { user_id: matchQuery.added_by } : {} },
      { $sort: { created_at: -1 } },
      { $limit: 15 },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { action: 1, entity_type: 1, created_at: 1, user_name: '$user.name' } }
    ]),
    Lead.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$added_by', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', leads_added: '$count' } }
    ])
  ]);

  return {
    total: totalCount,
    avgScore: avgScoreAggr.length > 0 ? Math.round(avgScoreAggr[0].avgScore) : 0,
    leadsToday: todayCount,
    topIndustries: topIndustriesAggr,
    topCountries: topCountriesAggr,
    byScore: byScoreAggr.length > 0 ? { hot: byScoreAggr[0].hot, warm: byScoreAggr[0].warm, cold: byScoreAggr[0].cold } : { hot: 0, warm: 0, cold: 0 },
    recentActivity: recentActivityAggr,
    topEmployees: topEmployeesAggr,
  };
};

module.exports = { listLeads, createLead, updateLead, deleteLead, bulkCreate, getStats, buildFilterClause };

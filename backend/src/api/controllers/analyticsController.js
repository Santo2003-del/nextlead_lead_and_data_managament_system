const mongoose = require('mongoose');
const Lead = require('../../models/Lead');
const User = require('../../models/User');
const Export = require('../../models/Export');
const { exportCSV, exportExcel } = require('../../services/exportService');
const path = require('path');
const fs = require('fs');
const { format: csvFormat } = require('fast-csv');
const ExcelJS = require('exceljs');
const logger = require('../../config/logger');

const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
const ADMIN_ROLES = ['admin', 'manager', 'super_admin', 'superadmin'];
const isAdminRole = (role) => ADMIN_ROLES.includes(role);

// ── GET /api/analytics/global ─────────────────────────────────
// Available to ALL authenticated users
const globalInsights = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Role-based data isolation
    const matchStage = {};
    if (!isAdminRole(req.user.role)) {
      matchStage.added_by = new mongoose.Types.ObjectId(req.user.id);
    }

    const [
      totalLeads,
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      leadsByUser,
      leadsByKeyword,
      leadsOverTime
    ] = await Promise.all([
      Lead.countDocuments(matchStage),
      Lead.countDocuments({ ...matchStage, $or: [{ createdAt: { $gte: startOfDay } }, { created_at: { $gte: startOfDay } }] }),
      Lead.countDocuments({ ...matchStage, $or: [{ createdAt: { $gte: startOfWeek } }, { created_at: { $gte: startOfWeek } }] }),
      Lead.countDocuments({ ...matchStage, $or: [{ createdAt: { $gte: startOfMonth } }, { created_at: { $gte: startOfMonth } }] }),

      // Leads per user
      Lead.aggregate([
        { $match: matchStage },
        { $group: { _id: { $ifNull: ['$createdBy', '$added_by'] }, count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, userId: '$_id', name: { $ifNull: ['$user.name', 'Unknown'] }, count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),

      // Leads per keyword (from both `keywords` array and `keyword` string)
      Lead.aggregate([
        { $match: matchStage },
        { $addFields: { 
            allKeywords: { 
              $setUnion: [
                { $ifNull: ['$keywords', []] },
                { $cond: [{ $in: ['$keyword', [null, '']] }, [], ['$keyword']] }
              ] 
            } 
        }},
        { $unwind: { path: '$allKeywords', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$allKeywords', count: { $sum: 1 } } },
        { $project: { _id: 0, keyword: '$_id', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),

      // Leads over time (last 30 days, grouped by date)
      Lead.aggregate([
        { $match: { ...matchStage, $or: [{ createdAt: { $gte: thirtyDaysAgo } }, { created_at: { $gte: thirtyDaysAgo } }] } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$createdAt', '$created_at'] } } },
            count: { $sum: 1 }
          }
        },
        { $project: { _id: 0, date: '$_id', count: 1 } },
        { $sort: { date: 1 } }
      ])
    ]);

    res.json({
      totalLeads,
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      leadsByUser,
      leadsByKeyword,
      leadsOverTime
    });
  } catch (err) {
    logger.error('[Analytics] globalInsights error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/analytics/keywords ───────────────────────────────
// Admin / Manager only
const keywordDashboard = async (req, res) => {
  try {
    const ScrapedData = require('../../models/ScrapedData');

    // 1. Source of truth: ScrapedData for unique keywords
    const scrapedKeywordStats = await ScrapedData.aggregate([
      { $match: { keyword: { $nin: [null, ''] } } },
      {
        $group: {
          _id: { $trim: { input: { $toLower: '$keyword' } } },
          firstSeen: { $min: '$created_at' },
          topContributor: { $first: '$uploadedBy' },
          exactKeyword: { $first: '$keyword' },
          totalLeads: { $sum: 1 }
        }
      },
      { $lookup: { from: 'users', localField: 'topContributor', foreignField: '_id', as: 'contributor' } },
      { $unwind: { path: '$contributor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          keyword: '$exactKeyword',
          searchKey: '$_id',
          firstSeen: 1,
          topContributorName: { $ifNull: ['$contributor.name', 'Unknown'] },
          totalLeads: 1
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    const keywords = scrapedKeywordStats;
    const totalKeywords = keywords.length;
    const avgLeadsPerKeyword = totalKeywords > 0
      ? Math.round(keywords.reduce((s, k) => s + k.totalLeads, 0) / totalKeywords)
      : 0;

    res.json({
      totalKeywords,
      avgLeadsPerKeyword,
      topKeyword: keywords[0]?.keyword || 'N/A',
      keywords
    });
  } catch (err) {
    logger.error('[Analytics] keywordDashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/analytics/keywords/:keyword/leads ────────────────
// Admin / Manager only — returns paginated leads for a keyword
const keywordLeads = async (req, res) => {
  try {
    const keyword = decodeURIComponent(req.params.keyword);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;

    const ScrapedData = require('../../models/ScrapedData');
    const filter = { keyword: { $regex: new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };

    const [total, records] = await Promise.all([
      ScrapedData.countDocuments(filter),
      ScrapedData.find(filter)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
    ]);

    const data = records.map(l => ({
      ...l,
      id: l._id.toString(),
      company: l.company_name || l.metadata?.company || '',
      added_by_name: l.uploadedByName || 'System',
      lead_score: 0 // Scraped Data doesn't natively have lead_score until it hits CRM
    }));

    res.json({ data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error('[Analytics] keywordLeads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── POST /api/analytics/keywords/:keyword/export ──────────────
// Admin / Manager only — export all leads for a keyword
const keywordExport = async (req, res) => {
  try {
    const keyword = decodeURIComponent(req.params.keyword);
    const format = req.body.format || 'csv';

    const ScrapedData = require('../../models/ScrapedData');

    const filter = { keyword: { $regex: new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };

    const records = await ScrapedData.find(filter)
      .sort({ created_at: -1 })
      .lean();

    const data = records.map(r => ({
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      email: r.email || '',
      company: r.company_name || r.metadata?.company || '',
      job_title: r.job_title || '',
      country: r.country || '',
      keyword: r.keyword || ''
    }));

    const cols = ['first_name', 'last_name', 'email', 'company', 'job_title', 'country', 'keyword'];
    const exportId = `kw_${Date.now()}`;
    const outPath = path.join(EXPORT_DIR, `${exportId}.${format === 'xlsx' ? 'xlsx' : 'csv'}`);

    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`Keyword: ${keyword}`);
      ws.columns = cols.map(k => ({
        header: k.replace(/_/g, ' ').toUpperCase(), key: k,
        width: k === 'id' ? 25 : k === 'email' ? 30 : 18
      }));
      ws.getRow(1).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      ws.getRow(1).height = 25;
      data.forEach(l => {
        const row = {};
        cols.forEach(c => { row[c] = l[c]; });
        ws.addRow(row);
      });
      await wb.xlsx.writeFile(outPath);
    } else {
      await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(outPath);
        const stream = csvFormat({ headers: cols.map(k => k.replace(/_/g, ' ').toUpperCase()) });
        stream.pipe(ws);
        data.forEach(l => {
          const row = {};
          cols.forEach(c => { row[c.replace(/_/g, ' ').toUpperCase()] = l[c]; });
          stream.write(row);
        });
        stream.end();
        ws.on('finish', resolve);
        ws.on('error', reject);
      });
    }

    // Send the file directly
    res.download(outPath, `keyword_${keyword}_export.${format === 'xlsx' ? 'xlsx' : 'csv'}`, (err) => {
      if (err) logger.error('[Analytics] download error:', err.message);
      // Clean up file after download
      setTimeout(() => fs.unlink(outPath, () => { }), 60000);
    });
  } catch (err) {
    logger.error('[Analytics] keywordExport error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/analytics/performance ────────────────────────────
// All users — Returns paginated performance table data
const performanceTable = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'totalLeads';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const matchStage = {};

    // Role-based visibility
    if (!['superadmin', 'admin', 'manager', 'super_admin'].includes(req.user.role)) {
      matchStage.$or = [
        { createdBy: new mongoose.Types.ObjectId(req.user.id) },
        { added_by: new mongoose.Types.ObjectId(req.user.id) }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "keywords",
          localField: "keywordId",
          foreignField: "_id",
          as: "keywordData"
        }
      },
      { $unwind: { path: "$keywordData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "keywordData.createdBy",
          foreignField: "_id",
          as: "importedUser"
        }
      },
      { $unwind: { path: "$importedUser", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$createdBy', '$added_by'] },
          totalLeads: { $sum: 1 },
          leadsToday: {
            $sum: { $cond: [{ $gte: [{ $ifNull: ['$createdAt', '$created_at'] }, startOfDay] }, 1, 0] }
          },
          leadsThisWeek: {
            $sum: { $cond: [{ $gte: [{ $ifNull: ['$createdAt', '$created_at'] }, startOfWeek] }, 1, 0] }
          },
          leadsThisMonth: {
            $sum: { $cond: [{ $gte: [{ $ifNull: ['$createdAt', '$created_at'] }, startOfMonth] }, 1, 0] }
          },
          rawActivity: {
            $push: {
              date: { $ifNull: ['$createdAt', '$created_at'] },
              keyword: { 
                $ifNull: [
                  '$keywordData.name', 
                  { $ifNull: ['$keyword', { $ifNull: [{ $arrayElemAt: ['$keywords', 0] }, 'N/A'] }] }
                ] 
              },
              source: { $ifNull: ['$source', 'Imported'] },
              importedBy: { 
                $ifNull: [
                  '$importedUser.name', 
                  { $ifNull: ['$keywordCreatedByName', { $ifNull: ['$createdByName', 'N/A'] }] }
                ] 
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDoc'
        }
      },
      { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          userName: { $ifNull: ['$userDoc.name', 'System'] },
          totalLeads: 1,
          leadsToday: 1,
          leadsThisWeek: 1,
          leadsThisMonth: 1,
          rawActivity: 1
        }
      }
    ];

    const aggregatedData = await Lead.aggregate(pipeline);

    // Fetch all relevant active users 
    let activeUsers = [];
    if (!['superadmin', 'admin', 'manager', 'super_admin'].includes(req.user.role)) {
      activeUsers = await User.find({ _id: req.user.id, is_active: true }).select('name _id').lean();
    } else {
      activeUsers = await User.find({ is_active: true }).select('name _id').lean();
    }

    const userMap = {};
    aggregatedData.forEach(item => {
      const uid = item.userId ? item.userId.toString() : 'system';
      userMap[uid] = item;
    });

    const data = activeUsers.map(u => {
      const uid = u._id.toString();
      if (userMap[uid]) {
        return {
          ...userMap[uid],
          userName: u.name
        };
      }
      return {
        userId: uid,
        userName: u.name,
        totalLeads: 0,
        leadsToday: 0,
        leadsThisWeek: 0,
        leadsThisMonth: 0,
        rawActivity: []
      };
    });

    if (userMap['system']) {
      data.push(userMap['system']);
    }

    // Sort alphabetically by user name
    data.sort((a, b) => a.userName.localeCompare(b.userName));

    // Return the massive structured array completely unpaginated to support fast UI tabs natively
    res.json({ data });
  } catch (err) {
    logger.error('[Analytics] performanceTable error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/analytics/dashboard ──────────────────────────────
// Dashboard monthly analytics: leads/imports per month + summary cards
const dashboardAnalytics = async (req, res) => {
  try {
    const ImportHistory = require('../../models/ImportHistory');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 30 days inclusive

    // Role-based data isolation
    const matchLead = {};
    const matchImport = {};
    if (!isAdminRole(req.user.role)) {
      matchLead.added_by = new mongoose.Types.ObjectId(req.user.id);
      matchImport.uploaded_by = new mongoose.Types.ObjectId(req.user.id);
    }

    const [totalLeads, totalImports, leadsThisMonth, importsThisMonth, dailyLeads, dailyImports] = await Promise.all([
      Lead.countDocuments(matchLead),
      ImportHistory.countDocuments(matchImport),
      Lead.countDocuments({ ...matchLead, created_at: { $gte: startOfMonth } }),
      ImportHistory.countDocuments({ ...matchImport, created_at: { $gte: startOfMonth } }),
      Lead.aggregate([
        { $match: { ...matchLead, created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            count: { $sum: 1 }
          }
        },
        { $project: { _id: 0, date: '$_id', count: 1 } },
        { $sort: { date: 1 } }
      ]),
      ImportHistory.aggregate([
        { $match: { ...matchImport, created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            count: { $sum: 1 }
          }
        },
        { $project: { _id: 0, date: '$_id', count: 1 } },
        { $sort: { date: 1 } }
      ])
    ]);

    // Fill missing days with zeros for past 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
    }

    const leadsMap = Object.fromEntries(dailyLeads.map(m => [m.date, m.count]));
    const importsMap = Object.fromEntries(dailyImports.map(m => [m.date, m.count]));

    const monthlyLeadsData = days.map(d => ({
      date: d,
      label: new Date(d + 'T12:00:00Z').toLocaleDateString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      count: leadsMap[d] || 0
    }));

    const monthlyImportsData = days.map(d => ({
      date: d,
      label: new Date(d + 'T12:00:00Z').toLocaleDateString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      count: importsMap[d] || 0
    }));

    res.json({
      totalLeads,
      totalImports,
      leadsThisMonth,
      importsThisMonth,
      monthlyLeads: monthlyLeadsData,
      monthlyImports: monthlyImportsData,
    });
  } catch (err) {
    logger.error('[Analytics] dashboardAnalytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { globalInsights, keywordDashboard, keywordLeads, keywordExport, performanceTable, dashboardAnalytics };

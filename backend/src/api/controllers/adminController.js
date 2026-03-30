const mongoose = require('mongoose');
const User = require('../../models/User');
const Lead = require('../../models/Lead');
const ImportHistory = require('../../models/ImportHistory');
const ScrapedData = require('../../models/ScrapedData');
const logger = require('../../config/logger');

// ── GET /api/admin/employees ──────────────────────────────────
// Returns all employees with totalLeads, totalImports, totalKeywords
const listEmployees = async (req, res) => {
  try {
    const users = await User.find()
      .select('name email role is_active created_at last_login')
      .sort({ created_at: -1 })
      .lean();

    const userIds = users.map(u => u._id);

    // Aggregate leads per user
    const [leadCounts, importCounts, keywordCounts] = await Promise.all([
      Lead.aggregate([
        { $match: { added_by: { $in: userIds } } },
        { $group: { _id: '$added_by', count: { $sum: 1 } } }
      ]),
      ImportHistory.aggregate([
        { $match: { uploaded_by: { $in: userIds } } },
        { $group: { _id: '$uploaded_by', count: { $sum: 1 } } }
      ]),
      Lead.aggregate([
        { $match: { added_by: { $in: userIds }, keyword: { $nin: [null, ''] } } },
        { $group: { _id: { user: '$added_by', keyword: { $toLower: { $trim: { input: '$keyword' } } } } } },
        { $group: { _id: '$_id.user', count: { $sum: 1 } } }
      ])
    ]);

    const leadMap = Object.fromEntries(leadCounts.map(l => [l._id.toString(), l.count]));
    const importMap = Object.fromEntries(importCounts.map(i => [i._id.toString(), i.count]));
    const kwMap = Object.fromEntries(keywordCounts.map(k => [k._id.toString(), k.count]));

    const employees = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
      last_login: u.last_login,
      totalLeads: leadMap[u._id.toString()] || 0,
      totalImports: importMap[u._id.toString()] || 0,
      totalKeywords: kwMap[u._id.toString()] || 0,
    }));

    res.json({ employees });
  } catch (err) {
    logger.error('[Admin] listEmployees error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/admin/employee/:id ───────────────────────────────
// Returns single employee profile + aggregate stats
const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    const uid = new mongoose.Types.ObjectId(id);

    const user = await User.findById(uid)
      .select('name email role is_active created_at last_login')
      .lean();
    if (!user) return res.status(404).json({ error: 'Employee not found' });

    const [totalLeads, totalImports, keywordStats] = await Promise.all([
      Lead.countDocuments({ added_by: uid }),
      ImportHistory.countDocuments({ uploaded_by: uid }),
      Lead.aggregate([
        { $match: { added_by: uid, keyword: { $nin: [null, ''] } } },
        { $group: { _id: { $toLower: { $trim: { input: '$keyword' } } }, count: { $sum: 1 } } },
        { $project: { _id: 0, keyword: '$_id', count: 1 } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      employee: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login: user.last_login,
      },
      stats: {
        totalLeads,
        totalImports,
        totalKeywords: keywordStats.length,
      },
      keywordStats,
    });
  } catch (err) {
    logger.error('[Admin] getEmployee error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/admin/employee/:id/leads ─────────────────────────
// Returns paginated leads added by the employee with optional date filter
const getEmployeeLeads = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    const uid = new mongoose.Types.ObjectId(id);

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { added_by: uid };
    if (req.query.startDate) {
      filter.created_at = { ...filter.created_at, $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.created_at = { ...filter.created_at, $lte: end };
    }

    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select('first_name last_name email company keyword created_at')
        .lean()
    ]);

    const data = leads.map(l => ({
      id: l._id.toString(),
      keyword: l.keyword || '',
      leadName: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
      email: l.email || '',
      company: l.company || '',
      dateAdded: l.created_at,
    }));

    res.json({ data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error('[Admin] getEmployeeLeads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── GET /api/admin/employee/:id/imports ────────────────────────
// Returns paginated import history for the employee with optional date filter
const getEmployeeImports = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    const uid = new mongoose.Types.ObjectId(id);

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { uploaded_by: uid };
    if (req.query.startDate) {
      filter.created_at = { ...filter.created_at, $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.created_at = { ...filter.created_at, $lte: end };
    }

    const [total, imports] = await Promise.all([
      ImportHistory.countDocuments(filter),
      ImportHistory.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const data = imports.map(i => ({
      id: i._id.toString(),
      keyword: i.file_name || '',
      source: i.source || 'Manual',
      totalRows: i.total_rows || 0,
      validRows: i.valid_rows || 0,
      date: i.created_at,
    }));

    res.json({ data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error('[Admin] getEmployeeImports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { listEmployees, getEmployee, getEmployeeLeads, getEmployeeImports };

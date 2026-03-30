const router = require('express').Router();
const { authenticate, requireSuperAdmin, requireAdmin, requireManager, requireMarketing, requireSales, requireViewer } = require('../../middleware/auth');
const { loginValidator, createUserValidator, objectIdValidator, createLeadValidator, bulkDeleteValidator, createJobValidator } = require('../../middleware/validators');
const auth = require('../controllers/authController');
const lead = require('../controllers/leadController');
const scrape = require('../controllers/scrapeController');
const importHistory = require('../controllers/importController');

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/login', [...loginValidator], auth.login);
router.post('/auth/logout', authenticate, auth.logout);
router.get('/auth/me', authenticate, auth.me);
router.get('/auth/users', authenticate, requireAdmin, auth.listUsers);
router.post('/auth/users', authenticate, requireAdmin, [...createUserValidator], auth.createUser);
router.patch('/auth/users/:id', authenticate, requireAdmin, ...objectIdValidator('id'), auth.updateUser);
router.delete('/auth/users/:id', authenticate, requireAdmin, ...objectIdValidator('id'), auth.deleteUser);

// ── Leads ─────────────────────────────────────────────────────
router.get('/leads/stats', authenticate, requireViewer, lead.stats);
router.get('/leads/search', authenticate, requireViewer, lead.search);
router.get('/leads/filter-options', authenticate, requireViewer, lead.filterOptions);
router.get('/leads/activity', authenticate, requireViewer, lead.activityLog);
router.get('/leads/exports/:id/download', authenticate, requireManager, lead.downloadExport);
router.get('/leads/exports/:id', authenticate, requireManager, lead.exportStatus);
router.post('/leads/export', authenticate, requireManager, lead.exportLeads);
router.post('/leads/import', authenticate, requireViewer, lead.importLeads, lead.processImport);
router.post('/leads/bulk-delete', authenticate, requireManager, [...bulkDeleteValidator], lead.bulkDelete);
router.get('/leads', authenticate, requireViewer, lead.list);
router.post('/leads', authenticate, requireViewer, [...createLeadValidator], lead.create);
router.get('/leads/:id', authenticate, requireViewer, ...objectIdValidator('id'), lead.getOne);
router.put('/leads/:id', authenticate, requireManager, ...objectIdValidator('id'), lead.update);
router.delete('/leads/:id', authenticate, requireManager, ...objectIdValidator('id'), lead.remove);
router.post('/leads/:id/enrich', authenticate, requireManager, ...objectIdValidator('id'), lead.triggerEnrich);

// ── Scrape ────────────────────────────────────────────────────
const scraperData = require('../controllers/scraperDataController');
router.get('/scrape/data', authenticate, requireViewer, scraperData.list);
router.delete('/scrape/data/all', authenticate, requireSuperAdmin, scraperData.deleteAll);
router.post('/scrape/data/export', authenticate, requireManager, scraperData.exportData);
router.post('/scrape/data/convert', authenticate, requireViewer, scraperData.convert);
router.get('/staging/export', authenticate, requireManager, scraperData.directExport);
router.put('/staging/:id', authenticate, requireManager, scraperData.updateRecord);
router.delete('/staging/:id', authenticate, requireManager, scraperData.deleteRecord);

router.get('/scrape', authenticate, requireManager, scrape.listJobs);
router.post('/scrape', authenticate, requireManager, [...createJobValidator], scrape.createJob);
router.get('/scrape/:id', authenticate, requireManager, ...objectIdValidator('id'), scrape.getJob);
router.delete('/scrape/:id', authenticate, requireManager, ...objectIdValidator('id'), scrape.cancelJob);

// ── Imports ───────────────────────────────────────────────────
router.get('/imports', authenticate, requireViewer, importHistory.getImportHistory);

// ── Analytics ─────────────────────────────────────────────────
const analytics = require('../controllers/analyticsController');
router.get('/analytics/global', authenticate, requireViewer, analytics.globalInsights);
router.get('/analytics/dashboard', authenticate, requireViewer, analytics.dashboardAnalytics);
router.get('/analytics/performance', authenticate, requireViewer, analytics.performanceTable);
router.get('/analytics/keywords', authenticate, requireManager, analytics.keywordDashboard);
router.get('/analytics/keywords/:keyword/leads', authenticate, requireManager, analytics.keywordLeads);
router.post('/analytics/keywords/:keyword/export', authenticate, requireManager, analytics.keywordExport);

// ── Admin Employee Analytics ──────────────────────────────────
const admin = require('../controllers/adminController');
router.get('/admin/employees', authenticate, requireManager, admin.listEmployees);
router.get('/admin/employee/:id', authenticate, requireManager, admin.getEmployee);
router.get('/admin/employee/:id/leads', authenticate, requireManager, admin.getEmployeeLeads);
router.get('/admin/employee/:id/imports', authenticate, requireManager, admin.getEmployeeImports);

// ── Health ────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

module.exports = router;

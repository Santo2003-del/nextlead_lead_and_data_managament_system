/**
 * ── NexLead API Route Definitions ───────────────────────────────
 * 
 * Central route registry for all API endpoints.
 * 
 * Route groups:
 *   /api/auth/*        — Authentication (login, logout, user management)
 *   /api/leads/*       — Lead CRUD, import, export, search, activity
 *   /api/scrape/*      — Web scraping jobs and scraped data management
 *   /api/imports       — Import history
 *   /api/analytics/*   — Dashboard analytics, keyword intelligence
 *   /api/admin/*       — Employee management and analytics
 *   /api/health        — System health check (DB, ES, memory, uptime)
 * 
 * Access control uses role-based middleware:
 *   requireSuperAdmin > requireAdmin > requireManager > requireMarketing > requireStaff
 */

const router = require('express').Router();
const { authenticate, requireSuperAdmin, requireAdmin, requireManager, requireMarketing, requireSales, requireViewer } = require('../../middleware/auth');
const { loginValidator, createUserValidator, objectIdValidator, createLeadValidator, bulkDeleteValidator, createJobValidator } = require('../../middleware/validators');
const auth = require('../controllers/authController');
const lead = require('../controllers/leadController');
const scrape = require('../controllers/scrapeController');
const importHistory = require('../controllers/importController');

// ── Auth Routes ──────────────────────────────────────────────
// Public: login. Protected: logout, me, user CRUD (admin only)
router.post('/auth/login', [...loginValidator], auth.login);
router.post('/auth/logout', authenticate, auth.logout);
router.get('/auth/me', authenticate, auth.me);
router.get('/auth/users', authenticate, requireAdmin, auth.listUsers);
router.post('/auth/users', authenticate, requireAdmin, [...createUserValidator], auth.createUser);
router.patch('/auth/users/:id', authenticate, requireAdmin, ...objectIdValidator('id'), auth.updateUser);
router.delete('/auth/users/:id', authenticate, requireAdmin, ...objectIdValidator('id'), auth.deleteUser);

// ── Lead Routes ──────────────────────────────────────────────
// CRUD operations, search, import/export, enrichment, activity log
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

// ── Scrape Routes ────────────────────────────────────────────
// Scraped data listing, export, conversion to leads, inline edit/delete
const scraperData = require('../controllers/scraperDataController');
router.get('/scrape/data', authenticate, requireViewer, scraperData.list);
router.delete('/scrape/data/all', authenticate, requireSuperAdmin, scraperData.deleteAll);
router.post('/scrape/data/export', authenticate, requireManager, scraperData.exportData);
router.post('/scrape/data/convert', authenticate, requireViewer, scraperData.convert);
router.get('/staging/export', authenticate, requireManager, scraperData.directExport);
router.put('/staging/:id', authenticate, requireManager, scraperData.updateRecord);
router.delete('/staging/:id', authenticate, requireManager, scraperData.deleteRecord);

// Scrape job management
router.get('/scrape', authenticate, requireManager, scrape.listJobs);
router.post('/scrape', authenticate, requireManager, [...createJobValidator], scrape.createJob);
router.get('/scrape/:id', authenticate, requireManager, ...objectIdValidator('id'), scrape.getJob);
router.delete('/scrape/:id', authenticate, requireManager, ...objectIdValidator('id'), scrape.cancelJob);

// ── Import History Routes ────────────────────────────────────
router.get('/imports', authenticate, requireViewer, importHistory.getImportHistory);

// ── Analytics Routes ─────────────────────────────────────────
// Global insights, dashboard metrics, performance table, keyword intelligence
const analytics = require('../controllers/analyticsController');
router.get('/analytics/global', authenticate, requireViewer, analytics.globalInsights);
router.get('/analytics/dashboard', authenticate, requireViewer, analytics.dashboardAnalytics);
router.get('/analytics/performance', authenticate, requireViewer, analytics.performanceTable);
router.get('/analytics/keywords', authenticate, requireManager, analytics.keywordDashboard);
router.get('/analytics/keywords/:keyword/leads', authenticate, requireManager, analytics.keywordLeads);
router.post('/analytics/keywords/:keyword/export', authenticate, requireManager, analytics.keywordExport);
router.delete('/analytics/keywords/:keyword', authenticate, requireManager, analytics.deleteKeyword);

// ── Admin Employee Analytics ─────────────────────────────────
// Manager+ only — employee performance tracking
const admin = require('../controllers/adminController');
router.get('/admin/employees', authenticate, requireManager, admin.listEmployees);
router.get('/admin/employee/:id', authenticate, requireManager, admin.getEmployee);
router.get('/admin/employee/:id/leads', authenticate, requireManager, admin.getEmployeeLeads);
router.get('/admin/employee/:id/imports', authenticate, requireManager, admin.getEmployeeImports);

// ── Health Check ─────────────────────────────────────────────
// Unauthenticated — used by load balancers, PM2, and monitoring tools
// Returns: DB status, ES status, memory usage, uptime, version
router.get('/health', async (req, res) => {
  const { getDBHealth } = require('../../config/db');
  const { getESHealth } = require('../../config/elasticsearch');

  const memoryUsage = process.memoryUsage();

  const [dbHealth, esHealth] = await Promise.all([
    Promise.resolve(getDBHealth()),
    getESHealth().catch(() => ({ available: false, status: 'error' })),
  ]);

  const isHealthy = dbHealth.status === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '2.0.0',
    node: process.version,
    environment: process.env.NODE_ENV || 'development',

    // ── Database Health ────────────────────────────────────
    database: dbHealth,

    // ── Elasticsearch Health ───────────────────────────────
    elasticsearch: esHealth,

    // ── Memory Usage (MB) ──────────────────────────────────
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    },
  });
});

module.exports = router;

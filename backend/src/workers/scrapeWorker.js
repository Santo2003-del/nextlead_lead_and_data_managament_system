require('dotenv').config();
const { queues } = require('../config/redis');
const connectDB = require('../config/db').connectDB;
const ScrapeJob = require('../models/ScrapeJob');
const Lead = require('../models/Lead');
const logger = require('../config/logger');

// Connect to MongoDB
connectDB();

logger.info('[ScrapeWorker] Starting...');

// ── Playwright scraper helper ─────────────────────────────────
async function scrapeGoogleMaps({ searchQuery, location, maxResults = 20 }) {
  let playwright, browser;
  const results = [];

  try {
    playwright = require('playwright');
    browser = await playwright.chromium.launch({
      headless: process.env.SCRAPE_HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    const url = `https://www.google.com/maps/search/${encodeURIComponent(`${searchQuery} ${location}`)}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Scroll to load more results
    const resultsPanel = page.locator('[role="feed"]');
    for (let s = 0; s < 5 && results.length < maxResults; s++) {
      await resultsPanel.evaluate(el => el.scrollBy(0, 800)).catch(() => { });
      await page.waitForTimeout(1500);
    }

    const listings = await page.locator('[data-result-index]').all();

    for (const listing of listings.slice(0, maxResults)) {
      try {
        await listing.click();
        await page.waitForTimeout(1200);

        const name = await page.locator('h1.DUwDvf').textContent({ timeout: 3000 }).catch(() => '');
        const address = await page.locator('.Io6YTe').first().textContent({ timeout: 2000 }).catch(() => '');
        const phone = await page.locator('[data-tooltip="Copy phone number"]')
          .textContent({ timeout: 2000 }).catch(() => '');
        const website = await page.locator('[data-item-id="authority"]')
          .getAttribute('href', { timeout: 2000 }).catch(() => '');
        const category = await page.locator('.DkEaL').textContent({ timeout: 2000 }).catch(() => '');

        if (name) {
          results.push({
            company: name.trim(),
            phone: phone.trim(),
            website: website,
            domain: website ? new URL(website).hostname.replace('www.', '') : null,
            industry: category.trim(),
            country: location,
            source: 'google_maps',
          });
        }
      } catch (e) {
        logger.debug('[Scrape] Listing parse error:', e.message);
      }
    }
  } catch (err) {
    logger.error('[Scrape] Google Maps error:', err.message);
  } finally {
    if (browser) await browser.close().catch(() => { });
  }

  return results;
}

// ── Generic URL scraper ───────────────────────────────────────
async function scrapeUrl({ url, selectors }) {
  let playwright, browser;
  const results = [];

  try {
    playwright = require('playwright');
    browser = await playwright.chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Extract structured data if available
    const ldJson = await page.evaluate(() => {
      const el = document.querySelector('script[type="application/ld+json"]');
      try { return el ? JSON.parse(el.textContent) : null; } catch { return null; }
    });

    if (ldJson?.name) {
      results.push({
        company: ldJson.name,
        website: ldJson.url || url,
        domain: ldJson.url ? new URL(ldJson.url).hostname.replace('www.', '') : null,
        phone: ldJson.telephone,
        country: ldJson.address?.addressCountry,
        company_desc: ldJson.description,
        source: 'web_scrape',
      });
    }
  } catch (err) {
    logger.error('[Scrape] URL error:', err.message);
  } finally {
    if (browser) await browser.close().catch(() => { });
  }
  return results;
}

// ── Worker ────────────────────────────────────────────────────
queues.scrape.process(parseInt(process.env.SCRAPE_CONCURRENCY || '2'), async (job) => {
  const { jobId } = job.data;

  const scrapeJob = await ScrapeJob.findById(jobId);
  if (!scrapeJob) return;

  await ScrapeJob.findByIdAndUpdate(jobId, { $set: { status: 'running', started_at: new Date() } });

  try {
    let leads = [];
    const config = scrapeJob.config;

    if (scrapeJob.source === 'google_maps') {
      leads = await scrapeGoogleMaps({
        searchQuery: config.query,
        location: config.location,
        maxResults: config.max_results || 20,
      });
    } else if (scrapeJob.source === 'custom_url') {
      leads = await scrapeUrl({ url: config.url });
    }

    // Save to DB
    let saved = 0;
    for (const lead of leads) {
      try {
        const filter = lead.domain ? { domain: lead.domain.toLowerCase() } : { company: lead.company, source: lead.source };
        const result = await Lead.updateOne(
          filter,
          {
            $setOnInsert: {
              ...lead,
              domain: lead.domain?.toLowerCase(),
              added_by: scrapeJob.created_by
            }
          },
          { upsert: true }
        );
        if (result.upsertedCount > 0) saved++;
      } catch (err) {
        logger.debug(`[Scrape] Lead save error: ${err.message}`);
      }
    }

    await ScrapeJob.findByIdAndUpdate(jobId, {
      $set: {
        status: 'completed',
        total_found: leads.length,
        total_saved: saved,
        progress: 100,
        finished_at: new Date()
      }
    });

    logger.info(`[Scrape] Job ${jobId} done: found=${leads.length} saved=${saved}`);
    return { found: leads.length, saved };
  } catch (err) {
    logger.error(`[Scrape] Processing error ${jobId}:`, err.message);
    await ScrapeJob.findByIdAndUpdate(jobId, {
      $set: { status: 'failed', error_msg: err.message, finished_at: new Date() }
    }).catch(() => { });
    throw err;
  }
});

queues.scrape.on('failed', (job, err) => {
  logger.error(`[Scrape] Job failed:`, err.message);
});

process.on('SIGTERM', async () => {
  await queues.scrape.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

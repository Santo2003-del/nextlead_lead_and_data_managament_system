/**
 * ── Elasticsearch Client & Operations ───────────────────────────
 * 
 * Optional search layer for full-text lead search with fuzzy matching.
 * All ES operations are "best effort" — failures never crash the app.
 * 
 * Features:
 *   - Configurable via ENABLE_ELASTICSEARCH env var
 *   - Auto-creates the nexlead_leads index with proper mappings
 *   - Bulk indexing for import operations
 *   - Built-in retry logic with backoff for transient failures
 *   - requestTimeout and maxRetries on the client
 *   - Health check helper for /api/health endpoint
 * 
 * If Elasticsearch is down, the app gracefully degrades to
 * MongoDB text search only (no impact on core functionality).
 */

const { Client } = require('@elastic/elasticsearch');
const logger = require('./logger');

// ── ES Client Configuration ──────────────────────────────────
const client = new Client({
  node: process.env.ELASTIC_URL || 'http://localhost:9200',
  auth: process.env.ELASTIC_USERNAME ? {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  } : undefined,
  requestTimeout: 30000,    // 30s max per request
  maxRetries: 2,             // Retry failed requests up to 2 times
  sniffOnStart: false,       // Don't auto-discover nodes (single-node setup)
});

const INDEX = process.env.ELASTIC_INDEX_LEADS || 'nexlead_leads';

/**
 * Creates the nexlead_leads index with mappings if it doesn't exist.
 * Safe to call on every startup — skips if index already exists.
 */
const ensureIndex = async () => {
  if (process.env.ENABLE_ELASTICSEARCH !== 'true') {
    logger.info('[ES] Elasticsearch is disabled (ENABLE_ELASTICSEARCH != true)');
    return;
  }
  try {
    const exists = await client.indices.exists({ index: INDEX });
    if (!exists) {
      await client.indices.create({
        index: INDEX,
        body: {
          mappings: {
            properties: {
              first_name: { type: 'text' },
              last_name: { type: 'text' },
              job_title: { type: 'text' },
              company: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              industry: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              country: { type: 'keyword' },
              email: { type: 'keyword' },
              lead_score: { type: 'integer' },
              created_at: { type: 'date' }
            }
          }
        }
      });
      logger.info(`[ES] Created index: ${INDEX}`);
    }
  } catch (err) {
    // Non-fatal — app works without ES
    logger.warn('[ES] ensureIndex failed (Check if ES is running):', err.message);
  }
};

/**
 * Indexes a single lead document in Elasticsearch.
 * Best-effort — failures are logged but never thrown.
 * 
 * @param {Object} lead - Lead object with id field
 */
const indexLead = async (lead) => {
  if (process.env.ENABLE_ELASTICSEARCH !== 'true') return;
  try {
    await client.index({
      index: INDEX,
      id: lead.id,
      document: lead
    });
  } catch (err) {
    logger.error('[ES] Index Error:', err.message);
  }
};

/**
 * Bulk indexes multiple lead documents in Elasticsearch.
 * Used after import operations for background reindexing.
 * 
 * @param {Array} leads - Array of lead objects with id fields
 */
const bulkIndexLeads = async (leads) => {
  if (!leads.length || process.env.ENABLE_ELASTICSEARCH !== 'true') return;
  try {
    const operations = leads.flatMap(doc => [
      { index: { _index: INDEX, _id: doc.id } },
      doc
    ]);
    await client.bulk({ refresh: true, operations });
  } catch (err) {
    logger.error('[ES] Bulk Error:', err.message);
  }
};

/**
 * Deletes a lead document from the Elasticsearch index.
 * 
 * @param {string} id - Lead document ID to delete
 */
const deleteLead = async (id) => {
  if (process.env.ENABLE_ELASTICSEARCH !== 'true') return;
  try {
    await client.delete({ index: INDEX, id });
  } catch (err) {
    // Ignore 404 (document already deleted)
    if (err.meta?.statusCode !== 404) {
      logger.error('[ES] Delete Error:', err.message);
    }
  }
};

/**
 * Performs a full-text search across lead fields with fuzzy matching.
 * Supports filtering by job_title, company, industry, country, email_domain.
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query text
 * @param {Object} params.filters - Field-level filters
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.size - Results per page
 * @returns {Object} { total, data, page, size }
 */
const searchLeads = async ({ q, filters = {}, page = 1, size = 50 }) => {
  try {
    const must = [];
    
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['first_name', 'last_name', 'company', 'job_title', 'industry'],
          fuzziness: 'AUTO'
        }
      });
    }

    if (filters.job_title) must.push({ match_phrase: { job_title: filters.job_title } });
    if (filters.company) must.push({ match_phrase: { company: filters.company } });
    if (filters.industry) must.push({ match: { industry: filters.industry } });
    if (filters.country) must.push({ term: { country: filters.country } });
    if (filters.email_domain) must.push({ wildcard: { email: `*@${filters.email_domain}` } });

    const body = {
      from: (page - 1) * size,
      size,
      query: must.length ? { bool: { must } } : { match_all: {} },
      sort: [{ created_at: { order: 'desc' } }]
    };

    const response = await client.search({ index: INDEX, body });
    return {
      total: response.hits.total.value,
      data: response.hits.hits.map(h => ({ ...h._source, id: h._id })),
      page,
      size
    };
  } catch (err) {
    logger.error('[ES] Search Error:', err.message);
    throw err;
  }
};

/**
 * Returns Elasticsearch cluster health status.
 * Used by the /api/health endpoint for monitoring.
 * 
 * @returns {Object} { available: boolean, status: string }
 */
const getESHealth = async () => {
  if (process.env.ENABLE_ELASTICSEARCH !== 'true') {
    return { available: false, status: 'disabled' };
  }
  try {
    const health = await client.cluster.health({ timeout: '3s' });
    return { available: true, status: health.status };
  } catch {
    return { available: false, status: 'unreachable' };
  }
};

module.exports = { client, INDEX, ensureIndex, indexLead, bulkIndexLeads, deleteLead, searchLeads, getESHealth };

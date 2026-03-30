const { Client } = require('@elastic/elasticsearch');
const logger = require('./logger');

const client = new Client({
  node: process.env.ELASTIC_URL || 'http://localhost:9200',
  auth: process.env.ELASTIC_USERNAME ? {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  } : undefined
});

const INDEX = process.env.ELASTIC_INDEX_LEADS || 'nexlead_leads';

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
    logger.warn('[ES] ensureIndex failed (Check if ES is running):', err.message);
  }
};

const indexLead = async (lead) => {
  try {
    await client.index({
      index: INDEX,
      id: lead.id,
      document: lead
    });
  } catch (err) { logger.error('[ES] Index Error:', err.message); }
};

const bulkIndexLeads = async (leads) => {
  if (!leads.length) return;
  try {
    const operations = leads.flatMap(doc => [
      { index: { _index: INDEX, _id: doc.id } },
      doc
    ]);
    await client.bulk({ refresh: true, operations });
  } catch (err) { logger.error('[ES] Bulk Error:', err.message); }
};

const deleteLead = async (id) => {
  try {
    await client.delete({ index: INDEX, id });
  } catch (err) { logger.error('[ES] Delete Error:', err.message); }
};

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

module.exports = { client, INDEX, ensureIndex, indexLead, bulkIndexLeads, deleteLead, searchLeads };

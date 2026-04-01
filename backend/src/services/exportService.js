/**
 * ── Export Service ─────────────────────────────────────────────
 * 
 * Generates CSV and XLSX export files from Lead or ScrapedData collections.
 * 
 * Features:
 *   - Supports both 'leads' and 'scraped_data' collections
 *   - Column selection (export only the columns the user chose)
 *   - Professional Excel styling (dark header, lead score highlighting)
 *   - Query timeout protection (maxTimeMS) for large datasets
 *   - Custom header name overrides (e.g., created_at → IMPORTED DATE)
 *
 * Files are written to EXPORT_DIR (default: ./exports/) and expire after 24h.
 */

const path = require('path');
const fs = require('fs');
const { format: csvFormat } = require('fast-csv');
const ExcelJS = require('exceljs');
const Lead = require('../models/Lead');
const { buildFilterClause } = require('./leadService');
const logger = require('../config/logger');

const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
fs.mkdirSync(EXPORT_DIR, { recursive: true });

const ScrapedData = require('../models/ScrapedData');
const scraperService = require('./scraperService');

const LEAD_COLUMNS = [
  'created_at', 'added_by_name', 'keyword', 'first_name', 'last_name', 'email', 'job_title', 'country', 'company', 'linkedin', 'industry', 'source', 'status'
];

const SCRAPER_COLUMNS = [
  'created_at', 'uploadedByName', 'keyword', 'first_name', 'last_name', 'email', 'job_title', 'country', 'company_name', 'linkedin', 'industry', 'source', 'status'
];

const HEADER_OVERRIDES = {
  'created_at': 'IMPORTED DATE',
  'added_by_name': 'IMPORTED BY',
  'uploadedByName': 'IMPORTED BY'
};

/**
 * Fetches data for export from the appropriate collection.
 * Applies filters, sorting, and column selection.
 * Uses maxTimeMS(60000) to prevent queries from hanging on large datasets.
 * 
 * @param {Object} filters - Query filters (industry, country, date range, etc.)
 * @param {string} collection - 'leads' or 'scraped_data'
 * @returns {Object} { data: Array, cols: Array }
 */
const fetchForExport = async (filters, collection) => {
  const selected = filters.selected_columns;
  if (collection === 'scraped_data') {
    const query = scraperService.buildScrapedFilterClause(filters);
    const data = await ScrapedData.find(query).sort({ created_at: -1 }).maxTimeMS(60000).lean();
    let cols = SCRAPER_COLUMNS;
    if (selected && selected.length) cols = cols.filter(c => selected.includes(c));
    return { data: data.map(d => ({ ...d, id: d._id.toString() })), cols };
  } else {
    const mongoQuery = buildFilterClause(filters);
    const leads = await Lead.find(mongoQuery)
      .sort({ lead_score: -1, created_at: -1 })
      .maxTimeMS(60000)
      .populate('added_by', 'name')
      .lean();
    const data = leads.map(l => ({
      ...l,
      id: l._id.toString(),
      added_by_name: l.added_by ? l.added_by.name : null
    }));
    let cols = LEAD_COLUMNS;
    if (selected && selected.length) cols = cols.filter(c => selected.includes(c));
    return { data, cols };
  }
};

// ── CSV export ────────────────────────────────────────────────
const exportCSV = async (filters, exportId, collection = 'leads') => {
  const { data, cols } = await fetchForExport(filters, collection);
  const outPath = path.join(EXPORT_DIR, `${exportId}.csv`);

  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(outPath);
    const stream = csvFormat({ headers: cols.map(k => HEADER_OVERRIDES[k] || k.replace(/_/g, ' ').toUpperCase()) });
    stream.pipe(ws);
    data.forEach(l => {
      const row = {};
      cols.forEach(c => {
        let val = l[c];
        if (c === 'keywords' && Array.isArray(val)) val = val.join('|');
        const headerKey = HEADER_OVERRIDES[c] || c.replace(/_/g, ' ').toUpperCase();
        row[headerKey] = val;
      });
      stream.write(row);
    });
    stream.end();
    ws.on('finish', resolve);
    ws.on('error', reject);
  });

  return { path: outPath, count: data.length, size: fs.statSync(outPath).size };
};

// ── Excel export ──────────────────────────────────────────────
const exportExcel = async (filters, exportId, collection = 'leads') => {
  const { data, cols } = await fetchForExport(filters, collection);
  const outPath = path.join(EXPORT_DIR, `${exportId}.xlsx`);
  const wb = new ExcelJS.Workbook();
  const sheetName = collection === 'scraped_data' ? 'Scraped Data' : 'Leads';
  const ws = wb.addWorksheet(sheetName);

  ws.columns = cols.map(k => ({
    header: HEADER_OVERRIDES[k] || k.replace(/_/g, ' ').toUpperCase(),
    key: k,
    width: k === 'id' ? 25 : k === 'email' || k === 'linkedin' ? 30 : 18,
  }));

  // Style header row (Professional SaaS: Slate-900 bg)
  ws.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { 
      bottom: { style: 'medium', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF1E293B' } }
    };
  });
  ws.getRow(1).height = 25;

  data.forEach(l => {
    const row = {};
    cols.forEach(c => { row[c] = (c === 'keywords' && Array.isArray(l[c])) ? l[c].join('|') : l[c]; });
    ws.addRow(row);
  });

  // Style body rows
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: 'middle' };
    row.height = 22;
    
    // Lead Score cell highlighting (only for leads)
    if (collection === 'leads') {
      const scoreIdx = cols.indexOf('lead_score') + 1;
      if (scoreIdx > 0) {
        const scoreCell = row.getCell(scoreIdx);
        const scoreVal = scoreCell.value;
        if (scoreVal >= 80) {
          scoreCell.font = { color: { argb: 'FF15803D' }, bold: true };
          scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else if (scoreVal >= 50) {
          scoreCell.font = { color: { argb: 'FFB45309' }, bold: true };
          scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        }
      }
    }
  });

  await wb.xlsx.writeFile(outPath);
  return { path: outPath, count: data.length, size: fs.statSync(outPath).size };
};

module.exports = { exportCSV, exportExcel };

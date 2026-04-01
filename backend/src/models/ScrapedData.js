/**
 * ── ScrapedData Model (Data Staging) ─────────────────────────────
 * 
 * Staging area for imported lead data before conversion to CRM leads.
 * Records land here from CSV/XLSX import and from web scraping.
 * 
 * Flow: Import → ScrapedData (staging) → Convert → Lead (CRM)
 * 
 * Key fields:
 *   - email + keyword (compound unique) — prevents duplicate imports
 *   - rawData (Map) — stores the complete original row from import
 *   - status: raw → converted → exported
 *   - uploadedBy/uploadedByName — tracks who imported the data
 */

const mongoose = require('mongoose');

const scrapedDataSchema = new mongoose.Schema({
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String },
    company_name: { type: String },
    job_title: { type: String },
    country: { type: String },
    keyword: { type: String },
    keywordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Keyword' },
    contact_number: { type: String },
    company_phone: { type: String },
    linkedin: { type: String },
    industry: { type: String },
    company_website: { type: String },
    
    // Metadata for flexibility
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    rawData: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    
    source: { type: String, required: true },
    importedAt: { type: Date, default: Date.now },
    source_file: { type: String },
    
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedByName: { type: String },
    
    status: {
        type: String,
        default: 'raw',
        enum: ['raw', 'converted', 'exported']
    },
    
    created_at: { type: Date, default: Date.now },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: false, // Using custom created_at
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

// ── Single-field indexes ──────────────────────────────────────
scrapedDataSchema.index({ company_name: 'text', first_name: 'text', last_name: 'text', job_title: 'text' });
scrapedDataSchema.index({ email: 1, keyword: 1 }, { unique: true }); // Dedup key
scrapedDataSchema.index({ email: 1 });           // Email lookups
scrapedDataSchema.index({ country: 1 });          // Country filter
scrapedDataSchema.index({ keyword: 1 });          // Keyword filter
scrapedDataSchema.index({ status: 1 });           // Status filter
scrapedDataSchema.index({ created_at: -1 });      // Date sorting
scrapedDataSchema.index({ created_by: 1 });       // User-scoped queries

// ── Compound indexes for performance ──────────────────────────
scrapedDataSchema.index({ uploadedBy: 1, created_at: -1 });   // User's imports sorted by date
scrapedDataSchema.index({ keyword: 1, created_at: -1 });      // Keyword analytics drill-down
scrapedDataSchema.index({ created_by: 1, created_at: -1 });   // User-scoped date queries
module.exports = mongoose.model('ScrapedData', scrapedDataSchema);

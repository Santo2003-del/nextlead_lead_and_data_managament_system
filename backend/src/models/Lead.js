/**
 * ── Lead Model ───────────────────────────────────────────────────
 * 
 * Core data model for the NexLead CRM system.
 * Stores individual lead/contact records with full business context.
 * 
 * Key fields:
 *   - email (unique, sparse) — primary dedup key
 *   - keyword / keywordId — links to the Keyword collection for grouping
 *   - createdBy / added_by — tracks which user created the lead
 *   - lead_score (0-100) — hot/warm/cold classification
 *   - metadata (Map) — stores extra columns from imports
 * 
 * Indexes are optimized for:
 *   - Full-text search across company, name, job_title, industry
 *   - Paginated listing with date/score sorting
 *   - User-scoped queries (added_by + date)
 *   - Keyword-based filtering and analytics
 */

const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    first_name: { type: String },
    last_name: { type: String },
    job_title: { type: String },
    email: { type: String, sparse: true },
    phone: { type: String },
    linkedin: { type: String },

    company: { type: String, required: true },
    domain: { type: String },
    website: { type: String },
    industry: { type: String },
    country: { type: String },
    city: { type: String },
    employee_size: { type: String },
    revenue: { type: String },
    client_description: { type: String },

    keywords: { type: [String], default: [] },
    keyword: { type: String }, // Source keyword
    keywordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Keyword' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String },
    keywordCreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    keywordCreatedByName: { type: String },
    createdAt: { type: Date, default: Date.now },
    lead_score: { type: Number, default: 0, min: 0, max: 100 },
    score_reason: { type: String },
    is_enriched: { type: Boolean, default: false },

    notes: { type: String },
    source: { type: String, required: true },
    status: {
        type: String,
        default: 'new',
        enum: ['new', 'contacted', 'qualified', 'disqualified', 'converted']
    },
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

// Create text index to replace pg_trgm and tsvector
leadSchema.index({
    company: 'text',
    first_name: 'text',
    last_name: 'text',
    job_title: 'text',
    industry: 'text',
    keywords: 'text',
    notes: 'text',
    client_description: 'text'
}, {
    weights: {
        company: 10,
        first_name: 5,
        last_name: 5,
        job_title: 8,
        industry: 5,
        keywords: 10,
        notes: 2,
        client_description: 2
    }
});

// ── Single-field indexes ──────────────────────────────────────
// email index is auto-created by unique:true in schema definition (removed, using compound instead)
leadSchema.index({ email: 1, keyword: 1 }, { unique: true }); // Allow same email with different keywords
leadSchema.index({ email: 1 });               // Email lookups
leadSchema.index({ domain: 1 });              // Filter by domain
leadSchema.index({ company: 1 });             // Filter/sort by company name
leadSchema.index({ industry: 1 });            // Filter by industry
leadSchema.index({ country: 1 });             // Filter by country
leadSchema.index({ lead_score: -1 });         // Sort by score (hot leads first)
leadSchema.index({ status: 1 });              // Filter by pipeline stage
leadSchema.index({ added_by: 1 });            // User-scoped lead queries
leadSchema.index({ created_at: -1 });         // Date-sorted listings
leadSchema.index({ is_enriched: 1 });         // Filter enriched vs raw
leadSchema.index({ employee_size: 1 });       // Filter by company size
leadSchema.index({ 'keywords': 1 });          // Keyword array lookups
leadSchema.index({ keyword: 1 });             // Source keyword filter

// ── Compound indexes for common query patterns ────────────────
// These prevent full collection scans on paginated, filtered queries.
leadSchema.index({ added_by: 1, created_at: -1 });     // User's leads sorted by date (LeadsPage)
leadSchema.index({ createdBy: 1, created_at: -1 });    // Analytics performance table
leadSchema.index({ keyword: 1, created_at: -1 });      // Keyword Intelligence drill-down
leadSchema.index({ status: 1, created_at: -1 });       // Pipeline stage listing

module.exports = mongoose.model('Lead', leadSchema);

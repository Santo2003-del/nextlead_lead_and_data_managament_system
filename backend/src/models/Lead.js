const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    first_name: { type: String },
    last_name: { type: String },
    job_title: { type: String },
    email: { type: String, unique: true, sparse: true },
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
    company_desc: { type: String },

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
    company_desc: 'text'
}, {
    weights: {
        company: 10,
        first_name: 5,
        last_name: 5,
        job_title: 8,
        industry: 5,
        keywords: 10,
        notes: 2,
        company_desc: 2
    }
});

// leadSchema.index({ email: 1 }); // Removed as it is redundant with unique: true in schema

leadSchema.index({ domain: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ industry: 1 });
leadSchema.index({ country: 1 });
leadSchema.index({ lead_score: -1 });
leadSchema.index({ status: 1 });
leadSchema.index({ added_by: 1 });
leadSchema.index({ created_at: -1 });
leadSchema.index({ is_enriched: 1 });
leadSchema.index({ employee_size: 1 });
leadSchema.index({ 'keywords': 1 }); // Replaces GIN index
leadSchema.index({ keyword: 1 });

module.exports = mongoose.model('Lead', leadSchema);

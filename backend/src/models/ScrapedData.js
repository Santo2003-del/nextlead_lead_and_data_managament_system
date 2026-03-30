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

// Indexes for fast filtering
scrapedDataSchema.index({ company_name: 'text', first_name: 'text', last_name: 'text', job_title: 'text' });
scrapedDataSchema.index({ email: 1, keyword: 1 }, { unique: true });
scrapedDataSchema.index({ email: 1 });
scrapedDataSchema.index({ country: 1 });
scrapedDataSchema.index({ keyword: 1 });
scrapedDataSchema.index({ status: 1 });
scrapedDataSchema.index({ created_at: -1 });
scrapedDataSchema.index({ created_by: 1 });

module.exports = mongoose.model('ScrapedData', scrapedDataSchema);

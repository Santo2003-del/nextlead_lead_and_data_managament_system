const mongoose = require('mongoose');

const scrapeJobSchema = new mongoose.Schema({
    name: { type: String, required: true },
    source: { type: String, required: true },
    config: { type: Object, default: {} },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'running', 'completed', 'failed', 'cancelled']
    },
    progress: { type: Number, default: 0 },
    total_found: { type: Number, default: 0 },
    total_saved: { type: Number, default: 0 },
    error_msg: { type: String },
    scheduled_at: { type: Date },
    started_at: { type: Date },
    finished_at: { type: Date },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

// ── Single-field indexes ──────────────────────────────────────
scrapeJobSchema.index({ status: 1 });
scrapeJobSchema.index({ created_by: 1 });
scrapeJobSchema.index({ created_at: -1 });

// ── Compound indexes for common query patterns ────────────────
scrapeJobSchema.index({ created_by: 1, created_at: -1 });  // User's jobs sorted by date
scrapeJobSchema.index({ status: 1, created_at: -1 });      // Status-filtered date listing

module.exports = mongoose.model('ScrapeJob', scrapeJobSchema);

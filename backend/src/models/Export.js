const mongoose = require('mongoose');

const exportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    filters: { type: Object, default: {} },
    selected_columns: { type: [String], default: [] },
    format: {
        type: String,
        default: 'csv',
        enum: ['csv', 'xlsx']
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'processing', 'ready', 'failed']
    },
    row_count: { type: Number, default: 0 },
    file_path: { type: String },
    file_size: { type: Number },
    expires_at: { type: Date },
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

exportSchema.index({ created_by: 1 });
exportSchema.index({ status: 1 });
exportSchema.index({ created_at: -1 });

module.exports = mongoose.model('Export', exportSchema);

const mongoose = require('mongoose');

const importHistorySchema = new mongoose.Schema({
    file_name: { type: String, required: true },
    file_hash: { type: String, required: true },
    size: { type: Number },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, default: 'Manual' },
    imported_tab: { type: String, default: 'Unknown' },
    total_rows: { type: Number, default: 0 },
    valid_rows: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
}, {
    timestamps: false,
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

importHistorySchema.index({ uploaded_by: 1 });
importHistorySchema.index({ created_at: -1 });

module.exports = mongoose.model('ImportHistory', importHistorySchema);

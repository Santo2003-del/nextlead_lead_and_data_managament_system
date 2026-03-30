const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity_type: { type: String },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: Object, default: {} },
    ip_address: { type: String },
    user_agent: { type: String }
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

activityLogSchema.index({ user_id: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ entity_type: 1, entity_id: 1 });
activityLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

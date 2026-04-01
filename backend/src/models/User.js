const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: {
        type: String,
        required: true,
        default: 'employee',
        enum: ['super_admin', 'superadmin', 'admin', 'manager', 'marketing', 'employee']
    },
    avatar_url: { type: String },
    is_active: { type: Boolean, required: true, default: true },
    permissions: { type: Object, required: true, default: {} },
    last_login: { type: Date }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password_hash;
        }
    }
});

// ── Indexes ───────────────────────────────────────────────────
// email index is auto-created by unique:true in schema definition
userSchema.index({ role: 1 });                    // Team page role filtering
userSchema.index({ is_active: 1 });               // Active user filtering
userSchema.index({ created_at: -1 });             // Date-sorted user listing
userSchema.index({ role: 1, is_active: 1 });      // Combined role + active filter

module.exports = mongoose.model('User', userSchema);


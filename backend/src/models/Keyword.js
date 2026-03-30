const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
    name: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: false
});

keywordSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Keyword', keywordSchema);

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    action: String,
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    target_id: mongoose.Schema.Types.ObjectId,
    target_collection: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("log", logSchema);
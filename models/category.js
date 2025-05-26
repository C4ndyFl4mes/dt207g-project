const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        normal: {
            type: String,
            required: true,
            maxlength: 50
        },
        slug: {
            type: String,
            required: true,
            maxlength: 50
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("category", categorySchema);
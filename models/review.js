const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        required: true
    },
    message: {
        type: String,
        maxlength: 2000,
        required: true,
        default: ''
    },
    createdOn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("review", reviewSchema);
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        normal: {
            type: String,
            required: true,
            minlength: 2,
            maxlength: 100
        },
        slug: {
            type: String,
            required: true,
            minlength: 2,
            maxlength: 100
        }
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    inCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
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

module.exports = mongoose.model("product", productSchema);
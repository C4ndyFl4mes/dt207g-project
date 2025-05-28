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
        maxlength: 300
    },
    onSale: {
        type: Boolean,
        required: true,
        default: false
    },
    sale: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 3,
        default: "0%"
    },
    inCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
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

module.exports = mongoose.model("product", productSchema);
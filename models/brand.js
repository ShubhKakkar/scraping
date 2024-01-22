const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    brandId: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    }
}, {timestamps: true});

module.exports = mongoose.model('Brand', BrandSchema);

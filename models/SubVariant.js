const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    variantId: {
      type: mongoose.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    propertyId: {
      type: String,
    },
    vendorId: {
      type: mongoose.Types.ObjectId,
      ref: "Vendor",
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubVariant", schema);

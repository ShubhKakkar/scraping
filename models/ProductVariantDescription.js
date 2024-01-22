const mongoose = require("mongoose");

const ProductVariantDescriptionSchema = mongoose.Schema(
  {
    productVariantId: {
      type: mongoose.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    languageCode: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    slug: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ProductVariantDescription",
  ProductVariantDescriptionSchema
);

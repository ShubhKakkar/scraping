const mongoose = require('mongoose');

const ProductCategoryDescriptionSchema = mongoose.Schema(
  {
    productCategoryId: {
      type: mongoose.Types.ObjectId,
      ref: "ProductCategory",
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
    metaData: {
      title: {
        type: String,
        required: false,
      },
      description: { type: String, required: false },
      author: { type: String, required: false },
      keywords: { type: String, required: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ProductCategoryDescription",
  ProductCategoryDescriptionSchema
);

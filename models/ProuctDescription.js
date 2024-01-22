const mongoose = require("mongoose");

const ProductDescriptionSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
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
    shortDescription: {
      type: String,
    },
    longDescription: {
      type: String,
    },
    features: [
      {
        label: mongoose.Types.ObjectId,
        value: mongoose.Types.ObjectId,
      },
    ],
    faqs: [],
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

module.exports = mongoose.model("ProductDescription", ProductDescriptionSchema);

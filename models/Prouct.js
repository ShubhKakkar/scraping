const mongoose = require('mongoose');
const idCreator = require("../utils/idCreator");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    barCode: {
      type: String,
      required: true,
    },
    hsCode: {
      type: String,
      required: false,
    },
    customId: {
      type: String,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },
    buyingPrice: {
      type: Number,
    },
    buyingPriceCurrency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Currency",
    },
    sellingPrice: {
      type: Number,
      required: false,
    },
    featureTitle: {
      type: String,
    },
    height: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    width: {
      type: Number,
    },
    length: {
      type: Number,
    },
    dc: {
      type: String,
    },
    shippingCompany: {
      type: mongoose.Schema.Types.ObjectId,
    },
    alternateProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
        required: true,
      },
    ],
    media: [
      {
        src: { type: String, required: true },
        isImage: {
          type: Boolean,
          required: true,
          default: true,
        },
      },
    ],
    coverImage: {
      type: String,
    },
    variants: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
        },
      },
    ],
    variantId: {
      type: Number,
    },
    views: {
      type: Number,
      default: 0,
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      required: true,
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
    productId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

schema.pre("save", async function (next) {
  this.customId = await idCreator("product");
  next();
});

module.exports = mongoose.model("Product", schema);
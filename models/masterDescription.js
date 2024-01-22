const mongoose = require('mongoose');
const MasterDescriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: false,
    },
    mainPage: {
      type: mongoose.Types.ObjectId,
    },
    languageCode: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('masterDescription', MasterDescriptionSchema);
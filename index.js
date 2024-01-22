const express = require("express");
const app = express();
const mongoose = require("mongoose");
const seeding = require("./seeding/index.js");
const cors = require("cors");
require('dotenv').config();

app.use(cors());

(async function () {
  try {
    await mongoose.connect("mongodb://localhost:27017/noonmar");
    console.log("Successfully connected to db");
  } catch (err) {
    console.log(`Error connecting with db ${err}`);
  }
})();

// Seeding function calls
seeding.seedBrands(); // Working Perfectly
seeding.seedCategories(); // Working Perfectly
// seeding.seedUnits(); // manual
// seeding.seedProducts();
seeding.seedVariants();

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(3000, (req, res) => {
  console.log("Server listening at PORT 3000");
});

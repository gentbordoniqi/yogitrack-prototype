// models/packageModel.cjs
const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const packageSchema = new mongoose.Schema({
  packageId:  { type: String, unique: true, index: true, required: true },
  name:       { type: String, required: true, trim: true },
  category:   { type: String, enum: ["General", "Senior"], required: true },
  numClasses: { type: mongoose.Schema.Types.Mixed, required: true }, // 1|4|10|"unlimited"
  classType:  { type: String, enum: ["General", "Special"], required: true },
  startDate:  { type: String, required: true, trim: true },
  endDate:    { type: String, required: true, trim: true },
  price:      { type: Number, min: 0, required: true }
}, { collection: "Package" });

module.exports = mongoose.model("Package", packageSchema);

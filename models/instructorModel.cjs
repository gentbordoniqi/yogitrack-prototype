const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const instructorModel = new mongoose.Schema({
    instructorId: {type: String, unique: true, index: true},
    firstname: {type: String, required: true, trim: true},
    lastname: {type: String, required: true, trim: true},
    email: {type: String, required: true,  trim: true},
    phone: {type: String, required: true, trim: true},
    address: {type: String, trim: true},
    preferredContact: {type: String, enum: ["Phone", "Email"], trim: true}
}, {collection:"instructor"});

module.exports = mongoose.model("Instructor", instructorModel);
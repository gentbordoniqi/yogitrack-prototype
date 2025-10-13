const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const customerModel = new mongoose.Schema({
    customerId: {type: String, unique: true, index: true},
    firstname: {type: String, required: true, trim: true},
    lastname: {type: String, required: true, trim: true},
    email: {type: String, required: true,  trim: true},
    phone: {type: String, required: true, trim: true},
    address: {type: String, trim: true},
    preferredContact: {type: String, enum: ["Phone", "Email"], trim: true},
    classBalance: {type: Number, default: 0, min: 0}
}, {collection: "Customer"});

module.exports = mongoose.model("Customer", customerModel);
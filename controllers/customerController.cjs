const Customer = require("../models/customerModel.cjs");

/**
 * Generate next ID using your existing pattern: Y + 3 digits (Y001, Y002, ...)
 */
async function nextCustomerId() {
  const last = await Customer
    .findOne({ customerId: /^Y\d{3}$/ })
    .sort({ customerId: -1 })
    .select("customerId")
    .lean();

  const nextNum = last ? parseInt(last.customerId.slice(1), 10) + 1 : 1;
  return "Y" + String(nextNum).padStart(3, "0");
}

// Search by firstname (supports both firstname and firstName fields)
exports.search = async (req, res) => {
  try {
    const searchString = String(req.query.firstname || "").trim();
    if (!searchString) return res.status(400).json({ message: "firstname is required" });

    const matches = await Customer.find({
      $or: [
        { firstname:  { $regex: searchString, $options: "i" } },
        { firstName:  { $regex: searchString, $options: "i" } } // if older docs used this
      ]
    }).lean();

    if (!matches || matches.length === 0) {
      return res.status(404).json({ message: "No customer found" });
    }
    return res.json(matches[0]);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

// Get a single customer by id
exports.getCustomer = async (req, res) => {
  try {
    const customerId = req.query.customerId;
    if (!customerId) {
      return res.status(400).json({ error: "customerId is required." });
    }

    const customerDetail = await Customer.findOne({ customerId }).lean();
    if (!customerDetail) {
      return res.status(404).json({ error: "customer not found." });
    }

    return res.json(customerDetail);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

// Dropdown list (map firstName/lastName -> firstname/lastname when needed)
exports.getCustomerIds = async (req, res) => {
  try {
    const rows = await Customer.find(
      {},
      { customerId: 1, firstname: 1, lastname: 1, firstName: 1, lastName: 1, _id: 0 }
    ).sort({ customerId: 1 }).lean();

    const normalized = rows.map(d => ({
      customerId: d.customerId,
      firstname:  d.firstname ?? d.firstName ?? "",
      lastname:   d.lastname  ?? d.lastName  ?? ""
    }));

    return res.json(normalized);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

// Add
exports.add = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      address,
      preferredContact,
      classBalance
    } = req.body;

    // Basic validation
    if (!firstname || !lastname || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Duplicate name check (case-insensitive)
    const dupCustomer = await Customer.findOne({
      firstname: new RegExp(`^${firstname}$`, "i"),
      lastname:  new RegExp(`^${lastname}$`, "i")
    }).lean();

    if (dupCustomer && req.query.force !== "true") {
      return res.status(409).json({
        code: "DUPLICATE_NAME",
        message: "A customer with this name exists. If this is not a duplicate, retry with ?force=true.",
        existingId: dupCustomer.customerId
      });
    }

    // Generate ID that matches your DB (Y###)
    const newId = await nextCustomerId();

    // Normalize contact casing to match your model enum
    const normalizedPref =
      preferredContact === "Email" ? "Email" :
      preferredContact === "Phone" ? "Phone" :
      (String(preferredContact || "").toLowerCase() === "email" ? "Email" : "Phone");

    // Create & save
    const newCustomer = await Customer.create({
      customerId: newId,
      firstname,
      lastname,
      email,
      phone,
      address,
      preferredContact: normalizedPref,
      classBalance: Number(classBalance ?? 0) || 0
    });

    console.log(`Welcome to Yoga'Hom! ... Your customer id is ${newCustomer.customerId}.`);
    return res.status(201).json({ message: "Customer added successfully", customer: newCustomer });
  } catch (err) {
    console.error("Error adding customer:", err);
    return res.status(500).json({ message: "Failed to add Customer", error: err.message });
  }
};

// Next ID
exports.getNextId = async (req, res) => {
  try {
    const nextId = await nextCustomerId();
    return res.json({ nextId });
  } catch (e) {
    return res.status(500).json({ message: "Failed to generate next id" });
  }
};

// Delete
exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.query;
    if (!customerId) return res.status(400).json({ error: "customerId is required" });

    const result = await Customer.findOneAndDelete({ customerId });
    if (!result) return res.status(404).json({ error: "Customer not found" });

    return res.json({ message: "Customer deleted", customerId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

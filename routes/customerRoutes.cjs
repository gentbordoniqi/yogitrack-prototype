const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController.cjs");

// Mirror your instructor routes naming
router.get("/search",            customerController.search);
router.get("/getCustomer",       customerController.getCustomer);
router.get("/getCustomerIds",    customerController.getCustomerIds);
router.get("/getNextId",         customerController.getNextId);
router.post("/add",              customerController.add);
router.delete("/deleteCustomer", customerController.deleteCustomer);

module.exports = router;

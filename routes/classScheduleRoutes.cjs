

const express = require("express");
const router = express.Router();

// Ensure filename casing matches: classScheduleController.cjs
const classScheduleController = require("../controllers/ClassScheduleController.cjs");

// Conflicts check: GET /api/class-schedule/conflicts?day=YYYY-MM-DD&time=HH:mm
router.get("/conflicts", classScheduleController.conflicts);

// Create class: POST /api/class-schedule/add
router.post("/add", classScheduleController.add);

module.exports = router;

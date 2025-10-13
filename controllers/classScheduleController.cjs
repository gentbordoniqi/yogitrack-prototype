const ClassSchedule = require("../models/classScheduleModel.cjs");
const Instructor = require("../models/instructorModel.cjs");

// Generate the next business ID (CL00001, CL00002, ...)
async function nextClassId() {
  const last = await ClassSchedule
    .findOne({})
    .sort({ classId: -1 })
    .select("classId")
    .lean();

  const nextNum = last ? parseInt(String(last.classId).replace(/\D/g, "") || "0", 10) + 1 : 1;
  return "CL" + String(nextNum).padStart(5, "0");
}

// Suggest up to N alternative hourly times on the same day
async function suggestTimes(day, time, count = 3) {
  const out = [];
  const [hh, mm] = time.split(":").map(Number);
  let cursor = new Date(2020, 0, 1, hh, mm);

  for (let i = 0; i < 24 && out.length < count; i++) {
    cursor = new Date(cursor.getTime() + 60 * 60 * 1000); // +60 minutes
    const cand = `${String(cursor.getHours()).padStart(2,"0")}:${String(cursor.getMinutes()).padStart(2,"0")}`;
    const exists = await ClassSchedule.exists({ day, time: cand });
    if (!exists) out.push({ day, time: cand });
  }
  return out;
}

// GET /api/class-schedule/conflicts?day=YYYY-MM-DD&time=HH:mm
exports.conflicts = async (req, res) => {
  try {
    const { day, time } = req.query;
    if (!day || !time) return res.status(400).json({ message: "day and time are required" });

    const clash = await ClassSchedule.findOne({ day, time }).lean();
    const suggestions = clash ? await suggestTimes(day, time, 3) : [];
    return res.json({ conflict: !!clash, suggestions });
  } catch (err) {
    console.error("conflicts error:", err);
    return res.status(500).json({ message: "conflict check failed" });
  }
};

// POST /api/class-schedule/add
exports.add = async (req, res) => {
  try {
    const { instructorId, day, time, classType, payRate, confirm = false } = req.body;

    // Basic validation
    if (!instructorId || !day || !time || !classType || payRate == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!["General","Special"].includes(classType)) {
      return res.status(400).json({ message: "Class type must be 'General' or 'Special'" });
    }
    if (Number.isNaN(Number(payRate)) || Number(payRate) < 0) {
      return res.status(400).json({ message: "Pay rate must be a positive number" });
    }

    // Instructor must exist
    const inst = await Instructor.findOne({ instructorId }).lean();
    if (!inst) return res.status(400).json({ message: "Instructor was not found" });

    // Conflict check
    const conflict = await ClassSchedule.findOne({ day, time }).lean();
    if (conflict && !confirm) {
      const suggestions = await suggestTimes(day, time, 3);
      return res.status(409).json({
        code: "SCHEDULE_CONFLICT",
        message: "There is already a class at that time.",
        suggestions
      });
    }

    // Allocate ID and create
    const classId = await nextClassId();
    const doc = await ClassSchedule.create({
      classId, instructorId, day, time, classType, payRate: Number(payRate)
    });

    console.log(`✅ Class ${classId} published: ${classType} with ${instructorId} on ${day} ${time}`);
    return res.status(201).json({ message: "Class added", class: doc });
  } catch (e) {
    // Handle concurrent unique-index conflicts
    if (e?.code === 11000 && e?.keyPattern?.day && e?.keyPattern?.time) {
      const { day, time } = req.body;
      const suggestions = await suggestTimes(day, time, 3).catch(() => []);
      return res.status(409).json({
        code: "SCHEDULE_CONFLICT",
        message: "There is already a class at that time.",
        suggestions
      });
    }
    console.error("Error adding class:", e);
    return res.status(500).json({ message: "Failed to add class", error: e.message });
  }
};

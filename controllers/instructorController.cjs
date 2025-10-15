const Instructor = require("../models/instructorModel.cjs");


//Search for instructor"
exports.search = async (req, res) => {
  try {
    const searchString = req.query.firstname;
    const instructor = await Instructor.find({
      firstname: { $regex: searchString, $options: "i" },
    });

    if (!instructor || instructor.length == 0) {
      return res.status(404).json({ message: "No instructor found" });
    } else {
      res.json(instructor[0]);
    }
  } catch (e) {
    res.status(400).json({error: e.message});
  }
};


//Get Instructore 
//Find the package selected in the dropdown
exports.getInstructor = async (req, res) => {
  try {
    const instructorId = req.query.instructorId;
    //Instructor required
    if(!instructorId){
      return res.status(400).json({error : "instructor is required."})
    }

    const instructorDetail = await Instructor.findOne({ instructorId: instructorId });
    if(!instructorId){
      return res.status(400).json({error : "instructor is required."})
    }

   return  res.json(instructorDetail);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};


//Add instructors 
exports.add = async (req, res) => {
  try {
    const {
      //instructorId,
      firstname,
      lastname,
      email,
      phone,
      address,
      preferredContact
    } = req.body;

    // Basic validation
    if (!firstname || !lastname || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }
      //Duplicate instructor check 
     // duplicate instructor check (by name)
    const dupInstructor = await Instructor.findOne({ firstname, lastname }).lean();
    if (dupInstructor && req.query.force !== "true") {
      return res.status(409).json({
        code: "DUPLICATE_NAME",
        message: "An instructor with this name, if this is a not a duplicate, retry with ?force=true.",
        existingId: dupInstructor.instructorId
      });
    }

    // generate next business ID: I00001, I00002, ...
    const last = await Instructor.findOne({ instructorId: /^I\d{3}$/ })
      .sort({ instructorId: -1 })
      .select("instructorId")
      .lean();
    const nextNum = last ? parseInt(last.instructorId.slice(1), 10) + 1 : 1;
    instructorId = "I" + String(nextNum).padStart(3, "0");

    // create & save
    const newInstructor = await Instructor.create({
      instructorId,
      firstname,
      lastname,
      address,
      phone,
      email,
      preferredContact
    });

    console.log(`Welcome to Yoga'Hom! ... Your instructor id is ${newInstructor.instructorId}.`);
    return res.status(201).json({ message: "Instructor added successfully", instructor: newInstructor });
  } catch (err) {
    console.error("Error adding instructor:", err);
    return res.status(500).json({ message: "Failed to add instructor", error: err.message });
  }
};

//Set Dropdown
//Populate the instructorId dropdown
exports.getInstructorIds = async (req, res) => {
  try {
    const instructors = await Instructor.find(
      {},
      { instructorId: 1, firstname: 1, lastname: 1, _id: 0 }
    ).sort({instructorId: 1});

    res.json(instructors);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


//get next ID 
exports.getNextId = async (req, res) => {
  const lastInstructor = await Instructor.find({})
    .sort({ instructorId: -1 })
    .limit(1);

  let maxNumber = 1;
  if (lastInstructor.length > 0) {
    const lastId = lastInstructor[0].instructorId;
    const match = lastId.match(/\d+$/);
    if (match) {
      maxNumber = parseInt(match[0]) + 1;
    }
  }
  const nextId = `I${maxNumber}`;
  res.json({ nextId });
};

exports.deleteInstructor = async (req, res) => {
  try {
     const {instructorId} = req.query;
     const result = await Instructor.findOneAndDelete({ instructorId });
     if (!result) {
      return res.status(404).json({ error: "Instructor not found" });
    }
    res.json({ message: "Instructor deleted", instructorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const Package = require("../models/packageModel.cjs");

// Generate the next Package ID
async function nextPackageId() {
  const last = await Package
    .findOne({})
    .sort({ packageId: -1 })
    .select("packageId")
    .lean();

  const nextNum = last ? parseInt(String(last.packageId).replace(/\D/g, "") || "0", 10) + 1 : 1;
  return "PK" + String(nextNum).padStart(5, "0");
}

//get next ID 
exports.getNextId = async (req, res) => {
   try {
    const nextId = await nextPackageId();
    return res.json({ nextId });
  } catch (e) {
    console.error("getNextId error:", e);
    return res.status(500).json({ message: "Failed to generate next id" });
  }
};


// POST /api/class-schedule/add
exports.add = async (req, res) => {
  try {
    const { name,
            category, 
            numClasses, 
            classType, 
            startDate, 
            endDate, 
            price 
        } = req.body;

    // Basic validation
    if (!name || !category || !numClasses || !classType || !startDate ||
        !endDate || price == null)
    {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!["General","Senior"].includes(category)) {
      return res.status(400).json({ message: "category type must be 'General' or 'Senior'" });
    }
   
    //1,4,10. or unlimited classes 
    let count = numClasses; 
    if (typeof count == "string")
    {
        count = count.trim().toLowerCase() == "unlimited"
        ? "unlimited"
        : Number(count); //get number if not unlimited 
    }


    const clsAllowed = [1, 4, 10, "unlimited"];
    if(!clsAllowed.includes(count))
    {
        return res.status(400).json({ message: "number of classes must be 1,4,10 or unlimited "});
    }


    //date validation 
    if (startDate > endDate)
    {
        return res.status(400).json({ message: "start and end date must be supplied "});
    } 
    

    const packageId = await nextPackageId();

    const newPackage = await Package.create({
      packageId,
      name: name.trim(),
      category,
      numClasses: count,
      classType,
      startDate,
      endDate,
      price: Number(price) });

    console.log(`✅ Package ${newPackage.packageId} published: ${newPackage.name} `);
    return res.status(201).json({ message: "Package added", pkg: newPackage });

  } catch (e) {
    console.error("Error adding Package:", e);
    return res.status(500).json({ message: "Failed to add package", error: e.message });
  }
};

module.exports = { getNextId, add };
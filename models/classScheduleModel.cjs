const mongoose = require("mongoose");
require("../config/mongodbconn.cjs");

const classScheduleModel = new mongoose.Schema({
  //classID: {type: string, unique: true, index: true, required: true},
  instructorId: {type: String, required: true, index: true, required: true},
  day: {type: String, trim: true, required: true},
  time: {type: String, required: true, trim: true},
  classType: {type: String, enum: ["General", "Special"], required: true}, 
  payRate: {type: String, min: 0, required: true}  

}, {collection:"classes"});

//unique class - once a day 
//ClassScheduleSchema.Index({ day: 1, time: 1}, {unique: true}); 

module.exports = mongoose.model("classSchedule", classScheduleModel);
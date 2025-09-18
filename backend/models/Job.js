const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String },
  experience: { type: Number },
  description: { type: String, required: true },
  preferredSkills: [{ type: String }], // store as array
  education: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Job", JobSchema);

// const mongoose = require("mongoose");

// const ResumeSchema = new mongoose.Schema({
//   candidateName: { type: String, required: true },
//   jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
//   uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   resumeUrl: { type: String, required: true }, // store file path or URL
//   uploadedAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model("Resume", ResumeSchema);



const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  candidateName: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resumeUrl: { type: String, required: true }, // file path or URL
  uploadedAt: { type: Date, default: Date.now },

  // New AI analysis fields
  experience: { type: Number }, // years of experience
  skills: [{ type: String }],   // array of skill strings
  relevanceScore: { type: Number }, // 0-100 score
  comments: { type: String }
});

module.exports = mongoose.model("Resume", ResumeSchema);
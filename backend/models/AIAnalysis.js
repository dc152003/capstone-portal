const mongoose = require("mongoose");

const AIAnalysisSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true, unique: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  candidateName: { type: String },
  experience: { type: Number },
  skills: [{ type: String }],
  relevanceScore: { type: Number },
  comments: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AIAnalysisSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("AIAnalysis", AIAnalysisSchema);
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const User = require("../models/User");

const router = express.Router();

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const jobsCount = await Job.countDocuments();
    console.log("Jobs count:", jobsCount);

    const resumesCount = await Resume.countDocuments();
    console.log("Resumes count:", resumesCount);

    const candidatesCount = await User.countDocuments({ role: "candidate" });
    console.log("Candidates count:", candidatesCount);

    const candidatesAppliedCountAgg = await Resume.aggregate([
      { $group: { _id: "$candidateName" } },
      { $count: "count" }
    ]);
    const candidatesAppliedCount = candidatesAppliedCountAgg.length > 0 ? candidatesAppliedCountAgg[0].count : 0;
    console.log("Candidates applied count:", candidatesAppliedCount);

    res.json({
      jobs: jobsCount,
      resumes: resumesCount,
      candidates: candidatesCount,
      candidatesApplied: candidatesAppliedCount
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;

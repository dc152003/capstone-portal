const express = require("express");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");
const Resume = require("../models/Resume");
const Job = require("../models/Job");
const fs = require("fs");
const { analyzeResume } = require("../utils/aiService");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/resumes/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Ensure uploads folder exists
const uploadDir = "uploads/resumes";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Get all jobs (for dropdown)
router.get("/jobs", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({}, "_id title");
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Upload resume endpoint
router.post("/upload", authMiddleware, upload.single("resume"), async (req, res) => {
  try {
    const { candidateName, jobId } = req.body;
    if (!candidateName || !jobId) {
      return res.status(400).json({ msg: "Candidate name and jobId are required" });
    }
    if (!req.file) {
      return res.status(400).json({ msg: "Resume file is required" });
    }

    const resume = new Resume({
      candidateName,
      jobId,
      uploadedBy: req.user.id,
      resumeUrl: req.file.path
    });
    await resume.save();

    res.json({ msg: "Resume uploaded successfully", _id: resume._id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// GET /api/resumes/all - Get all resumes with job details (candidateName, job title, uploadedAt, resumeUrl)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    // Optional: Check if user role is hr-admin (assuming req.user.role is set by authMiddleware)
    if (req.user.role !== "hr-admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const resumes = await Resume.find()
      .populate("jobId", "title") // populate job title only
      .select("candidateName jobId uploadedAt resumeUrl")
      .exec();

    // Format response to include job title directly
    const formatted = resumes.map(r => ({
      _id: r._id,
      candidateName: r.candidateName,
      jobTitle: r.jobId?.title || "N/A",
      uploadedAt: r.uploadedAt,
      resumeUrl: r.resumeUrl
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});



// router.get("/all", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "hr-admin") {
//       return res.status(403).json({ msg: "Access denied" });
//     }

//     const resumes = await Resume.find().populate("jobId", "title");

//     const results = [];

//     for (const r of resumes) {
//       const resumePath = path.resolve(r.resumeUrl);
//       if (!fs.existsSync(resumePath)) {
//         console.warn(`Resume file not found: ${resumePath}`);
//         continue;
//       }

//       let aiResult;
//       try {
//         aiResult = await analyzeResume(r.jobId, resumePath);
//       } catch (err) {
//         console.warn(`AI analysis failed for resume ${r._id}: ${err.message}`);
//         aiResult = null;
//       }

//       results.push({
//         _id: r._id,
//         candidateName: aiResult?.candidateName || r.candidateName,
//         jobTitle: r.jobId?.title || "N/A",
//         uploadedAt: r.uploadedAt,
//         resumeUrl: r.resumeUrl
//       });
//     }

//     res.json(results);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });


module.exports = router;
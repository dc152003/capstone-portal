const express = require("express");
const Job = require("../models/Job");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create job
router.post("/", async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Get single job
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    res.json(job);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Delete job
router.delete("/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ msg: "Job deleted successfully" });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Update job
router.put("/:id", async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }   // return updated job
    );
    if (!updatedJob) {
      return res.status(404).json({ msg: "Job not found" });
    }
    res.json(updatedJob);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


module.exports = router;

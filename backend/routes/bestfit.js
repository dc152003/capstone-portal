const express = require('express');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const AIAnalysis = require('../models/AIAnalysis');
const authMiddleware = require('../middleware/authMiddleware');
const path = require('path');
const { generatePDF, generateCombinedPDF } = require('../utils/pdfExport');
const { analyzeResume } = require('../utils/aiService');

const router = express.Router();

function parseExperience(exp) {
  if (!exp) return null;
  const match = exp.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[0]);
  }
  return null;
}

// POST /api/bestfit - get top N candidates ranked by AI relevance score
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hr-admin') return res.status(403).json({ msg: 'Access denied' });

    const { jobId, count } = req.body;
    if (!jobId) return res.status(400).json({ msg: 'jobId is required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    const resumes = await Resume.find({ jobId });

    const candidates = [];

    for (const resume of resumes) {
      let aiAnalysis = await AIAnalysis.findOne({ resumeId: resume._id });

      if (!aiAnalysis) {
        // Analyze on-demand and save AIAnalysis
        try {
          const aiResult = await analyzeResume(job, path.resolve(resume.resumeUrl));
          const expNum = parseExperience(aiResult.experience);
          aiAnalysis = new AIAnalysis({
            resumeId: resume._id,
            jobId: job._id,
            candidateName: aiResult.candidateName || resume.candidateName,
            experience: isNaN(expNum) ? null : expNum,
            skills: Array.isArray(aiResult.skills) ? aiResult.skills : [],
            relevanceScore: aiResult.relevanceScore,
            comments: aiResult.comments
          });
          await aiAnalysis.save();
        } catch (err) {
          console.warn(`AI analysis failed for resume ${resume._id}: ${err.message}`);
          continue; // skip this resume
        }
      }

      candidates.push({
        candidateName: aiAnalysis.candidateName,
        experience: aiAnalysis.experience,
        skills: aiAnalysis.skills,
        relevanceScore: aiAnalysis.relevanceScore,
        comments: aiAnalysis.comments,
        resumeUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/${resume.resumeUrl.replace(/\\/g, '/')}`,
        resumeId: resume._id.toString()
      });
    }

    candidates.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    res.json(candidates.slice(0, count || 5));
  } catch (err) {
    console.error('Bestfit error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET /api/bestfit/report/:resumeId - generate PDF report for candidate using AIAnalysis data
router.get('/report/:resumeId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hr-admin') return res.status(403).json({ msg: 'Access denied' });

    const { resumeId } = req.params;
    const aiAnalysis = await AIAnalysis.findOne({ resumeId }).populate('jobId');
    if (!aiAnalysis) return res.status(404).json({ msg: 'AI analysis not found for this resume' });

    const reportData = {
      _id: aiAnalysis._id,
      candidateName: aiAnalysis.candidateName,
      jobId: aiAnalysis.jobId,
      experience: aiAnalysis.experience ?? 'N/A',
      skills: aiAnalysis.skills || [],
      relevanceScore: aiAnalysis.relevanceScore ?? 'N/A',
      comments: aiAnalysis.comments || 'N/A'
    };

    const pdfPath = await generatePDF(reportData);

    res.download(pdfPath, `candidate_report_${resumeId}.pdf`, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).send('Failed to download PDF');
      }
    });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// POST /api/bestfit/report-all - generate combined PDF report for top N candidates
router.post('/report-all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hr-admin') return res.status(403).json({ msg: 'Access denied' });

    const { jobId, count } = req.body;
    if (!jobId) return res.status(400).json({ msg: 'jobId is required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    const aiAnalyses = await AIAnalysis.find({ jobId });

    const candidates = aiAnalyses
      .map(ai => ({
        candidateName: ai.candidateName,
        experience: ai.experience,
        skills: ai.skills,
        relevanceScore: ai.relevanceScore,
        comments: ai.comments,
        resumeId: ai.resumeId.toString()
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, count || 5);

    if (candidates.length === 0) {
      return res.status(404).json({ msg: 'No candidates found for report' });
    }

    const pdfPath = await generateCombinedPDF(candidates, job);

    res.download(pdfPath, `bestfit_candidates_report_${jobId}.pdf`, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).send('Failed to download PDF');
      }
    });
  } catch (err) {
    console.error('Combined report generation error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;




// router.post('/', authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== 'hr-admin') {
//       return res.status(403).json({ msg: 'Access denied' });
//     }

//     const { jobId, count } = req.body;
//     if (!jobId) return res.status(400).json({ msg: 'jobId is required' });

//     const job = await Job.findById(jobId);
//     if (!job) return res.status(404).json({ msg: 'Job not found' });

//     const resumes = await Resume.find({ jobId });

//     const candidates = [];

//     for (const resume of resumes) {
//       try {
//         const aiResult = await analyzeResume(job, path.resolve(resume.resumeUrl));

//         candidates.push({
//           candidateName: aiResult.candidateName || resume.candidateName,
//           experience: aiResult.experience,
//           skills: aiResult.skills,
//           relevanceScore: aiResult.relevanceScore,
//           comments: aiResult.comments,
//           resumeUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/${resume.resumeUrl.replace(/\\/g, '/')}`,
//           resumeId: resume._id.toString()
//         });
//       } catch (err) {
//         console.warn(`Failed to analyze resume ${resume._id}:`, err.message);
//       }
//     }

//     candidates.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

//     res.json(candidates.slice(0, count || 5));
//   } catch (err) {
//     console.error('Bestfit error:', err);
//     res.status(500).json({ msg: 'Server error', error: err.message });
//   }
// });

// GET /api/bestfit/report/:resumeId - generate PDF report for candidate

// router.get('/report/:resumeId', authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== 'hr-admin') {
//       return res.status(403).json({ msg: 'Access denied' });
//     }

//     const { resumeId } = req.params;
//     const resume = await Resume.findById(resumeId).populate('jobId');
//     if (!resume) return res.status(404).json({ msg: 'Resume not found' });

//     // For demo, generate PDF with available resume data
//     // You can extend to fetch AI analysis data if stored in DB

//     const reportData = {
//       _id: resume._id,
//       candidateName: resume.candidateName,
//       jobId: resume.jobId,
//       experience: resume.experience || 'N/A',
//       skills: resume.skills || [],
//       relevanceScore: resume.relevanceScore || 'N/A',
//       comments: resume.comments || 'N/A'
//     };

//     const pdfPath = await generatePDF(reportData);

//     res.download(pdfPath, `candidate_report_${resumeId}.pdf`, (err) => {
//       if (err) {
//         console.error('PDF download error:', err);
//         res.status(500).send('Failed to download PDF');
//       }
//       // Optionally delete the file after sending
//       // fs.unlink(pdfPath, () => {});
//     });
//   } catch (err) {
//     console.error('Report generation error:', err);
//     res.status(500).json({ msg: 'Server error', error: err.message });
//   }
// });


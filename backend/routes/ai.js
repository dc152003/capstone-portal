const express = require('express');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const AIAnalysis = require('../models/AIAnalysis');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const OPENAI_API_KEY = process.env.MMC_OPENAI_API_KEY;
const OPENAI_API_URL = process.env.MMC_OPENAI_BASE_URL || 'https://stg1.mmc-dallas-int-non-prod-ingress.mgti.mmc.com/coreapi/openai/v1/deployments/mmc-tech-gpt-4o-mini-128k-2024-07-18/chat/completions';

async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

function cleanAIResponse(text) {
  if (!text) return '';
  return text.replace(/```json|```/g, '').trim();
}

function parseExperience(exp) {
  if (!exp) return null;
  const match = exp.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[0]);
  }
  return null;
}

router.post('/analyze-resume', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

    const resume = await Resume.findById(resumeId).populate('jobId');
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const job = resume.jobId;
    if (!job) return res.status(404).json({ error: 'Job not found for this resume' });

    const resumePath = path.resolve(resume.resumeUrl);
    if (!fs.existsSync(resumePath)) {
      return res.status(500).json({ error: 'Resume file not found on server' });
    }

    const resumeText = await extractTextFromPDF(resumePath);

    const systemPrompt = `You are a HR recruiter expert. Analyze the candidate's resume text and compare it with the job description. 
Extract candidate name, experience, skills, and provide a relevance score (0-100) indicating how well the resume matches the job description.
Provide comments/review on the match.
Respond ONLY with a valid JSON object (no markdown, no extra text) with keys: candidateName, experience, skills (array), relevanceScore, comments.`;

    const userPrompt = `
Job Title: ${job.title}
Job Description: ${job.description}
Preferred Skills: ${job.preferredSkills ? job.preferredSkills.join(', ') : ''}
Candidate Resume Text: ${resumeText}
`;

    let response;
    try {
      response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          }
        }
      );
    } catch (apiErr) {
      console.error('OpenAI API call failed:', apiErr.response?.data || apiErr.message);
      return res.status(500).json({ error: 'OpenAI API call failed', details: apiErr.response?.data || apiErr.message });
    }

    const aiContentRaw = response.data?.choices?.[0]?.message?.content || '';
    const aiContentClean = cleanAIResponse(aiContentRaw);

    let aiResult;
    try {
      aiResult = JSON.parse(aiContentClean);
    } catch (err) {
      console.error('Invalid JSON response from AI:', aiContentRaw);
      return res.status(500).json({ error: 'Invalid JSON response from AI', rawResponse: aiContentRaw });
    }

    const expNum = parseExperience(aiResult.experience);

    // Upsert AIAnalysis document
    const aiAnalysisData = {
      resumeId: resume._id,
      jobId: job._id,
      candidateName: aiResult.candidateName || resume.candidateName,
      experience: isNaN(expNum) ? null : expNum,
      skills: Array.isArray(aiResult.skills) ? aiResult.skills : [],
      relevanceScore: aiResult.relevanceScore,
      comments: aiResult.comments
    };

    const aiAnalysisDoc = await AIAnalysis.findOneAndUpdate(
      { resumeId: resume._id },
      aiAnalysisData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(aiAnalysisDoc);
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'Server error during AI analysis' });
  }
});

module.exports = router;





// router.post('/analyze-resume', authMiddleware, async (req, res) => {
//   try {
//     const { resumeId } = req.body;
//     if (!resumeId) return res.status(400).json({ error: 'resumeId is required' });

//     const resume = await Resume.findById(resumeId).populate('jobId');
//     if (!resume) return res.status(404).json({ error: 'Resume not found' });

//     const job = resume.jobId;
//     if (!job) return res.status(404).json({ error: 'Job not found for this resume' });

//     const resumePath = path.resolve(resume.resumeUrl);
//     console.log('Reading resume PDF from:', resumePath);

//     if (!fs.existsSync(resumePath)) {
//       return res.status(500).json({ error: 'Resume file not found on server' });
//     }

//     const resumeText = await extractTextFromPDF(resumePath);

//     const systemPrompt = `You are a HR recruiter expert. Analyze the candidate's resume text and compare it with the job description. 
// Extract candidate name, experience, skills, and provide a relevance score (0-100) indicating how well the resume matches the job description.
// Provide comments/review on the match.
// Respond ONLY with a valid JSON object (no markdown, no extra text) with keys: candidateName, experience, skills (array), relevanceScore, comments.`;

//     const userPrompt = `
// Job Title: ${job.title}
// Job Description: ${job.description}
// Preferred Skills: ${job.preferredSkills ? job.preferredSkills.join(', ') : ''}
// Candidate Resume Text: ${resumeText}
// `;

//     let response;
//     try {
//       response = await axios.post(
//         OPENAI_API_URL,
//         {
//           model: 'gpt-4',
//           messages: [
//             { role: 'system', content: systemPrompt },
//             { role: 'user', content: userPrompt }
//           ],
//           temperature: 0.7,
//           max_tokens: 500
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${OPENAI_API_KEY}`
//           }
//         }
//       );
//     } catch (apiErr) {
//       console.error('OpenAI API call failed:', apiErr.response?.data || apiErr.message);
//       return res.status(500).json({ error: 'OpenAI API call failed', details: apiErr.response?.data || apiErr.message });
//     }

//     const aiContentRaw = response.data?.choices?.[0]?.message?.content || '';
//     const aiContentClean = cleanAIResponse(aiContentRaw);

//     let aiResult;
//     try {
//       aiResult = JSON.parse(aiContentClean);
//     } catch (err) {
//       console.error('Invalid JSON response from AI:', aiContentRaw);
//       return res.status(500).json({ error: 'Invalid JSON response from AI', rawResponse: aiContentRaw });
//     }

//     aiResult.resumeId = resume._id;
//     aiResult.resumeUrl = `${req.protocol}://${req.get('host')}/${resume.resumeUrl.replace(/\\/g, '/')}`;

//     res.json(aiResult);
//   } catch (err) {
//     console.error('AI analyze error:', err);
//     res.status(500).json({ error: 'Server error during AI analysis' });
//   }
// });


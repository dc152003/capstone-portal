const axios = require("axios");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");

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

async function analyzeResume(job, resumePath) {
  if (!fs.existsSync(resumePath)) {
    throw new Error(`Resume file not found: ${resumePath}`);
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

  const response = await axios.post(
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

  const aiContentRaw = response.data?.choices?.[0]?.message?.content || '';
  const aiContentClean = cleanAIResponse(aiContentRaw);

  let aiResult;
  try {
    aiResult = JSON.parse(aiContentClean);
  } catch (err) {
    throw new Error(`Invalid JSON response from AI: ${aiContentRaw}`);
  }

  return aiResult;
}

async function rankCandidates(job, resumes) {
  const candidates = [];

  for (const r of resumes) {
    const resumePath = path.resolve(r.resumeUrl);
    try {
      const aiResult = await analyzeResume(job, resumePath);

      candidates.push({
        candidateName: r.candidateName,
        experience: aiResult.experience,
        skills: aiResult.skills,
        relevanceScore: aiResult.relevanceScore,
        comments: aiResult.comments,
        resumeUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/${r.resumeUrl.replace(/\\/g, '/')}`,
        resumeId: r._id.toString()
      });
    } catch (err) {
      console.warn(`Failed to analyze resume ${r._id}: ${err.message}`);
    }
  }

  candidates.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  return candidates;
}

module.exports = { analyzeResume, rankCandidates };
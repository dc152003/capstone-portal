// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");

// async function generatePDF(resume) {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument();
//     const pdfPath = path.join(__dirname, `../uploads/resumes/report-${resume._id}.pdf`);
//     const stream = fs.createWriteStream(pdfPath);

//     doc.pipe(stream);

//     doc.fontSize(18).text("Candidate Report", { align: "center" });
//     doc.moveDown();

//     doc.fontSize(14).text(`Name: ${resume.candidateName || "N/A"}`);
//     doc.text(`Job Applied: ${resume.jobId?.title || "N/A"}`);
//     doc.text(`Experience: ${resume.experience ?? "N/A"} years`);
//     doc.text(`Skills: ${Array.isArray(resume.skills) ? resume.skills.join(", ") : "N/A"}`);
//     doc.text(`Relevance Score: ${resume.relevanceScore ?? "N/A"}`);
//     doc.text(`Comments: ${resume.comments || "N/A"}`);

//     doc.end();

//     stream.on("finish", () => resolve(pdfPath));
//     stream.on("error", (err) => reject(err));
//   });
// }

// module.exports = { generatePDF };

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Existing generatePDF function (for single candidate)
async function generatePDF(resume) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, `../uploads/resumes/report-${resume._id}.pdf`);
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    doc.fontSize(18).text("Candidate Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Name: ${resume.candidateName || "N/A"}`);
    doc.text(`Job Applied: ${resume.jobId?.title || "N/A"}`);
    doc.text(`Experience: ${resume.experience ?? "N/A"} years`);
    doc.text(`Skills: ${Array.isArray(resume.skills) ? resume.skills.join(", ") : "N/A"}`);
    doc.text(`Relevance Score: ${resume.relevanceScore ?? "N/A"}`);
    doc.text(`Comments: ${resume.comments || "N/A"}`);

    doc.end();

    stream.on("finish", () => resolve(pdfPath));
    stream.on("error", (err) => reject(err));
  });
}

// New generateCombinedPDF function (for multiple candidates)
async function generateCombinedPDF(candidates, job) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const timestamp = Date.now();
    const pdfPath = path.join(__dirname, `../uploads/resumes/bestfit_report_${job._id}_${timestamp}.pdf`);
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    doc.fontSize(20).text(`Best Fit Candidates Report`, { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`Job Title: ${job.title}`, { align: "center" });
    doc.moveDown(2);

    candidates.forEach((c, index) => {
      doc.fontSize(14).fillColor('black').text(`Candidate #${index + 1}`, { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12).text(`Name: ${c.candidateName || "N/A"}`);
      doc.text(`Experience: ${c.experience ?? "N/A"} years`);
      doc.text(`Skills: ${Array.isArray(c.skills) ? c.skills.join(", ") : "N/A"}`);
      doc.text(`Relevance Score: ${c.relevanceScore ?? "N/A"}`);
      doc.text(`Comments: ${c.comments || "N/A"}`);
      doc.moveDown(1);

      if (index < candidates.length - 1) {
        doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

    stream.on("finish", () => resolve(pdfPath));
    stream.on("error", (err) => reject(err));
  });
}

module.exports = { generatePDF, generateCombinedPDF };
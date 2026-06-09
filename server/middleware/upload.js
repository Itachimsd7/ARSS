/**
 * server/middleware/upload.js — File Upload Configuration using Multer.
 * =======================================================================
 *
 * PURPOSE:
 *   Configures how resume files are received and temporarily stored
 *   when candidates upload via the web interface (POST /api/resumes/upload).
 *
 * LIBRARY: Multer
 *   Multer is an Express middleware for handling multipart/form-data
 *   (the encoding type used for HTML file upload forms).
 *   It receives the uploaded file and saves it to disk.
 *
 * FLOW:
 *   1. Request comes in with file attached (multipart/form-data)
 *   2. Multer's fileFilter checks if the extension is allowed
 *   3. Multer's storage saves the file to server/uploads/ with a unique name
 *   4. The route handler can then access the file via req.file
 *   5. After processing by the AI pipeline, the file is DELETED from disk
 *
 * IMPORTANT:
 *   Files are temporary. The AI pipeline extracts data from them and then
 *   the file is deleted immediately. Only extracted data is kept in MongoDB.
 *
 * USED BY:
 *   server/routes/resumes.js → upload.single('resume')
 */

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Upload Directory Setup ────────────────────────────────────────────────────
// Define where uploaded files will be temporarily stored
const uploadDir = path.join(__dirname, '..', 'uploads');

// Create the directory if it doesn't already exist
// { recursive: true } means it won't throw an error if the folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Storage Configuration ─────────────────────────────────────────────────────
// Tells Multer WHERE to save files and WHAT to name them
const storage = multer.diskStorage({

  // destination: where to save the uploaded file
  destination: (req, file, cb) => {
    cb(null, uploadDir); // save to server/uploads/
  },

  // filename: what to call the saved file
  // We generate a unique name to avoid filename conflicts
  // Format: resume-<timestamp>-<random9digits>.<ext>
  // Example: resume-1716842345123-847392810.pdf
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase(); // e.g. ".pdf"
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});

// ── File Type Filter ──────────────────────────────────────────────────────────
// Rejects files that are not PDF or DOCX before they are saved to disk
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExts.includes(ext)) {
    cb(null, true);  // accept the file
  } else {
    // Reject with an error — this will be caught in the route handler
    cb(new Error('Only PDF and DOCX files are allowed.'));
  }
};

// ── Final Multer Instance ─────────────────────────────────────────────────────
// Combines storage, file filter, and size limit into one middleware object
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum file size
    // Most resumes are well under 1MB, but we give generous room for image-heavy PDFs
  },
});

module.exports = upload;

/**
 * server/models/Candidate.js — Mongoose Schema for a Candidate (processed resume).
 * ==================================================================================
 *
 * PURPOSE:
 *   Defines the structure of a candidate record in MongoDB.
 *   Every processed resume — whether submitted via web upload or email —
 *   is stored as one Candidate document.
 *
 * DATA SOURCES:
 *   - Extracted by Python pipeline (name, email, skills, education, etc.)
 *   - Computed by Python pipeline (score, similarity, result)
 *   - Set by Node.js (status, fileName, fileHash, source)
 *   - Updated by admin (status changes, adminNotes)
 *
 * DEDUPLICATION:
 *   Two unique sparse indexes prevent the same resume from being saved twice:
 *   - fileHash index: same file bytes = same hash = duplicate
 *   - gmailMessageId index: same Gmail message = already processed
 *   "Sparse" means documents without these fields don't conflict with each other.
 *
 * TWO STATUS FIELDS (important distinction):
 *   - result: SET BY AI — "QUALIFIED", "SHORTLIST", "REJECT", "PENDING"
 *             This is the AI's automatic classification, never changed manually.
 *   - status: SET BY ADMIN — "pending", "shortlisted", "rejected", "accepted"
 *             This is the human recruiter's decision after reviewing.
 *
 * USED BY:
 *   server/routes/resumes.js   — created on web upload
 *   server/routes/admin.js     — read and updated by admin
 *   server/services/emailService.js — created on email submission
 */

const mongoose = require('mongoose');

// ── Schema Definition ─────────────────────────────────────────────────────────
const candidateSchema = new mongoose.Schema(
  {
    // ── Personal Information (extracted by Python extractor.py) ──────────────
    name:       { type: String, default: '' }, // Candidate's full name (spaCy NER)
    email:      { type: String, default: '' }, // Email address (regex extraction)
    phone:      { type: String, default: '' }, // Phone number (regex extraction)

    // ── Resume Content (extracted by Python extractor.py) ────────────────────
    skills:     { type: [String], default: [] }, // Array of detected skills e.g. ["python", "sql"]
    education:  { type: String,  default: '' },  // Education level e.g. "B.TECH"
    experience: { type: Number,  default: 0 },   // Years of experience e.g. 3

    // ── AI Scores (computed by matcher.py and scorer.py) ─────────────────────
    score:           { type: Number, default: 0 }, // Final ATS score (0.0 to 1.0)
    similarity:      { type: Number, default: 0 }, // TF-IDF cosine similarity (0.0 to 1.0)
    matchPercentage: { type: Number, default: 0 }, // score × 100, rounded to integer (0–100)

    // ── AI Classification (set by classifier.py) ─────────────────────────────
    result: {
      type: String,
      enum: ['REJECT', 'SHORTLIST', 'QUALIFIED', 'PENDING'], // only these values allowed
      default: 'PENDING',
      // QUALIFIED  → score >= 0.75
      // SHORTLIST  → 0.40 <= score < 0.75
      // REJECT     → score < 0.40 or wrong education
    },

    // ── Admin Status (set by recruiter in the dashboard) ─────────────────────
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected', 'accepted'], // only these values allowed
      default: 'pending',
      // pending     → not yet reviewed by admin
      // shortlisted → admin decided to shortlist for interview
      // accepted    → admin accepted / offered the job
      // rejected    → admin rejected the candidate
    },

    // ── AI Analysis Details (computed by pipeline_runner.py) ─────────────────
    missingSkills: { type: [String], default: [] }, // Required skills not found in resume
    suggestions:   { type: [String], default: [] }, // Actionable improvement tips
    strengths:     { type: [String], default: [] }, // What the candidate does well
    weaknesses:    { type: [String], default: [] }, // Areas where candidate falls short

    // ── File Metadata ─────────────────────────────────────────────────────────
    fileName: { type: String, default: '' }, // Original filename e.g. "john_resume.pdf"
    filePath: { type: String, default: '' }, // Always '' — file is deleted after processing
    fileSize: { type: Number, default: 0 },  // File size in bytes
    fileHash: { type: String, default: '' }, // SHA-256 hash — used for deduplication

    // ── Email-Specific Fields ─────────────────────────────────────────────────
    gmailMessageId: { type: String, default: '' },
    // Gmail's unique message ID — prevents the same email from being processed twice

    source: {
      type: String,
      enum: ['web', 'email'], // was the resume uploaded via the website or emailed?
      default: 'web',
    },

    // ── Admin Notes ───────────────────────────────────────────────────────────
    adminNotes: { type: String, default: '' },
    // Free-text field for recruiter comments about this candidate
    // For email submissions, auto-populated with sender info

    // ── Raw Text (unused but available for future search features) ───────────
    resumeText: { type: String, default: '' },
    // The full extracted text of the resume — not currently stored to save space
  },
  {
    timestamps: true, // Mongoose auto-adds: createdAt, updatedAt
  }
);

// ── Indexes for Deduplication ─────────────────────────────────────────────────
// These ensure the same resume can't be saved twice to the database.

// Index on fileHash: if the same file bytes are uploaded again, MongoDB rejects it.
// sparse: true means documents where fileHash is '' or missing don't conflict.
// partialFilterExpression: only index documents where fileHash is a non-empty string.
candidateSchema.index(
  { fileHash: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { fileHash: { $gt: '' } },
  }
);

// Index on gmailMessageId: prevents reprocessing the same Gmail email.
candidateSchema.index(
  { gmailMessageId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { gmailMessageId: { $gt: '' } },
  }
);

// ── Virtual Field ─────────────────────────────────────────────────────────────
// A virtual is a computed property — it's not stored in MongoDB,
// it's calculated on the fly when accessed.
candidateSchema.virtual('atsScore').get(function () {
  return Math.round(this.score * 100); // converts 0.7450 → 75
});

// Export the model — Mongoose will use the 'candidates' collection in MongoDB
module.exports = mongoose.model('Candidate', candidateSchema);

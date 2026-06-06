const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name:       { type: String, default: '' },
    email:      { type: String, default: '' },
    phone:      { type: String, default: '' },
    skills:     { type: [String], default: [] },
    education:  { type: String, default: '' },
    experience: { type: Number, default: 0 },

    // AI scoring
    score:           { type: Number, default: 0 },
    similarity:      { type: Number, default: 0 },
    matchPercentage: { type: Number, default: 0 },

    result: {
      type: String,
      enum: ['REJECT', 'SHORTLIST', 'QUALIFIED', 'PENDING'],
      default: 'PENDING',
    },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected', 'accepted'],
      default: 'pending',
    },

    missingSkills: { type: [String], default: [] },
    suggestions:   { type: [String], default: [] },
    strengths:     { type: [String], default: [] },
    weaknesses:    { type: [String], default: [] },

    fileName:  { type: String, default: '' },
    filePath:  { type: String, default: '' },
    fileSize:  { type: Number, default: 0 },
    fileHash:  { type: String, default: '' }, // SHA-256 of file content — dedup key

    // For email-sourced resumes
    gmailMessageId: { type: String, default: '' }, // Gmail message ID — dedup key
    source:         { type: String, enum: ['web', 'email'], default: 'web' },

    adminNotes: { type: String, default: '' },
    resumeText: { type: String, default: '' },
  },
  { timestamps: true }
);

// ── Indexes for deduplication ─────────────────────────────────────────────────
// Sparse so documents without these fields don't conflict with each other
candidateSchema.index(
  { fileHash: 1 },
  { unique: true, sparse: true, partialFilterExpression: { fileHash: { $gt: '' } } }
);
candidateSchema.index(
  { gmailMessageId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { gmailMessageId: { $gt: '' } } }
);

candidateSchema.virtual('atsScore').get(function () {
  return Math.round(this.score * 100);
});

module.exports = mongoose.model('Candidate', candidateSchema);

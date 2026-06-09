/**
 * server/models/Config.js — Mongoose Schema for system configuration.
 * =====================================================================
 *
 * PURPOSE:
 *   A generic key-value store for system configuration settings saved in MongoDB.
 *   Currently used to store job requirements that the AI pipeline uses for scoring.
 *
 * WHY STORE CONFIG IN DATABASE?
 *   If we hardcoded job requirements in a file, the server would need to be
 *   restarted every time an admin wants to change the job description or required skills.
 *   By storing it in MongoDB, the admin can update requirements live from the dashboard
 *   and the next resume processed will use the updated config immediately.
 *
 * CURRENT USAGE:
 *   One document with key: "job_requirements"
 *   Value contains: { job_description, skills, min_experience, education, atsThresholds, ... }
 *
 *   This is loaded by:
 *   - server/routes/resumes.js (on web upload)
 *   - server/services/emailService.js (on email submission)
 *   - server/routes/config.js (for admin to read/update)
 *
 * FALLBACK:
 *   If no config document exists in MongoDB yet,
 *   routes/config.js returns DEFAULT_CONFIG and
 *   pipeline_runner.py falls back to config/requirements.yaml.
 */

const mongoose = require('mongoose');

// ── Schema Definition ─────────────────────────────────────────────────────────
const configSchema = new mongoose.Schema(
  {
    key: {
      type:     String,
      required: true,
      unique:   true, // only one document per key (e.g., one "job_requirements")
    },

    value: {
      type: mongoose.Schema.Types.Mixed, // "Mixed" = can store any JSON structure
      required: true,
      // For "job_requirements", this looks like:
      // {
      //   job_description: "Looking for a Python developer...",
      //   skills: ["python", "sql", "nlp"],
      //   min_experience: 1,
      //   education: "btech",
      //   atsThresholds: { qualified: 75, shortlist: 40 }
      // }
    },

    description: {
      type:    String,
      default: '', // optional human-readable note about what this config is
    },
  },
  {
    timestamps: true, // tracks when config was last updated (useful for audit)
  }
);

// Export the model — Mongoose will use the 'configs' collection in MongoDB
module.exports = mongoose.model('Config', configSchema);

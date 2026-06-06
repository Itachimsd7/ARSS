const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const { protect } = require('../middleware/auth');

const DEFAULT_CONFIG = {
  job_description:
    'Looking for a Python developer with knowledge in machine learning, data analysis, and SQL. Experience with NLP is a plus.',
  skills: ['python', 'machine learning', 'sql', 'nlp', 'data analysis'],
  skillWeightage: {
    python: 30,
    'machine learning': 25,
    sql: 20,
    nlp: 15,
    'data analysis': 10,
  },
  min_experience: 1,
  education: 'btech',
  atsThresholds: {
    qualified: 75,
    shortlist: 40,
    reject: 0,
  },
  experiencePriority: 'medium', // low | medium | high
};

// GET /api/config/requirements  — public (used during upload)
router.get('/requirements', async (req, res) => {
  try {
    const config = await Config.findOne({ key: 'job_requirements' });
    res.json({
      success: true,
      data: config ? config.value : DEFAULT_CONFIG,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/config/requirements  — admin only
router.put('/requirements', protect, async (req, res) => {
  try {
    const value = req.body;

    const config = await Config.findOneAndUpdate(
      { key: 'job_requirements' },
      {
        key: 'job_requirements',
        value,
        description: 'AI matching requirements and thresholds',
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: config.value });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

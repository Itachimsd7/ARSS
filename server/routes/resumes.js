const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const upload  = require('../middleware/upload');
const Candidate = require('../models/Candidate');
const Config    = require('../models/Config');
const { runPipeline } = require('../services/pythonPipeline');
const { hashFile }    = require('../utils/fileHash');

// Helper — delete file silently
const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
};

// POST /api/resumes/upload
router.post('/upload', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No resume file uploaded.' });
  }

  const tempPath = req.file.path;

  try {
    // ── Dedup check ───────────────────────────────────────────────────────────
    const fileHash = await hashFile(tempPath);
    const existing = await Candidate.findOne({ fileHash });

    if (existing) {
      deleteFile(tempPath); // duplicate — remove immediately
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'This resume has already been submitted. Returning existing result.',
        data: buildResponse(existing),
      });
    }

    // ── Load config ───────────────────────────────────────────────────────────
    let config = {};
    const dbConfig = await Config.findOne({ key: 'job_requirements' });
    if (dbConfig) {
      config = dbConfig.value;
    } else {
      const yamlPath = path.join(__dirname, '..', '..', 'config', 'requirements.yaml');
      if (fs.existsSync(yamlPath)) {
        config = require('js-yaml').load(fs.readFileSync(yamlPath, 'utf8'));
      }
    }

    // ── AI pipeline ───────────────────────────────────────────────────────────
    const pipelineResult = await runPipeline(tempPath, config);
    const matchPercentage = Math.round((pipelineResult.score || 0) * 100);

    // ── Save to MongoDB ───────────────────────────────────────────────────────
    const candidate = await Candidate.create({
      name:            pipelineResult.name     || 'Unknown',
      email:           pipelineResult.email    || '',
      phone:           pipelineResult.phone    || '',
      skills:          pipelineResult.skills   || [],
      education:       pipelineResult.education || '',
      experience:      pipelineResult.experience || 0,
      score:           pipelineResult.score    || 0,
      similarity:      pipelineResult.similarity || 0,
      matchPercentage,
      result: pipelineResult.result || 'PENDING',
      status: pipelineResult.result === 'QUALIFIED' ? 'shortlisted'
            : pipelineResult.result === 'REJECT'    ? 'rejected' : 'pending',
      missingSkills: pipelineResult.missingSkills || [],
      suggestions:   pipelineResult.suggestions  || [],
      strengths:     pipelineResult.strengths    || [],
      weaknesses:    pipelineResult.weaknesses   || [],
      fileName:  req.file.originalname,
      filePath:  '',        // not stored — file is deleted below
      fileSize:  req.file.size,
      fileHash,
      source:    'web',
      resumeText: '',
    });

    // ── Delete file from disk immediately after DB save ───────────────────────
    deleteFile(tempPath);
    console.log(`[upload] File deleted after processing: ${req.file.originalname}`);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and processed successfully.',
      data: buildResponse(candidate),
    });

  } catch (error) {
    console.error('[upload] Error:', error);
    deleteFile(tempPath); // always clean up on error too
    res.status(500).json({ success: false, message: 'Failed to process resume.' });
  }
});

// GET /api/resumes/:id
router.get('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).select('-resumeText -filePath');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── Shared response shape ─────────────────────────────────────────────────────
const buildResponse = (c) => ({
  id:             c._id,
  name:           c.name,
  email:          c.email,
  phone:          c.phone,
  skills:         c.skills,
  missingSkills:  c.missingSkills,
  education:      c.education,
  experience:     c.experience,
  score:          c.score,
  similarity:     c.similarity,
  matchPercentage: c.matchPercentage,
  result:         c.result,
  status:         c.status,
  suggestions:    c.suggestions,
  strengths:      c.strengths,
  weaknesses:     c.weaknesses,
  fileName:       c.fileName,
  createdAt:      c.createdAt,
});

module.exports = router;

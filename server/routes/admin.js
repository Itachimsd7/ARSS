const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const { protect } = require('../middleware/auth');
const { sendCandidateStatusEmail } = require('../services/emailService');

// All admin routes are protected
router.use(protect);

// GET /api/admin/stats  — dashboard overview
router.get('/stats', async (req, res) => {
  try {
    const [total, shortlisted, rejected, accepted, qualified, pending] =
      await Promise.all([
        Candidate.countDocuments(),
        Candidate.countDocuments({ status: 'shortlisted' }),
        Candidate.countDocuments({ status: 'rejected' }),
        Candidate.countDocuments({ status: 'accepted' }),
        Candidate.countDocuments({ result: 'QUALIFIED' }),
        Candidate.countDocuments({ status: 'pending' }),
      ]);

    // Average score
    const avgResult = await Candidate.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } },
    ]);
    const avgScore = avgResult[0]?.avgScore
      ? Math.round(avgResult[0].avgScore * 100)
      : 0;

    // Score distribution
    const scoreDistribution = await Candidate.aggregate([
      {
        $bucket: {
          groupBy: '$matchPercentage',
          boundaries: [0, 25, 50, 75, 100],
          default: '100',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUploads = await Candidate.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      data: {
        total,
        shortlisted,
        rejected,
        accepted,
        qualified,
        pending,
        avgScore,
        recentUploads,
        scoreDistribution,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/candidates  — paginated list with search/filter/sort
router.get('/candidates', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      result = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (status) query.status = status;
    if (result) query.result = result;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [candidates, total] = await Promise.all([
      Candidate.find(query)
        .select('-resumeText -filePath')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Candidate.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: candidates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Candidates list error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/candidates/:id  — single candidate detail
router.get('/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).select('-resumeText');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/admin/candidates/:id/status  — update candidate status
router.patch('/candidates/:id/status', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ['pending', 'shortlisted', 'rejected', 'accepted'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status, ...(adminNotes !== undefined && { adminNotes }) },
      { new: true, select: '-resumeText -filePath' }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    // ── Send automated status email to candidate ──────────────────────────────
    let emailResult = { sent: false };
    const emailStatuses = ['shortlisted', 'accepted', 'rejected'];
    if (emailStatuses.includes(status) && candidate.email) {
      emailResult = await sendCandidateStatusEmail(candidate, status);
    }

    res.json({
      success: true,
      data: candidate,
      emailSent: emailResult.sent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/admin/candidates/:id/notes  — add/update admin notes
router.patch('/candidates/:id/notes', async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { adminNotes },
      { new: true, select: '-resumeText -filePath' }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/admin/candidates/:id
router.delete('/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }
    // File is already deleted after processing — nothing to clean up on disk
    await candidate.deleteOne();
    res.json({ success: true, message: 'Candidate deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/admin/candidates/:id/download — not available (files deleted after processing)
router.get('/candidates/:id/download', (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Resume files are deleted after processing for privacy. Only extracted data is stored.',
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || 'aibasedresumescreeningsystem@gmail.com'
).toLowerCase();

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'arss_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    // Only the designated admin email is allowed
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Not an admin account.' });
    }

    let admin = await Admin.findOne({ email: email.toLowerCase() });

    // Auto-create admin on first login if not exists
    if (!admin) {
      admin = await Admin.create({
        email: email.toLowerCase(),
        password,
        name: 'Admin',
      });
    } else {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid credentials.' });
      }
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id);

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/auth/admin/me  — verify token & return admin info
router.get('/admin/me', protect, async (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      name: req.admin.name,
      lastLogin: req.admin.lastLogin,
    },
  });
});

// POST /api/auth/admin/logout  — client-side token removal; server just confirms
router.post('/admin/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;

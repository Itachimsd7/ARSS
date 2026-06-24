/**
 * server/index.js — The main entry point for the Node.js backend server.
 * =========================================================================
 *
 * WHAT THIS FILE DOES:
 *   1. Loads environment variables from server/.env (PORT, MONGODB_URI, JWT_SECRET, etc.)
 *   2. Creates an Express web server
 *   3. Connects to MongoDB
 *   4. Sets up all middleware (CORS, JSON parsing, static file serving)
 *   5. Registers all API route groups under /api/...
 *   6. Starts listening on the configured PORT
 *   7. Starts the Gmail IMAP IDLE listener for email-based resume submissions
 *
 * HOW TO START THE SERVER:
 *   cd server && node index.js
 *   (or via package.json: npm start)
 */

require('dotenv').config(); // Load .env file variables into process.env
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

// Database connection function
const connectDB = require('./config/db');

// Import all route handler modules
const authRoutes    = require('./routes/auth');     // /api/auth/* — login, logout, verify token
const resumeRoutes  = require('./routes/resumes');  // /api/resumes/* — upload and retrieve resumes
const adminRoutes   = require('./routes/admin');    // /api/admin/* — candidates, stats (protected)
const configRoutes  = require('./routes/config');   // /api/config/* — job requirements
const webhookRoutes = require('./routes/webhook');  // /api/email/* — Gmail push notification webhook

// Email service: starts the IMAP IDLE listener when server boots
const { startPolling } = require('./services/emailService');

// Python AI pipeline: start the persistent server so ML models are pre-loaded
const { startPythonServer } = require('./services/pythonPipeline');

const app = express();

// ── Step 1: Connect to MongoDB ────────────────────────────────────────────────
// This must happen before any requests are processed.
// If connection fails, connectDB() calls process.exit(1).
connectDB();

// ── Step 1b: Start the Python AI pipeline server ─────────────────────────────
// This spawns the Python server and pre-loads spaCy + sklearn (~5-8s).
// By starting early, the server is warm before the first resume arrives.
startPythonServer().catch((err) =>
  console.error('[startup] Python server start error:', err.message)
);

// ── Step 2: Middleware Setup ──────────────────────────────────────────────────

// CORS — allows the React frontend (running on a different port) to call this API.
// In production, CLIENT_URL should be set to the actual frontend domain.
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true, // allows cookies and auth headers to be sent cross-origin
}));

// JSON body parser — lets us read req.body on POST/PUT requests
// Limit set to 10mb to handle base64-encoded data if needed
app.use(express.json({ limit: '10mb' }));

// URL-encoded body parser — for HTML form submissions
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for the uploads folder.
// Uploaded resume files are temporarily stored here before processing.
// After processing, they are deleted. This just provides access while they exist.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Step 3: API Routes ────────────────────────────────────────────────────────
// Each route group handles a specific area of functionality.

app.use('/api/auth',    authRoutes);    // POST /api/auth/admin/login, GET /api/auth/admin/me
app.use('/api/resumes', resumeRoutes);  // POST /api/resumes/upload
app.use('/api/admin',   adminRoutes);   // GET /api/admin/stats, GET /api/admin/candidates, etc.
app.use('/api/config',  configRoutes);  // GET/PUT /api/config/requirements
app.use('/api/email',   webhookRoutes); // POST /api/email/webhook (Google Pub/Sub)

// ── Health Check Route ────────────────────────────────────────────────────────
// Simple endpoint to verify the server is running.
// Useful for monitoring tools, load balancers, and deployment checks.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve Frontend Static Files in Production ──────────────────────────────────
// In production (NODE_ENV=production) or if client/dist exists, serve the React build.
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  
  // Wildcard fallback: serve index.html for all non-API requests (SPA routing)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log('[startup] Serving production client build from client/dist');
}

// ── Global Error Handler ──────────────────────────────────────────────────────
// Catches any errors that are passed via next(err) from route handlers.
// Provides a consistent error response format across the whole API.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ── Step 4: Start the Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ARSS Backend running on port ${PORT}`);

  // Start the Gmail IMAP IDLE listener.
  // This opens a persistent connection to Gmail and waits for new emails.
  // When a new email with a resume attachment arrives, it processes it automatically.
  // Only starts if GMAIL_USER and GMAIL_APP_PASSWORD are set in .env.
  startPolling();
});

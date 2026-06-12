'use strict';
/**
 * server/services/emailService.js — Gmail IMAP IDLE Email Listener + SMTP Sender.
 * ==================================================================================
 *
 * PURPOSE:
 *   This file does two things:
 *   1. RECEIVE resumes — Listens to Gmail inbox using IMAP IDLE protocol.
 *      When a candidate emails their resume, this file detects it instantly,
 *      downloads the attachment, runs it through the AI pipeline, and saves to MongoDB.
 *
 *   2. SEND status emails — When admin changes a candidate's status (shortlisted,
 *      accepted, rejected), this sends a templated HTML email to the candidate.
 *
 * WHY IMAP IDLE (not polling)?
 *   Traditional approach: check Gmail every 5 minutes (polling).
 *   IMAP IDLE approach: Gmail pushes a signal the INSTANT a new email arrives.
 *
 *   With IDLE:
 *     Email arrives → signal fires (<1 second) → processed (~3-5 seconds total)
 *   With polling (every 5 min):
 *     Email arrives → wait up to 5 minutes → processed
 *
 * SETUP REQUIRED (.env variables):
 *   GMAIL_USER=youremail@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  ← Gmail App Password (not your login password)
 *
 * LIBRARIES:
 *   - imapflow: modern IMAP client with IDLE support
 *   - mailparser (simpleParser): parses raw email bytes into structured objects
 *   - nodemailer: sends outbound emails via Gmail SMTP
 *
 * CALLED BY:
 *   server/index.js → startPolling()   (starts the IDLE listener on server boot)
 *   server/routes/admin.js             (sendCandidateStatusEmail on status change)
 */

const { ImapFlow } = require('imapflow');    // IMAP client library
const { simpleParser } = require('mailparser');  // parses raw email source into structured data
const nodemailer = require('nodemailer');  // sends emails via SMTP
const fs = require('fs');
const path = require('path');

// Database models
const Candidate = require('../models/Candidate');
const Config = require('../models/Config');

// The AI pipeline runner and file hash utility
const { runPipeline } = require('./pythonPipeline');
const { hashFile } = require('../utils/fileHash');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// File extensions that are recognized as resume files
const RESUME_EXTENSIONS = ['.pdf', '.docx', '.doc'];

// Temporary folder where email attachments are saved before processing
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// IMAP IDLE must be refreshed before Gmail's 10-minute timeout
const IDLE_TIMEOUT = 9 * 60 * 1000; // 9 minutes in milliseconds

// Maximum reconnection delay (backoff caps at 60 seconds)
const MAX_RECONNECT_DELAY = 60000;

// Reconnection backoff — starts at 5s, doubles on each failure, caps at 60s
let _reconnectDelay = 5000;

// ─────────────────────────────────────────────────────────────────────────────
// HTML Email Templates
// ─────────────────────────────────────────────────────────────────────────────
// These are the HTML email bodies sent to candidates at different stages.
// Each is a function that takes the candidate's name and returns { subject, html }.

const TEMPLATES = {
  // Sent when resume is first received (via email submission)
  received: (name) => ({
    subject: 'Application Received — AI Resume Screening System',
    html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#4f46e5,#059669);padding:32px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:24px">Application Received</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">AI Resume Screening System</p>
  </div>
  <div style="padding:32px">
    <p style="font-size:16px">Hi <strong>${name || 'Candidate'}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.6">
      Thank you for submitting your resume. Our AI screening system has received
      your application and is currently analyzing your profile.
    </p>
    <div style="background:#1e293b;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #4f46e5">
      <p style="margin:0;color:#818cf8;font-size:14px">
        ⚡ You will receive a status update once our team reviews the AI analysis.
      </p>
    </div>
    <p style="color:#64748b;font-size:13px">Best regards,<br>ARSS Recruitment Team</p>
  </div>
</div>`,
  }),

  // Sent when admin marks candidate as "shortlisted"
  shortlisted: (name) => ({
    subject: 'Congratulations! You Have Been Shortlisted',
    html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:32px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:24px">⭐ You've Been Shortlisted!</h1>
  </div>
  <div style="padding:32px">
    <p style="font-size:16px">Hi <strong>${name || 'Candidate'}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.6">
      Congratulations! You have been shortlisted for an interview for the position.
      We will contact you soon with the interview details.
    </p>
    <div style="background:#1e293b;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #f59e0b">
      <p style="margin:0;color:#fbbf24;font-size:14px">
        📅 Please keep an eye on your inbox for interview scheduling details.
      </p>
    </div>
    <p style="color:#64748b;font-size:13px">Best regards,<br>ARSS Recruitment Team</p>
  </div>
</div>`,
  }),

  // Sent when admin marks candidate as "accepted" (job offer)
  accepted: (name) => ({
    subject: 'Offer Extended — Welcome to the Team!',
    html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#059669,#10b981);padding:32px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:24px">✅ Welcome to the Team!</h1>
  </div>
  <div style="padding:32px">
    <p style="font-size:16px">Hi <strong>${name || 'Candidate'}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.6">
      We are thrilled to offer you the position! Welcome to the team.
      We will send the offer letter and onboarding details shortly.
    </p>
    <div style="background:#1e293b;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #10b981">
      <p style="margin:0;color:#34d399;font-size:14px">
        🎉 Please watch for your official offer letter in a separate email.
      </p>
    </div>
    <p style="color:#64748b;font-size:13px">Best regards,<br>ARSS Recruitment Team</p>
  </div>
</div>`,
  }),

  // Sent when admin marks candidate as "rejected"
  rejected: (name) => ({
    subject: 'Update on Your Application',
    html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:24px">Application Update</h1>
  </div>
  <div style="padding:32px">
    <p style="font-size:16px">Hi <strong>${name || 'Candidate'}</strong>,</p>
    <p style="color:#94a3b8;line-height:1.6">
      Thank you for applying. After careful consideration, we have decided to move
      forward with other candidates whose profiles more closely match our current needs.
    </p>
    <p style="color:#94a3b8;line-height:1.6">
      We appreciate your interest and encourage you to apply for future openings.
      We wish you the best in your job search.
    </p>
    <p style="color:#64748b;font-size:13px">Best regards,<br>ARSS Recruitment Team</p>
  </div>
</div>`,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// SMTP — Outbound Email Sender
// ─────────────────────────────────────────────────────────────────────────────

// Cached nodemailer transporter — created once, reused for all outgoing emails
let _transporter = null;

/**
 * getTransporter — Returns (or creates) the nodemailer SMTP transporter.
 *
 * Uses Gmail SMTP with the App Password from .env.
 * The transporter is cached so we don't recreate it on every email send.
 */
const getTransporter = () => {
  if (_transporter) return _transporter; // return cached instance

  // Create a new nodemailer transporter configured for Gmail
  _transporter = nodemailer.createTransport({
    service: 'gmail', // Gmail SMTP server
    auth: {
      user: process.env.GMAIL_USER,         // e.g. recruiter@gmail.com
      pass: process.env.GMAIL_APP_PASSWORD, // 16-char Gmail App Password
    },
  });

  return _transporter;
};

/**
 * sendCandidateStatusEmail — Send a status notification email to a candidate.
 *
 * Called by server/routes/admin.js when admin changes a candidate's status.
 * Also called after email submission to send "Application Received" confirmation.
 *
 * @param {object} candidate - Mongoose Candidate document (needs .email and .name)
 * @param {string} status    - One of: 'received', 'shortlisted', 'accepted', 'rejected'
 * @returns {Promise<object>} - { sent: true/false, reason?, messageId? }
 */
const sendCandidateStatusEmail = async (candidate, status) => {
  // Don't try to send if Gmail credentials aren't configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { sent: false, reason: 'not_configured' };
  }

  // Can't send if candidate has no email address
  if (!candidate.email) return { sent: false, reason: 'no_email' };

  // Look up the email template for this status
  const templateFn = TEMPLATES[status];
  if (!templateFn) return { sent: false, reason: 'no_template' };

  // Generate the subject and HTML body using the candidate's name
  const { subject, html } = templateFn(candidate.name);

  try {
    // Send the email via Gmail SMTP
    const info = await getTransporter().sendMail({
      from: `"ARSS Recruitment" <${process.env.GMAIL_USER}>`, // sender display name
      to: candidate.email,  // recipient
      subject,
      html,    // HTML email body
    });

    console.log(`[smtp] ✓ ${status} → ${candidate.email} (${info.messageId})`);
    return { sent: true, messageId: info.messageId };

  } catch (err) {
    console.error(`[smtp] ✗ ${status} → ${candidate.email}: ${err.message}`);
    return { sent: false, reason: err.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Email Attachment Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * findResumeAttachment — Find the resume file attachment in a parsed email.
 *
 * Looks through all attachments in the email and returns the first one
 * that looks like a resume (PDF, DOCX, or DOC) based on:
 *   - File extension (.pdf, .docx, .doc)
 *   - MIME content type (application/pdf, etc.)
 *
 * @param {object} parsed - Parsed email object from mailparser's simpleParser
 * @returns {object|null} - The attachment object if found, null if no resume attachment
 */
const findResumeAttachment = (parsed) => {
  if (!parsed.attachments?.length) return null; // no attachments at all

  return parsed.attachments.find((att) => {
    const filename = att.filename || att.name || '';
    const contentType = (att.contentType || '').toLowerCase();
    const ext = path.extname(filename).toLowerCase();

    // Match by file extension (most reliable)
    if (RESUME_EXTENSIONS.includes(ext) && att.content) return true;

    // Match by MIME type if filename is missing or has no extension
    if (att.content && (
      contentType === 'application/pdf' ||
      contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      contentType === 'application/msword' ||
      contentType === 'application/octet-stream' // generic binary — also check ext
    )) return true;

    return false;
  }) || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Core Email Processing Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * processEmailMessage — Process a single incoming email that may contain a resume.
 *
 * This is the heart of the email intake system.
 *
 * FULL FLOW:
 *   1. Extract sender info (name + email) from the email headers
 *   2. Look for a resume attachment (PDF/DOCX)
 *   3. If no attachment → skip (it's a normal email, not a resume submission)
 *   4. Save the attachment to server/uploads/ temporarily
 *   5. Compute SHA-256 hash → check for duplicates in MongoDB
 *   6. Load current job requirements from MongoDB
 *   7. Run the Python AI pipeline on the file
 *   8. Save the result to MongoDB (Candidate.create)
 *   9. Delete the file from disk (only DB record kept)
 *   10. Send "Application Received" confirmation email to the candidate
 *
 * @param {object} parsed - Parsed email from mailparser's simpleParser
 * @returns {string} - Status string: 'normal_email' | 'duplicate' | 'resume_processed' | 'error'
 */
const processEmailMessage = async (parsed) => {
  // ── Extract sender information from email headers ─────────────────────────
  const from = parsed.from?.value?.[0] || {};
  const senderEmail = from.address || ''; // e.g. "john@gmail.com"
  const senderName = from.name || ''; // e.g. "John Doe"
  const subject = parsed.subject || '(no subject)';
  const t0 = Date.now();         // track processing time

  // ── Debug logging: show what attachments came in ──────────────────────────
  const attCount = parsed.attachments?.length || 0;
  if (attCount > 0) {
    parsed.attachments.forEach((att, i) => {
      console.log(`[idle] Attachment[${i}]: filename="${att.filename}" contentType="${att.contentType}" size=${att.content?.length || 0}`);
    });
  } else {
    console.log(`[idle] No attachments found in email from ${senderEmail}`);
  }

  // ── Step 1: Check if there's a resume attachment ──────────────────────────
  const attachment = findResumeAttachment(parsed);
  if (!attachment) {
    // This email has no PDF/DOCX — it's a regular email, not a resume submission
    console.log(`[idle] Normal email from ${senderEmail} — skipped`);
    return 'normal_email';
  }
  console.log(`[idle] Resume email from ${senderEmail} | ${attachment.filename || attachment.contentType}`);

  // ── Step 2: Save the attachment to disk temporarily ───────────────────────
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // Resolve the filename — Gmail sometimes strips filenames from attachments
  let originalFilename = attachment.filename || attachment.name || '';
  if (!originalFilename) {
    // Fall back to a sensible filename based on MIME type
    const ct = (attachment.contentType || '').toLowerCase();
    originalFilename = ct.includes('pdf') ? 'resume.pdf'
      : ct.includes('word') ? 'resume.docx'
        : 'resume.pdf';
  }

  // Generate a unique filename to avoid collisions in the uploads folder
  // Format: email-<timestamp>-<random>.<ext>
  const ext = path.extname(originalFilename).toLowerCase() || '.pdf';
  const fname = `email-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fname);

  // Write the attachment bytes to disk
  fs.writeFileSync(filePath, attachment.content);

  // ── Step 3: Duplicate detection via SHA-256 hash ──────────────────────────
  let fileHash;
  try {
    fileHash = await hashFile(filePath); // compute SHA-256 hash of the file bytes

    // Check if this exact file has been processed before
    const existing = await Candidate.findOne({ fileHash });
    if (existing) {
      console.log(`[idle] Duplicate file — already saved for ${existing.name}`);
      fs.unlinkSync(filePath); // delete the duplicate file
      return 'duplicate';      // stop processing — we already have this resume
    }
  } catch (err) {
    console.error('[idle] Hash error:', err.message);
  }

  // ── Step 4: Load current job requirements config from MongoDB ─────────────
  let config = {};
  try {
    const dbConfig = await Config.findOne({ key: 'job_requirements' });
    if (dbConfig) config = dbConfig.value;
    // If no config in DB, Python will fall back to requirements.yaml
  } catch (_) { }

  // ── Step 5: Run the Python AI Pipeline ───────────────────────────────────
  // This spawns python pipeline_runner.py and gets back the scored result
  let result;
  try {
    result = await runPipeline(filePath, config);
  } catch (err) {
    console.error('[idle] Pipeline error:', err.message);
    // Clean up the file if pipeline fails
    fs.existsSync(filePath) && fs.unlinkSync(filePath);
    return 'error';
  }

  // ── Step 6: Determine the name and email to use ───────────────────────────
  const name = result.name || senderName || 'Unknown';
  // IMPORTANT: Always prefer the sender's email (from Gmail headers).
  // The email extracted from resume text might be outdated or wrong.
  const email = senderEmail || result.email || '';

  const matchPct = Math.round((result.score || 0) * 100); // e.g. 0.7450 → 75

  // ── Step 7: Save candidate to MongoDB ─────────────────────────────────────
  let candidate;
  try {
    candidate = await Candidate.create({
      name,
      email,
      phone: result.phone || '',
      skills: result.skills || [],
      education: result.education || '',
      experience: result.experience || 0,
      score: result.score || 0,
      similarity: result.similarity || 0,
      matchPercentage: matchPct,

      // AI classification result (QUALIFIED / SHORTLIST / REJECT)
      result: result.result || 'PENDING',

      // Initial admin status — derived from AI result
      // QUALIFIED → shortlisted (recommended for human review)
      // REJECT    → rejected    (auto-rejected, admin can override)
      // Otherwise → pending     (needs admin review)
      status: result.result === 'QUALIFIED' ? 'shortlisted'
        : result.result === 'REJECT' ? 'rejected' : 'pending',

      missingSkills: result.missingSkills || [],
      suggestions: result.suggestions || [],
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],

      fileName: originalFilename,
      filePath: '',          // intentionally empty — file is deleted below
      fileSize: attachment.content.length,
      fileHash,               // stored for future dedup checks
      source: 'email',     // marks this came from email, not web upload

      // Auto-note for admin to see where this submission came from
      adminNotes: `Email | Sender: ${senderEmail} | Resume email: ${result.email || 'none'} | Subject: ${subject}`,
    });
  } catch (err) {
    console.error('[idle] DB error:', err.message);
    // Clean up file if DB save fails
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) { }
    return 'error';
  }

  // ── Step 8: Delete the resume file from disk ──────────────────────────────
  // The file has been processed and all data is in MongoDB.
  // We delete it immediately for privacy and to save disk space.
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[idle] File deleted after processing: ${originalFilename}`);
    }
  } catch (err) {
    console.warn('[idle] Could not delete file:', err.message);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[idle] ✓ ${name} | ${matchPct}% | ${result.result} | ${elapsed}s`);

  // ── Step 9: Send "Application Received" confirmation email ────────────────
  // Notify the candidate that their resume was received and is being reviewed
  if (email) {
    sendCandidateStatusEmail(candidate, 'received').catch(() => { });
    // .catch(() => {}) means email failure won't crash the main flow
  }

  return 'resume_processed';
};

// ─────────────────────────────────────────────────────────────────────────────
// IMAP IDLE Connection Management
// ─────────────────────────────────────────────────────────────────────────────

// Module-level state variables for the IMAP connection
let _idleClient = null;   // the active ImapFlow client instance
let _idleTimer = null;   // timer for periodic IDLE refresh
let _running = false;  // is the listener currently active?
let _stopping = false;  // are we intentionally stopping?

/**
 * fetchUnseen — Fetch and process all unread emails in the inbox.
 *
 * Called:
 *   1. Once on connect (to catch emails that arrived while server was offline)
 *   2. Each time the IDLE loop detects a new email (EXISTS event)
 *
 * For each unread email:
 *   - Parses the raw email source using mailparser
 *   - Calls processEmailMessage() to handle it
 *   - Marks the email as "Seen" so it's not reprocessed next time
 *
 * @param {ImapFlow} client - The active IMAP client connection
 */
const fetchUnseen = async (client) => {
  const messages = [];

  // Fetch all unread messages — { source: true } gets the full raw email bytes
  for await (const msg of client.fetch(
    { seen: false },                        // filter: only unread messages
    { source: true, flags: true, uid: true }, // what data to fetch for each message
    { uid: true }                           // use UID-based addressing (more stable)
  )) {
    messages.push(msg);
  }

  if (messages.length === 0) return; // nothing to process
  console.log(`[idle] ${messages.length} unseen message(s) to process`);

  // Process each message one by one
  for (const msg of messages) {
    try {
      // Parse the raw email bytes into a structured object (from, subject, attachments, etc.)
      const parsed = await simpleParser(msg.source);

      // Run the full processing flow (detect attachment → AI pipeline → save to DB)
      await processEmailMessage(parsed);

      // Mark the email as read so we don't process it again on next connect
      await client.messageFlagsAdd(
        { uid: msg.uid },
        ['\\Seen'],  // the IMAP "Seen" flag — marks email as read
        { uid: true }
      );
    } catch (err) {
      console.error('[idle] Message processing error:', err.message);
    }
  }
};

/**
 * connectIdle — Open a persistent IMAP IDLE connection to Gmail.
 *
 * HOW IMAP IDLE WORKS:
 *   1. Connect to Gmail IMAP server
 *   2. Open the INBOX mailbox
 *   3. Call client.idle() — this "parks" the connection in IDLE mode
 *   4. While in IDLE, Gmail holds the connection open
 *   5. When a new email arrives, Gmail fires an 'exists' event
 *   6. We break out of idle, fetch the new email, process it, then go back to idle
 *
 * AUTO-RECONNECT:
 *   If the connection drops (network issue, Gmail timeout, etc.),
 *   the 'close' event fires and we reconnect after a delay.
 *   The delay doubles on each failure (exponential backoff):
 *   5s → 10s → 20s → 40s → 60s (capped)
 */
const connectIdle = async () => {
  if (_stopping) return; // don't reconnect if we're intentionally shutting down

  // Create a new IMAP client configured for Gmail
  const client = new ImapFlow({
    host: 'imap.gmail.com', // Gmail's IMAP server
    port: 993,              // IMAPS port (IMAP over TLS)
    secure: true,             // use TLS encryption
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
    },
    logger: false, // disable imapflow's verbose logging
    tls: { rejectUnauthorized: true }, // verify Gmail's SSL certificate
  });

  _idleClient = client; // store reference so we can close it on stopPolling()

  // Handle connection errors (network issues, auth failures, etc.)
  client.on('error', (err) => {
    console.error('[idle] Connection error:', err.message);
  });

  // Handle connection close — reconnect automatically unless we're stopping
  client.on('close', () => {
    if (_stopping) return; // intentional shutdown — don't reconnect
    console.log(`[idle] Connection closed — reconnecting in ${_reconnectDelay / 1000}s...`);
    clearTimeout(_idleTimer);
    setTimeout(() => {
      _reconnectDelay = Math.min(_reconnectDelay * 2, MAX_RECONNECT_DELAY); // exponential backoff
      connectIdle();
    }, _reconnectDelay);
  });

  try {
    // ── Connect to Gmail ──────────────────────────────────────────────────────
    await client.connect();
    _reconnectDelay = 5000; // reset backoff on successful connect
    console.log('[idle] ✓ Connected to Gmail IMAP');

    // Lock the INBOX mailbox for exclusive access
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Process any emails that arrived while the server was offline/restarting
      await fetchUnseen(client);
      console.log('[idle] Listening for new emails (IMAP IDLE)...');

      // ── IDLE Event Listener ───────────────────────────────────────────────
      // The 'exists' event fires when Gmail detects a new email in the inbox.
      // We set a flag and call noop() to break out of the current idle() call.
      let newMailPending = false;

      client.on('exists', async (data) => {
        console.log(`[idle] ⚡ New email detected (EXISTS: ${data.count})`);
        newMailPending = true;
        // noop() sends a no-op command that causes idle() to return
        try { await client.noop(); } catch (_) { }
      });

      // ── Main IDLE Loop ────────────────────────────────────────────────────
      // client.idle() blocks until either:
      //   - The server sends a notification (new email, flag change, etc.)
      //   - The idle timeout is reached
      // After it returns, we check if new mail arrived and process it,
      // then immediately go back into idle.
      while (!_stopping && client.usable) {
        try {
          await client.idle(); // wait here until something happens
        } catch (err) {
          if (!_stopping) throw err; // unexpected error — re-throw to outer catch
          break; // intentional stop — exit the loop
        }

        if (_stopping) break;

        // If the 'exists' event fired while we were in idle, fetch new emails
        if (newMailPending) {
          newMailPending = false;
          await fetchUnseen(client);
        }
      }

    } finally {
      // Always release the mailbox lock, even if an error occurred
      clearTimeout(_idleTimer);
      lock.release();
    }

    // Clean logout if we're stopping intentionally
    if (!_stopping) await client.logout();

  } catch (err) {
    console.error('[idle] Fatal error:', err.message);
    // Attempt to reconnect after a delay
    if (!_stopping) {
      console.log(`[idle] Reconnecting in ${_reconnectDelay / 1000}s...`);
      setTimeout(() => {
        _reconnectDelay = Math.min(_reconnectDelay * 2, MAX_RECONNECT_DELAY);
        connectIdle();
      }, _reconnectDelay);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API — exported functions used by other modules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * startPolling — Start the IMAP IDLE email listener.
 *
 * Called by server/index.js on server startup.
 * Does nothing if GMAIL_USER or GMAIL_APP_PASSWORD are not set in .env.
 * Safe to call multiple times — checks _running flag to prevent duplicates.
 */
const startPolling = () => {
  // Skip if Gmail credentials not configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[email] Disabled — set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    return;
  }

  if (_running) return; // already running — don't start twice

  _running = true;
  _stopping = false;

  // Verify SMTP connection on startup (to ensure outbound emails will work)
  getTransporter().verify((err) => {
    if (err) console.error('[smtp] Verification failed:', err.message);
    else console.log('[smtp] ✓ Ready to send emails');
  });

  console.log(`[email] Starting IMAP IDLE for ${process.env.GMAIL_USER}`);
  console.log('[email] New emails will be processed in <5 seconds');

  // Open the IMAP IDLE connection
  connectIdle();
};

/**
 * stopPolling — Gracefully stop the IMAP IDLE listener.
 *
 * Sets the stopping flag, clears timers, and logs out from Gmail.
 * Called during server shutdown if needed.
 */
const stopPolling = async () => {
  _stopping = true;
  _running = false;
  clearTimeout(_idleTimer);

  // Gracefully log out from Gmail IMAP if still connected
  if (_idleClient?.usable) {
    try { await _idleClient.logout(); } catch (_) { }
  }

  console.log('[email] Stopped');
};

// Export the public API
module.exports = {
  startPolling,
  stopPolling,
  sendCandidateStatusEmail,  // used by server/routes/admin.js for status change emails
  handlePushNotification: async () => { }, // stub kept for webhook route compatibility
  pollOnce: fetchUnseen,     // exposed for manual polling if ever needed
};

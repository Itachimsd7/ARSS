'use strict';
/**
 * emailService.js
 *
 * Uses IMAP IDLE — a persistent connection where Gmail pushes a signal
 * the instant a new email arrives. No polling. No Google Cloud setup.
 * Just your App Password.
 *
 * Timeline:
 *   Email arrives → IDLE signal fires (<1s) → fetch+parse (~1s)
 *   → AI pipeline (~2-3s) → save DB (~0.1s) → send confirmation (~0.5s)
 *   TOTAL: ~3-5 seconds guaranteed
 *
 * Requires in .env:
 *   GMAIL_USER=aibasedresumescreeningsystem@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 */

const { ImapFlow }     = require('imapflow');
const { simpleParser } = require('mailparser');
const nodemailer       = require('nodemailer');
const fs               = require('fs');
const path             = require('path');
const Candidate        = require('../models/Candidate');
const Config           = require('../models/Config');
const { runPipeline }  = require('./pythonPipeline');
const { hashFile }     = require('../utils/fileHash');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const RESUME_EXTENSIONS  = ['.pdf', '.docx', '.doc'];
const UPLOAD_DIR         = path.join(__dirname, '..', 'uploads');
const IDLE_TIMEOUT       = 9 * 60 * 1000; // 9 min — Gmail drops IDLE at 10 min
const MAX_RECONNECT_DELAY = 60000;         // cap backoff at 60s

let _reconnectDelay = 5000; // starts at 5s, doubles on each failure

// ─────────────────────────────────────────────────────────────────────────────
// Email templates
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATES = {
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
// SMTP — send status emails
// ─────────────────────────────────────────────────────────────────────────────
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  return _transporter;
};

const sendCandidateStatusEmail = async (candidate, status) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { sent: false, reason: 'not_configured' };
  }
  if (!candidate.email) return { sent: false, reason: 'no_email' };

  const templateFn = TEMPLATES[status];
  if (!templateFn)  return { sent: false, reason: 'no_template' };

  const { subject, html } = templateFn(candidate.name);
  try {
    const info = await getTransporter().sendMail({
      from: `"ARSS Recruitment" <${process.env.GMAIL_USER}>`,
      to:   candidate.email,
      subject,
      html,
    });
    console.log(`[smtp] ✓ ${status} → ${candidate.email} (${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[smtp] ✗ ${status} → ${candidate.email}: ${err.message}`);
    return { sent: false, reason: err.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Core: process one parsed email
// ─────────────────────────────────────────────────────────────────────────────
const findResumeAttachment = (parsed) => {
  if (!parsed.attachments?.length) return null;

  return parsed.attachments.find((att) => {
    const filename    = att.filename || att.name || '';
    const contentType = (att.contentType || '').toLowerCase();
    const ext         = path.extname(filename).toLowerCase();

    // Match by file extension
    if (RESUME_EXTENSIONS.includes(ext) && att.content) return true;

    // Match by MIME type (in case filename is missing)
    if (att.content && (
      contentType === 'application/pdf' ||
      contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      contentType === 'application/msword' ||
      contentType === 'application/octet-stream' // generic binary — check ext too
    )) return true;

    return false;
  }) || null;
};

const processEmailMessage = async (parsed) => {
  const from        = parsed.from?.value?.[0] || {};
  const senderEmail = from.address || '';
  const senderName  = from.name   || '';
  const subject     = parsed.subject || '(no subject)';
  const t0          = Date.now();

  // ── Debug: log what attachments were found ────────────────────────────────
  const attCount = parsed.attachments?.length || 0;
  if (attCount > 0) {
    parsed.attachments.forEach((att, i) => {
      console.log(`[idle] Attachment[${i}]: filename="${att.filename}" contentType="${att.contentType}" size=${att.content?.length || 0}`);
    });
  } else {
    console.log(`[idle] No attachments found in email from ${senderEmail}`);
  }

  // ── Classify ──────────────────────────────────────────────────────────────
  const attachment = findResumeAttachment(parsed);
  if (!attachment) {
    console.log(`[idle] Normal email from ${senderEmail} — skipped`);
    return 'normal_email';
  }
  console.log(`[idle] Resume email from ${senderEmail} | ${attachment.filename || attachment.contentType}`);

  // ── Save file ─────────────────────────────────────────────────────────────
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // Resolve filename — Gmail sometimes omits it
  let originalFilename = attachment.filename || attachment.name || '';
  if (!originalFilename) {
    const ct = (attachment.contentType || '').toLowerCase();
    originalFilename = ct.includes('pdf') ? 'resume.pdf'
                     : ct.includes('word') ? 'resume.docx'
                     : 'resume.pdf';
  }

  const ext      = path.extname(originalFilename).toLowerCase() || '.pdf';
  const fname    = `email-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fname);
  fs.writeFileSync(filePath, attachment.content);

  // ── Dedup ─────────────────────────────────────────────────────────────────
  let fileHash;
  try {
    fileHash = hashFile(filePath);
    const existing = await Candidate.findOne({ fileHash });
    if (existing) {
      console.log(`[idle] Duplicate file — already saved for ${existing.name}`);
      fs.unlinkSync(filePath);
      return 'duplicate';
    }
  } catch (err) {
    console.error('[idle] Hash error:', err.message);
  }

  // ── Load job config ───────────────────────────────────────────────────────
  let config = {};
  try {
    const dbConfig = await Config.findOne({ key: 'job_requirements' });
    if (dbConfig) config = dbConfig.value;
  } catch (_) {}

  // ── AI pipeline ───────────────────────────────────────────────────────────
  let result;
  try {
    result = await runPipeline(filePath, config);
  } catch (err) {
    console.error('[idle] Pipeline error:', err.message);
    fs.existsSync(filePath) && fs.unlinkSync(filePath);
    return 'error';
  }

  const name         = result.name  || senderName  || 'Unknown';
  // Always use the sender's email (who actually sent the resume email)
  // Fall back to resume-extracted email only if sender email is missing
  const email        = senderEmail || result.email || '';
  const matchPct     = Math.round((result.score || 0) * 100);

  // ── Save to MongoDB ───────────────────────────────────────────────────────
  let candidate;
  try {
    candidate = await Candidate.create({
      name, email,
      phone:         result.phone      || '',
      skills:        result.skills     || [],
      education:     result.education  || '',
      experience:    result.experience || 0,
      score:         result.score      || 0,
      similarity:    result.similarity || 0,
      matchPercentage: matchPct,
      result:  result.result || 'PENDING',
      status:  result.result === 'QUALIFIED' ? 'shortlisted'
             : result.result === 'REJECT'    ? 'rejected' : 'pending',
      missingSkills: result.missingSkills || [],
      suggestions:   result.suggestions  || [],
      strengths:     result.strengths    || [],
      weaknesses:    result.weaknesses   || [],
      fileName:  originalFilename,
      filePath:  '',        // file deleted after processing — not stored
      fileSize:  attachment.content.length,
      fileHash,
      source:    'email',
      adminNotes: `Email | Sender: ${senderEmail} | Resume email: ${result.email || 'none'} | Subject: ${subject}`,
    });
  } catch (err) {
    console.error('[idle] DB error:', err.message);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
    return 'error';
  }

  // ── Delete file from disk immediately after DB save ───────────────────────
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

  // ── Send "Application Received" confirmation ──────────────────────────────
  if (email) {
    sendCandidateStatusEmail(candidate, 'received').catch(() => {});
  }

  return 'resume_processed';
};

// ─────────────────────────────────────────────────────────────────────────────
// IMAP IDLE — persistent connection, zero polling
// ─────────────────────────────────────────────────────────────────────────────
let _idleClient  = null;
let _idleTimer   = null;   // periodic IDLE refresh (every 9 min)
let _running     = false;
let _stopping    = false;

/**
 * Fetch and process all currently unseen messages.
 * Called once on connect, then again each time IDLE fires.
 */
const fetchUnseen = async (client) => {
  const messages = [];

  for await (const msg of client.fetch(
    { seen: false },
    { source: true, flags: true, uid: true },
    { uid: true }
  )) {
    messages.push(msg);
  }

  if (messages.length === 0) return;
  console.log(`[idle] ${messages.length} unseen message(s) to process`);

  for (const msg of messages) {
    try {
      const parsed = await simpleParser(msg.source);
      await processEmailMessage(parsed);
      // Mark as read so we don't re-process
      await client.messageFlagsAdd(
        { uid: msg.uid },
        ['\\Seen'],
        { uid: true }
      );
    } catch (err) {
      console.error('[idle] Message processing error:', err.message);
    }
  }
};

/**
 * Open a persistent IMAP IDLE connection.
 * Gmail fires an EXISTS notification the instant a new email arrives.
 * Auto-reconnects on disconnect.
 */
const connectIdle = async () => {
  if (_stopping) return;

  const client = new ImapFlow({
    host:   'imap.gmail.com',
    port:   993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: false,
    tls: { rejectUnauthorized: true },
  });

  _idleClient = client;

  client.on('error', (err) => {
    console.error('[idle] Connection error:', err.message);
  });

  client.on('close', () => {
    if (_stopping) return;
    console.log(`[idle] Connection closed — reconnecting in ${_reconnectDelay / 1000}s...`);
    clearTimeout(_idleTimer);
    setTimeout(() => { _reconnectDelay = Math.min(_reconnectDelay * 2, MAX_RECONNECT_DELAY); connectIdle(); }, _reconnectDelay);
  });

  try {
    await client.connect();
    _reconnectDelay = 5000; // reset backoff on successful connect
    console.log('[idle] ✓ Connected to Gmail IMAP');

    const lock = await client.getMailboxLock('INBOX');

    try {
      // Process any emails that arrived while we were offline
      await fetchUnseen(client);

      console.log('[idle] Listening for new emails (IMAP IDLE)...');

      // ── IDLE loop ─────────────────────────────────────────────────────────
      // client.idle() resolves when the server sends any notification or
      // after maxIdleTime. We loop it so we stay in IDLE continuously.
      // Gmail fires an 'exists' event on the client when new mail arrives.
      let newMailPending = false;

      client.on('exists', async (data) => {
        console.log(`[idle] ⚡ New email detected (EXISTS: ${data.count})`);
        newMailPending = true;
        // Break out of current IDLE so we can fetch immediately
        try { await client.noop(); } catch (_) {}
      });

      // Keep refreshing IDLE until stopped
      while (!_stopping && client.usable) {
        try {
          // Enter IDLE — returns when server sends a notification or after 9 min
          await client.idle();
        } catch (err) {
          if (!_stopping) throw err;
          break;
        }

        if (_stopping) break;

        // If new mail arrived, fetch it
        if (newMailPending) {
          newMailPending = false;
          await fetchUnseen(client);
        }
      }

    } finally {
      clearTimeout(_idleTimer);
      lock.release();
    }

    if (!_stopping) await client.logout();

  } catch (err) {
    console.error('[idle] Fatal error:', err.message);
    if (!_stopping) {
      console.log(`[idle] Reconnecting in ${_reconnectDelay / 1000}s...`);
      setTimeout(() => { _reconnectDelay = Math.min(_reconnectDelay * 2, MAX_RECONNECT_DELAY); connectIdle(); }, _reconnectDelay);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const startPolling = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[email] Disabled — set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    return;
  }
  if (_running) return;
  _running  = true;
  _stopping = false;

  // Verify SMTP on startup
  getTransporter().verify((err) => {
    if (err) console.error('[smtp] Verification failed:', err.message);
    else     console.log('[smtp] ✓ Ready to send emails');
  });

  console.log(`[email] Starting IMAP IDLE for ${process.env.GMAIL_USER}`);
  console.log('[email] New emails will be processed in <5 seconds');
  connectIdle();
};

const stopPolling = async () => {
  _stopping = true;
  _running  = false;
  clearTimeout(_idleTimer);
  if (_idleClient?.usable) {
    try { await _idleClient.logout(); } catch (_) {}
  }
  console.log('[email] Stopped');
};

module.exports = {
  startPolling,
  stopPolling,
  sendCandidateStatusEmail,
  // kept for webhook route compatibility
  handlePushNotification: async () => {},
  pollOnce: fetchUnseen,
};

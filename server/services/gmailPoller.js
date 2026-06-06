/**
 * gmailPoller.js
 *
 * Polls aibasedresumescreeningsystem@gmail.com for new emails with
 * PDF/DOCX attachments, runs them through the AI pipeline, and saves
 * results to MongoDB — exactly like a web upload.
 *
 * Setup required (one-time):
 *   1. Enable Gmail API in Google Cloud Console
 *   2. Create OAuth2 credentials (Desktop app)
 *   3. Run `node services/gmailAuth.js` once to get refresh token
 *   4. Add credentials to server/.env
 */

const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')
const cron = require('node-cron')
const Candidate = require('../models/Candidate')
const Config = require('../models/Config')
const { runPipeline } = require('./pythonPipeline')
const { hashFile } = require('../utils/fileHash')

// ── OAuth2 client ────────────────────────────────────────────────────────────
const getOAuthClient = () => {
  const client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  )
  client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  })
  return client
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Decode base64url encoded Gmail message part data.
 */
const decodeBase64 = (data) =>
  Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

/**
 * Recursively find attachment parts in a Gmail message payload.
 */
const findAttachments = (parts = []) => {
  const attachments = []
  for (const part of parts) {
    const mime = part.mimeType || ''
    const filename = part.filename || ''
    const ext = path.extname(filename).toLowerCase()

    if (
      (mime === 'application/pdf' || mime.includes('wordprocessingml') || ext === '.pdf' || ext === '.docx') &&
      filename
    ) {
      attachments.push(part)
    }

    // Recurse into nested parts
    if (part.parts) {
      attachments.push(...findAttachments(part.parts))
    }
  }
  return attachments
}

/**
 * Extract sender name and email from a "From" header value.
 * e.g. "John Doe <john@example.com>" → { name: 'John Doe', email: 'john@example.com' }
 */
const parseSender = (fromHeader = '') => {
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: '', email: fromHeader.trim() }
}

/**
 * Get header value by name from Gmail message headers array.
 */
const getHeader = (headers = [], name) => {
  const h = headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
  return h ? h.value : ''
}

// ── Core polling logic ───────────────────────────────────────────────────────

/**
 * Process a single Gmail message: download attachment, run pipeline, save to DB.
 */
const processMessage = async (gmail, messageId, config) => {
  try {
    // Fetch full message
    const { data: msg } = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    })

    const headers = msg.payload?.headers || []
    const subject = getHeader(headers, 'Subject')
    const from = getHeader(headers, 'From')
    const { name: senderName, email: senderEmail } = parseSender(from)

    console.log(`[gmail] Processing email from: ${senderEmail} | Subject: ${subject}`)

    // ── Dedup check: skip if this Gmail message was already processed ─────────
    const alreadyProcessed = await Candidate.findOne({ gmailMessageId: messageId })
    if (alreadyProcessed) {
      console.log(`[gmail] Message ${messageId} already processed — skipping`)
      return
    }

    // Find resume attachments
    const attachmentParts = findAttachments(msg.payload?.parts || [])

    if (attachmentParts.length === 0) {
      console.log(`[gmail] No resume attachment found in message ${messageId} — skipping`)
      return
    }

    // Process each attachment (usually just one resume per email)
    for (const part of attachmentParts) {
      const filename = part.filename
      const attachmentId = part.body?.attachmentId

      if (!attachmentId) continue

      // Download attachment data
      const { data: attachmentData } = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId,
      })

      const fileBuffer = decodeBase64(attachmentData.data)

      // Save to uploads directory
      const uploadDir = path.join(__dirname, '..', 'uploads')
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      const ext = path.extname(filename).toLowerCase()
      const savedFilename = `email-${uniqueSuffix}${ext}`
      const savedPath = path.join(uploadDir, savedFilename)

      fs.writeFileSync(savedPath, fileBuffer)
      console.log(`[gmail] Saved attachment: ${savedFilename}`)

      // ── Dedup check: skip if exact same file content already exists ──────────
      const fileHash = hashFile(savedPath)
      const hashExists = await Candidate.findOne({ fileHash })
      if (hashExists) {
        console.log(`[gmail] Duplicate file content detected — skipping attachment from ${senderEmail}`)
        fs.unlinkSync(savedPath)
        continue
      }

      // Run AI pipeline
      const pipelineResult = await runPipeline(savedPath, config)

      // Use sender info if pipeline couldn't extract name/email
      const candidateName = pipelineResult.name || senderName || 'Unknown'
      const candidateEmail = pipelineResult.email || senderEmail || ''
      const matchPercentage = Math.round((pipelineResult.score || 0) * 100)

      // Save to MongoDB
      const candidate = await Candidate.create({
        name: candidateName,
        email: candidateEmail,
        phone: pipelineResult.phone || '',
        skills: pipelineResult.skills || [],
        education: pipelineResult.education || '',
        experience: pipelineResult.experience || 0,
        score: pipelineResult.score || 0,
        similarity: pipelineResult.similarity || 0,
        matchPercentage,
        result: pipelineResult.result || 'PENDING',
        status: pipelineResult.result === 'QUALIFIED'
          ? 'shortlisted'
          : pipelineResult.result === 'REJECT'
          ? 'rejected'
          : 'pending',
        missingSkills: pipelineResult.missingSkills || [],
        suggestions: pipelineResult.suggestions || [],
        strengths: pipelineResult.strengths || [],
        weaknesses: pipelineResult.weaknesses || [],
        fileName: filename,
        filePath: savedPath,
        fileSize: fileBuffer.length,
        fileHash,                    // ← content dedup key
        gmailMessageId: messageId,   // ← message dedup key
        source: 'email',
        adminNotes: `Source: Email from ${senderEmail} | Subject: ${subject}`,
      })

      console.log(`[gmail] ✓ Saved candidate: ${candidateName} | Score: ${matchPercentage}% | Result: ${pipelineResult.result}`)
    }

    // Mark message as read so we don't process it again
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    })
  } catch (err) {
    console.error(`[gmail] Error processing message ${messageId}:`, err.message)
  }
}

/**
 * Main poll function — checks for unread emails with attachments.
 */
const pollGmail = async () => {
  // Skip if credentials not configured
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
    return
  }

  try {
    const auth = getOAuthClient()
    const gmail = google.gmail({ version: 'v1', auth })

    // Search for unread emails with attachments
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread has:attachment (filename:pdf OR filename:docx)',
      maxResults: 20,
    })

    const messages = data.messages || []
    if (messages.length === 0) {
      console.log('[gmail] No new resume emails found')
      return
    }

    console.log(`[gmail] Found ${messages.length} new email(s) with attachments`)

    // Load current job requirements config
    let config = {}
    const dbConfig = await Config.findOne({ key: 'job_requirements' })
    if (dbConfig) config = dbConfig.value

    // Process each message
    for (const msg of messages) {
      await processMessage(gmail, msg.id, config)
    }
  } catch (err) {
    console.error('[gmail] Poll error:', err.message)
  }
}

/**
 * Start the Gmail polling cron job.
 * Runs every 5 minutes by default.
 */
const startGmailPoller = () => {
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
    console.log('[gmail] Gmail poller disabled — GMAIL_CLIENT_ID or GMAIL_REFRESH_TOKEN not set in .env')
    console.log('[gmail] See SETUP.md → "Email Integration" section to enable it')
    return
  }

  const interval = process.env.GMAIL_POLL_INTERVAL || '*/5 * * * *' // every 5 min

  console.log(`[gmail] Starting Gmail poller (interval: ${interval})`)

  // Run once immediately on startup
  pollGmail()

  // Then on schedule
  cron.schedule(interval, () => {
    console.log('[gmail] Polling Gmail for new resumes...')
    pollGmail()
  })
}

module.exports = { startGmailPoller, pollGmail }

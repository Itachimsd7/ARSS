'use strict';
/**
 * webhook.js
 *
 * POST /api/email/webhook
 *
 * Receives Gmail push notifications from Google Cloud Pub/Sub.
 * When Gmail gets a new email, it pushes here INSTANTLY — no polling delay.
 *
 * Pub/Sub message format:
 * {
 *   "message": {
 *     "data": "<base64 encoded JSON>",   // { emailAddress, historyId }
 *     "messageId": "...",
 *     "publishTime": "..."
 *   },
 *   "subscription": "projects/.../subscriptions/..."
 * }
 */

const express = require('express');
const router  = express.Router();
const { handlePushNotification } = require('../services/emailService');

// POST /api/email/webhook  — called by Google Pub/Sub (no auth needed, Google signs it)
router.post('/webhook', async (req, res) => {
  // Acknowledge immediately — Pub/Sub retries if it doesn't get 200 within 10s
  res.status(200).send('OK');

  try {
    const body = req.body;

    if (!body?.message?.data) {
      console.log('[webhook] Received ping with no data — ignored');
      return;
    }

    // Decode base64 Pub/Sub message
    const decoded = Buffer.from(body.message.data, 'base64').toString('utf8');
    const payload = JSON.parse(decoded);

    const { emailAddress, historyId } = payload;
    console.log(`[webhook] Push from Gmail: ${emailAddress} | historyId: ${historyId}`);

    // Process asynchronously — response already sent
    handlePushNotification(historyId).catch((err) => {
      console.error('[webhook] Processing error:', err.message);
    });
  } catch (err) {
    console.error('[webhook] Parse error:', err.message);
  }
});

// GET /api/email/webhook  — health check for Pub/Sub subscription verification
router.get('/webhook', (req, res) => {
  res.json({ status: 'ok', service: 'ARSS Gmail Webhook' });
});

module.exports = router;

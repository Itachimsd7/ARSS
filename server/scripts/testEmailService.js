/**
 * testEmailService.js
 *
 * Verifies SMTP + IMAP connections and simulates a mock email processing cycle.
 *
 * Run:
 *   node scripts/testEmailService.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const nodemailer  = require('nodemailer');
const { ImapFlow } = require('imapflow');

const USER = process.env.GMAIL_USER;
const PASS = process.env.GMAIL_APP_PASSWORD;

if (!USER || !PASS) {
  console.error('\n❌  GMAIL_USER and GMAIL_APP_PASSWORD must be set in server/.env\n');
  console.log('Steps to get an App Password:');
  console.log('  1. Go to https://myaccount.google.com/');
  console.log('  2. Security → 2-Step Verification (enable if not already)');
  console.log('  3. Security → App passwords → Other → name it "ARSS-Backend"');
  console.log('  4. Copy the 16-character code into GMAIL_APP_PASSWORD in server/.env\n');
  process.exit(1);
}

const separator = () => console.log('─'.repeat(50));

// ── Test 1: SMTP ──────────────────────────────────────────────────────────────
const testSMTP = async () => {
  separator();
  console.log('TEST 1: SMTP Connection (sending emails)');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: USER, pass: PASS },
  });

  try {
    await transporter.verify();
    console.log('✅  SMTP connection verified — can send emails');
    return true;
  } catch (err) {
    console.error('❌  SMTP failed:', err.message);
    return false;
  }
};

// ── Test 2: IMAP ──────────────────────────────────────────────────────────────
const testIMAP = async () => {
  separator();
  console.log('TEST 2: IMAP Connection (reading inbox)');

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: USER, pass: PASS },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    let total = 0;
    let unread = 0;
    let withAttachments = 0;

    try {
      const status = await client.status('INBOX', { messages: true, unseen: true });
      total  = status.messages || 0;
      unread = status.unseen   || 0;

      // Count messages with attachments in last 20
      for await (const msg of client.fetch('1:20', { envelope: true, bodyStructure: true })) {
        const hasAttachment = JSON.stringify(msg.bodyStructure || {})
          .toLowerCase()
          .match(/\.pdf|\.docx|application\/pdf|wordprocessingml/);
        if (hasAttachment) withAttachments++;
      }
    } finally {
      lock.release();
    }

    await client.logout();

    console.log(`✅  IMAP connection verified`);
    console.log(`    Total messages : ${total}`);
    console.log(`    Unread         : ${unread}`);
    console.log(`    With resume attachments (last 20): ${withAttachments}`);
    return true;
  } catch (err) {
    console.error('❌  IMAP failed:', err.message);
    try { await client.logout(); } catch (_) {}
    return false;
  }
};

// ── Test 3: Send test email to self ──────────────────────────────────────────
const testSendEmail = async () => {
  separator();
  console.log('TEST 3: Send test email to self');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: USER, pass: PASS },
  });

  try {
    const info = await transporter.sendMail({
      from: `"ARSS Test" <${USER}>`,
      to: USER,
      subject: '[ARSS] Email Service Test',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;background:#f8fafc">
          <h2 style="color:#4f46e5">✅ ARSS Email Service Working</h2>
          <p>This is a test email from the ARSS backend email service.</p>
          <p>SMTP and IMAP are configured correctly.</p>
          <p style="color:#64748b;font-size:12px">Sent at: ${new Date().toISOString()}</p>
        </div>`,
    });
    console.log(`✅  Test email sent — Message ID: ${info.messageId}`);
    console.log(`    Check inbox at: ${USER}`);
    return true;
  } catch (err) {
    console.error('❌  Send failed:', err.message);
    return false;
  }
};

// ── Run all tests ─────────────────────────────────────────────────────────────
const run = async () => {
  console.log('\n🔧  ARSS Email Service Test');
  console.log(`    Account: ${USER}\n`);

  const smtpOk = await testSMTP();
  const imapOk = await testIMAP();
  let sendOk = false;
  if (smtpOk) sendOk = await testSendEmail();

  separator();
  console.log('\n📊  Results:');
  console.log(`  SMTP (send)  : ${smtpOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`  IMAP (read)  : ${imapOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`  Send test    : ${sendOk ? '✅ OK' : '❌ FAILED'}`);

  if (smtpOk && imapOk) {
    console.log('\n✅  Email service is fully operational. Restart the server to begin polling.\n');
  } else {
    console.log('\n❌  Fix the errors above, then re-run this script.\n');
    console.log('Common fixes:');
    console.log('  • Make sure 2-Step Verification is ON in your Google account');
    console.log('  • Use an App Password, NOT your regular Gmail password');
    console.log('  • Enable IMAP in Gmail: Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP');
  }
};

run().catch(console.error);

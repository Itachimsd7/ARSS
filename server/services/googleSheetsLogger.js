// using native fetch

/**
 * Sends a log entry to a Google Sheet via a deployed Google Apps Script Web App.
 *
 * @param {string} level - The log level (e.g., 'INFO', 'ERROR', 'WARN')
 * @param {string} source - Where the log originated (e.g., 'EmailService', 'MassProcessor')
 * @param {string} message - A brief description of the event
 * @param {object} [details={}] - Optional JSON object with additional context
 */
async function logToGoogleSheets(level, source, message, details = {}) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'YOUR_WEBHOOK_URL_HERE') {
    console.warn('[Logger] GOOGLE_SHEETS_WEBHOOK_URL is not configured in .env. Skipping Google Sheets log.');
    // Fallback to local console
    console.log(`[${level}] [${source}]: ${message}`, details);
    return;
  }

  const payload = {
    level,
    source,
    message,
    details
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`[Logger] Failed to send log to Google Sheets. Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`[Logger] Error sending log to Google Sheets:`, error.message);
  }
}

module.exports = { logToGoogleSheets };

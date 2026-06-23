const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
const UPLOADS_LOG = path.join(LOGS_DIR, 'uploads.log');
const ADMIN_LOG = path.join(LOGS_DIR, 'admin_actions.log');

// Ensure directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Log a resume upload event to uploads.log
 * @param {object} details - Upload details
 */
const logUpload = (details) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] UPLOAD | DETAILS: ${JSON.stringify(details)}\n`;
  
  fs.appendFile(UPLOADS_LOG, logMessage, (err) => {
    if (err) console.error('Failed to write uploads log:', err);
  });
};

/**
 * Log an admin action to admin_actions.log
 * @param {string} action - Type of action (e.g. 'STATUS_UPDATE', 'CANDIDATE_DELETE')
 * @param {object} details - Action details
 */
const logAdminAction = (action, details) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ACTION: ${action} | DETAILS: ${JSON.stringify(details)}\n`;
  
  fs.appendFile(ADMIN_LOG, logMessage, (err) => {
    if (err) console.error('Failed to write admin actions log:', err);
  });
};

module.exports = { logUpload, logAdminAction };

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
 * Helper to get local ISO 8601 timestamp with timezone offset
 * @returns {string} Local timestamp
 */
const getLocalTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  
  const tzOffset = -now.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
  const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${tzHours}:${tzMins}`;
};

/**
 * Log a resume upload event to uploads.log
 * @param {object} details - Upload details
 */
const logUpload = (details) => {
  const timestamp = getLocalTimestamp();
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
  const timestamp = getLocalTimestamp();
  const logMessage = `[${timestamp}] ACTION: ${action} | DETAILS: ${JSON.stringify(details)}\n`;
  
  fs.appendFile(ADMIN_LOG, logMessage, (err) => {
    if (err) console.error('Failed to write admin actions log:', err);
  });
};

module.exports = { logUpload, logAdminAction };

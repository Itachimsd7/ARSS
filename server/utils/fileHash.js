const crypto = require('crypto');
const fs = require('fs');

/**
 * Compute SHA-256 hash of a file's contents.
 * Used as a deduplication key — same file bytes = same hash.
 */
const hashFile = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

module.exports = { hashFile };

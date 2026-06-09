/**
 * server/utils/fileHash.js — SHA-256 File Hashing Utility.
 * ==========================================================
 *
 * PURPOSE:
 *   Generates a unique fingerprint (hash) for a file based on its byte content.
 *   Used for deduplication — to detect if the same resume has already been submitted.
 *
 * HOW SHA-256 HASHING WORKS:
 *   - SHA-256 is a cryptographic hash function.
 *   - It reads the raw bytes of a file and produces a 64-character hex string.
 *   - The SAME file always produces the SAME hash.
 *   - Different files (even if just one byte is different) produce DIFFERENT hashes.
 *   - Example output: "a3f1d2c4e5b6..." (64 hex characters)
 *
 * WHY THIS IS USED FOR DEDUPLICATION:
 *   If a candidate uploads the exact same resume twice (even with a different filename),
 *   the hash will be identical. We check the hash against MongoDB before processing.
 *   If a match is found, we return the existing result instead of running the pipeline again.
 *
 * PERFORMANCE:
 *   Uses streaming (createReadStream) instead of reading the entire file into memory.
 *   This avoids blocking the Node.js event loop on large files.
 *
 * USED BY:
 *   server/routes/resumes.js     — web upload dedup check
 *   server/services/emailService.js — email upload dedup check
 */

const crypto = require('crypto'); // Node.js built-in cryptography module
const fs     = require('fs');     // Node.js built-in file system module

/**
 * Compute the SHA-256 hash of a file's contents using streaming.
 *
 * Uses createReadStream to avoid loading the entire file into memory,
 * which keeps the Node.js event loop non-blocking for large files.
 *
 * @param {string} filePath - Absolute path to the file to hash
 * @returns {Promise<string>} - 64-character lowercase hex string (the file's fingerprint)
 *
 * Example:
 *   await hashFile('/path/to/resume.pdf')
 *   → "a3f1d2c4e5b67890abcdef1234567890abcdef1234567890abcdef1234567890"
 */
const hashFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

module.exports = { hashFile };

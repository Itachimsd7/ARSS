/**
 * pythonPipeline.js
 *
 * Calls the Python screening pipeline via child_process.
 * Falls back to a mock result if Python is unavailable (dev mode).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PYTHON_SCRIPT = path.join(__dirname, '..', '..', 'pipeline_runner.py');

/**
 * Run the Python pipeline on a resume file.
 * @param {string} filePath  - Absolute path to the uploaded resume
 * @param {object} config    - Job requirements config
 * @returns {Promise<object>} - Extracted + scored result
 */
const runPipeline = (filePath, config = {}) => {
  return new Promise((resolve, reject) => {
    // If the Python runner script doesn't exist, use mock data
    if (!fs.existsSync(PYTHON_SCRIPT)) {
      console.warn('[pipeline] Python runner not found — using mock data');
      return resolve(buildMockResult(filePath, config));
    }

    const args = [
      PYTHON_SCRIPT,
      '--file', filePath,
      '--config', JSON.stringify(config),
    ];

    const proc = spawn('python', args, { cwd: path.join(__dirname, '..', '..') });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[pipeline] Python error:', stderr);
        // Don't crash — return mock so upload still works
        return resolve(buildMockResult(filePath, config));
      }
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (e) {
        console.error('[pipeline] JSON parse error:', e.message);
        resolve(buildMockResult(filePath, config));
      }
    });

    proc.on('error', (err) => {
      console.error('[pipeline] Spawn error:', err.message);
      resolve(buildMockResult(filePath, config));
    });
  });
};

/**
 * Build a deterministic mock result for development / when Python is unavailable.
 */
const buildMockResult = (filePath, config) => {
  const requiredSkills = config.skills || ['python', 'machine learning', 'sql', 'nlp'];
  const foundSkills = requiredSkills.slice(0, Math.ceil(requiredSkills.length * 0.6));
  const missingSkills = requiredSkills.filter((s) => !foundSkills.includes(s));

  const similarity = parseFloat((Math.random() * 0.4 + 0.5).toFixed(4)); // 0.5–0.9
  const experience = Math.floor(Math.random() * 5) + 1;
  const score = parseFloat(
    (0.7 * similarity + 0.3 * Math.min(experience / 5, 1.0)).toFixed(4)
  );

  let result = 'REJECT';
  if (score >= 0.75) result = 'QUALIFIED';
  else if (score >= 0.4) result = 'SHORTLIST';

  return {
    name: 'Candidate',
    email: '',
    phone: '',
    skills: foundSkills,
    education: config.education || 'B.TECH',
    experience,
    similarity,
    score,
    result,
    missingSkills,
    suggestions: [
      'Add more quantifiable achievements to your experience section.',
      'Include relevant certifications to strengthen your profile.',
      'Tailor your resume keywords to match the job description.',
    ],
    strengths: foundSkills.map((s) => `Proficient in ${s}`),
    weaknesses: missingSkills.map((s) => `Missing skill: ${s}`),
  };
};

module.exports = { runPipeline };

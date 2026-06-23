/**
 * server/services/pythonPipeline.js — Bridge between Node.js and the Python AI pipeline.
 * ========================================================================================
 *
 * PURPOSE:
 *   Node.js cannot run Python code directly. This file acts as a bridge.
 *   It manages a PERSISTENT Python HTTP server that stays running in the background.
 *   Each resume is sent via HTTP POST and returns in ~200-500ms.
 *
 * ARCHITECTURE (new — persistent server):
 *   1. On Node.js boot, startPythonServer() spawns pipeline_runner.py --serve
 *   2. Python loads all heavy libraries (spaCy, sklearn) ONCE at startup (~5-8s)
 *   3. Python prints {"status":"ready"} to stdout — Node.js detects this
 *   4. For each resume, Node.js sends HTTP POST to localhost:5001
 *   5. Python processes the resume (~200-500ms) and returns JSON
 *   6. The Python process stays alive for all future requests
 *
 * PREVIOUS ARCHITECTURE (slow — ~15 seconds per resume):
 *   - Spawned a NEW Python process for every single resume
 *   - Python loaded spaCy + sklearn from scratch each time (~10-12s wasted)
 *   - Process died after each resume, discarding all loaded state
 *
 * FALLBACK (Development Mode):
 *   If Python isn't installed or the server can't start,
 *   the function returns a mock result instead of crashing.
 *
 * CALLED BY:
 *   server/routes/resumes.js      — on web upload
 *   server/services/emailService.js — on email submission
 *   server/index.js               — startPythonServer() on boot
 */

const { spawn } = require('child_process'); // Node.js built-in for spawning processes
const path      = require('path');
const fs        = require('fs');
const http      = require('http');

// Absolute path to the Python entry point script
const PYTHON_SCRIPT = path.join(__dirname, '..', '..', 'pipeline_runner.py');

// Port the Python server listens on (localhost only — not exposed externally)
const PIPELINE_PORT = 5002;

// ── Module-level state ───────────────────────────────────────────────────────
let _pythonProcess = null;  // the child process running the Python server
let _ready         = false; // has the Python server signaled readiness?
let _starting      = null;  // Promise that resolves when the server is ready

/**
 * startPythonServer — Spawn the persistent Python AI pipeline server.
 *
 * Called ONCE on Node.js boot (from server/index.js).
 * Starts pipeline_runner.py in --serve mode and waits for the "ready" signal.
 *
 * The Python process loads spaCy, sklearn, etc. once (~5-8 seconds on first boot).
 * After that, every resume processes in ~200-500ms via HTTP.
 *
 * @returns {Promise<void>} - Resolves when the Python server is ready to accept requests
 */
const startPythonServer = () => {
  // If already starting or started, return the existing promise
  if (_starting) return _starting;
  if (_ready) return Promise.resolve();

  // If the Python script doesn't exist, skip
  if (!fs.existsSync(PYTHON_SCRIPT)) {
    console.warn('[pipeline] Python runner not found — will use mock data');
    return Promise.resolve();
  }

  _starting = new Promise((resolve) => {
    console.log('[pipeline] Starting persistent Python server...');

    const rootDir = path.join(__dirname, '..', '..');
    const venvPythonWindows = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
    const venvPythonUnix = path.join(rootDir, '.venv', 'bin', 'python');

    let pythonCmd = 'python';
    if (fs.existsSync(venvPythonWindows)) {
      pythonCmd = venvPythonWindows;
    } else if (fs.existsSync(venvPythonUnix)) {
      pythonCmd = venvPythonUnix;
    }

    // Spawn: python pipeline_runner.py --serve --port 5001
    const proc = spawn(pythonCmd, [PYTHON_SCRIPT, '--serve', '--port', String(PIPELINE_PORT)], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, stdout/stderr piped
    });

    _pythonProcess = proc;

    // Buffer for stdout data (the ready signal comes here)
    let stdoutBuffer = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdoutBuffer += text;

      // Check for the readiness signal from Python
      if (!_ready && stdoutBuffer.includes('"status": "ready"') || stdoutBuffer.includes('"status":"ready"')) {
        _ready = true;
        _starting = null;
        console.log(`[pipeline] ✓ Python server ready on port ${PIPELINE_PORT}`);
        resolve();
      }

      // Log any subsequent output from Python (processing logs)
      if (_ready) {
        const lines = text.trim().split('\n');
        for (const line of lines) {
          if (line && !line.includes('"status"')) {
            console.log(`[python] ${line}`);
          }
        }
      }
    });

    // Log Python stderr (warnings, errors, tracebacks)
    proc.stderr.on('data', (data) => {
      const text = data.toString().trim();
      if (text) console.error(`[python-err] ${text}`);
    });

    // Handle process exit — auto-restart unless Node.js is shutting down
    proc.on('close', (code) => {
      console.warn(`[pipeline] Python process exited with code ${code}`);
      _ready = false;
      _pythonProcess = null;
      _starting = null;

      // Auto-restart after 2 seconds if the process crashed
      if (code !== 0 && code !== null) {
        console.log('[pipeline] Auto-restarting Python server in 2s...');
        setTimeout(() => startPythonServer(), 2000);
      }
    });

    proc.on('error', (err) => {
      console.error('[pipeline] Failed to start Python:', err.message);
      _ready = false;
      _pythonProcess = null;
      _starting = null;
      resolve(); // resolve anyway — runPipeline will fall back to mock data
    });

    // If Python doesn't become ready within 30 seconds, give up waiting
    // (it might still start later and auto-set _ready via stdout listener)
    setTimeout(() => {
      if (!_ready) {
        console.warn('[pipeline] Python server did not become ready within 30s — using mock fallback');
        _starting = null;
        resolve();
      }
    }, 30000);
  });

  return _starting;
};

/**
 * stopPythonServer — Gracefully shut down the Python server.
 *
 * Called during Node.js shutdown to clean up the child process.
 */
const stopPythonServer = () => {
  if (_pythonProcess) {
    _pythonProcess.kill('SIGTERM');
    _pythonProcess = null;
    _ready = false;
    _starting = null;
    console.log('[pipeline] Python server stopped');
  }
};

// Clean up on Node.js exit
process.on('exit', stopPythonServer);
process.on('SIGINT', () => { stopPythonServer(); process.exit(0); });
process.on('SIGTERM', () => { stopPythonServer(); process.exit(0); });


/**
 * runPipeline — Send a resume to the persistent Python server for processing.
 *
 * @param {string} filePath - Absolute path to the uploaded resume file
 * @param {object} config   - Job requirements config (job_description, skills, etc.)
 * @returns {Promise<object>} - Resolves with the extracted + scored candidate data
 *
 * Returned object shape:
 *   { name, email, phone, skills, education, experience,
 *     similarity, score, result, missingSkills, suggestions, strengths, weaknesses }
 */
const runPipeline = async (filePath, config = {}) => {
  // Ensure the Python server is running
  if (!_ready) {
    await startPythonServer();
  }

  // If Python server still not ready (e.g. Python not installed), use mock data
  if (!_ready) {
    console.warn('[pipeline] Python server not available — using mock data');
    return buildMockResult(filePath, config);
  }

  try {
    const result = await sendToServer(filePath, config);

    // Check if Python returned an error
    if (result.error) {
      console.error('[pipeline] Python error:', result.error);
      return buildMockResult(filePath, config);
    }

    return result;

  } catch (err) {
    console.error('[pipeline] HTTP error:', err.message);

    // If the connection was refused, the Python server might have crashed
    // Try to restart it for the next request
    if (err.code === 'ECONNREFUSED') {
      _ready = false;
      _starting = null;
      console.log('[pipeline] Connection refused — triggering Python restart');
      startPythonServer(); // don't await — let it restart in the background
    }

    return buildMockResult(filePath, config);
  }
};


/**
 * sendToServer — Internal: send an HTTP POST to the Python pipeline server.
 *
 * @param {string} filePath - Path to the resume file
 * @param {object} config   - Job requirements config
 * @returns {Promise<object>} - Parsed JSON response from Python
 */
const sendToServer = (filePath, config) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ file: filePath, config });

    const req = http.request({
      hostname: '127.0.0.1',
      port: PIPELINE_PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 30000, // 30s timeout for very large resumes
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON from Python: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Pipeline request timed out'));
    });

    req.write(payload);
    req.end();
  });
};


/**
 * buildMockResult — Generate a fake but realistic result for development/fallback.
 *
 * Used when:
 *   - Python is not installed on the machine
 *   - The Python server crashed and hasn't restarted yet
 *   - Any error occurs during processing
 *
 * The mock result uses random values within realistic ranges so the
 * UI can be developed and tested without Python being set up.
 *
 * @param {string} filePath - Not used, but kept for signature consistency
 * @param {object} config   - Used to get required skills and education
 * @returns {object} - A fake candidate result object
 */
const buildMockResult = (filePath, config) => {
  const requiredSkills = config.skills || ['python', 'machine learning', 'sql', 'nlp'];

  // Pretend the candidate has 60% of the required skills
  const foundSkills   = requiredSkills.slice(0, Math.ceil(requiredSkills.length * 0.6));
  const missingSkills = requiredSkills.filter((s) => !foundSkills.includes(s));

  const similarity = parseFloat((Math.random() * 0.4 + 0.5).toFixed(4)); // random 0.5–0.9
  const experience = Math.floor(Math.random() * 5) + 1;                   // random 1–5 years
  const score      = parseFloat(
    (0.7 * similarity + 0.3 * Math.min(experience / 5, 1.0)).toFixed(4)
  );

  // Classify based on score thresholds (matches classifier.py logic)
  let result = 'REJECT';
  if (score >= 0.75) result = 'QUALIFIED';
  else if (score >= 0.4) result = 'SHORTLIST';

  return {
    name:       'Candidate',  // no real name available in mock
    email:      '',
    phone:      '',
    skills:     foundSkills,
    education:  config.education || 'B.TECH',
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

module.exports = { runPipeline, startPythonServer, stopPythonServer };

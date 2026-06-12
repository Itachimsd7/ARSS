'use strict';
/**
 * server/scripts/simulateMassProcessing.js
 * =========================================================================
 *
 * PURPOSE:
 *   Simulates processing 1,000 resumes sequentially to test backend performance,
 *   database write efficiency, memory safety, and AI pipeline speed.
 *
 *   This script:
 *   1. Connects to MongoDB.
 *   2. Starts the persistent Python AI server.
 *   3. Uses the sample resume file (data/resumes/arss_qualified_resume.pdf or similar).
 *   4. Generates 1,000 distinct candidate names/emails to bypass database dedup.
 *   5. Processes them sequentially, reporting live console logs and performance metrics.
 *   6. Prints a summary of total elapsed time, average processing time, and memory usage.
 *
 * RUN:
 *   node server/scripts/simulateMassProcessing.js [numResumes]
 *   Default numResumes is 100 (which is fast to run but represents a high load).
 *   You can pass 1000 as an argument to run the full 1,000 load test.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const Candidate = require('../models/Candidate');
const Config = require('../models/Config');
const { runPipeline, startPythonServer, stopPythonServer } = require('../services/pythonPipeline');
const { hashFile } = require('../utils/fileHash');

// Configuration
const NUM_RESUMES = parseInt(process.argv[2], 10) || 100; // default to 100 for safety, run 1000 if specified
const SAMPLE_RESUME_PATH = path.join(__dirname, '..', '..', 'data', 'resumes', 'arss_qualified_resume.pdf');
const TEMP_DIR = path.join(__dirname, '..', 'uploads', 'temp_sim');

const separator = () => console.log('═'.repeat(60));

const formatMemory = (bytes) => {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const runSimulation = async () => {
  separator();
  console.log(`🚀 STARTING MASS RESUME PROCESSING SIMULATION (${NUM_RESUMES} RESUMES)`);
  separator();

  // 1. Verify Sample Resume Exists
  if (!fs.existsSync(SAMPLE_RESUME_PATH)) {
    console.error(`❌ Error: Sample resume not found at: ${SAMPLE_RESUME_PATH}`);
    console.log('Please generate a sample resume first or place a PDF at that location.');
    process.exit(1);
  }

  // Create temporary simulation directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // 2. Connect to Database
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arss');
  console.log('✅ Connected to MongoDB.');

  // 3. Pre-warm Python Server
  console.log('🐍 Pre-warming Python AI Pipeline Server...');
  const t0_python = Date.now();
  await startPythonServer();
  console.log(`✅ Python Server ready in ${((Date.now() - t0_python) / 1000).toFixed(2)}s.`);

  // Load configuration
  let config = {};
  try {
    const dbConfig = await Config.findOne({ key: 'job_requirements' });
    if (dbConfig) config = dbConfig.value;
  } catch (_) {}

  // 4. Start processing loop
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;

  const initialMemory = process.memoryUsage().heapUsed;

  console.log(`\n⏳ Simulating sequential processing of ${NUM_RESUMES} resumes...\n`);

  for (let i = 1; i <= NUM_RESUMES; i++) {
    const resumeStart = Date.now();

    try {
      // Create a unique copy of the resume to simulate a new file hash and avoid dedup block
      const candidateId = `sim_${Date.now()}_${i}_${Math.round(Math.random() * 1e6)}`;
      const uniqueFname = `resume_${candidateId}.pdf`;
      const uniquePath = path.join(TEMP_DIR, uniqueFname);

      // Write mock modified bytes to ensure unique file hash
      const fileBytes = fs.readFileSync(SAMPLE_RESUME_PATH);
      // Append some unique bytes to the end of the PDF buffer (doesn't corrupt standard PDF viewers)
      const modifiedBytes = Buffer.concat([fileBytes, Buffer.from(`\n% SIMULATION_ID: ${candidateId}`)]);
      fs.writeFileSync(uniquePath, modifiedBytes);

      // Compute file hash
      const fileHash = await hashFile(uniquePath);

      // Call pipeline
      const result = await runPipeline(uniquePath, config);

      // Randomize name and email to prevent DB unique key constraints
      const candidateName = `${result.name || 'Sim Candidate'} #${i}`;
      const candidateEmail = `sim_candidate_${i}_${Date.now()}@example.com`;

      // Save to Database
      await Candidate.create({
        name: candidateName,
        email: candidateEmail,
        phone: result.phone || '123-456-7890',
        skills: result.skills || [],
        education: result.education || 'B.Tech',
        experience: result.experience || 0,
        score: result.score || 0,
        similarity: result.similarity || 0,
        matchPercentage: Math.round((result.score || 0) * 100),
        result: result.result || 'PENDING',
        status: result.result === 'QUALIFIED' ? 'shortlisted' : 'pending',
        missingSkills: result.missingSkills || [],
        suggestions: result.suggestions || [],
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        fileName: uniqueFname,
        filePath: '', // Delete path representation
        fileSize: modifiedBytes.length,
        fileHash,
        source: 'web',
        adminNotes: `Mass Processing Load Test Candidate #${i}`,
      });

      // Cleanup file
      if (fs.existsSync(uniquePath)) {
        fs.unlinkSync(uniquePath);
      }

      successCount++;
      const elapsed = Date.now() - resumeStart;
      
      // Print progress updates every 10% (or every 5 iterations for small batches)
      const reportInterval = Math.max(1, Math.round(NUM_RESUMES / 10));
      if (i % reportInterval === 0 || i === NUM_RESUMES) {
        const percent = Math.round((i / NUM_RESUMES) * 100);
        const currentMemory = process.memoryUsage().heapUsed;
        const memoryGrowth = currentMemory - initialMemory;
        
        console.log(`[Progress] ${percent}% (${i}/${NUM_RESUMES}) | Successes: ${successCount} | Last took: ${elapsed}ms | RAM Heap: ${formatMemory(currentMemory)} (Growth: ${formatMemory(memoryGrowth)})`);
      }

    } catch (err) {
      errorCount++;
      console.error(`❌ Error on resume #${i}:`, err.message);
    }
  }

  // 5. Simulation Complete Report
  const totalElapsed = (Date.now() - startTime) / 1000;
  const avgTime = (totalElapsed / NUM_RESUMES).toFixed(2);
  const finalMemory = process.memoryUsage().heapUsed;

  // Cleanup simulation directory
  try {
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(TEMP_DIR, file));
      }
      fs.rmdirSync(TEMP_DIR);
    }
  } catch (_) {}

  separator();
  console.log('📊 SIMULATION RESULTS SUMMARY');
  separator();
  console.log(`Total Resumes Simulated : ${NUM_RESUMES}`);
  console.log(`Successful Processes   : ${successCount}`);
  console.log(`Failed Processes       : ${errorCount}`);
  console.log(`Total Elapsed Time     : ${totalElapsed.toFixed(2)} seconds (${(totalElapsed / 60).toFixed(2)} minutes)`);
  console.log(`Average Time / Resume  : ${avgTime} seconds (${(avgTime * 1000).toFixed(0)} ms)`);
  console.log(`Initial Heap Memory    : ${formatMemory(initialMemory)}`);
  console.log(`Final Heap Memory      : ${formatMemory(finalMemory)}`);
  console.log(`Heap Memory Growth     : ${formatMemory(finalMemory - initialMemory)}`);
  separator();

  // Cleanup connections and child processes
  stopPythonServer();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed. Simulation complete.');
  process.exit(0);
};

runSimulation().catch(async (err) => {
  console.error('Fatal Simulation Error:', err);
  stopPythonServer();
  await mongoose.connection.close();
  process.exit(1);
});

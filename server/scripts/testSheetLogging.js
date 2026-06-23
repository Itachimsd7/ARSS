'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { logToGoogleSheets } = require('../services/googleSheetsLogger');

async function testSheetLogging() {
  console.log("🚀 Starting Google Sheets Error Logging Test...");
  console.log("This script simulates sending both successful and failed resume upload logs to Google Sheets.\n");

  try {
    // 1. Simulate a successful resume upload
    console.log("[1/4] Simulating successful upload log...");
    await logToGoogleSheets('INFO', 'ResumeUploaderTest', 'Resume uploaded successfully', {
      fileName: 'alice_smith_resume.pdf',
      status: 'SUCCESS',
      fileSize: '1.2 MB'
    });

    // 2. Simulate a FAILED resume upload (e.g., file too large or corrupted)
    console.log("[2/4] Simulating FAILED upload log...");
    await logToGoogleSheets('ERROR', 'ResumeUploaderTest', 'Failed to upload resume (File corrupted)', {
      fileName: 'bob_jones_corrupted.pdf',
      status: 'FAILED',
      errorDetails: 'PDF Parsing Error: Unexpected EOF'
    });

    // 3. Simulate another successful upload
    console.log("[3/4] Simulating another successful upload log...");
    await logToGoogleSheets('INFO', 'ResumeUploaderTest', 'Resume uploaded successfully', {
      fileName: 'charlie_brown_resume.pdf',
      status: 'SUCCESS',
      fileSize: '800 KB'
    });

    // 4. Simulate a final summary log (like the mass processing script does)
    console.log("[4/4] Simulating batch summary log...");
    await logToGoogleSheets('INFO', 'BatchProcessorTest', 'Batch Upload Simulation Complete', {
      totalProcessed: 3,
      success: 2,
      failed: 1,
      notes: 'Included 1 failed file to test error logging.'
    });

    console.log("\n✅ All test logs sent to Google Sheets webhook.");
    console.log("👉 Please check your Google Sheet to verify that the failed upload was recorded alongside the successful ones!");

  } catch (err) {
    console.error("❌ Test script encountered an error:", err.message);
  }
}

testSheetLogging();

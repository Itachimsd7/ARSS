/**
 * removeDuplicates.js
 *
 * One-time script to clean up duplicate candidates already in MongoDB.
 * Keeps the OLDEST entry for each duplicate group (by email or fileName).
 *
 * Run once:
 *   node scripts/removeDuplicates.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const Candidate = require('../models/Candidate')

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arss_db')
  console.log('Connected to MongoDB\n')

  let totalRemoved = 0

  // ── Strategy 1: Deduplicate by fileHash (exact same file uploaded twice) ───
  console.log('Checking for duplicate file hashes...')
  const hashDupes = await Candidate.aggregate([
    { $match: { fileHash: { $exists: true, $ne: '' } } },
    { $group: { _id: '$fileHash', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ])

  for (const group of hashDupes) {
    // Sort oldest first, keep first, delete the rest
    const sorted = await Candidate.find({ _id: { $in: group.ids } }).sort({ createdAt: 1 })
    const toDelete = sorted.slice(1).map((c) => c._id)
    await Candidate.deleteMany({ _id: { $in: toDelete } })
    console.log(`  Removed ${toDelete.length} duplicate(s) for hash ${group._id.slice(0, 16)}...`)
    totalRemoved += toDelete.length
  }

  // ── Strategy 2: Deduplicate by email (same person submitted multiple times) ─
  console.log('\nChecking for duplicate emails...')
  const emailDupes = await Candidate.aggregate([
    { $match: { email: { $exists: true, $ne: '' } } },
    { $group: { _id: '$email', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ])

  for (const group of emailDupes) {
    const sorted = await Candidate.find({ _id: { $in: group.ids } }).sort({ createdAt: 1 })
    const toDelete = sorted.slice(1).map((c) => c._id)
    await Candidate.deleteMany({ _id: { $in: toDelete } })
    console.log(`  Removed ${toDelete.length} duplicate(s) for email: ${group._id}`)
    totalRemoved += toDelete.length
  }

  // ── Strategy 3: Deduplicate by gmailMessageId ────────────────────────────
  console.log('\nChecking for duplicate Gmail message IDs...')
  const gmailDupes = await Candidate.aggregate([
    { $match: { gmailMessageId: { $exists: true, $ne: '' } } },
    { $group: { _id: '$gmailMessageId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ])

  for (const group of gmailDupes) {
    const sorted = await Candidate.find({ _id: { $in: group.ids } }).sort({ createdAt: 1 })
    const toDelete = sorted.slice(1).map((c) => c._id)
    await Candidate.deleteMany({ _id: { $in: toDelete } })
    console.log(`  Removed ${toDelete.length} duplicate(s) for Gmail message: ${group._id}`)
    totalRemoved += toDelete.length
  }

  console.log(`\n✅  Done. Total duplicates removed: ${totalRemoved}`)

  const remaining = await Candidate.countDocuments()
  console.log(`📊  Candidates remaining in database: ${remaining}`)

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})

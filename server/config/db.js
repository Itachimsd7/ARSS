/**
 * server/config/db.js — MongoDB connection setup using Mongoose.
 * ================================================================
 *
 * PURPOSE:
 *   Establishes the connection between the Node.js server and MongoDB.
 *   Called once at server startup from server/index.js.
 *
 * HOW IT WORKS:
 *   - Uses Mongoose (an ODM — Object Document Mapper) to connect to MongoDB.
 *   - Mongoose provides schema-based data modeling and query helpers.
 *   - If the connection fails (e.g., MongoDB is not running), the server exits
 *     immediately — there's no point running without a database.
 *
 * CONFIGURATION:
 *   Set MONGODB_URI in server/.env to point to your MongoDB instance.
 *   Default: mongodb://localhost:27017/arss_db (local MongoDB, database "arss_db")
 *
 * CALLED BY:
 *   server/index.js → connectDB()
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI from environment variable
    // Falls back to local MongoDB if MONGODB_URI is not set
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/arss_db'
    );

    // Log which host we connected to (useful for debugging cloud vs local)
    console.log(`MongoDB connected: ${conn.connection.host}`);

  } catch (error) {
    // If connection fails, log the error and kill the process.
    // The server cannot function without a database connection.
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // exit with error code 1 (abnormal termination)
  }
};

module.exports = connectDB;

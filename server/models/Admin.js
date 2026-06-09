/**
 * server/models/Admin.js — Mongoose Schema for the Admin user.
 * ==============================================================
 *
 * PURPOSE:
 *   Defines the data structure for admin accounts in MongoDB.
 *   There is typically only ONE admin account for this system.
 *
 * SECURITY FEATURES:
 *   - Passwords are NEVER stored in plain text.
 *   - Before saving, the password is hashed using bcrypt with a salt factor of 12.
 *   - bcrypt is a one-way hash — you can't reverse it to get the original password.
 *   - Login verification uses bcrypt.compare() which re-hashes and compares.
 *
 * HOW PASSWORD HASHING WORKS:
 *   1. Admin sets password "myPassword123"
 *   2. bcrypt generates a random "salt" (extra random string)
 *   3. bcrypt hashes (password + salt) 2^12 = 4096 times
 *   4. Stores: "$2b$12$randomSaltHere...hashedOutput..."
 *   5. On login: bcrypt.compare("myPassword123", storedHash) → true/false
 *
 * FIELDS:
 *   - email: unique admin email (used as login username)
 *   - password: bcrypt-hashed password
 *   - name: display name shown in the dashboard
 *   - lastLogin: timestamp of last successful login
 *   - createdAt, updatedAt: auto-managed by Mongoose (timestamps: true)
 *
 * USED BY:
 *   server/routes/auth.js — login, me, logout
 *   server/middleware/auth.js — token verification
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs'); // bcryptjs is a pure JS implementation of bcrypt

// ── Schema Definition ─────────────────────────────────────────────────────────
const adminSchema = new mongoose.Schema(
  {
    email: {
      type:     String,
      required: true,  // must be provided
      unique:   true,  // no two admins with same email (DB-level enforcement)
      lowercase: true, // automatically convert to lowercase before saving
      trim:     true,  // remove leading/trailing whitespace
    },
    password: {
      type:      String,
      required:  true,
      minlength: 6,    // minimum 6 characters (enforced by Mongoose before save)
    },
    name: {
      type:    String,
      default: 'Admin', // default display name if not specified
    },
    lastLogin: {
      type: Date, // timestamp of last login — updated on every successful login
    },
  },
  {
    timestamps: true, // Mongoose automatically adds createdAt and updatedAt fields
  }
);

// ── Pre-Save Hook: Hash the password ─────────────────────────────────────────
// This runs automatically BEFORE every .save() call on an Admin document.
// It only hashes if the password field has been modified (avoids double-hashing).
adminSchema.pre('save', async function (next) {
  // Skip hashing if the password hasn't changed
  // (e.g., updating lastLogin shouldn't re-hash the existing hash)
  if (!this.isModified('password')) return next();

  // Generate a salt with cost factor 12
  // Higher = more secure but slower. 12 is a good balance.
  const salt = await bcrypt.genSalt(12);

  // Hash the plain-text password with the salt
  this.password = await bcrypt.hash(this.password, salt);

  next(); // continue with saving
});

// ── Instance Method: Compare password ────────────────────────────────────────
// Called during login to check if the provided password matches the stored hash.
// Returns true if they match, false if not.
adminSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare hashes candidatePassword using the same salt
  // embedded in this.password and compares the results
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the model — Mongoose will use the 'admins' collection in MongoDB
module.exports = mongoose.model('Admin', adminSchema);

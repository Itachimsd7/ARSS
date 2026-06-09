/**
 * server/middleware/auth.js — JWT Authentication Middleware.
 * ===========================================================
 *
 * PURPOSE:
 *   Protects admin-only API routes by verifying the JSON Web Token (JWT)
 *   sent in the request's Authorization header.
 *
 * HOW JWT AUTHENTICATION WORKS:
 *   1. Admin logs in via POST /api/auth/admin/login
 *   2. Server verifies credentials and returns a signed JWT token
 *   3. Client (React app) stores the token in localStorage
 *   4. For every subsequent request to a protected route, the client
 *      sends the token in the header: "Authorization: Bearer <token>"
 *   5. This middleware intercepts the request, extracts the token,
 *      verifies it cryptographically, and attaches the admin to req.admin
 *   6. If verification fails, it returns 401 Unauthorized and stops the request
 *
 * USAGE:
 *   Applied to any route that requires admin authentication:
 *   router.use(protect)           — applies to all routes in a router
 *   router.get('/stats', protect, handler) — applies to a single route
 *
 * CALLED BY:
 *   server/routes/admin.js  — all routes
 *   server/routes/auth.js   — /me and /logout routes
 *   server/routes/config.js — PUT /requirements route
 */

const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * protect — Express middleware that verifies JWT and authenticates admin.
 *
 * Flow:
 *   1. Extract token from "Authorization: Bearer <token>" header
 *   2. If no token → 401 response
 *   3. Verify token signature using JWT_SECRET
 *   4. Look up admin by ID from the decoded token payload
 *   5. If admin not found → 401 response (account was deleted)
 *   6. Attach admin object to req.admin for use in route handlers
 *   7. Call next() to proceed to the actual route handler
 */
const protect = async (req, res, next) => {
  let token;

  // Extract the token from the Authorization header
  // Expected format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    // Split "Bearer <token>" and take the second part
    token = req.headers.authorization.split(' ')[1];
  }

  // No token provided — request is not authenticated
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.',
    });
  }

  try {
    // Verify the token using the secret key from .env
    // jwt.verify() decodes AND validates the signature
    // If the token is tampered with or expired, it throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'arss_secret');

    // decoded.id contains the admin's MongoDB _id (set during login)
    // Fetch the admin from DB and exclude the password field
    req.admin = await Admin.findById(decoded.id).select('-password');

    // Edge case: token is valid but admin account was deleted from DB
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found.',
      });
    }

    // Authentication successful — pass control to the next middleware/route handler
    next();

  } catch (error) {
    // Token is invalid (wrong signature) or expired
    return res.status(401).json({
      success: false,
      message: 'Token invalid or expired.',
    });
  }
};

module.exports = { protect };

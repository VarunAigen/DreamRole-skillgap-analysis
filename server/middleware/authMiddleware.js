const { firebaseAuth } = require('./firebaseAuth');

/**
 * Authentication Middleware — Production
 * 
 * DEPRECATED: This module now delegates to firebaseAuth middleware.
 * Kept for backward compatibility with routes that import { protect }.
 * All routes should migrate to using firebaseAuth() directly.
 */
const protect = firebaseAuth();

module.exports = { protect };

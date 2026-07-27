const admin = require('firebase-admin');

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
    // In production: use a service account JSON file or env vars
    // In development: relies on GOOGLE_APPLICATION_CREDENTIALS env var
    // OR pass serviceAccount object if FIREBASE_SERVICE_ACCOUNT_JSON is set
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
            : null;

        admin.initializeApp({
            credential: serviceAccount
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('✅ Firebase Admin SDK initialized');
    } catch (err) {
        console.warn('⚠️  Firebase Admin SDK not initialized (missing credentials):', err.message);
    }
}

const ADMIN_EMAILS = new Set([
    'varun1973s@gmail.com'
]);

/**
 * Middleware: verifies Firebase ID token from Authorization header.
 * On success: sets req.user = { uid, email, name, role }
 * On failure: returns 401 (or if allowGuest=true, continues as anonymous)
 */
function firebaseAuth(allowGuest = false) {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            if (allowGuest) {
                req.user = null;
                return next();
            }
            return res.status(401).json({ error: 'Unauthorized — no token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const decoded = await admin.auth().verifyIdToken(token);
            const userEmail = (decoded.email || '').toLowerCase();
            const role = ADMIN_EMAILS.has(userEmail) ? 'admin' : (decoded.role || 'student');

            req.user = {
                uid: decoded.uid,
                email: decoded.email || '',
                name: decoded.name || decoded.email || 'User',
                role: role,
                picture: decoded.picture || null
            };
            next();
        } catch (err) {
            if (allowGuest) {
                req.user = null;
                return next();
            }
            return res.status(401).json({ error: 'Unauthorized — invalid or expired token', details: err.message });
        }
    };
}

/**
 * Guard: requires req.user.role === 'admin'
 * Must be used AFTER firebaseAuth().
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden — admin access required' });
    }
    next();
}

/**
 * Guard: requires req.user.role === 'mentor' OR 'admin'
 */
function requireMentor(req, res, next) {
    if (!req.user || !['mentor', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden — mentor access required' });
    }
    next();
}

module.exports = { firebaseAuth, requireAdmin, requireMentor, admin };

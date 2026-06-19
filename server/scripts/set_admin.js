require('dotenv').config();
const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : null;

    admin.initializeApp({
        credential: serviceAccount
            ? admin.credential.cert(serviceAccount)
            : admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

async function setAdminRole(email) {
    if (!email) {
        console.error('Please specify an email address. Example: node set_admin.js user@example.com');
        process.exit(1);
    }

    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
        console.log(`✅ Success! Custom claim { role: 'admin' } set for user: ${email} (UID: ${user.uid})`);
    } catch (err) {
        console.error('Error setting admin role:', err.message);
    }
    process.exit(0);
}

// Get email from command line argument
const emailArg = process.argv[2];
setAdminRole(emailArg);

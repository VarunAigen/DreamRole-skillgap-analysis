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

async function listUsers() {
    try {
        const listResult = await admin.auth().listUsers(1000);
        console.log('--- Firebase Users ---');
        listResult.users.forEach(u => {
            console.log(`UID: ${u.uid} | Email: ${u.email} | Name: ${u.displayName} | Claims:`, u.customClaims);
        });
    } catch (err) {
        console.error('Error listing users:', err.message);
    }
    process.exit(0);
}

listUsers();

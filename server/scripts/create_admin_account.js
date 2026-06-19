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

const db = admin.firestore();

async function createAdmin() {
    const email = 'admin@dreamrole.com';
    const password = 'AdminPassword123!';
    const name = 'Admin User';

    try {
        // Check if user already exists
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
            console.log(`User ${email} already exists. Updating password and claims...`);
            await admin.auth().updateUser(user.uid, { password, displayName: name });
        } catch (authErr) {
            if (authErr.code === 'auth/user-not-found') {
                user = await admin.auth().createUser({
                    email,
                    password,
                    displayName: name,
                    emailVerified: true
                });
                console.log(`Created new Firebase Auth user: ${email}`);
            } else {
                throw authErr;
            }
        }

        // Set custom claims
        await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
        console.log(`Set custom claim { role: 'admin' } for: ${email}`);

        // Set Firestore user profile doc
        const ref = db.collection('users').doc(user.uid);
        await ref.set({
            name,
            email,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            photo_url: '',
            role: 'admin' // storing it in Firestore as well for query ease
        }, { merge: true });
        console.log(`Saved Firestore user profile for: ${email}`);

        console.log('\n=============================================');
        console.log('🎉 Admin Account Ready!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('=============================================');

    } catch (err) {
        console.error('Error creating admin account:', err.message);
    }
    process.exit(0);
}

createAdmin();

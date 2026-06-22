import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCigL53niTf4L56OXtxwqnEl8Te8iOvGWI",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dreamrole-8cb52.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dreamrole-8cb52",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dreamrole-8cb52.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "248598014634",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:248598014634:web:7dbf9a01b4ea207daa3ed3",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HX3SFN2SRP"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export default app

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyCigL53niTf4L56OXtxwqnEl8Te8iOvGWI",
    authDomain: "dreamrole-8cb52.firebaseapp.com",
    projectId: "dreamrole-8cb52",
    storageBucket: "dreamrole-8cb52.firebasestorage.app",
    messagingSenderId: "248598014634",
    appId: "1:248598014634:web:7dbf9a01b4ea207daa3ed3",
    measurementId: "G-HX3SFN2SRP"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export default app

import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDonvUuDjHH9HJ8Nv6jXDA5rK3AlW3eB-c",
  authDomain: "oasis-duothan.firebaseapp.com",
  projectId: "oasis-duothan",
  storageBucket: "oasis-duothan.firebasestorage.app",
  messagingSenderId: "352189618557",
  appId: "1:352189618557:web:a066b4acf91a9c0ce39414"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

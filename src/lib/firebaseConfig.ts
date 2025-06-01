
// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// TODO: Replace these with your actual Firebase project configuration details!
// You can find these in your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyB4PhuGBYe8F2-3kCe69iyFzhIKJBaZi78", // Updated API Key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your Firebase Auth Domain
  projectId: "YOUR_PROJECT_ID", // Replace with your Firebase Project ID
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace with your Firebase Storage Bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Firebase Messaging Sender ID
  appId: "YOUR_APP_ID", // Replace with your Firebase App ID
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace with your Firebase Measurement ID
};

let app: FirebaseApp;

// Initialize Firebase only if it hasn't been initialized yet
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Use the existing app if already initialized
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };

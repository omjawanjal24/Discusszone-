
// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// TODO: Replace these with your actual Firebase project configuration details!
// You can find these in your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyCf9HIGRbBh6-RuPFymGe4sj7BqZfKmlHc",
  authDomain: "cogent-dragon-460015-a8.firebaseapp.com",
  projectId: "cogent-dragon-460015-a8",
  storageBucket: "cogent-dragon-460015-a8.firebasestorage.app",
  messagingSenderId: "923402381047",
  appId: "1:923402381047:web:bb3bdb9b9182876dbc95f2",
  measurementId: "G-S5EM2Q9XLQ"
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


// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// VERY IMPORTANT: Ensure these values EXACTLY match your Firebase project's configuration.
// You can find these in your Firebase project settings (Gear icon -> Project settings -> General tab -> Your apps -> SDK setup and configuration -> Config).
const firebaseConfig = {
  apiKey: "AIzaSyCf9HIGRbBh6-RuPFymGe4sj7BqZfKmlHc",
  authDomain: "cogent-dragon-460015-a8.firebaseapp.com",
  projectId: "cogent-dragon-460015-a8",
  // Corrected storageBucket format to the more common .appspot.com.
  // Please verify this value (and all others) against YOUR Firebase project console.
  storageBucket: "cogent-dragon-460015-a8.appspot.com",
  messagingSenderId: "923402381047",
  appId: "1:923402381047:web:bb3bdb9b9182876dbc95f2",
  measurementId: "G-S5EM2Q9XLQ"
};

// Diagnostic log: Check if these values match your Firebase project in the console.
console.log("FirebaseConfig.ts: Initializing with projectId:", firebaseConfig.projectId);
console.log("FirebaseConfig.ts: Full config being used:", JSON.stringify(firebaseConfig, null, 2));

let app: FirebaseApp;

// Initialize Firebase only if it hasn't been initialized yet
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("FirebaseConfig.ts: Firebase app initialized for the first time.");
} else {
  app = getApp(); // Use the existing app if already initialized
  console.log("FirebaseConfig.ts: Using existing Firebase app instance.");
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };

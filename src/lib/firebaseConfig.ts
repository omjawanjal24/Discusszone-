
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
  storageBucket: "cogent-dragon-460015-a8.appspot.com",
  messagingSenderId: "923402381047",
  appId: "1:923402381047:web:bb3bdb9b9182876dbc95f2",
  measurementId: "G-S5EM2Q9XLQ"
};

// --- CRITICAL DIAGNOSTIC CHECK ---
let hasPlaceholder = false;
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (typeof value === 'string' && (value.includes("YOUR_") || value === "" || value.includes("example") || value.includes("placeholder"))) {
    console.error(`FirebaseConfig.ts: CRITICAL ERROR - Placeholder or invalid value detected for config key: "${key}". Value: "${value}". YOU MUST REPLACE THIS with the actual value from your Firebase project settings.`);
    hasPlaceholder = true;
  }
}

if (hasPlaceholder) {
  console.error("FirebaseConfig.ts: ABORTING Firebase initialization due to placeholder values. Please correct your src/lib/firebaseConfig.ts file with details from your Firebase project console.");
  // To prevent Firebase from attempting to initialize with bad config,
  // we effectively stop further processing here if placeholders are found.
  // This is a drastic measure for debugging. In a real app, you might handle this differently.
  // For now, we'll let it try to initialize so Firebase can throw its specific error,
  // but the console error above should be very clear.
} else {
  console.log("FirebaseConfig.ts: All Firebase config values appear to be filled. Proceeding with initialization.");
}

// Diagnostic log: Check if these values match your Firebase project in the console.
console.log("FirebaseConfig.ts: Initializing with projectId:", firebaseConfig.projectId);
console.log("FirebaseConfig.ts: Full config being used by initializeApp:", JSON.stringify(firebaseConfig, null, 2));


let app: FirebaseApp;

// Initialize Firebase only if it hasn't been initialized yet
if (!getApps().length) {
  console.log("FirebaseConfig.ts: Attempting to initialize Firebase app for the first time...");
  try {
    app = initializeApp(firebaseConfig);
    console.log("FirebaseConfig.ts: Firebase app initialized successfully.");
  } catch (e: any) {
    console.error("FirebaseConfig.ts: ERROR DURING initializeApp:", e.message, e);
    // If initializeApp itself fails, we rethrow to make it obvious.
    // This error (auth/configuration-not-found) usually happens later, when auth methods are called.
    throw e; 
  }
} else {
  app = getApp(); // Use the existing app if already initialized
  console.log("FirebaseConfig.ts: Using existing Firebase app instance.");
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };

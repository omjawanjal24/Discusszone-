
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
  storageBucket: "cogent-dragon-460015-a8.firebasestorage.app",
  messagingSenderId: "923402381047",
  appId: "1:923402381047:web:bb3bdb9b9182876dbc95f2",
  measurementId: "G-S5EM2Q9XLQ"
};

// --- CRITICAL DIAGNOSTIC CHECK ---
let hasPlaceholder = false;
const crucialKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];

for (const key of crucialKeys) {
  const value = firebaseConfig[key];
  if (typeof value === 'string' && (value.includes("YOUR_") || value === "" || value.includes("example") || value.includes("placeholder") || value.length < 5)) { // Added length check for very short, likely invalid, values
    console.error(`FirebaseConfig.ts: CRITICAL ERROR - Placeholder or invalid/short value detected for config key: "${key}". Value: "${value}". YOU MUST REPLACE THIS with the actual value from your Firebase project settings.`);
    hasPlaceholder = true;
  }
}

if (hasPlaceholder) {
  console.error("FirebaseConfig.ts: ABORTING Firebase initialization due to placeholder or invalid values. Please correct your src/lib/firebaseConfig.ts file with details from your Firebase project console.");
  // To prevent Firebase from attempting to initialize with bad config,
  // we effectively stop further processing here if placeholders are found.
} else {
  console.log("FirebaseConfig.ts: All Firebase config values appear to be filled and pass basic placeholder checks. Proceeding with initialization attempt.");
}

// Diagnostic log: Check if these values match your Firebase project in the console.
console.log("FirebaseConfig.ts: Initializing with projectId:", firebaseConfig.projectId);
console.log("FirebaseConfig.ts: Full config being used by initializeApp:", JSON.stringify(firebaseConfig, null, 2));


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase only if it hasn't been initialized yet
if (!getApps().length) {
  console.log("FirebaseConfig.ts: Attempting to initialize Firebase app for the first time...");
  if (hasPlaceholder) {
    // This case should ideally not be reached if the UI properly stops, but as a fallback:
    const errorMsg = "FirebaseConfig.ts: Firebase initialization halted due to placeholder values. Please check console for details.";
    alert(errorMsg); // Also alert to make it very visible
    throw new Error(errorMsg);
  }
  try {
    app = initializeApp(firebaseConfig);
    console.log("FirebaseConfig.ts: Firebase app initialized successfully.");
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e: any) {
    console.error("FirebaseConfig.ts: ERROR DURING Firebase initializeApp:", e.message, e);
    if (e.code === 'auth/configuration-not-found' || (e.message && e.message.includes('auth/configuration-not-found'))) {
        const detailedErrorMsg = `FirebaseConfig.ts: Firebase initialization failed with 'auth/configuration-not-found'.
        This means the configuration object (apiKey, authDomain, projectId, etc.) in src/lib/firebaseConfig.ts
        does NOT match a valid Firebase project setup.

        PLEASE VERY CAREFULLY:
        1. Go to your Firebase project console.
        2. Navigate to Project Settings > General tab > Your apps > SDK setup and configuration.
        3. Compare EVERY value there (apiKey, authDomain, projectId, storageBucket, appId, messagingSenderId)
           with the values logged above as "Full config being used by initializeApp".
        4. Ensure there are NO typos and that all values are copied exactly.
        5. Ensure the project ID listed is for an ACTIVE and CORRECTLY SETUP Firebase project.

        The values currently in your firebaseConfig.ts are:
        apiKey: "${firebaseConfig.apiKey}"
        authDomain: "${firebaseConfig.authDomain}"
        projectId: "${firebaseConfig.projectId}"
        storageBucket: "${firebaseConfig.storageBucket}"
        messagingSenderId: "${firebaseConfig.messagingSenderId}"
        appId: "${firebaseConfig.appId}"

        Fix these values in src/lib/firebaseConfig.ts and retry.`;
      console.error(detailedErrorMsg);
      alert(detailedErrorMsg.substring(0, 500) + "... (See console for full details)"); // Alert for high visibility
    } else {
      alert("FirebaseConfig.ts: An unexpected error occurred during Firebase initialization. Check the console. Error: " + e.message);
    }
    // Re-throw the original error to stop further app execution if Firebase doesn't initialize
    throw e;
  }
} else {
  app = getApp(); // Use the existing app if already initialized
  console.log("FirebaseConfig.ts: Using existing Firebase app instance.");
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };



// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";

// --- CRITICAL: THESE VALUES MUST EXACTLY MATCH YOUR FIREBASE PROJECT'S CONFIGURATION ---
// --- Make sure this is YOUR project's config from the Firebase Console. ---
// --- Project settings > General > Your apps > SDK setup and configuration > Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCf9HIGRbBh6-RuPFymGe4sj7BqZfKmlHc",
  authDomain: "cogent-dragon-460015-a8.firebaseapp.com",
  projectId: "cogent-dragon-460015-a8",
  storageBucket: "cogent-dragon-460015-a8.appspot.com", // Changed to .appspot.com
  messagingSenderId: "923402381047",
  appId: "1:923402381047:web:bb3bdb9b9182876dbc95f2",
  measurementId: "G-S5EM2Q9XLQ"
};

// --- Diagnostic Logging & Placeholder Checks ---
console.log("FirebaseConfig.ts: Attempting to initialize with this configuration:", JSON.stringify(firebaseConfig, null, 2));

const essentialKeys: (keyof typeof firebaseConfig)[] = ["apiKey", "authDomain", "projectId", "appId", "messagingSenderId", "storageBucket"];
let hasPlaceholders = false;
for (const key of essentialKeys) {
  const value = firebaseConfig[key];
  // Basic check for placeholders or clearly invalid short values (e.g., less than 5 chars for most IDs/keys)
  if (!value || value.includes("YOUR_") || value.includes("XXXX") || value.length < 5) {
    const errorMessage = `FirebaseConfig.ts: CRITICAL ERROR - Placeholder or invalid value detected for config key: '${key}'. Value: '${value}'. Please replace it with your actual Firebase project credential in src/lib/firebaseConfig.ts.`;
    console.error(errorMessage);
    if (typeof window !== "undefined") {
      alert(errorMessage); // Make it very visible in the browser
    }
    hasPlaceholders = true;
  }
}

// Specific check if the default template project ID and API key are still being used.
// These are the exact values from the template this project was based on.
if (firebaseConfig.projectId === "cogent-dragon-460015-a8" && firebaseConfig.apiKey === "AIzaSyCf9HIGRbBh6-RuPFymGe4sj7BqZfKmlHc") {
    const defaultWarning = `FirebaseConfig.ts: WARNING - The Firebase configuration appears to be using the default template values for projectId AND apiKey.
    Project ID: ${firebaseConfig.projectId}
    API Key: ${firebaseConfig.apiKey}
    If these are NOT your actual credentials for an active project named 'cogent-dragon-460015-a8',
    you MUST replace them with YOUR OWN project's credentials from the Firebase Console (Project settings > General > Your apps > SDK setup and configuration > Config).
    Using incorrect values will lead to 'auth/configuration-not-found' or other connection errors.`;
    console.warn(defaultWarning);
    // It's okay if these ARE the actual credentials for a project named "cogent-dragon-460015-a8", but this warning is a strong reminder to double-check.
}


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

if (hasPlaceholders) {
  const placeholderErrorMsg = "FirebaseConfig.ts: Firebase initialization HALTED due to placeholder or invalid values in the configuration. Please fix them in src/lib/firebaseConfig.ts and reload.";
  console.error(placeholderErrorMsg);
  if (typeof window !== "undefined") {
    alert(placeholderErrorMsg);
  }
  // Intentionally make app unusable if config is bad
  // @ts-ignore
  app = undefined; 
  // @ts-ignore
  auth = undefined;
  // @ts-ignore
  db = undefined;
} else {
  try {
    if (!getApps().length) {
      console.log("FirebaseConfig.ts: No Firebase apps initialized. Initializing new app with projectId:", firebaseConfig.projectId);
      app = initializeApp(firebaseConfig);
      console.log("FirebaseConfig.ts: Firebase app initialized successfully.");
    } else {
      app = getApp();
      console.log("FirebaseConfig.ts: Using existing Firebase app instance with projectId:", app.options.projectId);
    }

    // Initialize Auth and Firestore AFTER successful app initialization
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize Analytics if in a browser environment
    if (typeof window !== 'undefined') {
        try {
            analytics = getAnalytics(app);
            console.log("FirebaseConfig.ts: Firebase Analytics initialized.");
        } catch (analyticsError: any) {
            console.warn("FirebaseConfig.ts: Firebase Analytics initialization failed. This is often non-critical.", analyticsError.message);
            analytics = null; // Ensure analytics is null if it fails
        }
    } else {
      console.log("FirebaseConfig.ts: Analytics not initialized (not in browser environment).");
    }

  } catch (error: any) {
    console.error("FirebaseConfig.ts: CRITICAL ERROR DURING FIREBASE INITIALIZATION:", error.message, error.code, error);

    let alertMessage = `FirebaseConfig.ts: A critical error occurred during Firebase initialization.
Error Code: ${error.code || 'N/A'}
Error Message: ${error.message || 'Unknown error'}

This usually means the 'firebaseConfig' object in 'src/lib/firebaseConfig.ts' has incorrect, incomplete, or placeholder values.
The configuration object that was attempted is:
${JSON.stringify(firebaseConfig, null, 2)}

PLEASE VERY CAREFULLY:
1. Go to your Firebase project console (for project ID: ${firebaseConfig.projectId}).
2. Navigate to Project Settings > General tab > Your apps > SDK setup and configuration.
3. Compare EVERY value there (apiKey, authDomain, projectId, etc.)
   with the values printed above (and in your 'src/lib/firebaseConfig.ts' file).
4. Ensure there are NO typos and that all values are copied exactly from your Firebase project.
5. Ensure the project ID listed (${firebaseConfig.projectId}) is for an ACTIVE and CORRECTLY SETUP Firebase project.

Fix these values in 'src/lib/firebaseConfig.ts' and reload the page.`;

    if (error.code === 'auth/configuration-not-found' || (error.message && error.message.toLowerCase().includes('configuration-not-found'))) {
        alertMessage = `FirebaseConfig.ts: Firebase initialization failed with 'auth/configuration-not-found'.
        This strongly indicates the configuration object in src/lib/firebaseConfig.ts
        (apiKey: "${firebaseConfig.apiKey}", authDomain: "${firebaseConfig.authDomain}", projectId: "${firebaseConfig.projectId}", etc.)
        does NOT match a valid and active Firebase project setup for project ID '${firebaseConfig.projectId}'.

        PLEASE VERY CAREFULLY:
        1. Go to your Firebase project console.
        2. Ensure you are looking at the project with ID: '${firebaseConfig.projectId}'.
        3. Navigate to Project Settings > General tab > Your apps > SDK setup and configuration.
        4. Compare EVERY value there with the values in your 'src/lib/firebaseConfig.ts' file.
        The values currently in your firebaseConfig.ts that were attempted are:
        apiKey: "${firebaseConfig.apiKey}"
        authDomain: "${firebaseConfig.authDomain}"
        projectId: "${firebaseConfig.projectId}"
        storageBucket: "${firebaseConfig.storageBucket}"
        messagingSenderId: "${firebaseConfig.messagingSenderId}"
        appId: "${firebaseConfig.appId}"
        measurementId: "${firebaseConfig.measurementId || 'N/A'}"
        5. Ensure there are NO typos and that all values are copied exactly from YOUR Firebase project ('${firebaseConfig.projectId}').
        6. Ensure the project ID listed is for an ACTIVE and CORRECTLY SETUP Firebase project.
        7. In Firebase Console > Authentication > Sign-in method: Ensure 'Email/Password' provider is ENABLED.
        8. In Google Cloud Console (for project ${firebaseConfig.projectId}) > APIs & Services > Library: Ensure 'Identity Toolkit API' is ENABLED.

        Fix these values in 'src/lib/firebaseConfig.ts' and reload the page.`;
    }

    if (typeof window !== "undefined") {
      const preStyle = "font-family: monospace; white-space: pre-wrap; padding: 10px; background-color: #fff0f0; border: 1px solid red; color: red;";
      console.log("%c" + alertMessage.replace(/<br\s*\/?>/gi, "\\n"), preStyle);
      alert(alertMessage.substring(0, 1000) + (alertMessage.length > 1000 ? "\\n...(see console for full details)" : ""));
    }

    // Intentionally make app unusable if config is bad
    // @ts-ignore
    app = undefined; 
    // @ts-ignore
    auth = undefined;
    // @ts-ignore
    db = undefined;
    analytics = null; // Ensure analytics is null if it fails
  }
}

export { app, auth, db, analytics };

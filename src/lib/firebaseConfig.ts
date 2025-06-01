
// src/lib/firebaseConfig.ts
// Last updated with user-provided config: 2024-08-21T10:15:00.000Z 
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, Timestamp } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";

// --- Configuration provided by the user ---
// THIS CONFIGURATION WAS LAST DIRECTLY PROVIDED BY THE USER.
// ENSURE THESE VALUES EXACTLY MATCH YOUR FIREBASE PROJECT'S CONFIGURATION
// FROM THE FIREBASE CONSOLE (Project settings > General > Your apps > SDK setup and configuration > Config).
const firebaseConfig = {
  apiKey: "AIzaSyCf9HIGRbBh6-RuPFymGe4sj7BqZfKmlHc",
  authDomain: "cogent-dragon-460015-a8.firebaseapp.com",
  projectId: "cogent-dragon-460015-a8",
  storageBucket: "cogent-dragon-460015-a8.firebasestorage.app",
  messagingSenderId: "923402381047",
  appId: "1:923402381047:web:074980ae75c2b81fbc95f2",
  measurementId: "G-J0FBKM72XN"
};

// --- Diagnostic Logging & Placeholder Checks ---
console.log("FirebaseConfig.ts: Attempting to initialize with this configuration:", JSON.stringify(firebaseConfig, null, 2));

const essentialKeys: (keyof typeof firebaseConfig)[] = ["apiKey", "authDomain", "projectId", "appId", "messagingSenderId", "storageBucket"];
let hasPlaceholders = false;
for (const key of essentialKeys) {
  const value = firebaseConfig[key];
  if (!value || value.includes("YOUR_") || value.includes("XXXX") || value.length < 10 && key !== 'measurementId') {
    const errorMessage = `FirebaseConfig.ts: CRITICAL ERROR - Placeholder or potentially invalid/short value detected for config key: '${key}'. Value: '${value}'. Please replace it with your actual Firebase project credential in src/lib/firebaseConfig.ts.`;
    console.error(errorMessage);
    if (typeof window !== "undefined") {
      alert(errorMessage);
    }
    hasPlaceholders = true;
  }
}

// Check storageBucket and projectId consistency
if (firebaseConfig.storageBucket && firebaseConfig.projectId) {
    const expectedStorageBucketAppspot = firebaseConfig.projectId + ".appspot.com";
    const expectedStorageBucketFirebaseStorage = firebaseConfig.projectId + ".firebasestorage.app";
    const expectedStorageBucketFirebaseStorageWithApp = firebaseConfig.projectId + ".app.firebasestorage.app";

    if (firebaseConfig.storageBucket.endsWith(".appspot.com") && firebaseConfig.storageBucket !== expectedStorageBucketAppspot) {
        console.warn(`FirebaseConfig.ts: WARNING - storageBucket '${firebaseConfig.storageBucket}' uses '.appspot.com' but doesn't directly match projectId '${expectedStorageBucketAppspot}'. This might be okay if custom, but often it's an error.`);
    } else if (firebaseConfig.storageBucket.endsWith(".firebasestorage.app")) {
        if (firebaseConfig.storageBucket !== expectedStorageBucketFirebaseStorage && firebaseConfig.storageBucket !== expectedStorageBucketFirebaseStorageWithApp) {
             console.warn(`FirebaseConfig.ts: WARNING - storageBucket '${firebaseConfig.storageBucket}' uses '.firebasestorage.app' but doesn't match expected formats: '${expectedStorageBucketFirebaseStorage}' or '${expectedStorageBucketFirebaseStorageWithApp}'. This might be okay if custom, but often it's an error.`);
        }
    }
}


let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
let analytics: Analytics | null = null;

if (hasPlaceholders) {
  const placeholderErrorMsg = "FirebaseConfig.ts: Firebase initialization HALTED due to placeholder or invalid values in the configuration. Please fix them in src/lib/firebaseConfig.ts and reload.";
  console.error(placeholderErrorMsg);
  if (typeof window !== "undefined") {
    alert(placeholderErrorMsg);
  }
  // Services will remain undefined
} else {
  try {
    if (!getApps().length) {
      console.log("FirebaseConfig.ts: No Firebase apps initialized. Initializing new app with projectId:", firebaseConfig.projectId);
      app = initializeApp(firebaseConfig);
      console.log("FirebaseConfig.ts: Firebase app initialized successfully. Full config used by initializeApp:", JSON.stringify(app.options, null, 2));
    } else {
      const existingApp = getApp();
      console.log("FirebaseConfig.ts: Using existing Firebase app instance. Current app projectId:", existingApp.options.projectId, "Attempted config projectId:", firebaseConfig.projectId);

      if (existingApp.options.projectId !== firebaseConfig.projectId ||
          existingApp.options.appId !== firebaseConfig.appId ||
          existingApp.options.apiKey !== firebaseConfig.apiKey
         ) {
        console.warn("FirebaseConfig.ts: WARNING - An existing Firebase app instance has different critical configuration values (projectId, appId, or apiKey) than the current firebaseConfig. This can lead to major issues. Attempting to initialize a secondary app instance. If this is not intended, review your setup. Existing App Options:", JSON.stringify(existingApp.options, null, 2), "New Config:", JSON.stringify(firebaseConfig, null, 2));
        try {
            const secondaryAppName = `secondary_app_${firebaseConfig.projectId}_${Date.now()}`;
            app = initializeApp(firebaseConfig, secondaryAppName);
            console.log(`FirebaseConfig.ts: Secondary Firebase app '${secondaryAppName}' initialized successfully due to config mismatch. Full config used:`, JSON.stringify(app.options, null, 2));
        } catch (secondaryAppError: any) {
            console.error(`FirebaseConfig.ts: CRITICAL ERROR trying to initialize as a secondary app after config mismatch. Primary App ProjectID: ${existingApp.options.projectId}, New Config ProjectID: ${firebaseConfig.projectId}. Error:`, secondaryAppError);
            const alertMessage = `FirebaseConfig.ts: CRITICAL ERROR during secondary Firebase app initialization due to config mismatch.
Original App ProjectID: ${existingApp.options.projectId}
New Config ProjectID: ${firebaseConfig.projectId}
Error: ${secondaryAppError.message || 'Unknown error'}
This is highly unusual. Check if multiple Firebase instances are being managed or if your configuration is truly correct for the primary app.`;
            if (typeof window !== "undefined") alert(alertMessage);
            app = undefined;
        }
      } else {
         console.log("FirebaseConfig.ts: Existing app's critical config values match current config. Re-using instance. Full config details:", JSON.stringify(existingApp.options, null, 2));
         app = existingApp;
      }
    }

    if (app) {
        auth = getAuth(app);
        console.log("FirebaseConfig.ts: Firebase Auth initialized.");
        db = getFirestore(app);
        console.log("FirebaseConfig.ts: Firebase Firestore initialized.");

        if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
            try {
                analytics = getAnalytics(app);
                console.log("FirebaseConfig.ts: Firebase Analytics initialized.");
            } catch (analyticsError: any) {
                console.warn("FirebaseConfig.ts: Firebase Analytics initialization failed. This is often non-critical. Error:", analyticsError.message || analyticsError);
                analytics = null;
            }
        } else {
          console.log("FirebaseConfig.ts: Analytics not initialized (not in browser environment or no measurementId).");
        }
    } else {
        console.error("FirebaseConfig.ts: Firebase app 'app' is undefined after initialization logic. Auth, Firestore, and Analytics cannot be initialized.");
        if(typeof window !== "undefined") alert("FirebaseConfig.ts: Firebase app object is undefined. Core services cannot start. Check console for earlier errors related to initializeApp().");
    }

  } catch (error: any) {
    console.error("FirebaseConfig.ts: CRITICAL ERROR DURING FIREBASE INITIALIZATION STAGE:", error);
    let alertMessage = `FirebaseConfig.ts: A critical error occurred during Firebase initialization.
Error Code: ${error.code || 'N/A'}
Error Message: ${error.message || 'Unknown error'}

This usually means the 'firebaseConfig' object in 'src/lib/firebaseConfig.ts' has incorrect, incomplete, or placeholder values, OR your Firebase project '${firebaseConfig.projectId}' is not correctly set up.

The configuration object that was attempted is:
${JSON.stringify(firebaseConfig, null, 2)}

PLEASE VERY CAREFULLY:
1. Go to your Firebase project console (for project ID: ${firebaseConfig.projectId}).
2. Navigate to Project Settings > General tab > Your apps > SDK setup and configuration.
3. Compare EVERY value there (apiKey, authDomain, projectId, etc.) with the values printed above (and in your 'src/lib/firebaseConfig.ts' file). Ensure there are NO typos.
4. Ensure the project ID '${firebaseConfig.projectId}' is for an ACTIVE and CORRECTLY SETUP Firebase project.
5. In Firebase Console > Authentication > Sign-in method: Ensure 'Email/Password' provider is ENABLED.
6. In Google Cloud Console (for project ${firebaseConfig.projectId}) > APIs & Services > Library: Ensure 'Identity Toolkit API' is ENABLED.
7. Check your browser's network tab for failing requests to Firebase services.

Fix any discrepancies in 'src/lib/firebaseConfig.ts' or your Firebase project settings and reload the page.`;

    if (error.code === 'auth/configuration-not-found' || (error.message && error.message.toLowerCase().includes('configuration-not-found'))) {
        alertMessage = `FirebaseConfig.ts: Firebase initialization failed with 'auth/configuration-not-found'.
This STRONGLY indicates the configuration object in src/lib/firebaseConfig.ts:
${JSON.stringify(firebaseConfig, null, 2)}
does NOT match a valid and active Firebase project setup for project ID '${firebaseConfig.projectId}', OR that project is not correctly configured for authentication.

PLEASE VERY CAREFULLY:
1. Go to your Firebase project console.
2. Ensure you are looking at the project with ID: '${firebaseConfig.projectId}'.
3. Navigate to Project Settings > General tab > Your apps > SDK setup and configuration.
4. Compare EVERY value there with the values in your 'src/lib/firebaseConfig.ts' file (shown above).
5. Ensure there are NO typos and that all values are copied exactly from YOUR Firebase project ('${firebaseConfig.projectId}').
6. Ensure the project ID listed is for an ACTIVE and CORRECTLY SETUP Firebase project.
7. In Firebase Console (project '${firebaseConfig.projectId}') > Authentication > Sign-in method: Ensure 'Email/Password' provider is ENABLED.
8. In Google Cloud Console (for project ${firebaseConfig.projectId}) > APIs & Services > Library: Ensure 'Identity Toolkit API' is ENABLED.

Fix these values in 'src/lib/firebaseConfig.ts' or your Firebase project settings and reload the page.`;
    }

    if (typeof window !== "undefined") {
      const preStyle = "font-family: monospace; white-space: pre-wrap; padding: 10px; background-color: #fff0f0; border: 1px solid red; color: red;";
      console.log("%c" + alertMessage.replace(/<br\s*\/?>/gi, "\n"), preStyle);
      alert(alertMessage.substring(0, 1000) + (alertMessage.length > 1000 ? "\n...(see console for full details)" : ""));
    }
    // @ts-ignore
    app = undefined;
    // @ts-ignore
    auth = undefined;
    // @ts-ignore
    db = undefined;
    analytics = null;
  }
}

export { app, auth, db, analytics, Timestamp };
    
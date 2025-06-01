
// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// --- CRITICAL: THESE VALUES MUST EXACTLY MATCH YOUR FIREBASE PROJECT'S CONFIGURATION ---
// You can find these in your Firebase project settings (Gear icon -> Project settings -> General tab -> Your apps -> SDK setup and configuration -> Config).
// If the values below are the defaults from the template, they WILL NOT WORK.
// REPLACE THEM WITH YOUR ACTUAL PROJECT CREDENTIALS.
const firebaseConfig = {
  apiKey: "AIzaSyCf9HIGRbBh6-RuPFymGe4sj7BqZfKmlHc", // Replace with YOUR actual apiKey from Firebase Console
  authDomain: "cogent-dragon-460015-a8.firebaseapp.com", // Replace with YOUR actual authDomain
  projectId: "cogent-dragon-460015-a8", // Replace with YOUR actual projectId
  storageBucket: "cogent-dragon-460015-a8.appspot.com", // Replace with YOUR actual storageBucket (usually ends .appspot.com)
  messagingSenderId: "923402381047", // Replace with YOUR actual messagingSenderId
  appId: "1:923402381047:web:bb3bdb9b9182876dbc95f2", // Replace with YOUR actual appId
  measurementId: "G-S5EM2Q9XLQ" // Optional: Replace if you use Analytics, otherwise can be omitted
};

// Log the configuration that will be used for initialization.
// CRITICAL STEP: After the app reloads, open your browser's developer console.
// Verify these logged values EXACTLY match your Firebase project console.
console.log("FirebaseConfig.ts: Using the following configuration for Firebase initialization:", JSON.stringify(firebaseConfig, null, 2));

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    console.log("FirebaseConfig.ts: Attempting to initialize Firebase app...");
    app = initializeApp(firebaseConfig);
    console.log("FirebaseConfig.ts: Firebase app initialized successfully with projectId:", app.options.projectId);
  } else {
    app = getApp();
    console.log("FirebaseConfig.ts: Using existing Firebase app instance with projectId:", app.options.projectId);
  }
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error: any) {
  console.error("FirebaseConfig.ts: CRITICAL ERROR DURING FIREBASE INITIALIZATION:", error.message, error.code, error);
  
  let alertMessage = `FirebaseConfig.ts: A critical error occurred during Firebase initialization.
Error Code: ${error.code || 'N/A'}
Error Message: ${error.message || 'Unknown error'}

This usually means the 'firebaseConfig' object in 'src/lib/firebaseConfig.ts' has incorrect or incomplete values.

PLEASE VERY CAREFULLY:
1. Go to your Firebase project console.
2. Navigate to Project Settings > General tab > Your apps > SDK setup and configuration.
3. Compare EVERY value there (apiKey, authDomain, projectId, etc.)
   with the values logged in your browser console just before this alert (under "Using the following configuration...").
4. Ensure there are NO typos and that all values are copied exactly from your Firebase project.
5. Ensure the project ID listed is for an ACTIVE and CORRECTLY SETUP Firebase project.

The values currently in your firebaseConfig.ts that were attempted are printed in the console.
Please fix them in 'src/lib/firebaseConfig.ts' and reload the page.`;

  if (error.code === 'auth/configuration-not-found' || (error.message && error.message.toLowerCase().includes('configuration-not-found'))) {
      alertMessage = `FirebaseConfig.ts: Firebase initialization failed with 'auth/configuration-not-found'.
      This strongly indicates the configuration object (apiKey, authDomain, projectId, etc.) in src/lib/firebaseConfig.ts
      does NOT match a valid and active Firebase project setup.

      PLEASE VERY CAREFULLY:
      1. Go to your Firebase project console.
      2. Navigate to Project Settings > General tab > Your apps > SDK setup and configuration.
      3. Compare EVERY value there (apiKey, authDomain, projectId, storageBucket, appId, messagingSenderId)
         with the values logged in your browser console just before this alert (under "Using the following configuration...").
      4. Ensure there are NO typos and that all values are copied exactly from YOUR Firebase project.
      5. Ensure the project ID listed is for an ACTIVE and CORRECTLY SETUP Firebase project.

      Fix these values in 'src/lib/firebaseConfig.ts' and reload the page.`;
  }
  
  // Make the alert extremely visible
  const preStyle = "font-family: monospace; white-space: pre-wrap; padding: 10px; background-color: #fff0f0; border: 1px solid red; color: red;";
  console.log("%c" + alertMessage.replace(/<br\s*\/?>/gi, "\n"), preStyle); // Log formatted message to console too
  alert(alertMessage.substring(0, 800) + (alertMessage.length > 800 ? "\n...(see console for full details)" : "")); // Show alert

  // Re-throw the error to stop further app execution if Firebase doesn't initialize
  throw error;
}

export { app, auth, db };

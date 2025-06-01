// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// --- IMPORTANT: Configure your service account credentials ---
// You need to provide your Firebase service account credentials to this SDK.
// This is typically done via environment variables.
//
// How to get your service account key:
// 1. Go to your Firebase Console (https://console.firebase.google.com/).
// 2. Select your project (cogent-dragon-460015-a8).
// 3. Click the gear icon next to "Project Overview" and go to "Project settings".
// 4. Go to the "Service accounts" tab.
// 5. Click the "Generate new private key" button and confirm. A JSON file will be downloaded.
//    KEEP THIS FILE SECURE. DO NOT COMMIT IT TO YOUR REPOSITORY.

// --- Option 1: Using GOOGLE_APPLICATION_CREDENTIALS environment variable (Recommended) ---
// Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the *absolute path*
// of your downloaded service account JSON file.
// Example for a .env.local file (if serviceAccountKey.json is in your project root):
// GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
// (Ensure serviceAccountKey.json is in .gitignore)

// --- Option 2: Using individual environment variables ---
// If your hosting environment prefers individual variables, you can set these:
// FIREBASE_PROJECT_ID="your-project-id-from-the-json-file"
// FIREBASE_CLIENT_EMAIL="your-client-email-from-the-json-file"
// FIREBASE_PRIVATE_KEY="your-private-key-from-the-json-file-ensure-newlines-are-correctly-handled"
//
// When copying FIREBASE_PRIVATE_KEY from the JSON, ensure that the `\n` characters
// are preserved as actual newlines in your environment variable value.
// For example, in a .env file, you might need to enclose it in double quotes:
// FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_PART_1\nYOUR_KEY_PART_2\n-----END PRIVATE KEY-----\n"

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handles escaped newlines
};

let initialized = false;

if (!admin.apps.length) {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      initialized = true;
      console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
    } else if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      initialized = true;
      console.log('Firebase Admin SDK initialized using individual FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
    } else {
      console.warn(
        'Firebase Admin SDK NOT INITIALIZED. Missing required environment variables. \nPlease set either GOOGLE_APPLICATION_CREDENTIALS OR (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY). \nRefer to src/lib/firebaseAdmin.ts for instructions.'
      );
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    console.error('Detailed error stack:', error.stack);
    console.error('Ensure your service account credentials are set correctly as environment variables. Project ID from client config:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not Set (Client Side)');
    // Do not re-throw, allow app to continue if admin features are not critical for all parts.
    // The `adminAuth` and `adminDb` exports will be null if initialization fails.
  }
} else {
  initialized = true; // Already initialized
  console.log('Firebase Admin SDK already initialized.');
}

// Export null if not initialized to allow for graceful degradation
export const adminAuth = initialized ? admin.auth() : null;
export const adminDb = initialized ? admin.firestore() : null;
export const adminApp = initialized ? admin.app() : null;

/**
 * Verifies a Firebase ID token.
 * @param token The Firebase ID token to verify.
 * @returns A promise that resolves with the decoded ID token if successful.
 * @throws Throws an error if the Admin SDK is not initialized or if token verification fails.
 */
export async function verifyFirebaseIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  if (!adminAuth) {
    console.error('Attempted to verify ID token, but Firebase Admin SDK is not initialized.');
    throw new Error('Firebase Admin SDK not initialized. Cannot verify ID token.');
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    // You might want to throw a more specific error or handle different error codes
    throw new Error('Invalid or expired Firebase ID token.');
  }
}

// You can add more admin utility functions here as needed.
// For example, a function to get user details by UID:
// export async function getAdminUser(uid: string): Promise<admin.auth.UserRecord | null> {
//   if (!adminAuth) {
//     console.warn('Firebase Admin SDK not initialized. Cannot get user.');
//     return null;
//   }
//   try {
//     const userRecord = await adminAuth.getUser(uid);
//     return userRecord;
//   } catch (error) {
//     console.error(`Error fetching user ${uid} with Admin SDK:`, error);
//     return null;
//   }
// }

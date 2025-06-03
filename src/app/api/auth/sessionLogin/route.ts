
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, SESSION_COOKIE_NAME, SESSION_COOKIE_EXPIRES_IN, adminDb } from '@/lib/firebaseAdmin';
import type { User } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

// Check Admin SDK initialization status when the module loads or is first accessed
if (!adminAuth || !adminDb) {
    console.error(
        `CRITICAL_ADMIN_SDK_INIT_FAILURE: API Route /api/auth/sessionLogin
        Firebase Admin SDK (adminAuth or adminDb) is not initialized.
        This means the Firebase Admin SDK failed to initialize in src/lib/firebaseAdmin.ts.
        This is typically due to missing or incorrect Firebase service account credentials (environment variables).
        Please check your server logs when the application STARTS for messages from 'src/lib/firebaseAdmin.ts' for details.
        Ensure GOOGLE_APPLICATION_CREDENTIALS or (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY) are correctly set in your server's environment.
        Login cannot proceed without a properly initialized Admin SDK.`
    );
}

export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    // The detailed log above would have already printed to server console on first access if uninitialized.
    // This specific log confirms it at the time of request handling.
    console.error('/api/auth/sessionLogin: Firebase Admin SDK not initialized at the time of POST request.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized. Cannot process login.' }, { status: 500 });
  }

  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    
    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_EXPIRES_IN });

    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_COOKIE_EXPIRES_IN / 1000, // maxAge is in seconds
      path: '/',
      sameSite: 'lax',
    });

    // Fetch user profile from Firestore to return to client
    // This ensures the client has the latest profile data upon login
    const userDocRef = adminDb.collection('users').doc(decodedIdToken.uid);
    const userDocSnap = await userDocRef.get();

    let userProfile: User | null = null;
    if (userDocSnap.exists()) {
      const profileData = userDocSnap.data() as any; // Cast to any to handle Timestamp
      userProfile = {
        uid: decodedIdToken.uid,
        email: decodedIdToken.email || null,
        isVerified: decodedIdToken.email_verified || false,
        prn: profileData.prn,
        gender: profileData.gender,
        role: profileData.role,
        isAdmin: profileData.isAdmin || decodedIdToken.email === process.env.ADMIN_EMAIL, // Re-check admin email
        avatarUrl: profileData.avatarUrl || decodedIdToken.picture,
        // Convert Firestore Timestamp to Date or ISO string if necessary
        createdAt: profileData.createdAt instanceof Timestamp ? profileData.createdAt.toDate() : (typeof profileData.createdAt === 'string' ? new Date(profileData.createdAt) : undefined),
      };
    } else {
        // This case should ideally not happen if user is signing in after signup
        // or if profile exists. Handle as a minimal profile.
        console.warn(`/api/auth/sessionLogin: User profile not found in Firestore for UID: ${decodedIdToken.uid}. This is unexpected during login.`);
        userProfile = {
            uid: decodedIdToken.uid,
            email: decodedIdToken.email || null,
            isVerified: decodedIdToken.email_verified || false,
            isAdmin: decodedIdToken.email === process.env.ADMIN_EMAIL,
        };
    }

    return NextResponse.json({ status: 'success', user: userProfile }, { status: 200 });

  } catch (error: any) {
    console.error('/api/auth/sessionLogin Error:', error);
    let message = 'Internal server error';
    if (error.message.includes('ID token') || error.message.includes('session cookie')) {
        message = 'Invalid or expired token. Please try logging in again.';
    }
    return NextResponse.json({ error: message, details: error.message }, { status: 401 });
  }
}

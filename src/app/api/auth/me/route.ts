
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb, verifySessionCookie, SESSION_COOKIE_NAME } from '@/lib/firebaseAdmin';
import type { User } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    console.error('/api/auth/me: Firebase Admin SDK not initialized.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized. Cannot authenticate.' }, { status: 500 });
  }

  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ user: null, error: 'No session cookie found' }, { status: 401 });
  }

  try {
    const decodedClaims = await verifySessionCookie(sessionCookie);
    // Session cookie is valid. Fetch user profile from Firestore.
    const userDocRef = adminDb.collection('users').doc(decodedClaims.uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists()) {
      const profileData = userDocSnap.data() as any; // Cast to any to handle Timestamp
      const user: User = {
        uid: decodedClaims.uid,
        email: decodedClaims.email || null,
        isVerified: decodedClaims.email_verified || false,
        prn: profileData.prn,
        gender: profileData.gender,
        role: profileData.role,
        isAdmin: profileData.isAdmin || decodedClaims.email === process.env.ADMIN_EMAIL, // Re-check admin email
        avatarUrl: profileData.avatarUrl || decodedClaims.picture,
        createdAt: profileData.createdAt instanceof Timestamp ? profileData.createdAt.toDate() : (typeof profileData.createdAt === 'string' ? new Date(profileData.createdAt) : undefined),
      };
      return NextResponse.json({ user }, { status: 200 });
    } else {
      // User exists in Firebase Auth (session cookie valid) but no profile in Firestore.
      // This is an inconsistent state. Log out the user by clearing cookie.
      console.warn(`/api/auth/me: User profile not found in Firestore for UID: ${decodedClaims.uid}, though session cookie is valid. Clearing session.`);
      cookieStore.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return NextResponse.json({ user: null, error: 'User profile not found, session cleared.' }, { status: 401 });
    }
  } catch (error) {
    // Session cookie is invalid or expired.
    console.log('/api/auth/me: Session cookie verification failed or expired:', error);
    cookieStore.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' }); // Clear invalid cookie
    return NextResponse.json({ user: null, error: 'Invalid or expired session' }, { status: 401 });
  }
}

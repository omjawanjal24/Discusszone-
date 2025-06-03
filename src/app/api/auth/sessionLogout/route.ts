
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, SESSION_COOKIE_NAME, verifySessionCookie } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  if (!adminAuth) {
    console.error('/api/auth/sessionLogout: Firebase Admin SDK not initialized.');
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized. Cannot process logout.' }, { status: 500 });
  }
  
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const decodedClaims = await verifySessionCookie(sessionCookie, false); // checkRevoked = false for logout
      await adminAuth.revokeRefreshTokens(decodedClaims.sub); // Revoke tokens for the user
    } catch (error) {
      // Cookie might be invalid or expired, or user tokens already revoked.
      // Proceed to clear cookie anyway.
      console.warn('/api/auth/sessionLogout: Error revoking refresh tokens or verifying session cookie (might be expected if already invalid):', error);
    }
  }
  
  // Clear the session cookie by setting it to an empty value and maxAge to 0
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
  });

  return NextResponse.json({ status: 'success' }, { status: 200 });
}

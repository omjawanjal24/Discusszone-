
"use client";

import type { User } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/validation';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth, db, Timestamp as ClientTimestamp } from '@/lib/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseClientSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  getIdToken,
} from 'firebase/auth';
import { doc, setDoc, getDoc, type DocumentSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  signup: (signupData: SignupFormValues) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'om.jawanjal@mitwpu.edu.in';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserSession = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          console.log("AuthContext: User session data refreshed from /api/auth/me:", data.user.email);
        } else {
          setUser(null);
          console.log("AuthContext: No active user session found via /api/auth/me.");
        }
      } else {
        setUser(null);
        console.warn("AuthContext: /api/auth/me call failed or returned no user. Status:", res.status);
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user session from /api/auth/me:", error);
      setUser(null);
      toast({ title: "Session Check Error", description: "Could not verify your session with the server.", variant: "warning" });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [toast, router]); // Removed setUser, setLoading as they are stable. Router added for potential use.

  useEffect(() => {
    fetchUserSession(true); // Fetch session on initial mount
  }, [fetchUserSession]);

  useEffect(() => {
    if (!auth) { // Ensure Firebase client auth is initialized
        console.warn("AuthContext: Firebase client auth not available for onAuthStateChanged listener.");
        return;
    }

    const unsubscribeClientAuth = onAuthStateChanged(auth, async (clientAuthUser: FirebaseUser | null) => {
      if (loading) return; // Wait for initial server session load to complete

      const serverSessionUser = user; // User state from server session

      console.log("AuthContext (onAuthStateChanged): Client Firebase auth state changed. Client User:", clientAuthUser?.email, "Server Session User:", serverSessionUser?.email);

      if (clientAuthUser && !serverSessionUser) {
        // Client has a user, server session doesn't.
        // This could happen if cookie expired/cleared, or login process didn't complete server session.
        // Re-check server session. If still no user, they might need to login to establish it.
        console.log("AuthContext (onAuthStateChanged): Client user present, server session absent. Re-checking server session.");
        await fetchUserSession();
      } else if (!clientAuthUser && serverSessionUser) {
        // No client user (e.g., token revoked, signed out elsewhere), but server session thinks user is logged in.
        // This is a clear desync. Trust client state and log out server session.
        console.log("AuthContext (onAuthStateChanged): Client user absent, server session present. Forcing logout.");
        await logout(); // This clears server cookie, client state, and redirects.
      } else if (clientAuthUser && serverSessionUser && clientAuthUser.uid !== serverSessionUser.uid) {
        // Client and server session are for different users. Major desync. Force logout.
        console.log("AuthContext (onAuthStateChanged): Client and server session UIDs mismatch. Forcing logout.");
        await logout();
      }
      // If clientAuthUser and serverSessionUser match (or both are null), the state is consistent. No action needed.
    });

    return () => unsubscribeClientAuth();
  }, [loading, user, fetchUserSession, logout]); // Dependencies for reacting to changes in these states/functions

  const login = useCallback(async (credentials: LoginFormValues) => {
    if (!auth) {
      toast({ title: "Authentication Error", description: "Firebase Auth (client) not initialized.", variant: "destructive" });
      throw new Error("Firebase Auth (client) not initialized.");
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const idToken = await getIdToken(userCredential.user);

      const res = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        toast({ title: "Login Successful!", description: `Welcome back, ${data.user.email}!` });
        const queryParams = new URLSearchParams(window.location.search);
        const redirectUrl = queryParams.get('redirect');
        router.push(redirectUrl || '/booking');
      } else {
        const errorData = await res.json();
        toast({ title: "Login Failed", description: errorData.error || "Could not establish server session.", variant: "destructive" });
        await firebaseClientSignOut(auth);
        throw new Error(errorData.error || "Could not establish server session.");
      }
    } catch (error: any) {
      console.error("Login process error:", error);
      let message = "An unexpected error occurred during login.";
      if (error.code?.startsWith("auth/")) {
        message = error.message;
      } else if (error.message) {
        message = error.message;
      }
      toast({ title: "Login Failed", description: message, variant: "destructive" });
      throw error;
    }
  }, [router, toast]);

  const signup = useCallback(async (signupData: SignupFormValues) => {
    if (!auth || !db) {
      toast({ title: "Service Error", description: "Firebase services not fully initialized.", variant: "destructive" });
      throw new Error("Firebase services not fully initialized.");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      const firebaseUser = userCredential.user;

      const userProfileForDb: Omit<User, 'isVerified' | 'uid' | 'createdAt'> & { createdAt: any } = {
        email: firebaseUser.email,
        prn: signupData.prn,
        gender: signupData.gender,
        role: signupData.role,
        isAdmin: signupData.email === ADMIN_EMAIL,
        avatarUrl: '',
        createdAt: ClientTimestamp.fromDate(new Date()),
      };
      
      await setDoc(doc(db, "users", firebaseUser.uid), userProfileForDb);
      console.log("AuthContext: User profile created in Firestore for UID:", firebaseUser.uid);

      const idToken = await getIdToken(firebaseUser);
      const res = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        toast({ title: "Signup Successful!", description: "Account created and session started." });
        router.push('/booking');
      } else {
        const errorData = await res.json();
        toast({ title: "Signup Session Failed", description: errorData.error || "Could not start session after signup.", variant: "warning" });
        router.push('/login'); 
        throw new Error(errorData.error || "Could not start session after signup.");
      }
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      let message = "Could not create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        message = "This email address is already in use. Please try logging in or use a different email.";
      } else if (error.message) {
        message = error.message;
      }
      toast({ title: "Signup Failed", description: message, variant: "destructive" });
      throw error;
    }
  }, [router, toast]);

  const logout = useCallback(async () => {
    // Immediately update UI to reflect logout, then perform async operations
    setUser(null); 
    if (auth) {
        firebaseClientSignOut(auth).catch(err => console.warn("AuthContext: Firebase client signOut error on logout:", err));
    }
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
      console.log("AuthContext: Server session logout successful.");
    } catch (error) {
      console.error("AuthContext: Error calling /api/auth/sessionLogout:", error);
    }
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }, [router, toast]); // auth is stable, setUser is stable

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      signup,
      loading,
      isAuthenticated: !!user && !loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

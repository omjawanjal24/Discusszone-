
"use client";

import type { User } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/validation';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth, db, Timestamp as ClientTimestamp } from '@/lib/firebaseConfig'; // Renamed Timestamp to ClientTimestamp
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseClientSignOut, // Renamed signOut to avoid conflict
  onAuthStateChanged,
  type User as FirebaseUser,
  getIdToken,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  signup: (signupData: SignupFormValues) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'om.jawanjal@mitwpu.edu.in'; // Consider moving to .env if it can change

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          console.log("AuthContext: User session restored from backend:", data.user.email);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
        // No toast here, as it's a normal state if no session exists
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user session:", error);
      setUser(null);
      toast({ title: "Session Check Error", description: "Could not verify your session.", variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUserSession();

    // Optional: Listen to Firebase client auth state changes for cross-tab sync or external events
    // This is secondary to the session cookie now.
    const unsubscribeClientAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!loading) { // Only react if initial session load is complete
        if (!firebaseUser && user) {
          // Firebase client signed out (e.g., token revoked, user deleted), but server session might exist.
          // Force a re-check of server session.
          console.log("AuthContext (onAuthStateChanged): Firebase client user logged out. Re-checking server session.");
          await fetchUserSession();
        } else if (firebaseUser && !user) {
          // Firebase client has a user, but server session check (/api/auth/me) didn't find one.
          // This could mean cookie expired or was cleared. User might need to log in again.
          // Or, try to create a session if ID token is fresh. For simplicity, we'll rely on explicit login for now.
           console.log("AuthContext (onAuthStateChanged): Firebase client user detected, but no server session. User may need to re-login to establish server session.");
        }
      }
    });
    
    return () => {
      unsubscribeClientAuth();
    };
  }, [fetchUserSession, loading, user]);


  const login = useCallback(async (credentials: LoginFormValues) => {
    if (!auth) {
      toast({ title: "Authentication Error", description: "Firebase Auth (client) not initialized.", variant: "destructive" });
      return Promise.reject(new Error("Firebase Auth (client) not initialized."));
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
        setUser(data.user); // Set user from backend response
        toast({ title: "Login Successful!", description: `Welcome back, ${data.user.email}!` });
        const queryParams = new URLSearchParams(window.location.search);
        const redirectUrl = queryParams.get('redirect');
        router.push(redirectUrl || '/booking');
      } else {
        const errorData = await res.json();
        toast({ title: "Login Failed", description: errorData.error || "Could not establish session.", variant: "destructive" });
        await firebaseClientSignOut(auth); // Sign out client if backend session failed
        return Promise.reject(new Error(errorData.error || "Could not establish session."));
      }
    } catch (error: any) {
      console.error("Login process error:", error);
      let message = error.message || "An unexpected error occurred during login.";
      if (error.code && error.code.startsWith("auth/")) { // Firebase client auth errors
        message = error.message;
      }
      toast({ title: "Login Failed", description: message, variant: "destructive" });
      return Promise.reject(error);
    }
  }, [router, toast]);

  const signup = useCallback(async (signupData: SignupFormValues) => {
    if (!auth || !db) {
      toast({ title: "Service Error", description: "Firebase services not fully initialized.", variant: "destructive" });
      return Promise.reject(new Error("Firebase services not fully initialized."));
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      const firebaseUser = userCredential.user;

      const userProfileForDb: Omit<User, 'isVerified' | 'uid'> & { createdAt: any } = { // Use 'any' for createdAt temporarily for Firestore Admin vs Client Timestamp
        email: firebaseUser.email,
        prn: signupData.prn,
        gender: signupData.gender,
        role: signupData.role,
        isAdmin: signupData.email === ADMIN_EMAIL,
        avatarUrl: '', // Default or generated avatar URL
        createdAt: ClientTimestamp.fromDate(new Date()), // Use client Timestamp for client-side setDoc
      };
      
      // Save profile to Firestore using client SDK
      await setDoc(doc(db, "users", firebaseUser.uid), userProfileForDb);
      console.log("AuthContext: User profile created in Firestore for UID:", firebaseUser.uid);

      // After signup, automatically log in to create session cookie
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
        // User is created in Firebase Auth & DB, but session cookie failed. They might need to log in manually.
        router.push('/login'); 
        return Promise.reject(new Error(errorData.error || "Could not start session after signup."));
      }
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      let message = error.message || "Could not create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        message = "This email address is already in use. Please try logging in or use a different email.";
      }
      toast({ title: "Signup Failed", description: message, variant: "destructive" });
      return Promise.reject(error);
    }
  }, [router, toast]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/sessionLogout', { method: 'POST' });
    } catch (error) {
      console.error("AuthContext: Error calling /api/auth/sessionLogout:", error);
      // Continue with client-side logout anyway
    }
    
    if (auth) {
      try {
        await firebaseClientSignOut(auth);
      } catch (error: any) {
        console.error("Firebase client signOut error:", error);
        // Non-critical if backend logout succeeded
      }
    }
    setUser(null); // Clear user state immediately
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }, [router, toast]);

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

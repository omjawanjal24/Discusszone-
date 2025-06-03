
"use client";

import type { User } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/validation';
import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
    if (isInitialLoad) { // Only set loading on initial load call
        setLoading(true);
    }
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const firestoreUserDocSnap = await getDoc(doc(db, "users", data.user.uid));
          let userToSet = data.user;
          if (firestoreUserDocSnap.exists()) {
            const profileData = firestoreUserDocSnap.data();
            userToSet = {
              ...data.user,
              prn: profileData.prn,
              gender: profileData.gender,
              role: profileData.role,
              avatarUrl: profileData.avatarUrl || data.user.avatarUrl,
              createdAt: profileData.createdAt instanceof ClientTimestamp ? profileData.createdAt.toDate() : (typeof profileData.createdAt === 'string' ? new Date(profileData.createdAt) : undefined),
            };
            console.log(`AuthContext: User session for ${userToSet.email} refreshed. Served from cache: ${firestoreUserDocSnap.metadata.fromCache}`);
          } else {
            console.warn(`AuthContext: User ${data.user.email} found in session, but profile NOT FOUND in Firestore. Using session data only.`);
          }
          setUser(userToSet);
        } else {
          setUser(null);
          console.log("AuthContext: No active user session found via /api/auth/me.");
        }
      } else {
        setUser(null);
        const errorText = await res.text();
        console.warn(`AuthContext: /api/auth/me call failed or returned no user. Status: ${res.status}, Response: ${errorText}`);
      }
    } catch (error) {
      console.error("AuthContext: Error during fetchUserSession:", error);
      setUser(null);
      toast({ 
        title: "Session Check Error", 
        description: "Could not connect to the server to verify your session.", 
        variant: "warning" 
      });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [router, toast]); // router for potential redirects if session is invalid, toast for messages

  useEffect(() => {
    fetchUserSession(true);
  }, [fetchUserSession]);

  // Core logout logic, depends on router, toast, and user (for logging previous email)
  const _logoutCore = useCallback(async () => {
    const previousUserEmail = user?.email;
    setUser(null);
    setLoading(true);

    if (auth && auth.currentUser) {
      try {
        await firebaseClientSignOut(auth);
        console.log("AuthContext: Firebase client signOut successful for", previousUserEmail || "user");
      } catch (err) {
        console.warn("AuthContext: Firebase client signOut error on logout:", err);
      }
    } else {
      console.log("AuthContext: No Firebase client user to sign out or auth not ready.");
    }

    try {
      const res = await fetch('/api/auth/sessionLogout', { method: 'POST' });
      if (res.ok) {
        console.log("AuthContext: Server session logout successful for", previousUserEmail || "user");
      } else {
        console.warn("AuthContext: Server session logout call failed. Status:", res.status);
      }
    } catch (error) {
      console.error("AuthContext: Error calling /api/auth/sessionLogout:", error);
    }
    
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    setLoading(false);
  }, [router, toast, user]); // user is a dependency here to capture previousUserEmail correctly

  const logoutRef = useRef(_logoutCore);

  useEffect(() => {
    logoutRef.current = _logoutCore;
  }, [_logoutCore]);

  // Stable logout function for context consumers and effects that don't need to re-run if _logoutCore changes
  const logout = useCallback(() => {
    logoutRef.current();
  }, []); // This function's identity is stable

  useEffect(() => {
    if (!auth) {
      console.warn("AuthContext: Firebase client auth not available for onAuthStateChanged listener.");
      return;
    }

    const unsubscribeClientAuth = onAuthStateChanged(auth, async (clientAuthUser: FirebaseUser | null) => {
      if (loading) {
        console.log("AuthContext (onAuthStateChanged): Initial server session load in progress, deferring client state change for:", clientAuthUser?.email);
        return;
      }

      const currentAppUser = user; // Use the current state of `user` from the outer scope

      console.log("AuthContext (onAuthStateChanged): Client Firebase auth state changed. Client User:", clientAuthUser?.email, "Current App User (from server session):", currentAppUser?.email);

      if (clientAuthUser && !currentAppUser) {
        console.log("AuthContext (onAuthStateChanged): Client user present, but no app user (server session likely expired/missing). Attempting to re-establish server session.");
        await fetchUserSession();
      } else if (!clientAuthUser && currentAppUser) {
        console.log("AuthContext (onAuthStateChanged): Client user absent (signed out/token revoked), but app user (server session) still present. Forcing full logout.");
        logoutRef.current(); // Call logout logic through ref
      } else if (clientAuthUser && currentAppUser && clientAuthUser.uid !== currentAppUser.uid) {
        console.log("AuthContext (onAuthStateChanged): Client and server session UIDs mismatch. Client:", clientAuthUser.uid, "Server:", currentAppUser.uid, ". Forcing full logout.");
        logoutRef.current(); // Call logout logic through ref
      } else if (clientAuthUser && currentAppUser && clientAuthUser.uid === currentAppUser.uid) {
        if (clientAuthUser.emailVerified !== currentAppUser.isVerified) {
           console.log("AuthContext (onAuthStateChanged): Email verification status mismatch. Updating local user from client auth state.");
           setUser(prevUser => prevUser ? ({ ...prevUser, isVerified: clientAuthUser.emailVerified || false }) : null);
        }
      }
    });

    return () => unsubscribeClientAuth();
  }, [loading, user, fetchUserSession]); // Removed 'logout' from here. 'user' is needed because the logic directly uses it.

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
        const firestoreUserDoc = await getDoc(doc(db, "users", data.user.uid));
        let fullUser = data.user;
        if (firestoreUserDoc.exists()) {
            const profileData = firestoreUserDoc.data();
            fullUser = {
              ...data.user,
              prn: profileData.prn,
              gender: profileData.gender,
              role: profileData.role,
              avatarUrl: profileData.avatarUrl || data.user.avatarUrl,
              createdAt: profileData.createdAt instanceof ClientTimestamp ? profileData.createdAt.toDate() : (typeof profileData.createdAt === 'string' ? new Date(profileData.createdAt) : undefined),
            };
        } else {
            console.warn(`AuthContext: User ${data.user.email} logged in, session created, but Firestore profile NOT FOUND.`);
        }
        setUser(fullUser);
        toast({ title: "Login Successful!", description: `Welcome back, ${fullUser.email}!` });
        
        const queryParams = new URLSearchParams(window.location.search);
        const redirectUrl = queryParams.get('redirect');
        router.push(redirectUrl || '/booking');
      } else {
        const errorData = await res.json();
        toast({ title: "Login Failed", description: errorData.error || "Could not establish server session.", variant: "destructive" });
        if (auth.currentUser) await firebaseClientSignOut(auth);
        throw new Error(errorData.error || "Could not establish server session.");
      }
    } catch (error: any) {
      console.error("Login process error:", error);
      let message = "An unexpected error occurred during login.";
      if (error.code?.startsWith("auth/")) {
        message = error.message.replace('Firebase: ','');
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

      const userProfileForDb: Omit<User, 'uid' | 'isVerified'> & { createdAt: any } = {
        email: firebaseUser.email,
        prn: signupData.prn,
        gender: signupData.gender,
        role: signupData.role,
        isAdmin: signupData.email === ADMIN_EMAIL,
        avatarUrl: firebaseUser.photoURL || '',
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
         const fullUser: User = {
          ...data.user,
          prn: userProfileForDb.prn,
          gender: userProfileForDb.gender,
          role: userProfileForDb.role,
          avatarUrl: userProfileForDb.avatarUrl,
          createdAt: userProfileForDb.createdAt.toDate(),
        };
        setUser(fullUser);
        toast({ title: "Signup Successful!", description: "Account created and session started." });
        router.push('/booking');
      } else {
        const errorData = await res.json();
        toast({ title: "Signup Session Failed", description: errorData.error || "Could not start session after signup.", variant: "warning" });
        throw new Error(errorData.error || "Could not start session after signup.");
      }
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      let message = "Could not create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        message = "This email address is already in use. Please try logging in or use a different email.";
      } else if (error.message) {
        message = error.message.replace('Firebase: ','');
      }
      toast({ title: "Signup Failed", description: message, variant: "destructive" });
      throw error;
    }
  }, [router, toast]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout, // This is the stable ref-calling wrapper
      signup,
      loading,
      isAuthenticated: !!user && !loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

    
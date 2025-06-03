
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
    if (isInitialLoad && !loading) { // Only set loading if it's truly an initial load and not already loading
        setLoading(true);
    }
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          const firestoreUserDoc = await getDoc(doc(db, "users", data.user.uid));
          if (firestoreUserDoc.exists()) {
            const profileData = firestoreUserDoc.data();
            const fullUser = {
              ...data.user, // Data from session cookie (includes isAdmin from server)
              prn: profileData.prn,
              gender: profileData.gender,
              role: profileData.role,
              avatarUrl: profileData.avatarUrl || data.user.avatarUrl, // Prefer DB avatar
              createdAt: profileData.createdAt instanceof ClientTimestamp ? profileData.createdAt.toDate() : (typeof profileData.createdAt === 'string' ? new Date(profileData.createdAt) : undefined),
            };
            setUser(fullUser);
            console.log(`AuthContext: User session for ${fullUser.email} refreshed. Served from cache: ${firestoreUserDoc.metadata.fromCache}`);
          } else {
            // User in session but no Firestore profile - potentially inconsistent state
            // Fallback to session data, but log warning
            setUser(data.user);
            console.warn(`AuthContext: User ${data.user.email} found in session, but profile NOT FOUND in Firestore. Using session data only.`);
          }
        } else {
          setUser(null);
          console.log("AuthContext: No active user session found via /api/auth/me (res.ok but no user data).");
        }
      } else {
        setUser(null);
        const errorText = await res.text();
        console.warn(`AuthContext: /api/auth/me call failed or returned no user. Status: ${res.status}, Response: ${errorText}`);
        // Do not toast here for non-OK responses like 401, as it might be expected (e.g., no session)
        // The catch block below will handle actual fetch/network errors.
      }
    } catch (error) {
      console.error("AuthContext: Error during fetchUserSession (e.g., network error, API down):", error);
      setUser(null);
      toast({ 
        title: "Session Check Error", 
        description: "Could not connect to the server to verify your session. Please check your internet connection or try again later.", 
        variant: "warning" 
      });
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [toast, loading]); // Added loading to dependencies of useCallback

  useEffect(() => {
    fetchUserSession(true); // Fetch session on initial mount
  }, [fetchUserSession]); // fetchUserSession is memoized

  useEffect(() => {
    if (!auth) {
        console.warn("AuthContext: Firebase client auth not available for onAuthStateChanged listener.");
        return;
    }

    const unsubscribeClientAuth = onAuthStateChanged(auth, async (clientAuthUser: FirebaseUser | null) => {
      if (loading) {
        // If initial server session load is still in progress, defer client auth state changes.
        // This prevents race conditions where client logs out before server confirms session.
        console.log("AuthContext (onAuthStateChanged): Initial server session load in progress, deferring client state change for:", clientAuthUser?.email);
        return;
      }

      const serverSessionUser = user; 

      console.log("AuthContext (onAuthStateChanged): Client Firebase auth state changed. Client User:", clientAuthUser?.email, "Current App User (from server session):", serverSessionUser?.email);

      if (clientAuthUser && !serverSessionUser) {
        console.log("AuthContext (onAuthStateChanged): Client user present, but no app user (server session likely expired/missing). Attempting to re-establish server session via login flow.");
        // This state can happen if server session cookie expired/cleared, or initial /api/auth/me failed.
        // User might need to "login" again to establish a new server session.
        // We could try to create a session if we have an idToken, but usually this means client is out of sync.
        // Forcing a re-fetch of server session. If it's still not there, user has to log in.
        await fetchUserSession(); // Re-check server state.
                                 // If user still null after this, they'll appear logged out, which is correct.
      } else if (!clientAuthUser && serverSessionUser) {
        console.log("AuthContext (onAuthStateChanged): Client user absent (signed out/token revoked), but app user (server session) still present. Forcing full logout.");
        await logout(); // This clears server cookie, client state, and redirects.
      } else if (clientAuthUser && serverSessionUser && clientAuthUser.uid !== serverSessionUser.uid) {
        console.log("AuthContext (onAuthStateChanged): Client and server session UIDs mismatch. Client:", clientAuthUser.uid, "Server:", serverSessionUser.uid, ". Forcing full logout.");
        await logout();
      } else if (clientAuthUser && serverSessionUser && clientAuthUser.uid === serverSessionUser.uid) {
        // Consistent state, ensure local user object has latest from client (e.g. emailVerified)
        // but prioritize data already fetched from Firestore via server session.
        if (clientAuthUser.emailVerified !== serverSessionUser.isVerified) {
           console.log("AuthContext (onAuthStateChanged): Email verification status mismatch. Updating local user from client auth state.");
           setUser(prevUser => prevUser ? ({ ...prevUser, isVerified: clientAuthUser.emailVerified || false }) : null);
        }
      }
      // If both are null, state is consistent.
    });

    return () => unsubscribeClientAuth();
  }, [loading, user, fetchUserSession, logout]); 


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
        // Fetch full profile after session login to ensure consistency
        const firestoreUserDoc = await getDoc(doc(db, "users", data.user.uid));
        if (firestoreUserDoc.exists()) {
            const profileData = firestoreUserDoc.data();
            const fullUser = {
              ...data.user, // Base user from session
              prn: profileData.prn,
              gender: profileData.gender,
              role: profileData.role,
              avatarUrl: profileData.avatarUrl || data.user.avatarUrl,
              createdAt: profileData.createdAt instanceof ClientTimestamp ? profileData.createdAt.toDate() : (typeof profileData.createdAt === 'string' ? new Date(profileData.createdAt) : undefined),
            };
            setUser(fullUser);
            toast({ title: "Login Successful!", description: `Welcome back, ${fullUser.email}!` });
        } else {
            // Should not happen if signup created the doc, but handle defensively
            setUser(data.user); 
            toast({ title: "Login Successful (Session Only)", description: `Welcome back, ${data.user.email}! Profile details might be incomplete.` , variant: "warning"});
            console.warn(`AuthContext: User ${data.user.email} logged in, session created, but Firestore profile NOT FOUND.`);
        }
        
        const queryParams = new URLSearchParams(window.location.search);
        const redirectUrl = queryParams.get('redirect');
        router.push(redirectUrl || '/booking');
      } else {
        const errorData = await res.json();
        toast({ title: "Login Failed", description: errorData.error || "Could not establish server session.", variant: "destructive" });
        if (auth.currentUser) await firebaseClientSignOut(auth); // Sign out client if server session failed
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
      throw error; // Re-throw to allow login page to handle its loading state
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

      const userProfileForDb: Omit<User, 'uid' | 'isVerified'> & { createdAt: any } = { // isVerified from firebaseUser.emailVerified
        email: firebaseUser.email,
        prn: signupData.prn,
        gender: signupData.gender,
        role: signupData.role,
        isAdmin: signupData.email === ADMIN_EMAIL,
        avatarUrl: firebaseUser.photoURL || '', // Use Firebase provided photoURL if available, else empty
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
          ...data.user, // server session provides uid, email, isAdmin, isVerified (from token)
          prn: userProfileForDb.prn,
          gender: userProfileForDb.gender,
          role: userProfileForDb.role,
          avatarUrl: userProfileForDb.avatarUrl,
          createdAt: userProfileForDb.createdAt.toDate(), // Convert client-side timestamp
        };
        setUser(fullUser);
        toast({ title: "Signup Successful!", description: "Account created and session started." });
        router.push('/booking');
      } else {
        const errorData = await res.json();
        toast({ title: "Signup Session Failed", description: errorData.error || "Could not start session after signup.", variant: "warning" });
        // Don't automatically push to login, user might want to retry or see error
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
      throw error; // Re-throw to allow signup page to handle its loading state
    }
  }, [router, toast]);

  const logout = useCallback(async () => {
    const previousUserEmail = user?.email; // For logging
    setUser(null); 
    setLoading(true); // Indicate that we are now in a loading state until logout completes

    if (auth && auth.currentUser) { // Check if auth.currentUser exists
        try {
            await firebaseClientSignOut(auth);
            console.log("AuthContext: Firebase client signOut successful for", previousUserEmail || "user");
        } catch(err) {
            console.warn("AuthContext: Firebase client signOut error on logout:", err);
        }
    } else {
        console.log("AuthContext: No Firebase client user to sign out or auth not ready.");
    }

    try {
      const res = await fetch('/api/auth/sessionLogout', { method: 'POST' });
      if(res.ok) {
        console.log("AuthContext: Server session logout successful for", previousUserEmail || "user");
      } else {
        console.warn("AuthContext: Server session logout call failed. Status:", res.status);
      }
    } catch (error) {
      console.error("AuthContext: Error calling /api/auth/sessionLogout:", error);
    }
    
    router.push('/login'); // Redirect after attempting both client and server logout
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    setLoading(false); // Logout process complete
  }, [router, toast, user]); // user dependency helps capture previousUserEmail correctly

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      signup,
      loading,
      isAuthenticated: !!user && !loading // isAuthenticated is true if user exists AND initial loading is complete
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

    
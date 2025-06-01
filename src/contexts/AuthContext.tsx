
"use client";

import type { User } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/validation';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth, db, Timestamp } from '@/lib/firebaseConfig'; // Added Timestamp
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  // sendEmailVerification, // Optional: For explicit email verification trigger
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Removed Timestamp from here

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  signup: (signupData: SignupFormValues) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the admin email address
const ADMIN_EMAIL = 'om.jawanjal@mitwpu.edu.in';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Ensure auth and db are defined before trying to use them.
    if (!auth || !db) {
      console.error("AuthContext: Firebase auth or db not initialized. Cannot set up onAuthStateChanged listener.");
      setLoading(false); // Stop loading if Firebase services are unavailable
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              isVerified: firebaseUser.emailVerified,
              prn: profileData.prn,
              gender: profileData.gender,
              role: profileData.role,
              isAdmin: profileData.isAdmin || firebaseUser.email === ADMIN_EMAIL, // Ensure admin check considers ADMIN_EMAIL
              avatarUrl: profileData.avatarUrl || firebaseUser.photoURL,
              createdAt: profileData.createdAt instanceof Timestamp ? profileData.createdAt.toDate() : profileData.createdAt,
            });
          } else {
            console.warn("User profile not found in Firestore for UID:", firebaseUser.uid, " Email:", firebaseUser.email);
            toast({
              title: "Profile Incomplete",
              description: `User profile data for ${firebaseUser.email} is missing. A minimal profile will be used.`,
              variant: "warning",
            });
            setUser({ // Fallback: set minimal user data from auth
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              isVerified: firebaseUser.emailVerified,
              isAdmin: firebaseUser.email === ADMIN_EMAIL, 
            });
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          toast({
            title: "Profile Load Error",
            description: "Could not load your full profile. Using minimal data.",
            variant: "destructive",
          });
          setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              isVerified: firebaseUser.emailVerified,
              isAdmin: firebaseUser.email === ADMIN_EMAIL,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Changed dependency array from [toast] to []

  const login = useCallback(async (credentials: LoginFormValues) => {
    if (!auth) {
      toast({ title: "Authentication Error", description: "Firebase Auth not initialized.", variant: "destructive" });
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      toast({ title: "Login Successful!", description: `Welcome back, ${userCredential.user.email}!` });
      const queryParams = new URLSearchParams(window.location.search);
      const redirectUrl = queryParams.get('redirect');
      router.push(redirectUrl || '/booking'); 
    } catch (error: any) {
      console.error("Firebase login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
    } 
  }, [router, toast]);

  const signup = useCallback(async (signupData: SignupFormValues) => {
    if (!auth || !db) { 
      toast({ title: "Service Error", description: "Firebase services not fully initialized.", variant: "destructive" });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      const firebaseUser = userCredential.user;

      const userProfile: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        prn: signupData.prn,
        gender: signupData.gender,
        role: signupData.role,
        isAdmin: signupData.email === ADMIN_EMAIL,
        isVerified: firebaseUser.emailVerified, 
        avatarUrl: '', 
        createdAt: Timestamp.fromDate(new Date()),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
      console.log("User profile created in Firestore for UID:", firebaseUser.uid);
      
      toast({ title: "Signup Successful!", description: "Account created. You are now logged in."});
      router.push('/booking'); 

    } catch (error: any) {
      console.error("Firebase signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: "Signup Failed",
          description: "This email address is already in use. Please try logging in or use a different email.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup Failed",
          description: error.message || "Could not create account. Please try again.",
          variant: "destructive",
        });
      }
    } 
  }, [router, toast]);

  const logout = useCallback(async () => {
    if (!auth) {
      toast({ title: "Authentication Error", description: "Firebase Auth not initialized.", variant: "destructive" });
      return;
    }
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive" });
    } 
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

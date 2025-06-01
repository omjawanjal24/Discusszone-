
"use client";

import type { User } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/validation';
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification, // Optional: For explicit email verification trigger
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

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
              isAdmin: profileData.isAdmin,
              avatarUrl: profileData.avatarUrl || firebaseUser.photoURL,
              createdAt: profileData.createdAt instanceof Timestamp ? profileData.createdAt.toDate() : profileData.createdAt,
            });
          } else {
            console.warn("User profile not found in Firestore for UID:", firebaseUser.uid, " Email:", firebaseUser.email);
            toast({
              title: "Profile Incomplete",
              description: `User profile data for ${firebaseUser.email} is missing. Please contact support if this persists.`,
              variant: "destructive",
            });
            setUser({ // Fallback: set minimal user data from auth
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              isVerified: firebaseUser.emailVerified,
              isAdmin: firebaseUser.email === ADMIN_EMAIL, // Fallback isAdmin check
            });
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          toast({
            title: "Profile Load Error",
            description: "Could not load your full profile. Please try again later.",
            variant: "destructive",
          });
          // If Firestore fails, set minimal user from auth to allow basic app access if auth is valid.
          setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              isVerified: firebaseUser.emailVerified,
              isAdmin: firebaseUser.email === ADMIN_EMAIL, // Fallback isAdmin check
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]); // Added toast to dependency array

  const login = useCallback(async (credentials: LoginFormValues) => {
    // setLoading(true); // Removed: onAuthStateChanged will handle loading state
    if (!auth) {
      toast({ title: "Authentication Error", description: "Firebase Auth not initialized.", variant: "destructive" });
      // setLoading(false); // Removed
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      // User state will be set by onAuthStateChanged listener.
      toast({ title: "Login Successful!", description: `Welcome back, ${userCredential.user.email}!` });
      const queryParams = new URLSearchParams(window.location.search);
      const redirectUrl = queryParams.get('redirect');
      router.push(redirectUrl || '/booking'); 
    } catch (error: any) {
      console.error("Firebase login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
    } 
    // finally { // Removed finally block for setLoading
    //   setLoading(false); 
    // }
  }, [router, toast]);

  const signup = useCallback(async (signupData: SignupFormValues) => {
    // setLoading(true); // Removed
    if (!auth || !db) { 
      toast({ title: "Service Error", description: "Firebase services not fully initialized.", variant: "destructive" });
      // setLoading(false); // Removed
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
      
      // User state will be set by onAuthStateChanged
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
    // finally { // Removed finally block for setLoading
    //  setLoading(false); 
    // }
  }, [router, toast]);

  const logout = useCallback(async () => {
    // setLoading(true); // Removed
    if (!auth) {
      toast({ title: "Authentication Error", description: "Firebase Auth not initialized.", variant: "destructive" });
      // setLoading(false); // Removed
      return;
    }
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null and loading to false
      router.push('/login');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive" });
    } 
    // finally { // Removed finally block for setLoading
    //  setLoading(false);
    // }
  }, [router, toast]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      signup, 
      loading, 
      isAuthenticated: !!user && !loading // Ensure loading is false for isAuthenticated to be definitively true
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

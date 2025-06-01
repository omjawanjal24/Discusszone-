
"use client";

import type { User } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/validation';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
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
            avatarUrl: profileData.avatarUrl || firebaseUser.photoURL, // photoURL from Firebase Auth is usually null unless set explicitly
            createdAt: profileData.createdAt instanceof Timestamp ? profileData.createdAt.toDate() : profileData.createdAt,
          });
        } else {
          // This case might happen if signup was somehow interrupted after auth creation but before Firestore doc creation,
          // or if trying to log in with a user that exists in Auth but not in Firestore users collection.
          // For robust handling, you might want to create the profile here or guide the user.
          console.warn("User profile not found in Firestore for UID:", firebaseUser.uid, "This might be an old user or incomplete signup.");
          setUser({ // Fallback to basic user data from Auth
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isVerified: firebaseUser.emailVerified,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginFormValues) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      // onAuthStateChanged will handle fetching profile and setting user state.
      toast({ title: "Login Successful!", description: `Welcome back, ${userCredential.user.email}!` });
      // Check if there's a redirect query parameter
      const queryParams = new URLSearchParams(window.location.search);
      const redirectUrl = queryParams.get('redirect');
      router.push(redirectUrl || '/booking'); // Redirect to intended page or default
    } catch (error: any) {
      console.error("Firebase login error:", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const signup = async (signupData: SignupFormValues) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      const firebaseUser = userCredential.user;

      const userProfile: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        prn: signupData.prn,
        gender: signupData.gender,
        role: signupData.role,
        isAdmin: signupData.email === ADMIN_EMAIL, // Set admin status based on email
        isVerified: firebaseUser.emailVerified, // Will be false initially
        avatarUrl: '', // Initialize with empty or default avatar URL
        createdAt: new Date(), // Current timestamp
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
      console.log("User profile created in Firestore for UID:", firebaseUser.uid);
      
      // Optional: Send email verification
      // await sendEmailVerification(firebaseUser);
      // toast({ title: "Signup Successful!", description: "Account created. Please check your email to verify your account." });
      // For this app, we'll directly log them in
      
      toast({ title: "Signup Successful!", description: "Account created. You are now logged in."});
      // Firebase automatically signs in the user. onAuthStateChanged will then fetch the profile.
      router.push('/booking'); // Or to a profile completion page if needed

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
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null
      router.push('/login');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      toast({ title: "Logout Failed", description: error.message || "Could not log out.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      signup, 
      loading, 
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

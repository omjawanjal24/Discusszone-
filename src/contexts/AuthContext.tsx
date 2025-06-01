
"use client";

import type { User } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/validation';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebaseConfig'; // Assuming db is exported for Firestore later
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
// TODO: Import Firestore functions when implementing profile storage:
// import { doc, setDoc, getDoc } from 'firebase/firestore';


interface AuthContextType {
  user: User | null;
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  signup: (signupData: SignupFormValues) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        // TODO: Fetch user profile from Firestore here to get PRN, role, gender, isAdmin
        // For now, we'll create a basic user object.
        // const userDocRef = doc(db, "users", firebaseUser.uid);
        // const userDocSnap = await getDoc(userDocRef);
        // if (userDocSnap.exists()) {
        //   const profileData = userDocSnap.data();
        //   setUser({
        //     uid: firebaseUser.uid,
        //     email: firebaseUser.email,
        //     isVerified: firebaseUser.emailVerified,
        //     prn: profileData.prn,
        //     gender: profileData.gender,
        //     role: profileData.role,
        //     isAdmin: profileData.isAdmin,
        //     avatarUrl: profileData.avatarUrl || firebaseUser.photoURL,
        //   });
        // } else {
        //   // Profile might not be created yet if signup flow was interrupted
        //   // Or handle as an error / incomplete profile
        //   console.warn("User profile not found in Firestore for UID:", firebaseUser.uid);
          setUser({ // Basic user data if profile fetch fails or not implemented
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isVerified: firebaseUser.emailVerified,
            // prn, gender, role, isAdmin will be undefined here until Firestore fetch is implemented
          });
        // }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = async (credentials: LoginFormValues) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      // onAuthStateChanged will handle setting the user state.
      // TODO: Firestore profile fetch will be triggered by onAuthStateChanged.
      toast({ title: "Login Successful!", description: `Welcome back, ${userCredential.user.email}!` });
      router.push('/booking');
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

      // TODO: Create user profile in Firestore
      // const userProfile = {
      //   uid: firebaseUser.uid,
      //   email: firebaseUser.email,
      //   prn: signupData.prn,
      //   gender: signupData.gender,
      //   role: signupData.role,
      //   isAdmin: signupData.email === 'om.jawanjal@mitwpu.edu.in', // Example admin logic
      //   isVerified: firebaseUser.emailVerified, // Initially likely false
      //   createdAt: new Date(), // Or serverTimestamp() from Firestore
      // };
      // await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
      // console.log("User profile created in Firestore for UID:", firebaseUser.uid);
      
      // onAuthStateChanged will handle setting the user state with basic info.
      // Profile data will be fetched when onAuthStateChanged runs or on next login.

      // For a better UX, you might want to manually send a verification email here:
      // await sendEmailVerification(firebaseUser);
      // toast({ title: "Signup Successful!", description: "Please check your email to verify your account." });
      
      toast({ title: "Signup Successful!", description: "Account created. You are now logged in."});
      // Firebase automatically signs in the user after createUserWithEmailAndPassword
      // Redirect will be handled by onAuthStateChanged or user can be pushed directly
      router.push('/booking'); // Or to a profile completion page

    } catch (error: any) {
      console.error("Firebase signup error:", error);
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
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
      isAuthenticated: !!user // isAuthenticated is true if user object exists
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

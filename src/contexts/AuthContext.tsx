
"use client";

import type { User } from '@/types';
import type { LoginFormValues, SignupFormValues } from '@/lib/validation';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";


interface AuthContextType {
  user: User | null;
  login: (credentials: LoginFormValues) => void;
  logout: () => void;
  signup: (signupData: SignupFormValues) => void;
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
    // Try to load logged-in user from localStorage
    try {
      const storedUser = localStorage.getItem('discussZoneUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        // Ensure only verified users remain "logged in" on refresh
        if (parsedUser.isVerified) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('discussZoneUser'); // Clean up if unverified user was somehow stored as logged in
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('discussZoneUser');
    }
    setLoading(false);
  }, []);

  const login = (credentials: LoginFormValues) => {
    const userRecordKey = `user-${credentials.email}`;
    const storedUserJSON = localStorage.getItem(userRecordKey);

    if (storedUserJSON) {
      let userToLogin = JSON.parse(storedUserJSON) as User;

      // MOCK PASSWORD CHECK: In a real app, compare credentials.password with a hashed password.
      // For this demo, if the user record exists, we assume the password is correct.

      const isAdminLogin = userToLogin.email === 'om.jawanjal@mitwpu.edu.in';

      if (!userToLogin.isVerified) {
        userToLogin.isVerified = true;
        if (isAdminLogin) { // Ensure admin flags are set upon verification if it's the admin
          userToLogin.isAdmin = true;
          userToLogin.prn = userToLogin.prn || 'ADMIN00000';
          userToLogin.role = userToLogin.role || 'faculty';
          userToLogin.gender = userToLogin.gender || 'other';
        }
        localStorage.setItem(userRecordKey, JSON.stringify(userToLogin)); // Persist verification
        
        setUser(userToLogin);
        localStorage.setItem('discussZoneUser', JSON.stringify(userToLogin)); // Set as current logged-in user
        toast({ title: "Account Verified & Logged In!", description: `Welcome, ${userToLogin.email}!` });
        router.push('/booking');
      } else {
        // User is already verified
        if (isAdminLogin) {
          userToLogin.isAdmin = true; // Ensure admin flag is always correct on login
        }
        setUser(userToLogin);
        localStorage.setItem('discussZoneUser', JSON.stringify(userToLogin));
        toast({ title: "Login Successful!", description: `Welcome back, ${userToLogin.email}!` });
        router.push('/booking');
      }
    } else {
      // User record not found in localStorage
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('discussZoneUser');
    router.push('/login');
  };
  
  const signup = (signupData: SignupFormValues) => {
    const userRecordKey = `user-${signupData.email}`;

    if (localStorage.getItem(userRecordKey)) {
      toast({ title: "Signup Failed", description: "An account with this email already exists.", variant: "destructive" });
      return;
    }

    const newUser: User = {
      email: signupData.email,
      prn: signupData.prn,
      gender: signupData.gender,
      role: signupData.role,
      // In a real app, password would be hashed and stored on the backend
      // For this simulation, we don't store the password directly with the user record
      isVerified: false, // New users start as unverified
      isAdmin: signupData.email === 'om.jawanjal@mitwpu.edu.in', // Set admin status at signup if it's the admin email
    };
    
    localStorage.setItem(userRecordKey, JSON.stringify(newUser));
    
    toast({
      title: "Signup Successful!",
      description: "A (simulated) confirmation email has been sent. Please log in to verify your account.",
    });
    router.push('/login'); // Redirect to login page to complete "verification"
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading, isAuthenticated: !!user && !!user.isVerified }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

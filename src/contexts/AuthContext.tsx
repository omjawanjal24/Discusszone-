"use client";

import type { User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  signup: (userData: User) => void; // Simplified signup
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Try to load user from localStorage
    try {
      const storedUser = localStorage.getItem('discussZoneUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('discussZoneUser');
    }
    setLoading(false);
  }, []);

  const login = (userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem('discussZoneUser', JSON.stringify(userData));
    if (token) localStorage.setItem('discussZoneToken', token); // If using actual tokens
    router.push('/booking');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('discussZoneUser');
    localStorage.removeItem('discussZoneToken');
    router.push('/login');
  };
  
  const signup = (userData: User) => {
    // In a real app, this would involve an API call.
    // For this demo, we'll "log in" the user directly after signup.
    // OTP step would happen before calling this.
    setUser(userData);
    localStorage.setItem('discussZoneUser', JSON.stringify(userData));
    // Simulate token if needed
    // localStorage.setItem('discussZoneToken', "mockTokenAfterSignup");
    // router.push('/booking'); // Or wherever you want to redirect after signup
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

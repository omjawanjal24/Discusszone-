
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, otpSchema, type SignupFormValues, type OtpFormValues } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import type { User } from '@/types';

export default function SignupPage() {
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [signupData, setSignupData] = useState<SignupFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpReadOnly, setIsOtpReadOnly] = React.useState(true); // Added for OTP field
  const { signup } = useAuth();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      prn: '',
      password: '',
      confirmPassword: '',
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  async function onSubmitSignup(data: SignupFormValues) {
    setIsLoading(true);
    // Simulate API call for sending OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Simulating OTP sent to:', data.email);
    setSignupData(data);
    setShowOtpForm(true);
    setIsOtpReadOnly(true); // Reset readOnly state when OTP form is shown
    setIsLoading(false);
    toast({
      title: "OTP Sent",
      description: `An OTP has been sent to ${data.email}. Please check your inbox (or console for demo). Mock OTP: 123456`,
    });
  }

  async function onSubmitOtp(data: OtpFormValues) {
    setIsLoading(true);
    // Simulate API call for verifying OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Verifying OTP:', data.otp);
    
    // Mock OTP verification
    if (data.otp === '123456' && signupData) {
      const newUser: User = {
        email: signupData.email,
        prn: signupData.prn,
        gender: signupData.gender,
        role: signupData.role,
        // password should not be stored like this in a real app
      };
      signup(newUser); // Update auth context
      toast({
        title: "Signup Successful!",
        description: "You have been successfully signed up and logged in.",
      });
      // router.push('/booking'); // AuthProvider handles redirection on login
    } else {
      otpForm.setError('otp', { type: 'manual', message: 'Invalid OTP. Please try again.' });
      toast({
        title: "OTP Verification Failed",
        description: "The OTP you entered is incorrect.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  if (showOtpForm && signupData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Verify OTP</CardTitle>
            <CardDescription>Enter the 6-digit OTP sent to {signupData.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-6">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="one-time-code" 
                          placeholder="123456"
                          {...field}
                          maxLength={6}
                          readOnly={isOtpReadOnly}
                          onFocus={() => setIsOtpReadOnly(false)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </form>
            </Form>
            <Button variant="link" onClick={() => { setShowOtpForm(false); setIsOtpReadOnly(true); }} className="mt-4 w-full">
              Back to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details to join DiscussZone.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitSignup)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MITWPU Email</FormLabel>
                    <FormControl>
                      <Input placeholder="yourname@mitwpu.edu.in" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PRN (10 digits)</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} maxLength={10} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Are you a student or faculty?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline hover:text-primary">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


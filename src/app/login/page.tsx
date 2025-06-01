
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
// Toast is handled by AuthContext

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await login(data); // AuthContext.login handles toasts and redirection
    } catch (pageError) {
      // This catch block would only be hit if login() from AuthContext re-throws an error.
      // Currently, AuthContext.login handles its own errors with toasts.
      console.error("Login page caught an unexpected error:", pageError);
    } finally {
      // Ensure the button loading state is reset even if login() internally handles errors
      // and doesn't re-throw, or if redirection is occurring.
      // If redirection happens quickly, this might not be visually noticeable, which is fine.
      if (form.formState.isSubmitted) { // Avoid race condition if component unmounts quickly
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Log in to access DiscussZone. If signing up for the first time, logging in will verify your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="yourname@mitwpu.edu.in" {...field} />
                    </FormControl>
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
              <div className="flex items-center justify-between">
                <div/> {/* Empty div for spacing */}
                <Link href="/forgot-password" passHref>
                  <Button variant="link" type="button" className="px-0 text-sm">
                    Forgot password?
                  </Button>
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Login'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline hover:text-primary">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

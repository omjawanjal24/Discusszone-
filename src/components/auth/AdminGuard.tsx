
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import React, { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      } else if (!user?.isAdmin) {
        // If authenticated but not an admin, redirect to home or show an access denied message.
        // For now, let's redirect to home. A dedicated "Access Denied" page could be better.
        router.push('/'); 
      }
    }
  }, [isAuthenticated, user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-4 p-4">
        <Skeleton className="h-12 w-1/2 rounded-md" />
        <Skeleton className="h-8 w-1/3 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mt-8">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    // This part might be briefly visible before redirect.
    // Or, if not redirecting, it's where you'd show "Access Denied".
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
            <Alert variant="destructive" className="max-w-lg">
                <ShieldAlert className="h-5 w-5" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                You do not have permission to view this page. Redirecting...
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return <>{children}</>;
}

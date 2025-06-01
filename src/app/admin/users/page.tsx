
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, ShieldCheck, ShieldAlert, UserCog } from 'lucide-react';
import type { User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageUsersPage() {
  const { user: adminUser, loading: adminLoading } = useAuth();
  const { toast } = useToast();
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsersFromLocalStorage = useCallback(() => {
    setIsLoading(true);
    const users: User[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user-')) {
          const storedData = localStorage.getItem(key);
          if (storedData) {
            const parsedUser = JSON.parse(storedData) as User;
            // Add id field from key if not present, for consistency, though email is primary key here
            parsedUser.id = parsedUser.id || key.replace('user-', '');
            users.push(parsedUser);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching users from localStorage:", error);
      toast({ title: "Error", description: "Could not load users from localStorage.", variant: "destructive" });
    }
    // Sort users, perhaps by email or role
    users.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    setManagedUsers(users);
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsersFromLocalStorage();
  }, [fetchUsersFromLocalStorage]);

  const handleToggleAdminStatus = useCallback((targetUserEmail: string, newAdminStatus: boolean) => {
    if (!adminUser || !adminUser.isAdmin) {
      toast({ title: "Unauthorized", description: "You are not authorized to perform this action.", variant: "destructive" });
      return;
    }

    if (adminUser.email === targetUserEmail) {
      toast({ title: "Action Restricted", description: "You cannot change your own admin status.", variant: "warning" });
      // Revert the switch visually if it was an optimistic update, though Switch handles its own state
      // For simplicity, we just prevent the action. The Switch component should reflect actual state.
      fetchUsersFromLocalStorage(); // Re-fetch to ensure UI consistency
      return;
    }

    try {
      const userRecordKey = `user-${targetUserEmail}`;
      const storedUserJSON = localStorage.getItem(userRecordKey);
      if (!storedUserJSON) {
        toast({ title: "User Not Found", description: "Could not find the user record to update.", variant: "destructive" });
        return;
      }

      const userToUpdate = JSON.parse(storedUserJSON) as User;
      userToUpdate.isAdmin = newAdminStatus;
      localStorage.setItem(userRecordKey, JSON.stringify(userToUpdate));

      setManagedUsers(prevUsers =>
        prevUsers.map(u =>
          u.email === targetUserEmail ? { ...u, isAdmin: newAdminStatus } : u
        )
      );

      toast({
        title: "Admin Status Updated",
        description: `${targetUserEmail} is ${newAdminStatus ? 'now an admin' : 'no longer an admin'}.`,
      });
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({ title: "Update Failed", description: "An error occurred while updating admin status.", variant: "destructive" });
      fetchUsersFromLocalStorage(); // Re-fetch to ensure UI consistency
    }
  }, [adminUser, toast, fetchUsersFromLocalStorage]);


  if (isLoading || adminLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <Skeleton className="h-10 w-1/4 mb-4" />
        <Card className="shadow-md">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-6 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      
      <Alert variant="default" className="bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700">
        <UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-700 dark:text-blue-300">User Management Overview</AlertTitle>
        <AlertDescription className="text-blue-600 dark:text-blue-500">
          This section lists all registered users. You can grant or revoke administrator privileges.
          User data is managed via browser localStorage for this demonstration.
        </AlertDescription>
      </Alert>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Toggle admin status for users. Your own status cannot be changed here.</CardDescription>
        </CardHeader>
        <CardContent>
          {managedUsers.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Users Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  There are no registered users in localStorage.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableCaption>A list of all user accounts from localStorage.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>PRN</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Admin Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.prn}</TableCell>
                    <TableCell className="capitalize">
                      <Badge variant={user.role === 'faculty' ? "secondary" : "outline"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.isVerified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300">Verified</Badge>
                      ) : (
                        <Badge variant="destructive">Not Verified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {user.isAdmin && <ShieldCheck className="h-5 w-5 text-primary" />}
                        <Switch
                          id={`admin-switch-${user.email}`}
                          checked={!!user.isAdmin}
                          onCheckedChange={(newStatus) => handleToggleAdminStatus(user.email!, newStatus)}
                          disabled={adminUser?.email === user.email}
                          aria-label={`Toggle admin status for ${user.email}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

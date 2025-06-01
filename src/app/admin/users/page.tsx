
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, ShieldAlert } from 'lucide-react';

// Mock user data - in a real app, this would come from a backend.
const mockUsers = [
  { id: 'user1', email: 'student1@mitwpu.edu.in', prn: '1122334455', role: 'student', bookings: 5, status: 'Active' },
  { id: 'user2', email: 'faculty1@mitwpu.edu.in', prn: 'FAC987654', role: 'faculty', bookings: 2, status: 'Active' },
  { id: 'admin@mitwpu.edu.in', email: 'admin@mitwpu.edu.in', prn: 'ADMIN00000', role: 'faculty', isAdmin: true, bookings: 0, status: 'Active' },
  { id: 'user3', email: 'student2@mitwpu.edu.in', prn: '5544332211', role: 'student', bookings: 0, status: 'Inactive' },
];

export default function ManageUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      
      <Alert variant="default" className="bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
        <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-700 dark:text-yellow-300">Placeholder Data</AlertTitle>
        <AlertDescription className="text-yellow-600 dark:text-yellow-500">
          This section displays mock user data for demonstration purposes only. 
          A full user management system requires a backend database and authentication service.
        </AlertDescription>
      </Alert>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>User List (Mock Data)</CardTitle>
          <CardDescription>Browse and manage user accounts (simulated).</CardDescription>
        </CardHeader>
        <CardContent>
          {mockUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No users to display (mock data is empty).</p>
          ) : (
            <Table>
              <TableCaption>A list of simulated user accounts.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>PRN</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.prn}</TableCell>
                    <TableCell className="capitalize">
                      {user.isAdmin ? <Badge>Admin</Badge> : <Badge variant="outline">{user.role}</Badge>}
                    </TableCell>
                    <TableCell>{user.bookings}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Placeholder for actions like Edit, View Details, Ban etc. */}
                      <span className="text-xs text-muted-foreground">N/A</span>
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

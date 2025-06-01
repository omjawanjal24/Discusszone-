"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <AuthGuard>
        <div className="text-center">Loading profile...</div>
      </AuthGuard>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage 
                src={user.avatarUrl || `https://placehold.co/100x100.png?text=${user.email?.[0]?.toUpperCase() ?? 'U'}`} 
                alt={user.email || "User"}
                data-ai-hint="profile avatar" 
              />
              <AvatarFallback className="text-3xl">{user.email?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
            </Avatar>
            <CardTitle className="font-headline text-2xl">{user.email}</CardTitle>
            <CardDescription>Your DiscussZone Profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="font-medium text-muted-foreground">PRN:</div>
              <div>{user.prn}</div>
              
              <div className="font-medium text-muted-foreground">Email:</div>
              <div>{user.email}</div>

              <div className="font-medium text-muted-foreground">Gender:</div>
              <div className="capitalize">{user.gender}</div>

              <div className="font-medium text-muted-foreground">Role:</div>
              <div className="capitalize">{user.role}</div>
            </div>
            <Button onClick={handleLogout} variant="destructive" className="w-full mt-6">
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

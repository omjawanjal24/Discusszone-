
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Users, CalendarCheck } from "lucide-react"; // Example icons

export default function AdminDashboardPage() {
  // In a real app, you'd fetch these stats from a backend.
  const stats = [
    { title: "Total Bookings Today", value: "0", icon: CalendarCheck, description: "Updated in real-time" },
    { title: "Active Users (Simulated)", value: "0", icon: Users, description: "Mock data" },
    { title: "Rooms Occupancy (Simulated)", value: "0%", icon: BarChart, description: "Overall percentage" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Welcome to the DiscussZone Admin Panel. Use the sidebar to navigate through management sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            From here, you can manage room bookings, oversee user activity (simulated for now),
            and ensure the smooth operation of the DiscussZone platform.
          </p>
          <p className="mt-4">
            Future enhancements could include more detailed analytics, user role management, and room configuration settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

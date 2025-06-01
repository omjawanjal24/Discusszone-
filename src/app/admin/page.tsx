
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Users, CalendarCheck, Info } from "lucide-react";
import type { Room, User as AppUser, TimeSlot } from '@/types'; // Renamed User to AppUser to avoid conflict
import { format, startOfDay, isToday } from 'date-fns';

// Simplified version of initialRoomsData and generateTimeSlots for calculation purposes
// This helps determine total possible slots for today to calculate occupancy
const generateTimeSlotsForCalc = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const openingHour = 8;
  const closingHour = 20; // 8 PM

  // Only generate slots if it's for today, otherwise, admin might see future/past planned slots
  // For occupancy calculation, we consider all slots that *could* be available today.
  if (!isToday(date)) {
      // return []; // For strict "today only" - but admin might want to see planned slots
  }

  const now = new Date();
  const currentHour = now.getHours();
  
  // For total slots calculation, we ignore current time and just generate all possible slots for the day
  for (let hour = openingHour; hour < closingHour; hour++) {
    slots.push({
      id: `slot-${format(date, 'yyyy-MM-dd')}-${hour.toString().padStart(2, '0')}`,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      isBooked: false,
      occupants: [],
    });
  }
  return slots;
};

const initialRoomsDataForCalc = (date: Date): Room[] => [
  { id: 'room1', name: 'Discussion Room 1', capacity: 8, slots: generateTimeSlotsForCalc(date) },
  { id: 'room2', name: 'Discussion Room 2', capacity: 12, slots: generateTimeSlotsForCalc(date) },
  { id: 'room3', name: 'Discussion Room 3', capacity: 12, slots: generateTimeSlotsForCalc(date) },
  { id: 'room4', name: 'Discussion Room 4', capacity: 12, slots: generateTimeSlotsForCalc(date) },
];


export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { title: "Total Bookings Today", value: "0", icon: CalendarCheck, description: "Live from localStorage" },
    { title: "Verified Users", value: "0", icon: Users, description: "Live from localStorage" },
    { title: "Room Occupancy Today", value: "0%", icon: BarChart, description: "Based on today's slots" },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(() => {
    setIsLoading(true);
    let totalBookingsTodayCount = 0;
    let verifiedUsersCount = 0;
    let totalSlotsToday = 0;
    let bookedSlotsToday = 0;

    const today = startOfDay(new Date());
    const todayString = format(today, 'yyyy-MM-dd');

    try {
      // Calculate Total Bookings Today & Room Occupancy
      const bookingsKey = `discussZoneBookings-${todayString}`;
      const storedBookings = localStorage.getItem(bookingsKey);
      if (storedBookings) {
        const roomsToday = JSON.parse(storedBookings) as Room[];
        roomsToday.forEach(room => {
          room.slots.forEach(slot => {
            if (slot.isBooked) {
              totalBookingsTodayCount++;
            }
          });
        });
      }
      
      // For Occupancy: Calculate total possible slots vs booked slots
      const roomsConfigForToday = initialRoomsDataForCalc(today);
      roomsConfigForToday.forEach(roomConfig => {
        totalSlotsToday += roomConfig.slots.length;
      });
      // Re-use totalBookingsTodayCount if it's accurate for *all* slots, not just future ones
      // Let's recount booked slots from the perspective of total slots config to be safe
      if (storedBookings) {
         const roomsWithBookings = JSON.parse(storedBookings) as Room[];
         roomsWithBookings.forEach(bookedRoom => {
            bookedRoom.slots.forEach(slot => {
                if(slot.isBooked) bookedSlotsToday++;
            })
         })
      }


      // Calculate Verified Users
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user-')) {
          const storedUserData = localStorage.getItem(key);
          if (storedUserData) {
            const user = JSON.parse(storedUserData) as AppUser;
            if (user.isVerified) {
              verifiedUsersCount++;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data from localStorage:", error);
      // Keep default stat values or show error
    }
    
    const occupancyPercentage = totalSlotsToday > 0 ? ((bookedSlotsToday / totalSlotsToday) * 100).toFixed(0) : "0";

    setStats([
      { title: "Total Bookings Today", value: totalBookingsTodayCount.toString(), icon: CalendarCheck, description: "Live from localStorage" },
      { title: "Verified Users", value: verifiedUsersCount.toString(), icon: Users, description: "Live from localStorage" },
      { title: "Room Occupancy Today", value: `${occupancyPercentage}%`, icon: BarChart, description: `${bookedSlotsToday}/${totalSlotsToday} slots booked` },
    ]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Optional: Set up an interval to refresh data, e.g., every minute
    // const intervalId = setInterval(fetchDashboardData, 60000);
    // return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/2 mb-2" /> {/* For title */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-3/5" /> {/* CardTitle */}
                <Skeleton className="h-5 w-5 rounded-full" /> {/* Icon */}
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-1" /> {/* Value */}
                <Skeleton className="h-4 w-4/5" /> {/* Description */}
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-7 w-1/4" /> {/* CardTitle */}
            <Skeleton className="h-4 w-3/4 mt-1" /> {/* CardDescription */}
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

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
            From here, you can manage room bookings, oversee user activity,
            and ensure the smooth operation of the DiscussZone platform using live data from browser localStorage.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            <Info className="inline-block h-4 w-4 mr-1" />
            Note: Data is based on the current state of `localStorage` in this browser. It's not a centralized server database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

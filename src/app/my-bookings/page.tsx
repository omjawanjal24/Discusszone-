
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import type { UserBooking, Room, TimeSlot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { format, parse, compareAsc } from 'date-fns';
import { Users, CalendarDays, Clock, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MyBookingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatTimeForDisplay = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, 'hh:mm a');
  };

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user || !user.prn) {
      setIsLoading(false);
      setBookings([]);
      return;
    }

    setIsLoading(true);
    const fetchedBookings: UserBooking[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('discussZoneBookings-')) {
          const dateStr = key.replace('discussZoneBookings-', '');
          const storedData = localStorage.getItem(key);
          if (storedData) {
            const roomsToday = JSON.parse(storedData) as Room[];
            roomsToday.forEach(room => {
              room.slots.forEach(slot => {
                if (slot.isBooked && slot.bookedBy === user.prn) {
                  fetchedBookings.push({
                    id: `${dateStr}-${room.id}-${slot.id}`,
                    date: dateStr,
                    roomName: room.name,
                    roomId: room.id,
                    slotId: slot.id,
                    startTime: formatTimeForDisplay(slot.startTime),
                    endTime: formatTimeForDisplay(slot.endTime),
                    isGroupBooking: slot.isGroupBooking,
                    groupMembers: slot.groupMembers,
                    occupants: slot.occupants,
                    bookedByName: slot.bookedByName,
                  });
                }
              });
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching bookings from localStorage:", error);
      // Optionally, show a toast or error message to the user
    }

    // Sort bookings: by date (most recent first), then by start time (earliest first)
    fetchedBookings.sort((a, b) => {
      const dateComparison = compareAsc(parse(b.date, 'yyyy-MM-dd', new Date()), parse(a.date, 'yyyy-MM-dd', new Date()));
      if (dateComparison !== 0) {
        return dateComparison;
      }
      // If dates are same, sort by start time
      const timeA = parse(a.startTime, 'hh:mm a', new Date());
      const timeB = parse(b.startTime, 'hh:mm a', new Date());
      return compareAsc(timeA, timeB);
    });

    setBookings(fetchedBookings);
    setIsLoading(false);
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="font-headline text-3xl md:text-4xl font-bold">My Bookings</h1>
            <Skeleton className="h-5 w-1/2 mx-auto mt-2" /> 
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!user) {
     // Should be handled by AuthGuard, but as a fallback
    return (
      <AuthGuard>
        <div className="text-center">
            <p>Please log in to see your bookings.</p>
        </div>
      </AuthGuard>
    );
  }
  

  return (
    <AuthGuard>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-2">
            Here are all the discussion room slots you&apos;ve booked.
          </p>
        </div>

        {bookings.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Bookings Found</AlertTitle>
            <AlertDescription>
              You haven&apos;t booked any discussion rooms yet. Head over to the booking page to reserve a slot!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map(booking => (
              <Card key={booking.id} className="shadow-lg flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-primary">{booking.roomName}</CardTitle>
                  <CardDescription className="flex items-center text-sm">
                    <CalendarDays className="h-4 w-4 mr-1.5 text-muted-foreground" />
                    {format(parse(booking.date, 'yyyy-MM-dd', new Date()), 'MMMM do, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-grow">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{booking.startTime} - {booking.endTime}</span>
                  </div>
                  
                  {booking.isGroupBooking && booking.groupMembers && booking.groupMembers.length > 0 ? (
                    <div>
                      <div className="flex items-center text-sm font-medium mb-1">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Group Booking ({1 + (booking.groupMembers?.length || 0)} people)</span>
                      </div>
                      <ul className="list-disc list-inside pl-4 text-xs text-muted-foreground space-y-0.5 max-h-20 overflow-y-auto">
                        {booking.bookedByName && <li>{booking.bookedByName} (You)</li>}
                        {booking.groupMembers.map(member => (
                          <li key={member.email}>{member.name} ({member.email})</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <Badge variant="secondary">Individual Booking</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

export default MyBookingsPage;

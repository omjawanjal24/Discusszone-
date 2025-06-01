
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Room, TimeSlot, AdminBookingView } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card'; // Added import
import { Trash2, Info, Users, User } from 'lucide-react';

const formatTimeForDisplay = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, 'hh:mm a');
};

export default function ManageBookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allBookings, setAllBookings] = useState<AdminBookingView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllBookings = useCallback(() => {
    setIsLoading(true);
    const fetchedBookings: AdminBookingView[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('discussZoneBookings-')) {
          const dateStr = key.replace('discussZoneBookings-', '');
          const storedData = localStorage.getItem(key);
          if (storedData) {
            const roomsForDate = JSON.parse(storedData) as Room[];
            roomsForDate.forEach(room => {
              room.slots.forEach(slot => {
                if (slot.isBooked) {
                  fetchedBookings.push({
                    id: `${dateStr}-${room.id}-${slot.id}`,
                    date: format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'MMMM do, yyyy'),
                    roomName: room.name,
                    roomId: room.id, // Keep original room ID
                    slotId: slot.id, // Keep original slot ID
                    startTime: formatTimeForDisplay(slot.startTime),
                    endTime: formatTimeForDisplay(slot.endTime),
                    bookedBy: slot.bookedBy,
                    bookedByName: slot.bookedByName,
                    isGroupBooking: slot.isGroupBooking,
                    groupMembers: slot.groupMembers,
                    occupants: slot.occupants,
                    originalSlotId: slot.id,
                    originalRoomId: room.id,
                    originalDate: dateStr, 
                  });
                }
              });
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching bookings from localStorage for admin:", error);
      toast({ title: "Error", description: "Could not load all bookings.", variant: "destructive" });
    }

    // Sort bookings: by date (most recent first), then by room name, then by start time
    fetchedBookings.sort((a, b) => {
      const dateComparison = parse(b.originalDate, 'yyyy-MM-dd', new Date()).getTime() - parse(a.originalDate, 'yyyy-MM-dd', new Date()).getTime();
      if (dateComparison !== 0) return dateComparison;
      const roomNameComparison = a.roomName.localeCompare(b.roomName);
      if (roomNameComparison !== 0) return roomNameComparison;
      return parse(a.startTime, 'hh:mm a', new Date()).getTime() - parse(b.startTime, 'hh:mm a', new Date()).getTime();
    });

    setAllBookings(fetchedBookings);
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  const handleCancelBooking = useCallback((bookingToCancel: AdminBookingView) => {
    if (!user?.isAdmin) {
      toast({ title: "Unauthorized", description: "You are not authorized to perform this action.", variant: "destructive" });
      return;
    }

    try {
      const bookingsKey = `discussZoneBookings-${bookingToCancel.originalDate}`;
      const storedData = localStorage.getItem(bookingsKey);
      if (!storedData) {
        toast({ title: "Error", description: "Booking data not found for this date.", variant: "destructive" });
        return;
      }

      let roomsForDate = JSON.parse(storedData) as Room[];
      let bookingCancelled = false;

      roomsForDate = roomsForDate.map(room => {
        if (room.id === bookingToCancel.originalRoomId) {
          return {
            ...room,
            slots: room.slots.map(slot => {
              if (slot.id === bookingToCancel.originalSlotId && slot.isBooked) {
                bookingCancelled = true;
                return {
                  ...slot,
                  isBooked: false,
                  bookedBy: undefined,
                  bookedByName: undefined,
                  isGroupBooking: undefined,
                  groupMembers: undefined,
                  occupants: undefined,
                };
              }
              return slot;
            }),
          };
        }
        return room;
      });

      if (bookingCancelled) {
        localStorage.setItem(bookingsKey, JSON.stringify(roomsForDate));
        toast({ title: "Booking Cancelled", description: `Booking for ${bookingToCancel.roomName} on ${bookingToCancel.date} at ${bookingToCancel.startTime} has been cancelled.` });
        fetchAllBookings(); // Refresh the list
      } else {
        toast({ title: "Cancellation Failed", description: "Could not find the specified booking to cancel. It might have been already cancelled or modified.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({ title: "Error", description: "An error occurred while cancelling the booking.", variant: "destructive" });
    }
  }, [user, toast, fetchAllBookings]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Manage All Bookings</h1>
        <Skeleton className="h-10 w-1/4" />
        <div className="border rounded-lg">
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage All Bookings</h1>
      {allBookings.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <Info className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Bookings Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              There are currently no active bookings in the system.
            </p>
          </div>
        </div>
      ) : (
        <Card className="shadow-md">
          <Table>
            <TableCaption>A list of all room bookings.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Booked By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>{booking.roomName}</TableCell>
                  <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{booking.bookedByName || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">{booking.bookedBy || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.isGroupBooking ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> Group ({1 + (booking.groupMembers?.length || 0)})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <User className="h-3 w-3" /> Individual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-1 h-4 w-4" /> Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will cancel the booking for <span className="font-semibold">{booking.roomName}</span> on <span className="font-semibold">{booking.date}</span> from <span className="font-semibold">{booking.startTime}</span> to <span className="font-semibold">{booking.endTime}</span>. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancelBooking(booking)}>
                            Confirm Cancellation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

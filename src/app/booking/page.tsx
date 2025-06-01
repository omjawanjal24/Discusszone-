
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { RoomCard } from '@/components/booking/RoomCard';
import type { Room, TimeSlot, GroupMember } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isEqual, startOfDay, isToday } from 'date-fns';
import { GroupBookingDialog } from '@/components/booking/GroupBookingDialog';

const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const openingHour = 8; // Changed from 9
  const closingHour = 20; // Changed from 18 (slots up to 19:00-20:00)

  if (!isToday(date)) {
    return []; // Only allow booking for the current day
  }

  const now = new Date(); // Current time
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // If it's today, but already at or past closing time, no slots
  if (currentHour >= closingHour) {
    return [];
  }

  // Determine the starting hour for today's slots
  // If current time is before opening hour, start from opening hour.
  // If current time is during operating hours, start from the next whole hour if current minute > 0,
  // or from current hour if current minute is 0.
  let startHourForToday = openingHour;
  if (currentHour >= openingHour) {
    startHourForToday = currentMinutes > 0 ? currentHour + 1 : currentHour;
  }
  
  // Ensure startHourForToday is not less than openingHour
  const effectiveStartHour = Math.max(openingHour, startHourForToday);


  for (let hour = effectiveStartHour; hour < closingHour; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push({
      // Unique ID including date to prevent clashes if we ever allow multi-day booking
      id: `slot-${date.toISOString().split('T')[0]}-${hour.toString().padStart(2, '0')}`, 
      startTime,
      endTime,
      isBooked: false,
    });
  }
  return slots;
};


const initialRoomsData = (date: Date): Room[] => [
  { id: 'room1', name: 'Discussion Room 1', capacity: 8, slots: generateTimeSlots(date) },
  { id: 'room2', name: 'Discussion Room 2', capacity: 12, slots: generateTimeSlots(date) },
  { id: 'room3', name: 'Discussion Room 3', capacity: 12, slots: generateTimeSlots(date) },
  { id: 'room4', name: 'Discussion Room 4', capacity: 12, slots: generateTimeSlots(date) },
];


export default function BookingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 
  
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<{ room: Room; slot: TimeSlot } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date()); // Centralized current time

  useEffect(() => {
    // Timer to update currentTime every minute, forcing re-evaluation of past slots
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    // Ensure currentDate is a valid Date object before proceeding
    if (currentDate instanceof Date && !isNaN(currentDate.getTime())) {
      setRooms(initialRoomsData(currentDate));
    } else {
      // Handle invalid date case, perhaps by setting rooms to empty or logging an error
      console.error("currentDate is invalid in BookingPage useEffect");
      setRooms([]); // Or some other default state
    }
    setIsLoading(false);
  }, [currentDate, currentTime]); // Also re-generate rooms if currentTime changes (to update available slots for today)

  const handleOpenBookingDialog = useCallback((roomId: string, slotId: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to book a slot.", variant: "destructive" });
      return;
    }
    if (!isToday(currentDate)) {
      toast({ title: "Booking Error", description: "Bookings are only allowed for the current day.", variant: "destructive" });
      return;
    }

    const room = rooms.find(r => r.id === roomId);
    const slot = room?.slots.find(s => s.id === slotId);

    if (room && slot) {
      // Check if the slot is in the past using the centralized currentTime
      const slotEndTimeParts = slot.endTime.split(':');
      const slotEndDate = new Date(currentDate); // Use currentDate for the date part
      slotEndDate.setHours(parseInt(slotEndTimeParts[0]), parseInt(slotEndTimeParts[1]), 0, 0);
      
      if (slotEndDate < currentTime && isToday(currentDate)) { 
        toast({ title: "Slot Unavailable", description: "This time slot has passed.", variant: "warning" });
        return;
      }

      if (slot.isBooked) {
         toast({ title: "Slot Unavailable", description: "This slot is already booked.", variant: "destructive" });
         return;
      }
      setSelectedBookingDetails({ room, slot });
      setIsBookingDialogOpen(true);
    }
  }, [user, toast, currentDate, rooms, currentTime]); // Added currentTime as dependency

  const handleConfirmBooking = useCallback((roomId: string, slotId: string, groupMembers: GroupMember[], agreedToTerms: boolean) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to book a slot.", variant: "destructive" });
      return;
    }
    if (!agreedToTerms) {
      toast({ title: "Agreement Required", description: "You must agree to the Terms & Conditions to book a slot.", variant: "destructive" });
      return;
    }

    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id === roomId) {
          const totalPeople = 1 + groupMembers.length; // Booker + added members
          if (totalPeople > room.capacity) {
            toast({ title: "Capacity Exceeded", description: `The room capacity (${room.capacity}) would be exceeded with ${totalPeople} people.`, variant: "destructive" });
            return room; // Return room unchanged if capacity exceeded
          }

          return {
            ...room,
            slots: room.slots.map(slot => {
              if (slot.id === slotId) {
                if (slot.isBooked) {
                  toast({ title: "Slot Unavailable", description: "This slot was booked by someone else just now.", variant: "destructive" });
                  return slot; // Slot got booked by someone else
                }
                const isGroupBooking = groupMembers.length > 0;
                let bookingMessage = `You've booked ${room.name} from ${slot.startTime} to ${slot.endTime}.`;
                if (isGroupBooking) {
                  bookingMessage = `You've booked ${room.name} from ${slot.startTime} to ${slot.endTime} for yourself and ${groupMembers.length} other(s).`;
                }
                toast({ title: "Slot Booked!", description: bookingMessage });
                return { 
                  ...slot, 
                  isBooked: true, 
                  bookedBy: user.prn, 
                  bookedByName: user.email, // Or a proper name if available
                  isGroupBooking,
                  groupMembers: isGroupBooking ? groupMembers : undefined,
                };
              }
              return slot;
            }),
          };
        }
        return room;
      })
    );
    setIsBookingDialogOpen(false);
    setSelectedBookingDetails(null);
  }, [user, toast]);
  
  return (
    <AuthGuard>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Book a Discussion Room</h1>
          <p className="text-muted-foreground mt-2">
            Select an available time slot for {format(currentDate, 'eeee, MMMM do, yyyy')}.
          </p>
          <p className="text-sm text-primary mt-1">
            Bookings are only available for the current day. (8 AM - 8 PM)
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4 my-6">
          <Button variant="outline" size="icon" disabled={true} /*onClick={() => setCurrentDate(subDays(currentDate, 1))}*/ >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-lg font-medium">
            <CalendarDays className="h-5 w-5 text-primary" />
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
          <Button variant="outline" size="icon" disabled={true} /*onClick={() => setCurrentDate(addDays(currentDate, 1))}*/ >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <p className="text-center">Loading room availability...</p>
        ) : rooms.every(room => room.slots.length === 0) && isToday(currentDate) ? (
           <p className="text-center text-destructive font-medium">
            Booking slots for today might be over or not yet started for the day (available 8 AM - 8 PM).
          </p>
        ) : rooms.every(room => room.slots.length === 0) && !isToday(currentDate) ? (
          <p className="text-center text-muted-foreground">
            No slots available for this day. Bookings are only open for the current day.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {rooms.map(room => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onBookSlot={handleOpenBookingDialog} 
                currentTime={currentTime} // Pass currentTime down
              />
            ))}
          </div>
        )}
      </div>
      {selectedBookingDetails && (
        <GroupBookingDialog
          open={isBookingDialogOpen}
          onOpenChange={(open) => {
            setIsBookingDialogOpen(open);
            if (!open) setSelectedBookingDetails(null); // Clear details when dialog is closed
          }}
          room={selectedBookingDetails.room}
          slot={selectedBookingDetails.slot}
          userEmail={user?.email || ''} // Pass current user's email
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </AuthGuard>
  );
}

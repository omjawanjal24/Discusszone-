
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
  const openingHour = 9; // 9 AM
  const closingHour = 18; // 6 PM (last slot ends at 6 PM)

  if (!isToday(date)) {
    return [];
  }

  const now = new Date(); // Current actual time to check against closing hour for today
  if (now.getHours() >= closingHour && isToday(date)) { 
    return [];
  }

  for (let hour = openingHour; hour < closingHour; hour++) {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    slots.push({
      id: `${format(startTime, 'HHmm')}`,
      startTime: format(startTime, 'HH:mm'),
      endTime: format(endTime, 'HH:mm'),
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
  const [rooms, setRooms] = useState<Room[]>([]); // Initialize with empty array
  const [isLoading, setIsLoading] = useState(true); 
  
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<{ room: Room; slot: TimeSlot } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); 
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    if (currentDate instanceof Date && !isNaN(currentDate.getTime())) {
      setRooms(initialRoomsData(currentDate));
    } else {
      console.error("currentDate is invalid in BookingPage useEffect");
      setRooms([]);
    }
    setIsLoading(false);
  }, [currentDate]);

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
      const slotEndTimeParts = slot.endTime.split(':');
      const slotEndDate = new Date(currentDate); 
      slotEndDate.setHours(parseInt(slotEndTimeParts[0]), parseInt(slotEndTimeParts[1]), 0, 0);
      
      // Use `currentTime` state variable for consistent past slot check
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
  }, [user, toast, currentDate, rooms, currentTime]); 

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
          const totalPeople = 1 + groupMembers.length; 
          if (totalPeople > room.capacity) {
            toast({ title: "Capacity Exceeded", description: `The room capacity (${room.capacity}) would be exceeded with ${totalPeople} people.`, variant: "destructive" });
            return room; 
          }

          return {
            ...room,
            slots: room.slots.map(slot => {
              if (slot.id === slotId) {
                if (slot.isBooked) {
                  toast({ title: "Slot Unavailable", description: "This slot was booked by someone else.", variant: "destructive" });
                  return slot;
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
                  bookedByName: user.email, 
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
  }, [user, toast]); // `setRooms` is stable, so not strictly needed in deps if user and toast are the only external values used directly.
  
  return (
    <AuthGuard>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Book a Discussion Room</h1>
          <p className="text-muted-foreground mt-2">
            Select an available time slot for {format(currentDate, 'eeee, MMMM do, yyyy')}.
          </p>
          <p className="text-sm text-primary mt-1">
            Bookings are only available for the current day. (9 AM - 6 PM)
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4 my-6">
          <Button variant="outline" size="icon" disabled={true}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-lg font-medium">
            <CalendarDays className="h-5 w-5 text-primary" />
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
          <Button variant="outline" size="icon" disabled={true}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <p className="text-center">Loading room availability...</p>
        ) : rooms.every(room => room.slots.length === 0) && isToday(currentDate) ? (
           <p className="text-center text-destructive font-medium">
            Booking slots for today might be over or not yet started for the day (available 9 AM - 6 PM).
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
                currentTime={currentTime}
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
            if (!open) setSelectedBookingDetails(null);
          }}
          room={selectedBookingDetails.room}
          slot={selectedBookingDetails.slot}
          userEmail={user?.email || ''}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </AuthGuard>
  );
}

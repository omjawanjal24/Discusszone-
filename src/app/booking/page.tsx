
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { RoomCard } from '@/components/booking/RoomCard';
import type { Room, TimeSlot, GroupMember, User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isEqual, startOfDay, isToday, parse } from 'date-fns';
import { GroupBookingDialog } from '@/components/booking/GroupBookingDialog';
import { VISUAL_SEAT_IDS } from '@/components/booking/RoomLayoutVisual'; // Import seat IDs

const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const openingHour = 8;
  const closingHour = 20; // 8 PM

  if (!isToday(date)) {
    return [];
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // If current time is past closing hour, no slots for today.
  if (currentHour >= closingHour) {
    return [];
  }
  
  // Determine the starting hour for today's slots
  // If current hour is before opening, start from openingHour
  // If current hour is after opening, start from the next full hour if current minute > 0, else from current hour
  let startHourForToday = openingHour;
  if (currentHour >= openingHour) {
    startHourForToday = currentMinutes > 0 ? currentHour + 1 : currentHour;
  }
  
  const effectiveStartHour = Math.max(openingHour, startHourForToday);


  for (let hour = effectiveStartHour; hour < closingHour; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push({
      id: `slot-${date.toISOString().split('T')[0]}-${hour.toString().padStart(2, '0')}`,
      startTime,
      endTime,
      isBooked: false,
      occupants: [], // Initialize occupants
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

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update current time every minute for real-time slot status
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    if (currentDate instanceof Date && !isNaN(currentDate.getTime())) {
      // Attempt to load bookings from localStorage
      const storedBookingsKey = `discussZoneBookings-${format(currentDate, 'yyyy-MM-dd')}`;
      let mergedRoomsData: Room[];
      try {
        const storedBookings = localStorage.getItem(storedBookingsKey);
        if (storedBookings) {
          const parsedRooms = JSON.parse(storedBookings) as Room[];
          // We need to regenerate slots for today to ensure they are fresh, then merge booking status
          const freshRoomsData = initialRoomsData(currentDate);
          mergedRoomsData = freshRoomsData.map(freshRoom => {
            const storedRoom = parsedRooms.find(sr => sr.id === freshRoom.id);
            if (storedRoom) {
              return {
                ...freshRoom,
                slots: freshRoom.slots.map(freshSlot => {
                  const storedSlot = storedRoom.slots.find(ss => ss.id === freshSlot.id);
                  return storedSlot && storedSlot.isBooked ? { ...freshSlot, ...storedSlot } : freshSlot;
                })
              };
            }
            return freshRoom;
          });
        } else {
          mergedRoomsData = initialRoomsData(currentDate);
        }
      } catch (e) {
        console.error("Failed to parse bookings from localStorage", e);
        mergedRoomsData = initialRoomsData(currentDate);
      }
      setRooms(mergedRoomsData);
    } else {
      console.error("currentDate is invalid in BookingPage useEffect");
      setRooms([]);
    }
    setIsLoading(false);
  }, [currentDate, currentTime]); // Re-evaluate rooms when currentTime changes for dynamic slot generation

  const saveBookingsToLocalStorage = useCallback((updatedRooms: Room[]) => {
    try {
      const bookingsKey = `discussZoneBookings-${format(currentDate, 'yyyy-MM-dd')}`;
      localStorage.setItem(bookingsKey, JSON.stringify(updatedRooms));
    } catch (error) {
      console.error("Failed to save bookings to localStorage", error);
      toast({ title: "Storage Error", description: "Could not save booking. Local storage might be full or disabled.", variant: "destructive"});
    }
  }, [currentDate, toast]);


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

  const formatTimeForDisplay = useCallback((time24: string): string => {
    const [hoursStr, minutesStr] = time24.split(':');
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    const date = new Date(); 
    date.setHours(hours, minutes);
    return format(date, 'hh:mm a');
  },[]);

  const handleConfirmBooking = useCallback((roomId: string, slotId: string, groupMembers: GroupMember[], agreedToTerms: boolean) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to book a slot.", variant: "destructive" });
      return;
    }
    if (!agreedToTerms) {
      toast({ title: "Agreement Required", description: "You must agree to the Terms & Conditions to book a slot.", variant: "destructive" });
      return;
    }

    const updatedRooms = rooms.map(room => {
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
                toast({ title: "Slot Unavailable", description: "This slot was booked by someone else just now.", variant: "destructive" });
                return slot;
              }

              const occupants: Array<{ seatId: string; name: string; isBooker: boolean }> = [];
              // Assign booker to the first available visual seat ID
              occupants.push({ seatId: VISUAL_SEAT_IDS[0], name: user.email || 'Booker', isBooker: true });
              // Assign group members to subsequent visual seat IDs
              groupMembers.forEach((member, index) => {
                if (index + 1 < VISUAL_SEAT_IDS.length) { // Ensure we don't exceed available visual seat IDs
                  occupants.push({ seatId: VISUAL_SEAT_IDS[index + 1], name: member.name, isBooker: false });
                }
              });
              
              const isGroupBooking = groupMembers.length > 0;
              const displayStartTime = formatTimeForDisplay(slot.startTime);
              const displayEndTime = formatTimeForDisplay(slot.endTime);
              
              let bookingMessage = `You've booked ${room.name} from ${displayStartTime} to ${displayEndTime}.`;
              if (isGroupBooking) {
                bookingMessage = `You've booked ${room.name} from ${displayStartTime} to ${displayEndTime} for yourself and ${groupMembers.length} other(s).`;
              }
              toast({ title: "Slot Booked!", description: bookingMessage });
              return {
                ...slot,
                isBooked: true,
                bookedBy: user.prn,
                bookedByName: user.email,
                isGroupBooking,
                groupMembers: isGroupBooking ? groupMembers : undefined,
                occupants, // Save occupant details
              };
            }
            return slot;
          }),
        };
      }
      return room;
    });
    setRooms(updatedRooms);
    saveBookingsToLocalStorage(updatedRooms); // Save to localStorage
    setIsBookingDialogOpen(false);
    setSelectedBookingDetails(null);
  }, [user, toast, rooms, formatTimeForDisplay, saveBookingsToLocalStorage]);
  
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
          <Button variant="outline" size="icon" disabled={true} >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-lg font-medium">
            <CalendarDays className="h-5 w-5 text-primary" />
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
          <Button variant="outline" size="icon" disabled={true} >
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
                currentTime={currentTime}
              />
            ))}
          </div>
        )}
      </div>
      {selectedBookingDetails && user && ( // Ensure user is not null for userEmail prop
        <GroupBookingDialog
          open={isBookingDialogOpen}
          onOpenChange={(open) => {
            setIsBookingDialogOpen(open);
            if (!open) setSelectedBookingDetails(null);
          }}
          room={selectedBookingDetails.room}
          slot={selectedBookingDetails.slot}
          userEmail={user.email || ''}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </AuthGuard>
  );
}

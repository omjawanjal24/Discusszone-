"use client";

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { RoomCard } from '@/components/booking/RoomCard';
import type { Room, TimeSlot } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isEqual, startOfDay, isToday } from 'date-fns';

const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const openingHour = 9; // 9 AM
  const closingHour = 18; // 6 PM (last slot ends at 6 PM)

  // Only generate slots for the current day
  if (!isToday(date)) {
    return [];
  }

  for (let hour = openingHour; hour < closingHour; hour++) {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    // Unique ID based on room and time to avoid collisions if we had multiple rooms
    // But for now, just time as room ID will be prepended later
    slots.push({
      id: `${format(startTime, 'HHmm')}`,
      startTime: format(startTime, 'HH:mm'),
      endTime: format(endTime, 'HH:mm'),
      isBooked: false, // Initially all slots are available
    });
  }
  return slots;
};

const initialRoomsData = (date: Date): Room[] => [
  { id: 'room1', name: 'Discussion Room 1', slots: generateTimeSlots(date) },
  { id: 'room2', name: 'Discussion Room 2', slots: generateTimeSlots(date) },
  { id: 'room3', name: 'Discussion Room 3', slots: generateTimeSlots(date) },
  { id: 'room4', name: 'Discussion Room 4', slots: generateTimeSlots(date) },
];


export default function BookingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [rooms, setRooms] = useState<Room[]>(initialRoomsData(currentDate));
  const [isLoading, setIsLoading] = useState(true);
  
  // Effect to re-initialize rooms when date changes
  useEffect(() => {
    setIsLoading(true);
    setRooms(initialRoomsData(currentDate));
    setIsLoading(false);
  }, [currentDate]);

  const handleBookSlot = (roomId: string, slotId: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to book a slot.", variant: "destructive" });
      return;
    }

    // Booking is only allowed for the present day
    if (!isToday(currentDate)) {
      toast({ title: "Booking Error", description: "Bookings are only allowed for the current day.", variant: "destructive" });
      return;
    }

    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            slots: room.slots.map(slot => {
              if (slot.id === slotId) {
                if (slot.isBooked) {
                  toast({ title: "Slot Unavailable", description: "This slot is already booked.", variant: "destructive" });
                  return slot;
                }
                toast({ title: "Slot Booked!", description: `You've booked ${room.name} from ${slot.startTime} to ${slot.endTime}.` });
                return { ...slot, isBooked: true, bookedBy: user.prn, bookedByName: user.email }; // Using email as name for simplicity
              }
              return slot;
            }),
          };
        }
        return room;
      })
    );
  };
  
  // For this app, booking is only for the current day. So no next/prev day functionality.
  // The date picker logic is simplified to just show current day.
  // If we were to enable next/prev day:
  // const handleNextDay = () => setCurrentDate(prev => addDays(startOfDay(prev), 1));
  // const handlePrevDay = () => setCurrentDate(prev => subDays(startOfDay(prev), 1));
  // const isPrevDisabled = isEqual(currentDate, startOfDay(new Date())); // Can't go to past days

  return (
    <AuthGuard>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Book a Discussion Room</h1>
          <p className="text-muted-foreground mt-2">
            Select an available time slot for {format(currentDate, 'eeee, MMMM do, yyyy')}.
          </p>
          <p className="text-sm text-primary mt-1">
            Bookings are only available for the current day.
          </p>
        </div>

        {/* Date navigation - simplified for current-day-only booking */}
        <div className="flex items-center justify-center space-x-4 my-6">
          <Button variant="outline" size="icon" disabled={true} /* onClick={handlePrevDay} */ >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-lg font-medium">
            <CalendarDays className="h-5 w-5 text-primary" />
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
          <Button variant="outline" size="icon" disabled={true} /* onClick={handleNextDay} */ >
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
              <RoomCard key={room.id} room={room} onBookSlot={handleBookSlot} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

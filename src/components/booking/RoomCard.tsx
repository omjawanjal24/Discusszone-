
"use client";

import React, { useMemo } from 'react';
import type { Room, TimeSlot, UserBooking } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TimeSlotButton } from './TimeSlotButton';
import { Users } from 'lucide-react';
import { RoomLayoutVisual } from './RoomLayoutVisual';
import { parse, isWithinInterval, format, compareAsc } from 'date-fns';

interface RoomCardProps {
  room: Room;
  onBookSlot: (roomId: string, slotId: string) => void;
  currentTime: Date;
}

// Helper function to format time for display (consistent with other parts of the app)
const formatTime = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, 'hh:mm a');
};

// Helper function to count total bookings for a user PRN from localStorage
const countUserTotalBookings = (userPrn?: string): number => {
  if (!userPrn) return 0;
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('discussZoneBookings-')) {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const roomsForDate = JSON.parse(storedData) as Room[];
          roomsForDate.forEach(roomOnDate => {
            roomOnDate.slots.forEach(slot => {
              if (slot.isBooked && slot.bookedBy === userPrn) {
                count++;
              }
            });
          });
        }
      }
    }
  } catch (error) {
    console.error("Error counting user bookings from localStorage:", error);
  }
  return count;
};


const RoomCardComponent = ({ room, onBookSlot, currentTime }: RoomCardProps) => {

  const visualOccupancyDetails = useMemo(() => {
    let activeBookedSlot: TimeSlot | undefined = undefined;
    let nextUpcomingBookedSlot: TimeSlot | undefined = undefined;
    
    const today = currentTime;

    for (const slot of room.slots) {
      if (slot.isBooked) {
        const startTimeToday = parse(slot.startTime, 'HH:mm', today);
        const endTimeToday = parse(slot.endTime, 'HH:mm', today);

        if (isWithinInterval(currentTime, { start: startTimeToday, end: endTimeToday })) {
          activeBookedSlot = slot;
          break; 
        }

        if (startTimeToday > currentTime) {
          if (!nextUpcomingBookedSlot || startTimeToday < parse(nextUpcomingBookedSlot.startTime, 'HH:mm', today)) {
            nextUpcomingBookedSlot = slot;
          }
        }
      }
    }
    
    const targetSlot = activeBookedSlot || nextUpcomingBookedSlot;

    if (targetSlot) {
      const totalBookings = countUserTotalBookings(targetSlot.bookedBy);
      return {
        occupants: targetSlot.occupants,
        visualizedSlotStartTime: formatTime(targetSlot.startTime),
        visualizedSlotEndTime: formatTime(targetSlot.endTime),
        mainBookerNameForSlot: targetSlot.bookedByName || targetSlot.bookedBy || "Unknown Booker",
        totalBookingsForMainBooker: totalBookings,
      };
    }

    return { occupants: undefined }; // Default if no relevant slot

  }, [room.slots, currentTime]);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{room.name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1.5" /> Capacity: {room.capacity} seats
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <RoomLayoutVisual 
          occupiedSeatsData={visualOccupancyDetails.occupants} 
          roomCapacity={room.capacity}
          visualizedSlotStartTime={visualOccupancyDetails.visualizedSlotStartTime}
          visualizedSlotEndTime={visualOccupancyDetails.visualizedSlotEndTime}
          mainBookerNameForSlot={visualOccupancyDetails.mainBookerNameForSlot}
          totalBookingsForMainBooker={visualOccupancyDetails.totalBookingsForMainBooker}
        />
        {room.slots.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No slots available for this room today.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {room.slots.map(slot => (
              <TimeSlotButton
                key={slot.id}
                slot={slot}
                roomId={room.id}
                onBookSlot={onBookSlot}
                currentTime={currentTime}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const RoomCard = React.memo(RoomCardComponent);

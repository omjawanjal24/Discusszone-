
"use client";

import React, { useMemo } from 'react';
import type { Room, TimeSlot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TimeSlotButton } from './TimeSlotButton';
import { Users } from 'lucide-react';
import { RoomLayoutVisual } from './RoomLayoutVisual';
import { parse, isWithinInterval } from 'date-fns';

interface RoomCardProps {
  room: Room;
  onBookSlot: (roomId: string, slotId: string) => void;
  currentTime: Date;
}

const RoomCardComponent = ({ room, onBookSlot, currentTime }: RoomCardProps) => {

  // Determine the occupants to display in RoomLayoutVisual
  const displayOccupants = useMemo(() => {
    let activeBookedSlot: TimeSlot | undefined = undefined;
    let nextUpcomingBookedSlot: TimeSlot | undefined = undefined;
    
    const today = currentTime; // Base date for parsing slot times

    for (const slot of room.slots) {
      if (slot.isBooked) {
        const startTimeToday = parse(slot.startTime, 'HH:mm', today);
        const endTimeToday = parse(slot.endTime, 'HH:mm', today);

        // Check if current time is within this slot's interval
        if (isWithinInterval(currentTime, { start: startTimeToday, end: endTimeToday })) {
          activeBookedSlot = slot;
          break; // Found an active slot, prioritize this
        }

        // If slot is in the future and is the earliest one found so far
        if (startTimeToday > currentTime) {
          if (!nextUpcomingBookedSlot || startTimeToday < parse(nextUpcomingBookedSlot.startTime, 'HH:mm', today)) {
            nextUpcomingBookedSlot = slot;
          }
        }
      }
    }
    
    const targetSlot = activeBookedSlot || nextUpcomingBookedSlot;
    return targetSlot?.occupants;

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
        <RoomLayoutVisual occupiedSeatsData={displayOccupants} roomCapacity={room.capacity} />
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

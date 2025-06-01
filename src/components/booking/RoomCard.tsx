
"use client";

import React from 'react';
import type { Room } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TimeSlotButton } from './TimeSlotButton';
import { Users } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onBookSlot: (roomId: string, slotId: string) => void;
  currentTime: Date;
}

const RoomCardComponent = ({ room, onBookSlot, currentTime }: RoomCardProps) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{room.name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1.5" /> Capacity: {room.capacity} seats
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
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

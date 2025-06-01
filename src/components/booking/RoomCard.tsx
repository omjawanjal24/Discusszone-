"use client";

import type { Room } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeSlotButton } from './TimeSlotButton';

interface RoomCardProps {
  room: Room;
  onBookSlot: (roomId: string, slotId: string) => void;
}

export function RoomCard({ room, onBookSlot }: RoomCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{room.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {room.slots.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No slots available for this room today.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {room.slots.map(slot => (
              <TimeSlotButton
                key={slot.id}
                slot={slot}
                onClick={() => onBookSlot(room.id, slot.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

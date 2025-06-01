
"use client";

import React, { useState, useCallback } from 'react';
import type { TimeSlot } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock, UserCheck, Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isToday, startOfDay } from 'date-fns';

interface TimeSlotButtonProps {
  slot: TimeSlot;
  roomId: string;
  onBookSlot: (roomId: string, slotId: string) => void;
  currentTime: Date; // Received from parent
}

const TimeSlotButtonComponent = ({ slot, roomId, onBookSlot, currentTime }: TimeSlotButtonProps) => {
  const [isClicked, setIsClicked] = useState(false);

  // The parent (BookingPage) now handles opening the dialog or showing "already booked" toast.
  // It also handles checking if the slot is past before opening the dialog.
  const handleClick = useCallback(() => {
    onBookSlot(roomId, slot.id);
    
    // Visual feedback for available slots
    if (!slot.isBooked) {
      // Determine if slot is past, using the passed currentTime
      const slotEndTimeParts = slot.endTime.split(':');
      // Assuming slots are for 'today' relative to the booking page's currentDate
      // For simplicity, we'll assume `currentTime` reflects the relevant day context.
      // A more robust solution might involve passing `currentDate` from BookingPage as well.
      const slotEndDate = new Date(currentTime); 
      slotEndDate.setHours(parseInt(slotEndTimeParts[0]), parseInt(slotEndTimeParts[1]), 0, 0);
      
      // Only apply pulse if not past
      if (!(slotEndDate < currentTime && isToday(startOfDay(currentTime)))) {
         setIsClicked(true);
         setTimeout(() => setIsClicked(false), 1500); 
      }
    }
  }, [onBookSlot, roomId, slot.id, slot.isBooked, slot.endTime, currentTime]);
  
  const slotEndTimeParts = slot.endTime.split(':');
  // We need to know the date context for the slot to compare accurately.
  // Assuming `currentTime`'s date part is the relevant date (e.g., from BookingPage's `currentDate`)
  const slotDateContext = startOfDay(currentTime); 
  const slotEndDate = new Date(slotDateContext);
  slotEndDate.setHours(parseInt(slotEndTimeParts[0]), parseInt(slotEndTimeParts[1]), 0, 0);

  // A slot is past if its end time is before the current time, but only if it's for today.
  // This check assumes the slots are always for `isToday(slotDateContext)`.
  // The parent component `BookingPage` handles whether slots are generated for non-today dates.
  const isPastSlot = slotEndDate < currentTime && isToday(slotDateContext) ;


  let tooltipMessage = `Book slot ${slot.startTime} - ${slot.endTime}`;
  if (slot.isBooked) {
    tooltipMessage = `Booked by: ${slot.bookedByName || slot.bookedBy}`;
    if (slot.isGroupBooking && slot.groupMembers) {
      tooltipMessage += ` (Group of ${1 + slot.groupMembers.length})`;
    }
  } else if (isPastSlot) {
    tooltipMessage = "This time slot has passed.";
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={slot.isBooked ? "destructive" : "outline"}
            className={cn(
              "w-full h-12 text-xs md:text-sm transition-all duration-300 ease-in-out transform",
              slot.isBooked ? "cursor-not-allowed bg-destructive/80 hover:bg-destructive text-destructive-foreground" : 
                isPastSlot ? "cursor-not-allowed bg-muted text-muted-foreground opacity-70" : 
                "hover:bg-primary hover:text-primary-foreground hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2",
              isClicked && !slot.isBooked && !isPastSlot && "animate-slot-pulse bg-green-400 dark:bg-green-600",
              "flex flex-col items-center justify-center p-1"
            )}
            onClick={handleClick}
            disabled={slot.isBooked || isPastSlot} // Keep disabled for already booked or past slots
            aria-label={tooltipMessage}
          >
            <span className="font-medium">{slot.startTime}</span>
            <span className="text-xs opacity-80">- {slot.endTime}</span>
            {slot.isBooked && (slot.isGroupBooking ? <Users className="h-3 w-3 mt-0.5" /> : <Lock className="h-3 w-3 mt-0.5" />)}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="flex items-center gap-1">
            {slot.isBooked ? (slot.isGroupBooking ? <Users size={14}/> : <UserCheck size={14} />) : null}
             {isPastSlot && !slot.isBooked ? <Lock size={14}/> : null}
            {tooltipMessage}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const TimeSlotButton = React.memo(TimeSlotButtonComponent);

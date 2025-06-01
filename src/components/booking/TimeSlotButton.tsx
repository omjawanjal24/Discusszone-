
"use client";

import React, { useState, useCallback, useMemo } from 'react';
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
import { isToday, startOfDay, format } from 'date-fns';

interface TimeSlotButtonProps {
  slot: TimeSlot;
  roomId: string;
  onBookSlot: (roomId: string, slotId: string) => void;
  currentTime: Date; 
}

const TimeSlotButtonComponent = ({ slot, roomId, onBookSlot, currentTime }: TimeSlotButtonProps) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = useCallback(() => {
    onBookSlot(roomId, slot.id);
    
    if (!slot.isBooked) {
      const slotEndTimeParts = slot.endTime.split(':');
      const slotEndDate = new Date(currentTime); 
      slotEndDate.setHours(parseInt(slotEndTimeParts[0]), parseInt(slotEndTimeParts[1]), 0, 0);
      
      if (!(slotEndDate < currentTime && isToday(startOfDay(currentTime)))) {
         setIsClicked(true);
         setTimeout(() => setIsClicked(false), 1500); 
      }
    }
  }, [onBookSlot, roomId, slot.id, slot.isBooked, slot.endTime, currentTime]);
  
  const slotEndTimeParts = slot.endTime.split(':');
  const slotDateContext = startOfDay(currentTime); 
  const slotEndDate = new Date(slotDateContext);
  slotEndDate.setHours(parseInt(slotEndTimeParts[0]), parseInt(slotEndTimeParts[1]), 0, 0);

  const isPastSlot = slotEndDate < currentTime && isToday(slotDateContext) ;

  const formatTimeForDisplay = useCallback((time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const date = new Date(); // Date part doesn't significantly matter for hh:mm a format
    date.setHours(hours, minutes);
    return format(date, 'hh:mm a');
  }, []);

  const displayStartTime = useMemo(() => formatTimeForDisplay(slot.startTime), [slot.startTime, formatTimeForDisplay]);
  const displayEndTime = useMemo(() => formatTimeForDisplay(slot.endTime), [slot.endTime, formatTimeForDisplay]);

  let tooltipMessage = `Book slot ${displayStartTime} - ${displayEndTime}`;
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
            disabled={slot.isBooked || isPastSlot} 
            aria-label={tooltipMessage}
          >
            <span className="font-medium">{displayStartTime}</span>
            <span className="text-xs opacity-80">- {displayEndTime}</span>
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

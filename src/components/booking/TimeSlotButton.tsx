
"use client";

import React, { useState, useEffect } from 'react';
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

interface TimeSlotButtonProps {
  slot: TimeSlot;
  onClick: () => void;
}

export function TimeSlotButton({ slot, onClick }: TimeSlotButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    // The parent (BookingPage) now handles opening the dialog or showing "already booked" toast.
    // The click on TimeSlotButton is primarily to signal intent to book this slot.
    onClick();
    
    if (!slot.isBooked) {
      setIsClicked(true);
      // Visual feedback reset is handled by dialog closure or if booking fails.
      // For simplicity, we can keep a short timeout here if dialog isn't always shown for every click.
      setTimeout(() => setIsClicked(false), 1500); 
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const slotEndTimeParts = slot.endTime.split(':');
  const slotEndDate = new Date();
  slotEndDate.setHours(parseInt(slotEndTimeParts[0]), parseInt(slotEndTimeParts[1]), 0, 0);

  const isPastSlot = slotEndDate < currentTime;

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
            // Dialog handles enabling/disabling based on actual booking logic now
            // disabled={slot.isBooked || isPastSlot} 
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
            {tooltipMessage}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

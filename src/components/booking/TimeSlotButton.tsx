"use client";

import React, { useState, useEffect } from 'react';
import type { TimeSlot } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock, UserCheck } from 'lucide-react';
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
    if (!slot.isBooked) {
      setIsClicked(true);
      onClick(); // Propagate click to parent
      // Reset visual feedback after a short delay if not actually booked by parent logic
      // Parent logic will handle the actual booking state. This is just for immediate UI feedback.
      setTimeout(() => setIsClicked(false), 1500); 
    } else {
      // If already booked, still call onClick to potentially show a message like "already booked"
      onClick();
    }
  };

  // Determine current time to disable past slots
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const slotEndTimeParts = slot.endTime.split(':');
  const slotEndDate = new Date(); // Assuming current day booking
  slotEndDate.setHours(parseInt(slotEndTimeParts[0]), parseInt(slotEndTimeParts[1]), 0, 0);

  const isPastSlot = slotEndDate < currentTime;

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
              isClicked && !slot.isBooked && !isPastSlot && "animate-slot-pulse bg-green-400 dark:bg-green-600", // Use a distinct color for click feedback
              "flex flex-col items-center justify-center p-1"
            )}
            onClick={handleClick}
            disabled={slot.isBooked || isPastSlot}
            aria-label={slot.isBooked ? `Slot ${slot.startTime} - ${slot.endTime} booked by ${slot.bookedByName || slot.bookedBy}` : `Book slot ${slot.startTime} - ${slot.endTime}`}
          >
            <span className="font-medium">{slot.startTime}</span>
            <span className="text-xs opacity-80">- {slot.endTime}</span>
            {slot.isBooked && <Lock className="h-3 w-3 mt-0.5" />}
          </Button>
        </TooltipTrigger>
        {slot.isBooked && slot.bookedByName && (
           <TooltipContent side="bottom">
            <p className="flex items-center gap-1"><UserCheck size={14} /> Booked by: {slot.bookedByName}</p>
          </TooltipContent>
        )}
        {isPastSlot && !slot.isBooked && (
           <TooltipContent side="bottom">
            <p>This time slot has passed.</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

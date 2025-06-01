
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from 'lucide-react';

interface ChairProps {
  seatId: string;
  style?: React.CSSProperties;
  isOccupied: boolean;
  occupantName?: string;
  isBooker?: boolean;
}

export const Chair: React.FC<ChairProps> = ({ seatId, style, isOccupied, occupantName, isBooker }) => {
  const chairBaseClasses = "absolute w-[10%] h-[12%] rounded-sm shadow transition-colors duration-300";
  const occupiedBookerClasses = "bg-primary text-primary-foreground"; // Booker uses primary color
  const occupiedMemberClasses = "bg-destructive text-destructive-foreground"; // Member uses destructive color
  const availableClasses = "bg-card hover:bg-muted";

  const chairClasses = cn(
    chairBaseClasses,
    isOccupied ? (isBooker ? occupiedBookerClasses : occupiedMemberClasses) : availableClasses
  );

  const ChairElement = (
    <div
      className={chairClasses}
      style={style}
      aria-label={isOccupied ? `Seat ${seatId} - Occupied by ${occupantName}` : `Seat ${seatId} - Available`}
      role="button" // Making it interactive for tooltip
      tabIndex={0} // For focusability
    >
      {isOccupied && <User className="w-full h-full p-1 opacity-75" />}
    </div>
  );

  if (isOccupied && occupantName) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{ChairElement}</TooltipTrigger>
          <TooltipContent>
            <p>{occupantName} {isBooker && "(Booker)"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return ChairElement;
};

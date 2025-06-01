
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
  isThisOccupantTheBooker?: boolean; // Is this occupant the primary booker of the slot?
  slotStartTime?: string;           // Start time of the visualized slot
  slotEndTime?: string;             // End time of the visualized slot
  mainBookerNameForSlot?: string;   // Name of the primary booker for the visualized slot
  totalBookingsForMainBooker?: number; // Total bookings count for the primary booker
}

export const Chair: React.FC<ChairProps> = ({ 
  seatId, 
  style, 
  isOccupied, 
  occupantName, 
  isThisOccupantTheBooker,
  slotStartTime,
  slotEndTime,
  mainBookerNameForSlot,
  totalBookingsForMainBooker
}) => {
  const chairBaseClasses = "absolute w-[10%] h-[12%] rounded-sm shadow transition-colors duration-300 flex items-center justify-center";
  const occupiedBookerClasses = "bg-primary text-primary-foreground"; 
  const occupiedMemberClasses = "bg-destructive text-destructive-foreground"; 
  const availableClasses = "bg-card hover:bg-muted";

  const chairClasses = cn(
    chairBaseClasses,
    isOccupied ? (isThisOccupantTheBooker ? occupiedBookerClasses : occupiedMemberClasses) : availableClasses
  );

  const TooltipDetail: React.FC = () => {
    if (!isOccupied || !occupantName) return <p>Seat {seatId}</p>;
    
    return (
      <div className="text-xs space-y-0.5">
        <p className="font-semibold">{occupantName} {isThisOccupantTheBooker ? "(Booker)" : "(Group Member)"}</p>
        {slotStartTime && slotEndTime && (
          <p>Slot: {slotStartTime} - {slotEndTime}</p>
        )}
        {isThisOccupantTheBooker && totalBookingsForMainBooker !== undefined && (
          <p>Your Total Bookings: {totalBookingsForMainBooker}</p>
        )}
        {!isThisOccupantTheBooker && mainBookerNameForSlot && totalBookingsForMainBooker !== undefined && (
          <p>Booked by: {mainBookerNameForSlot} ({totalBookingsForMainBooker} total)</p>
        )}
      </div>
    );
  };


  const ChairElement = (
    <div
      className={chairClasses}
      style={style}
      aria-label={isOccupied ? `Seat ${seatId} - Occupied by ${occupantName}` : `Seat ${seatId} - Available`}
      role="button"
      tabIndex={0}
    >
      {isOccupied && <User className="w-3/4 h-3/4 opacity-75" />}
    </div>
  );

  if (isOccupied && occupantName) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{ChairElement}</TooltipTrigger>
          <TooltipContent>
            <TooltipDetail />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return ChairElement;
};

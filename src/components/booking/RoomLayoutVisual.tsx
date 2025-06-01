
"use client";

import React from 'react';
import { Chair } from './Chair'; // Import the new Chair component

interface OccupantData {
  seatId: string;
  name: string;
  isBooker: boolean;
}

interface RoomLayoutVisualProps {
  occupiedSeatsData?: OccupantData[];
  roomCapacity: number;
  visualizedSlotStartTime?: string;
  visualizedSlotEndTime?: string;
  mainBookerNameForSlot?: string;
  totalBookingsForMainBooker?: number;
}

// Define seat configurations (ID for mapping, style for positioning)
const seatConfigurations = [
  { id: 'S1', style: { top: '12%', left: '22.5%', transform: 'translateX(-50%)' } },
  { id: 'S2', style: { top: '12%', left: '37.5%', transform: 'translateX(-50%)' } },
  { id: 'S3', style: { top: '12%', left: '62.5%', transform: 'translateX(-50%)' } },
  { id: 'S4', style: { top: '12%', left: '77.5%', transform: 'translateX(-50%)' } },
  { id: 'S5', style: { bottom: '12%', left: '22.5%', transform: 'translateX(-50%)' } },
  { id: 'S6', style: { bottom: '12%', left: '37.5%', transform: 'translateX(-50%)' } },
  { id: 'S7', style: { bottom: '12%', left: '62.5%', transform: 'translateX(-50%)' } },
  { id: 'S8', style: { bottom: '12%', left: '77.5%', transform: 'translateX(-50%)' } },
  { id: 'S9', style: { top: '50%', left: '8%', transform: 'translateY(-50%)' } },
  { id: 'S10', style: { top: '50%', right: '8%', transform: 'translateY(-50%)' } },
];

export const RoomLayoutVisual: React.FC<RoomLayoutVisualProps> = ({ 
  occupiedSeatsData = [], 
  roomCapacity,
  visualizedSlotStartTime,
  visualizedSlotEndTime,
  mainBookerNameForSlot,
  totalBookingsForMainBooker 
}) => {
  return (
    <div
      className="relative w-full aspect-video bg-lime-200 dark:bg-lime-800/60 p-2 sm:p-4 rounded-lg shadow-lg my-4"
      role="img"
      aria-label={`Visual representation of a discussion room layout. Capacity: ${roomCapacity} seats.`}
    >
      {/* Table */}
      <div
        className="absolute top-[30%] left-[20%] w-[60%] h-[40%] bg-amber-600 dark:bg-amber-700 rounded-md shadow-md"
        aria-hidden="true"
      />

      {/* Chairs - Rendered dynamically */}
      {seatConfigurations.map((seatConfig) => {
        const occupantInThisSeat = occupiedSeatsData.find(occ => occ.seatId === seatConfig.id);
        const isOccupied = !!occupantInThisSeat;
        
        return (
          <Chair
            key={seatConfig.id}
            seatId={seatConfig.id}
            style={seatConfig.style}
            isOccupied={isOccupied}
            occupantName={occupantInThisSeat?.name}
            isThisOccupantTheBooker={occupantInThisSeat?.isBooker}
            slotStartTime={visualizedSlotStartTime}
            slotEndTime={visualizedSlotEndTime}
            mainBookerNameForSlot={mainBookerNameForSlot}
            totalBookingsForMainBooker={totalBookingsForMainBooker}
          />
        );
      })}
    </div>
  );
};

export const VISUAL_SEAT_IDS = seatConfigurations.map(s => s.id);

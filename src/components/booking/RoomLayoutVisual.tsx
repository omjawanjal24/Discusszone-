
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
  roomCapacity: number; // For context, though visual is fixed for now
}

// Define seat configurations (ID for mapping, style for positioning)
// These IDs must be used consistently when assigning occupants.
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

export const RoomLayoutVisual: React.FC<RoomLayoutVisualProps> = ({ occupiedSeatsData = [], roomCapacity }) => {
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
      {seatConfigurations.map((seatConfig, index) => {
        // Only render chairs up to the visual limit, or room capacity if it's less than visual limit for more accuracy.
        // However, the visual is fixed at 10 chairs. If capacity is 8, we show 10 chairs, 8 of which can be occupied.
        // If capacity is 12, we show 10 chairs, all 10 can be occupied, and it implies 2 more are not visually shown.
        // For simplicity, we render all 10 visual chairs.
        
        const occupant = occupiedSeatsData.find(occ => occ.seatId === seatConfig.id);
        return (
          <Chair
            key={seatConfig.id}
            seatId={seatConfig.id}
            style={seatConfig.style}
            isOccupied={!!occupant}
            occupantName={occupant?.name}
            isBooker={occupant?.isBooker}
          />
        );
      })}
    </div>
  );
};

// Expose seat IDs for booking logic if needed elsewhere, though better to keep it encapsulated or pass as prop.
export const VISUAL_SEAT_IDS = seatConfigurations.map(s => s.id);

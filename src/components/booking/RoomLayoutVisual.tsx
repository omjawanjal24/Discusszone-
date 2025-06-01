
"use client";

import React from 'react';

interface RoomLayoutVisualProps {
  // No props needed for now, as it's a static visual based on the image
}

const Chair: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  return (
    <div
      className="absolute w-[10%] h-[12%] bg-card rounded-sm shadow"
      style={style}
      aria-hidden="true"
    />
  );
};

export const RoomLayoutVisual: React.FC<RoomLayoutVisualProps> = () => {
  return (
    <div 
      className="relative w-full aspect-video bg-lime-200 dark:bg-lime-800/60 p-2 sm:p-4 rounded-lg shadow-lg my-4"
      role="img"
      aria-label="Visual representation of a discussion room layout with a central table and chairs."
    >
      {/* Table */}
      <div
        className="absolute top-[30%] left-[20%] w-[60%] h-[40%] bg-amber-600 dark:bg-amber-700 rounded-md shadow-md"
        aria-hidden="true"
      />

      {/* Top Chairs (4) */}
      <Chair style={{ top: '12%', left: '22.5%', transform: 'translateX(-50%)' }} />
      <Chair style={{ top: '12%', left: '37.5%', transform: 'translateX(-50%)' }} />
      <Chair style={{ top: '12%', left: '62.5%', transform: 'translateX(-50%)' }} />
      <Chair style={{ top: '12%', left: '77.5%', transform: 'translateX(-50%)' }} />

      {/* Bottom Chairs (4) */}
      <Chair style={{ bottom: '12%', left: '22.5%', transform: 'translateX(-50%)' }} />
      <Chair style={{ bottom: '12%', left: '37.5%', transform: 'translateX(-50%)' }} />
      <Chair style={{ bottom: '12%', left: '62.5%', transform: 'translateX(-50%)' }} />
      <Chair style={{ bottom: '12%', left: '77.5%', transform: 'translateX(-50%)' }} />

      {/* Left Chair (1) */}
      <Chair style={{ top: '50%', left: '8%', transform: 'translateY(-50%)' }} />

      {/* Right Chair (1) */}
      <Chair style={{ top: '50%', right: '8%', transform: 'translateY(-50%)' }} />
    </div>
  );
};

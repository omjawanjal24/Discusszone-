
export interface User {
  id?: string; // Optional, could be generated or from backend
  email: string;
  prn: string;
  gender: 'male' | 'female' | 'other';
  role: 'student' | 'faculty';
  password?: string; // Should not be stored in frontend state long-term if real auth
  avatarUrl?: string;
  isAdmin?: boolean; // Added for admin role
  isVerified: boolean; // Added for email verification flow
}

export interface GroupMember {
  email: string;
  name: string;
}

export interface TimeSlot {
  id: string; // e.g., "room1-0900"
  startTime: string; // "HH:mm" format e.g., "09:00"
  endTime: string; // "HH:mm" format e.g., "10:00"
  isBooked: boolean;
  bookedBy?: string; // User's PRN or ID
  bookedByName?: string; // User's name for display
  isGroupBooking?: boolean;
  groupMembers?: GroupMember[];
  occupants?: Array<{ seatId: string; name: string; isBooker: boolean }>; // Added for seat visual
}

export interface Room {
  id: string; // "room1", "room2", etc.
  name: string; // "Discussion Room 1"
  capacity: number;
  slots: TimeSlot[];
}

export interface UserBooking {
  id: string; // Unique ID for the booking, can be slot.id + date + room.id
  date: string; // YYYY-MM-DD
  roomName: string;
  roomId: string;
  slotId: string;
  startTime: string; // HH:mm formatted for display
  endTime: string; // HH:mm formatted for display
  isGroupBooking?: boolean;
  groupMembers?: GroupMember[];
  occupants?: Array<{ seatId: string; name: string; isBooker: boolean }>;
  bookedByName?: string;
}

// For Admin Panel - Manage Bookings
export interface AdminBookingView extends UserBooking {
  originalSlotId: string; // To help locate the slot for cancellation
  originalRoomId: string; // To help locate the room for cancellation
  originalDate: string; // Date in YYYY-MM-DD format for localStorage key
}


export interface User {
  id?: string; // Optional, could be generated or from backend
  email: string;
  prn: string;
  gender: 'male' | 'female' | 'other';
  role: 'student' | 'faculty';
  password?: string; // Should not be stored in frontend state long-term if real auth
  avatarUrl?: string;
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
}

export interface Room {
  id: string; // "room1", "room2", etc.
  name: string; // "Discussion Room 1"
  capacity: number;
  slots: TimeSlot[];
}

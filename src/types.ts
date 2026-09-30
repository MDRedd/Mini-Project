export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type SlotId = 'I' | 'II' | 'SB' | 'III' | 'IV' | 'LB' | 'V' | 'VI';

export interface Slot {
  id: SlotId;
  name: string;
  time: string;
  duration: string;
  isActive: boolean;
  isBreak: boolean;
}

export interface Batch {
  id: string;
  name: string; // e.g., "CSE-A", "CSE-B"
  yearOfJoining: number; // e.g., 2023 (for IV Year in 2026-2027)
  semester: number; // e.g., 7
  studentCount?: number; // size of batch
  preferredRoomId?: string; // dedicated home classroom
}

export interface Faculty {
  id: string;
  name: string;
  phone: string;
  maxHoursPerDay: number;
  specialization?: string;
  division?: string;
  designation?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  type: 'Theory' | 'Lab' | 'Seminar';
  capacity: number;
}

export interface Course {
  id: string;
  courseCode: string;
  name: string;
  type: 'Theory' | 'Lab' | 'Long Duration' | 'Non-Academic';
  durationSlots: number; // 1 for theory, 2 for lab, 5 for long duration (like project)
  credits: number;
}

export interface FacultyCourseMapping {
  id: string;
  facultyId: string;
  courseId: string;
}

export interface SemesterCourseMap {
  id: string;
  semester: number;
  batchId: string; // Target specific batch or all batches in that semester
  courseId: string;
  L?: number;
  T?: number;
  P?: number;
}

export interface TimetableEntry {
  id: string;
  day: Day;
  slotId: SlotId;
  batchId: string;
  courseId: string;
  facultyId: string;
  roomId: string;
  isLocked: boolean;
  colSpan: number; // For merging columns, e.g., 2 for labs, 4/5 for project
}

export interface ScheduleConflict {
  type: 'faculty' | 'room' | 'batch' | 'break' | 'consecutive';
  message: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

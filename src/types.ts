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

export type UserRole = 'super_admin' | 'admin' | 'faculty' | 'student';

export interface AdminPermissions {
  canRunCspSolver: boolean;
  canEditTimetableSlots: boolean;
  canManageFaculty: boolean;
  canManageCourses: boolean;
  canManageRooms: boolean;
  canManageCurriculum: boolean;
  canManageBatches: boolean;
  canClearGrids: boolean;
  canExportReports: boolean;
  canViewAnalytics: boolean;
  canAssignFacultyMappings: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation?: string;
  avatar?: string;
  pin?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  customPermissions?: Partial<AdminPermissions>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userName: string;
  userRole: UserRole;
  details: string;
  category: 'security' | 'schedule' | 'curriculum' | 'system' | 'override';
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface SystemPolicySettings {
  institutionName: string;
  departmentName: string;
  academicYear: string;
  emergencyFreezeTimetables: boolean;
  strictAicteEnforcement: boolean;
  allowAdminTimetableWipe: boolean;
  requireSuperAdminApprovalForOverrides: boolean;
  maxDailyFacultyHours: number;
  enableAuditLogging: boolean;
  autoBackupOnSolver: boolean;
  adminPermissions: AdminPermissions;
}

export interface FacultyAvailability {
  facultyId: string;
  day: Day;
  slotId?: SlotId;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'LEAVE' | 'PREFERRED';
  reason?: string;
}

export interface ElectiveGroup {
  id: string;
  name: string; // e.g., "Professional Elective I"
  semester: number;
  batchIds: string[]; // Batches sharing this elective band
  courseIds: string[]; // Parallel elective courses (AI, Cloud, CyberSec)
}

export interface SolverDiagnostics {
  unplacedCourses: {
    batchId: string;
    batchName: string;
    courseId: string;
    courseName: string;
    required: number;
    placed: number;
    deficit: number;
    reason: string;
  }[];
  hardViolations: string[];
  facultySaturation: { facultyId: string; facultyName: string; assignedHours: number; maxAllowed: number }[];
  roomUtilization: { roomId: string; roomNumber: string; occupiedSlots: number; capacityPct: number }[];
}

export interface SolverOptions {
  enableSmartRelaxation?: boolean;
  maxSessionDuration?: number;
  allowThreeHourSessions?: boolean;
  prioritizeMorningTheory?: boolean; // Heavy theory in Slots I-II, Labs/Activities in Slots III-VI
  enableFacultyResearchDay?: boolean; // Ensure faculty get >=1 free day for research/prep
  maxDailyHours?: number; // Configurable max daily teaching hours (default 4)
  clearPrevious?: boolean;
  maxIterations?: number; // Configurable search budget (e.g. 50,000)
  maxExecutionTimeMs?: number; // Configurable time limit (e.g. 5,000 ms)
  facultyAvailabilities?: FacultyAvailability[];
  electiveGroups?: ElectiveGroup[];
  require100PercentSatisfaction?: boolean;
}



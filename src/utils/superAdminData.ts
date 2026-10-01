import { UserAccount, UserRole, AdminPermissions, AuditLogEntry, SystemPolicySettings, Batch, Faculty, Course, Room, FacultyCourseMapping, SemesterCourseMap, TimetableEntry } from '../types';

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-super-admin-1',
    name: 'Dr. Rajesh Sharma',
    email: 'superadmin@timepro.edu',
    role: 'super_admin',
    department: 'Academic Operations',
    designation: 'Principal Academic Director',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pin: '9999',
    isActive: true,
    createdAt: '2026-01-10T09:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-admin-1',
    name: 'Prof. Anand Kulkarni',
    email: 'admin@timepro.edu',
    role: 'admin',
    department: 'Academic Operations',
    designation: 'Timetable Committee Convener',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    pin: '1234',
    isActive: true,
    createdAt: '2026-01-15T10:30:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-faculty-1',
    name: 'Dr. Meera Nair',
    email: 'faculty@timepro.edu',
    role: 'faculty',
    department: 'Academic Operations',
    designation: 'Associate Professor & Class In-charge',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-02-01T11:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-student-1',
    name: 'Aarav Sharma',
    email: 'student@timepro.edu',
    role: 'student',
    department: 'Academic Operations (Batch A)',
    designation: 'Class Representative',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-02-15T14:00:00.000Z',
    lastLogin: new Date().toISOString(),
  }
];

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  canRunCspSolver: true,
  canEditTimetableSlots: true,
  canManageFaculty: true,
  canManageCourses: true,
  canManageRooms: true,
  canManageCurriculum: true,
  canManageBatches: true,
  canClearGrids: true,
  canExportReports: true,
  canViewAnalytics: true,
  canAssignFacultyMappings: true,
};

export const DEFAULT_POLICIES: SystemPolicySettings = {
  institutionName: 'TimePro',
  departmentName: 'Academic Operations',
  academicYear: '2026-2027 Academic Session',
  emergencyFreezeTimetables: false,
  strictAicteEnforcement: true,
  allowAdminTimetableWipe: true,
  requireSuperAdminApprovalForOverrides: false,
  maxDailyFacultyHours: 4,
  enableAuditLogging: true,
  autoBackupOnSolver: true,
  adminPermissions: DEFAULT_ADMIN_PERMISSIONS,
};

export function getEffectiveAdminPermissions(user: UserAccount, policies: SystemPolicySettings): AdminPermissions {
  if (user.role === 'super_admin') {
    return {
      canRunCspSolver: true,
      canEditTimetableSlots: true,
      canManageFaculty: true,
      canManageCourses: true,
      canManageRooms: true,
      canManageCurriculum: true,
      canManageBatches: true,
      canClearGrids: true,
      canExportReports: true,
      canViewAnalytics: true,
      canAssignFacultyMappings: true,
    };
  }

  if (user.role === 'admin') {
    const base = policies.adminPermissions || DEFAULT_ADMIN_PERMISSIONS;
    if (user.customPermissions) {
      return { ...base, ...user.customPermissions };
    }
    return base;
  }

  // Faculty and Students have read-only access (no modifications)
  return {
    canRunCspSolver: false,
    canEditTimetableSlots: false,
    canManageFaculty: false,
    canManageCourses: false,
    canManageRooms: false,
    canManageCurriculum: false,
    canManageBatches: false,
    canClearGrids: false,
    canExportReports: true,
    canViewAnalytics: true,
    canAssignFacultyMappings: false,
  };
}


export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-init-1',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    action: 'Super Admin System Initialized',
    userName: 'Dr. Rajesh Sharma',
    userRole: 'super_admin',
    details: 'Role-Based Access Control and Governance Framework configured with AICTE v2.5 guidelines.',
    category: 'security',
    severity: 'info'
  },
  {
    id: 'log-init-2',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    action: 'Workload & Syllabus Integrity Check',
    userName: 'Prof. Anand Kulkarni',
    userRole: 'admin',
    details: 'Verified 40 Batches across Semesters I-VIII and 24 Faculty teaching load allocations.',
    category: 'curriculum',
    severity: 'success'
  },
  {
    id: 'log-init-3',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    action: 'Session Authentication & Login',
    userName: 'Dr. Rajesh Sharma',
    userRole: 'super_admin',
    details: 'Super Admin logged in with elevated governance permissions.',
    category: 'security',
    severity: 'info'
  }
];

// Local Storage Keys
const USERS_STORAGE_KEY = 'apollo_user_accounts_v1';
const CURRENT_USER_KEY = 'apollo_current_user_v1';
const POLICIES_STORAGE_KEY = 'apollo_system_policies_v1';
const AUDIT_LOGS_STORAGE_KEY = 'apollo_audit_logs_v1';

export function getStoredUserAccounts(): UserAccount[] {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) return DEFAULT_ACCOUNTS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACCOUNTS;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveUserAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save user accounts', err);
  }
}

export function getCurrentUser(): UserAccount {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) return DEFAULT_ACCOUNTS[0]; // Super Admin by default
    return JSON.parse(data);
  } catch {
    return DEFAULT_ACCOUNTS[0];
  }
}

export function setCurrentUser(user: UserAccount): void {
  try {
    const updated = { ...user, lastLogin: new Date().toISOString() };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to set current user', err);
  }
}

export function getStoredSystemPolicies(): SystemPolicySettings {
  try {
    const data = localStorage.getItem(POLICIES_STORAGE_KEY);
    if (!data) return DEFAULT_POLICIES;
    return { ...DEFAULT_POLICIES, ...JSON.parse(data) };
  } catch {
    return DEFAULT_POLICIES;
  }
}

export function saveSystemPolicies(policies: SystemPolicySettings): void {
  try {
    localStorage.setItem(POLICIES_STORAGE_KEY, JSON.stringify(policies));
  } catch (err) {
    console.error('Failed to save system policies', err);
  }
}

export function getStoredAuditLogs(): AuditLogEntry[] {
  try {
    const data = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (!data) return INITIAL_AUDIT_LOGS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_AUDIT_LOGS;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function recordAuditLog(
  action: string,
  user: UserAccount,
  details: string,
  category: AuditLogEntry['category'] = 'system',
  severity: AuditLogEntry['severity'] = 'info'
): AuditLogEntry[] {
  try {
    const currentLogs = getStoredAuditLogs();
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      userName: user.name,
      userRole: user.role,
      details,
      category,
      severity
    };
    const updated = [newLog, ...currentLogs].slice(0, 100); // Retain top 100 logs
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to record audit log', err);
    return getStoredAuditLogs();
  }
}

export function clearAllAuditLogs(): AuditLogEntry[] {
  try {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}

export interface HealthCheckReport {
  totalIssues: number;
  orphanedEntriesCount: number;
  invalidFacultyMappingsCount: number;
  invalidSemesterMapsCount: number;
  invalidBatchesCount: number;
  isHealthy: boolean;
  details: string[];
}

export function performDatabaseHealthCheck(
  batches: Batch[],
  faculty: Faculty[],
  courses: Course[],
  rooms: Room[],
  mappings: FacultyCourseMapping[],
  semesterCourseMaps: SemesterCourseMap[],
  entries: TimetableEntry[]
): HealthCheckReport {
  const details: string[] = [];
  const batchIds = new Set(batches.map(b => b.id));
  const facultyIds = new Set(faculty.map(f => f.id));
  const courseIds = new Set(courses.map(c => c.id));
  const roomIds = new Set(rooms.map(r => r.id));

  // 1. Check orphaned Timetable Entries
  let orphanedEntries = 0;
  entries.forEach(e => {
    let issueFound = false;
    if (!batchIds.has(e.batchId)) {
      orphanedEntries++;
      issueFound = true;
    }
    if (!courseIds.has(e.courseId)) {
      orphanedEntries++;
      issueFound = true;
    }
    if (e.facultyId && !facultyIds.has(e.facultyId)) {
      orphanedEntries++;
      issueFound = true;
    }
    if (e.roomId && !roomIds.has(e.roomId)) {
      orphanedEntries++;
      issueFound = true;
    }
    if (issueFound) {
      details.push(`Timetable Slot #${e.id.substring(0, 8)} references a non-existent entity.`);
    }
  });

  // 2. Check Faculty Mappings
  let invalidMappings = 0;
  mappings.forEach(m => {
    if (!facultyIds.has(m.facultyId) || !courseIds.has(m.courseId)) {
      invalidMappings++;
      details.push(`Faculty mapping "${m.id}" links non-existent faculty or course.`);
    }
  });

  // 3. Check Semester Course Maps
  let invalidSemMaps = 0;
  semesterCourseMaps.forEach(sm => {
    if (!courseIds.has(sm.courseId)) {
      invalidSemMaps++;
      details.push(`Semester map "${sm.id}" references deleted course code.`);
    }
  });

  const totalIssues = orphanedEntries + invalidMappings + invalidSemMaps;

  return {
    totalIssues,
    orphanedEntriesCount: orphanedEntries,
    invalidFacultyMappingsCount: invalidMappings,
    invalidSemesterMapsCount: invalidSemMaps,
    invalidBatchesCount: 0,
    isHealthy: totalIssues === 0,
    details: details.slice(0, 15),
  };
}

export function repairDatabaseInconsistencies(
  batches: Batch[],
  faculty: Faculty[],
  courses: Course[],
  rooms: Room[],
  mappings: FacultyCourseMapping[],
  semesterCourseMaps: SemesterCourseMap[],
  entries: TimetableEntry[]
) {
  const batchIds = new Set(batches.map(b => b.id));
  const facultyIds = new Set(faculty.map(f => f.id));
  const courseIds = new Set(courses.map(c => c.id));
  const roomIds = new Set(rooms.map(r => r.id));

  const cleanEntries = entries.filter(
    e => batchIds.has(e.batchId) && courseIds.has(e.courseId) && (!e.facultyId || facultyIds.has(e.facultyId)) && (!e.roomId || roomIds.has(e.roomId))
  );

  const cleanMappings = mappings.filter(
    m => facultyIds.has(m.facultyId) && courseIds.has(m.courseId)
  );

  const cleanSemesterMaps = semesterCourseMaps.filter(
    sm => courseIds.has(sm.courseId)
  );

  return {
    repairedEntries: cleanEntries,
    repairedMappings: cleanMappings,
    repairedSemesterMaps: cleanSemesterMaps,
    fixedCount: (entries.length - cleanEntries.length) + (mappings.length - cleanMappings.length) + (semesterCourseMaps.length - cleanSemesterMaps.length)
  };
}

export interface UniversityMasterSnapshot {
  version: string;
  exportedAt: string;
  exportedBy: string;
  institution: string;
  policies: SystemPolicySettings;
  userAccounts: UserAccount[];
  batches: Batch[];
  faculty: Faculty[];
  courses: Course[];
  rooms: Room[];
  mappings: FacultyCourseMapping[];
  semesterCourseMaps: SemesterCourseMap[];
  timetableEntries: TimetableEntry[];
  auditLogs: AuditLogEntry[];
}

export function exportMasterUniversityBackup(
  user: UserAccount,
  policies: SystemPolicySettings,
  accounts: UserAccount[],
  batches: Batch[],
  faculty: Faculty[],
  courses: Course[],
  rooms: Room[],
  mappings: FacultyCourseMapping[],
  semesterCourseMaps: SemesterCourseMap[],
  entries: TimetableEntry[],
  auditLogs: AuditLogEntry[]
) {
  const masterData: UniversityMasterSnapshot = {
    version: '2.5.0-SUPER-ADMIN-MASTER',
    exportedAt: new Date().toISOString(),
    exportedBy: `${user.name} (${user.role})`,
    institution: policies.institutionName,
    policies,
    userAccounts: accounts,
    batches,
    faculty,
    courses,
    rooms,
    mappings,
    semesterCourseMaps,
    timetableEntries: entries,
    auditLogs
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(masterData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("download", `UNIVERSITY_MASTER_BACKUP_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

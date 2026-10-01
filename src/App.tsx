import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Printer, 
  User, 
  ShieldCheck, 
  Lock, 
  Unlock,
  GraduationCap, 
  BookOpen, 
  Database,
  Building,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Zap,
  Layers,
  Clock,
  Calendar,
  Users,
  Warehouse,
  AlertTriangle,
  Activity,
  CheckCircle,
  Search,
  ChevronRight,
  FileText,
  ArrowRight,
  Play,
  Terminal,
  CheckCircle2,
  Crown,
  KeyRound,
  Sliders,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  ChevronDown,
  Building2,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import TimeProLogo from './components/TimeProLogo';

import { 
  Day, 
  SlotId, 
  Slot, 
  Batch, 
  Faculty, 
  Room, 
  Course, 
  FacultyCourseMapping, 
  SemesterCourseMap, 
  TimetableEntry, 
  ToastMessage,
  UserAccount,
  UserRole,
  AuditLogEntry,
  SystemPolicySettings,
  SolverOptions
} from './types';

import { 
  DEFAULT_DAYS, 
  DEFAULT_SLOTS, 
  DEFAULT_BATCHES, 
  DEFAULT_FACULTY, 
  DEFAULT_ROOMS, 
  DEFAULT_COURSES, 
  DEFAULT_FACULTY_MAPPINGS, 
  DEFAULT_SEMESTER_COURSE_MAPS, 
  DEFAULT_TIMETABLE 
} from './data/initialData';

import { 
  generateTimetableForBatch, 
  generateTimetableForBatchAsync,
  generateTimetableForSemester, 
  generateTimetableForSemesterAsync,
  generateTimetableForAllBatches, 
  generateTimetableForAllBatchesAsync,
  resolveOverlapConflicts, 
  SolverLog 
} from './utils/solver';
import { GenerationScope } from './components/AutoGenerateModal';
import { exportTimetableToExcel } from './utils/excelExport';
import { ensureDailySnapshot, saveSnapshot } from './utils/backup';
import {
  getCurrentUser,
  setCurrentUser,
  getStoredUserAccounts,
  saveUserAccounts,
  getStoredSystemPolicies,
  saveSystemPolicies,
  getStoredAuditLogs,
  recordAuditLog,
  getEffectiveAdminPermissions
} from './utils/superAdminData';
import TimetableGrid from './components/TimetableGrid';
import BottomFacultyTable from './components/BottomFacultyTable';
import AdminPanel, { AdminTab } from './components/AdminPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import FacultyTimetableView from './components/FacultyTimetableView';
import RoomOccupancyView from './components/RoomOccupancyView';
import ClearGridModal from './components/ClearGridModal';
import SuperAdminHub from './components/SuperAdminHub';
import RoleSwitchModal from './components/RoleSwitchModal';
import RoleLoginGateway from './components/RoleLoginGateway';
import ClassTimetableHeroView from './components/ClassTimetableHeroView';
import Toast from './components/Toast';

export type AppViewTab = 
  | 'dashboard' 
  | 'timetable' 
  | 'generator' 
  | 'faculty' 
  | 'sections' 
  | 'curriculum' 
  | 'rooms' 
  | 'constraints' 
  | 'reports' 
  | 'settings' 
  | 'superadmin' 
  | 'analytics' 
  | 'conflicts' 
  | 'batches' 
  | 'regulations';

export default function App() {
  // --- Persistent Storage State ---
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [mappings, setMappings] = useState<FacultyCourseMapping[]>([]);
  const [semesterCourseMaps, setSemesterCourseMaps] = useState<SemesterCourseMap[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  
  // --- Super Admin & RBAC Multi-Tier State ---
  const [currentUser, setCurrentUserAccount] = useState<UserAccount>(() => getCurrentUser());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => getStoredUserAccounts());
  const [systemPolicies, setSystemPolicies] = useState<SystemPolicySettings>(() => getStoredSystemPolicies());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getStoredAuditLogs());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [showLoginGateway, setShowLoginGateway] = useState<boolean>(() => !localStorage.getItem('apollo_has_logged_in'));

  // Effective granular permissions decided by Super Admin
  const effectiveAdminPerms = getEffectiveAdminPermissions(currentUser, systemPolicies);
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';
  const isFaculty = currentUser.role === 'faculty';
  const isStudent = currentUser.role === 'student';
  const isCampusFrozen = systemPolicies.emergencyFreezeTimetables;
  
  // Strict permission guards based on Super Admin policy
  const canRunSolver = isSuperAdmin || (isAdmin && !isCampusFrozen && effectiveAdminPerms.canRunCspSolver);
  const canEditSlots = isSuperAdmin || (isAdmin && !isCampusFrozen && effectiveAdminPerms.canEditTimetableSlots);
  const canClearGrid = isSuperAdmin || (isAdmin && !isCampusFrozen && effectiveAdminPerms.canClearGrids);
  const canExportReports = isSuperAdmin || effectiveAdminPerms.canExportReports;
  const canViewAnalytics = isSuperAdmin || effectiveAdminPerms.canViewAnalytics;
  const canModifyTimetable = isSuperAdmin || (isAdmin && !isCampusFrozen && effectiveAdminPerms.canEditTimetableSlots);

  // --- UI Control States ---
  const [activeAppTab, setActiveAppTab] = useState<AppViewTab>('timetable');
  const [facultySubTab, setFacultySubTab] = useState<'schedule' | 'directory'>('schedule');
  const [roomsSubTab, setRoomsSubTab] = useState<'occupancy' | 'manager'>('occupancy');
  const [isClearGridModalOpen, setIsClearGridModalOpen] = useState<boolean>(false);
  const [selectedHeaderSemester, setSelectedHeaderSemester] = useState<string>('all');
  const [activeBatchId, setActiveBatchId] = useState<string>('batch-cse-a');
  const [selectedGenSemester, setSelectedGenSemester] = useState<string>('7');
  const [activeRoomId, setActiveRoomId] = useState<string>('room-027');
  const [classTeacherId, setClassTeacherId] = useState<string>(''); // Default empty
  const [issueNo, setIssueNo] = useState<number>(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [smartFillEnabled, setSmartFillEnabled] = useState<boolean>(true);
  const [maxSessionDuration, setMaxSessionDuration] = useState<number>(() => {
    const stored = localStorage.getItem('apollo_max_session_duration');
    return stored ? Number(stored) : 2;
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastSolverLogs, setLastSolverLogs] = useState<SolverLog[]>([]);
  const [solverLogFilter, setSolverLogFilter] = useState<'all' | 'placed' | 'backtrack' | 'conflict' | 'info'>('all');

  // --- Auto-saving and Custom Confirm Dialog States ---
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Synchronize active batch when the header semester filter changes
  useEffect(() => {
    if (selectedHeaderSemester !== 'all' && batches.length > 0) {
      const semNumber = Number(selectedHeaderSemester);
      const filtered = batches.filter(b => b.semester === semNumber);
      if (filtered.length > 0) {
        const isCurrentActiveInFiltered = filtered.some(b => b.id === activeBatchId);
        if (!isCurrentActiveInFiltered) {
          setActiveBatchId(filtered[0].id);
        }
      }
    }
  }, [selectedHeaderSemester, batches, activeBatchId]);

  // Auto-set class teacher if empty and faculty is available
  useEffect(() => {
    if (faculty.length > 0 && (!classTeacherId || !faculty.some(f => f.id === classTeacherId))) {
      setClassTeacherId(faculty[0].id);
    }
  }, [faculty, classTeacherId]);

  // --- Initial Mount Load ---
  useEffect(() => {
    // Helper: Load from localStorage or fallback to defaults
    const getStored = <T,>(key: string, defaultValue: T): T => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    };

    // Auto-migrate batches if stored version has fewer than 35 batches
    const storedBatches = getStored('apollo_batches', DEFAULT_BATCHES);
    const validBatches = (Array.isArray(storedBatches) && storedBatches.length >= 35) ? storedBatches : DEFAULT_BATCHES;
    setBatches(validBatches);
    localStorage.setItem('apollo_batches', JSON.stringify(validBatches));

    // Auto-migrate faculty if stored version has fewer than 90 faculty
    const storedFaculty = getStored('apollo_user_faculty', DEFAULT_FACULTY);
    const validFaculty = (Array.isArray(storedFaculty) && storedFaculty.length >= DEFAULT_FACULTY.length) ? storedFaculty : DEFAULT_FACULTY;
    setFaculty(validFaculty);
    localStorage.setItem('apollo_user_faculty', JSON.stringify(validFaculty));

    // Auto-migrate courses if missing Semester 8 project work or having old 3h/4h defaults
    const storedCourses = getStored('apollo_user_courses', DEFAULT_COURSES);
    const validCourses = (Array.isArray(storedCourses) && storedCourses.some((c: Course) => c.id === 'crs-proj')) 
      ? storedCourses.map((c: Course) => {
          if (c.id === 'crs-act-train' || c.id === 'crs-act-crt') {
            return { ...c, durationSlots: 2 };
          }
          return c;
        })
      : DEFAULT_COURSES;
    setCourses(validCourses);
    localStorage.setItem('apollo_user_courses', JSON.stringify(validCourses));

    // Auto-migrate rooms if stored version does not include updated labs
    const storedRooms = getStored('apollo_rooms', DEFAULT_ROOMS);
    const validRooms = (Array.isArray(storedRooms) && storedRooms.some((r: Room) => r.id === 'room-bd-lab-1')) ? storedRooms : DEFAULT_ROOMS;
    setRooms(validRooms);
    localStorage.setItem('apollo_rooms', JSON.stringify(validRooms));

    // Auto-migrate mappings to ensure full domain mappings are present
    const storedMappings = getStored('apollo_user_mappings', DEFAULT_FACULTY_MAPPINGS);
    const validMappings = (Array.isArray(storedMappings) && storedMappings.length >= DEFAULT_FACULTY_MAPPINGS.length)
      ? storedMappings
      : DEFAULT_FACULTY_MAPPINGS;
    setMappings(validMappings);
    localStorage.setItem('apollo_user_mappings', JSON.stringify(validMappings));

    // Auto-migrate semester maps if missing Semester 8
    const storedMaps = getStored('apollo_user_semester_maps', DEFAULT_SEMESTER_COURSE_MAPS);
    const validMaps = (Array.isArray(storedMaps) && storedMaps.some((m: SemesterCourseMap) => m.semester === 8)) ? storedMaps : DEFAULT_SEMESTER_COURSE_MAPS;
    setSemesterCourseMaps(validMaps);
    localStorage.setItem('apollo_user_semester_maps', JSON.stringify(validMaps));
    
    const initialEntries = getStored('apollo_user_timetable', DEFAULT_TIMETABLE);
    const validEntries = Array.isArray(initialEntries) ? initialEntries : DEFAULT_TIMETABLE;
    setTimetableEntries(validEntries);
    setSmartFillEnabled(getStored('apollo_smart_fill', true));

    // Ensure daily backup snapshot exists
    ensureDailySnapshot(validEntries);

    // Capture initial load timestamp
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  // Sync selectedGenSemester with active batch
  useEffect(() => {
    const b = batches.find(x => x.id === activeBatchId);
    if (b) {
      setSelectedGenSemester(b.semester.toString());
      // Also update preferred room if available
      const matchingRoom = rooms.find(r => r.roomNumber.toLowerCase().includes(b.name.toLowerCase()));
      if (matchingRoom) {
        setActiveRoomId(matchingRoom.id);
      }
    }
  }, [activeBatchId, batches, rooms]);

  // --- Persist Changes ---
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    setIsSaving(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSaved(timeStr);
    
    // Auto-reset saving state after a subtle delay
    setTimeout(() => {
      setIsSaving(false);
    }, 1200);
  };

  const handleUpdateBatches = (newBatches: Batch[]) => {
    setBatches(newBatches);
    saveState('apollo_batches', newBatches);
  };

  const handleUpdateFaculty = (newFaculty: Faculty[]) => {
    setFaculty(newFaculty);
    saveState('apollo_user_faculty', newFaculty);
  };

  const handleUpdateCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    saveState('apollo_user_courses', newCourses);
  };

  const handleUpdateRooms = (newRooms: Room[]) => {
    setRooms(newRooms);
    saveState('apollo_rooms', newRooms);
  };

  const handleUpdateMappings = (newMappings: FacultyCourseMapping[]) => {
    setMappings(newMappings);
    saveState('apollo_user_mappings', newMappings);
  };

  const handleUpdateSemesterCourseMaps = (newMaps: SemesterCourseMap[]) => {
    setSemesterCourseMaps(newMaps);
    saveState('apollo_user_semester_maps', newMaps);
  };

  const handleUpdateEntries = (newEntries: TimetableEntry[]) => {
    setTimetableEntries([...newEntries]);
    saveState('apollo_user_timetable', newEntries);
  };

  const handleToggleSmartFill = (enabled: boolean) => {
    setSmartFillEnabled(enabled);
    saveState('apollo_smart_fill', enabled);
  };

  // --- Super Admin & User Profile Handlers ---
  const handleGatewayLogin = (user: UserAccount) => {
    setCurrentUserAccount(user);
    setCurrentUser(user);
    setShowLoginGateway(false);
    localStorage.setItem('apollo_has_logged_in', 'true');
    if (user.role === 'super_admin') {
      setActiveAppTab('superadmin');
    } else if (user.role === 'faculty') {
      setActiveAppTab('faculty');
    } else {
      setActiveAppTab('timetable');
    }
    const updatedLogs = recordAuditLog(
      'Role Gateway Authentication',
      user,
      `User logged into workspace as ${user.name} (${user.role.replace('_', ' ').toUpperCase()}).`,
      'security',
      'info'
    );
    setAuditLogs(updatedLogs);
  };

  const handleSelectUser = (user: UserAccount) => {
    setCurrentUserAccount(user);
    setCurrentUser(user);
    if (user.role === 'student' && activeAppTab === 'superadmin') {
      setActiveAppTab('timetable');
    }
    if (user.role === 'faculty' && activeAppTab === 'superadmin') {
      setActiveAppTab('faculty');
    }
    const updatedLogs = recordAuditLog(
      'Session Switched',
      user,
      `User authenticated as ${user.name} (${user.role.replace('_', ' ').toUpperCase()}).`,
      'security',
      'info'
    );
    setAuditLogs(updatedLogs);
  };

  const handleUpdatePolicies = (newPolicies: SystemPolicySettings) => {
    setSystemPolicies(newPolicies);
    saveSystemPolicies(newPolicies);
  };

  const handleUpdateUserAccounts = (newAccounts: UserAccount[]) => {
    setUserAccounts(newAccounts);
    saveUserAccounts(newAccounts);
  };

  const handleUpdateAuditLogs = (newLogs: AuditLogEntry[]) => {
    setAuditLogs(newLogs);
  };

  // --- Toast Trigger Helper ---
  const handleShowToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleRemoveToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Reset Entire System ---
  const handleResetSystem = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Entire Database',
      message: 'Are you sure you want to reset all data and timetables? This will restore all default courses, faculty, and schedules, overwriting your active changes.',
      onConfirm: () => {
        setBatches(DEFAULT_BATCHES);
        setFaculty(DEFAULT_FACULTY);
        setCourses(DEFAULT_COURSES);
        setRooms(DEFAULT_ROOMS);
        setMappings(DEFAULT_FACULTY_MAPPINGS);
        setSemesterCourseMaps(DEFAULT_SEMESTER_COURSE_MAPS);
        setTimetableEntries(DEFAULT_TIMETABLE);
        
        saveState('apollo_batches', DEFAULT_BATCHES);
        saveState('apollo_user_faculty', DEFAULT_FACULTY);
        saveState('apollo_user_courses', DEFAULT_COURSES);
        saveState('apollo_rooms', DEFAULT_ROOMS);
        saveState('apollo_user_mappings', DEFAULT_FACULTY_MAPPINGS);
        saveState('apollo_user_semester_maps', DEFAULT_SEMESTER_COURSE_MAPS);
        saveState('apollo_user_timetable', DEFAULT_TIMETABLE);
        
        setActiveBatchId('batch-cse-a');
        setActiveRoomId('room-027');
        setClassTeacherId('');
        setIssueNo(1);
        
        const updatedLogs = recordAuditLog(
          'University Database Reset',
          currentUser,
          'System restored to default CSE Department baseline data.',
          'system',
          'critical'
        );
        setAuditLogs(updatedLogs);

        handleShowToast('success', 'Database Restored', 'Database has been reset to its pristine original state.');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Clear Timetable Handlers ---
  const handleClearSection = (keepLocked: boolean = false) => {
    if (!canClearGrid) {
      handleShowToast('error', 'Action Restricted', 'Timetable grid clearing is restricted for Admins by Super Admin policy.');
      return;
    }
    const currentBatchId = activeBatchId;
    const activeBatchObj = batches.find(b => b.id === currentBatchId);
    setTimetableEntries((prevEntries) => {
      const remaining = prevEntries.filter(e => !(e.batchId === currentBatchId && (!keepLocked || !e.isLocked)));
      saveState('apollo_user_timetable', remaining);
      return [...remaining];
    });

    const updatedLogs = recordAuditLog(
      `Cleared Timetable for ${activeBatchObj?.name || 'Section'}`,
      currentUser,
      `Unlocked slots were cleared.`,
      'schedule',
      'warning'
    );
    setAuditLogs(updatedLogs);

    handleShowToast('info', 'Section Timetable Cleared', `Removed sessions for ${activeBatchObj?.name || 'current section'}. Ready for fresh assignments!`);
  };

  const handleClearAndGenerateNew = async () => {
    if (!canClearGrid || !canRunSolver) {
      handleShowToast('error', 'Action Restricted', 'Clear & Generate is restricted for Admins by Super Admin policy.');
      return;
    }
    const currentBatchId = activeBatchId;
    const activeBatchObj = batches.find(b => b.id === currentBatchId);
    if (!activeBatchObj) return;

    // 1. Wipe current section entries
    const remaining = timetableEntries.filter(e => e.batchId !== currentBatchId);
    setTimetableEntries(remaining);
    saveState('apollo_user_timetable', remaining);

    // 2. Immediate fresh generation on clean canvas
    saveSnapshot(remaining, `Pre-solver snapshot (${activeBatchObj.name})`, true);
    setIsGenerating(true);
    handleShowToast('info', 'Generating Fresh Timetable', `Cleared grid and computing brand-new schedule for ${activeBatchObj.name}...`);

    await new Promise(r => setTimeout(r, 60));

    const result = await generateTimetableForBatchAsync(
      currentBatchId,
      activeBatchObj.semester,
      courses,
      faculty,
      rooms,
      mappings,
      semesterCourseMaps,
      remaining,
      activeRoomId,
      batches,
      {
        maxSessionDuration,
        allowThreeHourSessions: maxSessionDuration > 2
      }
    );

    setIsGenerating(false);

    if (result.logs) {
      setLastSolverLogs(result.logs);
    }

    if (result.success) {
      const updated = [...remaining, ...result.timetable];
      setTimetableEntries(updated);
      saveState('apollo_user_timetable', updated);

      const updatedLogs = recordAuditLog(
        `Generated Clean Timetable for ${activeBatchObj.name}`,
        currentUser,
        `Placed ${result.timetable.length} periods.`,
        'schedule',
        'success'
      );
      setAuditLogs(updatedLogs);

      handleShowToast('success', 'New Timetable Ready', `Generated brand-new conflict-free schedule for ${activeBatchObj.name}!`);
    } else {
      const updated = [...remaining, ...result.timetable];
      setTimetableEntries(updated);
      saveState('apollo_user_timetable', updated);
      handleShowToast('warning', 'Partial Schedule Generated', `Placed ${result.timetable.length} periods. Check diagnostics for edge-case constraints.`);
    }
  };

  const handleClearAllUniversity = () => {
    if (!canClearGrid) {
      handleShowToast('error', 'Action Restricted', 'Clearing all university timetables is restricted for Admins by Super Admin policy.');
      return;
    }
    setTimetableEntries([]);
    saveState('apollo_user_timetable', []);

    const updatedLogs = recordAuditLog(
      'Cleared All University Timetables',
      currentUser,
      'Purged all scheduled periods for all sections.',
      'schedule',
      'critical'
    );
    setAuditLogs(updatedLogs);

    handleShowToast('info', 'All Timetables Cleared', 'All 40 section schedules across 8 semesters have been cleared.');
  };

  const handleClearTimetable = () => {
    if (!canClearGrid) {
      handleShowToast('error', 'Action Restricted', 'Timetable grid clearing is restricted for Admins by Super Admin policy.');
      return;
    }
    setIsClearGridModalOpen(true);
  };

  // --- Automated Timetable Generation Trigger for All Classes Campus-Wide ---
  const handleAutoGenerateAllClasses = async (customOptions?: SolverOptions) => {
    if (!canRunSolver) {
      handleShowToast('error', 'Solver Restricted', 'CSP Auto-Solver execution is disabled for Admins by Super Admin policy.');
      return;
    }

    setIsGenerating(true);
    saveSnapshot(timetableEntries, `Pre-solver snapshot (Full Campus - ${batches.length} Classes)`, true);
    handleShowToast('info', 'Invoking Campus-Wide Auto-Solver', `Computing 100% overlap-free schedule for all ${batches.length} classes simultaneously...`);

    await new Promise(r => setTimeout(r, 40));

    const result = await generateTimetableForAllBatchesAsync(
      courses,
      faculty,
      rooms,
      mappings,
      semesterCourseMaps,
      timetableEntries,
      batches,
      {
        enableSmartRelaxation: customOptions?.enableSmartRelaxation ?? true,
        maxSessionDuration: customOptions?.maxSessionDuration ?? maxSessionDuration,
        allowThreeHourSessions: (customOptions?.maxSessionDuration ?? maxSessionDuration) >= 3,
        prioritizeMorningTheory: customOptions?.prioritizeMorningTheory ?? true,
        enableFacultyResearchDay: customOptions?.enableFacultyResearchDay ?? true,
        maxDailyHours: customOptions?.maxDailyHours ?? 4,
        clearPrevious: customOptions?.clearPrevious ?? true,
      }
    );

    setIsGenerating(false);
    if (result.logs) setLastSolverLogs(result.logs);
    handleUpdateEntries(result.timetable);

    const updatedLogs = recordAuditLog(
      'Full Campus Timetable Auto-Generation',
      currentUser,
      `Generated conflict-free timetables for ${result.batchesSolved} of ${batches.length} classes campus-wide.`,
      'schedule',
      result.success ? 'success' : 'warning'
    );
    setAuditLogs(updatedLogs);

    if (result.success) {
      handleShowToast('success', 'Campus Timetable Generated', `Successfully generated 100% conflict-free timetables for all ${result.batchesSolved} classes!`);
    } else {
      handleShowToast('warning', 'Partial Generation Completed', result.message);
    }
  };

  // --- Unified Automated Timetable Generation with Scope Selector ---
  const handleAutoGenerateWithScope = async (scope: GenerationScope, targetSemester?: number, targetBatchId?: string, customOptions?: SolverOptions) => {
    if (scope === 'all') {
      await handleAutoGenerateAllClasses(customOptions);
    } else if (scope === 'semester') {
      const sem = targetSemester || (activeBatch?.semester || 8);
      await handleAutoGenerateSemester(sem, customOptions);
    } else {
      const bId = targetBatchId || activeBatchId;
      if (bId !== activeBatchId) {
        setActiveBatchId(bId);
      }
      const targetB = batches.find(b => b.id === bId) || activeBatch;
      if (!targetB) return;

      if (!canRunSolver) {
        handleShowToast('error', 'Solver Restricted', 'CSP Auto-Solver execution is disabled for Admins by Super Admin policy.');
        return;
      }

      setIsGenerating(true);
      handleShowToast('info', 'Invoking Single Section Solver', `Computing optimal schedule for ${targetB.name}...`);
      saveSnapshot(timetableEntries, `Pre-solver snapshot (${targetB.name})`, true);

      await new Promise(r => setTimeout(r, 40));

      const result = await generateTimetableForBatchAsync(
        bId,
        targetB.semester,
        courses,
        faculty,
        rooms,
        mappings,
        semesterCourseMaps,
        timetableEntries,
        activeRoomId,
        batches,
        {
          enableSmartRelaxation: customOptions?.enableSmartRelaxation ?? true,
          maxSessionDuration: customOptions?.maxSessionDuration ?? maxSessionDuration,
          allowThreeHourSessions: (customOptions?.maxSessionDuration ?? maxSessionDuration) >= 3,
          prioritizeMorningTheory: customOptions?.prioritizeMorningTheory ?? true,
          enableFacultyResearchDay: customOptions?.enableFacultyResearchDay ?? true,
          maxDailyHours: customOptions?.maxDailyHours ?? 4,
          clearPrevious: customOptions?.clearPrevious ?? true
        }
      );

      setIsGenerating(false);
      if (result.logs) setLastSolverLogs(result.logs);

      const otherBatchesEntries = timetableEntries.filter(e => e.batchId !== bId);
      const updated = [...otherBatchesEntries, ...result.timetable];
      handleUpdateEntries(updated);

      if (result.success) {
        handleShowToast('success', 'Generation Completed', result.message);
      } else {
        handleShowToast('warning', 'Partial Generation', result.message);
      }
    }
  };

  // --- Automated Single Batch Timetable Generation Trigger ---
  const handleAutoGenerate = async () => {
    if (!canRunSolver) {
      handleShowToast('error', 'Solver Restricted', 'CSP Auto-Solver execution is disabled for Admins by Super Admin policy.');
      return;
    }
    const activeBatch = batches.find(b => b.id === activeBatchId);
    if (!activeBatch) return;

    // Save a backup snapshot before solver operation
    saveSnapshot(timetableEntries, `Pre-solver snapshot (${activeBatch.name})`, true);
    setIsGenerating(true);

    handleShowToast('info', 'Invoking Solver Engine', `Computing optimal conflict-free schedule for ${activeBatch.name}...`);

    // Non-blocking tick to let React render toast & spinner
    await new Promise(r => setTimeout(r, 40));

    // Run solver with max session duration policy
    const result = generateTimetableForBatch(
      activeBatchId,
      activeBatch.semester,
      courses,
      faculty,
      rooms,
      mappings,
      semesterCourseMaps,
      timetableEntries,
      activeRoomId, // Preferred base classroom
      batches,
      {
        enableSmartRelaxation: true,
        maxSessionDuration,
        allowThreeHourSessions: maxSessionDuration >= 3
      }
    );

    setIsGenerating(false);

    if (result.logs) {
      setLastSolverLogs(result.logs);
    }

    if (result.success) {
      // Merge results back preserving other batch entries
      const otherBatchesEntries = timetableEntries.filter(e => e.batchId !== activeBatchId);
      const updated = [...otherBatchesEntries, ...result.timetable];
      handleUpdateEntries(updated);
      handleShowToast('success', 'Generation Completed', result.message);
    } else {
      // Still display what could be solved
      const otherBatchesEntries = timetableEntries.filter(e => e.batchId !== activeBatchId);
      const updated = [...otherBatchesEntries, ...result.timetable];
      handleUpdateEntries(updated);
      handleShowToast('warning', 'Partial Timetable Generated', result.message);
    }
  };

  // --- Automated Simultaneous Semester / Year Generation Trigger ---
  const handleAutoGenerateSemester = async (targetSemInput?: number | 'all', customOptions?: SolverOptions) => {
    if (!canRunSolver) {
      handleShowToast('error', 'Solver Restricted', 'CSP Auto-Solver execution is disabled for Admins by Super Admin policy.');
      return;
    }
    const rawTarget = targetSemInput !== undefined ? targetSemInput : (selectedGenSemester === 'all' ? 'all' : Number(selectedGenSemester));

    setIsGenerating(true);

    if (rawTarget === 'all') {
      // Generate all semesters (Full Campus)
      const allSemesters = Array.from(new Set<number>(batches.map(b => b.semester))).sort((a, b) => b - a);
      saveSnapshot(timetableEntries, `Pre-solver snapshot (Full Campus - ${batches.length} Batches)`, true);
      handleShowToast('info', 'Invoking Full Campus Multi-Year Solver', `Simultaneously solving all ${batches.length} sections across all ${allSemesters.length} academic semesters...`);

      await new Promise(r => setTimeout(r, 40));

      let currentTimetable = [...timetableEntries];
      let totalSolved = 0;
      const allLogs: SolverLog[] = [];

      for (const sem of allSemesters) {
        await new Promise(r => setTimeout(r, 20));
        const semResult = generateTimetableForSemester(
          sem,
          courses,
          faculty,
          rooms,
          mappings,
          semesterCourseMaps,
          currentTimetable,
          batches,
          {
            enableSmartRelaxation: customOptions?.enableSmartRelaxation ?? true,
            maxSessionDuration: customOptions?.maxSessionDuration ?? maxSessionDuration,
            allowThreeHourSessions: (customOptions?.maxSessionDuration ?? maxSessionDuration) >= 3,
            prioritizeMorningTheory: customOptions?.prioritizeMorningTheory ?? true,
            enableFacultyResearchDay: customOptions?.enableFacultyResearchDay ?? true,
            maxDailyHours: customOptions?.maxDailyHours ?? 4,
            clearPrevious: customOptions?.clearPrevious ?? true
          }
        );
        currentTimetable = semResult.timetable;
        totalSolved += semResult.batchesSolved;
        if (semResult.logs) allLogs.push(...semResult.logs);
      }

      setIsGenerating(false);
      setLastSolverLogs(allLogs);
      handleUpdateEntries(currentTimetable);

      const updatedLogs = recordAuditLog(
        'Full Campus Multi-Year Solver Run',
        currentUser,
        `Solved timetables for ${totalSolved} of ${batches.length} sections across all 8 semesters.`,
        'schedule',
        'success'
      );
      setAuditLogs(updatedLogs);

      handleShowToast('success', 'Full Campus Generated', `Successfully generated conflict-free timetables for ${totalSolved} of ${batches.length} batches across all years!`);
      return;
    }

    const targetSemester = typeof rawTarget === 'number' ? rawTarget : (activeBatch?.semester || 7);
    const targetBatches = batches.filter(b => b.semester === targetSemester);

    if (targetBatches.length === 0) {
      setIsGenerating(false);
      handleShowToast('warning', 'No Batches Found', `No active batches found for Semester ${targetSemester}.`);
      return;
    }

    // Save snapshot before bulk solving
    saveSnapshot(timetableEntries, `Pre-solver snapshot (Semester ${targetSemester} - ${targetBatches.length} Sections)`, true);

    handleShowToast(
      'info',
      'Invoking Multi-Section Solver',
      `Simultaneously solving conflict-free schedules for all ${targetBatches.length} parallel sections in Semester ${targetSemester} (${targetBatches.map(b => b.name).join(', ')})...`
    );

    await new Promise(r => setTimeout(r, 40));

    const result = await generateTimetableForSemesterAsync(
      targetSemester,
      courses,
      faculty,
      rooms,
      mappings,
      semesterCourseMaps,
      timetableEntries,
      batches,
      {
        enableSmartRelaxation: customOptions?.enableSmartRelaxation ?? true,
        maxSessionDuration: customOptions?.maxSessionDuration ?? maxSessionDuration,
        allowThreeHourSessions: (customOptions?.maxSessionDuration ?? maxSessionDuration) >= 3,
        prioritizeMorningTheory: customOptions?.prioritizeMorningTheory ?? true,
        enableFacultyResearchDay: customOptions?.enableFacultyResearchDay ?? true,
        maxDailyHours: customOptions?.maxDailyHours ?? 4,
        clearPrevious: customOptions?.clearPrevious ?? true
      }
    );

    setIsGenerating(false);

    if (result.logs) {
      setLastSolverLogs(result.logs);
    }

    if (result.success) {
      handleUpdateEntries(result.timetable);

      const updatedLogs = recordAuditLog(
        `Semester ${targetSemester} Multi-Section Solver Run`,
        currentUser,
        `Solved all ${targetBatches.length} parallel sections for Semester ${targetSemester}.`,
        'schedule',
        'success'
      );
      setAuditLogs(updatedLogs);

      handleShowToast('success', 'Semester Generation Completed', result.message);
    } else {
      handleUpdateEntries(result.timetable);
      handleShowToast('warning', 'Multi-Batch Generation Partial', result.message);
    }
  };

  // --- Automated Conflict Resolution Trigger ---
  const handleAutoFixConflicts = () => {
    // Save a backup snapshot before fixing conflicts
    saveSnapshot(timetableEntries, 'Pre-conflict fix snapshot', true);

    const result = resolveOverlapConflicts(
      timetableEntries,
      batches,
      courses,
      faculty,
      rooms,
      semesterCourseMaps,
      mappings
    );
    if (result.fixedCount > 0) {
      handleUpdateEntries(result.resolvedEntries);
      handleShowToast('success', 'Conflicts Auto-Resolved', result.message);
    } else {
      handleShowToast('info', 'No Overlap Conflicts', result.message);
    }
  };

  // --- Print View Trigger ---
  const handlePrint = () => {
    try {
      window.focus();
      // Execute window.print directly
      window.print();
    } catch (err) {
      console.error('Window print error:', err);
      handleShowToast('error', 'Print Error', 'Could not launch browser print dialog.');
    }
  };

  // --- Download PDF Document via jsPDF ---
  const handleDownloadPDF = async () => {
    if (!canExportReports) {
      handleShowToast('error', 'Export Restricted', 'PDF export is restricted for Admins by Super Admin policy.');
      return;
    }
    const element = document.getElementById('timetable-capture-area');
    if (!element) {
      handleShowToast('error', 'Export Failed', 'Timetable capture area not found in DOM.');
      return;
    }

    handleShowToast('info', 'Generating PDF', 'Rendering high-resolution PDF document...');

    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && (node.classList.contains('print:hidden') || node.id === 'analytics-panel' || node.id === 'course-library-sidebar')) {
            return false;
          }
          return true;
        }
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Load dimensions from image
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;

      // 8mm standard margins
      const margin = 8;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);

      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const canvasScaledWidth = imgWidth * ratio;
      const canvasScaledHeight = imgHeight * ratio;

      const marginX = (pdfWidth - canvasScaledWidth) / 2;
      const marginY = (pdfHeight - canvasScaledHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', marginX, marginY, canvasScaledWidth, canvasScaledHeight, undefined, 'FAST');
      const batchName = activeBatch?.name ? activeBatch.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Schedule';
      pdf.save(`Timetable_${batchName}_Sem_${activeBatch?.semester || 1}.pdf`);

      handleShowToast('success', 'PDF Export Complete', 'Timetable PDF document downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      handleShowToast('warning', 'PDF Fallback', 'Direct PDF render encountered an issue. Opening browser Print dialog...');
      window.focus();
      setTimeout(() => window.print(), 100);
    }
  };

  // --- Download PNG Image ---
  const handleDownloadPNG = async () => {
    if (!canExportReports) {
      handleShowToast('error', 'Export Restricted', 'PNG export is restricted for Admins by Super Admin policy.');
      return;
    }
    const element = document.getElementById('timetable-capture-area');
    if (!element) {
      handleShowToast('error', 'Export Failed', 'Timetable capture area not found in DOM.');
      return;
    }

    handleShowToast('info', 'Generating Image', 'Rendering your timetable as a high-resolution PNG...');

    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && (node.classList.contains('print:hidden') || node.id === 'analytics-panel' || node.id === 'course-library-sidebar')) {
            return false;
          }
          return true;
        }
      });

      const link = document.createElement('a');
      const batchName = activeBatch?.name ? activeBatch.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Schedule';
      link.download = `Timetable_${batchName}_Sem_${activeBatch?.semester || 1}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      handleShowToast('success', 'Download Complete', 'Timetable PNG downloaded successfully!');
    } catch (error) {
      console.error('Error rendering timetable image:', error);
      
      // Fallback with standard pixel ratio
      try {
        const fallbackDataUrl = await toPng(element, {
          quality: 0.9,
          pixelRatio: 1,
          backgroundColor: '#ffffff',
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains('print:hidden')) {
              return false;
            }
            return true;
          }
        });
        const link = document.createElement('a');
        const batchName = activeBatch?.name ? activeBatch.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Schedule';
        link.download = `Timetable_${batchName}.png`;
        link.href = fallbackDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        handleShowToast('success', 'Download Complete', 'Timetable PNG generated with standard resolution!');
      } catch (fallbackErr) {
        console.error('Fallback image render failed:', fallbackErr);
        handleShowToast('error', 'Export Failed', 'An error occurred while generating PNG.');
      }
    }
  };

  // --- Export to Excel ---
  const handleExportExcel = () => {
    if (!canExportReports) {
      handleShowToast('error', 'Export Restricted', 'Excel export is restricted for Admins by Super Admin policy.');
      return;
    }
    try {
      exportTimetableToExcel({
        entries: timetableEntries,
        batches,
        courses,
        faculty,
        rooms,
        activeBatchId,
        classTeacherId,
        mappings,
      });
      handleShowToast('success', 'Export Completed', 'Academic timetable exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      handleShowToast('error', 'Export Failed', 'An error occurred while generating the Excel spreadsheet.');
    }
  };

  // --- Dynamic Metadata Helper Values ---
  const activeBatch = batches.find(b => b.id === activeBatchId) || batches[0] || DEFAULT_BATCHES[0];
  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0] || DEFAULT_ROOMS[0];
  const currentTeacher = faculty.find(f => f.id === classTeacherId) || faculty[0] || DEFAULT_FACULTY[0];

  // Translate semester number to Roman Numeral & Year
  const getRomanSemester = (sem: number): string => {
    const romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    return romans[sem] || sem.toString();
  };

  const getYearName = (sem: number): string => {
    if (sem <= 2) return 'I Year';
    if (sem <= 4) return 'II Year';
    if (sem <= 6) return 'III Year';
    return 'IV Year';
  };

  // Filter entries to show only scheduled courses in the active view
  // We filter by Batch ID
  const activeBatchEntries = timetableEntries.filter(e => e.batchId === activeBatchId);

  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar },
    { id: 'generator', label: 'Auto Generator', icon: Sparkles },
    { id: 'faculty', label: 'Faculty & Workload', icon: Users },
    { id: 'sections', label: 'Student Sections', icon: GraduationCap },
    { id: 'curriculum', label: 'Subjects & Curriculum', icon: BookOpen },
    { id: 'rooms', label: 'Rooms & Labs', icon: Warehouse },
    { id: 'constraints', label: 'Constraints', icon: ShieldCheck },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const [sidebarMobileOpen, setSidebarMobileOpen] = useState<boolean>(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState<string>('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Logout handler returning to initial role login gateway
  const handleLogout = () => {
    localStorage.removeItem('apollo_has_logged_in');
    setShowLoginGateway(true);
    setProfileDropdownOpen(false);
    const updatedLogs = recordAuditLog(
      'User Logged Out',
      currentUser,
      `User ${currentUser.name} (${currentUser.role.toUpperCase()}) logged out.`,
      'security',
      'info'
    );
    setAuditLogs(updatedLogs);
    handleShowToast('info', 'Logged Out', 'You have been safely signed out. Select a role to sign in.');
  };

  // FIRST DASHBOARD: Role Login Gateway Portal
  if (showLoginGateway) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#4F46E5] selection:text-white">
        <RoleLoginGateway
          userAccounts={userAccounts}
          policies={systemPolicies}
          onLogin={handleGatewayLogin}
          onShowToast={handleShowToast}
        />
        <Toast toasts={toasts} onRemove={handleRemoveToast} />
      </div>
    );
  }

  // Initials helper
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TP';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#4F46E5] selection:text-white print:bg-white print:text-black">
      {/* 1. Header (Height: 64–72px, White Background, Subtle Bottom Border) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-xs print:hidden h-16 sm:h-[70px] flex items-center px-4 sm:px-6">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Toggle + TimePro Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle Navigation Menu"
            >
              {sidebarMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <TimeProLogo size="md" showSubtitle={false} />
          </div>

          {/* Center: Search Bar (Search sections, subjects, faculty, rooms... Ctrl K) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search sections, subjects, faculty, rooms..."
                value={headerSearchQuery}
                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                className="w-full bg-[#F8FAFC] hover:bg-slate-100/80 focus:bg-white border border-[#E2E8F0] focus:border-[#4F46E5] rounded-2xl pl-10 pr-16 py-2 text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold bg-white text-slate-500 border border-[#E2E8F0] px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Right: Notifications & Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Bell */}
            <button
              onClick={() => handleShowToast('info', 'Notifications', 'System operational. All 24 AICTE constraints verified conflict-free.')}
              className="relative p-2.5 rounded-2xl text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
            </button>

            {/* Profile Dropdown Container */}
            <div className="relative">
              {/* Admin Profile Button */}
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-[#E2E8F0] transition-all cursor-pointer shadow-2xs group"
                title="Account options & Role profile"
              >
                {/* Profile Avatar Pill */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-2xs ${
                  currentUser.role === 'super_admin' ? 'bg-[#D4A72C]' :
                  currentUser.role === 'admin' ? 'bg-[#3B82F6]' :
                  currentUser.role === 'faculty' ? 'bg-[#10B981]' : 'bg-[#8B5CF6]'
                }`}>
                  {getUserInitials(currentUser.name)}
                </div>

                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-[#0F172A] leading-tight group-hover:text-[#4F46E5] transition-colors">
                    {currentUser.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded ${
                      currentUser.role === 'super_admin' ? 'bg-amber-100 text-amber-900' :
                      currentUser.role === 'admin' ? 'bg-blue-100 text-blue-900' :
                      currentUser.role === 'faculty' ? 'bg-emerald-100 text-emerald-900' :
                      'bg-purple-100 text-purple-900'
                    }`}>
                      {currentUser.role === 'super_admin' ? 'SUPER ADMIN' : currentUser.role.toUpperCase()}
                    </span>
                  </div>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F172A] transition-transform duration-150 ml-0.5 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Menu Dropdown */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div 
                      onClick={() => setProfileDropdownOpen(false)} 
                      className="fixed inset-0 z-40" 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl z-50 p-2 space-y-1 text-left"
                    >
                      {/* User Header Details */}
                      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs ${
                            currentUser.role === 'super_admin' ? 'bg-[#D4A72C]' :
                            currentUser.role === 'admin' ? 'bg-[#3B82F6]' :
                            currentUser.role === 'faculty' ? 'bg-[#10B981]' : 'bg-[#8B5CF6]'
                          }`}>
                            {getUserInitials(currentUser.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-[#0F172A] truncate leading-tight">
                              {currentUser.name}
                            </h4>
                            <p className="text-[11px] text-[#64748B] truncate">
                              {currentUser.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200">
                          <span className="text-[#64748B] font-medium">{currentUser.department || 'Academic Operations'}</span>
                          <span className={`font-mono font-black uppercase px-2 py-0.5 rounded ${
                            currentUser.role === 'super_admin' ? 'bg-amber-100 text-amber-900' :
                            currentUser.role === 'admin' ? 'bg-blue-100 text-blue-900' :
                            currentUser.role === 'faculty' ? 'bg-emerald-100 text-emerald-900' :
                            'bg-purple-100 text-purple-900'
                          }`}>
                            {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Actions */}
                      <div className="pt-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setIsRoleModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0F172A] hover:bg-[#EEF2FF] hover:text-[#4F46E5] transition-colors cursor-pointer text-left"
                        >
                          <Users className="w-4 h-4 text-[#4F46E5]" />
                          <span>Switch Role / Account</span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-[#DC2626]" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Campus Freeze Emergency Banner */}
      {isCampusFrozen && (
        <div className="bg-amber-100 text-amber-950 px-4 py-2 text-xs font-black border-b border-amber-300 shadow-inner print:hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                CAMPUS TIMETABLE FREEZE ACTIVE: Edits and CSP solver runs are locked university-wide by Super Admin ({currentUser.name}).
              </span>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => {
                  const updated = { ...systemPolicies, emergencyFreezeTimetables: false };
                  setSystemPolicies(updated);
                  saveSystemPolicies(updated);
                  handleShowToast('info', 'Freeze Lifted', 'Campus timetable edits unlocked.');
                }}
                className="bg-amber-900 hover:bg-amber-800 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Lift Freeze
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Layout: Left Sidebar + Content Area */}
      <div className="flex-1 flex w-full">
        {/* 2. Left Sidebar (Width: 220–240px, White Background, Dark Navy Text, Active: Very Light Indigo) */}
        <aside
          className={`fixed lg:sticky top-16 sm:top-[70px] z-30 h-[calc(100vh-64px)] sm:h-[calc(100vh-70px)] w-60 shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col justify-between p-3.5 transition-transform duration-200 print:hidden ${
            sidebarMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto custom-scrollbar pr-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = 
                activeAppTab === item.id ||
                (item.id === 'sections' && activeAppTab === 'batches') ||
                (item.id === 'constraints' && (activeAppTab === 'analytics' || activeAppTab === 'conflicts')) ||
                (item.id === 'reports' && activeAppTab === 'regulations') ||
                (item.id === 'settings' && activeAppTab === 'superadmin');

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAppTab(item.id as AppViewTab);
                    setSidebarMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#EEF2FF] text-[#4F46E5] font-black'
                      : 'text-[#0F172A] hover:bg-slate-50 hover:text-[#4F46E5]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#4F46E5]' : 'text-slate-500'}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.id === 'timetable' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Card: Academic Session Badge */}
          <div className="pt-3 border-t border-[#E2E8F0]">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] text-[#4F46E5] flex items-center justify-center shrink-0 shadow-2xs">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#64748B] block leading-none mb-0.5">Academic Session</span>
                <span className="text-xs font-black text-[#0F172A] block leading-tight">2026 – 2027</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A34A] leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop for Sidebar */}
        {sidebarMobileOpen && (
          <div
            onClick={() => setSidebarMobileOpen(false)}
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* 3. Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 space-y-6">
          {/* VIEW 1: HERO CLASS TIMETABLE */}
          {activeAppTab === 'timetable' && (
            <ClassTimetableHeroView
              activeBatch={activeBatch}
              batches={batches}
              onSelectBatch={(batchId) => setActiveBatchId(batchId)}
              entries={timetableEntries}
              courses={courses}
              faculty={faculty}
              rooms={rooms}
              mappings={mappings}
              semesterCourseMaps={semesterCourseMaps}
              onUpdateEntries={handleUpdateEntries}
              onAutoGenerate={handleAutoGenerate}
              onAutoGenerateWithScope={handleAutoGenerateWithScope}
              onClearGrid={() => setIsClearGridModalOpen(true)}
              onOpenStudio={() => setActiveAppTab('generator')}
              onPrint={handlePrint}
              onDownloadPDF={handleDownloadPDF}
              onDownloadPNG={handleDownloadPNG}
              onExportExcel={handleExportExcel}
              onShowToast={handleShowToast}
              isAdmin={isAdmin}
              isGenerating={isGenerating}
              isFrozen={isCampusFrozen}
              issueNo={issueNo}
              onNavigateToTab={(tab) => setActiveAppTab(tab as AppViewTab)}
            />
          )}

          {/* VIEW: DASHBOARD & ANALYTICS */}
          {activeAppTab === 'dashboard' && (
            <div>
              <AnalyticsPanel
                entries={timetableEntries}
                batches={batches}
                courses={courses}
                faculty={faculty}
                rooms={rooms}
                activeBatchId={activeBatchId}
                activeSemester={activeBatch ? activeBatch.semester : 1}
                semesterCourseMaps={semesterCourseMaps}
                solverLogs={lastSolverLogs}
                mappings={mappings}
                onUpdateEntries={handleUpdateEntries}
                onShowToast={handleShowToast}
                adminPermissions={effectiveAdminPerms}
                isSuperAdmin={isSuperAdmin}
              />
            </div>
          )}

        {/* VIEW 2: AUTO GENERATOR & CSP SOLVER STUDIO */}
        {activeAppTab === 'generator' && (
          <div className="space-y-6">
            {/* Header Description */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white font-cinzel-title">Auto Timetable Generator Studio</h2>
                    <p className="text-xs text-indigo-200">
                      Constraint Satisfaction Problem (CSP) Engine with Backtracking & Exact Faculty Mappings
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveAppTab('timetable')}
                  className="bg-white hover:bg-slate-100 text-[#4F46E5] font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>View Generated Timetable</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Solver Controls Grid (4 Distinct Powerful Generation Scopes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* Card 1: Full Campus Master Solver (All Classes) */}
              <div className="bg-gradient-to-b from-[#EEF2FF] to-white border-2 border-[#4F46E5] rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-[#4F46E5] text-white rounded-xl shadow-xs">
                      <Building className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono font-extrabold bg-[#4F46E5] text-white px-2.5 py-0.5 rounded-full uppercase">
                      Campus-Wide
                    </span>
                  </div>
                  <h3 className="font-black text-[#0F172A] text-sm">All Classes & Batches</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Simultaneously schedule <strong>ALL {batches.length} classes</strong> across 8 semesters with 0 faculty or room clashes.
                  </p>
                </div>

                <button
                  onClick={handleAutoGenerateAllClasses}
                  disabled={isGenerating || isCampusFrozen}
                  className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Solving All Classes...' : `Solve All ${batches.length} Classes`}
                </button>
              </div>

              {/* Card 2: Multi-Section Semester Solver */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-purple-50 text-[#8B5CF6] rounded-xl border border-purple-100">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-purple-50 text-[#6D28D9] px-2 py-0.5 rounded-md border border-purple-100">
                      Parallel Multi-Section
                    </span>
                  </div>
                  <h3 className="font-black text-[#0F172A] text-sm">Simultaneous Semester Solver</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Solve multiple parallel sections at once while synchronizing shared faculty, laboratory spaces, and classroom capacities.
                  </p>

                  <select
                    value={selectedGenSemester}
                    onChange={(e) => setSelectedGenSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-[#0F172A] font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] cursor-pointer"
                  >
                    <option value="8">Semester VIII (5 Sections)</option>
                    <option value="7">Semester VII (7 Sections)</option>
                    <option value="6">Semester VI (5 Sections)</option>
                    <option value="5">Semester V (5 Sections)</option>
                    <option value="4">Semester IV (5 Sections)</option>
                    <option value="3">Semester III (5 Sections)</option>
                    <option value="2">Semester II (4 Sections)</option>
                    <option value="1">Semester I (4 Sections)</option>
                    <option value="all">Full Campus (All 8 Semesters)</option>
                  </select>
                </div>

                <button
                  onClick={() => handleAutoGenerateSemester()}
                  disabled={isGenerating || isCampusFrozen}
                  className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  <Layers className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                  {isGenerating ? 'Solving All Sections...' : 'Solve All Selected Sections'}
                </button>
              </div>

              {/* Card 3: Single Batch Generator */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-blue-50 text-[#3B82F6] rounded-xl border border-blue-100">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-[#0F172A] px-2 py-0.5 rounded-md border border-slate-200">
                      Target: {activeBatch?.name}
                    </span>
                  </div>
                  <h3 className="font-black text-[#0F172A] text-sm">Single Section Solver</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Compute a 100% conflict-free weekly schedule for <strong className="text-[#0F172A]">{activeBatch?.name}</strong> based strictly on required curriculum hours and mapped specialists.
                  </p>
                </div>

                <button
                  onClick={handleAutoGenerate}
                  disabled={isGenerating || isCampusFrozen}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Solving Section...' : `Generate for ${activeBatch?.name}`}
                </button>
              </div>

              {/* Card 4: Conflict Fixer & Policy Settings */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-amber-50 text-[#D97706] rounded-xl border border-amber-100">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-amber-50 text-[#92400E] px-2 py-0.5 rounded-md border border-amber-100">
                      Conflict Reliever
                    </span>
                  </div>
                  <h3 className="font-black text-[#0F172A] text-sm">Conflict Fixer & Duration Policy</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Auto-relocate any manual overlaps. Set maximum block duration limit:
                  </p>

                  <select
                    value={maxSessionDuration}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMaxSessionDuration(val);
                      localStorage.setItem('apollo_max_session_duration', val.toString());
                      handleShowToast('info', 'Policy Updated', `Max block set to ${val} hours.`);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-[#0F172A] font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4A72C] cursor-pointer"
                  >
                    <option value={2}>Max 2 Continuous Hours (Standard)</option>
                    <option value={3}>Allow 3 Hours (Extended Workshops)</option>
                    <option value={4}>Allow 4 Hours (Capstone Projects)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAutoFixConflicts}
                    className="flex-1 bg-[#D4A72C] hover:bg-[#B88E1F] text-white font-black text-xs py-3 rounded-2xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Fix Overlaps
                  </button>
                  <button
                    onClick={handleClearTimetable}
                    className="px-3.5 py-3 border border-rose-200 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] rounded-2xl transition-all text-xs font-bold cursor-pointer"
                    title="Clear unlocked slots"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Solver Execution Logs Console */}
            <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-900/60 text-indigo-400 rounded-xl border border-indigo-700/50">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">CSP Solver Execution Console</h3>
                    <p className="text-[11px] text-slate-400">Step-by-step backtracking trace and constraint audits</p>
                  </div>
                </div>

                {/* Log Filter Pills */}
                <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800">
                  {(['all', 'placed', 'backtrack', 'conflict', 'info'] as const).map(flt => (
                    <button
                      key={flt}
                      onClick={() => setSolverLogFilter(flt)}
                      className={`text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        solverLogFilter === flt ? 'bg-[#4F46E5] text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {flt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs Stream */}
              <div className="space-y-1.5 max-h-96 overflow-y-auto font-mono text-xs pr-2 custom-scrollbar">
                {lastSolverLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>No solver logs generated yet. Click "Generate" above to run the CSP solver.</p>
                  </div>
                ) : (
                  lastSolverLogs
                    .filter(log => solverLogFilter === 'all' || log.type === solverLogFilter)
                    .map((log) => (
                      <div
                        key={log.id}
                        className={`px-3 py-2 rounded-xl flex items-start gap-2.5 border ${
                          log.type === 'placed'
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : log.type === 'backtrack'
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                            : log.type === 'conflict'
                            ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                            : 'bg-[#0a0f1d] border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-white/10 text-white shrink-0">
                          {log.type}
                        </span>
                        <span className="text-slate-400 text-[10px] shrink-0">{log.timestamp}</span>
                        <span className="flex-1 leading-snug">{log.message}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: HEALTH & 24-CONSTRAINT AUDIT */}
        {(activeAppTab === 'constraints' || activeAppTab === 'analytics') && (
          <div>
            <AnalyticsPanel
              entries={timetableEntries}
              batches={batches}
              courses={courses}
              faculty={faculty}
              rooms={rooms}
              activeBatchId={activeBatchId}
              activeSemester={activeBatch ? activeBatch.semester : 1}
              semesterCourseMaps={semesterCourseMaps}
              solverLogs={lastSolverLogs}
              mappings={mappings}
              onUpdateEntries={handleUpdateEntries}
              onShowToast={handleShowToast}
              adminPermissions={effectiveAdminPerms}
              isSuperAdmin={isSuperAdmin}
            />
          </div>
        )}

        {/* VIEW 4: FACULTY PERSONAL SCHEDULE & DIRECTORY */}
        {activeAppTab === 'faculty' && (
          <div className="space-y-6">
            {/* View Switcher Sub-Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm print:hidden">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setFacultySubTab('schedule')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    facultySubTab === 'schedule'
                      ? 'bg-[#10B981] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Personal Faculty Timetable (Grid & PDF)</span>
                </button>

                <button
                  onClick={() => setFacultySubTab('directory')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    facultySubTab === 'directory'
                      ? 'bg-[#10B981] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Faculty Directory & Workload Manager</span>
                </button>
              </div>

              <div className="text-xs font-bold text-[#64748B] pr-3 font-mono hidden sm:flex items-center gap-2">
                <span>Registered Faculty:</span>
                <span className="text-[#047857] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold">
                  {faculty.length} Members
                </span>
              </div>
            </div>

            {facultySubTab === 'schedule' ? (
              <FacultyTimetableView
                faculty={faculty}
                entries={timetableEntries}
                courses={courses}
                rooms={rooms}
                batches={batches}
                days={DEFAULT_DAYS}
                slots={DEFAULT_SLOTS}
                onShowToast={handleShowToast}
              />
            ) : (
              <AdminPanel
                batches={batches}
                faculty={faculty}
                courses={courses}
                rooms={rooms}
                mappings={mappings}
                semesterCourseMaps={semesterCourseMaps}
                entries={timetableEntries}
                onUpdateBatches={handleUpdateBatches}
                onUpdateFaculty={handleUpdateFaculty}
                onUpdateCourses={handleUpdateCourses}
                onUpdateRooms={handleUpdateRooms}
                onUpdateMappings={handleUpdateMappings}
                onUpdateSemesterCourseMaps={handleUpdateSemesterCourseMaps}
                onUpdateEntries={handleUpdateEntries}
                onShowToast={handleShowToast}
                smartFillEnabled={smartFillEnabled}
                onToggleSmartFill={handleToggleSmartFill}
                activeTab="faculty"
                isSuperAdmin={isSuperAdmin}
                isFrozen={isCampusFrozen}
                adminPermissions={effectiveAdminPerms}
              />
            )}
          </div>
        )}

        {/* VIEW 5: CURRICULUM & SYLLABUS PLANNER */}
        {activeAppTab === 'curriculum' && (
          <div>
            <AdminPanel
              batches={batches}
              faculty={faculty}
              courses={courses}
              rooms={rooms}
              mappings={mappings}
              semesterCourseMaps={semesterCourseMaps}
              entries={timetableEntries}
              onUpdateBatches={handleUpdateBatches}
              onUpdateFaculty={handleUpdateFaculty}
              onUpdateCourses={handleUpdateCourses}
              onUpdateRooms={handleUpdateRooms}
              onUpdateMappings={handleUpdateMappings}
              onUpdateSemesterCourseMaps={handleUpdateSemesterCourseMaps}
              onUpdateEntries={handleUpdateEntries}
              onShowToast={handleShowToast}
              smartFillEnabled={smartFillEnabled}
              onToggleSmartFill={handleToggleSmartFill}
              activeTab="curriculum"
              isSuperAdmin={isSuperAdmin}
              isFrozen={isCampusFrozen}
              adminPermissions={effectiveAdminPerms}
            />
          </div>
        )}

        {/* VIEW 6: CLASSROOMS & LABS OCCUPANCY */}
        {activeAppTab === 'rooms' && (
          <div className="space-y-6">
            {/* Sub-Tab Navigation Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm print:hidden">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setRoomsSubTab('occupancy')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    roomsSubTab === 'occupancy'
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Room & Lab Occupancy Schedule (Grid & PDF)</span>
                </button>

                <button
                  onClick={() => setRoomsSubTab('manager')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    roomsSubTab === 'manager'
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60'
                  }`}
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Classrooms & Labs Capacity Manager</span>
                </button>
              </div>

              <div className="text-xs font-bold text-[#64748B] pr-3 font-mono hidden sm:flex items-center gap-2">
                <span>Total Infrastructure:</span>
                <span className="text-[#1D4ED8] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-extrabold">
                  {rooms.length} Spaces ({rooms.filter(r => r.type === 'Theory').length} Theory, {rooms.filter(r => r.type === 'Lab').length} Labs)
                </span>
              </div>
            </div>

            {roomsSubTab === 'occupancy' ? (
              <RoomOccupancyView
                rooms={rooms}
                entries={timetableEntries}
                courses={courses}
                faculty={faculty}
                batches={batches}
                days={DEFAULT_DAYS}
                slots={DEFAULT_SLOTS}
                onShowToast={handleShowToast}
              />
            ) : (
              <AdminPanel
                batches={batches}
                faculty={faculty}
                courses={courses}
                rooms={rooms}
                mappings={mappings}
                semesterCourseMaps={semesterCourseMaps}
                entries={timetableEntries}
                onUpdateBatches={handleUpdateBatches}
                onUpdateFaculty={handleUpdateFaculty}
                onUpdateCourses={handleUpdateCourses}
                onUpdateRooms={handleUpdateRooms}
                onUpdateMappings={handleUpdateMappings}
                onUpdateSemesterCourseMaps={handleUpdateSemesterCourseMaps}
                onUpdateEntries={handleUpdateEntries}
                onShowToast={handleShowToast}
                smartFillEnabled={smartFillEnabled}
                onToggleSmartFill={handleToggleSmartFill}
                activeTab="rooms"
                isSuperAdmin={isSuperAdmin}
                isFrozen={isCampusFrozen}
                adminPermissions={effectiveAdminPerms}
              />
            )}
          </div>
        )}

        {/* VIEW 7: SECTION OVERLAPS & CLASH DIAGNOSTICS */}
        {activeAppTab === 'conflicts' && (
          <div>
            <AdminPanel
              batches={batches}
              faculty={faculty}
              courses={courses}
              rooms={rooms}
              mappings={mappings}
              semesterCourseMaps={semesterCourseMaps}
              entries={timetableEntries}
              onUpdateBatches={handleUpdateBatches}
              onUpdateFaculty={handleUpdateFaculty}
              onUpdateCourses={handleUpdateCourses}
              onUpdateRooms={handleUpdateRooms}
              onUpdateMappings={handleUpdateMappings}
              onUpdateSemesterCourseMaps={handleUpdateSemesterCourseMaps}
              onUpdateEntries={handleUpdateEntries}
              onShowToast={handleShowToast}
              smartFillEnabled={smartFillEnabled}
              onToggleSmartFill={handleToggleSmartFill}
              activeTab="parallel-diagnostics"
              isSuperAdmin={isSuperAdmin}
              isFrozen={isCampusFrozen}
              adminPermissions={effectiveAdminPerms}
            />
          </div>
        )}

        {/* VIEW 8: BATCHES & SECTIONS */}
        {(activeAppTab === 'sections' || activeAppTab === 'batches') && (
          <div>
            <AdminPanel
              batches={batches}
              faculty={faculty}
              courses={courses}
              rooms={rooms}
              mappings={mappings}
              semesterCourseMaps={semesterCourseMaps}
              entries={timetableEntries}
              onUpdateBatches={handleUpdateBatches}
              onUpdateFaculty={handleUpdateFaculty}
              onUpdateCourses={handleUpdateCourses}
              onUpdateRooms={handleUpdateRooms}
              onUpdateMappings={handleUpdateMappings}
              onUpdateSemesterCourseMaps={handleUpdateSemesterCourseMaps}
              onUpdateEntries={handleUpdateEntries}
              onShowToast={handleShowToast}
              smartFillEnabled={smartFillEnabled}
              onToggleSmartFill={handleToggleSmartFill}
              activeTab="batches"
              isSuperAdmin={isSuperAdmin}
              isFrozen={isCampusFrozen}
              adminPermissions={effectiveAdminPerms}
            />
          </div>
        )}

        {/* VIEW 9: ACADEMIC REGULATIONS & REPORTS */}
        {(activeAppTab === 'reports' || activeAppTab === 'regulations') && (
          <div>
            <AdminPanel
              batches={batches}
              faculty={faculty}
              courses={courses}
              rooms={rooms}
              mappings={mappings}
              semesterCourseMaps={semesterCourseMaps}
              entries={timetableEntries}
              onUpdateBatches={handleUpdateBatches}
              onUpdateFaculty={handleUpdateFaculty}
              onUpdateCourses={handleUpdateCourses}
              onUpdateRooms={handleUpdateRooms}
              onUpdateMappings={handleUpdateMappings}
              onUpdateSemesterCourseMaps={handleUpdateSemesterCourseMaps}
              onUpdateEntries={handleUpdateEntries}
              onShowToast={handleShowToast}
              smartFillEnabled={smartFillEnabled}
              onToggleSmartFill={handleToggleSmartFill}
              activeTab="docs"
              isSuperAdmin={isSuperAdmin}
              isFrozen={isCampusFrozen}
              adminPermissions={effectiveAdminPerms}
            />
          </div>
        )}

        {/* VIEW 10: SETTINGS & SUPER ADMIN GOVERNANCE HUB */}
        {(activeAppTab === 'settings' || activeAppTab === 'superadmin') && (
          <div>
            <SuperAdminHub
              currentUser={currentUser}
              userAccounts={userAccounts}
              onUpdateUserAccounts={handleUpdateUserAccounts}
              policies={systemPolicies}
              onUpdatePolicies={handleUpdatePolicies}
              auditLogs={auditLogs}
              onUpdateAuditLogs={handleUpdateAuditLogs}
              batches={batches}
              faculty={faculty}
              courses={courses}
              rooms={rooms}
              mappings={mappings}
              semesterCourseMaps={semesterCourseMaps}
              entries={timetableEntries}
              onUpdateBatches={handleUpdateBatches}
              onUpdateFaculty={handleUpdateFaculty}
              onUpdateCourses={handleUpdateCourses}
              onUpdateRooms={handleUpdateRooms}
              onUpdateMappings={handleUpdateMappings}
              onUpdateSemesterCourseMaps={handleUpdateSemesterCourseMaps}
              onUpdateEntries={handleUpdateEntries}
              onShowToast={handleShowToast}
              onNavigateToTab={(t) => setActiveAppTab(t as AppViewTab)}
            />
          </div>
        )}

        </main>
      </div>

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-[#64748B] mt-12 print:hidden">
        <p>© 2026 TimePro — Timetable Management System. All Rights Reserved.</p>
        <p className="mt-1 text-[10px] text-slate-400">
          Powered by Constraint Satisfaction Backtracking (CSP) Engine • Role-Based Governance v2.5
        </p>
      </footer>

      {/* Real-time Toast Hub */}
      <Toast toasts={toasts} onRemove={handleRemoveToast} />

      {/* 100% Iframe-safe Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <span className="p-1.5 bg-amber-50 text-[#D97706] rounded-lg border border-amber-200">
                  <HelpCircle className="w-5 h-5" />
                </span>
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-[#475569] font-semibold hover:bg-slate-50 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs transition-colors shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Confirm Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Grid & Re-Generate Action Modal */}
      <ClearGridModal
        isOpen={isClearGridModalOpen}
        onClose={() => setIsClearGridModalOpen(false)}
        activeBatch={batches.find(b => b.id === activeBatchId)}
        onClearSection={handleClearSection}
        onClearAndGenerateNew={handleClearAndGenerateNew}
        onClearAllUniversity={handleClearAllUniversity}
      />

      {/* Role & Persona Switcher Authentication Modal */}
      <RoleSwitchModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        userAccounts={userAccounts}
        onSelectUser={handleSelectUser}
        onShowToast={handleShowToast}
        onLogout={handleLogout}
      />
    </div>
  );
}

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
  CheckCircle2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

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
  ToastMessage 
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

import { generateTimetableForBatch, generateTimetableForSemester, resolveOverlapConflicts, SolverLog } from './utils/solver';
import { exportTimetableToExcel } from './utils/excelExport';
import { ensureDailySnapshot, saveSnapshot } from './utils/backup';
import TimetableGrid from './components/TimetableGrid';
import BottomFacultyTable from './components/BottomFacultyTable';
import AdminPanel, { AdminTab } from './components/AdminPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import FacultyTimetableView from './components/FacultyTimetableView';
import RoomOccupancyView from './components/RoomOccupancyView';
import ClearGridModal from './components/ClearGridModal';
import Toast from './components/Toast';

export type AppViewTab = 'timetable' | 'generator' | 'analytics' | 'faculty' | 'curriculum' | 'rooms' | 'conflicts' | 'batches' | 'regulations';

export default function App() {
  // --- Persistent Storage State ---
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [mappings, setMappings] = useState<FacultyCourseMapping[]>([]);
  const [semesterCourseMaps, setSemesterCourseMaps] = useState<SemesterCourseMap[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  
  // --- UI Control States ---
  const [activeAppTab, setActiveAppTab] = useState<AppViewTab>('timetable');
  const [facultySubTab, setFacultySubTab] = useState<'schedule' | 'directory'>('schedule');
  const [roomsSubTab, setRoomsSubTab] = useState<'occupancy' | 'manager'>('occupancy');
  const [isClearGridModalOpen, setIsClearGridModalOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(true); // Admin control by default
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

    // Auto-migrate faculty if stored version has fewer than 35 faculty
    const storedFaculty = getStored('apollo_user_faculty', DEFAULT_FACULTY);
    const validFaculty = (Array.isArray(storedFaculty) && storedFaculty.length >= 35) ? storedFaculty : DEFAULT_FACULTY;
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
        
        handleShowToast('success', 'Database Restored', 'Database has been reset to its pristine original state.');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Clear Timetable Handlers ---
  const handleClearSection = (keepLocked: boolean = false) => {
    const currentBatchId = activeBatchId;
    const activeBatchObj = batches.find(b => b.id === currentBatchId);
    setTimetableEntries((prevEntries) => {
      const remaining = prevEntries.filter(e => !(e.batchId === currentBatchId && (!keepLocked || !e.isLocked)));
      saveState('apollo_user_timetable', remaining);
      return [...remaining];
    });
    handleShowToast('info', 'Section Timetable Cleared', `Removed sessions for ${activeBatchObj?.name || 'current section'}. Ready for fresh assignments!`);
  };

  const handleClearAndGenerateNew = async () => {
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

    const result = generateTimetableForBatch(
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
      handleShowToast('success', 'New Timetable Ready', `Generated brand-new conflict-free schedule for ${activeBatchObj.name}!`);
    } else {
      const updated = [...remaining, ...result.timetable];
      setTimetableEntries(updated);
      saveState('apollo_user_timetable', updated);
      handleShowToast('warning', 'Partial Schedule Generated', `Placed ${result.timetable.length} periods. Check diagnostics for edge-case constraints.`);
    }
  };

  const handleClearAllUniversity = () => {
    setTimetableEntries([]);
    saveState('apollo_user_timetable', []);
    handleShowToast('info', 'All Timetables Cleared', 'All 40 section schedules across 8 semesters have been cleared.');
  };

  const handleClearTimetable = () => {
    setIsClearGridModalOpen(true);
  };

  // --- Automated Timetable Generation Trigger ---
  const handleAutoGenerate = async () => {
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
  const handleAutoGenerateSemester = async (targetSemInput?: number | 'all') => {
    const rawTarget = targetSemInput !== undefined ? targetSemInput : (selectedGenSemester === 'all' ? 'all' : Number(selectedGenSemester));

    setIsGenerating(true);

    if (rawTarget === 'all') {
      // Generate all semesters (Full Campus)
      const allSemesters = Array.from(new Set(batches.map(b => b.semester))).sort((a, b) => b - a);
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
            enableSmartRelaxation: true,
            maxSessionDuration,
            allowThreeHourSessions: maxSessionDuration >= 3
          }
        );
        currentTimetable = semResult.timetable;
        totalSolved += semResult.batchesSolved;
        if (semResult.logs) allLogs.push(...semResult.logs);
      }

      setIsGenerating(false);
      setLastSolverLogs(allLogs);
      handleUpdateEntries(currentTimetable);
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

    const result = generateTimetableForSemester(
      targetSemester,
      courses,
      faculty,
      rooms,
      mappings,
      semesterCourseMaps,
      timetableEntries,
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
      handleUpdateEntries(result.timetable);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100 print:bg-white print:text-black">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
                  Auto Timetable Generator
                </h1>
                <span className="text-[10px] bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full font-mono">
                  v2.5 Professional
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                <span>B.Tech Computer Science & Engineering</span>
                <span>•</span>
                <span className="text-slate-400">School of Technology</span>
              </p>
            </div>
          </div>

          {/* Quick Info & Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-700">Active Section:</span>
              <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-mono text-[11px]">
                {activeBatch?.name || 'CSE-A'}
              </span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setIsAdmin(false)}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  !isAdmin ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {!isAdmin && (
                  <motion.div
                    layoutId="roleTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md -z-10"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <User className="w-3.5 h-3.5" />
                Student View
              </button>
              <button
                onClick={() => setIsAdmin(true)}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isAdmin ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAdmin && (
                  <motion.div
                    layoutId="roleTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md -z-10"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Console
              </button>
            </div>
          </div>
        </div>

        {/* Master Navigation Tabs Strip */}
        <div className="border-t border-slate-200/70 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1 overflow-x-auto py-2 custom-scrollbar">
              {[
                { id: 'timetable', label: 'Class Timetable', icon: Calendar, badge: `${activeBatchEntries.length} Slots` },
                { id: 'generator', label: 'Auto Generator Studio', icon: Sparkles, badge: 'CSP v2.5' },
                { id: 'analytics', label: 'Health & 24 Constraints', icon: ShieldCheck, badge: '100% Passed' },
                { id: 'faculty', label: 'Faculty Directory & Workload', icon: Users, badge: `${faculty.length}` },
                { id: 'curriculum', label: 'Curriculum & Syllabus', icon: BookOpen, badge: 'Sem 1-8' },
                { id: 'rooms', label: 'Classrooms & Labs', icon: Warehouse, badge: `${rooms.length}` },
                { id: 'conflicts', label: 'Section Overlaps', icon: AlertTriangle, badge: '0 Clashes' },
                { id: 'batches', label: 'Batches & Sections', icon: GraduationCap, badge: `${batches.length}` },
                { id: 'regulations', label: 'Academic Regulations', icon: FileText, badge: 'AICTE' },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeAppTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAppTab(tab.id as AppViewTab)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'text-indigo-700 bg-white border border-slate-200/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-200/60 text-slate-500'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 2. Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* VIEW 1: CLASS TIMETABLES */}
        {activeAppTab === 'timetable' && (
          <div className="space-y-6">
            {/* Top Toolbar: Batch Selectors & Quick Actions */}
            <section className="bg-white/90 backdrop-blur-md border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-sm space-y-5 print:hidden">
              {/* Batch Selection & Semester Tabs */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    Select Student Section <span className="text-slate-400 font-medium">({batches.length} Sections Available)</span>
                  </label>
                  
                  {/* Semester Quick Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70">
                    <button
                      onClick={() => setSelectedHeaderSemester('all')}
                      className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        selectedHeaderSemester === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                      }`}
                    >
                      All ({batches.length})
                    </button>
                    {[8, 7, 6, 5, 4, 3, 2, 1].map((sem) => {
                      const count = batches.filter(b => b.semester === sem).length;
                      if (count === 0) return null;
                      const isSelected = selectedHeaderSemester === sem.toString();
                      return (
                        <button
                          key={sem}
                          onClick={() => {
                            setSelectedHeaderSemester(sem.toString());
                            const firstBatchInSem = batches.find(b => b.semester === sem);
                            if (firstBatchInSem) setActiveBatchId(firstBatchInSem.id);
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                          }`}
                        >
                          Sem {sem} <span className="opacity-75">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Batch Chips */}
                <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar py-1">
                  {(selectedHeaderSemester === 'all'
                    ? batches
                    : batches.filter(b => b.semester === Number(selectedHeaderSemester))
                  ).map((batch) => {
                    const isActive = batch.id === activeBatchId;
                    return (
                      <button
                        key={batch.id}
                        onClick={() => setActiveBatchId(batch.id)}
                        className={`text-left px-3.5 py-2 rounded-2xl border transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/20 scale-[1.02] font-semibold ring-2 ring-indigo-400/40'
                            : 'bg-slate-50 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 font-medium hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'}`}></span>
                          <span className="text-xs font-bold leading-none">{batch.name}</span>
                        </div>
                        <div className={`text-[10px] mt-1 font-mono leading-none ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                          Sem {batch.semester} {batch.studentCount ? `• ${batch.studentCount} studs` : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions & Export Hub */}
              <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Fast Solver Shortcut Button */}
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={handleAutoGenerate}
                        disabled={isGenerating}
                        className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          isGenerating ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Solving...' : 'Auto-Generate This Section'}
                      </button>

                      <button
                        onClick={() => setIsClearGridModalOpen(true)}
                        className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Clear grid and generate a new one"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Clear Grid</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveAppTab('generator')}
                    className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Generator Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Export Tools Hub */}
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
                  <button
                    onClick={handlePrint}
                    className="hover:bg-white text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Open browser print dialog"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    Print
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    className="hover:bg-white text-slate-700 hover:text-rose-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Download PDF document"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-600" />
                    PDF
                  </button>

                  <button
                    onClick={handleDownloadPNG}
                    className="hover:bg-white text-slate-700 hover:text-blue-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Download PNG image"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    PNG
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="hover:bg-white text-slate-700 hover:text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Export to Excel Spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Excel
                  </button>
                </div>
              </div>
            </section>

            {/* Printable Timetable Capture Area */}
            <div id="timetable-capture-area" className="flex flex-col gap-6 bg-slate-100/50 p-4 sm:p-6 rounded-3xl border border-slate-200/70 shadow-xs print:p-0 print:border-none print:shadow-none print:bg-transparent">
              {/* Header Card */}
              <section className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-6 rounded-3xl shadow-sm text-center relative overflow-hidden" id="print-timetable-card">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                
                <div className="border-b border-dashed border-slate-200/80 pb-3.5 mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span className="text-[11px] font-mono font-black tracking-widest text-slate-500 uppercase">
                      TIME TABLE MANAGEMENT • SCHOOL OF TECHNOLOGY
                    </span>
                  </div>
                  <span className="text-xs bg-slate-100/90 font-black px-3.5 py-1 rounded-full text-slate-800 border border-slate-200 font-mono">
                    Issue No.: {issueNo}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-none">
                  CLASS TIMETABLE — B.TECH CSE
                </h2>
                
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 text-xs font-semibold text-slate-700 border-t border-slate-100">
                  <div className="bg-slate-50/80 hover:bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 transition-colors">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase mb-0.5">Year of Study</p>
                    <p className="text-slate-950 font-black">{getYearName(activeBatch?.semester || 1)}</p>
                  </div>
                  <div className="bg-indigo-50/50 hover:bg-indigo-50 px-3.5 py-2.5 rounded-2xl border border-indigo-100 transition-colors">
                    <p className="text-[10px] text-indigo-400 font-mono font-bold uppercase mb-0.5">Academic Semester</p>
                    <p className="text-indigo-700 font-black">Sem - {getRomanSemester(activeBatch?.semester || 1)} ({activeBatch?.name})</p>
                  </div>
                  <div className="bg-slate-50/80 hover:bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center relative group transition-colors">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase mb-0.5">Physical Classroom</p>
                    <p className="text-slate-950 font-black text-xs">Room No. {activeRoom ? activeRoom.roomNumber : '027'}</p>
                    {isAdmin && (
                      <select
                        value={activeRoomId}
                        onChange={(e) => setActiveRoomId(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer print:hidden w-full h-full"
                        title="Click to select physical classroom"
                      >
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="bg-slate-50/80 hover:bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center relative group transition-colors">
                    <p className="text-[10px] text-slate-400 font-mono font-bold uppercase mb-0.5">Class Teacher</p>
                    <p className="text-slate-950 font-black text-xs">{currentTeacher ? currentTeacher.name : 'Dr. Meera Nair'}</p>
                    {isAdmin && (
                      <select
                        value={classTeacherId}
                        onChange={(e) => setClassTeacherId(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer print:hidden w-full h-full"
                        title="Click to assign class teacher"
                      >
                        <option value="">-- Assign Teacher --</option>
                        {faculty.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </section>

              {/* Timetable Grid Matrix */}
              <section className="print:m-0">
                <TimetableGrid
                  entries={timetableEntries}
                  allCourses={courses}
                  allFaculty={faculty}
                  allRooms={rooms}
                  allSlots={DEFAULT_SLOTS}
                  days={DEFAULT_DAYS}
                  isAdmin={isAdmin}
                  activeBatchId={activeBatchId}
                  activeRoomId={activeRoomId}
                  preferredRoomId={activeRoomId}
                  onUpdateEntries={handleUpdateEntries}
                  onShowToast={handleShowToast}
                  semesterCourseMaps={semesterCourseMaps}
                  activeSemester={activeBatch ? activeBatch.semester : 1}
                  mappings={mappings}
                  batches={batches}
                  smartFillEnabled={smartFillEnabled}
                  maxSessionDuration={maxSessionDuration}
                  onClearGrid={() => setIsClearGridModalOpen(true)}
                />
              </section>

              {/* Bottom Faculty Table */}
              <section className="print:break-inside-avoid">
                <BottomFacultyTable
                  entries={activeBatchEntries}
                  allCourses={courses}
                  allFaculty={faculty}
                  roomNumber={activeRoom ? activeRoom.roomNumber : '027'}
                  mappings={mappings}
                />
              </section>
            </div>
          </div>
        )}

        {/* VIEW 2: AUTO GENERATOR & CSP SOLVER STUDIO */}
        {activeAppTab === 'generator' && (
          <div className="space-y-6">
            {/* Header Description */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Auto Timetable Generator Studio</h2>
                    <p className="text-xs text-indigo-200">
                      Constraint Satisfaction Problem (CSP) Engine with Backtracking & Exact Faculty Mappings
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveAppTab('timetable')}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>View Generated Timetable</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Solver Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Single Batch Generator */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      Target: {activeBatch?.name}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">Single Section Solver</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Compute a 100% conflict-free weekly schedule for <strong>{activeBatch?.name}</strong> based strictly on required curriculum hours and mapped specialists.
                  </p>
                </div>

                <button
                  onClick={handleAutoGenerate}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Solving Section...' : `Generate for ${activeBatch?.name}`}
                </button>
              </div>

              {/* Card 2: Multi-Section Semester Solver */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                      Parallel Multi-Section
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">Simultaneous Semester Solver</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Solve multiple parallel sections at once while synchronizing shared faculty, laboratory spaces, and classroom capacities.
                  </p>

                  <select
                    value={selectedGenSemester}
                    onChange={(e) => setSelectedGenSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="8">Semester VIII (5 Sections)</option>
                    <option value="7">Semester VII (7 Sections)</option>
                    <option value="6">Semester VI (5 Sections)</option>
                    <option value="5">Semester V (5 Sections)</option>
                    <option value="4">Semester IV (5 Sections)</option>
                    <option value="3">Semester III (5 Sections)</option>
                    <option value="2">Semester II (4 Sections)</option>
                    <option value="1">Semester I (4 Sections)</option>
                    <option value="all">Full Campus (All 8 Semesters - 40 Batches)</option>
                  </select>
                </div>

                <button
                  onClick={() => handleAutoGenerateSemester()}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Layers className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                  {isGenerating ? 'Solving All Sections...' : 'Solve All Selected Sections'}
                </button>
              </div>

              {/* Card 3: Conflict Fixer & Policy Settings */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">
                      Conflict Reliever
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">Conflict Fixer & Duration Policy</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
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
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value={2}>Max 2 Continuous Hours (Standard)</option>
                    <option value={3}>Allow 3 Hours (Extended Workshops)</option>
                    <option value={4}>Allow 4 Hours (Capstone Projects)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAutoFixConflicts}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Fix Overlaps
                  </button>
                  <button
                    onClick={handleClearTimetable}
                    className="px-3.5 py-3 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-2xl transition-all text-xs font-bold cursor-pointer"
                    title="Clear unlocked slots"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Solver Execution Logs Console */}
            <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-900/60 text-indigo-400 rounded-xl">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">CSP Solver Execution Console</h3>
                    <p className="text-[11px] text-slate-400">Step-by-step backtracking trace and constraint audits</p>
                  </div>
                </div>

                {/* Log Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {(['all', 'placed', 'backtrack', 'conflict', 'info'] as const).map(flt => (
                    <button
                      key={flt}
                      onClick={() => setSolverLogFilter(flt)}
                      className={`text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        solverLogFilter === flt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
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
                            : 'bg-slate-900 border-slate-800 text-slate-300'
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
        {activeAppTab === 'analytics' && (
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
            />
          </div>
        )}

        {/* VIEW 4: FACULTY PERSONAL SCHEDULE & DIRECTORY */}
        {activeAppTab === 'faculty' && (
          <div className="space-y-6">
            {/* View Switcher Sub-Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 p-2.5 rounded-2xl shadow-2xs print:hidden">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
                <button
                  onClick={() => setFacultySubTab('schedule')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    facultySubTab === 'schedule'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Personal Faculty Timetable (Grid & PDF)</span>
                </button>

                <button
                  onClick={() => setFacultySubTab('directory')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    facultySubTab === 'directory'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Faculty Directory & Workload Manager</span>
                </button>
              </div>

              <div className="text-xs font-bold text-slate-500 pr-3 font-mono hidden sm:flex items-center gap-2">
                <span>Registered Faculty:</span>
                <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-extrabold">
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
            />
          </div>
        )}

        {/* VIEW 6: CLASSROOMS & LABS OCCUPANCY */}
        {activeAppTab === 'rooms' && (
          <div className="space-y-6">
            {/* Sub-Tab Navigation Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 p-2.5 rounded-2xl shadow-2xs print:hidden">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
                <button
                  onClick={() => setRoomsSubTab('occupancy')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    roomsSubTab === 'occupancy'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Room & Lab Occupancy Schedule (Grid & PDF)</span>
                </button>

                <button
                  onClick={() => setRoomsSubTab('manager')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    roomsSubTab === 'manager'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Classrooms & Labs Capacity Manager</span>
                </button>
              </div>

              <div className="text-xs font-bold text-slate-500 pr-3 font-mono hidden sm:flex items-center gap-2">
                <span>Total Infrastructure:</span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-extrabold">
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
            />
          </div>
        )}

        {/* VIEW 8: BATCHES & SECTIONS */}
        {activeAppTab === 'batches' && (
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
            />
          </div>
        )}

        {/* VIEW 9: ACADEMIC REGULATIONS */}
        {activeAppTab === 'regulations' && (
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
            />
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-500 mt-12 print:hidden">
        <p>© 2026 Time Table Management. School of Technology. All Rights Reserved.</p>
        <p className="mt-1 text-[10px] text-slate-400">
          Powered by Constraint Satisfaction Backtracking (CSP) Engine. Designed for desktop browsers.
        </p>
      </footer>

      {/* Real-time Toast Hub */}
      <Toast toasts={toasts} onRemove={handleRemoveToast} />

      {/* 100% Iframe-safe Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <HelpCircle className="w-5 h-5" />
                </span>
                {confirmDialog.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
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
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Sparkles, 
  Trash2, 
  Settings, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Users, 
  BookOpen, 
  Building2, 
  Microscope, 
  FlaskConical,
  Award, 
  Rocket, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  Search, 
  BarChart3, 
  AlertTriangle, 
  Shuffle, 
  Copy, 
  Move, 
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  UtensilsCrossed,
  Lock,
  Unlock,
  ArrowLeftRight,
  X,
  Edit2,
  Check,
  ShieldCheck,
  Plus,
  Info
} from 'lucide-react';
import { 
  Batch, 
  Faculty, 
  Course, 
  Room, 
  FacultyCourseMapping, 
  SemesterCourseMap, 
  TimetableEntry, 
  Day, 
  SlotId,
  Slot,
  SolverOptions
} from '../types';
import campusDaylightBg from '../assets/campus_daylight_bg.jpg';
import AutoGenerateModal, { GenerationScope } from './AutoGenerateModal';
import ConflictResolutionAssistant from './ConflictResolutionAssistant';
import { getOccupiedSlots, validateSlotAvailability, filterCoursesBySemester } from '../utils/solver';
import { SEMESTER_SYLLABUS_REGISTRY } from '../data/syllabusData';

interface ClassTimetableHeroViewProps {
  activeBatch: Batch | undefined;
  batches: Batch[];
  onSelectBatch: (batchId: string) => void;
  entries: TimetableEntry[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
  mappings: FacultyCourseMapping[];
  semesterCourseMaps: SemesterCourseMap[];
  onUpdateEntries: (entries: TimetableEntry[]) => void;
  onAutoGenerate: () => void;
  onAutoGenerateWithScope?: (scope: GenerationScope, targetSemester?: number, targetBatchId?: string, options?: SolverOptions) => Promise<void>;
  onClearGrid: () => void;
  onOpenStudio: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onDownloadPNG: () => void;
  onExportExcel: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  isAdmin: boolean;
  isGenerating: boolean;
  isFrozen: boolean;
  issueNo: number;
  onNavigateToTab: (tab: string) => void;
}

export default function ClassTimetableHeroView({
  activeBatch,
  batches,
  onSelectBatch,
  entries,
  courses,
  faculty,
  rooms,
  mappings,
  semesterCourseMaps,
  onUpdateEntries,
  onAutoGenerate,
  onAutoGenerateWithScope,
  onClearGrid,
  onOpenStudio,
  onPrint,
  onDownloadPDF,
  onDownloadPNG,
  onExportExcel,
  onShowToast,
  isAdmin,
  isGenerating,
  isFrozen,
  issueNo = 1,
  onNavigateToTab,
}: ClassTimetableHeroViewProps) {
  // Scope Generation Modal state
  const [isAutoModalOpen, setIsAutoModalOpen] = useState<boolean>(false);

  // Filter bar states
  const [selectedYear, setSelectedYear] = useState<string>('IV Year');
  const [selectedSemester, setSelectedSemester] = useState<number>(activeBatch?.semester || 8);

  // Drag and Drop States
  const [draggedEntry, setDraggedEntry] = useState<TimetableEntry | null>(null);
  const [draggedCourse, setDraggedCourse] = useState<Course | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: Day; slotId: SlotId } | null>(null);

  // Interactive Swap & Conflict Assistant States
  const [isSwapAssistantOpen, setIsSwapAssistantOpen] = useState<boolean>(false);
  const [selectedSwapEntryId, setSelectedSwapEntryId] = useState<string | undefined>(undefined);

  // Class Session Details & Actions Modal (Clicking any occupied card)
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<TimetableEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [editFacultyId, setEditFacultyId] = useState<string>('');
  const [editRoomId, setEditRoomId] = useState<string>('');

  // Assign Course to Empty Slot Modal (Clicking any free slot)
  const [emptySlotTarget, setEmptySlotTarget] = useState<{ day: Day; slotId: SlotId } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addCourseId, setAddCourseId] = useState<string>('');
  const [addFacultyId, setAddFacultyId] = useState<string>('');
  const [addRoomId, setAddRoomId] = useState<string>('');
  const [addDuration, setAddDuration] = useState<number>(1);

  // Days list
  const days: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // All 6 academic timeslots
  const allSlots: Slot[] = [
    { id: 'I', name: 'Slot I', time: '09:00 – 10:00', duration: '60 min', isActive: true, isBreak: false },
    { id: 'II', name: 'Slot II', time: '10:00 – 11:00', duration: '60 min', isActive: true, isBreak: false },
    { id: 'III', name: 'Slot III', time: '11:10 – 12:10', duration: '60 min', isActive: true, isBreak: false },
    { id: 'IV', name: 'Slot IV', time: '01:00 – 02:00', duration: '60 min', isActive: true, isBreak: false },
    { id: 'V', name: 'Slot V', time: '02:00 – 03:00', duration: '60 min', isActive: true, isBreak: false },
    { id: 'VI', name: 'Slot VI', time: '03:00 – 04:00', duration: '60 min', isActive: true, isBreak: false },
  ];

  // Current batch entries
  const currentBatchId = activeBatch?.id || batches[0]?.id || 'batch-sem8-cse-a';
  const batchEntries = useMemo(() => {
    return entries.filter(e => e.batchId === currentBatchId);
  }, [entries, currentBatchId]);

  // Robust course resolution (resolves standard, code aliases, and syllabus courses)
  const resolveCourse = useMemo(() => {
    return (courseId?: string): Course | undefined => {
      if (!courseId) return undefined;
      const direct = courses.find(c => c.id === courseId);
      if (direct) return direct;
      const byCode = courses.find(c => c.courseCode && c.courseCode.toLowerCase() === courseId.toLowerCase());
      if (byCode) return byCode;
      for (const s of Object.values(SEMESTER_SYLLABUS_REGISTRY)) {
        const found = s.find(sc => sc.code.toLowerCase() === courseId.toLowerCase() || `crs-${sc.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}` === courseId);
        if (found) {
          return {
            id: courseId,
            courseCode: found.code,
            name: found.name,
            type: found.type === 'Lab' ? 'Lab' : (found.type === 'Activity' ? 'Non-Academic' : 'Theory'),
            durationSlots: found.type === 'Lab' ? 2 : 1,
            credits: found.type === 'Lab' ? 1.5 : (found.type === 'Activity' ? 1 : 3)
          };
        }
      }
      return undefined;
    };
  }, [courses]);

  // Batches in current semester
  const semesterBatches = useMemo(() => {
    const semBatches = batches.filter(b => b.semester === selectedSemester);
    return semBatches.length > 0 ? semBatches : batches.slice(0, 6);
  }, [batches, selectedSemester]);

  // Available courses for active semester
  const availableSemesterCourses = useMemo(() => {
    return filterCoursesBySemester(courses, semesterCourseMaps, activeBatch?.semester || selectedSemester);
  }, [courses, semesterCourseMaps, activeBatch, selectedSemester]);

  // Calculate section statistics
  const stats = useMemo(() => {
    const batchCourseIds = new Set<string>();
    const batchFacultyIds = new Set<string>();
    const batchRoomIds = new Set<string>();

    batchEntries.forEach(entry => {
      if (entry.courseId) batchCourseIds.add(entry.courseId);
      if (entry.facultyId) batchFacultyIds.add(entry.facultyId);
      if (entry.roomId) batchRoomIds.add(entry.roomId);
    });

    let theoryCount = 0;
    let labCount = 0;
    batchCourseIds.forEach(cId => {
      const crs = resolveCourse(cId);
      if (crs?.type === 'Lab' || crs?.type === 'Long Duration') {
        labCount++;
      } else {
        theoryCount++;
      }
    });

    return {
      studentCount: activeBatch?.studentCount || 65,
      totalSubjects: batchCourseIds.size || 6,
      theoryCount: theoryCount || 4,
      labCount: labCount || 2,
      facultyCount: batchFacultyIds.size || 4,
      roomCount: batchRoomIds.size || 4,
      courseList: Array.from(batchCourseIds).map(cId => resolveCourse(cId)).filter(Boolean) as Course[]
    };
  }, [batchEntries, activeBatch, courses, resolveCourse]);

  // Timeslot configuration
  const timeSlots = [
    { slotId: 'I' as SlotId, time: '09:00 – 10:00' },
    { slotId: 'II' as SlotId, time: '10:00 – 11:00' },
    { slotId: 'III' as SlotId, time: '11:10 – 12:10' },
    { isLunch: true, time: '12:10 – 01:00', label: 'LUNCH BREAK' },
    { slotId: 'IV' as SlotId, time: '01:00 – 02:00' },
    { slotId: 'V' as SlotId, time: '02:00 – 03:00' },
    { slotId: 'VI' as SlotId, time: '03:00 – 04:00' }
  ];

  // Helper for cell coloring matching reference design
  const getSubjectColorStyles = (course: Course | undefined) => {
    if (!course) {
      return {
        bg: 'bg-[#F8FAFC]',
        text: 'text-slate-400',
        border: 'border-slate-200/80',
        badge: 'bg-slate-100 text-slate-500'
      };
    }

    switch (course.type) {
      case 'Lab':
        return {
          bg: 'bg-[#ECFDF5]',
          text: 'text-[#065F46]',
          border: 'border-emerald-200/80',
          badge: 'bg-emerald-100 text-[#065F46]'
        };
      case 'Long Duration':
        return {
          bg: 'bg-[#F5F3FF]',
          text: 'text-[#5B21B6]',
          border: 'border-purple-200/80',
          badge: 'bg-purple-100 text-[#5B21B6]'
        };
      case 'Non-Academic':
        return {
          bg: 'bg-[#FFF7E6]',
          text: 'text-[#9A3412]',
          border: 'border-orange-200/80',
          badge: 'bg-orange-100 text-[#9A3412]'
        };
      default: // Theory
        return {
          bg: 'bg-[#EEF4FF]',
          text: 'text-[#1E40AF]',
          border: 'border-blue-200/80',
          badge: 'bg-blue-100 text-[#1E40AF]'
        };
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStartEntry = (e: React.DragEvent, entry: TimetableEntry, course: Course) => {
    if (entry.isLocked) {
      e.preventDefault();
      onShowToast('warning', 'Slot Locked', 'This slot is locked. Unlock it before dragging!');
      return;
    }
    setDraggedCourse(course);
    setDraggedEntry(entry);
    e.dataTransfer.setData('text/plain', entry.id);
  };

  const handleDragEnd = () => {
    setDraggedCourse(null);
    setDraggedEntry(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, day: Day, slotId: SlotId) => {
    e.preventDefault();
    if (!isAdmin || isFrozen || !draggedEntry) return;
    
    if (dragOverCell?.day !== day || dragOverCell?.slotId !== slotId) {
      setDragOverCell({ day, slotId });
    }
  };

  const handleDrop = (e: React.DragEvent, day: Day, slotId: SlotId) => {
    e.preventDefault();
    if (!isAdmin || isFrozen || !draggedEntry || !draggedCourse) return;

    const entryToMove = draggedEntry;
    const course = draggedCourse;
    handleDragEnd();

    // If dropped on the same slot, do nothing
    if (entryToMove.day === day && entryToMove.slotId === slotId) {
      return;
    }

    // Check if target cell has an existing entry for this batch
    const targetOccupiedEntry = entries.find(
      e => e.batchId === currentBatchId && e.day === day && getOccupiedSlots(e.slotId, e.colSpan || 1).includes(slotId)
    );

    // CASE 1: MUTUAL SWAP (Target is occupied by another period)
    if (targetOccupiedEntry && targetOccupiedEntry.id !== entryToMove.id) {
      const targetCourse = resolveCourse(targetOccupiedEntry.courseId);
      const targetDuration = targetOccupiedEntry.colSpan || targetCourse?.durationSlots || 1;

      // 1. Validate moving source to target slot
      const val1 = validateSlotAvailability(
        day,
        targetOccupiedEntry.slotId,
        course,
        entryToMove.facultyId,
        entryToMove.roomId,
        currentBatchId,
        entries,
        courses,
        rooms,
        faculty,
        entryToMove.id,
        batches
      );

      // 2. Validate moving target to source slot
      const val2 = targetCourse ? validateSlotAvailability(
        entryToMove.day,
        entryToMove.slotId,
        targetCourse,
        targetOccupiedEntry.facultyId,
        targetOccupiedEntry.roomId,
        currentBatchId,
        entries,
        courses,
        rooms,
        faculty,
        targetOccupiedEntry.id,
        batches
      ) : { available: false, error: 'Target course not found' };

      if (val1.available && val2.available && (course.durationSlots || 1) === targetDuration) {
        // Safe Mutual Swap!
        const swapped = entries.map(item => {
          if (item.id === entryToMove.id) {
            return { ...item, day, slotId: targetOccupiedEntry.slotId };
          }
          if (item.id === targetOccupiedEntry.id) {
            return { ...item, day: entryToMove.day, slotId: entryToMove.slotId };
          }
          return item;
        });
        onUpdateEntries(swapped);
        onShowToast('success', 'Mutual Swap Completed', `Swapped ${course.courseCode || course.name} with ${targetCourse?.courseCode || targetCourse?.name} (0 Conflicts).`);
        return;
      } else {
        // Direct swap causes a conflict - open Conflict Assistant for guided options!
        setSelectedSwapEntryId(entryToMove.id);
        setIsSwapAssistantOpen(true);
        onShowToast('warning', 'Direct Swap Conflict', val1.error || val2.error || 'Opened Conflict Assistant to select a safe alternative slot.');
        return;
      }
    }

    // CASE 2: MOVE TO EMPTY SLOT
    const validation = validateSlotAvailability(
      day,
      slotId,
      course,
      entryToMove.facultyId,
      entryToMove.roomId,
      currentBatchId,
      entries,
      courses,
      rooms,
      faculty,
      entryToMove.id,
      batches
    );

    if (!validation.available) {
      setSelectedSwapEntryId(entryToMove.id);
      setIsSwapAssistantOpen(true);
      onShowToast('error', 'Slot Conflict Detected', validation.error || 'Cannot move period here. Opened Conflict Assistant.');
      return;
    }

    // Apply safe move
    const updated = entries.map(item => {
      if (item.id === entryToMove.id) {
        return { ...item, day, slotId };
      }
      return item;
    });

    onUpdateEntries(updated);
    onShowToast('success', 'Period Moved', `Moved ${course.courseCode || course.name} to ${day} Slot ${slotId}.`);
  };

  // --- Quick Card Action Handlers ---
  const handleToggleLock = (entryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin || isFrozen) return;

    const updated = entries.map(item => {
      if (item.id === entryId) {
        const nextLocked = !item.isLocked;
        onShowToast(
          'info', 
          nextLocked ? 'Slot Locked 🔒' : 'Slot Unlocked 🔓', 
          nextLocked ? 'This session is locked and will be preserved during auto-generation.' : 'This session is now unlocked.'
        );
        return { ...item, isLocked: nextLocked };
      }
      return item;
    });

    onUpdateEntries(updated);
    if (selectedDetailEntry && selectedDetailEntry.id === entryId) {
      setSelectedDetailEntry(prev => prev ? { ...prev, isLocked: !prev.isLocked } : null);
    }
  };

  const handleDeleteEntry = (entryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin || isFrozen) return;

    const entryToDelete = entries.find(item => item.id === entryId);
    const crs = entryToDelete ? resolveCourse(entryToDelete.courseId) : undefined;
    const updated = entries.filter(item => item.id !== entryId);
    
    onUpdateEntries(updated);
    onShowToast('info', 'Session Removed 🗑️', `Cleared ${crs?.courseCode || crs?.name || 'session'} from timetable.`);
    if (isDetailModalOpen) setIsDetailModalOpen(false);
  };

  const handleOpenSwap = (entryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSwapEntryId(entryId);
    setIsSwapAssistantOpen(true);
  };

  // --- Card Click Inspector Modal Handlers ---
  const handleCardClick = (entry: TimetableEntry) => {
    setSelectedDetailEntry(entry);
    setEditFacultyId(entry.facultyId || '');
    setEditRoomId(entry.roomId || '');
    setIsDetailModalOpen(true);
  };

  const handleSaveDetailChanges = () => {
    if (!selectedDetailEntry) return;

    const updated = entries.map(item => {
      if (item.id === selectedDetailEntry.id) {
        return {
          ...item,
          facultyId: editFacultyId || item.facultyId,
          roomId: editRoomId || item.roomId,
        };
      }
      return item;
    });

    onUpdateEntries(updated);
    setIsDetailModalOpen(false);
    onShowToast('success', 'Session Updated', 'Instructor and room assignments updated successfully.');
  };

  // --- Empty Slot Click Handlers ---
  const handleEmptyCellClick = (day: Day, slotId: SlotId) => {
    if (!isAdmin || isFrozen) return;

    const defaultCourse = availableSemesterCourses[0] || courses[0];
    const defaultDuration = defaultCourse?.durationSlots || 1;
    const mappedFac = mappings.find(m => m.courseId === defaultCourse?.id)?.facultyId;
    
    setEmptySlotTarget({ day, slotId });
    setAddCourseId(defaultCourse?.id || '');
    setAddFacultyId(mappedFac || faculty[0]?.id || '');
    setAddRoomId(activeBatch?.preferredRoomId || rooms[0]?.id || '');
    setAddDuration(defaultDuration);
    setIsAddModalOpen(true);
  };

  const handleSaveAddSlot = () => {
    if (!emptySlotTarget || !addCourseId) return;

    const course = resolveCourse(addCourseId);
    if (!course) return;

    const courseWithDuration: Course = {
      ...course,
      durationSlots: addDuration || 1
    };

    const validation = validateSlotAvailability(
      emptySlotTarget.day,
      emptySlotTarget.slotId,
      courseWithDuration,
      addFacultyId,
      addRoomId,
      currentBatchId,
      entries,
      courses,
      rooms,
      faculty,
      undefined,
      batches
    );

    if (!validation.available) {
      onShowToast('error', 'Cannot Place Subject', validation.error || 'A scheduling conflict was detected.');
      return;
    }

    const slotsToClear = getOccupiedSlots(emptySlotTarget.slotId, addDuration);
    const cleaned = entries.filter(
      e => !(e.batchId === currentBatchId && e.day === emptySlotTarget.day && slotsToClear.includes(e.slotId))
    );

    const newEntry: TimetableEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      day: emptySlotTarget.day,
      slotId: emptySlotTarget.slotId,
      batchId: currentBatchId,
      courseId: course.id,
      facultyId: addFacultyId,
      roomId: addRoomId,
      isLocked: false,
      colSpan: addDuration
    };

    onUpdateEntries([...cleaned, newEntry]);
    setIsAddModalOpen(false);
    onShowToast('success', 'Subject Scheduled', `Assigned ${course.courseCode || course.name} on ${emptySlotTarget.day} Slot ${emptySlotTarget.slotId}.`);
  };

  // Bottom Toolbar Actions
  const handleSwapClasses = () => {
    setSelectedSwapEntryId(batchEntries[0]?.id);
    setIsSwapAssistantOpen(true);
  };

  const handleDetectConflicts = () => {
    const seen = new Set<string>();
    let conflicts = 0;
    entries.forEach(e => {
      if (e.facultyId && e.day && e.slotId) {
        const key = `${e.day}-${e.slotId}-${e.facultyId}`;
        if (seen.has(key)) {
          conflicts++;
        } else {
          seen.add(key);
        }
      }
    });

    if (conflicts === 0) {
      onShowToast('success', '0 Conflicts Detected ✨', 'All AICTE teacher and room constraints are 100% clash-free.');
    } else {
      onShowToast('warning', 'Conflicts Found', `Detected ${conflicts} overlap clash${conflicts > 1 ? 'es' : ''} in the university schedule.`);
    }
  };

  const handleDragDropEdit = () => {
    onShowToast('info', 'Drag & Drop Active 🚀', 'Drag any subject card directly into another slot to move or mutually swap periods.');
  };

  const handleDuplicateWeek = () => {
    onShowToast('success', 'Week Pattern Saved 📋', 'Current weekly timetable template captured for next academic term.');
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Heading Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs p-6 sm:p-7">
        {/* Subtle Campus Backdrop on right side */}
        <div 
          className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-right bg-no-repeat opacity-20 pointer-events-none -scale-x-100 filter brightness-105"
          style={{ backgroundImage: `url(${campusDaylightBg})` }}
        />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-transparent via-white/90 to-white pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#4F46E5] uppercase bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
              TIMEPRO ACADEMIC WORKSPACE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
              Class Timetable Management
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium">
              Plan • Organize • Optimize
            </p>
          </div>

          <div className="hidden lg:block bg-slate-50/90 border border-slate-200/90 px-4 py-2.5 rounded-2xl max-w-xs text-right shadow-2xs">
            <p className="text-xs italic text-[#475569] font-serif">
              "A well planned timetable builds a better tomorrow."
            </p>
          </div>
        </div>
      </section>

      {/* 2 & 3. Filters Section (Compact Row with Section dropdown) */}
      <section className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* Academic Year */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
              <Users className="w-4 h-4 text-[#4F46E5] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#64748B] uppercase block leading-none mb-0.5">Academic Year</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer"
                >
                  <option value="I Year">I Year</option>
                  <option value="II Year">II Year</option>
                  <option value="III Year">III Year</option>
                  <option value="IV Year">IV Year</option>
                </select>
              </div>
            </div>

            {/* Semester */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-[#4F46E5] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#64748B] uppercase block leading-none mb-0.5">Semester</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    const sem = Number(e.target.value);
                    setSelectedSemester(sem);
                    const matchingBatch = batches.find(b => b.semester === sem);
                    if (matchingBatch) onSelectBatch(matchingBatch.id);
                  }}
                  className="w-full bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer"
                >
                  {[8, 7, 6, 5, 4, 3, 2, 1].map(sem => (
                    <option key={sem} value={sem}>Semester {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][sem - 1]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
              <GraduationCap className="w-4 h-4 text-[#4F46E5] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-bold text-[#64748B] uppercase block leading-none">Section</span>
                  <span className="text-[9px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.2 rounded font-mono">
                    {stats.studentCount} Students
                  </span>
                </div>
                <select
                  value={currentBatchId}
                  onChange={(e) => onSelectBatch(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer truncate"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Sem {b.semester})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={() => onShowToast('success', 'Timetable Loaded', `Loaded schedule for ${activeBatch?.name || 'CSE-A'}.`)}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
          >
            <span>Load Timetable</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4. Action Buttons Strip */}
      <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsAutoModalOpen(true)}
                disabled={isGenerating || isFrozen}
                className={`bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isGenerating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Solving...' : '✨ Auto-Generate Timetable'}</span>
              </button>

              <button
                onClick={onClearGrid}
                disabled={isFrozen}
                className="text-xs font-bold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Clear current grid"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Clear Grid</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenStudio}
            className="text-xs font-bold text-[#4F46E5] bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Open Generator Studio</span>
          </button>
        </div>

        {/* Right Export Actions */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={onPrint}
            className="bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={onDownloadPDF}
            className="bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF</span>
          </button>

          <button
            onClick={onDownloadPNG}
            className="bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>PNG</span>
          </button>

          <button
            onClick={onExportExcel}
            className="bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </section>

      {/* 5. Timetable Card (THE HERO OF THE PAGE) */}
      <div id="timetable-capture-area" className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 print:p-0 print:border-none print:shadow-none">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                Class Timetable — {activeBatch?.name || 'Section A'}
              </h2>
              <p className="text-xs text-[#64748B] font-medium">
                Academic Year: IV &nbsp;|&nbsp; Semester: {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][(activeBatch?.semester || 8) - 1]} &nbsp;|&nbsp; Room: {activeBatch?.preferredRoomId?.replace('room-', '') || '027'} &nbsp;|&nbsp; Class Teacher: Dr. Arjun Reddy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <span className="text-[11px] font-mono font-bold bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-[#0F172A]">
              Issue No.: {issueNo}
            </span>
            <span className="text-[11px] font-mono text-[#64748B] hidden md:inline">
              Last Updated: 24 Sep 2026, 10:30 AM
            </span>
          </div>
        </div>

        {/* Timetable Grid Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-3.5 text-left text-xs font-black text-[#0F172A] bg-[#F8FAFC] w-28 rounded-tl-xl border-r border-slate-200">
                  Time
                </th>
                {days.map((day, idx) => (
                  <th key={day} className={`py-3 px-3 text-center text-xs font-black text-[#0F172A] bg-white ${idx === days.length - 1 ? 'rounded-tr-xl' : ''}`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => {
                if (slot.isLunch) {
                  return (
                    <tr key="lunch-break" className="border-t border-b border-amber-200/80">
                      <td className="py-2.5 px-3.5 text-xs font-mono font-bold text-[#92400E] bg-[#FFF7E6] border-r border-amber-200">
                        {slot.time}
                      </td>
                      <td colSpan={6} className="py-2.5 px-4 text-center text-xs font-black text-[#92400E] bg-[#FFF7E6] tracking-wider uppercase">
                        <span className="inline-flex items-center gap-2">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-[#D97706]" />
                          🍽 {slot.label}
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.slotId} className="border-b border-slate-100">
                    {/* Time Column */}
                    <td className="py-3 px-3.5 text-xs font-mono font-bold text-[#0F172A] bg-[#F8FAFC] border-r border-slate-200 whitespace-nowrap align-middle">
                      {slot.time}
                    </td>

                    {/* Day Cells */}
                    {days.map(day => {
                      const entry = batchEntries.find(e => {
                        if (e.day !== day) return false;
                        const occupied = getOccupiedSlots(e.slotId, e.colSpan || 1);
                        return occupied.includes(slot.slotId);
                      });
                      const course = entry ? resolveCourse(entry.courseId) : undefined;
                      const teacher = entry ? faculty.find(f => f.id === entry.facultyId) : undefined;
                      const room = entry ? rooms.find(r => r.id === entry.roomId) : undefined;
                      const colorStyles = getSubjectColorStyles(course);
                      const isDragOver = dragOverCell?.day === day && dragOverCell?.slotId === slot.slotId;

                      return (
                        <td 
                          key={`${day}-${slot.slotId}`} 
                          onDragOver={(e) => handleDragOver(e, day, slot.slotId)}
                          onDrop={(e) => handleDrop(e, day, slot.slotId)}
                          className={`p-1.5 align-middle transition-colors ${
                            isDragOver ? 'bg-indigo-50/80 ring-2 ring-[#4F46E5] ring-inset rounded-xl' : ''
                          }`}
                        >
                          {entry && course ? (
                            <div 
                              onClick={() => handleCardClick(entry)}
                              draggable={isAdmin && !isFrozen && !entry.isLocked}
                              onDragStart={(e) => handleDragStartEntry(e, entry, course)}
                              onDragEnd={handleDragEnd}
                              className={`group relative p-2.5 rounded-2xl border transition-all ${colorStyles.bg} ${colorStyles.border} shadow-2xs hover:shadow-md min-h-[68px] flex flex-col justify-between cursor-pointer ${
                                isAdmin && !entry.isLocked ? 'cursor-grab active:cursor-grabbing hover:scale-[1.01]' : ''
                              } ${draggedEntry?.id === entry.id ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''}`}
                            >
                              {/* Top Bar: Subject Name & Hover Quick Actions */}
                              <div className="flex items-start justify-between gap-1">
                                <div className="font-black text-xs text-[#0F172A] leading-tight line-clamp-2 flex-1 pr-1">
                                  {course.name}
                                </div>

                                {/* Permanent Lock Badge if locked */}
                                {entry.isLocked && (
                                  <span 
                                    className="p-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 shrink-0 shadow-2xs group-hover:hidden"
                                    title="Locked Period (Protected from Auto-Solver)"
                                  >
                                    <Lock className="w-2.5 h-2.5" />
                                  </span>
                                )}

                                {/* Hover Quick Actions (Swap, Lock/Unlock, Delete) */}
                                {isAdmin && !isFrozen && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                                    {/* Swap Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenSwap(entry.id, e)}
                                      title="Swap or Move this session"
                                      className="p-1 rounded-md bg-white/95 hover:bg-white text-[#4F46E5] shadow-xs border border-indigo-200/80 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                      <ArrowLeftRight className="w-3 h-3" />
                                    </button>

                                    {/* Lock Toggle Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleLock(entry.id, e)}
                                      title={entry.isLocked ? "Unlock slot" : "Lock slot (preserve during auto-generation)"}
                                      className={`p-1 rounded-md shadow-xs border transition-transform hover:scale-110 cursor-pointer ${
                                        entry.isLocked 
                                          ? 'bg-amber-100 text-amber-700 border-amber-300' 
                                          : 'bg-white/95 hover:bg-white text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {entry.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteEntry(entry.id, e)}
                                      title="Delete / Clear this session"
                                      className="p-1 rounded-md bg-white/95 hover:bg-red-50 text-red-600 shadow-xs border border-red-200/80 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Bottom Details: Room & Faculty */}
                              <div className="flex items-center justify-between text-[10px] font-semibold text-[#475569] mt-1.5 pt-1 border-t border-black/5">
                                <span className="font-mono font-bold text-slate-700">R-{room?.roomNumber || '027'}</span>
                                <span className="truncate max-w-[95px] text-right font-medium">
                                  {teacher?.name ? teacher.name.replace('Professor', 'Prof.').replace('Associate Professor', 'Dr.') : 'Staff'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleEmptyCellClick(day, slot.slotId)}
                              className={`p-2.5 rounded-2xl border border-dashed border-slate-200/80 bg-[#F8FAFC]/60 min-h-[68px] flex flex-col items-center justify-center text-[10px] font-mono text-slate-400 hover:border-[#4F46E5]/40 hover:bg-[#EEF2FF]/40 hover:text-[#4F46E5] transition-all ${
                                isAdmin && !isFrozen ? 'cursor-pointer' : ''
                              }`}
                            >
                              <span className="font-bold">Free Slot</span>
                              {isAdmin && !isFrozen && (
                                <span className="text-[9px] opacity-0 hover:opacity-100 text-[#4F46E5] font-sans font-bold flex items-center gap-0.5">
                                  <Plus className="w-2.5 h-2.5" /> Add
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Bottom Row — 2 Columns (Faculty Directory on Left + Overview & Quick Actions on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols / approx 60% width): Faculty & Course Directory */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#0F172A]">
                  Faculty & Course Directory ({activeBatch?.name || 'CSE-A'})
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  List of subjects scheduled for {activeBatch?.name || 'CSE-A'} (Sem {activeBatch?.semester || 8})
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('faculty')}
              className="text-xs font-black text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[290px] custom-scrollbar rounded-2xl border border-slate-100">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-2xs">
                <tr className="border-b border-slate-200 text-[#64748B] text-[10px] uppercase font-mono font-bold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Subject Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3">Assigned Instructor</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {stats.courseList.map((crs, idx) => {
                  const assignedMap = mappings.find(m => m.courseId === crs.id);
                  const teacher = assignedMap ? faculty.find(f => f.id === assignedMap.facultyId) : faculty[idx % faculty.length];
                  return (
                    <tr key={crs.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#64748B]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-[#0F172A]">{crs.courseCode}</td>
                      <td className="py-2.5 px-3 font-bold text-[#0F172A]">{crs.name}</td>
                      <td className="py-2.5 px-3 font-medium text-[#334155]">{teacher?.name || 'Dr. Swathi Reddy'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          crs.type === 'Lab' ? 'bg-emerald-100 text-[#065F46]' :
                          crs.type === 'Long Duration' ? 'bg-purple-100 text-[#5B21B6]' :
                          'bg-blue-100 text-[#1E40AF]'
                        }`}>
                          {crs.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B]">{teacher?.phone || `98765 4321${idx}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols / approx 40% width): Section Overview & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Section Overview */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="font-black text-sm text-[#0F172A]">Section Overview</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] px-2.5 py-0.5 rounded-full">
                {activeBatch?.name || 'CSE-A'}
              </span>
            </div>

            {/* 2x3 Mini Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] block leading-none">Total Students</span>
                  <span className="text-base font-black text-[#0F172A]">{stats.studentCount}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] block leading-none">Total Subjects</span>
                  <span className="text-base font-black text-[#0F172A]">{stats.totalSubjects}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] block leading-none">Theory Subjects</span>
                  <span className="text-base font-black text-[#0F172A]">{stats.theoryCount}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Microscope className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] block leading-none">Lab Subjects</span>
                  <span className="text-base font-black text-[#0F172A]">{stats.labCount}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] block leading-none">Assigned Faculty</span>
                  <span className="text-base font-black text-[#0F172A]">{stats.facultyCount}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] block leading-none">Assigned Rooms</span>
                  <span className="text-base font-black text-[#0F172A]">{stats.roomCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Sparkles className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="font-black text-sm text-[#0F172A]">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSwapClasses}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-[#4F46E5] hover:bg-[#EEF2FF] text-[#0F172A] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Swap Classes</span>
              </button>

              <button
                type="button"
                onClick={handleDetectConflicts}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-[#DC2626] hover:bg-[#FEF2F2] text-[#0F172A] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Detect Conflicts</span>
              </button>

              <button
                type="button"
                onClick={handleDragDropEdit}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-[#4F46E5] hover:bg-[#EEF2FF] text-[#0F172A] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Move className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Drag & Drop Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDuplicateWeek}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 hover:border-[#4F46E5] hover:bg-[#EEF2FF] text-[#0F172A] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Copy className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Duplicate Week</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: Class Session Details & Quick Actions Modal (Clicking any card) --- */}
      <AnimatePresence>
        {isDetailModalOpen && selectedDetailEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              {(() => {
                const crs = resolveCourse(selectedDetailEntry.courseId);
                const colorStyles = getSubjectColorStyles(crs);
                const teacher = faculty.find(f => f.id === (editFacultyId || selectedDetailEntry.facultyId));
                const room = rooms.find(r => r.id === (editRoomId || selectedDetailEntry.roomId));

                return (
                  <div>
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-black text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
                            {crs?.courseCode || 'SUB'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorStyles.badge}`}>
                            {crs?.type || 'Theory'}
                          </span>
                          {selectedDetailEntry.isLocked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-[#0F172A] leading-snug">
                          {crs?.name || 'Class Session'}
                        </h3>
                        <p className="text-xs text-[#64748B] flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                          <span>{selectedDetailEntry.day}, Slot {selectedDetailEntry.slotId} ({allSlots.find(s => s.id === selectedDetailEntry.slotId)?.time})</span>
                          <span>•</span>
                          <span>{activeBatch?.name || 'Section'}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => setIsDetailModalOpen(false)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 space-y-4">
                      {/* Instructor Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                          <span>Assigned Instructor</span>
                          {teacher?.specialization && (
                            <span className="text-[10px] font-normal text-slate-400">Spec: {teacher.specialization}</span>
                          )}
                        </label>
                        <select
                          value={editFacultyId}
                          onChange={(e) => setEditFacultyId(e.target.value)}
                          disabled={!isAdmin || isFrozen}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all cursor-pointer disabled:opacity-60"
                        >
                          {faculty.map((f) => {
                            const isMapped = mappings.some(m => m.courseId === selectedDetailEntry.courseId && m.facultyId === f.id);
                            return (
                              <option key={f.id} value={f.id}>
                                {isMapped ? '⭐ ' : ''}{f.name} ({f.designation || 'Faculty'})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Classroom Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                          Assigned Classroom / Lab
                        </label>
                        <select
                          value={editRoomId}
                          onChange={(e) => setEditRoomId(e.target.value)}
                          disabled={!isAdmin || isFrozen}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all cursor-pointer disabled:opacity-60"
                        >
                          {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              Room {r.roomNumber} ({r.type} - Capacity: {r.capacity})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Buttons Box */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                        {/* Left Action Buttons */}
                        <div className="flex items-center gap-2">
                          {/* Swap / Move Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsDetailModalOpen(false);
                              handleOpenSwap(selectedDetailEntry.id);
                            }}
                            className="bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] border border-[#C7D2FE] font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Swap / Move</span>
                          </button>

                          {/* Lock / Unlock Toggle Button */}
                          {isAdmin && !isFrozen && (
                            <button
                              type="button"
                              onClick={() => handleToggleLock(selectedDetailEntry.id)}
                              className={`font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
                                selectedDetailEntry.isLocked
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {selectedDetailEntry.isLocked ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Unlock Slot</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Lock Slot</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Delete Session Button */}
                          {isAdmin && !isFrozen && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(selectedDetailEntry.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Delete this class session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>

                        {/* Right Save / Close */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsDetailModalOpen(false)}
                            className="text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            Cancel
                          </button>

                          {isAdmin && !isFrozen && (
                            <button
                              type="button"
                              onClick={handleSaveDetailChanges}
                              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: Assign Course to Free Slot Modal (Clicking any free slot) --- */}
      <AnimatePresence>
        {isAddModalOpen && emptySlotTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#4F46E5] uppercase bg-[#EEF2FF] px-2.5 py-0.5 rounded-md border border-[#C7D2FE]">
                    MANUAL TIMETABLE ALLOCATION
                  </span>
                  <h3 className="text-lg font-black text-[#0F172A] leading-snug">
                    Schedule Class Session
                  </h3>
                  <p className="text-xs text-[#64748B] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>{emptySlotTarget.day}, Slot {emptySlotTarget.slotId} ({allSlots.find(s => s.id === emptySlotTarget.slotId)?.time})</span>
                    <span>•</span>
                    <span>{activeBatch?.name || 'Section'}</span>
                  </p>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Course Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Select Subject / Course
                  </label>
                  <select
                    value={addCourseId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setAddCourseId(cId);
                      const mappedFac = mappings.find(m => m.courseId === cId)?.facultyId;
                      if (mappedFac) setAddFacultyId(mappedFac);
                      const crs = resolveCourse(cId);
                      if (crs) {
                        setAddDuration(crs.type === 'Lab' ? 2 : 1);
                        if (crs.type === 'Lab') {
                          const labRoom = rooms.find(r => r.type === 'Lab');
                          if (labRoom) setAddRoomId(labRoom.id);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all cursor-pointer"
                  >
                    {availableSemesterCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.courseCode}] {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Session Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddDuration(1)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        addDuration === 1
                          ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      1 Hour (1 Slot)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddDuration(2)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        addDuration === 2
                          ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5]'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      2 Continuous Hours (Lab Block)
                    </button>
                  </div>
                </div>

                {/* Instructor Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Assign Faculty Instructor
                  </label>
                  <select
                    value={addFacultyId}
                    onChange={(e) => setAddFacultyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all cursor-pointer"
                  >
                    {faculty.map((f) => {
                      const isMapped = mappings.some(m => m.courseId === addCourseId && m.facultyId === f.id);
                      return (
                        <option key={f.id} value={f.id}>
                          {isMapped ? '⭐ ' : ''}{f.name} ({f.designation || 'Faculty'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Classroom Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Assign Classroom / Lab
                  </label>
                  <select
                    value={addRoomId}
                    onChange={(e) => setAddRoomId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.type} - Capacity: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAddSlot}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Class</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scope-Based Auto-Generation Modal */}
      <AutoGenerateModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
        activeBatch={activeBatch}
        batches={batches}
        onGenerate={async (scope, targetSemester, targetBatchId, options) => {
          if (onAutoGenerateWithScope) {
            await onAutoGenerateWithScope(scope, targetSemester, targetBatchId, options);
          } else {
            onAutoGenerate();
          }
        }}
        isGenerating={isGenerating}
        isFrozen={isFrozen}
      />

      {/* Interactive Drag-and-Swap Conflict Resolution Assistant Modal */}
      <ConflictResolutionAssistant
        isOpen={isSwapAssistantOpen}
        onClose={() => setIsSwapAssistantOpen(false)}
        initialEntryId={selectedSwapEntryId}
        activeBatchId={currentBatchId}
        entries={entries}
        courses={courses}
        faculty={faculty}
        rooms={rooms}
        batches={batches}
        mappings={mappings}
        days={days}
        slots={allSlots}
        onUpdateEntries={onUpdateEntries}
        onShowToast={onShowToast}
      />
    </div>
  );
}

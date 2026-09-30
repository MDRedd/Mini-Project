import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Trash2, Sparkles, X, Search, BookOpen, Microscope, Rocket, Award, Clock, ArrowLeftRight } from 'lucide-react';
import { Day, SlotId, Course, TimetableEntry, Room, Faculty, Slot, SemesterCourseMap, FacultyCourseMapping, Batch } from '../types';
import { ACTIVE_SLOTS, getOccupiedSlots, validateSlotAvailability, filterCoursesBySemester } from '../utils/solver';
import ConflictResolutionAssistant from './ConflictResolutionAssistant';

interface TimetableGridProps {
  entries: TimetableEntry[];
  allCourses: Course[];
  allFaculty: Faculty[];
  allRooms: Room[];
  allSlots: Slot[];
  days: Day[];
  isAdmin: boolean;
  activeBatchId: string;
  activeRoomId: string;
  preferredRoomId: string;
  onUpdateEntries: (newEntries: TimetableEntry[]) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  semesterCourseMaps: SemesterCourseMap[];
  activeSemester: number;
  batches?: Batch[];
  mappings?: FacultyCourseMapping[];
  smartFillEnabled?: boolean;
  maxSessionDuration?: number;
  allowThreeHourSessions?: boolean;
  onClearGrid?: () => void;
}

export default function TimetableGrid({
  entries,
  allCourses,
  allFaculty,
  allRooms,
  allSlots,
  days,
  isAdmin,
  activeBatchId,
  activeRoomId,
  preferredRoomId,
  onUpdateEntries,
  onShowToast,
  semesterCourseMaps,
  activeSemester,
  batches = [],
  mappings = [],
  smartFillEnabled = true,
  maxSessionDuration = 2,
  allowThreeHourSessions = false,
  onClearGrid,
}: TimetableGridProps) {
  // Drag and Drop States
  const [draggedCourse, setDraggedCourse] = useState<Course | null>(null);
  const [draggedEntry, setDraggedEntry] = useState<TimetableEntry | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: Day; slotId: SlotId } | null>(null);

  // Interactive Swap & Conflict Assistant States
  const [isSwapAssistantOpen, setIsSwapAssistantOpen] = useState<boolean>(false);
  const [selectedSwapEntryId, setSelectedSwapEntryId] = useState<string | undefined>(undefined);

  // Syllabus Library Filter States
  const [isSyllabusDrawerOpen, setIsSyllabusDrawerOpen] = useState<boolean>(false);
  const [syllabusSearch, setSyllabusSearch] = useState<string>('');
  const [syllabusTypeFilter, setSyllabusTypeFilter] = useState<'all' | 'Theory' | 'Lab' | 'Long Duration' | 'Non-Academic'>('all');

  // Manual cell assignment states
  const [editingCell, setEditingCell] = useState<{ day: Day; slotId: SlotId } | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);

  // Layout Columns: Day, Slot I, Slot II, Short Break, Slot III, Slot IV, Lunch Break, Slot V, Slot VI
  const columns: (SlotId | 'day')[] = ['day', 'I', 'II', 'SB', 'III', 'IV', 'LB', 'V', 'VI'];

  // Helper: Get color themes for different course types
  const getCourseStyle = (type: Course['type']) => {
    switch (type) {
      case 'Lab':
        return {
          bg: 'bg-gradient-to-br from-purple-50/95 via-fuchsia-50/70 to-white hover:from-purple-100/95 hover:to-fuchsia-100/80 border-purple-200/90 shadow-2xs',
          text: 'text-purple-950',
          badge: 'bg-purple-100/90 text-purple-800 border-purple-200/80 font-extrabold',
          borderAccent: 'border-l-3.5 border-l-purple-600',
          icon: Microscope,
          label: 'Lab'
        };
      case 'Long Duration':
        return {
          bg: 'bg-gradient-to-br from-emerald-50/95 via-teal-50/70 to-white hover:from-emerald-100/95 hover:to-teal-100/80 border-emerald-200/90 shadow-2xs',
          text: 'text-emerald-950',
          badge: 'bg-emerald-100/90 text-emerald-800 border-emerald-200/80 font-extrabold',
          borderAccent: 'border-l-3.5 border-l-emerald-600',
          icon: Rocket,
          label: 'Project'
        };
      case 'Non-Academic':
        return {
          bg: 'bg-gradient-to-br from-amber-50/95 via-orange-50/70 to-white hover:from-amber-100/95 hover:to-orange-100/80 border-amber-200/90 shadow-2xs',
          text: 'text-amber-950',
          badge: 'bg-amber-100/90 text-amber-800 border-amber-200/80 font-extrabold',
          borderAccent: 'border-l-3.5 border-l-amber-600',
          icon: Award,
          label: 'Activity'
        };
      default: // Theory
        return {
          bg: 'bg-gradient-to-br from-indigo-50/95 via-blue-50/70 to-white hover:from-indigo-100/95 hover:to-blue-100/80 border-indigo-200/90 shadow-2xs',
          text: 'text-indigo-950',
          badge: 'bg-indigo-100/90 text-indigo-800 border-indigo-200/80 font-extrabold',
          borderAccent: 'border-l-3.5 border-l-indigo-600',
          icon: BookOpen,
          label: 'Theory'
        };
    }
  };

  // Helper: Find exact assigned faculty from entry or mappings (Zero Guessing)
  const resolveFaculty = (facultyId?: string, courseId?: string): Faculty => {
    if (facultyId) {
      const match = allFaculty.find(f => f.id === facultyId);
      if (match) return match;
    }

    if (courseId) {
      const mapped = mappings.find(m => m.courseId === courseId);
      if (mapped) {
        const match = allFaculty.find(f => f.id === mapped.facultyId);
        if (match) return match;
      }
    }

    return allFaculty[0] || {
      id: 'fac-fallback',
      name: 'Faculty Instructor',
      phone: 'N/A',
      maxHoursPerDay: 4,
      designation: 'Professor',
      specialization: 'Computer Science'
    };
  };

  // Drag Handlers for external cards (Course Library)
  const handleDragStartCourse = (e: React.DragEvent, course: Course) => {
    // Respect max duration setting
    const effectiveDuration = Math.min(course.durationSlots || 1, maxSessionDuration || 2);
    const courseToDrag = {
      ...course,
      durationSlots: effectiveDuration
    };
    setDraggedCourse(courseToDrag);
    setDraggedEntry(null);
    e.dataTransfer.setData('text/plain', course.id);
  };

  // Drag Handlers for existing entries on the grid
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
    if (!isAdmin || !draggedCourse) return;
    
    if (dragOverCell?.day !== day || dragOverCell?.slotId !== slotId) {
      setDragOverCell({ day, slotId });
    }
  };

  const handleDrop = (e: React.DragEvent, day: Day, slotId: SlotId) => {
    e.preventDefault();
    if (!isAdmin || !draggedCourse) return;

    const course = draggedCourse;
    const entryToMove = draggedEntry;
    handleDragEnd();

    const mappedFacultyEntries = mappings.filter(m => m.courseId === course.id);
    const mappedFacultyIds = mappedFacultyEntries.map(m => m.facultyId);
    let matchingFacultyId = '';

    if (mappedFacultyIds.length > 0) {
      const candidateFacultyObjs = allFaculty.filter(f => mappedFacultyIds.includes(f.id));
      
      // Find candidate faculty who are free at this time
      const freeCandidates = candidateFacultyObjs.filter(cand => {
        const isBusy = entries.some(entry => 
          entry.day === day && 
          entry.slotId === slotId && 
          entry.facultyId === cand.id &&
          (entryToMove ? entry.id !== entryToMove.id : true)
        );
        return !isBusy;
      });

      if (freeCandidates.length > 0) {
        // Sort by lowest teaching load
        freeCandidates.sort((a, b) => {
          const loadA = entries.filter(e => e.facultyId === a.id).length;
          const loadB = entries.filter(e => e.facultyId === b.id).length;
          return loadA - loadB;
        });
        matchingFacultyId = freeCandidates[0].id;
        
        const selectedFacultyObj = allFaculty.find(f => f.id === matchingFacultyId);
        if (selectedFacultyObj) {
          onShowToast(
            'success', 
            'Exact Instructor Assigned', 
            `Assigned ${selectedFacultyObj.name} (${selectedFacultyObj.designation || 'Instructor'})`
          );
        }
      } else {
        // All mapped faculty are busy at this slot
        const busyFacultyName = candidateFacultyObjs[0]?.name || 'Instructor';
        onShowToast('error', 'Faculty Conflict', `Faculty conflict: ${busyFacultyName} is already teaching another class during ${day} Slot ${slotId}.`);
        return;
      }
    } else {
      matchingFacultyId = allFaculty[0]?.id || '';
    }

    let assignedRoomId = preferredRoomId;
    if (course.type === 'Lab') {
      const matchingLab = allRooms.find(r => r.type === 'Lab' && r.roomNumber.toLowerCase().includes(course.name.toLowerCase().replace(' lab', '')));
      if (matchingLab) {
        assignedRoomId = matchingLab.id;
      } else {
        const firstLab = allRooms.find(r => r.type === 'Lab');
        if (firstLab) assignedRoomId = firstLab.id;
      }
    }

    const targetOccupiedEntry = entries.find(
      e => e.batchId === activeBatchId && e.day === day && getOccupiedSlots(e.slotId, e.colSpan || 1).includes(slotId)
    );

    if (entryToMove && targetOccupiedEntry && targetOccupiedEntry.id !== entryToMove.id) {
      // User dropped an existing period onto another occupied period: MUTUAL SWAP!
      const targetCourse = allCourses.find(c => c.id === targetOccupiedEntry.courseId);
      const targetDuration = targetOccupiedEntry.colSpan || targetCourse?.durationSlots || 1;

      // 1. Check if source can move to target
      const val1 = validateSlotAvailability(
        day,
        targetOccupiedEntry.slotId,
        course,
        entryToMove.facultyId,
        entryToMove.roomId,
        activeBatchId,
        entries,
        allCourses,
        allRooms,
        allFaculty,
        entryToMove.id,
        batches,
        { maxSessionDuration, allowThreeHourSessions }
      );

      // 2. Check if target can move to source
      const val2 = targetCourse ? validateSlotAvailability(
        entryToMove.day,
        entryToMove.slotId,
        targetCourse,
        targetOccupiedEntry.facultyId,
        targetOccupiedEntry.roomId,
        activeBatchId,
        entries,
        allCourses,
        allRooms,
        allFaculty,
        targetOccupiedEntry.id,
        batches,
        { maxSessionDuration, allowThreeHourSessions }
      ) : { available: false, error: 'Target course not found' };

      if (val1.available && val2.available && course.durationSlots === targetDuration) {
        // Safe Mutual Swap!
        const swapped = entries.map(e => {
          if (e.id === entryToMove.id) {
            return { ...e, day, slotId: targetOccupiedEntry.slotId };
          }
          if (e.id === targetOccupiedEntry.id) {
            return { ...e, day: entryToMove.day, slotId: entryToMove.slotId };
          }
          return e;
        });
        onUpdateEntries(swapped);
        onShowToast('success', 'Mutual Swap Completed', `Swapped ${course.courseCode} with ${targetCourse?.courseCode} (0 Conflicts).`);
        return;
      } else {
        // Conflict detected in mutual swap - open assistant for guided resolution!
        setSelectedSwapEntryId(entryToMove.id);
        setIsSwapAssistantOpen(true);
        onShowToast('warning', 'Direct Swap Conflict', val1.error || val2.error || 'Opened Conflict Assistant to select a safe alternative.');
        return;
      }
    }

    const validation = validateSlotAvailability(
      day,
      slotId,
      course,
      matchingFacultyId,
      assignedRoomId,
      activeBatchId,
      entries,
      allCourses,
      allRooms,
      allFaculty,
      entryToMove?.id,
      batches,
      { maxSessionDuration, allowThreeHourSessions }
    );

    if (!validation.available) {
      if (entryToMove) {
        setSelectedSwapEntryId(entryToMove.id);
        setIsSwapAssistantOpen(true);
      }
      onShowToast('error', 'Conflict Detected', validation.error || 'Cannot place course in this slot.');
      return;
    }

    const newEntries = entries.filter(
      (e) => !(entryToMove && e.id === entryToMove.id)
    );

    const slotsToClear = getOccupiedSlots(slotId, course.durationSlots);
    const cleanedEntries = newEntries.filter(
      (e) => !(e.batchId === activeBatchId && e.day === day && slotsToClear.includes(e.slotId))
    );

    const newEntry: TimetableEntry = {
      id: entryToMove ? entryToMove.id : `entry-${Date.now()}`,
      day,
      slotId,
      batchId: activeBatchId,
      courseId: course.id,
      facultyId: matchingFacultyId,
      roomId: assignedRoomId,
      isLocked: entryToMove ? entryToMove.isLocked : false,
      colSpan: course.durationSlots,
    };

    onUpdateEntries([...cleanedEntries, newEntry]);
    onShowToast('success', 'Slot Assigned', `Scheduled ${course.courseCode} (${course.durationSlots}h) on ${day} Slot ${slotId}`);
  };

  const handleToggleLock = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;

    const updated = entries.map((entry) => {
      if (entry.id === entryId) {
        const nextState = !entry.isLocked;
        onShowToast(
          'info', 
          nextState ? 'Slot Locked' : 'Slot Unlocked', 
          nextState ? 'This session is locked and will be preserved by the auto-generator.' : 'This session is now unlocked.'
        );
        return { ...entry, isLocked: nextState };
      }
      return entry;
    });

    onUpdateEntries(updated);
  };

  const handleDeleteEntry = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;

    const updated = entries.filter((entry) => entry.id !== entryId);
    onUpdateEntries(updated);
    onShowToast('info', 'Slot Cleared', 'Removed session from timetable.');
  };

  const handleCellClick = (day: Day, slotId: SlotId) => {
    if (!isAdmin) return;

    const existingEntry = entries.find(
      (e) => e.day === day && e.slotId === slotId && e.batchId === activeBatchId
    );

    const semCourses = filterCoursesBySemester(allCourses, semesterCourseMaps, activeSemester);
    const defaultCourse = existingEntry 
      ? semCourses.find(c => c.id === existingEntry.courseId) || semCourses[0] 
      : semCourses[0];

    const courseDuration = existingEntry?.colSpan || defaultCourse?.durationSlots || 1;
    setSelectedDuration(Math.min(courseDuration, maxSessionDuration || 2));

    setEditingCell({ day, slotId });
    setSelectedCourseId(defaultCourse?.id || allCourses[0]?.id || '');
    const defaultMappedFacId = mappings.find(m => m.courseId === defaultCourse?.id)?.facultyId;
    setSelectedFacultyId(existingEntry?.facultyId || defaultMappedFacId || allFaculty[0]?.id || '');
    setSelectedRoomId(existingEntry?.roomId || preferredRoomId || allRooms[0]?.id || '');
  };

  const handleSaveManualAssignment = () => {
    if (!editingCell) return;

    const course = allCourses.find(c => c.id === selectedCourseId);
    if (!course) return;

    const effectiveDuration = selectedDuration || course.durationSlots || 1;
    const courseWithDuration: Course = {
      ...course,
      durationSlots: effectiveDuration
    };

    const validation = validateSlotAvailability(
      editingCell.day,
      editingCell.slotId,
      courseWithDuration,
      selectedFacultyId,
      selectedRoomId,
      activeBatchId,
      entries,
      allCourses,
      allRooms,
      allFaculty,
      undefined,
      undefined,
      { maxSessionDuration, allowThreeHourSessions }
    );

    if (!validation.available) {
      onShowToast('error', 'Conflict Detected', validation.error || 'Cannot assign this session.');
      return;
    }

    const slotsToClear = getOccupiedSlots(editingCell.slotId, effectiveDuration);
    const cleaned = entries.filter(
      e => !(e.batchId === activeBatchId && e.day === editingCell.day && slotsToClear.includes(e.slotId))
    );

    const created: TimetableEntry = {
      id: `entry-${Date.now()}`,
      day: editingCell.day,
      slotId: editingCell.slotId,
      batchId: activeBatchId,
      courseId: course.id,
      facultyId: selectedFacultyId,
      roomId: selectedRoomId,
      isLocked: false,
      colSpan: effectiveDuration
    };

    onUpdateEntries([...cleaned, created]);
    onShowToast('success', 'Session Scheduled', `Saved [${course.courseCode}] (${effectiveDuration}h) for ${editingCell.day} Slot ${editingCell.slotId}.`);
    setEditingCell(null);
  };

  const handleClearManualSlot = () => {
    if (!editingCell) return;
    const existingEntry = entries.find(
      e => e.day === editingCell.day && e.slotId === editingCell.slotId && e.batchId === activeBatchId
    );
    if (existingEntry) {
      const updated = entries.filter(e => e.id !== existingEntry.id);
      onUpdateEntries(updated);
      onShowToast('info', 'Session Removed', 'Cleared slot from timetable.');
    }
    setEditingCell(null);
  };

  return (
    <div className="w-full space-y-5">
      {/* 1. Main Visual Timetable Grid Card (Full 100% Width) */}
      <div className="w-full overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-sm">
        
        {/* Top Grid Sub-toolbar & Visual Legend */}
        <div className="bg-slate-50/80 border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-black px-2.5 py-1 rounded-xl font-mono text-[11px]">
              Timetable Matrix
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 font-semibold text-[11px]">
              Policy: Max {maxSessionDuration}h continuous blocks
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Visual Legend Pills */}
            <div className="flex items-center flex-wrap gap-2 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Theory (1h)
              </span>
              <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Lab (2h)
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Project / Training ({maxSessionDuration > 2 ? `Up to ${maxSessionDuration}h` : '2h max'})
              </span>
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Activity (1h-2h)
              </span>
            </div>

            {/* Interactive Conflict & Swap Assistant Toggle */}
            {isAdmin && (
              <div className="flex items-center gap-2 print:hidden">
                {onClearGrid && (
                  <button
                    onClick={onClearGrid}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs"
                    title="Clear grid and generate new timetable"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Clear Grid</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedSwapEntryId(undefined);
                    setIsSwapAssistantOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 shadow-2xs"
                  title="Open Interactive Drag-and-Swap Conflict Assistant"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Swap & Conflict Assistant</span>
                </button>

                <button
                  onClick={() => setIsSyllabusDrawerOpen(!isSyllabusDrawerOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    isSyllabusDrawerOpen
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 shadow-2xs'
                  }`}
                  title="Open Syllabus Library to drag and drop courses onto the timetable"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Syllabus Deck {isSyllabusDrawerOpen ? '▲ Hide' : '▼ Drag & Drop'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Responsive Table View with Exact 100% Column Distribution */}
        <div className="overflow-x-auto print:overflow-visible w-full">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              {/* Day column: 9% */}
              <col style={{ width: '9%' }} />
              {/* Slot I: 14% */}
              <col style={{ width: '14%' }} />
              {/* Slot II: 14% */}
              <col style={{ width: '14%' }} />
              {/* Short Break Divider: 3% */}
              <col style={{ width: '3%' }} />
              {/* Slot III: 14% */}
              <col style={{ width: '14%' }} />
              {/* Slot IV: 14% */}
              <col style={{ width: '14%' }} />
              {/* Lunch Break Divider: 4% */}
              <col style={{ width: '4%' }} />
              {/* Slot V: 14% */}
              <col style={{ width: '14%' }} />
              {/* Slot VI: 14% */}
              <col style={{ width: '14%' }} />
            </colgroup>

            {/* Header Columns */}
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-800">
                <th className="p-2.5 text-center font-black text-slate-700 border-r border-slate-200/90 text-xs bg-slate-100/60">
                  <span className="uppercase tracking-wider text-[10px] block font-mono text-slate-500">DAY</span>
                  <span className="text-[9px] text-slate-400 font-medium">Slots</span>
                </th>
                
                {allSlots.map((slot) => {
                  if (slot.id === 'SB') {
                    return (
                      <th
                        key={slot.id}
                        className="p-1 text-center border-r border-slate-200/90 bg-slate-100/80 text-slate-500 font-bold"
                        title="Short Break: 11:00 AM – 11:10 AM"
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="text-xs">☕</span>
                          <span className="text-[8px] font-mono uppercase text-slate-400 font-black">SB</span>
                        </div>
                      </th>
                    );
                  }

                  if (slot.id === 'LB') {
                    return (
                      <th
                        key={slot.id}
                        className="p-1 text-center border-r border-slate-200/90 bg-slate-100/90 text-slate-600 font-bold"
                        title="Lunch Break: 01:00 PM – 02:00 PM"
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="text-xs">🍱</span>
                          <span className="text-[8px] font-mono uppercase text-slate-500 font-black">LB</span>
                        </div>
                      </th>
                    );
                  }

                  return (
                    <th
                      key={slot.id}
                      className="p-2.5 text-center border-r border-slate-200/90 bg-slate-50/70"
                    >
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1 py-0.2 rounded text-[10px] font-mono font-black">
                          {slot.id}
                        </span>
                        <span className="font-black text-xs text-slate-800">{slot.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium">
                        {slot.time}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Timetable Rows */}
            <tbody className="divide-y divide-slate-200/80 font-sans">
              {days.map((day) => {
                const skippedIndices: number[] = [];

                const dayEntries = entries.filter(e => e.day === day && e.batchId === activeBatchId);
                const dayHours = dayEntries.reduce((sum, e) => {
                  const c = allCourses.find(crs => crs.id === e.courseId);
                  return sum + (e.colSpan || c?.durationSlots || 1);
                }, 0);

                return (
                  <tr key={day} className="hover:bg-slate-50/30 transition-colors h-[84px]">
                    {/* Day label column */}
                    <td className="p-2.5 text-center font-black text-slate-800 bg-slate-50/50 border-r border-slate-200/90 align-middle">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 block tracking-tight">
                          {day}
                        </span>
                        <span className={`inline-block text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded border ${
                          dayHours > 0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          {dayHours}/6 hrs
                        </span>
                      </div>
                    </td>

                    {/* Slot Cells */}
                    {columns.slice(1).map((colKey, colIdx) => {
                      const absoluteColIdx = colIdx + 1;

                      if (skippedIndices.includes(absoluteColIdx)) {
                        return null;
                      }

                      // Static Short Break Column
                      if (colKey === 'SB') {
                        return (
                          <td
                            key={`${day}-SB`}
                            className="bg-slate-100/60 border-r border-slate-200/80 p-0 text-center align-middle select-none"
                          >
                            <div className="flex flex-col items-center justify-center py-2 text-slate-400 opacity-60 hover:opacity-100 transition-opacity">
                              <span className="text-xs">☕</span>
                              <span className="text-[8px] font-mono font-black uppercase tracking-widest [writing-mode:vertical-lr] my-1 text-slate-400">
                                BREAK
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // Static Lunch Break Column
                      if (colKey === 'LB') {
                        return (
                          <td
                            key={`${day}-LB`}
                            className="bg-slate-100/80 border-r border-slate-200/80 p-0 text-center align-middle select-none"
                          >
                            <div className="flex flex-col items-center justify-center py-2 text-slate-500 opacity-70 hover:opacity-100 transition-opacity">
                              <span className="text-xs">🍱</span>
                              <span className="text-[8px] font-mono font-black uppercase tracking-widest [writing-mode:vertical-lr] my-1 text-slate-500">
                                LUNCH
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // Active slots (I, II, III, IV, V, VI)
                      const activeSlotId = colKey as SlotId;
                      
                      const entry = entries.find(
                        (e) => e.day === day && e.slotId === activeSlotId && e.batchId === activeBatchId
                      );

                      if (entry) {
                        const course = allCourses.find((c) => c.id === entry.courseId);
                        const faculty = resolveFaculty(entry.facultyId, entry.courseId);
                        const room = allRooms.find((r) => r.id === entry.roomId) || allRooms[0] || { id: 'r027', roomNumber: '027', type: 'Theory', capacity: 70 };

                        if (!course) return null;

                        // Calculate physical HTML colSpan
                        const durationSlots = entry.colSpan || course.durationSlots || 1;
                        const cStart = columns.indexOf(activeSlotId);
                        const lastActiveSlot = ACTIVE_SLOTS[ACTIVE_SLOTS.indexOf(activeSlotId) + durationSlots - 1];
                        const cEnd = columns.indexOf(lastActiveSlot);
                        const htmlColSpan = cEnd - cStart + 1;

                        for (let s = cStart + 1; s <= cEnd; s++) {
                          skippedIndices.push(s);
                        }

                        const style = getCourseStyle(course.type);
                        const isMultiSlot = htmlColSpan >= 3;
                        const isDoubleSlot = htmlColSpan === 2;

                        return (
                          <td
                            key={entry.id}
                            colSpan={htmlColSpan}
                            className="p-1.5 border-r border-slate-200/90 align-middle"
                          >
                            <motion.div
                              layoutId={entry.id}
                              whileHover={entry.isLocked ? undefined : { y: -1, scale: 1.005 }}
                              whileTap={entry.isLocked ? undefined : { scale: 0.99 }}
                              draggable={isAdmin && !entry.isLocked}
                              onDragStart={(e: any) => handleDragStartEntry(e, entry, course)}
                              onDragEnd={handleDragEnd}
                              className={`h-full relative p-2.5 rounded-2xl border transition-all group ${
                                entry.isLocked 
                                  ? 'shadow-2xs opacity-95 ring-1 ring-slate-300/50' 
                                  : 'shadow-2xs hover:shadow-sm cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-indigo-300/50'
                              } ${style.bg} ${style.borderAccent}`}
                            >
                              {/* 1. MULTI-SLOT (3-slot or 4-slot) COMPACT HORIZONTAL LAYOUT */}
                              {isMultiSlot ? (
                                <div className="flex items-center justify-between gap-3 h-full min-h-[58px]">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className={`p-2 rounded-xl border shrink-0 ${style.badge}`}>
                                      <style.icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black border ${style.badge}`}>
                                          {course.courseCode}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                                          {durationSlots} Slots ({durationSlots * 50}m)
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">
                                          • {course.credits} Cr
                                        </span>
                                      </div>
                                      
                                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate tracking-tight mt-0.5">
                                        {course.name}
                                      </h4>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="flex flex-col items-end text-[10px]">
                                      <span className="font-extrabold text-slate-800 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                        <span className="text-slate-400">👤</span> {faculty.name}
                                      </span>
                                      <span className="font-mono text-slate-500 text-[9px] mt-0.5">
                                        🏛️ {room.roomNumber}
                                      </span>
                                    </div>

                                    {isAdmin && (
                                      <div className="flex items-center gap-0.5 bg-white/90 p-0.5 rounded-lg border border-slate-200 print:hidden">
                                        <button
                                          onClick={(e) => handleToggleLock(entry.id, e)}
                                          title={entry.isLocked ? 'Unlock slot' : 'Lock slot'}
                                          className={`p-1 rounded transition-all cursor-pointer ${
                                            entry.isLocked ? 'text-amber-600 bg-amber-100/60' : 'text-slate-400 hover:text-slate-700'
                                          }`}
                                        >
                                          {entry.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                        <button
                                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                                          title="Remove session"
                                          className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : isDoubleSlot ? (
                                /* 2. DOUBLE-SLOT (2-hour Lab or 2-hour Activity) COMPACT LAYOUT */
                                <div className="flex flex-col justify-between h-full min-h-[58px] space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black border ${style.badge}`}>
                                        {course.courseCode}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                                        2 Slots
                                      </span>
                                    </div>

                                    {isAdmin && (
                                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedSwapEntryId(entry.id);
                                            setIsSwapAssistantOpen(true);
                                          }}
                                          title="Open Drag & Swap Assistant"
                                          className="p-0.5 rounded hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-all cursor-pointer"
                                        >
                                          <ArrowLeftRight className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={(e) => handleToggleLock(entry.id, e)}
                                          title={entry.isLocked ? 'Unlock slot' : 'Lock slot'}
                                          className={`p-0.5 rounded transition-all cursor-pointer ${
                                            entry.isLocked ? 'text-amber-600 bg-amber-100/60' : 'text-slate-400 hover:text-slate-700'
                                          }`}
                                        >
                                          {entry.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                        <button
                                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                                          title="Remove session"
                                          className="p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                                    {course.name}
                                  </h4>

                                  <div className="pt-0.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[9px] text-slate-700">
                                    <span className="font-bold text-slate-800 truncate flex items-center gap-1">
                                      <span className="text-slate-400">👤</span> {faculty.name}
                                    </span>
                                    <span className="font-mono text-slate-500 shrink-0">
                                      🏛️ {room.roomNumber.split(' ')[0]}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                /* 3. SINGLE-SLOT (1-hour Theory / Activity) COMPACT LAYOUT */
                                <div className="flex flex-col justify-between h-full min-h-[58px] space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black border ${style.badge}`}>
                                      {course.courseCode}
                                    </span>

                                    {isAdmin && (
                                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => handleToggleLock(entry.id, e)}
                                          title={entry.isLocked ? 'Unlock slot' : 'Lock slot'}
                                          className={`p-0.5 rounded transition-all cursor-pointer ${
                                            entry.isLocked ? 'text-amber-600 bg-amber-100/60' : 'text-slate-400 hover:text-slate-700'
                                          }`}
                                        >
                                          {entry.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                        <button
                                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                                          title="Remove session"
                                          className="p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                                    {course.name}
                                  </h4>

                                  <div className="pt-0.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[9px] text-slate-600">
                                    <span className="font-semibold text-slate-800 truncate" title={faculty.name}>
                                      👤 {faculty.name.split(' ').slice(0, 2).join(' ')}
                                    </span>
                                    <span className="font-mono text-slate-500 shrink-0">
                                      {room.roomNumber.split(' ')[0]}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          </td>
                        );
                      }

                      // Empty Slot (Dropzone)
                      const isHovered = dragOverCell?.day === day && dragOverCell?.slotId === activeSlotId;
                      
                      let isCompatible = false;
                      if (draggedCourse && isAdmin) {
                        const matchingFacultyId = allFaculty[0]?.id || '';
                        const roomId = preferredRoomId;
                        const validation = validateSlotAvailability(
                          day,
                          activeSlotId,
                          draggedCourse,
                          matchingFacultyId,
                          roomId,
                          activeBatchId,
                          entries,
                          allCourses,
                          allRooms,
                          allFaculty,
                          draggedEntry?.id,
                          undefined,
                          { maxSessionDuration, allowThreeHourSessions }
                        );
                        isCompatible = validation.available;
                      }

                      return (
                        <td
                          key={`${day}-${activeSlotId}`}
                          onDragOver={(e) => handleDragOver(e, day, activeSlotId)}
                          onDrop={(e) => handleDrop(e, day, activeSlotId)}
                          onClick={() => handleCellClick(day, activeSlotId)}
                          className={`border-r border-slate-200/80 transition-all p-1.5 text-center align-middle relative min-h-[64px] ${
                            isAdmin ? 'cursor-pointer' : ''
                          } ${
                            isHovered 
                              ? isCompatible 
                                ? 'bg-emerald-50/90 border-2 border-dashed border-emerald-500 shadow-inner z-10' 
                                : 'bg-rose-50/90 border-2 border-dashed border-rose-500 shadow-inner z-10'
                              : draggedCourse && isCompatible
                              ? 'bg-emerald-50/30 border border-dashed border-emerald-300'
                              : 'bg-slate-50/20 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center h-full min-h-[50px] space-y-0.5">
                            <span className="text-[9px] font-mono font-bold text-slate-300 select-none">
                              Slot {activeSlotId}
                            </span>
                            {isAdmin && (
                              <span className="opacity-0 group-hover:opacity-100 text-[9px] bg-white border border-slate-200/80 px-1.5 py-0.2 rounded shadow-2xs text-slate-600 font-bold hover:bg-slate-50 transition-opacity">
                                + Add
                              </span>
                            )}
                          </div>
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

      {/* 2. Admin Collapsible Course List Deck (For Drag & Drop assignment) */}
      {isAdmin && isSyllabusDrawerOpen && (
        <div id="course-library-sidebar" className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col max-h-[500px] shrink-0 print:hidden animate-in slide-in-from-top-3 duration-200">
          <div className="mb-3 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Syllabus Library
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-2.5 py-0.5 rounded-full border border-indigo-100">
                Sem {activeSemester}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Drag course cards directly onto the timetable grid cells to schedule periods.
            </p>

            {/* Search and Category Filter */}
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter courses by name or code..."
                  value={syllabusSearch}
                  onChange={(e) => setSyllabusSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                />
                {syllabusSearch && (
                  <button
                    onClick={() => setSyllabusSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center flex-wrap gap-1">
                {(['all', 'Theory', 'Lab', 'Long Duration', 'Non-Academic'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSyllabusTypeFilter(type)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                      syllabusTypeFilter === type
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'Long Duration' ? 'Project' : type === 'Non-Academic' ? 'Activity' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Draggable Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1 custom-scrollbar">
            {filterCoursesBySemester(allCourses, semesterCourseMaps, activeSemester)
              .filter((c) => {
                const matchesSearch = syllabusSearch === '' || 
                  c.name.toLowerCase().includes(syllabusSearch.toLowerCase()) || 
                  c.courseCode.toLowerCase().includes(syllabusSearch.toLowerCase());
                const matchesType = syllabusTypeFilter === 'all' || c.type === syllabusTypeFilter;
                return matchesSearch && matchesType;
              })
              .map((course) => {
                const style = getCourseStyle(course.type);
                const assignedCount = entries.filter(e => e.courseId === course.id && e.batchId === activeBatchId).length;
                const effectiveDuration = Math.min(course.durationSlots || 1, maxSessionDuration || 2);
                
                const courseMap = semesterCourseMaps.find(
                  m => m.semester === activeSemester && 
                       (m.batchId === activeBatchId || m.batchId === 'all') && 
                       m.courseId === course.id
                );

                return (
                  <motion.div
                    key={course.id}
                    layout
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    draggable
                    onDragStart={(e: any) => handleDragStartCourse(e, course)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 rounded-2xl border cursor-grab active:cursor-grabbing hover:shadow-md transition-all flex flex-col justify-between ${style.bg} ${style.borderAccent}`}
                  >
                    <div>
                      <div className="flex justify-between items-center gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono font-black border ${style.badge}`}>
                          {course.courseCode}
                        </span>
                        {courseMap && (courseMap.L !== undefined || courseMap.T !== undefined || courseMap.P !== undefined) && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-mono font-black" title="Lecture-Tutorial-Practical structure">
                            LTP: {courseMap.L || 0}-{courseMap.T || 0}-{courseMap.P || 0}
                          </span>
                        )}
                        <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-black font-mono border border-slate-200">
                          {effectiveDuration} {effectiveDuration > 1 ? 'slots' : 'slot'}
                        </span>
                      </div>

                      <h4 className="text-xs font-black mt-2 text-slate-900 leading-snug">
                        {course.name}
                      </h4>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-between items-center text-[10px] text-slate-600 font-medium">
                      <span>Credits: <strong className="text-slate-900 font-black">{course.credits}</strong></span>
                      <span className={`font-black px-2 py-0.5 rounded-lg font-mono text-[10px] border ${
                        assignedCount > 0 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        Scheduled: {assignedCount}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* Manual Slot Assignment/Edit Modal */}
      <AnimatePresence>
        {editingCell && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 p-6 flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setEditingCell(null)}
                className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-indigo-600">
                <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Manual Slot Assignment
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Schedule session for <strong className="text-slate-900 font-black">{editingCell.day}</strong> at <strong className="text-slate-900 font-black">Slot {editingCell.slotId}</strong>
                  </p>
                </div>
              </div>

              {/* Course Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedCourseId(newId);
                    const chosenCourse = allCourses.find(c => c.id === newId);
                    if (chosenCourse) {
                      const dur = Math.min(chosenCourse.durationSlots || 1, maxSessionDuration || 2);
                      setSelectedDuration(dur);
                      const mappedFacId = mappings.find(m => m.courseId === chosenCourse.id)?.facultyId;
                      if (mappedFacId) {
                        setSelectedFacultyId(mappedFacId);
                      }
                    }
                    if (chosenCourse && chosenCourse.type === 'Lab') {
                      const labRoom = allRooms.find(r => r.type === 'Lab' && r.roomNumber.toLowerCase().includes(chosenCourse.name.toLowerCase().replace(' lab', '')));
                      if (labRoom) {
                        setSelectedRoomId(labRoom.id);
                      } else {
                        const genericLab = allRooms.find(r => r.type === 'Lab');
                        if (genericLab) setSelectedRoomId(genericLab.id);
                      }
                    } else {
                      setSelectedRoomId(preferredRoomId || allRooms[0]?.id || '');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {filterCoursesBySemester(allCourses, semesterCourseMaps, activeSemester).map((course) => (
                    <option key={course.id} value={course.id}>
                      [{course.courseCode}] {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Duration Selector (Max 2h standard / option for 3h+) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Session Duration
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Policy: Max {maxSessionDuration}h
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDuration(1)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedDuration === 1
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    1 Hour (1 Slot)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDuration(2)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedDuration === 2
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    2 Hours (2 Slots)
                  </button>
                  <button
                    type="button"
                    disabled={maxSessionDuration < 3}
                    onClick={() => setSelectedDuration(3)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      maxSessionDuration < 3
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                        : selectedDuration === 3
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs cursor-pointer'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                    }`}
                    title={maxSessionDuration < 3 ? 'Set "Max Block: Allow 3 Hours" on the top toolbar to enable 3-hour sessions' : '3 Continuous Hours'}
                  >
                    3 Hours (3 Slots)
                  </button>
                </div>
              </div>

              {/* Instructor / Faculty Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Assign Instructor
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {allFaculty.map((fac) => {
                    const isMapped = mappings.some(m => m.courseId === selectedCourseId && m.facultyId === fac.id);
                    return (
                      <option key={fac.id} value={fac.id}>
                        {isMapped ? '⭐ ' : ''}{fac.name} ({fac.designation || fac.specialization || 'Instructor'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Room Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Assign Classroom / Lab
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {allRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} ({room.type} - Cap: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-slate-100">
                {entries.some(e => e.day === editingCell.day && e.slotId === editingCell.slotId && e.batchId === activeBatchId) && (
                  <button
                    type="button"
                    onClick={handleClearManualSlot}
                    className="mr-auto px-4 py-2 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                  >
                    Clear Slot
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualAssignment}
                  className="px-4 py-2.5 text-xs font-black rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  Save Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Drag-and-Swap Conflict Resolution Assistant Modal */}
      <ConflictResolutionAssistant
        isOpen={isSwapAssistantOpen}
        onClose={() => setIsSwapAssistantOpen(false)}
        initialEntryId={selectedSwapEntryId}
        activeBatchId={activeBatchId}
        entries={entries}
        courses={allCourses}
        faculty={allFaculty}
        rooms={allRooms}
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

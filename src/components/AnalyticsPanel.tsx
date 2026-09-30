import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  BookOpen, 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Award,
  Search,
  Zap,
  AlertCircle,
  Cpu,
  Wrench,
  Terminal,
  Copy,
  Check,
  RotateCcw,
  Play,
  Filter,
  Warehouse
} from 'lucide-react';
import { TimetableEntry, Batch, Course, Faculty, Room, SemesterCourseMap, FacultyCourseMapping } from '../types';
import { SEMESTER_SYLLABUS_REGISTRY } from '../data/syllabusData';
import { calculateClassroomUtilization } from '../utils/classroomUtilization';
import { 
  ACTIVE_SLOTS, 
  getOccupiedSlots, 
  SolverLog, 
  generateTimetableForBatch, 
  resolveOverlapConflicts,
  validateAll24Constraints,
  ConstraintAuditItem
} from '../utils/solver';

interface AnalyticsPanelProps {
  entries: TimetableEntry[];
  batches: Batch[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
  activeBatchId: string;
  activeSemester: number;
  semesterCourseMaps: SemesterCourseMap[];
  solverLogs?: SolverLog[];
  mappings?: FacultyCourseMapping[];
  onUpdateEntries?: (newEntries: TimetableEntry[]) => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export default function AnalyticsPanel({
  entries,
  batches,
  courses,
  faculty,
  rooms,
  activeBatchId,
  activeSemester,
  semesterCourseMaps,
  solverLogs = [],
  mappings = [],
  onUpdateEntries,
  onShowToast,
}: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<'batch' | 'conflicts' | 'workload' | 'diagnostics' | 'logs' | 'constraints' | 'utilization'>('batch');
  const [constraintFilter, setConstraintFilter] = useState<'all' | 'passed' | 'warning' | 'violation'>('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'Theory' | 'Lab'>('all');
  const [liveLogs, setLiveLogs] = useState<SolverLog[]>(solverLogs);
  const [logFilter, setLogFilter] = useState<'all' | 'mrv' | 'placed' | 'backtrack' | 'relaxation' | 'conflict'>('all');
  const [logSearch, setLogSearch] = useState<string>('');
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [isGeneratingLog, setIsGeneratingLog] = useState<boolean>(false);

  const auditItems = validateAll24Constraints(entries, batches, courses, faculty, rooms, semesterCourseMaps, mappings);
  const passedRulesCount = auditItems.filter(a => a.status === 'passed').length;
  const classroomUtilization = calculateClassroomUtilization(rooms, entries, courses, batches);

  // Sync if props update and state is empty
  React.useEffect(() => {
    if (solverLogs.length > 0 && liveLogs.length === 0) {
      setLiveLogs(solverLogs);
    }
  }, [solverLogs]);

  const activeBatch = batches.find(b => b.id === activeBatchId);
  const activeBatchEntries = entries.filter(e => e.batchId === activeBatchId);

  // --- 1. BATCH STATS CALCULATION ---
  // Get active batch's syllabus courses from registry
  const syllabusCourses = SEMESTER_SYLLABUS_REGISTRY[activeSemester] || [];
  const totalSyllabusCredits = syllabusCourses.reduce((sum, rc) => {
    // try to match with real course in system
    const matchedCourse = courses.find(c => c.courseCode === rc.code);
    return sum + (matchedCourse?.credits || (rc.type === 'Theory' ? 3 : 1.5));
  }, 0);

  // Target hours from registry periodsPerWeek
  const targetPeriodsPerWeek = syllabusCourses.reduce((sum, rc) => sum + rc.periodsPerWeek, 0);

  // Calculate actually scheduled periods (slots)
  const scheduledPeriods = activeBatchEntries.reduce((sum, entry) => {
    const course = courses.find(c => c.id === entry.courseId);
    return sum + (course?.durationSlots || 1);
  }, 0);

  // Calculate unique courses scheduled
  const scheduledCourseIds = Array.from(new Set(activeBatchEntries.map(e => e.courseId)));
  const scheduledUniqueCourses = scheduledCourseIds.map(cid => courses.find(c => c.id === cid)).filter(Boolean) as Course[];
  const scheduledCredits = scheduledUniqueCourses.reduce((sum, c) => sum + c.credits, 0);

  // Class utilization
  const totalWeeklyPossibleSlots = 6 * 6; // 6 days * 6 slots (I, II, III, IV, V, VI)
  const slotUtilizationRate = totalWeeklyPossibleSlots > 0 
    ? Math.round((scheduledPeriods / totalWeeklyPossibleSlots) * 100) 
    : 0;

  // --- 2. GLOBAL CONFLICTS & OVERLAPS CHECKER ---
  interface ConflictInfo {
    id: string;
    type: 'faculty' | 'room';
    day: string;
    slotId: string;
    targetName: string;
    batchA: string;
    batchB: string;
    courseA: string;
    courseB: string;
  }

  const conflicts: ConflictInfo[] = [];

  // Track slot occupancy to find overlaps across all entries in system
  const occupancyMap: {
    [key: string]: {
      facultyId: string;
      roomId: string;
      batchId: string;
      courseId: string;
      entry: TimetableEntry;
    }[];
  } = {};

  entries.forEach(entry => {
    const course = courses.find(c => c.id === entry.courseId);
    if (!course) return;

    const slots = getOccupiedSlots(entry.slotId, course.durationSlots);
    slots.forEach(slotId => {
      const key = `${entry.day}-${slotId}`;
      if (!occupancyMap[key]) {
        occupancyMap[key] = [];
      }
      occupancyMap[key].push({
        facultyId: entry.facultyId,
        roomId: entry.roomId,
        batchId: entry.batchId,
        courseId: entry.courseId,
        entry
      });
    });
  });

  // Analyze occupancy map for conflicts
  Object.entries(occupancyMap).forEach(([key, items]) => {
    const [day, slotId] = key.split('-');

    // Check Faculty Overlaps
    const facultyGroups: { [facId: string]: typeof items } = {};
    items.forEach(item => {
      if (!facultyGroups[item.facultyId]) facultyGroups[item.facultyId] = [];
      facultyGroups[item.facultyId].push(item);
    });

    Object.entries(facultyGroups).forEach(([facId, group]) => {
      if (group.length > 1) {
        // Double booking of faculty!
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            if (group[i].batchId !== group[j].batchId) {
              const facName = faculty.find(f => f.id === facId)?.name || 'Unknown Faculty';
              const batchAName = batches.find(b => b.id === group[i].batchId)?.name || 'Batch A';
              const batchBName = batches.find(b => b.id === group[j].batchId)?.name || 'Batch B';
              const courseAName = courses.find(c => c.id === group[i].courseId)?.name || 'Course A';
              const courseBName = courses.find(c => c.id === group[j].courseId)?.name || 'Course B';

              conflicts.push({
                id: `fac-${facId}-${day}-${slotId}-${group[i].batchId}-${group[j].batchId}`,
                type: 'faculty',
                day,
                slotId,
                targetName: facName,
                batchA: batchAName,
                batchB: batchBName,
                courseA: courseAName,
                courseB: courseBName
              });
            }
          }
        }
      }
    });

    // Check Room Overlaps
    const roomGroups: { [roomId: string]: typeof items } = {};
    items.forEach(item => {
      if (!roomGroups[item.roomId]) roomGroups[item.roomId] = [];
      roomGroups[item.roomId].push(item);
    });

    Object.entries(roomGroups).forEach(([rmId, group]) => {
      if (group.length > 1) {
        // Double booking of room!
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            if (group[i].batchId !== group[j].batchId) {
              const roomNum = rooms.find(r => r.id === rmId)?.roomNumber || 'Unknown Room';
              const batchAName = batches.find(b => b.id === group[i].batchId)?.name || 'Batch A';
              const batchBName = batches.find(b => b.id === group[j].batchId)?.name || 'Batch B';
              const courseAName = courses.find(c => c.id === group[i].courseId)?.name || 'Course A';
              const courseBName = courses.find(c => c.id === group[j].courseId)?.name || 'Course B';

              conflicts.push({
                id: `rm-${rmId}-${day}-${slotId}-${group[i].batchId}-${group[j].batchId}`,
                type: 'room',
                day,
                slotId,
                targetName: `Room ${roomNum}`,
                batchA: batchAName,
                batchB: batchBName,
                courseA: courseAName,
                courseB: courseBName
              });
            }
          }
        }
      }
    });

    // Check Batch Double Booking Overlaps
    const batchGroups: { [batchId: string]: typeof items } = {};
    items.forEach(item => {
      if (!batchGroups[item.batchId]) batchGroups[item.batchId] = [];
      batchGroups[item.batchId].push(item);
    });

    Object.entries(batchGroups).forEach(([bId, group]) => {
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const batchName = batches.find(b => b.id === bId)?.name || 'Batch';
            const courseAName = courses.find(c => c.id === group[i].courseId)?.name || 'Course A';
            const courseBName = courses.find(c => c.id === group[j].courseId)?.name || 'Course B';

            conflicts.push({
              id: `batch-${bId}-${day}-${slotId}-${group[i].courseId}-${group[j].courseId}`,
              type: 'room',
              day,
              slotId,
              targetName: `Batch ${batchName}`,
              batchA: batchName,
              batchB: batchName,
              courseA: courseAName,
              courseB: courseBName
            });
          }
        }
      }
    });
  });

  // Deduplicate conflicts
  const uniqueConflictsMap: { [key: string]: ConflictInfo } = {};
  conflicts.forEach(c => {
    uniqueConflictsMap[c.id] = c;
  });
  const uniqueConflicts = Object.values(uniqueConflictsMap);

  // --- 3. FACULTY WORKLOAD CALCULATION ---
  const facultyWorkloads = faculty.map(f => {
    // Count total hours scheduled for this faculty across all batches
    const facEntries = entries.filter(e => e.facultyId === f.id);
    const assignedPeriods = facEntries.reduce((sum, e) => {
      const course = courses.find(c => c.id === e.courseId);
      return sum + (course?.durationSlots || 1);
    }, 0);

    return {
      id: f.id,
      name: f.name,
      designation: f.designation || 'Instructor',
      specialization: f.specialization || 'N/A',
      assignedPeriods,
      maxRecommended: 16, // typical standard load limits
    };
  }).filter(fw => fw.assignedPeriods > 0)
    .sort((a, b) => b.assignedPeriods - a.assignedPeriods);

  // --- 4. BOTTLENECK DIAGNOSTICS CALCULATION ---
  interface CourseDiagnostic {
    code: string;
    name: string;
    required: number;
    scheduled: number;
    deficit: number;
    facultyName: string;
    facultyTotalLoad: number;
    roomName: string;
    roomOccupancyPct: number;
    bottleneckType: 'Faculty Overload' | 'Room Congestion' | 'Slot Constraint' | 'Optimal';
    explanation: string;
    recommendation: string;
  }

  const courseDiagnostics: CourseDiagnostic[] = syllabusCourses.map(rc => {
    const matchedCourse = courses.find(c => c.courseCode === rc.code || c.name.toLowerCase() === rc.name.toLowerCase());
    const courseId = matchedCourse?.id || '';
    
    // Scheduled hours in active batch
    const scheduledEntries = activeBatchEntries.filter(e => e.courseId === courseId || (matchedCourse && e.courseId === matchedCourse.id));
    const scheduledHours = scheduledEntries.reduce((sum, e) => sum + (e.colSpan || 1), 0);
    const requiredHours = rc.periodsPerWeek;
    const deficit = Math.max(0, requiredHours - scheduledHours);

    // Mapped faculty
    const facultyIdFromEntry = entries.find(e => e.courseId === courseId || (matchedCourse && e.courseId === matchedCourse.id))?.facultyId;
    const mappedFaculty = faculty.find(f => f.id === facultyIdFromEntry) || faculty[0];
    const facultyName = mappedFaculty?.name || 'Unassigned Faculty';

    // Calculate total load for this faculty across all entries
    const facultyEntries = entries.filter(e => e.facultyId === mappedFaculty?.id);
    const facultyTotalLoad = facultyEntries.reduce((sum, e) => {
      const c = courses.find(crs => crs.id === e.courseId);
      return sum + (c?.durationSlots || 1);
    }, 0);

    // Default room occupancy
    const defaultRoom = rooms.find(r => r.type === (matchedCourse?.type === 'Lab' ? 'Lab' : 'Theory')) || rooms[0];
    const roomEntries = entries.filter(e => e.roomId === defaultRoom?.id);
    const roomOccupancySlots = roomEntries.reduce((sum, e) => sum + (e.colSpan || 1), 0);
    const roomOccupancyPct = Math.min(100, Math.round((roomOccupancySlots / 36) * 100));

    let bottleneckType: CourseDiagnostic['bottleneckType'] = 'Optimal';
    let explanation = 'Required weekly hours are 100% scheduled without conflict.';
    let recommendation = 'No changes required.';

    if (deficit > 0) {
      if (facultyTotalLoad >= 16) {
        bottleneckType = 'Faculty Overload';
        explanation = `Instructor "${facultyName}" has ${facultyTotalLoad} hrs total load across active batches (max recommended: 16 hrs). Schedule saturation prevents additional slot alignment.`;
        recommendation = 'Reassign workload to another faculty or add a co-instructor.';
      } else if (roomOccupancyPct >= 70) {
        bottleneckType = 'Room Congestion';
        explanation = `Classroom "${defaultRoom?.roomNumber || '101'}" has high slot congestion (${roomOccupancyPct}% occupied across batches).`;
        recommendation = 'Enable Preferred Room Relaxation or assign an alternate theory room.';
      } else if (rc.type === 'Lab') {
        bottleneckType = 'Slot Constraint';
        explanation = `Lab course requires consecutive 2-slot blocks (I-II, III-IV, or V-VI). Non-overlapping double slots are restricted on current days.`;
        recommendation = 'Check for locked slots blocking 2-hour lab windows.';
      } else {
        bottleneckType = 'Slot Constraint';
        explanation = `High weekly hour demand (${requiredHours} hrs) requires wider distribution across days.`;
        recommendation = 'Run Auto-Generator with MRV Heuristic to place high-demand subjects first.';
      }
    } else if (facultyTotalLoad > 16) {
      bottleneckType = 'Faculty Overload';
      explanation = `Hours scheduled, but instructor "${facultyName}" is at max capacity (${facultyTotalLoad} hrs).`;
      recommendation = 'Monitor instructor load to prevent scheduling friction in future terms.';
    }

    return {
      code: rc.code,
      name: rc.name,
      required: requiredHours,
      scheduled: scheduledHours,
      deficit,
      facultyName,
      facultyTotalLoad,
      roomName: defaultRoom ? `Room ${defaultRoom.roomNumber}` : 'General Room',
      roomOccupancyPct,
      bottleneckType,
      explanation,
      recommendation
    };
  });

  const totalBottlenecks = courseDiagnostics.filter(cd => cd.deficit > 0).length;

  return (
    <div id="analytics-panel" className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-6 print:hidden">
      {/* Tab Selectors */}
      <div className="bg-slate-50/70 border-b border-slate-200/80 px-5 py-3.5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-slate-900 text-sm tracking-tight block">
              Timetable Health & Analytics Guard
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Real-time CSP validation & constraint metrics</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 gap-0.5">
          <button
            onClick={() => setActiveTab('constraints')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'constraints' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {activeTab === 'constraints' && (
              <motion.div
                layoutId="analyticsTabActive"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              24-Rule Audit
              <span className={`text-[10px] h-4.5 min-w-4.5 px-1.5 rounded-full flex items-center justify-center font-black ${
                passedRulesCount === 24 ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30' : 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
              }`}>
                {passedRulesCount}/24
              </span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('utilization')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'utilization' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {activeTab === 'utilization' && (
              <motion.div
                layoutId="analyticsTabActive"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-purple-600" />
              Classroom Utilization
              <span className="bg-purple-100 text-purple-800 text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full">
                {classroomUtilization.overallAverageOccupancy}%
              </span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'batch' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {activeTab === 'batch' && (
              <motion.div
                layoutId="analyticsTabActive"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Active Batch
            </span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'conflicts' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {activeTab === 'conflicts' && (
              <motion.div
                layoutId="analyticsTabActive"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              Overlaps
              {uniqueConflicts.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] h-4.5 min-w-4.5 px-1.5 rounded-full flex items-center justify-center font-black animate-pulse shadow-xs shadow-rose-500/30">
                  {uniqueConflicts.length}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('workload')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'workload' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {activeTab === 'workload' && (
              <motion.div
                layoutId="analyticsTabActive"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Faculty Load
            </span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'diagnostics' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {activeTab === 'diagnostics' && (
              <motion.div
                layoutId="analyticsTabActive"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-600" />
              Diagnostics
              {totalBottlenecks > 0 && (
                <span className="bg-amber-500 text-white text-[10px] h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center font-black">
                  {totalBottlenecks}
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              if (liveLogs.length === 0) {
                // Auto generate initial diagnostic log if empty
                const res = generateTimetableForBatch(
                  activeBatchId,
                  activeSemester,
                  courses,
                  faculty,
                  rooms,
                  mappings,
                  semesterCourseMaps,
                  entries,
                  rooms.find(r => r.type === 'Theory')?.id || '',
                  batches
                );
                if (res.logs) setLiveLogs(res.logs);
              }
            }}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {activeTab === 'logs' && (
              <motion.div
                layoutId="analyticsTabActive"
                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/60"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              Solver Log
              {liveLogs.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-md font-mono font-black">
                  {liveLogs.length}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="p-5 sm:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'batch' && (
            <motion.div
              key="batch-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Stat 1: Weekly Workload Hours */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5 hover:bg-slate-50 transition-colors">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl border border-indigo-100 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Weekly Periods</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {scheduledPeriods} <span className="text-xs text-slate-400 font-semibold">/ {targetPeriodsPerWeek}</span>
                  </p>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((scheduledPeriods / (targetPeriodsPerWeek || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="bg-indigo-600 h-full rounded-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Stat 2: Credit Fulfillment */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5 hover:bg-slate-50 transition-colors">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100 shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Credits Fulfillment</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {scheduledCredits} <span className="text-xs text-slate-400 font-semibold">/ {totalSyllabusCredits}</span>
                  </p>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((scheduledCredits / (totalSyllabusCredits || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="bg-emerald-500 h-full rounded-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Stat 3: Slot Utilization */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5 hover:bg-slate-50 transition-colors">
                <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl border border-amber-100 shadow-xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Slot Utilization</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">
                    {slotUtilizationRate}%
                  </p>
                  <div className="w-24 bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${slotUtilizationRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stat 4: Unique Subjects */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono font-sans">Syllabus Coverage</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">
                    {scheduledCourseIds.length} <span className="text-xs text-slate-500 font-medium">/ {syllabusCourses.length} subjects</span>
                  </p>
                  <div className="w-24 bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((scheduledCourseIds.length / (syllabusCourses.length || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'conflicts' && (
            <motion.div
              key="conflicts-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {uniqueConflicts.length === 0 ? (
                <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">100% Conflict-Free Board Guard Active</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      The core CSP constraints are fully satisfied. There are zero room overlaps or instructor double-bookings across the entire workspace.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-red-800 text-xs">Overlap Conflicts Detected ({uniqueConflicts.length})</h4>
                        <p className="text-[11px] text-red-700 mt-0.5">
                          Drag-and-drop constraints usually prevent this, but manual database overrides or resets can trigger overlap discrepancies. Click below to automatically reschedule conflicting cards.
                        </p>
                      </div>
                    </div>
                    {onUpdateEntries && (
                      <button
                        onClick={() => {
                          const res = resolveOverlapConflicts(entries, batches, courses, faculty, rooms, semesterCourseMaps, mappings);
                          onUpdateEntries(res.resolvedEntries);
                          if (onShowToast) {
                            onShowToast(
                              res.fixedCount > 0 ? 'success' : 'info',
                              res.fixedCount > 0 ? 'Conflicts Resolved' : 'Resolution Complete',
                              res.message
                            );
                          }
                        }}
                        className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        Auto-Fix Conflicts
                      </button>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {uniqueConflicts.map(c => (
                      <div key={c.id} className="text-xs bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] font-mono uppercase ${
                            c.type === 'faculty' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.type === 'faculty' ? 'Instructor' : 'Room'}
                          </span>
                          <span className="font-bold text-slate-800">{c.targetName}</span>
                          <span className="text-slate-400 font-mono font-medium">on {c.day} @ Slot {c.slotId}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          <strong className="text-blue-600">{c.batchA}</strong> ({c.courseA}) 
                          <span className="mx-1 text-slate-400">↔</span> 
                          <strong className="text-blue-600">{c.batchB}</strong> ({c.courseB})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'workload' && (
            <motion.div
              key="workload-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex gap-4 overflow-x-auto pb-1.5 snap-x">
                {facultyWorkloads.length === 0 ? (
                  <div className="w-full text-center py-6 text-xs text-slate-400 font-medium">
                    No active workload has been logged. Add assignments to see load distributions.
                  </div>
                ) : (
                  facultyWorkloads.map(fw => {
                    const pct = Math.min((fw.assignedPeriods / fw.maxRecommended) * 100, 100);
                    let barColor = 'bg-blue-500';
                    let textColor = 'text-blue-700 bg-blue-50 border-blue-100';
                    if (fw.assignedPeriods > 12) {
                      barColor = 'bg-amber-500';
                      textColor = 'text-amber-700 bg-amber-50 border-amber-100';
                    }
                    if (fw.assignedPeriods > 16) {
                      barColor = 'bg-rose-500';
                      textColor = 'text-rose-700 bg-rose-50 border-rose-100';
                    }

                    return (
                      <div 
                        key={fw.id} 
                        className="snap-start shrink-0 w-44 bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between"
                      >
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs truncate" title={fw.name}>
                            {fw.name.replace('Dr. ', '')}
                          </h5>
                          <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                            {fw.designation} • {fw.specialization}
                          </p>
                        </div>
                        <div className="mt-2.5">
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-slate-500">Weekly load:</span>
                            <span className={`px-1 rounded-md font-mono font-bold text-[9px] border ${textColor}`}>
                              {fw.assignedPeriods} hrs
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'diagnostics' && (
            <motion.div
              key="diagnostics-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Top Banner */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/20 text-amber-400 p-2.5 rounded-xl border border-amber-500/30 shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      Solver Bottleneck & Capacity Diagnostics
                      {totalBottlenecks === 0 ? (
                        <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                          100% Satisfied
                        </span>
                      ) : (
                        <span className="bg-amber-500 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-black">
                          {totalBottlenecks} Bottlenecks Identified
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Analyzes instructor workloads, room slot congestion, and MRV constraint satisfaction to detect schedule bottlenecks.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold shrink-0">
                  <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
                    Syllabus Target: {targetPeriodsPerWeek} hrs
                  </span>
                  <span className="px-2.5 py-1 bg-blue-900/60 text-blue-300 rounded-lg border border-blue-700">
                    Scheduled: {scheduledPeriods} hrs
                  </span>
                </div>
              </div>

              {/* Course Diagnostic List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {courseDiagnostics.map((cd, idx) => {
                  let badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  if (cd.bottleneckType === 'Faculty Overload') badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200';
                  if (cd.bottleneckType === 'Room Congestion') badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200';
                  if (cd.bottleneckType === 'Slot Constraint') badgeStyle = 'bg-indigo-100 text-indigo-800 border-indigo-200';

                  return (
                    <div 
                      key={cd.code || idx}
                      className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            {cd.code}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {cd.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] font-mono border ${badgeStyle}`}>
                            {cd.bottleneckType}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {cd.explanation}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Weekly Hours</p>
                          <p className="font-mono font-black text-slate-800">
                            {cd.scheduled} / {cd.required} hrs
                            {cd.deficit > 0 && (
                              <span className="text-rose-600 ml-1 font-bold">({cd.deficit}h deficit)</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Faculty & Room</p>
                          <p className="text-[11px] font-medium text-slate-700">
                            {cd.facultyName.replace('Dr. ', '')} ({cd.facultyTotalLoad}h) • {cd.roomName}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation Callout */}
              <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl flex items-start gap-3">
                <Wrench className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <span className="font-bold">CSP Engine Strategy Active:</span> The solver logic employs the <strong>Most-Constrained-Variable (MRV) heuristic</strong> to schedule high-demand subjects first, utilizes <strong>temporary preferred-room relaxation</strong> when primary rooms are congested, and operates with an <strong>unlimited iteration limit</strong> to ensure all required weekly hours are satisfied.
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Header Stats Bar */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30 shrink-0">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      Real-time CSP Solver Trace & Backtrack Log
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border border-emerald-500/30">
                        {liveLogs.length} Events Logged
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Tracks sequence of attempted variables, MRV priority sorting, room relaxation events, and backtracking failures in real time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setIsGeneratingLog(true);
                      setTimeout(() => {
                        const res = generateTimetableForBatch(
                          activeBatchId,
                          activeSemester,
                          courses,
                          faculty,
                          rooms,
                          mappings,
                          semesterCourseMaps,
                          entries,
                          rooms.find(r => r.type === 'Theory')?.id || '',
                          batches,
                          { enableSmartRelaxation: true }
                        );
                        if (res.logs) setLiveLogs(res.logs);
                        setIsGeneratingLog(false);
                      }, 100);
                    }}
                    disabled={isGeneratingLog}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isGeneratingLog ? 'animate-spin' : ''}`} />
                    {isGeneratingLog ? 'Solving...' : 'Run Live Diagnostic'}
                  </button>

                  <button
                    onClick={() => {
                      const textToCopy = liveLogs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedLog(true);
                      setTimeout(() => setCopiedLog(false), 2000);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Copy full solver trace log to clipboard"
                  >
                    {copiedLog ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        Copy Log
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Log Metrics Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">MRV Variables</p>
                  <p className="font-mono font-black text-slate-800 text-sm">
                    {liveLogs.filter(l => l.type === 'mrv').length}
                  </p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-emerald-600 uppercase font-mono font-bold">Placed Slots</p>
                  <p className="font-mono font-black text-emerald-800 text-sm">
                    {liveLogs.filter(l => l.type === 'placed').length}
                  </p>
                </div>
                <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-amber-600 uppercase font-mono font-bold">Backtracks</p>
                  <p className="font-mono font-black text-amber-800 text-sm">
                    {liveLogs.filter(l => l.type === 'backtrack').length}
                  </p>
                </div>
                <div className="bg-blue-50/70 border border-blue-200 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-blue-600 uppercase font-mono font-bold">Smart Relaxations</p>
                  <p className="font-mono font-black text-blue-800 text-sm">
                    {liveLogs.filter(l => l.type === 'relaxation').length}
                  </p>
                </div>
                <div className="bg-rose-50/70 border border-rose-200 p-2.5 rounded-xl text-center col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-rose-600 uppercase font-mono font-bold">Conflicts / Warns</p>
                  <p className="font-mono font-black text-rose-800 text-sm">
                    {liveLogs.filter(l => l.type === 'conflict').length}
                  </p>
                </div>
              </div>

              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-slate-100 p-2 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {(['all', 'mrv', 'placed', 'backtrack', 'relaxation', 'conflict'] as const).map(filterKey => (
                    <button
                      key={filterKey}
                      onClick={() => setLogFilter(filterKey)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono uppercase transition-all cursor-pointer ${
                        logFilter === filterKey
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {filterKey}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search solver log entries..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-mono placeholder:text-slate-400 focus:outline-blue-600"
                  />
                </div>
              </div>

              {/* Console Log Terminal Window */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-inner max-h-96 overflow-y-auto space-y-1.5">
                {liveLogs.length === 0 ? (
                  <div className="text-slate-500 py-8 text-center italic">
                    No solver execution logs recorded yet. Click "Run Live Diagnostic" above to trigger a fresh CSP trace run.
                  </div>
                ) : (
                  liveLogs
                    .filter(log => {
                      if (logFilter !== 'all' && log.type !== logFilter) return false;
                      if (logSearch && !log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
                      return true;
                    })
                    .map((log, idx) => {
                      let typeBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                      if (log.type === 'mrv') typeBadge = 'bg-purple-950 text-purple-300 border-purple-800/80';
                      if (log.type === 'placed') typeBadge = 'bg-emerald-950 text-emerald-300 border-emerald-800/80';
                      if (log.type === 'backtrack') typeBadge = 'bg-amber-950 text-amber-300 border-amber-800/80';
                      if (log.type === 'relaxation') typeBadge = 'bg-cyan-950 text-cyan-300 border-cyan-800/80';
                      if (log.type === 'conflict') typeBadge = 'bg-rose-950 text-rose-300 border-rose-800/80';

                      return (
                        <div key={log.id || idx} className="flex items-start gap-2.5 hover:bg-slate-900/80 px-1.5 py-1 rounded transition-colors text-[11px] leading-relaxed">
                          <span className="text-slate-500 text-[10px] shrink-0 font-mono select-none">
                            [{log.timestamp}]
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono border shrink-0 ${typeBadge}`}>
                            {log.type}
                          </span>
                          <span className="text-slate-200 break-all font-mono">
                            {log.message}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </motion.div>
          )}

          {/* 24-Constraint Audit Matrix Tab */}
          {activeTab === 'constraints' && (
            <motion.div
              key="tab-constraints"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-5 space-y-4"
            >
              {/* Summary Header Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-xl ${passedRulesCount === 24 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white">Detailed 24-Constraint Compliance Matrix</h3>
                      <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-500/30 font-semibold">
                        Real-Time Audit Guard
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Automated verification across all 24 scheduling constraints: Faculty, Section, Classroom, Lab, Workload, Breaks, Electives, Capacity, Daily Limits & Completeness.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Rule Health Score</p>
                    <p className="text-lg font-black font-mono text-emerald-400">
                      {passedRulesCount} / 24 <span className="text-xs font-normal text-slate-300">Passed</span>
                    </p>
                  </div>
                  {onUpdateEntries && (
                    <button
                      onClick={() => {
                        const res = resolveOverlapConflicts(entries, batches, courses, faculty, rooms, semesterCourseMaps, mappings);
                        onUpdateEntries(res.resolvedEntries);
                        if (onShowToast) {
                          onShowToast(
                            res.fixedCount > 0 ? 'success' : 'info',
                            res.fixedCount > 0 ? 'Rule Violations Auto-Resolved' : 'Verification Complete',
                            res.message
                          );
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      Auto-Fix Violations
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-bold mr-1">Filter Rules:</span>
                  {(['all', 'passed', 'warning', 'violation'] as const).map(filterKey => {
                    const count = filterKey === 'all' ? 24 : auditItems.filter(a => a.status === filterKey).length;
                    return (
                      <button
                        key={filterKey}
                        onClick={() => setConstraintFilter(filterKey)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1 ${
                          constraintFilter === filterKey
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80'
                        }`}
                      >
                        {filterKey}
                        <span className="text-[10px] opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 24-Rule Audit Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {auditItems
                  .filter(item => constraintFilter === 'all' || item.status === constraintFilter)
                  .map(item => {
                    let badgeStyle = 'bg-emerald-50/80 border-emerald-200 text-emerald-900';
                    let statusIcon = <Check className="w-4 h-4 text-emerald-600 shrink-0" />;

                    if (item.status === 'warning') {
                      badgeStyle = 'bg-amber-50/80 border-amber-200 text-amber-900';
                      statusIcon = <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />;
                    } else if (item.status === 'violation') {
                      badgeStyle = 'bg-rose-50/80 border-rose-200 text-rose-900';
                      statusIcon = <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
                    }

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${badgeStyle}`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                              {statusIcon}
                              {item.title}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200/60 shrink-0 text-slate-800">
                              {item.score}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 leading-snug">
                            {item.details}
                          </p>
                        </div>

                        {item.recommendation && item.status !== 'passed' && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                            <Wrench className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{item.recommendation}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {/* Classroom Utilization Rates Tab */}
          {activeTab === 'utilization' && (
            <motion.div
              key="tab-utilization"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-5 space-y-5"
            >
              {/* Overall Utilization Summary Banner */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white">Classroom & Lab Utilization Analytics</h3>
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold">
                        Weekly Space Audit
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Tracks percentage of time each classroom is actively occupied vs idle across the 36-slot weekly schedule (Mon–Sat).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Overall Average</p>
                    <p className="text-xl font-black font-mono text-purple-400">
                      {classroomUtilization.overallAverageOccupancy}% <span className="text-xs font-normal text-slate-300">Occupied</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Theory Rooms</p>
                    <p className="text-lg font-black font-mono text-blue-400">
                      {classroomUtilization.theoryAverageOccupancy}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Lab Spaces</p>
                    <p className="text-lg font-black font-mono text-amber-400">
                      {classroomUtilization.labAverageOccupancy}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold">Filter Room Type:</span>
                  {(['all', 'Theory', 'Lab'] as const).map(typeKey => (
                    <button
                      key={typeKey}
                      onClick={() => setRoomTypeFilter(typeKey)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        roomTypeFilter === typeKey
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {typeKey === 'all' ? 'All Spaces' : typeKey === 'Theory' ? 'Theory Classrooms' : 'Laboratory Labs'}
                    </button>
                  ))}
                </div>

                {classroomUtilization.mostUtilizedRoom && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                    <span>Highest Saturation: <strong className="text-slate-900 font-bold">Room {classroomUtilization.mostUtilizedRoom.room.roomNumber} ({classroomUtilization.mostUtilizedRoom.occupancyPercentage}%)</strong></span>
                  </div>
                )}
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {classroomUtilization.roomsData
                  .filter(r => roomTypeFilter === 'all' || r.room.type === roomTypeFilter)
                  .map(roomData => {
                    const isHigh = roomData.occupancyPercentage > 80;
                    const isOptimal = roomData.occupancyPercentage >= 40 && roomData.occupancyPercentage <= 80;

                    let barColor = 'bg-blue-500';
                    let badgeColor = 'bg-blue-100 text-blue-800';
                    if (isHigh) {
                      barColor = 'bg-amber-500';
                      badgeColor = 'bg-amber-100 text-amber-800';
                    } else if (isOptimal) {
                      barColor = 'bg-emerald-500';
                      badgeColor = 'bg-emerald-100 text-emerald-800';
                    }

                    return (
                      <div
                        key={roomData.room.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-purple-300 transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">
                              Room {roomData.room.roomNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roomData.room.type === 'Lab' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}`}>
                              {roomData.room.type}
                            </span>
                          </div>
                          <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${badgeColor}`}>
                            {roomData.occupancyPercentage}% Occupied
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                              style={{ width: `${roomData.occupancyPercentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>{roomData.occupiedSlots} Occupied Slots</span>
                            <span>{roomData.idleSlots} Idle Slots</span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">Capacity</span>
                            <span className="font-extrabold text-slate-800">{roomData.room.capacity} Seats</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">Peak Day</span>
                            <span className="font-extrabold text-slate-800">{roomData.peakDay}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">Assigned Batches</span>
                            <span className="font-bold text-slate-700">{roomData.scheduledBatchesCount} Sections</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">Assigned Courses</span>
                            <span className="font-bold text-slate-700">{roomData.scheduledCoursesCount} Subjects</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, GraduationCap, Users, BookOpen, Warehouse, Shuffle, RefreshCw, ArrowUpRight, Download, Upload, X, Check, BarChart2, FileText, Search, Pin, Loader2, AlertTriangle, Edit2, Sparkles, Zap, RotateCcw, Lock } from 'lucide-react';
import { Batch, Faculty, Course, Room, FacultyCourseMapping, SemesterCourseMap, TimetableEntry, AdminPermissions } from '../types';
import { DEFAULT_SEM_COURSES, DEFAULT_FACULTY_MAPPINGS } from '../data/initialData';
import { detectSemesterFromBatch } from '../data/syllabusData';
import FacultyLoadDashboard from './FacultyLoadDashboard';
import ParallelSectionDiagnostics from './ParallelSectionDiagnostics';
import BackupRestoreModal from './BackupRestoreModal';
import { checkCapacityViolations, generateTimetableForBatch, generateTimetableForSemester, filterCoursesBySemester } from '../utils/solver';

interface AdminPanelProps {
  batches: Batch[];
  faculty: Faculty[];
  courses: Course[];
  rooms: Room[];
  mappings: FacultyCourseMapping[];
  semesterCourseMaps: SemesterCourseMap[];
  entries: TimetableEntry[];
  onUpdateBatches: (batches: Batch[]) => void;
  onUpdateFaculty: (faculty: Faculty[]) => void;
  onUpdateCourses: (courses: Course[]) => void;
  onUpdateRooms: (rooms: Room[]) => void;
  onUpdateMappings: (mappings: FacultyCourseMapping[]) => void;
  onUpdateSemesterCourseMaps: (maps: SemesterCourseMap[]) => void;
  onUpdateEntries: (entries: TimetableEntry[]) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  smartFillEnabled?: boolean;
  onToggleSmartFill?: (enabled: boolean) => void;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  isSuperAdmin?: boolean;
  isFrozen?: boolean;
  adminPermissions?: AdminPermissions;
}

export type AdminTab = 'batches' | 'faculty' | 'courses' | 'rooms' | 'mappings' | 'curriculum' | 'dashboard' | 'docs' | 'parallel-diagnostics';

export default function AdminPanel({
  batches,
  faculty,
  courses,
  rooms,
  mappings,
  semesterCourseMaps,
  entries,
  onUpdateBatches,
  onUpdateFaculty,
  onUpdateCourses,
  onUpdateRooms,
  onUpdateMappings,
  onUpdateSemesterCourseMaps,
  onUpdateEntries,
  onShowToast,
  smartFillEnabled = true,
  onToggleSmartFill,
  activeTab: controlledActiveTab,
  onTabChange,
  isSuperAdmin = false,
  isFrozen = false,
  adminPermissions,
}: AdminPanelProps) {
  // Super Admin granular permission checks for Admin role
  const canManageBatches = isSuperAdmin || (adminPermissions ? adminPermissions.canManageBatches : true);
  const canManageFaculty = isSuperAdmin || (adminPermissions ? adminPermissions.canManageFaculty : true);
  const canManageCourses = isSuperAdmin || (adminPermissions ? adminPermissions.canManageCourses : true);
  const canManageRooms = isSuperAdmin || (adminPermissions ? adminPermissions.canManageRooms : true);
  const canManageCurriculum = isSuperAdmin || (adminPermissions ? adminPermissions.canManageCurriculum : true);
  const canAssignFacultyMappings = isSuperAdmin || (adminPermissions ? adminPermissions.canAssignFacultyMappings : true);
  const canRunCspSolver = isSuperAdmin || (adminPermissions ? adminPermissions.canRunCspSolver : true);
  const [internalActiveTab, setInternalActiveTab] = useState<AdminTab>(controlledActiveTab || 'batches');

  React.useEffect(() => {
    if (controlledActiveTab) {
      setInternalActiveTab(controlledActiveTab);
    }
  }, [controlledActiveTab]);

  const activeTab = internalActiveTab;
  const setActiveTab = (tab: AdminTab) => {
    setInternalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [selectedSemesterPlanner, setSelectedSemesterPlanner] = useState<number>(1);
  const [selectedSemesterFilterMapping, setSelectedSemesterFilterMapping] = useState<string>('all');
  const [addingCourseSearch, setAddingCourseSearch] = useState<string>('');
  const [smartRelaxation, setSmartRelaxation] = useState<boolean>(true);

  // Real-time calculation of capacity violations
  const capacityViolations = checkCapacityViolations(entries, batches, rooms, courses);

  // Promotion/Selection and JSON Export/Import states
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [promotingBatch, setPromotingBatch] = useState<Batch | null>(null);
  const [promotingQueue, setPromotingQueue] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Search Grounding & Supplemental Notes states
  const [supplementalNotes, setSupplementalNotes] = useState<{ id: string; query: string; content: string; sources: { title: string; uri: string; }[] }[]>(() => {
    const stored = localStorage.getItem('apollo_supplemental_notes');
    if (stored) return JSON.parse(stored);
    return [
      {
        id: 'note-default-1',
        query: 'AICTE Faculty Workload Guidelines',
        content: 'According to AICTE guidelines, the weekly teaching load for academic staff is as follows:\n- Assistant Professors: 16 hours per week\n- Associate Professors: 14 hours per week\n- Professors: 14 hours per week\nA relaxation of 2 hours is given to those holding administrative responsibilities (e.g. HOD).',
        sources: [
          { title: 'AICTE Workload Regulations', uri: 'https://www.aicte-india.org/' }
        ]
      },
      {
        id: 'note-default-2',
        query: 'UGC Classroom Contact Hours',
        content: 'The UGC mandates a minimum of 180 actual teaching days per academic year. Direct teaching hours per week should be at least 16 hours for Assistant Professors and 14 hours for Associate Professors/Professors, with active mentoring/tutorials adding to the overall institutional commitment.',
        sources: [
          { title: 'UGC Minimum Qualifications Regulations', uri: 'https://www.ugc.gov.in/' }
        ]
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState('');
  const [searchSources, setSearchSources] = useState<{ title: string; uri: string }[]>([]);

  const handleAddSupplementalNote = () => {
    if (!searchResult) return;
    const newNote = {
      id: `note-${Date.now()}`,
      query: searchQuery || 'Custom Search Query',
      content: searchResult,
      sources: searchSources,
    };
    const updated = [...supplementalNotes, newNote];
    setSupplementalNotes(updated);
    localStorage.setItem('apollo_supplemental_notes', JSON.stringify(updated));
    onShowToast('success', 'Note Pinned', 'Guidelines have been pinned as a supplemental note.');
    // Clear search states
    setSearchResult('');
    setSearchSources([]);
    setSearchQuery('');
  };

  const handleDeleteSupplementalNote = (id: string) => {
    const updated = supplementalNotes.filter(n => n.id !== id);
    setSupplementalNotes(updated);
    localStorage.setItem('apollo_supplemental_notes', JSON.stringify(updated));
    onShowToast('info', 'Note Removed', 'Supplemental note removed from the guidelines list.');
  };

  const handleFetchGrounding = async () => {
    if (!searchQuery.trim()) {
      onShowToast('warning', 'Empty Query', 'Please enter a search query (e.g. UGC guidelines for teaching hours).');
      return;
    }
    setSearchLoading(true);
    setSearchResult('');
    setSearchSources([]);

    try {
      const response = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from grounding service.');
      }

      const data = await response.json();
      setSearchResult(data.text);
      setSearchSources(data.sources || []);
      onShowToast('success', 'Grounding Success', 'Fetched the latest academic guidelines and source references.');
    } catch (error: any) {
      console.error(error);
      onShowToast('error', 'Search Failed', error.message || 'Error executing search grounding.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Input states for adding new items
  const [newBatch, setNewBatch] = useState({ name: '', yearOfJoining: 2026, semester: 1 });
  const [showAddBatchForm, setShowAddBatchForm] = useState<boolean>(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState<string>('');
  const [batchSemesterFilter, setBatchSemesterFilter] = useState<string>('all');
  const [newFaculty, setNewFaculty] = useState<{
    name: string;
    phone: string;
    maxHoursPerDay: number;
    specialization: string;
    division: string;
    designation: string;
    selectedCourseIds: string[];
  }>({
    name: '',
    phone: '',
    maxHoursPerDay: 4,
    specialization: '',
    division: '',
    designation: '',
    selectedCourseIds: [],
  });

  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [editFacultyForm, setEditFacultyForm] = useState<{
    name: string;
    phone: string;
    maxHoursPerDay: number;
    specialization: string;
    division: string;
    designation: string;
    selectedCourseIds: string[];
  }>({
    name: '',
    phone: '',
    maxHoursPerDay: 4,
    specialization: '',
    division: '',
    designation: '',
    selectedCourseIds: [],
  });

  const [newCourse, setNewCourse] = useState({ courseCode: '', name: '', type: 'Theory' as Course['type'], durationSlots: 1, credits: 3 });
  const [newRoom, setNewRoom] = useState({ roomNumber: '', type: 'Theory' as Room['type'], capacity: 60 });
  const [newMapping, setNewMapping] = useState({ facultyId: '', courseId: '' });

  // Search & Filter states for sub-tabs
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('');
  const [courseTypeFilter, setCourseTypeFilter] = useState<string>('all');
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>('');
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all');
  const [mappingSearchQuery, setMappingSearchQuery] = useState<string>('');
  const [mappingDeptFilter, setMappingDeptFilter] = useState<string>('all');
  const [facultySearchQuery, setFacultySearchQuery] = useState<string>('');
  const [facultyDeptFilter, setFacultyDeptFilter] = useState<string>('all');

  // 1. Batch Management Action Handlers
  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBatches) {
      onShowToast('error', 'Action Restricted', 'Batch creation is restricted for Admins by Super Admin policy.');
      return;
    }
    if (!newBatch.name.trim()) return;

    // Check duplicate
    if (batches.some(b => b.name.toLowerCase() === newBatch.name.toLowerCase())) {
      onShowToast('error', 'Duplicate Batch Name', 'A batch with this name already exists.');
      return;
    }

    // Auto-detect semester from batch name
    const detectedSemester = detectSemesterFromBatch(newBatch.name);
    const semesterToUse = newBatch.semester === 1 && detectedSemester !== 1 
      ? detectedSemester 
      : Number(newBatch.semester);

    const created: Batch = {
      id: `batch-${Date.now()}`,
      name: newBatch.name,
      yearOfJoining: Number(newBatch.yearOfJoining),
      semester: semesterToUse
    };

    onUpdateBatches([...batches, created]);
    setNewBatch({ name: '', yearOfJoining: 2026, semester: 1 });
    onShowToast('success', 'Batch Added', `Created batch ${created.name} successfully.`);
  };

  const handleDeleteBatch = (id: string, name: string) => {
    if (!canManageBatches) {
      onShowToast('error', 'Action Restricted', 'Batch removal is restricted for Admins by Super Admin policy.');
      return;
    }
    // Prevent delete if classes scheduled
    const hasSchedules = entries.some(e => e.batchId === id);
    if (hasSchedules) {
      onShowToast('error', 'Cannot Delete', `Batch ${name} has active scheduled classes. Clear them first!`);
      return;
    }
    onUpdateBatches(batches.filter(b => b.id !== id));
    onShowToast('info', 'Batch Removed', `Deleted batch ${name}.`);
  };

  const handlePromoteBatch = (id: string) => {
    if (!canManageBatches) {
      onShowToast('error', 'Action Restricted', 'Batch promotions are restricted for Admins by Super Admin policy.');
      return;
    }
    const batch = batches.find(b => b.id === id);
    if (!batch) return;

    if (batch.semester >= 8) {
      onShowToast('warning', 'Already Graduated', `${batch.name} is already in Semester 8.`);
      return;
    }

    setPromotingBatch(batch);
    setPromotingQueue([]); // Clear queue for single promotion
    
    // Suggest default courses for next semester
    const nextSem = batch.semester + 1;
    const defaultIds = DEFAULT_SEM_COURSES[nextSem] || [];
    const matchedCourseIds = courses
      .filter(c => defaultIds.includes(c.id))
      .map(c => c.id);
    setSelectedCourseIds(matchedCourseIds);
  };

  const handlePromoteMultiple = () => {
    if (!canManageBatches) {
      onShowToast('error', 'Action Restricted', 'Batch promotions are restricted for Admins by Super Admin policy.');
      return;
    }
    if (selectedBatchIds.length === 0) return;
    const activeQueue = [...selectedBatchIds];
    const firstId = activeQueue.shift();
    if (firstId) {
      const batch = batches.find(b => b.id === firstId);
      if (batch) {
        if (batch.semester >= 8) {
          onShowToast('warning', 'Already Graduated', `${batch.name} is already in Semester 8.`);
          return;
        }
        setPromotingBatch(batch);
        setPromotingQueue(activeQueue);
        
        // Suggest default courses for next semester
        const nextSem = batch.semester + 1;
        const defaultIds = DEFAULT_SEM_COURSES[nextSem] || [];
        const matchedCourseIds = courses
          .filter(c => defaultIds.includes(c.id))
          .map(c => c.id);
          setSelectedCourseIds(matchedCourseIds);
      }
    }
  };

  const handleConfirmPromotion = () => {
    if (!canManageBatches) {
      onShowToast('error', 'Action Restricted', 'Batch promotions are restricted for Admins by Super Admin policy.');
      return;
    }
    if (!promotingBatch) return;

    const nextSem = promotingBatch.semester + 1;
    const updated = batches.map(b => {
      if (b.id === promotingBatch.id) {
        return { ...b, semester: nextSem };
      }
      return b;
    });

    onUpdateBatches(updated);

    // Clear old non-locked timetable entries for this batch
    const clearedTimetable = entries.filter(e => !(e.batchId === promotingBatch.id && !e.isLocked));
    onUpdateEntries(clearedTimetable);

    // Update semester course maps: remove existing for this batch and add selected new courses
    const filteredMaps = semesterCourseMaps.filter(m => m.batchId !== promotingBatch.id);
    const newMaps = selectedCourseIds.map((courseId, idx) => ({
      id: `sc-map-promoted-${promotingBatch.id}-${Date.now()}-${idx}`,
      semester: nextSem,
      batchId: promotingBatch.id,
      courseId
    }));
    onUpdateSemesterCourseMaps([...filteredMaps, ...newMaps]);

    onShowToast('success', 'Batch Promoted', `Successfully promoted ${promotingBatch.name} to Semester ${nextSem} and mapped selected courses.`);

    // If there is more in the queue, open the next one
    if (promotingQueue.length > 0) {
      const nextQueue = [...promotingQueue];
      let nextId = nextQueue.shift();
      while (nextId) {
        const nextBatch = batches.find(b => b.id === nextId);
        if (nextBatch) {
          if (nextBatch.semester >= 8) {
            onShowToast('warning', 'Already Graduated', `${nextBatch.name} is already in Semester 8. Skipping.`);
            nextId = nextQueue.shift();
            continue;
          }
          setPromotingBatch(nextBatch);
          setPromotingQueue(nextQueue);
          const nextTargetSem = nextBatch.semester + 1;
          const nextDefaultIds = DEFAULT_SEM_COURSES[nextTargetSem] || [];
          const nextMatchedCourseIds = courses
            .filter(c => nextDefaultIds.includes(c.id))
            .map(c => c.id);
          setSelectedCourseIds(nextMatchedCourseIds);
          return;
        }
        nextId = nextQueue.shift();
      }
    }

    setPromotingBatch(null);
    setPromotingQueue([]);
    setSelectedBatchIds([]); // Clear checkboxes
  };

  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify({
        batches,
        faculty,
        courses,
        rooms,
        mappings,
        semesterCourseMaps,
        entries
      }, null, 2);
      
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timetable_backup_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onShowToast('success', 'Export Successful', 'Timetable configuration downloaded as JSON.');
    } catch (error) {
      onShowToast('error', 'Export Failed', 'An error occurred while exporting data.');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!json || typeof json !== 'object') {
          throw new Error('Invalid JSON format');
        }

        if (json.batches && Array.isArray(json.batches)) {
          onUpdateBatches(json.batches);
        }
        if (json.faculty && Array.isArray(json.faculty)) {
          onUpdateFaculty(json.faculty);
        }
        if (json.courses && Array.isArray(json.courses)) {
          onUpdateCourses(json.courses);
        }
        if (json.rooms && Array.isArray(json.rooms)) {
          onUpdateRooms(json.rooms);
        }
        if (json.mappings && Array.isArray(json.mappings)) {
          onUpdateMappings(json.mappings);
        }
        if (json.semesterCourseMaps && Array.isArray(json.semesterCourseMaps)) {
          onUpdateSemesterCourseMaps(json.semesterCourseMaps);
        }
        if (json.entries && Array.isArray(json.entries)) {
          onUpdateEntries(json.entries);
        }

        onShowToast('success', 'Import Successful', 'Timetable configuration has been restored successfully.');
        e.target.value = '';
      } catch (err) {
        onShowToast('error', 'Import Failed', 'The uploaded file is not a valid timetable JSON configuration.');
      }
    };
    reader.readAsText(file);
  };

  const handleCloneBatchTemplate = (sourceId: string) => {
    if (!canManageBatches) {
      onShowToast('error', 'Action Restricted', 'Cloning batches is restricted for Admins by Super Admin policy.');
      return;
    }
    const sourceBatch = batches.find(b => b.id === sourceId);
    if (!sourceBatch) return;

    const cloneName = `${sourceBatch.name} (Clone)`;
    const cloneId = `batch-clone-${Date.now()}`;
    const clonedBatch: Batch = {
      id: cloneId,
      name: cloneName,
      yearOfJoining: sourceBatch.yearOfJoining,
      semester: sourceBatch.semester
    };

    onUpdateBatches([...batches, clonedBatch]);

    // Copy course maps as well
    const sourceCourseMaps = semesterCourseMaps.filter(m => m.batchId === sourceId);
    const clonedMaps = sourceCourseMaps.map((m, idx) => ({
      id: `sc-map-clone-${Date.now()}-${idx}`,
      semester: m.semester,
      batchId: cloneId,
      courseId: m.courseId
    }));
    onUpdateSemesterCourseMaps([...semesterCourseMaps, ...clonedMaps]);

    // Copy locked timetable entries as template skeleton
    const sourceTimetables = entries.filter(e => e.batchId === sourceId);
    const clonedTimetables = sourceTimetables.map((e, idx) => ({
      id: `tt-clone-${Date.now()}-${idx}`,
      day: e.day,
      slotId: e.slotId,
      batchId: cloneId,
      courseId: e.courseId,
      facultyId: e.facultyId,
      roomId: e.roomId,
      isLocked: e.isLocked,
      colSpan: e.colSpan
    }));
    onUpdateEntries([...entries, ...clonedTimetables]);

    onShowToast('success', 'Template Cloned', `Cloned ${sourceBatch.name} as ${cloneName} including skeleton timetable cells!`);
  };

  // 2. Faculty Management
  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageFaculty) {
      onShowToast('error', 'Action Restricted', 'Faculty recruitment is restricted for Admins by Super Admin policy.');
      return;
    }
    if (!newFaculty.name.trim()) return;

    const created: Faculty = {
      id: `fac-${Date.now()}`,
      name: newFaculty.name,
      phone: newFaculty.phone || 'N/A',
      maxHoursPerDay: Number(newFaculty.maxHoursPerDay),
      specialization: newFaculty.specialization || '',
      division: newFaculty.division || '',
      designation: newFaculty.designation || ''
    };

    onUpdateFaculty([...faculty, created]);

    if (newFaculty.selectedCourseIds && newFaculty.selectedCourseIds.length > 0) {
      const newMappings: FacultyCourseMapping[] = newFaculty.selectedCourseIds.map(courseId => ({
        id: `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        facultyId: created.id,
        courseId
      }));
      onUpdateMappings([...mappings, ...newMappings]);
    }

    setNewFaculty({
      name: '',
      phone: '',
      maxHoursPerDay: 4,
      specialization: '',
      division: '',
      designation: '',
      selectedCourseIds: [],
    });
    onShowToast('success', 'Faculty Recruited', `Registered Dr/Mr/Mrs ${created.name} in index with ${newFaculty.selectedCourseIds.length} teaching courses.`);
  };

  const handleStartEditFaculty = (fac: Faculty) => {
    const existingCourseIds = mappings
      .filter(m => m.facultyId === fac.id)
      .map(m => m.courseId);

    setEditingFaculty(fac);
    setEditFacultyForm({
      name: fac.name,
      phone: fac.phone,
      maxHoursPerDay: fac.maxHoursPerDay,
      specialization: fac.specialization || '',
      division: fac.division || '',
      designation: fac.designation || '',
      selectedCourseIds: existingCourseIds
    });
  };

  const handleSaveEditFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageFaculty) {
      onShowToast('error', 'Action Restricted', 'Faculty modifications are restricted for Admins by Super Admin policy.');
      return;
    }
    if (!editingFaculty) return;
    if (!editFacultyForm.name.trim()) return;

    const updatedFacultyList = faculty.map(f => {
      if (f.id === editingFaculty.id) {
        return {
          ...f,
          name: editFacultyForm.name,
          phone: editFacultyForm.phone || 'N/A',
          maxHoursPerDay: Number(editFacultyForm.maxHoursPerDay),
          specialization: editFacultyForm.specialization,
          division: editFacultyForm.division,
          designation: editFacultyForm.designation
        };
      }
      return f;
    });
    onUpdateFaculty(updatedFacultyList);

    const filteredMappings = mappings.filter(m => m.facultyId !== editingFaculty.id);
    const newMappings: FacultyCourseMapping[] = editFacultyForm.selectedCourseIds.map(courseId => ({
      id: `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      facultyId: editingFaculty.id,
      courseId
    }));
    onUpdateMappings([...filteredMappings, ...newMappings]);

    setEditingFaculty(null);
    onShowToast('success', 'Faculty Updated', `Successfully updated Dr/Mr/Mrs ${editFacultyForm.name}'s profile and course registry.`);
  };

  const handleDeleteFaculty = (id: string, name: string) => {
    if (!canManageFaculty) {
      onShowToast('error', 'Action Restricted', 'Faculty retirement is restricted for Admins by Super Admin policy.');
      return;
    }
    if (entries.some(e => e.facultyId === id)) {
      onShowToast('error', 'Instructor Active', `Cannot delete ${name}: currently scheduled to teach active classes.`);
      return;
    }
    onUpdateFaculty(faculty.filter(f => f.id !== id));
    onUpdateMappings(mappings.filter(m => m.facultyId !== id));
    onShowToast('info', 'Faculty Retired', `Removed ${name} from instructors and cleared their course mappings.`);
  };

  // 3. Course Management
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCourses) {
      onShowToast('error', 'Action Restricted', 'Course syllabus additions are restricted for Admins by Super Admin policy.');
      return;
    }
    if (!newCourse.courseCode.trim() || !newCourse.name.trim()) return;

    const created: Course = {
      id: `crs-${Date.now()}`,
      courseCode: newCourse.courseCode.toUpperCase(),
      name: newCourse.name,
      type: newCourse.type,
      durationSlots: Number(newCourse.durationSlots),
      credits: Number(newCourse.credits)
    };

    onUpdateCourses([...courses, created]);
    setNewCourse({ courseCode: '', name: '', type: 'Theory', durationSlots: 1, credits: 3 });
    onShowToast('success', 'Syllabus Added', `Registered course [${created.courseCode}] ${created.name}`);
  };

  const handleDeleteCourse = (id: string, name: string) => {
    if (!canManageCourses) {
      onShowToast('error', 'Action Restricted', 'Course deletion is restricted for Admins by Super Admin policy.');
      return;
    }
    if (entries.some(e => e.courseId === id)) {
      onShowToast('error', 'Course Active', `Cannot delete ${name}: currently scheduled in active timetables.`);
      return;
    }
    onUpdateCourses(courses.filter(c => c.id !== id));
    onShowToast('info', 'Course Deleted', `Removed ${name} from catalog.`);
  };

  // 4. Room Management
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRooms) {
      onShowToast('error', 'Action Restricted', 'Room creation is restricted for Admins by Super Admin policy.');
      return;
    }
    if (!newRoom.roomNumber.trim()) return;

    const created: Room = {
      id: `room-${Date.now()}`,
      roomNumber: newRoom.roomNumber,
      type: newRoom.type,
      capacity: Number(newRoom.capacity)
    };

    onUpdateRooms([...rooms, created]);
    setNewRoom({ roomNumber: '', type: 'Theory', capacity: 60 });
    onShowToast('success', 'Classroom Booked', `Added Classroom ${created.roomNumber}.`);
  };

  const handleDeleteRoom = (id: string, roomNumber: string) => {
    if (!canManageRooms) {
      onShowToast('error', 'Action Restricted', 'Room deletion is restricted for Admins by Super Admin policy.');
      return;
    }
    if (entries.some(e => e.roomId === id)) {
      onShowToast('error', 'Room Occupied', `Cannot delete Room ${roomNumber}: active classes are physically assigned here.`);
      return;
    }
    onUpdateRooms(rooms.filter(r => r.id !== id));
    onShowToast('info', 'Classroom Deleted', `Removed Room ${roomNumber} from database.`);
  };

  // 5. Faculty Course Mapping Management
  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssignFacultyMappings) {
      onShowToast('error', 'Action Restricted', 'Faculty-course assignments are restricted for Admins by Super Admin policy.');
      return;
    }
    if (!newMapping.facultyId || !newMapping.courseId) return;

    // Check duplicate mapping
    if (mappings.some(m => m.facultyId === newMapping.facultyId && m.courseId === newMapping.courseId)) {
      onShowToast('warning', 'Already Mapped', 'This instructor is already mapped to this syllabus course.');
      return;
    }

    const created: FacultyCourseMapping = {
      id: `map-${Date.now()}`,
      facultyId: newMapping.facultyId,
      courseId: newMapping.courseId
    };

    onUpdateMappings([...mappings, created]);
    setNewMapping({ facultyId: '', courseId: '' });
    onShowToast('success', 'Mapping Complete', 'Faculty course mapping defined successfully.');
  };

  const handleDeleteMapping = (id: string) => {
    if (!canAssignFacultyMappings) {
      onShowToast('error', 'Action Restricted', 'Faculty-course mapping removal is restricted for Admins by Super Admin policy.');
      return;
    }
    onUpdateMappings(mappings.filter(m => m.id !== id));
    onShowToast('info', 'Mapping Deleted', 'Removed instructor subject mapping.');
  };

  const handleResetToStandardSyllabus = () => {
    if (!canManageCurriculum) {
      onShowToast('error', 'Action Restricted', 'Curriculum syllabus reset is restricted for Admins by Super Admin policy.');
      return;
    }
    const standardIds = DEFAULT_SEM_COURSES[selectedSemesterPlanner] || [];
    if (standardIds.length === 0) {
      onShowToast('warning', 'No Preset Found', `No default syllabus found for Semester ${selectedSemesterPlanner}.`);
      return;
    }

    const batchesInSem = batches.filter(b => b.semester === selectedSemesterPlanner);
    const newMaps: SemesterCourseMap[] = [];

    if (batchesInSem.length === 0) {
      standardIds.forEach((courseId, idx) => {
        newMaps.push({
          id: `sc-preset-all-${selectedSemesterPlanner}-${idx}-${Date.now()}`,
          semester: selectedSemesterPlanner,
          batchId: 'all',
          courseId
        });
      });
    } else {
      batchesInSem.forEach(batch => {
        standardIds.forEach((courseId, idx) => {
          newMaps.push({
            id: `sc-preset-${batch.id}-${idx}-${Date.now()}`,
            semester: selectedSemesterPlanner,
            batchId: batch.id,
            courseId
          });
        });
      });
    }

    const otherMaps = semesterCourseMaps.filter(m => m.semester !== selectedSemesterPlanner);
    onUpdateSemesterCourseMaps([...otherMaps, ...newMaps]);

    // Ensure all standard subjects have explicit mappings in mappings directory
    const missingMappings = DEFAULT_FACULTY_MAPPINGS.filter(
      dfm => standardIds.includes(dfm.courseId) && !mappings.some(m => m.courseId === dfm.courseId)
    );
    if (missingMappings.length > 0) {
      onUpdateMappings([...mappings, ...missingMappings]);
    }

    onShowToast('success', 'Syllabus Preset Loaded', `Successfully loaded standard subjects and faculty mappings for Semester ${selectedSemesterPlanner}.`);
  };

  const handleAddCourseToSemesterPlanner = (courseId: string) => {
    if (!canManageCurriculum) {
      onShowToast('error', 'Action Restricted', 'Adding courses to semester curriculum is restricted for Admins by Super Admin policy.');
      return;
    }
    const batchesInSem = batches.filter(b => b.semester === selectedSemesterPlanner);
    
    // Check if it's already mapped
    const isAlreadyMapped = semesterCourseMaps.some(
      m => m.semester === selectedSemesterPlanner && m.courseId === courseId
    );
    if (isAlreadyMapped) {
      onShowToast('warning', 'Already Active', 'This course is already active in this semester.');
      return;
    }

    const newMaps: SemesterCourseMap[] = [];
    if (batchesInSem.length === 0) {
      newMaps.push({
        id: `sc-map-planner-${Date.now()}-all`,
        semester: selectedSemesterPlanner,
        batchId: 'all',
        courseId
      });
    } else {
      batchesInSem.forEach((batch, idx) => {
        newMaps.push({
          id: `sc-map-planner-${Date.now()}-${idx}`,
          semester: selectedSemesterPlanner,
          batchId: batch.id,
          courseId
        });
      });
    }

    onUpdateSemesterCourseMaps([...semesterCourseMaps, ...newMaps]);

    // Ensure faculty mapping exists for newly added course
    const defaultMap = DEFAULT_FACULTY_MAPPINGS.find(m => m.courseId === courseId);
    if (defaultMap && !mappings.some(m => m.courseId === courseId)) {
      onUpdateMappings([...mappings, defaultMap]);
    }

    onShowToast('success', 'Course Added', 'Course successfully added to the semester curriculum.');
  };

  const handleRemoveCourseFromSemesterPlanner = (courseId: string) => {
    if (!canManageCurriculum) {
      onShowToast('error', 'Action Restricted', 'Removing courses from semester curriculum is restricted for Admins by Super Admin policy.');
      return;
    }
    const updated = semesterCourseMaps.filter(
      m => !(m.semester === selectedSemesterPlanner && m.courseId === courseId)
    );
    onUpdateSemesterCourseMaps(updated);
    onShowToast('info', 'Course Removed', 'Removed course from the semester curriculum.');
  };

  const handleAssignFacultyPlanner = (courseId: string, facultyId: string) => {
    if (!canAssignFacultyMappings) {
      onShowToast('error', 'Action Restricted', 'Faculty assignments are restricted for Admins by Super Admin policy.');
      return;
    }
    const existingIdx = mappings.findIndex(m => m.courseId === courseId);
    let updatedMappings = [...mappings];
    
    if (facultyId === '') {
      updatedMappings = updatedMappings.filter(m => m.courseId !== courseId);
    } else if (existingIdx > -1) {
      updatedMappings[existingIdx] = {
        ...updatedMappings[existingIdx],
        facultyId
      };
    } else {
      updatedMappings.push({
        id: `map-planner-${Date.now()}`,
        facultyId,
        courseId
      });
    }

    onUpdateMappings(updatedMappings);
    const facName = faculty.find(f => f.id === facultyId)?.name || 'None';
    onShowToast('success', 'Faculty Assigned', `Assigned ${facName} to teach this subject.`);
  };

  const getFacultyWeeklyLoad = (facId: string): number => {
    return entries
      .filter(e => e.facultyId === facId)
      .reduce((sum, e) => {
        const course = courses.find(c => c.id === e.courseId);
        return sum + (course ? course.durationSlots : 1);
      }, 0);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden mb-8 text-slate-900">
      {/* Tab Navigation Headers */}
      <div className="border-b border-slate-200 bg-slate-50/80 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center bg-white p-1 rounded-2xl border border-slate-200 gap-0.5 shadow-2xs">
          <button
            onClick={() => setActiveTab('batches')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'batches' ? 'text-[#0F172A]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'batches' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-[#F1F5F9] rounded-xl shadow-2xs border border-slate-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              Batches & Promotion
            </span>
          </button>
   
          <button
            onClick={() => setActiveTab('faculty')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'faculty' ? 'text-[#0F172A]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'faculty' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-[#F1F5F9] rounded-xl shadow-2xs border border-slate-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Faculty Directory
            </span>
          </button>
   
          <button
            onClick={() => setActiveTab('courses')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'courses' ? 'text-[#0F172A]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'courses' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-[#F1F5F9] rounded-xl shadow-2xs border border-slate-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Syllabus Catalog
            </span>
          </button>
   
          <button
            onClick={() => setActiveTab('rooms')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'rooms' ? 'text-[#0F172A]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'rooms' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-[#F1F5F9] rounded-xl shadow-2xs border border-slate-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-purple-600" />
              Classrooms
            </span>
          </button>
   
          <button
            onClick={() => setActiveTab('mappings')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'mappings' ? 'text-[#0F172A]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'mappings' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-[#F1F5F9] rounded-xl shadow-2xs border border-slate-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-amber-600" />
              Faculty Assignments
            </span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'curriculum' ? 'text-[#0F172A]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'curriculum' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-[#F1F5F9] rounded-xl shadow-2xs border border-slate-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              Semester Planner
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#0F172A]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'dashboard' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-[#F1F5F9] rounded-xl shadow-2xs border border-slate-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              Load Dashboard
            </span>
          </button>

          <button
            onClick={() => setActiveTab('parallel-diagnostics')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'parallel-diagnostics' ? 'text-rose-700' : 'text-rose-600 hover:text-rose-800'
            }`}
          >
            {activeTab === 'parallel-diagnostics' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-rose-50 rounded-xl shadow-2xs border border-rose-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Section Overlaps
            </span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`relative flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'docs' ? 'text-[#0F172A]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'docs' && (
              <motion.div
                layoutId="adminTabIndicator"
                className="absolute inset-0 bg-[#F1F5F9] rounded-xl shadow-2xs border border-slate-200"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Regulations
            </span>
          </button>
        </div>
      </div>

      {/* Capacity Violations Alert Banner */}
      {capacityViolations.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-100 p-4 px-6 flex items-start gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              Room Capacity Overload Warnings ({capacityViolations.length})
            </h4>
            <p className="text-xs text-rose-700/90 mt-0.5">
              The following scheduled periods have batch student counts that exceed the maximum seating capacity of their assigned classroom. Adjust rooms or batches to avoid overcrowding.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
              {capacityViolations.map((v, i) => (
                <div key={v.id || i} className="text-[10px] font-bold bg-white text-rose-700 border border-rose-200/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                  <span>
                    {v.day} Slot {v.slotId}: <strong className="text-rose-950 font-black">{v.batchName}</strong> ({v.studentCount} students) in <strong className="text-rose-950 font-black">Room {v.roomNumber}</strong> (Cap: {v.capacity}) for <em className="text-slate-600 italic font-medium">{v.courseName}</em>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Panels */}
      <div className="p-6">
        {/* TAB 1: Batches & Promotion */}
        {activeTab === 'batches' && (() => {
          const filteredBatches = batches.filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
              b.yearOfJoining.toString().includes(batchSearchQuery);
            const matchesSem = batchSemesterFilter === 'all' || b.semester === Number(batchSemesterFilter);
            return matchesSearch && matchesSem;
          });

          return (
            <div className="space-y-5">
              {/* Top Header & Actions Strip */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#0F172A]">B.Tech Batch Configurations</h3>
                    <span className="text-[10px] font-mono font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      {batches.length} Sections Total
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure current parallel student sections, promote semesters, and clone setups.
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                  {selectedBatchIds.length > 0 && (
                    <button
                      onClick={handlePromoteMultiple}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Promote ({selectedBatchIds.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowAddBatchForm(!showAddBatchForm)}
                    className={`text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      showAddBatchForm
                        ? 'bg-slate-800 text-white hover:bg-slate-900'
                        : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-indigo-500/20'
                    }`}
                  >
                    {showAddBatchForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{showAddBatchForm ? 'Close Add Form' : '+ Add New Batch'}</span>
                  </button>
                </div>
              </div>

              {/* Separated Top Full-Width Add Batch Drawer / Form Card */}
              <AnimatePresence>
                {showAddBatchForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 p-5 sm:p-6 rounded-3xl border-2 border-blue-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-600 font-black" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Create New Section / Batch
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddBatchForm(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={(e) => { handleAddBatch(e); setShowAddBatchForm(false); }} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Batch Section Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. CSE-D (Sem 4)"
                              value={newBatch.name}
                              onChange={e => setNewBatch({ ...newBatch, name: e.target.value })}
                              className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Year of Joining</label>
                            <input
                              type="number"
                              value={newBatch.yearOfJoining}
                              onChange={e => setNewBatch({ ...newBatch, yearOfJoining: Number(e.target.value) })}
                              className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Semester (1 to 8)</label>
                            <input
                              type="number"
                              min={1}
                              max={8}
                              value={newBatch.semester}
                              onChange={e => setNewBatch({ ...newBatch, semester: Number(e.target.value) })}
                              className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddBatchForm(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create Batch</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full-Width Search, Semester Filter Strip & Batch Directory Table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                {/* Search & Semester Filter Pills */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search section name or year..."
                      value={batchSearchQuery}
                      onChange={(e) => setBatchSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                    {['all', '8', '7', '6', '5', '4', '3', '2', '1'].map((sem) => {
                      const isSel = batchSemesterFilter === sem;
                      const count = sem === 'all' ? batches.length : batches.filter(b => b.semester === Number(sem)).length;
                      return (
                        <button
                          key={sem}
                          onClick={() => setBatchSemesterFilter(sem)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                            isSel
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span>{sem === 'all' ? 'All Semesters' : `Sem ${sem}`}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full-Width Table with Bounded Internal Scroll */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[480px] overflow-y-auto custom-scrollbar bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-2xs">
                      <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="p-3.5 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={filteredBatches.length > 0 && selectedBatchIds.length === filteredBatches.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBatchIds(filteredBatches.map(b => b.id));
                              } else {
                                setSelectedBatchIds([]);
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3.5">Batch Name</th>
                        <th className="p-3.5">Year of Joining</th>
                        <th className="p-3.5">Semester</th>
                        <th className="p-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredBatches.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            No batches match your filter or search query.
                          </td>
                        </tr>
                      ) : (
                        filteredBatches.map((batch) => {
                          const isSelected = selectedBatchIds.includes(batch.id);
                          return (
                            <tr key={batch.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                              <td className="p-3.5 w-12 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedBatchIds([...selectedBatchIds, batch.id]);
                                    } else {
                                      setSelectedBatchIds(selectedBatchIds.filter(id => id !== batch.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-3.5 font-bold text-[#0F172A] flex items-center gap-2">
                                <span>{batch.name}</span>
                                {batch.studentCount && (
                                  <span className="text-[10px] font-mono text-slate-400 font-normal">({batch.studentCount} students)</span>
                                )}
                              </td>
                              <td className="p-3.5 text-slate-500 font-mono">{batch.yearOfJoining}</td>
                              <td className="p-3.5">
                                <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full text-[11px] border border-blue-100">
                                  Sem {batch.semester}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handlePromoteBatch(batch.id)}
                                    title="Promote Semester & map syllabus courses"
                                    className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    <span>Promote</span>
                                  </button>

                                  <button
                                    onClick={() => handleCloneBatchTemplate(batch.id)}
                                    title="Clone layout structures"
                                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Clone</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteBatch(batch.id, batch.name)}
                                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-100 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                  <span>Showing <strong>{filteredBatches.length}</strong> of {batches.length} batch sections</span>
                  {batchSemesterFilter !== 'all' && (
                    <button
                      onClick={() => setBatchSemesterFilter('all')}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear Semester Filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 2: Faculty Directory */}
        {activeTab === 'faculty' && (() => {
          const filteredFaculty = faculty.filter(f => {
            const matchesQuery = !facultySearchQuery.trim() || 
              f.name.toLowerCase().includes(facultySearchQuery.toLowerCase()) ||
              (f.designation && f.designation.toLowerCase().includes(facultySearchQuery.toLowerCase())) ||
              (f.division && f.division.toLowerCase().includes(facultySearchQuery.toLowerCase())) ||
              (f.specialization && f.specialization.toLowerCase().includes(facultySearchQuery.toLowerCase()));
            const matchesDept = facultyDeptFilter === 'all' || f.division === facultyDeptFilter;
            return matchesQuery && matchesDept;
          });

          const departments = Array.from(new Set(faculty.map(f => f.division).filter(Boolean)));

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Faculty Index Directory</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Maintain directory databases of registered professors, instructors, academic specializations and courses they teach.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={facultyDeptFilter}
                    onChange={(e) => setFacultyDeptFilter(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="all">All Divisions ({faculty.length})</option>
                    {departments.map((dept) => {
                      const count = faculty.filter(f => f.division === dept).length;
                      return (
                        <option key={dept} value={dept}>
                          {dept} ({count})
                        </option>
                      );
                    })}
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search faculty..."
                      value={facultySearchQuery}
                      onChange={(e) => setFacultySearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-blue-600 w-48"
                    />
                    {facultySearchQuery && (
                      <button onClick={() => setFacultySearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-fit">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Add Faculty
                  </h4>
                  <form onSubmit={handleAddFaculty} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Full Instructor Name *</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newFaculty.name}
                        onChange={e => setNewFaculty({ ...newFaculty, name: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Designation *</label>
                      <input
                        type="text"
                        placeholder="e.g., Professor, Assistant Professor"
                        value={newFaculty.designation}
                        onChange={e => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Contact No. *</label>
                        <input
                          type="text"
                          placeholder="Contact Number"
                          value={newFaculty.phone}
                          onChange={e => setNewFaculty({ ...newFaculty, phone: e.target.value })}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Max Hrs / Day</label>
                        <input
                          type="number"
                          value={newFaculty.maxHoursPerDay}
                          onChange={e => setNewFaculty({ ...newFaculty, maxHoursPerDay: Number(e.target.value) })}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Division / Dept</label>
                        <input
                          type="text"
                          placeholder="Department"
                          value={newFaculty.division}
                          onChange={e => setNewFaculty({ ...newFaculty, division: e.target.value })}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Specialization</label>
                        <input
                          type="text"
                          placeholder="Specialization"
                          value={newFaculty.specialization}
                          onChange={e => setNewFaculty({ ...newFaculty, specialization: e.target.value })}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-600">Courses Able to Teach</label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setNewFaculty({ ...newFaculty, selectedCourseIds: courses.map(c => c.id) })}
                            className="text-[9px] text-blue-600 font-bold hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-[9px] text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setNewFaculty({ ...newFaculty, selectedCourseIds: [] })}
                            className="text-[9px] text-slate-500 font-bold hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-white space-y-1.5 custom-scrollbar">
                        {courses.length === 0 ? (
                          <div className="text-[10px] text-slate-400 text-center py-4">No syllabus courses available. Create courses first!</div>
                        ) : (
                          courses.map(course => {
                            const isChecked = newFaculty.selectedCourseIds.includes(course.id);
                            return (
                              <label key={course.id} className="flex items-start gap-2 text-[11px] font-medium text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewFaculty({
                                        ...newFaculty,
                                        selectedCourseIds: [...newFaculty.selectedCourseIds, course.id]
                                      });
                                    } else {
                                      setNewFaculty({
                                        ...newFaculty,
                                        selectedCourseIds: newFaculty.selectedCourseIds.filter(id => id !== course.id)
                                      });
                                    }
                                  }}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                                />
                                <span className="flex-1">
                                  <strong className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded mr-1 border border-slate-200">{course.courseCode}</strong>
                                  {course.name}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      Add Instructor
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 border border-slate-100 rounded-2xl overflow-hidden max-h-[580px] overflow-y-auto custom-scrollbar shadow-sm bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold sticky top-0 z-10">
                        <th className="p-4">Faculty Member & Info ({filteredFaculty.length})</th>
                        <th className="p-4">Courses Capable to Teach</th>
                        <th className="p-4">Hours & Contact</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredFaculty.map((f) => {
                        const facultyMappings = mappings.filter(m => m.facultyId === f.id);
                        const mappedCourses = facultyMappings
                          .map(m => courses.find(c => c.id === m.courseId))
                          .filter((c): c is Course => !!c);

                        return (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="p-4 space-y-1">
                              <div className="font-bold text-slate-800 text-sm">{f.name}</div>
                              <div className="flex flex-wrap gap-1 items-center">
                                {f.designation && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-semibold">
                                    {f.designation}
                                  </span>
                                )}
                                {f.division && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-semibold">
                                    Dept: {f.division}
                                  </span>
                                )}
                                {f.specialization && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-semibold">
                                    Spec: {f.specialization}
                                  </span>
                                )}
                                {!f.designation && !f.division && !f.specialization && (
                                  <span className="text-[10px] text-slate-400 italic">No additional details</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {mappedCourses.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">None assigned yet</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto max-w-xs pr-1 custom-scrollbar">
                                  {mappedCourses.map(c => (
                                    <span key={c.id} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold inline-block" title={c.name}>
                                      {c.courseCode}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-4 space-y-0.5">
                              <div className="font-mono text-slate-500 font-medium">{f.phone}</div>
                              <div className="text-[10px] text-slate-600">
                                Max Load: <strong className="text-blue-600">{f.maxHoursPerDay} hrs/day</strong>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center items-center gap-1.5">
                                <button
                                  onClick={() => handleStartEditFaculty(f)}
                                  className="p-1.5 hover:bg-blue-50 text-blue-500 hover:text-blue-700 rounded-lg transition-all border border-transparent hover:border-blue-100 cursor-pointer"
                                  title="Edit Faculty details & courses"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFaculty(f.id, f.name)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-100 cursor-pointer"
                                  title="Delete Faculty member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredFaculty.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            No faculty members match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: Syllabus Catalog */}
        {activeTab === 'courses' && (() => {
          const filteredCourses = courses.filter(c => {
            const matchesQuery = !courseSearchQuery.trim() ||
              c.courseCode.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
              c.name.toLowerCase().includes(courseSearchQuery.toLowerCase());
            const matchesType = courseTypeFilter === 'all' || c.type === courseTypeFilter;
            return matchesQuery && matchesType;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Academic Syllabus Course Catalog</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Establish subject course listings, credit values, and daily slot hour durations.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={courseSearchQuery}
                      onChange={(e) => setCourseSearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-blue-600 w-44"
                    />
                    {courseSearchQuery && (
                      <button onClick={() => setCourseSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <select
                    value={courseTypeFilter}
                    onChange={(e) => setCourseTypeFilter(e.target.value)}
                    className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-blue-600"
                  >
                    <option value="all">All Types</option>
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Long Duration">Long Duration</option>
                    <option value="Non-Academic">Non-Academic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-fit">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Add Course Syllabus
                  </h4>
                  <form onSubmit={handleAddCourse} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Code *</label>
                        <input
                          type="text"
                          placeholder="Subject Code"
                          value={newCourse.courseCode}
                          onChange={e => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Credits</label>
                        <input
                          type="number"
                          step={0.5}
                          value={newCourse.credits}
                          onChange={e => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Name *</label>
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={newCourse.name}
                        onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                        <select
                          value={newCourse.type}
                          onChange={e => {
                            const type = e.target.value as Course['type'];
                            const durationSlots = type === 'Lab' ? 2 : type === 'Long Duration' ? 4 : 1;
                            setNewCourse({ ...newCourse, type, durationSlots });
                          }}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        >
                          <option value="Theory">Theory</option>
                          <option value="Lab">Lab (2 hours)</option>
                          <option value="Long Duration">Long Duration</option>
                          <option value="Non-Academic">Non-Academic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Consecutive Slots</label>
                        <input
                          type="number"
                          value={newCourse.durationSlots}
                          onChange={e => setNewCourse({ ...newCourse, durationSlots: Number(e.target.value) })}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      Add Syllabus Course
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 border border-slate-100 rounded-2xl overflow-hidden max-h-[520px] overflow-y-auto custom-scrollbar bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold sticky top-0 z-10">
                        <th className="p-4">Subject Code ({filteredCourses.length})</th>
                        <th className="p-4">Subject Name</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Credits</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCourses.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-4 font-mono font-bold text-blue-600">{c.courseCode}</td>
                          <td className="p-4 font-medium text-slate-800">{c.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              c.type === 'Lab'
                                ? 'bg-purple-50 border-purple-100 text-purple-700'
                                : c.type === 'Long Duration'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : c.type === 'Non-Academic'
                                ? 'bg-amber-50 border-amber-100 text-amber-700'
                                : 'bg-blue-50 border-blue-100 text-blue-700'
                            }`}>
                              {c.type} ({c.durationSlots} {c.durationSlots > 1 ? 'hrs' : 'hr'})
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-600 font-medium">{c.credits}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.name)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredCourses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            No courses match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 4: Classrooms */}
        {activeTab === 'rooms' && (() => {
          const filteredRooms = rooms.filter(r => {
            const matchesQuery = !roomSearchQuery.trim() ||
              r.roomNumber.toLowerCase().includes(roomSearchQuery.toLowerCase());
            const matchesType = roomTypeFilter === 'all' || r.type === roomTypeFilter;
            return matchesQuery && matchesType;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Classroom Assignment Registry</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Maintain room numbers, physical room categories, and student seating capacities.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search room..."
                      value={roomSearchQuery}
                      onChange={(e) => setRoomSearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-blue-600 w-40"
                    />
                    {roomSearchQuery && (
                      <button onClick={() => setRoomSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <select
                    value={roomTypeFilter}
                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                    className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-blue-600"
                  >
                    <option value="all">All Categories</option>
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-fit">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Add Classroom
                  </h4>
                  <form onSubmit={handleAddRoom} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Room Code / Number *</label>
                      <input
                        type="text"
                        placeholder="Room Code / Number"
                        value={newRoom.roomNumber}
                        onChange={e => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Room Category</label>
                      <select
                        value={newRoom.type}
                        onChange={e => setNewRoom({ ...newRoom, type: e.target.value as Room['type'] })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      >
                        <option value="Theory">Theory Classroom</option>
                        <option value="Lab">Syllabus Laboratory</option>
                        <option value="Seminar">Seminar Auditorium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Student Seating Capacity</label>
                      <input
                        type="number"
                        value={newRoom.capacity}
                        onChange={e => setNewRoom({ ...newRoom, capacity: Number(e.target.value) })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      Add Classroom
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 border border-slate-100 rounded-2xl overflow-hidden max-h-[520px] overflow-y-auto custom-scrollbar bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold sticky top-0 z-10">
                        <th className="p-4">Room Number ({filteredRooms.length})</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Capacity</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRooms.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-4 font-bold text-slate-800 font-mono">Room {r.roomNumber}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              r.type === 'Lab'
                                ? 'bg-purple-50 border-purple-100 text-purple-700'
                                : r.type === 'Seminar'
                                ? 'bg-amber-50 border-amber-100 text-amber-700'
                                : 'bg-blue-50 border-blue-100 text-blue-700'
                            }`}>
                              {r.type}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-600 font-medium">{r.capacity} Seats</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteRoom(r.id, r.roomNumber)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredRooms.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            No rooms match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 5: Mappings */}
        {activeTab === 'mappings' && (() => {
          const departments = Array.from(new Set(faculty.map(f => f.division).filter(Boolean)));

          const filteredMappings = mappings.filter(m => {
            const f = faculty.find(fac => fac.id === m.facultyId);
            const c = courses.find(crs => crs.id === m.courseId);
            const matchesDept = mappingDeptFilter === 'all' || f?.division === mappingDeptFilter;
            if (!mappingSearchQuery.trim()) return matchesDept;
            const q = mappingSearchQuery.toLowerCase();
            const matchesSearch = (f && f.name.toLowerCase().includes(q)) || 
                                  (c && (c.name.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q)));
            return matchesDept && matchesSearch;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Faculty Course Assignment Maps</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Pair up instructors with specific subject courses they are qualified to teach.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={mappingDeptFilter}
                    onChange={(e) => setMappingDeptFilter(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="all">All Divisions ({mappings.length})</option>
                    {departments.map((dept) => {
                      const count = mappings.filter(m => {
                        const f = faculty.find(fac => fac.id === m.facultyId);
                        return f?.division === dept;
                      }).length;
                      return (
                        <option key={dept} value={dept}>
                          {dept} ({count})
                        </option>
                      );
                    })}
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search mappings..."
                      value={mappingSearchQuery}
                      onChange={(e) => setMappingSearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-blue-600 w-48"
                    />
                    {mappingSearchQuery && (
                      <button onClick={() => setMappingSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-fit">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Define Mappings
                  </h4>
                  <form onSubmit={handleAddMapping} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Select Instructor *</label>
                      <select
                        value={newMapping.facultyId}
                        onChange={e => setNewMapping({ ...newMapping, facultyId: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      >
                        <option value="">-- Choose Instructor --</option>
                        {faculty.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Filter Course list by Semester</label>
                      <select
                        value={selectedSemesterFilterMapping}
                        onChange={e => setSelectedSemesterFilterMapping(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      >
                        <option value="all">All Semesters</option>
                        <option value="1">Semester I</option>
                        <option value="2">Semester II</option>
                        <option value="3">Semester III</option>
                        <option value="4">Semester IV</option>
                        <option value="5">Semester V</option>
                        <option value="6">Semester VI</option>
                        <option value="7">Semester VII</option>
                        <option value="8">Semester VIII</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Select Course Syllabus *</label>
                      <select
                        value={newMapping.courseId}
                        onChange={e => setNewMapping({ ...newMapping, courseId: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      >
                        <option value="">-- Choose Course --</option>
                        {(selectedSemesterFilterMapping === 'all'
                          ? courses
                          : filterCoursesBySemester(courses, semesterCourseMaps, Number(selectedSemesterFilterMapping))
                        ).map(c => (
                          <option key={c.id} value={c.id}>[{c.courseCode}] {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      Define Mapping Link
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 border border-slate-100 rounded-2xl overflow-hidden max-h-[520px] overflow-y-auto custom-scrollbar bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold sticky top-0 z-10">
                        <th className="p-4">Faculty Name ({filteredMappings.length})</th>
                        <th className="p-4">Syllabus Course</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMappings.map((m) => {
                        const f = faculty.find(fac => fac.id === m.facultyId);
                        const c = courses.find(crs => crs.id === m.courseId);

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="p-4 font-bold text-slate-800">{f ? f.name : 'Unknown Faculty'}</td>
                            <td className="p-4 font-medium text-slate-700">
                              {c ? `[${c.courseCode}] ${c.name}` : 'Unknown Course'}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteMapping(m.id)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredMappings.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400">
                            No mappings match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 5.5: Semester Curriculum & Faculty Mapping Master Planner */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
              <div className="space-y-1.5">
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2.5 py-1 rounded-full border border-blue-500/30 font-mono tracking-wider uppercase">
                  Semester Curriculum Master Console
                </span>
                <h3 className="text-lg font-black tracking-tight text-white">
                  Semester {selectedSemesterPlanner} ({selectedSemesterPlanner % 2 === 1 ? 'Odd' : 'Even'} Term) Planner
                </h3>
                <p className="text-xs text-slate-400">
                  Select a semester to review current subjects, assign faculty, or run auto-timetable calculations for active sections.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Smart Relaxation Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setSmartRelaxation(!smartRelaxation)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    smartRelaxation
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-xs'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="When enabled, solver temporarily bypasses Preferred Room constraints if primary classroom slots hit congestion"
                >
                  <Zap className={`w-3.5 h-3.5 ${smartRelaxation ? 'text-amber-400 fill-amber-400/30' : 'text-slate-500'}`} />
                  <span>Smart Relaxation</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                    smartRelaxation ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {smartRelaxation ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={handleResetToStandardSyllabus}
                  className="bg-slate-800 hover:bg-slate-755 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Overwrite current semester syllabus with official CSE recommended preset subjects"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  Load Standard Preset
                </button>

                <button
                  onClick={() => {
                    const batchesInSem = batches.filter(b => b.semester === selectedSemesterPlanner);
                    if (batchesInSem.length === 0) {
                      onShowToast('warning', 'No Active Batches', `There are no batches currently assigned to Semester ${selectedSemesterPlanner}.`);
                      return;
                    }
                    onShowToast('info', 'Invoking Solver Engine', `Simultaneously solving timetables for all ${batchesInSem.length} batch(es) in Semester ${selectedSemesterPlanner} (${batchesInSem.map(b => b.name).join(', ')})...`);

                    const result = generateTimetableForSemester(
                      selectedSemesterPlanner,
                      courses,
                      faculty,
                      rooms,
                      mappings,
                      semesterCourseMaps,
                      entries,
                      batches,
                      { enableSmartRelaxation: smartRelaxation }
                    );

                    onUpdateEntries(result.timetable);
                    if (result.success) {
                      onShowToast('success', 'Generation Completed', result.message);
                    } else {
                      onShowToast('warning', 'Timetable Generated with Warnings', result.message);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-750 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-blue-600/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Instantly generate dynamic, conflict-free weekly timetables for all batches in this semester"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  Generate Semester Timetable
                </button>
              </div>
            </div>

            {/* Semester selector tab bar */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
                const semBatches = batches.filter(b => b.semester === sem);
                const isActive = selectedSemesterPlanner === sem;
                return (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemesterPlanner(sem)}
                    className={`flex-1 min-w-[80px] text-xs py-2.5 rounded-xl font-bold transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    <span>Sem {romans[sem]}</span>
                    <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                      {semBatches.length} Batch(es)
                    </span>
                    {semBatches.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 font-bold"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info card for active batches in selected semester */}
            <div className="bg-blue-50 border border-blue-100/60 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Active Study Sections for Sem {selectedSemesterPlanner}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {batches.filter(b => b.semester === selectedSemesterPlanner).length > 0
                      ? `Impacted batches: ${batches.filter(b => b.semester === selectedSemesterPlanner).map(b => b.name).join(', ')}`
                      : 'No active student sections currently in this semester.'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500">
                  Total Student Load: <strong className="text-slate-800 font-extrabold">
                    {batches.filter(b => b.semester === selectedSemesterPlanner).reduce((sum, b) => sum + (b.studentCount || 0), 0)}
                  </strong> Students
                </span>
              </div>
            </div>

            {/* Split layout: active subjects & adder side panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 columns: Curriculum & Assignments */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  {/* List items */}
                  {(() => {
                    const activeCourseIds = Array.from(new Set(
                      semesterCourseMaps
                        .filter(m => m.semester === selectedSemesterPlanner)
                        .map(m => m.courseId)
                    ));
                    
                    const activeCourses = courses.filter(c => activeCourseIds.includes(c.id));
                    
                    return (
                      <>
                        <div className="border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs p-4 px-6 flex items-center justify-between sticky top-0 z-10">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            Subject Curriculum & Faculty Mapping List
                          </h4>
                          <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 px-2.5 py-0.5 rounded-full font-mono">
                            {activeCourses.length} Subjects
                          </span>
                        </div>

                        {activeCourses.length === 0 ? (
                          <div className="py-12 text-center space-y-2">
                            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs text-slate-500 font-medium">No subjects added to Semester {selectedSemesterPlanner}'s active curriculum yet.</p>
                            <button
                              onClick={handleResetToStandardSyllabus}
                              className="text-xs bg-blue-50 hover:bg-blue-100/50 text-blue-600 font-bold px-3 py-1.5 rounded-xl border border-blue-100 transition-colors cursor-pointer"
                            >
                              Load Standard Preset Subjects
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto custom-scrollbar">
                            {activeCourses.map((course) => {
                              const assignedMap = mappings.find(m => m.courseId === course.id);
                              const assignedFacultyId = assignedMap ? assignedMap.facultyId : '';
                              const mappedFaculty = faculty.find(f => f.id === assignedFacultyId);
                              
                              // Find qualified faculty members who are mapped to teach this course by default
                              const qualifiedFaculty = faculty.filter(f => 
                                mappings.some(m => m.courseId === course.id && m.facultyId === f.id)
                              );
                              
                              const courseMap = semesterCourseMaps.find(
                                m => m.semester === selectedSemesterPlanner && m.courseId === course.id
                              );
                              
                              return (
                                <div key={course.id} className="p-4 px-6 hover:bg-slate-50/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                  <div className="space-y-1 max-w-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                                        {course.courseCode}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${
                                        course.type === 'Lab'
                                          ? 'bg-purple-50 border-purple-100 text-purple-700'
                                          : course.type === 'Long Duration'
                                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                          : 'bg-blue-50 border-blue-100 text-blue-700'
                                      }`}>
                                        {course.type}
                                      </span>
                                      {courseMap && (courseMap.L !== undefined || courseMap.T !== undefined || courseMap.P !== undefined) && (
                                        <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded" title="Lecture-Tutorial-Practical hours per week">
                                          LTP: {courseMap.L || 0}-{courseMap.T || 0}-{courseMap.P || 0}
                                        </span>
                                      )}
                                    </div>
                                    <h5 className="text-xs font-bold text-slate-800">{course.name}</h5>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      Duration: {course.durationSlots} slots ({course.durationSlots} hrs) • Credits: {course.credits}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                                    <div className="space-y-1 flex-1 md:flex-none">
                                      <label className="block text-[10px] text-slate-400 font-semibold uppercase">
                                        Assigned Instructor
                                      </label>
                                      <select
                                        value={assignedFacultyId}
                                        onChange={(e) => handleAssignFacultyPlanner(course.id, e.target.value)}
                                        className="text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-blue-600 w-full md:w-56"
                                      >
                                        <option value="">-- No Instructor Assigned --</option>
                                        {faculty.map((f) => {
                                          const isQualified = qualifiedFaculty.some(q => q.id === f.id);
                                          const load = getFacultyWeeklyLoad(f.id);
                                          return (
                                            <option key={f.id} value={f.id}>
                                              {isQualified ? '⭐ ' : ''}{f.name} ({load} hrs/week)
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                    
                                    <button
                                      onClick={() => handleRemoveCourseFromSemesterPlanner(course.id)}
                                      className="p-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-150 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer mt-5"
                                      title="Remove from current semester curriculum"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Right column: Add New Course & Syllabus Presets */}
              <div className="space-y-6">
                {/* Search & Add existing */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Add Subject to Semester
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={addingCourseSearch}
                        onChange={(e) => setAddingCourseSearch(e.target.value)}
                        placeholder="Search courses in catalog..."
                        className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                      />
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 custom-scrollbar">
                      {(() => {
                        const activeCourseIds = semesterCourseMaps
                          .filter(m => m.semester === selectedSemesterPlanner)
                          .map(m => m.courseId);
                        
                        const filtered = courses.filter(c => {
                          const matchesSearch = c.name.toLowerCase().includes(addingCourseSearch.toLowerCase()) ||
                            c.courseCode.toLowerCase().includes(addingCourseSearch.toLowerCase());
                          const notAlreadyAdded = !activeCourseIds.includes(c.id);
                          return matchesSearch && notAlreadyAdded;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-center text-[10px] text-slate-400">
                              No matching catalog courses.
                            </div>
                          );
                        }

                        return filtered.map((c) => (
                          <div key={c.id} className="p-2.5 px-3 hover:bg-slate-50 flex justify-between items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] font-bold text-slate-500">
                                  {c.courseCode}
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
                                  {c.type}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 truncate">{c.name}</p>
                            </div>
                            <button
                              onClick={() => handleAddCourseToSemesterPlanner(c.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg transition-colors cursor-pointer"
                              title="Add to semester"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Preset Fast-Adder suggestions */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Recommended Subjects for Sem {selectedSemesterPlanner}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    These are standard courses matching the university syllabus guidelines for Semester {selectedSemesterPlanner}. Click the add icon to quickly incorporate them.
                  </p>
                  
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {(() => {
                      const standardPresetIds = DEFAULT_SEM_COURSES[selectedSemesterPlanner] || [];
                      const activeCourseIds = semesterCourseMaps
                        .filter(m => m.semester === selectedSemesterPlanner)
                        .map(m => m.courseId);
                      
                      const recommended = courses.filter(c => 
                        standardPresetIds.includes(c.id) && !activeCourseIds.includes(c.id)
                      );

                      if (recommended.length === 0) {
                        return (
                          <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-[10px] text-slate-400 bg-white">
                            All recommended subjects are currently added!
                          </div>
                        );
                      }

                      return recommended.map((c) => (
                        <div key={c.id} className="p-2.5 bg-white border border-slate-100 rounded-xl flex justify-between items-center gap-2 shadow-xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-[9px] font-bold text-blue-600 font-bold">
                              {c.courseCode}
                            </span>
                            <h5 className="text-[11px] font-bold text-slate-800 truncate" title={c.name}>
                              {c.name}
                            </h5>
                          </div>
                          <button
                            onClick={() => handleAddCourseToSemesterPlanner(c.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded-lg transition-all cursor-pointer"
                            title="Quick add"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Faculty Load Dashboard */}
        {activeTab === 'dashboard' && (
          <FacultyLoadDashboard faculty={faculty} entries={entries} courses={courses} />
        )}

        {/* TAB 7: Regulations & Search Grounding */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Academic Regulations & Guidelines Center</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verify AICTE workload quotas, check UGC compliance rules, and fetch real-time policy guidelines to pin as supplemental notes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grounding Assistant */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-blue-600" />
                  Real-time Policy grounding assistant
                </h4>
                
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Type an academic policy or compliance question below. The search assistant will fetch relevant live guidelines from university registers or national bodies.
                  </p>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search custom regulations or guidelines..."
                        className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchGrounding()}
                      />
                    </div>
                    <button
                      onClick={handleFetchGrounding}
                      disabled={searchLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:bg-slate-300 cursor-pointer"
                    >
                      {searchLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Fetch'
                      )}
                    </button>
                  </div>
                </div>

                {searchLoading && (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white border border-slate-100 rounded-2xl">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium animate-pulse">Consulting academic repositories and search indexes...</p>
                  </div>
                )}

                {!searchLoading && searchResult && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="border-b border-slate-50 pb-2.5 flex justify-between items-center">
                      <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Search Results</h5>
                      <button
                        onClick={handleAddSupplementalNote}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        Pin as Note
                      </button>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans max-h-60 overflow-y-auto pr-1">
                      {searchResult}
                    </div>

                    {searchSources.length > 0 && (
                      <div className="border-t border-slate-50 pt-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Verified Sources</span>
                        <div className="flex flex-wrap gap-1.5">
                          {searchSources.map((src, i) => (
                            <a
                              key={i}
                              href={src.uri}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              rel="noopener noreferrer"
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                            >
                              <span>🔗</span> {src.title || 'Official Document'}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supplemental Policy Notes List */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Supplemental Reference Notes
                </h4>

                {supplementalNotes.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    No custom academic policy notes pinned. Pinned search results will appear here as reference guidelines.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 animate-in fade-in duration-200">
                    {supplementalNotes.map((note) => (
                      <div key={note.id} className="border border-slate-100 bg-slate-50/30 p-4 rounded-xl space-y-2 relative group hover:border-slate-200 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <h5 className="text-xs font-bold text-slate-900 leading-tight">
                            {note.query}
                          </h5>
                          <button
                            onClick={() => handleDeleteSupplementalNote(note.id)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                          {note.content}
                        </p>

                        {note.sources && note.sources.length > 0 && (
                          <div className="pt-2 border-t border-slate-100/60 flex flex-wrap gap-1.5">
                            {note.sources.map((src, idx) => (
                              <a
                                key={idx}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded transition-all"
                              >
                                {src.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: Parallel Section Overlap Diagnostic Tool */}
        {activeTab === 'parallel-diagnostics' && (
          <ParallelSectionDiagnostics
            entries={entries}
            batches={batches}
            faculty={faculty}
            courses={courses}
            rooms={rooms}
            mappings={mappings}
            onUpdateEntries={onUpdateEntries}
            onShowToast={onShowToast}
          />
        )}
      </div>

      {/* Backup & Restore Snapshots Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentEntries={entries}
        onRestoreEntries={onUpdateEntries}
        onShowToast={onShowToast}
      />

      {/* Interactive Promote Batch Course Mapping Modal */}
      {promotingBatch && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Promote Batch: {promotingBatch.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Moving from Semester {promotingBatch.semester} to <span className="font-bold text-blue-600">Semester {promotingBatch.semester + 1}</span>
                </p>
                {promotingQueue.length > 0 && (
                  <span className="inline-block mt-2 text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                    Queue: {promotingQueue.length} remaining
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  setPromotingBatch(null);
                  setPromotingQueue([]);
                  setSelectedBatchIds([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select Syllabus Courses to Map
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextSem = promotingBatch.semester + 1;
                        const defaultIds = DEFAULT_SEM_COURSES[nextSem] || [];
                        const matchedCourseIds = courses
                          .filter(c => defaultIds.includes(c.id))
                          .map(c => c.id);
                        setSelectedCourseIds(matchedCourseIds);
                        onShowToast('info', 'Defaults Loaded', `Selected standard Semester ${nextSem} courses.`);
                      }}
                      className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-2.5 py-1.5 rounded-lg border border-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Sem {promotingBatch.semester + 1} Defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCourseIds([])}
                      className="text-[10px] bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                  {courses.map(course => {
                    const isChecked = selectedCourseIds.includes(course.id);
                    return (
                      <label 
                        key={course.id} 
                        className={`flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors ${isChecked ? 'bg-blue-50/20' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourseIds([...selectedCourseIds, course.id]);
                            } else {
                              setSelectedCourseIds(selectedCourseIds.filter(id => id !== course.id));
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {course.courseCode}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{course.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                            <span>Type: <strong className="text-slate-600">{course.type}</strong></span>
                            <span>•</span>
                            <span>Credits: <strong className="text-slate-600">{course.credits}</strong></span>
                            <span>•</span>
                            <span>Slots: <strong className="text-slate-600">{course.durationSlots}</strong></span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPromotingBatch(null);
                  setPromotingQueue([]);
                  setSelectedBatchIds([]);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPromotion}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors text-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm & Promote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Edit Faculty Modal */}
      {editingFaculty && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Edit Faculty Profile: {editingFaculty.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Modify contact details, max load hours, department division, and map teaching subjects.
                </p>
              </div>
              <button 
                onClick={() => setEditingFaculty(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFaculty} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Instructor Name *</label>
                  <input
                    type="text"
                    required
                    value={editFacultyForm.name}
                    onChange={e => setEditFacultyForm({ ...editFacultyForm, name: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g., Professor, Assistant Professor"
                    value={editFacultyForm.designation}
                    onChange={e => setEditFacultyForm({ ...editFacultyForm, designation: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Contact No. *</label>
                    <input
                      type="text"
                      required
                      value={editFacultyForm.phone}
                      onChange={e => setEditFacultyForm({ ...editFacultyForm, phone: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Teaching Hrs / Day</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={8}
                      value={editFacultyForm.maxHoursPerDay}
                      onChange={e => setEditFacultyForm({ ...editFacultyForm, maxHoursPerDay: Number(e.target.value) })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Division / Department</label>
                    <input
                      type="text"
                      placeholder="Department"
                      value={editFacultyForm.division}
                      onChange={e => setEditFacultyForm({ ...editFacultyForm, division: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Specialization</label>
                    <input
                      type="text"
                      placeholder="Specialization"
                      value={editFacultyForm.specialization}
                      onChange={e => setEditFacultyForm({ ...editFacultyForm, specialization: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Map Course Syllabi They Can Teach
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditFacultyForm({ ...editFacultyForm, selectedCourseIds: courses.map(c => c.id) })}
                        className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-2.5 py-1 transition-colors rounded-lg border border-blue-100 cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFacultyForm({ ...editFacultyForm, selectedCourseIds: [] })}
                        className="text-[10px] bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold px-2.5 py-1 transition-colors rounded-lg border border-slate-200 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[180px] overflow-y-auto bg-slate-50/20">
                    {courses.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-6 font-medium">No courses are registered in the syllabus catalog.</div>
                    ) : (
                      courses.map(course => {
                        const isChecked = editFacultyForm.selectedCourseIds.includes(course.id);
                        return (
                          <label 
                            key={course.id} 
                            className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${isChecked ? 'bg-blue-50/10' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditFacultyForm({
                                      ...editFacultyForm,
                                      selectedCourseIds: [...editFacultyForm.selectedCourseIds, course.id]
                                    });
                                  } else {
                                    setEditFacultyForm({
                                      ...editFacultyForm,
                                      selectedCourseIds: editFacultyForm.selectedCourseIds.filter(id => id !== course.id)
                                    });
                                  }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  {course.courseCode}
                                </span>
                                <span className="text-xs font-bold text-slate-800">{course.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Type: <span className="font-semibold text-slate-600">{course.type}</span> • Credits: <span className="font-semibold text-slate-600">{course.credits}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

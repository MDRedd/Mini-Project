import React, { useState } from 'react';
import { AlertTriangle, Users, Warehouse, CheckCircle2, ArrowRight, RefreshCw, Zap, ShieldAlert, Sparkles, Filter, Shuffle } from 'lucide-react';
import { Batch, Faculty, Course, Room, TimetableEntry, Day, SlotId, FacultyCourseMapping } from '../types';
import { getOccupiedSlots, resolveOverlapConflicts } from '../utils/solver';

interface ParallelSectionDiagnosticsProps {
  entries: TimetableEntry[];
  batches: Batch[];
  faculty: Faculty[];
  courses: Course[];
  rooms: Room[];
  mappings: FacultyCourseMapping[];
  onUpdateEntries: (newEntries: TimetableEntry[]) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export interface ParallelOverlapItem {
  id: string;
  day: Day;
  slotId: SlotId;
  type: 'faculty' | 'room' | 'both';
  batchA: Batch;
  batchB: Batch;
  courseA: Course;
  courseB: Course;
  entryA: TimetableEntry;
  entryB: TimetableEntry;
  facultyObj?: Faculty;
  roomObj?: Room;
}

export default function ParallelSectionDiagnostics({
  entries,
  batches,
  faculty,
  courses,
  rooms,
  mappings,
  onUpdateEntries,
  onShowToast,
}: ParallelSectionDiagnosticsProps) {
  const [filterType, setFilterType] = useState<'all' | 'faculty' | 'room'>('all');
  const [selectedReplacementFaculty, setSelectedReplacementFaculty] = useState<Record<string, string>>({});
  const [selectedReplacementRoom, setSelectedReplacementRoom] = useState<Record<string, string>>({});

  // Detect all parallel section overlap instances
  const overlaps: ParallelOverlapItem[] = [];

  // Group entries by day & slot
  const slotMap = new Map<string, TimetableEntry[]>();
  entries.forEach(e => {
    const course = courses.find(c => c.id === e.courseId);
    const duration = e.colSpan || course?.durationSlots || 1;
    const slots = getOccupiedSlots(e.slotId, duration);

    slots.forEach(s => {
      const key = `${e.day}-${s}`;
      if (!slotMap.has(key)) slotMap.set(key, []);
      slotMap.get(key)!.push(e);
    });
  });

  slotMap.forEach((slotEntries, key) => {
    if (slotEntries.length <= 1) return;

    for (let i = 0; i < slotEntries.length; i++) {
      for (let j = i + 1; j < slotEntries.length; j++) {
        const eA = slotEntries[i];
        const eB = slotEntries[j];

        if (eA.batchId !== eB.batchId) {
          const isFacultyMatch = eA.facultyId === eB.facultyId;
          const isRoomMatch = eA.roomId === eB.roomId;

          if (isFacultyMatch || isRoomMatch) {
            const batchA = batches.find(b => b.id === eA.batchId);
            const batchB = batches.find(b => b.id === eB.batchId);
            const courseA = courses.find(c => c.id === eA.courseId);
            const courseB = courses.find(c => c.id === eB.courseId);
            const fac = faculty.find(f => f.id === eA.facultyId);
            const rm = rooms.find(r => r.id === eA.roomId);

            if (batchA && batchB && courseA && courseB) {
              const overlapType = isFacultyMatch && isRoomMatch ? 'both' : isFacultyMatch ? 'faculty' : 'room';
              overlaps.push({
                id: `overlap-${eA.id}-${eB.id}-${key}`,
                day: eA.day,
                slotId: eA.slotId,
                type: overlapType,
                batchA,
                batchB,
                courseA,
                courseB,
                entryA: eA,
                entryB: eB,
                facultyObj: fac,
                roomObj: rm,
              });
            }
          }
        }
      }
    }
  });

  // Unique deduplicated overlaps
  const filteredOverlaps = overlaps.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'faculty') return item.type === 'faculty' || item.type === 'both';
    if (filterType === 'room') return item.type === 'room' || item.type === 'both';
    return true;
  });

  // Handler to manually reassign faculty for Entry B
  const handleReassignFaculty = (item: ParallelOverlapItem) => {
    const newFacId = selectedReplacementFaculty[item.id];
    if (!newFacId) {
      onShowToast('warning', 'Select Replacement Faculty', 'Please select an available faculty member from the dropdown.');
      return;
    }

    const updated = entries.map(e => {
      if (e.id === item.entryB.id) {
        return { ...e, facultyId: newFacId };
      }
      return e;
    });

    onUpdateEntries(updated);
    const newFac = faculty.find(f => f.id === newFacId);
    onShowToast('success', 'Faculty Reassigned', `Reassigned ${item.batchB.name}'s ${item.courseB.name} to ${newFac?.name}.`);
  };

  // Handler to manually reassign room for Entry B
  const handleReassignRoom = (item: ParallelOverlapItem) => {
    const newRoomId = selectedReplacementRoom[item.id];
    if (!newRoomId) {
      onShowToast('warning', 'Select Replacement Room', 'Please select an available vacant room from the dropdown.');
      return;
    }

    const updated = entries.map(e => {
      if (e.id === item.entryB.id) {
        return { ...e, roomId: newRoomId };
      }
      return e;
    });

    onUpdateEntries(updated);
    const newRm = rooms.find(r => r.id === newRoomId);
    onShowToast('success', 'Room Reassigned', `Reassigned ${item.batchB.name}'s ${item.courseB.name} to Room ${newRm?.roomNumber}.`);
  };

  // One-click Auto Resolve All Parallel Clashes
  const handleAutoResolveAllParallel = () => {
    if (overlaps.length === 0) {
      onShowToast('info', 'No Overlaps', 'No parallel section overlaps found.');
      return;
    }

    const result = resolveOverlapConflicts(
      entries,
      batches,
      courses,
      faculty,
      rooms,
      [],
      mappings
    );

    if (result.fixedCount > 0) {
      onUpdateEntries(result.resolvedEntries);
      onShowToast('success', 'Parallel Overlaps Resolved', `Auto-resolved ${result.fixedCount} resource clashes across parallel sections.`);
    } else {
      onShowToast('info', 'Resolution Status', result.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white">Parallel Section Overlap Diagnostic Tool</h3>
              <span className="bg-rose-500/20 text-rose-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-rose-500/30 font-semibold">
                Admin Conflict Guard
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Detects parallel sections (e.g. CSE-A vs AIML-B) sharing the same faculty or classroom simultaneously, with 1-click reassignment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Parallel Clashes</p>
            <p className={`text-lg font-black font-mono ${overlaps.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {overlaps.length} <span className="text-xs font-normal text-slate-300">Detected</span>
            </p>
          </div>
          <button
            onClick={handleAutoResolveAllParallel}
            disabled={overlaps.length === 0}
            className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Zap className="w-4 h-4 fill-current" />
            Auto-Resolve All Clashes
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter Overlaps:
          </span>
          {(['all', 'faculty', 'room'] as const).map(typeKey => (
            <button
              key={typeKey}
              onClick={() => setFilterType(typeKey)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs capitalize transition-all cursor-pointer ${
                filterType === typeKey
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {typeKey === 'all' ? 'All Parallel Clashes' : typeKey === 'faculty' ? 'Faculty Double-Booking' : 'Room Double-Booking'}
            </button>
          ))}
        </div>
      </div>

      {/* Overlaps Report Cards */}
      {filteredOverlaps.length === 0 ? (
        <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-extrabold text-slate-900">Zero Parallel Section Overlaps Detected</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All parallel student sections are operating independently with dedicated faculty members and isolated classroom spaces.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredOverlaps.map(item => {
            const busyFacultyAtSlot = new Set(
              entries.filter(e => e.day === item.day && e.slotId === item.slotId).map(e => e.facultyId)
            );
            const busyRoomsAtSlot = new Set(
              entries.filter(e => e.day === item.day && e.slotId === item.slotId).map(e => e.roomId)
            );

            const mappedFacultyForCourse = new Set(
              mappings.filter(m => m.courseId === item.courseB.id).map(m => m.facultyId)
            );

            const availableFacultyOptions = faculty
              .filter(f => !busyFacultyAtSlot.has(f.id))
              .sort((a, b) => {
                const aMapped = mappedFacultyForCourse.has(a.id) ? 1 : 0;
                const bMapped = mappedFacultyForCourse.has(b.id) ? 1 : 0;
                return bMapped - aMapped;
              });
            const availableRoomOptions = rooms.filter(r => !busyRoomsAtSlot.has(r.id));

            return (
              <div
                key={item.id}
                className="bg-white border border-rose-200 hover:border-rose-300 rounded-2xl p-4 shadow-2xs space-y-3"
              >
                {/* Header Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      {item.type === 'faculty' ? 'Faculty Conflict' : item.type === 'room' ? 'Room Conflict' : 'Double Collision'}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      {item.day} — Slot {item.slotId}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-slate-500">
                    Conflict Resource: <strong className="text-slate-900 font-bold">{item.facultyObj?.name || 'Faculty'} / Room {item.roomObj?.roomNumber || 'Room'}</strong>
                  </span>
                </div>

                {/* Conflict Side by Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Batch A */}
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Section A</p>
                    <p className="text-xs font-extrabold text-slate-900">{item.batchA.name}</p>
                    <p className="text-xs text-slate-600">{item.courseA.name} ({item.courseA.type})</p>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 font-mono">
                      <span>Instructor: {faculty.find(f => f.id === item.entryA.facultyId)?.name}</span>
                      <span>•</span>
                      <span>Room: {rooms.find(r => r.id === item.entryA.roomId)?.roomNumber}</span>
                    </div>
                  </div>

                  {/* Batch B */}
                  <div className="bg-rose-50/60 border border-rose-200 p-3 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold text-rose-500 uppercase font-mono">Section B (Conflicting)</p>
                    <p className="text-xs font-extrabold text-slate-900">{item.batchB.name}</p>
                    <p className="text-xs text-slate-600">{item.courseB.name} ({item.courseB.type})</p>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 font-mono">
                      <span>Instructor: {faculty.find(f => f.id === item.entryB.facultyId)?.name}</span>
                      <span>•</span>
                      <span>Room: {rooms.find(r => r.id === item.entryB.roomId)?.roomNumber}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Reassignment Actions */}
                <div className="bg-slate-50 p-3 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-slate-200/60">
                  <div className="flex-1 space-y-2">
                    {(item.type === 'faculty' || item.type === 'both') && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 shrink-0">Reassign Instructor:</span>
                        <select
                          value={selectedReplacementFaculty[item.id] || ''}
                          onChange={e => setSelectedReplacementFaculty({ ...selectedReplacementFaculty, [item.id]: e.target.value })}
                          className="flex-1 bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1 text-slate-800"
                        >
                          <option value="">-- Choose Free Faculty ({availableFacultyOptions.length} available) --</option>
                          {availableFacultyOptions.map(f => {
                            const isMapped = mappedFacultyForCourse.has(f.id);
                            return (
                              <option key={f.id} value={f.id}>
                                {isMapped ? '⭐ ' : ''}{f.name} ({isMapped ? 'Mapped Specialist' : f.designation || 'Instructor'})
                              </option>
                            );
                          })}
                        </select>
                        <button
                          onClick={() => handleReassignFaculty(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          Apply Faculty
                        </button>
                      </div>
                    )}

                    {(item.type === 'room' || item.type === 'both') && (
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 shrink-0">Reassign Room:</span>
                        <select
                          value={selectedReplacementRoom[item.id] || ''}
                          onChange={e => setSelectedReplacementRoom({ ...selectedReplacementRoom, [item.id]: e.target.value })}
                          className="flex-1 bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1 text-slate-800"
                        >
                          <option value="">-- Choose Vacant Room ({availableRoomOptions.length} available) --</option>
                          {availableRoomOptions.map(r => (
                            <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.type}, Cap: {r.capacity})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleReassignRoom(item)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          Apply Room
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

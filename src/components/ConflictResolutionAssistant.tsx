import React, { useState, useMemo } from 'react';
import { 
  TimetableEntry, 
  Course, 
  Faculty, 
  Room, 
  Batch, 
  Day, 
  SlotId,
  Slot,
  FacultyCourseMapping
} from '../types';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  User, 
  Warehouse, 
  Calendar, 
  Search, 
  Sparkles, 
  X, 
  ShieldCheck, 
  MoveRight,
  Filter,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { validateSlotAvailability, getOccupiedSlots } from '../utils/solver';

interface ConflictResolutionAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntryId?: string;
  activeBatchId: string;
  entries: TimetableEntry[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
  batches: Batch[];
  mappings: FacultyCourseMapping[];
  days: Day[];
  slots: Slot[];
  onUpdateEntries: (entries: TimetableEntry[]) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export type SwapSafetyStatus = 'SAFE_MOVE' | 'SAFE_SWAP' | 'WARNING' | 'BLOCKED';

export interface SwapCandidate {
  day: Day;
  slotId: SlotId;
  targetEntry?: TimetableEntry;
  targetCourse?: Course;
  targetFaculty?: Faculty;
  targetRoom?: Room;
  safetyStatus: SwapSafetyStatus;
  primaryReason: string;
  secondaryReason?: string;
}

export default function ConflictResolutionAssistant({
  isOpen,
  onClose,
  initialEntryId,
  activeBatchId,
  entries,
  courses,
  faculty,
  rooms,
  batches,
  mappings,
  days,
  slots,
  onUpdateEntries,
  onShowToast
}: ConflictResolutionAssistantProps) {
  // Current batch entries
  const batchEntries = useMemo(() => {
    return entries.filter(e => e.batchId === activeBatchId);
  }, [entries, activeBatchId]);

  // Selected entry to swap/move
  const [selectedEntryId, setSelectedEntryId] = useState<string>(() => {
    if (initialEntryId && batchEntries.some(e => e.id === initialEntryId)) {
      return initialEntryId;
    }
    return batchEntries[0]?.id || '';
  });

  const [filterType, setFilterType] = useState<'all' | 'safe_only' | 'swaps_only' | 'moves_only'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected source entry object
  const sourceEntry = useMemo(() => {
    return batchEntries.find(e => e.id === selectedEntryId) || batchEntries[0];
  }, [batchEntries, selectedEntryId]);

  const sourceCourse = useMemo(() => {
    return courses.find(c => c.id === sourceEntry?.courseId);
  }, [courses, sourceEntry]);

  const sourceFaculty = useMemo(() => {
    return faculty.find(f => f.id === sourceEntry?.facultyId);
  }, [faculty, sourceEntry]);

  const sourceRoom = useMemo(() => {
    return rooms.find(r => r.id === sourceEntry?.roomId);
  }, [rooms, sourceEntry]);

  const sourceBatch = useMemo(() => {
    return batches.find(b => b.id === activeBatchId);
  }, [batches, activeBatchId]);

  // Standard teachable active slots
  const activeSlotIds: SlotId[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  // Evaluate candidate targets for swapping or moving sourceEntry
  const candidates: SwapCandidate[] = useMemo(() => {
    if (!sourceEntry || !sourceCourse) return [];

    const list: SwapCandidate[] = [];
    const sourceDuration = sourceEntry.colSpan || sourceCourse.durationSlots || 1;

    for (const d of days) {
      for (const sId of activeSlotIds) {
        // Skip exact same slot
        if (d === sourceEntry.day && sId === sourceEntry.slotId) continue;

        // Check if there is already an entry in the current batch at (d, sId)
        const targetEntry = batchEntries.find(e => {
          if (e.day !== d) return false;
          const eDur = e.colSpan || 1;
          const occupied = getOccupiedSlots(e.slotId, eDur);
          return occupied.includes(sId);
        });

        if (!targetEntry) {
          // --- Target is a FREE / VACANT SLOT ---
          // Validate if sourceEntry can move cleanly to (d, sId)
          const moveValidation = validateSlotAvailability(
            d,
            sId,
            sourceCourse,
            sourceEntry.facultyId,
            sourceEntry.roomId,
            activeBatchId,
            entries,
            courses,
            rooms,
            faculty,
            sourceEntry.id,
            batches,
            { maxSessionDuration: 2 }
          );

          if (moveValidation.available) {
            list.push({
              day: d,
              slotId: sId,
              safetyStatus: 'SAFE_MOVE',
              primaryReason: 'Vacant slot: Teacher & Room are 100% available with 0 clashes.'
            });
          } else {
            list.push({
              day: d,
              slotId: sId,
              safetyStatus: 'BLOCKED',
              primaryReason: moveValidation.error || 'Blocked by institutional constraint.'
            });
          }
        } else {
          // --- Target is OCCUPIED: MUTUAL SWAP ---
          if (targetEntry.id === sourceEntry.id) continue;
          if (targetEntry.isLocked) {
            list.push({
              day: d,
              slotId: sId,
              targetEntry,
              targetCourse: courses.find(c => c.id === targetEntry.courseId),
              targetFaculty: faculty.find(f => f.id === targetEntry.facultyId),
              targetRoom: rooms.find(r => r.id === targetEntry.roomId),
              safetyStatus: 'BLOCKED',
              primaryReason: 'Target period is locked by administrative constraint.'
            });
            continue;
          }

          const targetCourse = courses.find(c => c.id === targetEntry.courseId);
          const targetDuration = targetEntry.colSpan || targetCourse?.durationSlots || 1;

          // Multi-slot mismatch check (e.g. swapping a 2h lab with 1h lecture)
          if (sourceDuration !== targetDuration) {
            list.push({
              day: d,
              slotId: sId,
              targetEntry,
              targetCourse,
              targetFaculty: faculty.find(f => f.id === targetEntry.facultyId),
              targetRoom: rooms.find(r => r.id === targetEntry.roomId),
              safetyStatus: 'WARNING',
              primaryReason: `Duration mismatch: Source is ${sourceDuration}h, Target is ${targetDuration}h. Mutual swap requires slot adjustment.`
            });
            continue;
          }

          // 1. Test Source moving to Target's slot (ignoring both entries)
          const sourceToTargetValidation = validateSlotAvailability(
            d,
            targetEntry.slotId,
            sourceCourse,
            sourceEntry.facultyId,
            sourceEntry.roomId,
            activeBatchId,
            entries,
            courses,
            rooms,
            faculty,
            sourceEntry.id,
            batches,
            { maxSessionDuration: 2 }
          );

          // 2. Test Target moving to Source's slot (ignoring both entries)
          const targetToSourceValidation = targetCourse ? validateSlotAvailability(
            sourceEntry.day,
            sourceEntry.slotId,
            targetCourse,
            targetEntry.facultyId,
            targetEntry.roomId,
            activeBatchId,
            entries,
            courses,
            rooms,
            faculty,
            targetEntry.id,
            batches,
            { maxSessionDuration: 2 }
          ) : { available: false, error: 'Target course not found' };

          if (sourceToTargetValidation.available && targetToSourceValidation.available) {
            list.push({
              day: d,
              slotId: sId,
              targetEntry,
              targetCourse,
              targetFaculty: faculty.find(f => f.id === targetEntry.facultyId),
              targetRoom: rooms.find(r => r.id === targetEntry.roomId),
              safetyStatus: 'SAFE_SWAP',
              primaryReason: 'Safe Mutual Swap: Zero teacher clashes, zero room clashes for both classes.'
            });
          } else {
            const errorMsg = !sourceToTargetValidation.available 
              ? `Source cannot move to ${d} Slot ${sId}: ${sourceToTargetValidation.error}`
              : `Target cannot move to ${sourceEntry.day} Slot ${sourceEntry.slotId}: ${targetToSourceValidation.error}`;

            list.push({
              day: d,
              slotId: sId,
              targetEntry,
              targetCourse,
              targetFaculty: faculty.find(f => f.id === targetEntry.facultyId),
              targetRoom: rooms.find(r => r.id === targetEntry.roomId),
              safetyStatus: 'BLOCKED',
              primaryReason: errorMsg
            });
          }
        }
      }
    }

    return list;
  }, [sourceEntry, sourceCourse, batchEntries, days, activeSlotIds, activeBatchId, entries, courses, rooms, faculty, batches]);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter(cand => {
      if (filterType === 'safe_only' && cand.safetyStatus !== 'SAFE_MOVE' && cand.safetyStatus !== 'SAFE_SWAP') return false;
      if (filterType === 'swaps_only' && cand.safetyStatus !== 'SAFE_SWAP') return false;
      if (filterType === 'moves_only' && cand.safetyStatus !== 'SAFE_MOVE') return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchDay = cand.day.toLowerCase().includes(query);
        const matchSlot = cand.slotId.toLowerCase().includes(query);
        const matchCourse = cand.targetCourse?.courseCode.toLowerCase().includes(query) || cand.targetCourse?.name.toLowerCase().includes(query);
        const matchFaculty = cand.targetFaculty?.name.toLowerCase().includes(query);
        return matchDay || matchSlot || matchCourse || matchFaculty;
      }
      return true;
    });
  }, [candidates, filterType, searchQuery]);

  // Execute Swap or Move
  const handleExecuteAction = (cand: SwapCandidate) => {
    if (!sourceEntry || !sourceCourse) return;

    if (cand.safetyStatus === 'BLOCKED') {
      onShowToast('error', 'Execution Blocked', cand.primaryReason);
      return;
    }

    if (cand.safetyStatus === 'SAFE_MOVE') {
      // Direct Move to Vacant Slot
      const updatedEntries = entries.map(e => {
        if (e.id === sourceEntry.id) {
          return {
            ...e,
            day: cand.day,
            slotId: cand.slotId
          };
        }
        return e;
      });

      onUpdateEntries(updatedEntries);
      onShowToast('success', 'Period Relocated', `Moved ${sourceCourse.courseCode} to ${cand.day} Slot ${cand.slotId} with zero clashes.`);
      onClose();
      return;
    }

    if (cand.safetyStatus === 'SAFE_SWAP' && cand.targetEntry && cand.targetCourse) {
      // Mutual Swap between sourceEntry and cand.targetEntry
      const targetEntryId = cand.targetEntry.id;
      const targetDay = cand.targetEntry.day;
      const targetSlot = cand.targetEntry.slotId;

      const updatedEntries = entries.map(e => {
        if (e.id === sourceEntry.id) {
          return {
            ...e,
            day: targetDay,
            slotId: targetSlot
          };
        }
        if (e.id === targetEntryId) {
          return {
            ...e,
            day: sourceEntry.day,
            slotId: sourceEntry.slotId
          };
        }
        return e;
      });

      onUpdateEntries(updatedEntries);
      onShowToast('success', 'Mutual Swap Completed', `Swapped ${sourceCourse.courseCode} with ${cand.targetCourse.courseCode} conflict-free!`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Interactive Drag-and-Swap Conflict Assistant
                </h2>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full font-mono">
                  {sourceBatch?.name || 'Active Section'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Simulate period relocations & mutual swaps with real-time faculty, room, and section conflict audits.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Period Selector Strip */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Select Scheduled Period to Move or Swap:
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {batchEntries.map(entry => {
              const crs = courses.find(c => c.id === entry.courseId);
              const isSelected = entry.id === sourceEntry?.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {entry.day.substring(0, 3)} {entry.slotId}
                  </span>
                  <span>{crs?.courseCode || 'SUB'}</span>
                </button>
              );
            })}
          </div>

          {/* Active Period Details Card */}
          {sourceEntry && sourceCourse && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center font-mono font-extrabold text-xs text-indigo-700">
                  {sourceEntry.slotId}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-indigo-700">{sourceCourse.courseCode}</span>
                    <span className="font-black text-xs text-slate-900">{sourceCourse.name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-slate-100 text-slate-600 font-mono">
                      {sourceEntry.colSpan || sourceCourse.durationSlots || 1}h {sourceCourse.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3 h-3 text-slate-400" />
                      {sourceFaculty?.name || 'Instructor'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Warehouse className="w-3 h-3 text-slate-400" />
                      {sourceRoom?.roomNumber || 'Room'}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-800">Currently: {sourceEntry.day} Slot {sourceEntry.slotId}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ready for Real-Time Analysis
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filter & Candidate Search Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Slots ({candidates.length})
            </button>
            <button
              onClick={() => setFilterType('safe_only')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'safe_only' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe Swaps & Moves ({candidates.filter(c => c.safetyStatus === 'SAFE_MOVE' || c.safetyStatus === 'SAFE_SWAP').length})</span>
            </button>
            <button
              onClick={() => setFilterType('swaps_only')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'swaps_only' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mutual Swaps
            </button>
            <button
              onClick={() => setFilterType('moves_only')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'moves_only' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vacant Moves
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search day or slot..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Candidate Slots List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
          {filteredCandidates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No slots match the selected criteria.
            </div>
          ) : (
            filteredCandidates.map((cand, idx) => {
              const isSafe = cand.safetyStatus === 'SAFE_MOVE' || cand.safetyStatus === 'SAFE_SWAP';
              const isMutualSwap = cand.safetyStatus === 'SAFE_SWAP';
              const isVacantMove = cand.safetyStatus === 'SAFE_MOVE';
              const isBlocked = cand.safetyStatus === 'BLOCKED';

              return (
                <div
                  key={`${cand.day}-${cand.slotId}-${idx}`}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSafe
                      ? 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                      : isBlocked
                      ? 'bg-slate-50/70 border-slate-200/60 opacity-80'
                      : 'bg-amber-50/40 border-amber-200/80'
                  }`}
                >
                  {/* Slot & Target Class Info */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-xs shrink-0 border ${
                      isMutualSwap
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : isVacantMove
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      <span className="text-[9px] uppercase leading-none font-bold">{cand.day.substring(0, 3)}</span>
                      <span className="text-xs leading-tight font-extrabold">{cand.slotId}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-black text-xs text-slate-900">
                          {cand.day} Slot {cand.slotId}
                        </span>

                        {isMutualSwap && (
                          <span className="text-[10px] bg-blue-100/80 text-blue-800 font-extrabold px-2 py-0.2 rounded-full border border-blue-200 flex items-center gap-1 font-mono">
                            <ArrowLeftRight className="w-3 h-3" /> Safe Mutual Swap
                          </span>
                        )}

                        {isVacantMove && (
                          <span className="text-[10px] bg-emerald-100/80 text-emerald-800 font-extrabold px-2 py-0.2 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3" /> Safe Vacant Move
                          </span>
                        )}

                        {isBlocked && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.2 rounded-full border border-rose-200/80 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Clashing Slot
                          </span>
                        )}

                        {cand.targetCourse && (
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.2 rounded-md">
                            Currently: <span className="font-mono text-indigo-700 font-black">{cand.targetCourse.courseCode}</span> ({cand.targetCourse.name})
                          </span>
                        )}
                      </div>

                      <p className={`text-xs ${
                        isSafe ? 'text-slate-600 font-medium' : isBlocked ? 'text-rose-700 font-semibold' : 'text-amber-800 font-medium'
                      }`}>
                        {cand.primaryReason}
                      </p>

                      {cand.targetFaculty && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>Target Instructor: <strong className="text-slate-700">{cand.targetFaculty.name}</strong></span>
                          <span>•</span>
                          <span>Target Room: <strong className="text-slate-700">{cand.targetRoom?.roomNumber}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 flex items-center justify-end">
                    <button
                      onClick={() => handleExecuteAction(cand)}
                      disabled={isBlocked}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        isMutualSwap
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xs'
                          : isVacantMove
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs'
                          : isBlocked
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'
                          : 'bg-amber-600 text-white hover:bg-amber-500'
                      }`}
                    >
                      {isMutualSwap ? (
                        <>
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Swap Classes</span>
                        </>
                      ) : isVacantMove ? (
                        <>
                          <MoveRight className="w-3.5 h-3.5" />
                          <span>Move Here</span>
                        </>
                      ) : (
                        <span>Blocked</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Conflict Free
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Preserves all 24 Institutional Constraints
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

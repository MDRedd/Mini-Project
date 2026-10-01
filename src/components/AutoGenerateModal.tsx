import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Layers, 
  Calendar, 
  Users, 
  Building, 
  CheckCircle2, 
  Sliders, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Sun,
  BookOpen,
  Clock,
  DoorOpen,
  RotateCcw
} from 'lucide-react';
import { Batch, SolverOptions } from '../types';

export type GenerationScope = 'all' | 'semester' | 'class';

interface AutoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBatch: Batch | undefined;
  batches: Batch[];
  onGenerate: (scope: GenerationScope, targetSemester?: number, targetBatchId?: string, options?: SolverOptions) => Promise<void>;
  isGenerating: boolean;
  isFrozen: boolean;
}

export default function AutoGenerateModal({
  isOpen,
  onClose,
  activeBatch,
  batches,
  onGenerate,
  isGenerating,
  isFrozen,
}: AutoGenerateModalProps) {
  const [selectedScope, setSelectedScope] = useState<GenerationScope>('all');
  const [selectedSemester, setSelectedSemester] = useState<number>(activeBatch?.semester || 8);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(activeBatch?.id || batches[0]?.id || '');
  
  // Advanced Solver Heuristic Options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [prioritizeMorningTheory, setPrioritizeMorningTheory] = useState<boolean>(true);
  const [enableFacultyResearchDay, setEnableFacultyResearchDay] = useState<boolean>(true);
  const [enableSmartRelaxation, setEnableSmartRelaxation] = useState<boolean>(true);
  const [maxDailyHours, setMaxDailyHours] = useState<number>(4);
  const [clearPrevious, setClearPrevious] = useState<boolean>(true);

  if (!isOpen) return null;

  // Available semesters
  const availableSemesters = [8, 7, 6, 5, 4, 3, 2, 1];

  // Batches in selected semester
  const batchesInSem = batches.filter(b => b.semester === selectedSemester);

  const handleStartGeneration = async () => {
    if (isGenerating || isFrozen) return;
    const options: SolverOptions = {
      prioritizeMorningTheory,
      enableFacultyResearchDay,
      enableSmartRelaxation,
      maxDailyHours,
      clearPrevious
    };
    await onGenerate(selectedScope, selectedSemester, selectedBatchId, options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 selection:bg-[#4F46E5] selection:text-white">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isGenerating && onClose()}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-2xl bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/15 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Auto-Generate Timetable
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full uppercase">
                  CSP Solver
                </span>
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Select target generation scope for 100% overlap-free scheduling
              </p>
            </div>
          </div>

          <button
            onClick={() => !isGenerating && onClose()}
            disabled={isGenerating}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container with Scrollbar */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {/* Instructions */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl flex items-center gap-3 text-xs text-[#475569]">
            <ShieldCheck className="w-5 h-5 text-[#4F46E5] shrink-0" />
            <span>
              The intelligent CSP Backtracking solver coordinates faculty schedules, classroom capacities, and laboratory slots to guarantee zero clashes.
            </span>
          </div>

          {/* 3 Scope Options */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B] block">
              Choose Generation Scope:
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* Option 1: Whole Classes / Campus-Wide */}
              <div
                onClick={() => setSelectedScope('all')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  selectedScope === 'all'
                    ? 'border-[#4F46E5] bg-[#EEF2FF]/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  selectedScope === 'all' ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Building className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#0F172A]">
                      Whole Classes (Full Campus)
                    </h3>
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-[#4F46E5]">
                      {batches.length} Sections
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Generate conflict-free timetables for <strong>ALL {batches.length} classes</strong> across all 8 semesters simultaneously with zero faculty and room overlap errors.
                  </p>
                </div>
                <div className="shrink-0 mt-1">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedScope === 'all' ? 'border-[#4F46E5] bg-[#4F46E5] text-white' : 'border-slate-300'
                  }`}>
                    {selectedScope === 'all' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>

              {/* Option 2: Semester Wise */}
              <div
                onClick={() => setSelectedScope('semester')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 ${
                  selectedScope === 'semester'
                    ? 'border-[#4F46E5] bg-[#EEF2FF]/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    selectedScope === 'semester' ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-[#0F172A]">
                        Semester-Wise Multi-Section
                      </h3>
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-[#7C3AED]">
                        Sem {selectedSemester} ({batchesInSem.length} Sections)
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      Generate timetables for all parallel sections in a specific semester with synchronized shared faculty.
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedScope === 'semester' ? 'border-[#4F46E5] bg-[#4F46E5] text-white' : 'border-slate-300'
                    }`}>
                      {selectedScope === 'semester' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Sub-Selector for Semester */}
                {selectedScope === 'semester' && (
                  <div className="pt-2 border-t border-indigo-100/80 flex items-center gap-3">
                    <span className="text-xs font-bold text-[#0F172A] shrink-0">Select Semester:</span>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(Number(e.target.value))}
                      className="flex-1 bg-white border border-[#C7D2FE] text-xs font-bold text-[#0F172A] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    >
                      {availableSemesters.map(sem => {
                        const count = batches.filter(b => b.semester === sem).length;
                        return (
                          <option key={sem} value={sem}>
                            Semester {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][sem - 1]} ({count} Sections: {batches.filter(b => b.semester === sem).map(b => b.name).join(', ')})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Option 3: Class-Wise (Single Class / Section) */}
              <div
                onClick={() => setSelectedScope('class')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3 ${
                  selectedScope === 'class'
                    ? 'border-[#4F46E5] bg-[#EEF2FF]/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    selectedScope === 'class' ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-[#0F172A]">
                        Class-Wise / Single Section
                      </h3>
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-[#2563EB]">
                        Single Class
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      Generate optimal timetable strictly for one individual class without altering other sections.
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedScope === 'class' ? 'border-[#4F46E5] bg-[#4F46E5] text-white' : 'border-slate-300'
                    }`}>
                      {selectedScope === 'class' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Sub-Selector for Class */}
                {selectedScope === 'class' && (
                  <div className="pt-2 border-t border-indigo-100/80 flex items-center gap-3">
                    <span className="text-xs font-bold text-[#0F172A] shrink-0">Select Class:</span>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="flex-1 bg-white border border-[#C7D2FE] text-xs font-bold text-[#0F172A] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    >
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} (Semester {b.semester} • {b.studentCount || 65} Students)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Solver Controls Accordion */}
          <div className="border border-indigo-100 rounded-2xl bg-gradient-to-b from-indigo-50/40 to-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-indigo-950 hover:bg-indigo-50/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Advanced Solver Heuristics & Preferences</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  AICTE Compliant
                </span>
              </div>
              {showAdvancedOptions ? (
                <ChevronUp className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <AnimatePresence>
              {showAdvancedOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 pt-1 border-t border-indigo-100/60 space-y-3.5 text-xs text-slate-700"
                >
                  {/* Option 1: Prioritize Morning Theory */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2.5 pr-2">
                      <Sun className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Prioritize Heavy Theory in Morning (Slots I & II)</div>
                        <div className="text-[11px] text-slate-500">
                          Schedules core mathematical and analytical subjects (Math, OS, DSA, Networks) during peak cognitive attention hours.
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={prioritizeMorningTheory}
                      onChange={(e) => setPrioritizeMorningTheory(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Option 2: Faculty Research & Mentoring Day */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2.5 pr-2">
                      <BookOpen className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Faculty Research & Mentoring Day</div>
                        <div className="text-[11px] text-slate-500">
                          Ensures instructors have at least 1 non-teaching day per week reserved for academic research and student guidance.
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableFacultyResearchDay}
                      onChange={(e) => setEnableFacultyResearchDay(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Option 3: Max Daily Faculty Load */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div className="flex items-start gap-2.5 pr-2">
                      <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Faculty Max Daily Teaching Hours</div>
                        <div className="text-[11px] text-slate-500">
                          Upper ceiling on continuous teaching workload per day to prevent faculty fatigue.
                        </div>
                      </div>
                    </div>
                    <select
                      value={maxDailyHours}
                      onChange={(e) => setMaxDailyHours(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-300 font-bold text-xs rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={3}>3 Hours/Day</option>
                      <option value={4}>4 Hours/Day (Recommended)</option>
                      <option value={5}>5 Hours/Day</option>
                    </select>
                  </div>

                  {/* Option 4: Smart Classroom Fallback */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2.5 pr-2">
                      <DoorOpen className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Smart Classroom Relaxation</div>
                        <div className="text-[11px] text-slate-500">
                          Dynamically assigns alternative theory rooms when the section's home room is occupied.
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableSmartRelaxation}
                      onChange={(e) => setEnableSmartRelaxation(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* Option 5: Clear Previous Sessions */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2.5 pr-2">
                      <RotateCcw className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Clear Previous Unlocked Sessions</div>
                        <div className="text-[11px] text-slate-500">
                          Replaces existing unlocked slots while strictly preserving all locked sessions.
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={clearPrevious}
                      onChange={(e) => setClearPrevious(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
          <button
            onClick={() => !isGenerating && onClose()}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleStartGeneration}
            disabled={isGenerating || isFrozen}
            className={`px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-black transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer active:scale-95 ${
              isGenerating || isFrozen ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>
              {isGenerating 
                ? 'Solving Conflict-Free Timetable...' 
                : selectedScope === 'all' 
                  ? 'Generate All Classes (Full Campus)' 
                  : selectedScope === 'semester'
                    ? `Generate Semester ${selectedSemester} (${batchesInSem.length} Sections)`
                    : `Generate for ${batches.find(b => b.id === selectedBatchId)?.name || 'Class'}`
              }
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

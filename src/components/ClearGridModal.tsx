import React, { useState } from 'react';
import { 
  Trash2, 
  Sparkles, 
  Layers, 
  RotateCcw, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock,
  GraduationCap,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Batch } from '../types';

interface ClearGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBatch?: Batch;
  onClearSection: (keepLocked: boolean) => void;
  onClearAndGenerateNew: () => void;
  onClearAllUniversity: () => void;
}

export default function ClearGridModal({
  isOpen,
  onClose,
  activeBatch,
  onClearSection,
  onClearAndGenerateNew,
  onClearAllUniversity
}: ClearGridModalProps) {
  const [keepLocked, setKeepLocked] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in print:hidden">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-6 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Clear Timetable Grid
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Target Section: <span className="font-bold text-indigo-700">{activeBatch?.name || 'Current Section'}</span>
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

        {/* Action Choice Cards */}
        <div className="space-y-3">
          {/* OPTION 1: Clear & Generate New (Primary) */}
          <button
            onClick={() => {
              onClearAndGenerateNew();
              onClose();
            }}
            className="w-full text-left p-4 rounded-2xl border-2 border-indigo-600 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white hover:from-blue-100/60 hover:to-indigo-50 transition-all cursor-pointer group shadow-sm flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="font-black text-xs text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Clear & Generate New Timetable
                </span>
                <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-2 py-0.2 rounded-full font-mono">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                Wipes current section slots and immediately runs the CSP solver to build a fresh, 100% conflict-free schedule with newly optimized allocations.
              </p>
            </div>
          </button>

          {/* OPTION 2: Clear Current Section Only (Blank Canvas) */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-slate-200 text-slate-700">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-black text-xs text-slate-900">
                    Clear Current Section (Blank Grid)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-7">
                  Clears all scheduled slots for {activeBatch?.name || 'this section'} so you can drag-and-drop courses manually from scratch.
                </p>
              </div>

              <button
                onClick={() => {
                  onClearSection(keepLocked);
                  onClose();
                }}
                className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                Clear Section
              </button>
            </div>

            {/* Keep locked sessions toggle */}
            <label className="flex items-center gap-2 pl-7 pt-1 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepLocked}
                onChange={e => setKeepLocked(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Preserve locked sessions as fixed anchors</span>
            </label>
          </div>

          {/* OPTION 3: Clear All University Batches */}
          <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/60 transition-all flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-rose-100 text-rose-700">
                  <Building className="w-3.5 h-3.5" />
                </span>
                <span className="font-black text-xs text-rose-950">
                  Clear Entire University Timetable
                </span>
              </div>
              <p className="text-[11px] text-rose-800/80 leading-relaxed pl-7">
                Wipes scheduled periods across all 8 semesters (40 parallel sections).
              </p>
            </div>

            <button
              onClick={() => {
                onClearAllUniversity();
                onClose();
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-white hover:bg-rose-100 border border-rose-200 shadow-2xs transition-all cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Auto-saves state automatically
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

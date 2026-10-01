import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, RotateCcw, Trash2, Shield, Calendar, Clock, CheckCircle2, Download, Upload, AlertCircle } from 'lucide-react';
import { TimetableEntry } from '../types';
import { TimetableSnapshot, getStoredSnapshots, saveSnapshot, deleteSnapshot, clearAllSnapshots } from '../utils/backup';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEntries: TimetableEntry[];
  onRestoreEntries: (entries: TimetableEntry[]) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export default function BackupRestoreModal({
  isOpen,
  onClose,
  currentEntries,
  onRestoreEntries,
  onShowToast,
}: BackupRestoreModalProps) {
  const [snapshots, setSnapshots] = useState<TimetableSnapshot[]>(() => getStoredSnapshots());
  const [newLabel, setNewLabel] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const labelToUse = newLabel.trim() || `Manual Snapshot (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    const updated = saveSnapshot(currentEntries, labelToUse, false);
    setSnapshots(updated);
    setNewLabel('');
    onShowToast('success', 'Backup Saved', `Created backup snapshot "${labelToUse}" with ${currentEntries.length} entries.`);
  };

  const handleRestore = (snap: TimetableSnapshot) => {
    onRestoreEntries(snap.entries);
    onShowToast('success', 'Timetable Restored', `Restored ${snap.entryCount} scheduled entries from backup "${snap.label}".`);
    onClose();
  };

  const handleDelete = (id: string, label: string) => {
    const updated = deleteSnapshot(id);
    setSnapshots(updated);
    setConfirmDeleteId(null);
    onShowToast('info', 'Snapshot Removed', `Deleted backup "${label}".`);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all stored snapshots? This cannot be undone.')) {
      const updated = clearAllSnapshots();
      setSnapshots(updated);
      onShowToast('info', 'Snapshots Cleared', 'All stored timetable backups have been deleted.');
    }
  };

  const handleExportSnapshots = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshots, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `timetable_backups_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('success', 'Backups Exported', 'Downloaded backup snapshots JSON file.');
  };

  const handleImportSnapshots = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            localStorage.setItem('apollo_timetable_snapshots_v1', JSON.stringify(parsed));
            setSnapshots(parsed);
            onShowToast('success', 'Backups Imported', `Loaded ${parsed.length} snapshots from file.`);
          } else {
            throw new Error('Invalid format: expected array of snapshots');
          }
        } catch (err) {
          onShowToast('error', 'Import Failed', 'The uploaded file is not a valid snapshot backup file.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-50/80 text-slate-900 p-5 px-6 flex items-center justify-between shrink-0 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-200/60 shadow-2xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#0F172A]">Restore from Backup / Timetable Snapshots</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Revert to a known good state anytime solver sessions produce an undesirable schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Create New Snapshot Form */}
          <form onSubmit={handleCreateSnapshot} className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Save className="w-4 h-4 text-indigo-600" />
                Create New Timetable Snapshot
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Current active entries: <strong className="text-indigo-600 font-black">{currentEntries.length}</strong>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Snapshot label (e.g. Pre-Solver Backup, Friday State...)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1 bg-white border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="submit"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Save Snapshot
              </button>
            </div>
          </form>

          {/* Stored Snapshots List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-600" />
                Available Backups ({snapshots.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSnapshots}
                  disabled={snapshots.length === 0}
                  className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <label className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs">
                  <Upload className="w-3 h-3" />
                  Import
                  <input type="file" accept=".json" onChange={handleImportSnapshots} className="hidden" />
                </label>
                {snapshots.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-xl transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Backup Snapshots Stored Yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Click 'Save Snapshot' above to store your current timetable state, or run the solver to auto-backup before state changes.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl transition-all flex items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${snap.isAuto ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black text-slate-900 truncate">{snap.label}</h5>
                          <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full ${snap.isAuto ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {snap.isAuto ? 'AUTO' : 'MANUAL'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {snap.formattedTime}
                          </span>
                          <span className="font-extrabold text-slate-700">
                            {snap.entryCount} classes scheduled
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {confirmDeleteId === snap.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-150">
                          <button
                            onClick={() => handleDelete(snap.id, snap.label)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-slate-500 hover:text-slate-800 text-[10px] font-bold px-2 py-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(snap)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Restore
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(snap.id)}
                            className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50/80 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px] font-medium text-slate-500">Backups stored locally in browser storage</span>
          <button
            onClick={onClose}
            className="bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-2xs"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { TimetableEntry } from '../types';

export interface TimetableSnapshot {
  id: string;
  timestamp: string;
  formattedTime: string;
  label: string;
  entryCount: number;
  entries: TimetableEntry[];
  isAuto?: boolean;
}

const STORAGE_KEY = 'apollo_timetable_snapshots_v1';

export function getStoredSnapshots(): TimetableSnapshot[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading snapshots from localStorage', err);
    return [];
  }
}

export function saveSnapshot(
  entries: TimetableEntry[],
  label: string,
  isAuto = false
): TimetableSnapshot[] {
  try {
    const snapshots = getStoredSnapshots();
    const now = new Date();
    const formattedTime = now.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newSnapshot: TimetableSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      formattedTime,
      label,
      entryCount: entries.length,
      entries: JSON.parse(JSON.stringify(entries)),
      isAuto,
    };

    // Keep up to 25 latest snapshots
    const updated = [newSnapshot, ...snapshots].slice(0, 25);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save snapshot', err);
    return getStoredSnapshots();
  }
}

export function deleteSnapshot(id: string): TimetableSnapshot[] {
  try {
    const snapshots = getStoredSnapshots();
    const updated = snapshots.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete snapshot', err);
    return getStoredSnapshots();
  }
}

export function clearAllSnapshots(): TimetableSnapshot[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (err) {
    return [];
  }
}

export function ensureDailySnapshot(entries: TimetableEntry[]): void {
  if (entries.length === 0) return;
  const snapshots = getStoredSnapshots();
  const todayDateStr = new Date().toISOString().split('T')[0];
  const hasToday = snapshots.some(s => s.timestamp.startsWith(todayDateStr));
  if (!hasToday) {
    saveSnapshot(entries, `Daily Auto-Backup (${todayDateStr})`, true);
  }
}

import React, { useState, useMemo } from 'react';
import { 
  Room, 
  Course, 
  Faculty, 
  Batch, 
  TimetableEntry, 
  Day, 
  SlotId,
  Slot
} from '../types';
import { 
  Warehouse, 
  Search, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Users, 
  Building, 
  BookOpen, 
  Clock, 
  Layers, 
  Coffee, 
  UtensilsCrossed,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface RoomOccupancyViewProps {
  rooms: Room[];
  entries: TimetableEntry[];
  courses: Course[];
  faculty: Faculty[];
  batches: Batch[];
  days: Day[];
  slots: Slot[];
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export default function RoomOccupancyView({
  rooms,
  entries,
  courses,
  faculty,
  batches,
  days,
  slots,
  onShowToast
}: RoomOccupancyViewProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Theory' | 'Lab' | 'Seminar'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Active room object
  const activeRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  // Filtered rooms list for search & type
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchSearch = r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [rooms, searchQuery, typeFilter]);

  // Entries scheduled in the active room
  const roomEntries = useMemo(() => {
    if (!activeRoom) return [];
    return entries.filter(e => e.roomId === activeRoom.id);
  }, [entries, activeRoom]);

  // Occupancy statistics
  const stats = useMemo(() => {
    if (!activeRoom) {
      return { totalHours: 0, utilizationRate: 0, freeSlots: 36, uniqueBatches: [], uniqueCourses: [], dailyHours: {} };
    }

    let totalHours = 0;
    const batchIdSet = new Set<string>();
    const courseIdSet = new Set<string>();
    const dailyHours: Record<Day, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    };

    roomEntries.forEach(entry => {
      const course = courses.find(c => c.id === entry.courseId);
      const duration = entry.colSpan || course?.durationSlots || 1;
      totalHours += duration;
      batchIdSet.add(entry.batchId);
      courseIdSet.add(entry.courseId);
      dailyHours[entry.day] = (dailyHours[entry.day] || 0) + duration;
    });

    const totalWeeklySlots = 6 * 6; // 6 days * 6 slots = 36 slots
    const utilizationRate = Math.min(100, Math.round((totalHours / totalWeeklySlots) * 100));
    const freeSlots = Math.max(0, totalWeeklySlots - totalHours);
    const uniqueBatches = batches.filter(b => batchIdSet.has(b.id));
    const uniqueCourses = courses.filter(c => courseIdSet.has(c.id));

    return {
      totalHours,
      utilizationRate,
      freeSlots,
      uniqueBatches,
      uniqueCourses,
      dailyHours
    };
  }, [activeRoom, roomEntries, courses, batches]);

  // Lookup cell entry starting at day & slot
  const getCellEntry = (day: Day, slotId: SlotId) => {
    return roomEntries.find(e => e.day === day && e.slotId === slotId);
  };

  // Check if cell is covered by an ongoing multi-slot entry
  const isCellCovered = (day: Day, slotId: SlotId) => {
    const slotOrder: SlotId[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    const currentIdx = slotOrder.indexOf(slotId);
    if (currentIdx <= 0) return false;

    for (let i = 0; i < currentIdx; i++) {
      const priorSlot = slotOrder[i];
      const entry = getCellEntry(day, priorSlot);
      if (entry) {
        const course = courses.find(c => c.id === entry.courseId);
        const duration = entry.colSpan || course?.durationSlots || 1;
        if (i + duration > currentIdx) {
          return true;
        }
      }
    }
    return false;
  };

  // Course theme helper
  const getStyleForCourse = (course?: Course) => {
    if (!course) return { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (course.type === 'Lab') {
      return {
        bg: 'bg-gradient-to-br from-purple-50/95 via-fuchsia-50/70 to-white border-purple-200/90 shadow-2xs',
        text: 'text-purple-950',
        badge: 'bg-purple-100 text-purple-800 border-purple-200 font-extrabold',
        borderAccent: 'border-l-3.5 border-l-purple-600'
      };
    }
    if (course.type === 'Non-Academic' || course.courseCode.startsWith('ACT-')) {
      return {
        bg: 'bg-gradient-to-br from-amber-50/95 via-orange-50/70 to-white border-amber-200/90 shadow-2xs',
        text: 'text-amber-950',
        badge: 'bg-amber-100 text-amber-800 border-amber-200 font-extrabold',
        borderAccent: 'border-l-3.5 border-l-amber-600'
      };
    }
    return {
      bg: 'bg-gradient-to-br from-indigo-50/95 via-blue-50/70 to-white border-indigo-200/90 shadow-2xs',
      text: 'text-indigo-950',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-extrabold',
      borderAccent: 'border-l-3.5 border-l-indigo-600'
    };
  };

  // --- 1. Export PDF ---
  const handleDownloadRoomPDF = async () => {
    const element = document.getElementById('room-occupancy-capture-area');
    if (!element || !activeRoom) {
      onShowToast('error', 'Export Failed', 'Room timetable capture area not found.');
      return;
    }

    setIsExporting(true);
    onShowToast('info', 'Rendering PDF', `Generating official occupancy schedule for ${activeRoom.roomNumber}...`);

    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('print:hidden')) {
            return false;
          }
          return true;
        }
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });

      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;

      const margin = 8;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);

      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      const marginX = (pdfWidth - scaledWidth) / 2;
      const marginY = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', marginX, marginY, scaledWidth, scaledHeight, undefined, 'FAST');
      const cleanName = activeRoom.roomNumber.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Occupancy_Schedule_${cleanName}.pdf`);

      onShowToast('success', 'PDF Ready', `Occupancy schedule for ${activeRoom.roomNumber} downloaded successfully!`);
    } catch (err) {
      console.error('Room PDF error:', err);
      onShowToast('warning', 'PDF Fallback', 'Direct render encountered an issue. Opening browser Print dialog...');
      window.focus();
      setTimeout(() => window.print(), 100);
    } finally {
      setIsExporting(false);
    }
  };

  // --- 2. Print Schedule ---
  const handlePrintRoom = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.error('Print error:', err);
      onShowToast('error', 'Print Error', 'Could not open browser print dialog.');
    }
  };

  // --- 3. Download PNG ---
  const handleDownloadRoomPNG = async () => {
    const element = document.getElementById('room-occupancy-capture-area');
    if (!element || !activeRoom) return;

    setIsExporting(true);
    onShowToast('info', 'Generating Image', 'Rendering high-resolution PNG snapshot...');

    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('print:hidden')) {
            return false;
          }
          return true;
        }
      });

      const link = document.createElement('a');
      const cleanName = activeRoom.roomNumber.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Occupancy_Schedule_${cleanName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast('success', 'Download Complete', `High-resolution PNG saved for ${activeRoom.roomNumber}!`);
    } catch (err) {
      console.error('PNG error:', err);
      onShowToast('error', 'Export Failed', 'Could not generate PNG image.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Control Bar: Search, Room Type Filter & Room Selector */}
      <section className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 rounded-3xl shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-indigo-600" />
                Room & Lab Occupancy Master Grid
              </h2>
              <span className="text-[10px] bg-emerald-50 border border-emerald-200/60 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full font-mono">
                {rooms.length} Campus Spaces
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Monitor weekly classroom and laboratory occupancy, track vacant slots for extra lectures, and export official room allocation schedules.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handlePrintRoom}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Schedule</span>
            </button>

            <button
              onClick={handleDownloadRoomPNG}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/70 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>PNG Snapshot</span>
            </button>

            <button
              onClick={handleDownloadRoomPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>Export Room PDF</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Strip */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rooms by number, section, or keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
              {(['all', 'Theory', 'Lab', 'Seminar'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    typeFilter === type
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type === 'all' ? 'All Spaces' : type === 'Theory' ? 'Classrooms' : type === 'Lab' ? 'Laboratories' : 'Auditoriums'}
                </button>
              ))}
            </div>

            <select
              value={selectedRoomId}
              onChange={e => setSelectedRoomId(e.target.value)}
              className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl px-3 py-2 text-xs font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer max-w-[260px] truncate"
            >
              {filteredRooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} ({r.type} - {r.capacity} seats)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Selection Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {filteredRooms.slice(0, 16).map(r => {
            const isSelected = r.id === selectedRoomId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoomId(r.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                <Warehouse className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{r.roomNumber}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {r.type}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Room Profile & Space Utilization Banner */}
      {activeRoom && (
        <section className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-sm print:hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Space Details */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-500/20 shrink-0">
                <Warehouse className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {activeRoom.roomNumber}
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-mono border ${
                    activeRoom.type === 'Lab'
                      ? 'bg-purple-50 text-purple-700 border-purple-200/70'
                      : activeRoom.type === 'Seminar'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/70'
                      : 'bg-blue-50 text-blue-700 border-blue-200/70'
                  }`}>
                    {activeRoom.type} Space
                  </span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200/70 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                    Capacity: {activeRoom.capacity} Students
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center flex-wrap gap-3">
                  <span>Room ID: <code className="font-mono text-slate-700">{activeRoom.id}</code></span>
                  <span>•</span>
                  <span>Institutional Status: <span className="text-emerald-600 font-bold">100% Operational & Audio-Visual Ready</span></span>
                </p>
              </div>
            </div>

            {/* Utilization Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl text-center min-w-[95px]">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Utilization</span>
                <span className="text-base font-black text-indigo-700 font-mono">{stats.utilizationRate}%</span>
                <span className="text-[9px] text-slate-500 block">{stats.totalHours}/36 hrs</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl text-center min-w-[95px]">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Occupied</span>
                <span className="text-base font-black text-emerald-700 font-mono">{stats.totalHours} hrs</span>
                <span className="text-[9px] text-slate-500 block">Scheduled</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl text-center min-w-[95px]">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Vacant Slots</span>
                <span className="text-base font-black text-blue-700 font-mono">{stats.freeSlots} slots</span>
                <span className="text-[9px] text-slate-500 block">Available</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl text-center min-w-[95px]">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Sections Hosted</span>
                <span className="text-base font-black text-purple-700 font-mono">{stats.uniqueBatches.length}</span>
                <span className="text-[9px] text-slate-500 block">Batches</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Printable Room Occupancy Schedule Document */}
      <div id="room-occupancy-capture-area" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-2">
        {/* Document Header */}
        <div className="border-b border-slate-200/90 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest uppercase font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                  Facility Space Allocation
                </span>
                <span className="text-xs text-slate-400 font-mono">• Academic Session 2026–2027</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {activeRoom?.roomNumber} — WEEKLY OCCUPANCY SCHEDULE
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Type: {activeRoom?.type} Facility • Capacity: {activeRoom?.capacity} Students • School of Technology
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-500 shrink-0">
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl inline-block text-left">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Weekly Utilization</span>
                <span className="font-extrabold text-emerald-700 text-sm">{stats.totalHours} of 36 Slots Booked ({stats.utilizationRate}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-bold print:text-[10px]">
          <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Theory Lecture (1h)
          </span>
          <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Lab Practical (2h)
          </span>
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Seminar / Activity
          </span>
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available / Open for Booking
          </span>
        </div>

        {/* Weekly Timetable Table Grid */}
        <div className="overflow-x-auto print:overflow-visible w-full">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>

            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-800">
                <th className="p-2 text-center font-black text-slate-700 border-r border-slate-200 text-xs bg-slate-100/60">
                  <span className="uppercase text-[10px] block font-mono text-slate-500">DAY</span>
                  <span className="text-[9px] text-slate-400 font-medium">Slots</span>
                </th>

                {slots.map(slot => {
                  if (slot.id === 'SB') {
                    return (
                      <th key={slot.id} className="p-1 text-center border-r border-slate-200 bg-slate-100/80 text-slate-500 font-bold">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <Coffee className="w-3 h-3 text-amber-700" />
                          <span className="text-[8px] font-mono font-black uppercase text-slate-400">SB</span>
                        </div>
                      </th>
                    );
                  }

                  if (slot.id === 'LB') {
                    return (
                      <th key={slot.id} className="p-1 text-center border-r border-slate-200 bg-slate-100/90 text-slate-600 font-bold">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <UtensilsCrossed className="w-3 h-3 text-emerald-700" />
                          <span className="text-[8px] font-mono font-black uppercase text-slate-500">LB</span>
                        </div>
                      </th>
                    );
                  }

                  return (
                    <th key={slot.id} className="p-2 text-center border-r border-slate-200 bg-slate-50/70">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1 py-0.2 rounded text-[10px] font-mono font-black">
                          {slot.id}
                        </span>
                        <span className="font-black text-xs text-slate-800">{slot.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {slot.time}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/90">
              {days.map(day => {
                const dayTotal = stats.dailyHours[day] || 0;
                return (
                  <tr key={day} className="hover:bg-slate-50/30 transition-colors">
                    {/* Day Column */}
                    <td className="p-2 text-center border-r border-slate-200 font-black text-xs text-slate-800 bg-slate-50/50">
                      <div className="font-bold text-slate-900">{day.substring(0, 3).toUpperCase()}</div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        dayTotal > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
                      }`}>
                        {dayTotal}h booked
                      </span>
                    </td>

                    {slots.map(slot => {
                      if (slot.id === 'SB') {
                        return (
                          <td key={slot.id} className="p-1 border-r border-slate-200 bg-slate-100/40 text-center select-none">
                            <div className="w-full flex items-center justify-center text-[10px] text-slate-300">
                              |
                            </div>
                          </td>
                        );
                      }

                      if (slot.id === 'LB') {
                        return (
                          <td key={slot.id} className="p-1 border-r border-slate-200 bg-slate-100/50 text-center select-none">
                            <div className="w-full flex items-center justify-center text-[10px] text-slate-300">
                              |
                            </div>
                          </td>
                        );
                      }

                      const activeSlotId = slot.id as SlotId;
                      const entry = getCellEntry(day, activeSlotId);
                      const isCovered = isCellCovered(day, activeSlotId);

                      if (isCovered) {
                        return null; // Multi-slot spanned
                      }

                      if (entry) {
                        const course = courses.find(c => c.id === entry.courseId);
                        const teacher = faculty.find(f => f.id === entry.facultyId);
                        const batch = batches.find(b => b.id === entry.batchId);
                        const duration = entry.colSpan || course?.durationSlots || 1;
                        const style = getStyleForCourse(course);

                        return (
                          <td
                            key={activeSlotId}
                            colSpan={duration > 1 ? duration : 1}
                            className="p-1.5 border-r border-slate-200 align-top"
                          >
                            <div className={`p-2.5 rounded-2xl border ${style.bg} ${style.borderAccent} h-full min-h-[70px] flex flex-col justify-between space-y-1`}>
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black border ${style.badge}`}>
                                  {course?.courseCode || 'SUB'}
                                </span>
                                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded font-mono">
                                  {batch?.name || 'Section'}
                                </span>
                              </div>

                              <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
                                {course?.name || 'Scheduled Subject'}
                              </h4>

                              <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[10px] text-slate-600">
                                <span className="font-bold truncate flex items-center gap-1 text-slate-800">
                                  👤 {teacher?.name || 'Instructor'}
                                </span>
                                {duration > 1 && (
                                  <span className="text-[9px] font-mono font-extrabold text-purple-700 bg-purple-100/80 px-1 rounded">
                                    {duration}h Lab
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Vacant / Open Slot
                      return (
                        <td
                          key={activeSlotId}
                          className="p-1.5 border-r border-slate-200 align-top bg-emerald-50/20"
                        >
                          <div className="h-full min-h-[70px] border border-dashed border-emerald-200/80 rounded-2xl p-2 flex flex-col items-center justify-center text-center space-y-0.5">
                            <span className="text-[10px] font-mono text-emerald-700 font-extrabold">VACANT</span>
                            <span className="text-[9px] text-slate-400 font-medium">Open for Scheduling</span>
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

        {/* 4. Subject Allocation Breakdown Table */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Curricular Courses Hosted in this Space
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-black text-[11px]">
                  <th className="py-2.5 px-3">SL</th>
                  <th className="py-2.5 px-3">COURSE CODE</th>
                  <th className="py-2.5 px-3">COURSE TITLE</th>
                  <th className="py-2.5 px-3">TYPE</th>
                  <th className="py-2.5 px-3">SECTIONS USING ROOM</th>
                  <th className="py-2.5 px-3 text-center">HOURS / WEEK</th>
                  <th className="py-2.5 px-3">PRIMARY INSTRUCTORS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.uniqueCourses.map((course, idx) => {
                  const courseEntries = roomEntries.filter(e => e.courseId === course.id);
                  const totalHrs = courseEntries.reduce((sum, e) => sum + (e.colSpan || course.durationSlots || 1), 0);
                  const batchNames = Array.from(new Set(courseEntries.map(e => {
                    const b = batches.find(batch => batch.id === e.batchId);
                    return b?.name || e.batchId;
                  }))).join(', ');

                  const teacherNames = Array.from(new Set(courseEntries.map(e => {
                    const t = faculty.find(fac => fac.id === e.facultyId);
                    return t?.name || e.facultyId;
                  }))).join(', ');

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-black text-indigo-700">{course.courseCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{course.name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          course.type === 'Lab' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {course.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{batchNames}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-800">{totalHrs} hrs/wk</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{teacherNames}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Official Verification Block */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-12">
            <div className="h-10"></div>
            <div className="border-t border-slate-300 pt-1.5 font-bold text-slate-800">
              Facility / Lab In-Charge
            </div>
            <div className="text-[10px] text-slate-400">School of Technology</div>
          </div>

          <div className="space-y-12">
            <div className="h-10"></div>
            <div className="border-t border-slate-300 pt-1.5 font-bold text-slate-800">
              Timetable Committee Coordinator
            </div>
            <div className="text-[10px] text-slate-400">Academic Planning Division</div>
          </div>

          <div className="space-y-12">
            <div className="h-10"></div>
            <div className="border-t border-slate-300 pt-1.5 font-bold text-slate-800">
              Estate & Space Officer
            </div>
            <div className="text-[10px] text-slate-400">Campus Administration</div>
          </div>
        </div>
      </div>
    </div>
  );
}

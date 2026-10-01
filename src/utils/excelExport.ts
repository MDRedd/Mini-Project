import * as XLSX from 'xlsx';
import { TimetableEntry, Batch, Course, Faculty, Room, Day, SlotId, FacultyCourseMapping } from '../types';

export function exportTimetableToExcel({
  entries,
  batches,
  courses,
  faculty,
  rooms,
  activeBatchId,
  classTeacherId,
  mappings,
}: {
  entries: TimetableEntry[];
  batches: Batch[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
  activeBatchId: string;
  classTeacherId: string;
  mappings?: FacultyCourseMapping[];
}) {
  const activeBatch = batches.find(b => b.id === activeBatchId);
  const batchName = activeBatch ? activeBatch.name : 'Section';
  const semesterNum = activeBatch?.semester || 1;

  // Create empty workbook
  const wb = XLSX.utils.book_new();

  // Helper for resolving exact faculty
  const getFaculty = (facultyId?: string, courseId?: string): Faculty | undefined => {
    if (facultyId) {
      const match = faculty.find(f => f.id === facultyId);
      if (match) return match;
    }
    if (courseId && mappings) {
      const mapped = mappings.find(m => m.courseId === courseId);
      if (mapped) {
        const match = faculty.find(f => f.id === mapped.facultyId);
        if (match) return match;
      }
    }
    return undefined;
  };

  // --- SHEET 1: ACTIVE BATCH WEEKLY TIMETABLE MATRIX ---
  const sheet1Data: any[][] = [];

  sheet1Data.push(['TIMEPRO — TIMETABLE MANAGEMENT SYSTEM']);
  sheet1Data.push([`ACADEMIC CLASS TIMETABLE — SEMESTER ${semesterNum} (${batchName.toUpperCase()})`]);
  sheet1Data.push([`Generated On: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`]);
  
  if (classTeacherId) {
    const teacher = faculty.find(f => f.id === classTeacherId);
    if (teacher) {
      sheet1Data.push([`Class Teacher: ${teacher.name} | Contact: ${teacher.phone || 'N/A'} | Specialization: ${teacher.specialization || 'CSE'}`]);
    } else {
      sheet1Data.push([]);
    }
  } else {
    sheet1Data.push([]);
  }
  sheet1Data.push([]); // blank separator

  // Period / Slot Headers
  sheet1Data.push([
    'Day / Time',
    'Slot I (09:00 - 10:00)',
    'Slot II (10:00 - 11:00)',
    'Short Break (11:00 - 11:10)',
    'Slot III (11:10 - 12:10)',
    'Slot IV (12:10 - 01:00)',
    'Lunch Break (01:00 - 02:00)',
    'Slot V (02:00 - 03:00)',
    'Slot VI (03:00 - 04:00)'
  ]);

  const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slotSequence: ('I' | 'II' | 'SB' | 'III' | 'IV' | 'LB' | 'V' | 'VI')[] = [
    'I', 'II', 'SB', 'III', 'IV', 'LB', 'V', 'VI'
  ];

  DAYS.forEach(day => {
    const row: string[] = [day];
    const skippedSlotsForDay: string[] = [];

    slotSequence.forEach(slotId => {
      if (slotId === 'SB') {
        row.push('SHORT BREAK');
        return;
      }
      if (slotId === 'LB') {
        row.push('LUNCH BREAK');
        return;
      }

      if (skippedSlotsForDay.includes(slotId)) {
        row.push('(Continuous Session)');
        return;
      }

      // Check if there is an entry starting at this slot
      const entry = entries.find(
        e => e.day === day && e.slotId === slotId && e.batchId === activeBatchId
      );

      if (entry) {
        const course = courses.find(c => c.id === entry.courseId);
        const instructor = getFaculty(entry.facultyId, entry.courseId);
        const room = rooms.find(r => r.id === entry.roomId);

        if (course) {
          let cellText = `[${course.courseCode}] ${course.name}`;
          if (instructor) {
            cellText += `\nProf: ${instructor.name}`;
          }
          if (room) {
            cellText += `\nRoom: ${room.roomNumber}`;
          }
          row.push(cellText);

          // Handle multi-slot colSpan
          const activeSlotsOnly: string[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];
          const currentActiveIdx = activeSlotsOnly.indexOf(slotId);
          const duration = entry.colSpan || course.durationSlots || 1;
          if (currentActiveIdx !== -1) {
            for (let i = 1; i < duration; i++) {
              const nextSlotId = activeSlotsOnly[currentActiveIdx + i];
              if (nextSlotId) {
                skippedSlotsForDay.push(nextSlotId);
              }
            }
          }
        } else {
          row.push('Empty Slot');
        }
      } else {
        row.push('— Free Period —');
      }
    });

    sheet1Data.push(row);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [
    { wch: 14 }, // Day
    { wch: 28 }, // Slot I
    { wch: 28 }, // Slot II
    { wch: 16 }, // Short Break
    { wch: 28 }, // Slot III
    { wch: 28 }, // Slot IV
    { wch: 16 }, // Lunch Break
    { wch: 28 }, // Slot V
    { wch: 28 }  // Slot VI
  ];

  XLSX.utils.book_append_sheet(wb, ws1, `${batchName} Timetable`);


  // --- SHEET 2: SECTION FACULTY & COURSE DIRECTORY ---
  const sheet2Data: any[][] = [];
  sheet2Data.push([`FACULTY & COURSE DIRECTORY — ${batchName.toUpperCase()} (SEMESTER ${semesterNum})`]);
  sheet2Data.push([`Generated On: ${new Date().toLocaleDateString()}`]);
  sheet2Data.push([]); // blank row

  sheet2Data.push([
    'Sl. No.',
    'Course Code',
    'Course Name',
    'Course Type',
    'Credits',
    'Duration (Hrs)',
    'Assigned Faculty Name',
    'Designation / Role',
    'Specialization',
    'Contact Phone',
    'Classroom / Lab'
  ]);

  const activeBatchEntries = entries.filter(e => e.batchId === activeBatchId);
  const activeCourseIds = Array.from(new Set(activeBatchEntries.map(e => e.courseId)));

  activeCourseIds.forEach((courseId, idx) => {
    const course = courses.find(c => c.id === courseId);
    const entryWithCourse = activeBatchEntries.find(e => e.courseId === courseId);
    const instructor = getFaculty(entryWithCourse?.facultyId, courseId);
    const room = rooms.find(r => r.id === entryWithCourse?.roomId);

    if (course) {
      sheet2Data.push([
        idx + 1,
        course.courseCode,
        course.name,
        course.type,
        course.credits || 3,
        course.durationSlots || 1,
        instructor ? instructor.name : 'Not Assigned',
        instructor ? instructor.designation || 'Faculty' : 'N/A',
        instructor ? instructor.specialization || 'N/A' : 'N/A',
        instructor ? instructor.phone : 'N/A',
        room ? `Room ${room.roomNumber} (${room.type})` : 'Classroom'
      ]);
    }
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 15 }, // Code
    { wch: 35 }, // Name
    { wch: 14 }, // Type
    { wch: 10 }, // Credits
    { wch: 14 }, // Duration
    { wch: 25 }, // Faculty Name
    { wch: 20 }, // Designation
    { wch: 24 }, // Specialization
    { wch: 18 }, // Phone
    { wch: 24 }  // Room
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Faculty Directory');


  // --- SHEET 3: MASTER ALL BATCHES TIMETABLE ---
  const sheet3Data: any[][] = [];
  sheet3Data.push(['MASTER CAMPUS TIMETABLE REGISTRY — ALL BATCHES']);
  sheet3Data.push([`Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`]);
  sheet3Data.push([]); // blank row

  sheet3Data.push([
    'Day',
    'Period Slot',
    'Batch / Section',
    'Course Code',
    'Course Name',
    'Course Type',
    'Instructor Name',
    'Instructor Phone',
    'Classroom / Lab',
    'Room Type',
    'Duration (Hrs)',
    'Status'
  ]);

  const sortedEntries = [...entries].sort((a, b) => {
    const dayOrder: Record<Day, number> = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const slotOrder: Record<SlotId, number> = { 'I': 1, 'II': 2, 'SB': 3, 'III': 4, 'IV': 5, 'LB': 6, 'V': 7, 'VI': 8 };

    const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
    if (dayDiff !== 0) return dayDiff;

    const slotDiff = (slotOrder[a.slotId] || 0) - (slotOrder[b.slotId] || 0);
    if (slotDiff !== 0) return slotDiff;

    const bA = batches.find(x => x.id === a.batchId)?.name || '';
    const bB = batches.find(x => x.id === b.batchId)?.name || '';
    return bA.localeCompare(bB);
  });

  sortedEntries.forEach(entry => {
    const batch = batches.find(b => b.id === entry.batchId);
    const course = courses.find(c => c.id === entry.courseId);
    const instructor = getFaculty(entry.facultyId, entry.courseId);
    const room = rooms.find(r => r.id === entry.roomId);

    sheet3Data.push([
      entry.day,
      entry.slotId,
      batch ? batch.name : 'N/A',
      course ? course.courseCode : 'N/A',
      course ? course.name : 'N/A',
      course ? course.type : 'N/A',
      instructor ? instructor.name : 'N/A',
      instructor ? instructor.phone : 'N/A',
      room ? `Room ${room.roomNumber}` : 'N/A',
      room ? room.type : 'N/A',
      entry.colSpan || 1,
      entry.isLocked ? 'Locked' : 'Scheduled'
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 12 }, // Day
    { wch: 12 }, // Slot
    { wch: 18 }, // Batch
    { wch: 15 }, // Code
    { wch: 30 }, // Name
    { wch: 12 }, // Type
    { wch: 24 }, // Instructor
    { wch: 16 }, // Mobile
    { wch: 18 }, // Room
    { wch: 14 }, // Room Type
    { wch: 14 }, // Duration
    { wch: 12 }  // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws3, 'Campus Master Registry');


  // --- SHEET 4: FACULTY WORKLOAD INDEX ---
  const sheet4Data: any[][] = [];
  sheet4Data.push(['FACULTY TEACHING WORKLOAD & ALLOCATION STATUS']);
  sheet4Data.push([`Generated On: ${new Date().toLocaleDateString()}`]);
  sheet4Data.push([]); // blank row

  sheet4Data.push([
    'Instructor Name',
    'Department / Division',
    'Specialization',
    'Max Daily Limit',
    'Total Weekly Periods',
    'Weekly Hours (Est.)',
    'Assigned Sections'
  ]);

  faculty.forEach(f => {
    const assigned = entries.filter(e => e.facultyId === f.id);
    const assignedBatches = Array.from(new Set(assigned.map(e => {
      const b = batches.find(batch => batch.id === e.batchId);
      return b ? b.name : '';
    }))).filter(Boolean).join(', ');

    let periods = 0;
    assigned.forEach(e => {
      periods += (e.colSpan || 1);
    });
    const hours = (periods * 50) / 60;

    sheet4Data.push([
      f.name,
      f.division || 'CSE',
      f.specialization || 'N/A',
      `${f.maxHoursPerDay} hrs/day`,
      periods,
      parseFloat(hours.toFixed(1)),
      assignedBatches || 'None'
    ]);
  });

  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
  ws4['!cols'] = [
    { wch: 25 }, // Name
    { wch: 22 }, // Division
    { wch: 24 }, // Specialization
    { wch: 16 }, // Max Limit
    { wch: 20 }, // Weekly Periods
    { wch: 20 }, // Weekly Hours
    { wch: 35 }  // Assigned Batches
  ];

  XLSX.utils.book_append_sheet(wb, ws4, 'Faculty Workload Status');

  // Trigger file download
  const cleanBatchName = batchName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Academic_Timetable_${cleanBatchName}_Sem_${semesterNum}.xlsx`);
}

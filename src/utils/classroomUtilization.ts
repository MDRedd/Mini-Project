import { Room, TimetableEntry, Course, Batch, Day, SlotId } from '../types';
import { getOccupiedSlots } from './solver';

export interface RoomUtilizationData {
  room: Room;
  totalSlots: number; // usually 36 (6 days * 6 slots)
  occupiedSlots: number;
  idleSlots: number;
  occupancyPercentage: number;
  peakDay: Day;
  scheduledBatchesCount: number;
  scheduledCoursesCount: number;
  occupiedSlotDetails: {
    day: Day;
    slotId: SlotId;
    courseName: string;
    batchName: string;
  }[];
}

export interface RoomUtilizationSummary {
  roomsData: RoomUtilizationData[];
  overallAverageOccupancy: number;
  theoryAverageOccupancy: number;
  labAverageOccupancy: number;
  mostUtilizedRoom?: RoomUtilizationData;
  leastUtilizedRoom?: RoomUtilizationData;
  totalCapacity: number;
  utilizedCapacity: number;
}

const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function calculateClassroomUtilization(
  rooms: Room[],
  entries: TimetableEntry[],
  courses: Course[],
  batches: Batch[]
): RoomUtilizationSummary {
  const totalSlotsPerRoom = 36; // 6 days * 6 slots

  const roomsData: RoomUtilizationData[] = rooms.map(room => {
    const roomEntries = entries.filter(e => e.roomId === room.id);
    const occupiedSlotMap = new Map<string, { day: Day; slotId: SlotId; courseName: string; batchName: string }>();

    const dayCounts: Record<Day, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    const uniqueBatches = new Set<string>();
    const uniqueCourses = new Set<string>();

    roomEntries.forEach(entry => {
      const course = courses.find(c => c.id === entry.courseId);
      const batch = batches.find(b => b.id === entry.batchId);
      const duration = course?.durationSlots || 1;
      const slots = getOccupiedSlots(entry.slotId, duration);

      if (batch) uniqueBatches.add(batch.id);
      if (course) uniqueCourses.add(course.id);

      slots.forEach(slotId => {
        const key = `${entry.day}-${slotId}`;
        occupiedSlotMap.set(key, {
          day: entry.day,
          slotId,
          courseName: course?.name || 'Scheduled Course',
          batchName: batch?.name || 'Section',
        });
        dayCounts[entry.day] = (dayCounts[entry.day] || 0) + 1;
      });
    });

    const occupiedSlots = occupiedSlotMap.size;
    const idleSlots = Math.max(0, totalSlotsPerRoom - occupiedSlots);
    const occupancyPercentage = Math.round((occupiedSlots / totalSlotsPerRoom) * 100);

    // Find peak day
    let peakDay: Day = 'Monday';
    let maxDayCount = -1;
    DAYS.forEach(day => {
      if (dayCounts[day] > maxDayCount) {
        maxDayCount = dayCounts[day];
        peakDay = day;
      }
    });

    return {
      room,
      totalSlots: totalSlotsPerRoom,
      occupiedSlots,
      idleSlots,
      occupancyPercentage,
      peakDay,
      scheduledBatchesCount: uniqueBatches.size,
      scheduledCoursesCount: uniqueCourses.size,
      occupiedSlotDetails: Array.from(occupiedSlotMap.values()),
    };
  });

  // Calculate Averages
  const totalRooms = roomsData.length || 1;
  const overallAverageOccupancy = Math.round(
    roomsData.reduce((sum, r) => sum + r.occupancyPercentage, 0) / totalRooms
  );

  const theoryRooms = roomsData.filter(r => r.room.type === 'Theory');
  const labRooms = roomsData.filter(r => r.room.type === 'Lab');

  const theoryAverageOccupancy = theoryRooms.length > 0
    ? Math.round(theoryRooms.reduce((sum, r) => sum + r.occupancyPercentage, 0) / theoryRooms.length)
    : 0;

  const labAverageOccupancy = labRooms.length > 0
    ? Math.round(labRooms.reduce((sum, r) => sum + r.occupancyPercentage, 0) / labRooms.length)
    : 0;

  const sortedByOccupancy = [...roomsData].sort((a, b) => b.occupancyPercentage - a.occupancyPercentage);
  const mostUtilizedRoom = sortedByOccupancy[0];
  const leastUtilizedRoom = sortedByOccupancy[sortedByOccupancy.length - 1];

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const utilizedCapacity = roomsData.reduce((sum, r) => {
    return sum + (r.occupiedSlots > 0 ? r.room.capacity : 0);
  }, 0);

  return {
    roomsData,
    overallAverageOccupancy,
    theoryAverageOccupancy,
    labAverageOccupancy,
    mostUtilizedRoom,
    leastUtilizedRoom,
    totalCapacity,
    utilizedCapacity,
  };
}

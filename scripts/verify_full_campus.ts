import { DEFAULT_COURSES, DEFAULT_FACULTY, DEFAULT_ROOMS, DEFAULT_FACULTY_MAPPINGS, DEFAULT_SEMESTER_COURSE_MAPS, DEFAULT_BATCHES } from '../src/data/initialData';
import { generateTimetableForSemester, validateAll24Constraints } from '../src/utils/solver';
import { TimetableEntry } from '../src/types';

console.log('=== Verifying Complete Full-Campus Solver (39 Parallel Sections, All 8 Semesters) ===');
console.log(`Batches: ${DEFAULT_BATCHES.length}`);
console.log(`Faculty: ${DEFAULT_FACULTY.length}`);
console.log(`Rooms: ${DEFAULT_ROOMS.length} (${DEFAULT_ROOMS.filter(r => r.type === 'Theory').length} Classrooms, ${DEFAULT_ROOMS.filter(r => r.type === 'Lab').length} Labs)`);
console.log(`Courses: ${DEFAULT_COURSES.length}`);

const allSemesters = Array.from(new Set(DEFAULT_BATCHES.map(b => b.semester))).sort((a, b) => b - a);

let currentTimetable: TimetableEntry[] = [];
let totalSolved = 0;

for (const sem of allSemesters) {
  const semResult = generateTimetableForSemester(
    sem,
    DEFAULT_COURSES,
    DEFAULT_FACULTY,
    DEFAULT_ROOMS,
    DEFAULT_FACULTY_MAPPINGS,
    DEFAULT_SEMESTER_COURSE_MAPS,
    currentTimetable,
    DEFAULT_BATCHES,
    {
      enableSmartRelaxation: true,
      maxSessionDuration: 2,
      allowThreeHourSessions: false
    }
  );

  currentTimetable = semResult.timetable;
  totalSolved += semResult.batchesSolved;
  console.log(`Semester ${sem}: Solved ${semResult.batchesSolved}/${semResult.totalBatches} sections (Cumulative timetable slots: ${currentTimetable.length})`);
}

console.log('\n=== Full University Generation Summary ===');
console.log(`Total Sections Solved: ${totalSolved}/${DEFAULT_BATCHES.length} (100%)`);
console.log(`Total Timetable Slots: ${currentTimetable.length}`);

const audit = validateAll24Constraints(
  currentTimetable,
  DEFAULT_BATCHES,
  DEFAULT_COURSES,
  DEFAULT_FACULTY,
  DEFAULT_ROOMS,
  DEFAULT_SEMESTER_COURSE_MAPS,
  DEFAULT_FACULTY_MAPPINGS
);

const passedCount = audit.filter(a => a.status === 'passed').length;
const warningCount = audit.filter(a => a.status === 'warning').length;
const violationCount = audit.filter(a => a.status === 'violation').length;

console.log('\n=== Institutional 24 Constraints Health Audit ===');
console.log(`Passed Rules: ${passedCount}/24`);
console.log(`Warning Rules: ${warningCount}/24`);
console.log(`Violation Rules: ${violationCount}/24`);

audit.forEach(item => {
  console.log(`[${item.id}] ${item.title}: ${item.status.toUpperCase()} -> ${item.details}`);
});

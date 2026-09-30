import { Course, Faculty, TimetableEntry, FacultyCourseMapping } from '../types';
import { Users, Phone, Hash, BookOpen } from 'lucide-react';

interface BottomFacultyTableProps {
  entries: TimetableEntry[];
  allCourses: Course[];
  allFaculty: Faculty[];
  roomNumber: string;
  mappings?: FacultyCourseMapping[];
}

export default function BottomFacultyTable({
  entries,
  allCourses,
  allFaculty,
  roomNumber,
  mappings,
}: BottomFacultyTableProps) {
  // Extract unique course IDs from active entries
  const activeCourseIds = Array.from(new Set(entries.map((e) => e.courseId)));

  // Build rows based on courses scheduled
  const rows = activeCourseIds
    .map((courseId) => {
      const course = allCourses.find((c) => c.id === courseId);
      // Find the exact faculty from scheduled entries or directory mappings
      const entryWithCourse = entries.find((e) => e.courseId === courseId && e.facultyId);
      const facultyId = entryWithCourse?.facultyId || mappings?.find(m => m.courseId === courseId)?.facultyId;
      const faculty = allFaculty.find((f) => f.id === facultyId);

      if (!course) return null;

      return {
        courseCode: course.courseCode,
        courseName: course.name,
        facultyName: faculty ? faculty.name : 'Not Assigned',
        facultyPhone: faculty ? faculty.phone : 'N/A',
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    // Sort alphabetically by course code
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode));

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden mt-6" id="faculty-summary-table">
      <div className="bg-slate-50/70 border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 tracking-tight text-sm">Faculty & Course Directory</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Active instructors scheduled for sessions in Room {roomNumber}
            </p>
          </div>
        </div>
        <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-3 py-1 rounded-full font-mono">
          {rows.length} Courses Scheduled
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
              <th className="px-6 py-3.5 w-16">SL No.</th>
              <th className="px-6 py-3.5 w-36">Subject Code</th>
              <th className="px-6 py-3.5">Subject Name</th>
              <th className="px-6 py-3.5">Assigned Instructor</th>
              <th className="px-6 py-3.5 w-48">Contact Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 bg-slate-50/30">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
                  <span className="font-semibold text-xs">No courses are currently scheduled in this timetable.</span>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.courseCode} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-3.5 font-mono font-black text-indigo-600">
                    <span className="bg-indigo-50/80 border border-indigo-100/80 px-2 py-0.5 rounded-lg">
                      {row.courseCode}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">{row.courseName}</td>
                  <td className="px-6 py-3.5 text-slate-800 font-bold flex items-center gap-1.5 pt-4">
                    <span className="text-slate-400 text-[11px]">👤</span>
                    <span>{row.facultyName}</span>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-medium text-slate-500">
                    {row.facultyPhone}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

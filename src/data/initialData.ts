import { Slot, Day, Batch, Faculty, Room, Course, FacultyCourseMapping, SemesterCourseMap, TimetableEntry } from '../types';

export const DEFAULT_DAYS: Day[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const DEFAULT_SLOTS: Slot[] = [
  { id: 'I', name: 'Slot I', time: '09:00 – 10:00', duration: '1 Hour', isActive: true, isBreak: false },
  { id: 'II', name: 'Slot II', time: '10:00 – 11:00', duration: '1 Hour', isActive: true, isBreak: false },
  { id: 'SB', name: 'Short Break', time: '11:00 – 11:10', duration: '10 mins', isActive: false, isBreak: true },
  { id: 'III', name: 'Slot III', time: '11:10 – 12:10', duration: '1 Hour', isActive: true, isBreak: false },
  { id: 'IV', name: 'Slot IV', time: '12:10 – 01:00', duration: '50 mins', isActive: true, isBreak: false },
  { id: 'LB', name: 'Lunch Break', time: '01:00 – 02:00', duration: '60 mins', isActive: false, isBreak: true },
  { id: 'V', name: 'Slot V', time: '02:00 – 03:00', duration: '1 Hour', isActive: true, isBreak: false },
  { id: 'VI', name: 'Slot VI', time: '03:00 – 04:00', duration: '1 Hour', isActive: true, isBreak: false }
];

export const DEFAULT_BATCHES: Batch[] = [
  // Semester VIII (Year 4 - Even) - Parallel Sections
  { id: 'batch-sem8-cse-a', name: 'CSE-A (Sem 8)', yearOfJoining: 2023, semester: 8, studentCount: 65, preferredRoomId: 'room-411' },
  { id: 'batch-sem8-cse-b', name: 'CSE-B (Sem 8)', yearOfJoining: 2023, semester: 8, studentCount: 60, preferredRoomId: 'room-412' },
  { id: 'batch-sem8-aids', name: 'AI&DS (Sem 8)', yearOfJoining: 2023, semester: 8, studentCount: 60, preferredRoomId: 'room-413' },
  { id: 'batch-sem8-aiml', name: 'CSE-AIML (Sem 8)', yearOfJoining: 2023, semester: 8, studentCount: 60, preferredRoomId: 'room-414' },
  { id: 'batch-sem8-cs', name: 'CSE-CyberSec (Sem 8)', yearOfJoining: 2023, semester: 8, studentCount: 55, preferredRoomId: 'room-415' },

  // Semester VII (Year 4 - Odd) - Parallel Sections
  { id: 'batch-cse-a', name: 'CSE-A', yearOfJoining: 2023, semester: 7, studentCount: 65, preferredRoomId: 'room-027' },
  { id: 'batch-cse-b', name: 'CSE-B', yearOfJoining: 2023, semester: 7, studentCount: 60, preferredRoomId: 'room-028' },
  { id: 'batch-cse-c', name: 'CSE-C', yearOfJoining: 2023, semester: 7, studentCount: 55, preferredRoomId: 'room-029' },
  { id: 'batch-aids-a', name: 'AI&DS-A', yearOfJoining: 2023, semester: 7, studentCount: 60, preferredRoomId: 'room-030' },
  { id: 'batch-aids-b', name: 'AI&DS-B', yearOfJoining: 2023, semester: 7, studentCount: 55, preferredRoomId: 'room-031' },
  { id: 'batch-aiml', name: 'CSE-AIML', yearOfJoining: 2023, semester: 7, studentCount: 60, preferredRoomId: 'room-032' },
  { id: 'batch-cs', name: 'CSE-CyberSec', yearOfJoining: 2023, semester: 7, studentCount: 55, preferredRoomId: 'room-033' },

  // Semester VI (Year 3 - Even) - Parallel Sections
  { id: 'batch-sem6-cse-a', name: 'CSE-A (Sem 6)', yearOfJoining: 2024, semester: 6, studentCount: 60, preferredRoomId: 'room-311' },
  { id: 'batch-sem6-cse-b', name: 'CSE-B (Sem 6)', yearOfJoining: 2024, semester: 6, studentCount: 58, preferredRoomId: 'room-312' },
  { id: 'batch-sem6-aids', name: 'AI&DS (Sem 6)', yearOfJoining: 2024, semester: 6, studentCount: 55, preferredRoomId: 'room-313' },
  { id: 'batch-sem6-aiml', name: 'CSE-AIML (Sem 6)', yearOfJoining: 2024, semester: 6, studentCount: 55, preferredRoomId: 'room-314' },
  { id: 'batch-sem6-cs', name: 'CSE-CyberSec (Sem 6)', yearOfJoining: 2024, semester: 6, studentCount: 55, preferredRoomId: 'room-315' },

  // Semester V (Year 3 - Odd) - Parallel Sections
  { id: 'batch-sem5-cse-a', name: 'CSE-A (Sem 5)', yearOfJoining: 2024, semester: 5, studentCount: 60, preferredRoomId: 'room-301' },
  { id: 'batch-sem5-cse-b', name: 'CSE-B (Sem 5)', yearOfJoining: 2024, semester: 5, studentCount: 58, preferredRoomId: 'room-302' },
  { id: 'batch-sem5-aids', name: 'AI&DS (Sem 5)', yearOfJoining: 2024, semester: 5, studentCount: 55, preferredRoomId: 'room-303' },
  { id: 'batch-sem5-aiml', name: 'CSE-AIML (Sem 5)', yearOfJoining: 2024, semester: 5, studentCount: 55, preferredRoomId: 'room-304' },
  { id: 'batch-sem5-cs', name: 'CSE-CyberSec (Sem 5)', yearOfJoining: 2024, semester: 5, studentCount: 55, preferredRoomId: 'room-305' },

  // Semester IV (Year 2 - Even) - Parallel Sections
  { id: 'batch-sem4-cse-a', name: 'CSE-A (Sem 4)', yearOfJoining: 2025, semester: 4, studentCount: 60, preferredRoomId: 'room-211' },
  { id: 'batch-sem4-cse-b', name: 'CSE-B (Sem 4)', yearOfJoining: 2025, semester: 4, studentCount: 55, preferredRoomId: 'room-212' },
  { id: 'batch-sem4-aids', name: 'AI&DS (Sem 4)', yearOfJoining: 2025, semester: 4, studentCount: 50, preferredRoomId: 'room-213' },
  { id: 'batch-sem4-aiml', name: 'CSE-AIML (Sem 4)', yearOfJoining: 2025, semester: 4, studentCount: 50, preferredRoomId: 'room-214' },
  { id: 'batch-sem4-cs', name: 'CSE-CyberSec (Sem 4)', yearOfJoining: 2025, semester: 4, studentCount: 50, preferredRoomId: 'room-215' },

  // Semester III (Year 2 - Odd) - Parallel Sections
  { id: 'batch-sem3-cse-a', name: 'CSE-A (Sem 3)', yearOfJoining: 2025, semester: 3, studentCount: 60, preferredRoomId: 'room-201' },
  { id: 'batch-sem3-cse-b', name: 'CSE-B (Sem 3)', yearOfJoining: 2025, semester: 3, studentCount: 55, preferredRoomId: 'room-202' },
  { id: 'batch-sem3-aids', name: 'AI&DS (Sem 3)', yearOfJoining: 2025, semester: 3, studentCount: 50, preferredRoomId: 'room-203' },
  { id: 'batch-sem3-aiml', name: 'CSE-AIML (Sem 3)', yearOfJoining: 2025, semester: 3, studentCount: 50, preferredRoomId: 'room-204' },
  { id: 'batch-sem3-cs', name: 'CSE-CyberSec (Sem 3)', yearOfJoining: 2025, semester: 3, studentCount: 50, preferredRoomId: 'room-205' },

  // Semester II (Year 1 - Even) - Parallel Sections
  { id: 'batch-sem2-cse-a', name: 'CSE-A (Sem 2)', yearOfJoining: 2026, semester: 2, studentCount: 60, preferredRoomId: 'room-111' },
  { id: 'batch-sem2-cse-b', name: 'CSE-B (Sem 2)', yearOfJoining: 2026, semester: 2, studentCount: 60, preferredRoomId: 'room-112' },
  { id: 'batch-sem2-aids', name: 'AI&DS (Sem 2)', yearOfJoining: 2026, semester: 2, studentCount: 55, preferredRoomId: 'room-113' },
  { id: 'batch-sem2-aiml', name: 'CSE-AIML (Sem 2)', yearOfJoining: 2026, semester: 2, studentCount: 55, preferredRoomId: 'room-114' },

  // Semester I (Year 1 - Odd) - Parallel Sections
  { id: 'batch-sem1-cse-a', name: 'CSE-A (Sem 1)', yearOfJoining: 2026, semester: 1, studentCount: 60, preferredRoomId: 'room-101' },
  { id: 'batch-sem1-cse-b', name: 'CSE-B (Sem 1)', yearOfJoining: 2026, semester: 1, studentCount: 60, preferredRoomId: 'room-102' },
  { id: 'batch-sem1-aids', name: 'AI&DS (Sem 1)', yearOfJoining: 2026, semester: 1, studentCount: 55, preferredRoomId: 'room-103' },
  { id: 'batch-sem1-aiml', name: 'CSE-AIML (Sem 1)', yearOfJoining: 2026, semester: 1, studentCount: 55, preferredRoomId: 'room-104' }
];

export const DEFAULT_FACULTY: Faculty[] = [
  { id: 'fac-1', name: 'Dr. Arjun Reddy', phone: '9742713901', maxHoursPerDay: 4, specialization: 'Mathematics', division: 'Core Sciences Division', designation: 'Professor' },
  { id: 'fac-2', name: 'Dr. Meera Nair', phone: '9742713902', maxHoursPerDay: 4, specialization: 'Applied Mathematics', division: 'Core Sciences Division', designation: 'Professor' },
  { id: 'fac-3', name: 'Dr. Vikram Sharma', phone: '9742713903', maxHoursPerDay: 4, specialization: 'Physics', division: 'Core Sciences Division', designation: 'Professor' },
  { id: 'fac-4', name: 'Dr. Priya Menon', phone: '9742713904', maxHoursPerDay: 4, specialization: 'Programming Fundamentals', division: 'Programming Division', designation: 'Associate Professor' },
  { id: 'fac-5', name: 'Mr. Rahul Verma', phone: '9742713905', maxHoursPerDay: 4, specialization: 'Programming', division: 'Programming Division', designation: 'Assistant Professor' },
  { id: 'fac-6', name: 'Dr. Kiran Kumar', phone: '9742713906', maxHoursPerDay: 4, specialization: 'Data Structures', division: 'Programming Division', designation: 'Professor' },
  { id: 'fac-7', name: 'Dr. Sneha Reddy', phone: '9742713907', maxHoursPerDay: 4, specialization: 'Algorithms', division: 'Programming Division', designation: 'Associate Professor' },
  { id: 'fac-8', name: 'Mr. Naveen Kumar', phone: '9742713908', maxHoursPerDay: 4, specialization: 'Java Technologies', division: 'Programming Division', designation: 'Assistant Professor' },
  { id: 'fac-9', name: 'Dr. Pooja Sharma', phone: '9742713909', maxHoursPerDay: 4, specialization: 'Software Engineering', division: 'Programming Division', designation: 'Professor' },
  { id: 'fac-10', name: 'Dr. Harish Rao', phone: '9742713910', maxHoursPerDay: 4, specialization: 'Database Systems', division: 'Data Science Division', designation: 'Professor' },
  { id: 'fac-11', name: 'Ms. Deepika Rao', phone: '9742713911', maxHoursPerDay: 4, specialization: 'SQL Technologies', division: 'Data Science Division', designation: 'Assistant Professor' },
  { id: 'fac-12', name: 'Dr. Sanjay Patel', phone: '9742713912', maxHoursPerDay: 4, specialization: 'Operating Systems', division: 'Systems Division', designation: 'Professor' },
  { id: 'fac-13', name: 'Mr. Ashwin Rao', phone: '9742713913', maxHoursPerDay: 4, specialization: 'Linux Systems', division: 'Systems Division', designation: 'Assistant Professor' },
  { id: 'fac-14', name: 'Dr. Vivek Joshi', phone: '9742713914', maxHoursPerDay: 4, specialization: 'Computer Architecture', division: 'Systems Division', designation: 'Professor' },
  { id: 'fac-15', name: 'Ms. Kavya Reddy', phone: '9742713915', maxHoursPerDay: 4, specialization: 'Digital Systems', division: 'Systems Division', designation: 'Assistant Professor' },
  { id: 'fac-16', name: 'Dr. Suresh Babu', phone: '9742713916', maxHoursPerDay: 4, specialization: 'Computer Networks', division: 'Networks & Security Division', designation: 'Professor' },
  { id: 'fac-17', name: 'Mr. Rohit Singh', phone: '9742713917', maxHoursPerDay: 4, specialization: 'Networking', division: 'Networks & Security Division', designation: 'Assistant Professor' },
  { id: 'fac-18', name: 'Dr. Ananya Gupta', phone: '9742713918', maxHoursPerDay: 4, specialization: 'Cyber Security', division: 'Networks & Security Division', designation: 'Professor' },
  { id: 'fac-19', name: 'Dr. Prakash Iyer', phone: '9742713919', maxHoursPerDay: 4, specialization: 'Information Security', division: 'Networks & Security Division', designation: 'Professor' },
  { id: 'fac-20', name: 'Mr. Aditya Varma', phone: '9742713920', maxHoursPerDay: 4, specialization: 'Cloud Computing', division: 'Networks & Security Division', designation: 'Assistant Professor' },
  { id: 'fac-21', name: 'Dr. Lakshmi Devi', phone: '9742713921', maxHoursPerDay: 4, specialization: 'Cloud & DevOps', division: 'Networks & Security Division', designation: 'Professor' },
  { id: 'fac-22', name: 'Mr. Akash Reddy', phone: '9742713922', maxHoursPerDay: 4, specialization: 'Full Stack Development', division: 'Programming Division', designation: 'Assistant Professor' },
  { id: 'fac-23', name: 'Ms. Neha Kapoor', phone: '9742713923', maxHoursPerDay: 4, specialization: 'MERN Stack', division: 'Programming Division', designation: 'Assistant Professor' },
  { id: 'fac-24', name: 'Dr. Bhaskar Rao', phone: '9742713924', maxHoursPerDay: 4, specialization: 'Artificial Intelligence', division: 'Data Science Division', designation: 'Professor' },
  { id: 'fac-25', name: 'Dr. Anil Kumar', phone: '9742713925', maxHoursPerDay: 4, specialization: 'Machine Learning', division: 'Data Science Division', designation: 'Professor' },
  { id: 'fac-26', name: 'Dr. Divya Thomas', phone: '9742713926', maxHoursPerDay: 4, specialization: 'Data Science', division: 'Data Science Division', designation: 'Associate Professor' },
  { id: 'fac-27', name: 'Mr. Karthik Reddy', phone: '9742713927', maxHoursPerDay: 4, specialization: 'Data Analytics', division: 'Data Science Division', designation: 'Assistant Professor' },
  { id: 'fac-28', name: 'Dr. Monica Das', phone: '9742713928', maxHoursPerDay: 4, specialization: 'Natural Language Processing', division: 'Data Science Division', designation: 'Professor' },
  { id: 'fac-29', name: 'Dr. Ramesh Gupta', phone: '9742713929', maxHoursPerDay: 4, specialization: 'Computer Vision', division: 'Data Science Division', designation: 'Professor' },
  { id: 'fac-30', name: 'Dr. Ajay Menon', phone: '9742713930', maxHoursPerDay: 4, specialization: 'Internet of Things', division: 'Networks & Security Division', designation: 'Professor' },
  { id: 'fac-31', name: 'Mr. Vivek Sharma', phone: '9742713931', maxHoursPerDay: 4, specialization: 'Mobile Computing', division: 'Networks & Security Division', designation: 'Assistant Professor' },
  { id: 'fac-32', name: 'Dr. Chaitanya Rao', phone: '9742713932', maxHoursPerDay: 4, specialization: 'Blockchain', division: 'Core Sciences Division', designation: 'Professor' },
  { id: 'fac-33', name: 'Dr. Nisha Verma', phone: '9742713933', maxHoursPerDay: 4, specialization: 'Compiler Design', division: 'Systems Division', designation: 'Professor' },
  { id: 'fac-34', name: 'Mr. Arvind Kumar', phone: '9742713934', maxHoursPerDay: 4, specialization: 'DevOps Engineering', division: 'Networks & Security Division', designation: 'Assistant Professor' },
  { id: 'fac-35', name: 'Dr. Ravi Shankar', phone: '9742713935', maxHoursPerDay: 4, specialization: 'Software Project Management', division: 'Professional Studies Division', designation: 'Professor' },
  { id: 'fac-36', name: 'Dr. Shalini Iyer', phone: '9742713936', maxHoursPerDay: 4, specialization: 'Human Computer Interaction', division: 'Professional Studies Division', designation: 'Professor' },
  { id: 'fac-37', name: 'Mr. Manoj Reddy', phone: '9742713937', maxHoursPerDay: 4, specialization: 'AR/VR & Game Development', division: 'Professional Studies Division', designation: 'Assistant Professor' },
  { id: 'fac-38', name: 'Dr. Geetha Srinivas', phone: '9742713938', maxHoursPerDay: 4, specialization: 'Entrepreneurship & Management', division: 'Professional Studies Division', designation: 'Professor' },
  { id: 'fac-39', name: 'Dr. Sunil Kumar', phone: '9742713939', maxHoursPerDay: 4, specialization: 'Professional Development', division: 'Professional Studies Division', designation: 'Professor' },
  { id: 'fac-40', name: 'Dr. Swathi Reddy', phone: '9742713940', maxHoursPerDay: 4, specialization: 'Projects & Industry Relations', division: 'Professional Studies Division', designation: 'Professor' }
];

export const DEFAULT_ROOMS: Room[] = [
  // Semester VIII Classrooms (Block 4)
  { id: 'room-411', roomNumber: 'Room 411 (CSE-A Sem 8)', type: 'Theory', capacity: 70 },
  { id: 'room-412', roomNumber: 'Room 412 (CSE-B Sem 8)', type: 'Theory', capacity: 70 },
  { id: 'room-413', roomNumber: 'Room 413 (AI&DS Sem 8)', type: 'Theory', capacity: 70 },
  { id: 'room-414', roomNumber: 'Room 414 (AIML Sem 8)', type: 'Theory', capacity: 70 },
  { id: 'room-415', roomNumber: 'Room 415 (CyberSec Sem 8)', type: 'Theory', capacity: 70 },

  // Semester VII Dedicated Theory Classrooms
  { id: 'room-027', roomNumber: '027 (CSE-A)', type: 'Theory', capacity: 70 },
  { id: 'room-028', roomNumber: '028 (CSE-B)', type: 'Theory', capacity: 70 },
  { id: 'room-029', roomNumber: '029 (CSE-C)', type: 'Theory', capacity: 70 },
  { id: 'room-030', roomNumber: '030 (AI&DS-A)', type: 'Theory', capacity: 70 },
  { id: 'room-031', roomNumber: '031 (AI&DS-B)', type: 'Theory', capacity: 70 },
  { id: 'room-032', roomNumber: '032 (AIML)', type: 'Theory', capacity: 70 },
  { id: 'room-033', roomNumber: '033 (CyberSec)', type: 'Theory', capacity: 70 },

  // Semester VI Classrooms (Block 3)
  { id: 'room-311', roomNumber: 'Room 311 (CSE-A Sem 6)', type: 'Theory', capacity: 70 },
  { id: 'room-312', roomNumber: 'Room 312 (CSE-B Sem 6)', type: 'Theory', capacity: 70 },
  { id: 'room-313', roomNumber: 'Room 313 (AI&DS Sem 6)', type: 'Theory', capacity: 70 },
  { id: 'room-314', roomNumber: 'Room 314 (AIML Sem 6)', type: 'Theory', capacity: 70 },
  { id: 'room-315', roomNumber: 'Room 315 (CyberSec Sem 6)', type: 'Theory', capacity: 70 },

  // Semester V Classrooms (Block 3)
  { id: 'room-301', roomNumber: 'Room 301 (CSE-A Sem 5)', type: 'Theory', capacity: 70 },
  { id: 'room-302', roomNumber: 'Room 302 (CSE-B Sem 5)', type: 'Theory', capacity: 70 },
  { id: 'room-303', roomNumber: 'Room 303 (AI&DS Sem 5)', type: 'Theory', capacity: 70 },
  { id: 'room-304', roomNumber: 'Room 304 (AIML Sem 5)', type: 'Theory', capacity: 70 },
  { id: 'room-305', roomNumber: 'Room 305 (CyberSec Sem 5)', type: 'Theory', capacity: 70 },

  // Semester IV Classrooms (Block 2)
  { id: 'room-211', roomNumber: 'Room 211 (CSE-A Sem 4)', type: 'Theory', capacity: 70 },
  { id: 'room-212', roomNumber: 'Room 212 (CSE-B Sem 4)', type: 'Theory', capacity: 70 },
  { id: 'room-213', roomNumber: 'Room 213 (AI&DS Sem 4)', type: 'Theory', capacity: 70 },
  { id: 'room-214', roomNumber: 'Room 214 (AIML Sem 4)', type: 'Theory', capacity: 70 },
  { id: 'room-215', roomNumber: 'Room 215 (CyberSec Sem 4)', type: 'Theory', capacity: 70 },

  // Semester III Classrooms (Block 2)
  { id: 'room-201', roomNumber: 'Room 201 (CSE-A Sem 3)', type: 'Theory', capacity: 70 },
  { id: 'room-202', roomNumber: 'Room 202 (CSE-B Sem 3)', type: 'Theory', capacity: 70 },
  { id: 'room-203', roomNumber: 'Room 203 (AI&DS Sem 3)', type: 'Theory', capacity: 70 },
  { id: 'room-204', roomNumber: 'Room 204 (AIML Sem 3)', type: 'Theory', capacity: 70 },
  { id: 'room-205', roomNumber: 'Room 205 (CyberSec Sem 3)', type: 'Theory', capacity: 70 },

  // Semester II Classrooms (Block 1)
  { id: 'room-111', roomNumber: 'Room 111 (CSE-A Sem 2)', type: 'Theory', capacity: 70 },
  { id: 'room-112', roomNumber: 'Room 112 (CSE-B Sem 2)', type: 'Theory', capacity: 70 },
  { id: 'room-113', roomNumber: 'Room 113 (AI&DS Sem 2)', type: 'Theory', capacity: 70 },
  { id: 'room-114', roomNumber: 'Room 114 (AIML Sem 2)', type: 'Theory', capacity: 70 },

  // Semester I Classrooms (Block 1)
  { id: 'room-101', roomNumber: 'Room 101 (CSE-A Sem 1)', type: 'Theory', capacity: 70 },
  { id: 'room-102', roomNumber: 'Room 102 (CSE-B Sem 1)', type: 'Theory', capacity: 70 },
  { id: 'room-103', roomNumber: 'Room 103 (AI&DS Sem 1)', type: 'Theory', capacity: 70 },
  { id: 'room-104', roomNumber: 'Room 104 (AIML Sem 1)', type: 'Theory', capacity: 70 },

  // Multipurpose & Auditoriums
  { id: 'room-034', roomNumber: 'Room 034 (Classroom)', type: 'Theory', capacity: 70 },
  { id: 'room-035', roomNumber: 'Room 035 (Classroom)', type: 'Theory', capacity: 70 },
  { id: 'room-seminar', roomNumber: 'Seminar Hall 101', type: 'Seminar', capacity: 120 },
  { id: 'room-seminar-2', roomNumber: 'Seminar Hall 102', type: 'Seminar', capacity: 120 },

  // Specialized Laboratories (All 70 Seats)
  { id: 'room-bd-lab-1', roomNumber: 'Big Data Lab 1 (012)', type: 'Lab', capacity: 70 },
  { id: 'room-bd-lab-2', roomNumber: 'Big Data Lab 2 (013)', type: 'Lab', capacity: 70 },
  { id: 'room-iot-lab-1', roomNumber: 'IoT Lab 1 (014)', type: 'Lab', capacity: 70 },
  { id: 'room-iot-lab-2', roomNumber: 'IoT Lab 2 (015)', type: 'Lab', capacity: 70 },
  { id: 'room-ai-lab', roomNumber: 'AI & Data Science Lab (016)', type: 'Lab', capacity: 70 },
  { id: 'room-cyber-lab', roomNumber: 'Cyber Security Lab (017)', type: 'Lab', capacity: 70 },
  { id: 'room-prog-lab', roomNumber: 'Programming Lab (018)', type: 'Lab', capacity: 70 },
  { id: 'room-sys-lab', roomNumber: 'Systems & Networks Lab (019)', type: 'Lab', capacity: 70 }
];

export const DEFAULT_COURSES: Course[] = [
  // Semester I
  { id: 'crs-phy', courseCode: 'BTCT1701', name: 'Engineering Physics', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-math1', courseCode: 'BTCT1702', name: 'Engineering Mathematics', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-cprog', courseCode: 'BTCT1801', name: 'Problem Solving and Programming with C', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-eng', courseCode: 'TAUT1101', name: 'Communicative English', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-ue1', courseCode: 'UE-I', name: 'University Elective I', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-phy-lab', courseCode: 'BTCL1701', name: 'Engineering Physics Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },
  { id: 'crs-c-lab', courseCode: 'BTCL1801', name: 'C Programming Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },

  // Semester II
  { id: 'crs-pns', courseCode: 'BTCT1703', name: 'Probability & Statistics', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-beee', courseCode: 'BTCT1802', name: 'Basic Electrical & Electronics Engineering', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-ds', courseCode: 'BTCT1301', name: 'Data Structures', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-python', courseCode: 'BTCT1302', name: 'Python Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-evs', courseCode: 'TAUT1102', name: 'Environmental Studies', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-ue2', courseCode: 'UE-II', name: 'University Elective II', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-beee-lab', courseCode: 'BTCL1802', name: 'BEEE Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },
  { id: 'crs-ds-lab', courseCode: 'BTCL1301', name: 'Data Structures Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },
  { id: 'crs-python-lab', courseCode: 'BTCL1302', name: 'Python Programming Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },

  // Semester III
  { id: 'crs-dmgt', courseCode: 'BTCT2701', name: 'Discrete Mathematics & Graph Theory', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-daa', courseCode: 'BTCT2301', name: 'Design & Analysis of Algorithms', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-java', courseCode: 'BTCT2302', name: 'Object Oriented Programming using Java', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-dld', courseCode: 'BTCT2801', name: 'Digital Logic Design', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-health', courseCode: 'TAUT2101', name: 'Health & Wellness', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-ue3', courseCode: 'UE-III', name: 'University Elective III', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-constitution', courseCode: 'BTCT2303', name: 'Constitution of India', type: 'Theory', durationSlots: 1, credits: 1 },
  { id: 'crs-java-lab', courseCode: 'BTCL2301', name: 'Java Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },
  { id: 'crs-dld-lab', courseCode: 'BTCL2801', name: 'Digital Logic Design Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },

  // Semester IV
  { id: 'crs-ds-methods', courseCode: 'BTCT2702', name: 'Deterministic Stochastic & Statistical Methods', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-mfe', courseCode: 'BTCT2901', name: 'Management for Engineers', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-se', courseCode: 'BTCT2501', name: 'Software Engineering', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-dbms', courseCode: 'BTCT2304', name: 'Database Management Systems', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-os', courseCode: 'BTCT2305', name: 'Operating Systems', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-uhv', courseCode: 'BTCT2306', name: 'Universal Human Values', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-coa', courseCode: 'BTCT2307', name: 'Computer Organization & Architecture', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-dbms-lab', courseCode: 'BTCL2302', name: 'DBMS Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },
  { id: 'crs-r-lab', courseCode: 'BTCL2501', name: 'Exploratory Data Analytics with R Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },

  // Semester V
  { id: 'crs-fswd', courseCode: 'BTCT3501', name: 'Full Stack Web Development', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-cn', courseCode: 'BTCT3301', name: 'Computer Networks', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-dwm', courseCode: 'BTCT3502', name: 'Data Warehousing & Mining', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-fe1', courseCode: 'SOTT3401', name: 'Faculty Elective I', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-pe1', courseCode: 'BTCT3601', name: 'Program Elective I', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-mooc1', courseCode: 'BTCM3501', name: 'MOOC I', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-esm', courseCode: 'BTCT3302', name: 'Entrepreneurship & Startup Management', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-fswd-lab', courseCode: 'BTCL3501', name: 'Full Stack Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },
  { id: 'crs-dwm-lab', courseCode: 'BTCL3502', name: 'Data Warehousing Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },

  // Semester VI
  { id: 'crs-compiler', courseCode: 'BTCT3303', name: 'Automata & Compiler Design', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-cloud', courseCode: 'BTCT3503', name: 'Cloud Computing', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-fe2', courseCode: 'SOTT3402', name: 'Faculty Elective II', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-pe2', courseCode: 'BTCT3602', name: 'Program Elective II', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-pe3', courseCode: 'BTCT3603', name: 'Program Elective III', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-mooc2', courseCode: 'BTCM3502', name: 'MOOC II', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-cloud-lab', courseCode: 'BTCL3503', name: 'Cloud Computing Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },
  { id: 'crs-android-lab', courseCode: 'BTCL3504', name: 'Android Development Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },

  // Semester VII
  { id: 'crs-bda', courseCode: 'BTCT4501', name: 'Big Data Analytics', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-pe4', courseCode: 'BTCT4601', name: 'Program Elective IV', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-pe5', courseCode: 'BTCT4602', name: 'Program Elective V', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-mooc3', courseCode: 'BTCM4501', name: 'MOOC III', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-mini-proj', courseCode: 'BTCP4501', name: 'Mini Project', type: 'Long Duration', durationSlots: 4, credits: 3 },
  { id: 'crs-bda-lab', courseCode: 'BTCL4501', name: 'Big Data Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },

  // Semester VIII
  { id: 'crs-proj', courseCode: 'BTCP4502', name: 'Project Work / Industry Internship', type: 'Long Duration', durationSlots: 4, credits: 12 },
  { id: 'crs-intern1', courseCode: 'BTCI3501', name: 'Internship I Evaluation', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-intern2', courseCode: 'BTCI4501', name: 'Internship II Evaluation', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-viva', courseCode: 'BTCI4502', name: 'Comprehensive Technical Review', type: 'Theory', durationSlots: 2, credits: 2 },

  // Added for the 40 instructors
  { id: 'crs-num-methods', courseCode: 'BTCT1704', name: 'Numerical Methods', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-graph-theory', courseCode: 'BTCT2703', name: 'Graph Theory', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-optimization', courseCode: 'BTCT3403', name: 'Optimization Techniques', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-math-ds', courseCode: 'BTCT3504', name: 'Mathematical Foundations of Data Science', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-diff-eq', courseCode: 'BTCT1705', name: 'Differential Equations', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-adv-python', courseCode: 'BTCT2308', name: 'Advanced Python', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-adv-ds', courseCode: 'BTCT2309', name: 'Advanced Data Structures', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-comp-prog', courseCode: 'BTCT3304', name: 'Competitive Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-adv-java', courseCode: 'BTCT3305', name: 'Advanced Java Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-ooad', courseCode: 'BTCT3306', name: 'Object Oriented Analysis & Design', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-testing', courseCode: 'BTCT3505', name: 'Software Testing', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-sre', courseCode: 'BTCT3506', name: 'Software Requirements Engineering', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-agile', courseCode: 'BTCT3507', name: 'Agile Software Development', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-dba', courseCode: 'BTCT3508', name: 'Database Administration', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-db-sec', courseCode: 'BTCT3509', name: 'Database Security', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-sql', courseCode: 'BTCT2310', name: 'SQL Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-os-sec', courseCode: 'BTCT3510', name: 'Operating System Security', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-unix', courseCode: 'BTCT2311', name: 'Unix Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-linux', courseCode: 'BTCT2312', name: 'Linux Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-linux-admin', courseCode: 'BTCT3511', name: 'Linux Administration', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-sys-prog', courseCode: 'BTCT3512', name: 'System Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-embedded', courseCode: 'BTCT3513', name: 'Embedded Systems', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-uproc', courseCode: 'BTCT3514', name: 'Microprocessors', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-embedded-prog', courseCode: 'BTCT3515', name: 'Embedded Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-adv-cn', courseCode: 'BTCT3516', name: 'Advanced Computer Networks', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-tcpip', courseCode: 'BTCT3517', name: 'TCP/IP', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-internet', courseCode: 'BTCT3518', name: 'Internetworking', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-net-admin', courseCode: 'BTCT3519', name: 'Network Administration', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-net-sec', courseCode: 'BTCT3520', name: 'Network Security', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-devnet', courseCode: 'BTCT3521', name: 'DevNet', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-cyber-sec', courseCode: 'BTCT3522', name: 'Cyber Security', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-ethical', courseCode: 'BTCT3523', name: 'Ethical Hacking', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-info-sec', courseCode: 'BTCT3524', name: 'Information Security', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-crypto', courseCode: 'BTCT3525', name: 'Cryptography', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-ids', courseCode: 'BTCT3526', name: 'Intrusion Detection Systems', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-oracle-cloud', courseCode: 'BTCT3527', name: 'Oracle Cloud', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-aws', courseCode: 'BTCT3528', name: 'AWS Fundamentals', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-cloud-sec', courseCode: 'BTCT3529', name: 'Cloud Security', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-devops', courseCode: 'BTCT3530', name: 'DevOps', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-docker', courseCode: 'BTCT3531', name: 'Docker', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-k8s', courseCode: 'BTCT3532', name: 'Kubernetes', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-cicd', courseCode: 'BTCT3533', name: 'CI/CD', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-mern', courseCode: 'BTCT3534', name: 'MERN Technologies', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-mongodb', courseCode: 'BTCT3535', name: 'MongoDB', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-rest-apis', courseCode: 'BTCT3536', name: 'REST APIs', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-frontend', courseCode: 'BTCT3537', name: 'Frontend Development', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-ai', courseCode: 'BTCT4503', name: 'Artificial Intelligence', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-intelligent-sys', courseCode: 'BTCT4504', name: 'Intelligent Systems', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-expert-sys', courseCode: 'BTCT4505', name: 'Expert Systems', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-ml', courseCode: 'BTCT4506', name: 'Machine Learning', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-dl', courseCode: 'BTCT4507', name: 'Deep Learning', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-pattern-rec', courseCode: 'BTCT4508', name: 'Pattern Recognition', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-tableau', courseCode: 'BTCT4509', name: 'Tableau', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-power-bi', courseCode: 'BTCT4510', name: 'Power BI', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-looker', courseCode: 'BTCT4511', name: 'Looker BI', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-nlp', courseCode: 'BTCT4512', name: 'NLP', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-text-analytics', courseCode: 'BTCT4513', name: 'Text Analytics', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-genai', courseCode: 'BTCT4514', name: 'Generative AI', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-cv', courseCode: 'BTCT4515', name: 'Computer Vision', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-image-proc', courseCode: 'BTCT4516', name: 'Image Processing', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-sensor-nets', courseCode: 'BTCT4517', name: 'Sensor Networks', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-smart-sys', courseCode: 'BTCT4518', name: 'Smart Systems', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-mobile-comp', courseCode: 'BTCT4519', name: 'Mobile Computing', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-flutter', courseCode: 'BTCT4520', name: 'Flutter Development', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-blockchain', courseCode: 'BTCT4521', name: 'Blockchain Technology', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-blockchain-ess', courseCode: 'BTCT4522', name: 'Blockchain Essentials', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-smart-contracts', courseCode: 'BTCT4523', name: 'Smart Contracts', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-toc', courseCode: 'BTCT3307', name: 'Theory of Computation', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-git', courseCode: 'BTCT1803', name: 'Git & GitHub', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-jenkins', courseCode: 'BTCT3538', name: 'Jenkins', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-spm', courseCode: 'BTCT4524', name: 'Software Project Management', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-pm', courseCode: 'BTCT4525', name: 'Project Management', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-sdlc', courseCode: 'BTCT4526', name: 'SDLC', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-scrum', courseCode: 'BTCT4527', name: 'Scrum', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-hci', courseCode: 'BTCT4528', name: 'Human Computer Interaction', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-uiux', courseCode: 'BTCT4529', name: 'UI/UX Design', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-uxe', courseCode: 'BTCT4530', name: 'User Experience Engineering', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-ar', courseCode: 'BTCT4531', name: 'Augmented Reality', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-vr', courseCode: 'BTCT4532', name: 'Virtual Reality', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-game-prog', courseCode: 'BTCT4533', name: 'Game Programming', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-unity', courseCode: 'BTCT4534', name: 'Unity', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-soft-skills', courseCode: 'TAUT4102', name: 'Soft Skills', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-aptitude', courseCode: 'TAUT4103', name: 'Aptitude', type: 'Theory', durationSlots: 1, credits: 2 },
  { id: 'crs-research-method', courseCode: 'BTCT4535', name: 'Research Methodology', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-intern-coord', courseCode: 'BTCP4503', name: 'Internship Coordination', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-seminar', courseCode: 'BTCP4504', name: 'Technical Seminars', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-research-guidance', courseCode: 'BTCP4505', name: 'Research Guidance', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-iot', courseCode: 'BTCT4502', name: 'Internet of Things', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-proj', courseCode: 'BTCP4502', name: 'Project Work', type: 'Long Duration', durationSlots: 4, credits: 6 },
  { id: 'crs-iot-lab', courseCode: 'BTCL4502', name: 'IoT Lab', type: 'Lab', durationSlots: 2, credits: 1.5 },

  // Activity / Non-Academic and Elective courses from the master syllabus registry
  { id: 'crs-elective-i', courseCode: 'ELECTIVE-I', name: 'University Elective I', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-elective-ii', courseCode: 'ELECTIVE-II', name: 'University Elective II', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-elective-iii', courseCode: 'ELECTIVE-III', name: 'University Elective -III', type: 'Theory', durationSlots: 1, credits: 3 },
  { id: 'crs-act-itws', courseCode: 'ACT-ITWS', name: 'IT Workshop', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-dt', courseCode: 'ACT-DT', name: 'Design Thinking', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-ss', courseCode: 'ACT-SS', name: 'Soft Skills', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-ment', courseCode: 'ACT-MENT', name: 'Mentoring', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-sem', courseCode: 'ACT-SEM', name: 'Technical Seminar', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-lib', courseCode: 'ACT-LIB', name: 'Library', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-phys', courseCode: 'ACT-PHYS', name: 'Physical Activity', type: 'Non-Academic', durationSlots: 2, credits: 1 },
  { id: 'crs-act-extra', courseCode: 'ACT-EXTRA', name: 'Extra-curricular activities', type: 'Non-Academic', durationSlots: 2, credits: 1 },
  { id: 'crs-act-cocurr', courseCode: 'ACT-COCURR', name: 'Co-curricular activity', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-self', courseCode: 'ACT-SELF', name: 'Self-Learning', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-soft', courseCode: 'ACT-SOFT', name: 'Soft Skills Training', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-cert', courseCode: 'ACT-CERT', name: 'Certification course', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-apt', courseCode: 'ACT-APT', name: 'Aptitude and Logical Reasoning', type: 'Non-Academic', durationSlots: 1, credits: 1 },
  { id: 'crs-act-crt', courseCode: 'ACT-CRT', name: 'CRT', type: 'Non-Academic', durationSlots: 2, credits: 1 },
  { id: 'crs-act-vac', courseCode: 'ACT-VAC', name: 'Valued added courses', type: 'Non-Academic', durationSlots: 2, credits: 1 },
  { id: 'crs-act-train', courseCode: 'ACT-TRAIN', name: 'Technical Training', type: 'Non-Academic', durationSlots: 2, credits: 1 },
  { id: 'crs-act-writ', courseCode: 'ACT-WRIT', name: 'Technical Paper Writing', type: 'Non-Academic', durationSlots: 1, credits: 1 }
];

export const DEFAULT_FACULTY_MAPPINGS: FacultyCourseMapping[] = [
  // 1. Dr. Arjun Reddy
  { id: 'map-1-1', facultyId: 'fac-1', courseId: 'crs-math1' },
  { id: 'map-1-2', facultyId: 'fac-1', courseId: 'crs-pns' },
  { id: 'map-1-3', facultyId: 'fac-1', courseId: 'crs-dmgt' },
  { id: 'map-1-4', facultyId: 'fac-1', courseId: 'crs-ds-methods' },
  { id: 'map-1-5', facultyId: 'fac-1', courseId: 'crs-num-methods' },
  
  // 2. Dr. Meera Nair
  { id: 'map-2-1', facultyId: 'fac-2', courseId: 'crs-graph-theory' },
  { id: 'map-2-2', facultyId: 'fac-2', courseId: 'crs-optimization' },
  { id: 'map-2-3', facultyId: 'fac-2', courseId: 'crs-math-ds' },
  { id: 'map-2-4', facultyId: 'fac-2', courseId: 'crs-diff-eq' },
  
  // 3. Dr. Vikram Sharma
  { id: 'map-3-1', facultyId: 'fac-3', courseId: 'crs-phy' },
  { id: 'map-3-2', facultyId: 'fac-3', courseId: 'crs-phy-lab' },
  
  // 4. Dr. Priya Menon
  { id: 'map-4-1', facultyId: 'fac-4', courseId: 'crs-cprog' },
  { id: 'map-4-2', facultyId: 'fac-4', courseId: 'crs-c-lab' },
  { id: 'map-4-3', facultyId: 'fac-4', courseId: 'crs-python' },
  { id: 'map-4-4', facultyId: 'fac-4', courseId: 'crs-python-lab' },
  
  // 5. Mr. Rahul Verma
  { id: 'map-5-1', facultyId: 'fac-5', courseId: 'crs-python' },
  { id: 'map-5-2', facultyId: 'fac-5', courseId: 'crs-adv-python' },
  { id: 'map-5-3', facultyId: 'fac-5', courseId: 'crs-cprog' },
  
  // 6. Dr. Kiran Kumar
  { id: 'map-6-1', facultyId: 'fac-6', courseId: 'crs-ds' },
  { id: 'map-6-2', facultyId: 'fac-6', courseId: 'crs-ds-lab' },
  { id: 'map-6-3', facultyId: 'fac-6', courseId: 'crs-adv-ds' },
  { id: 'map-6-4', facultyId: 'fac-6', courseId: 'crs-daa' },
  
  // 7. Dr. Sneha Reddy
  { id: 'map-7-1', facultyId: 'fac-7', courseId: 'crs-daa' },
  { id: 'map-7-2', facultyId: 'fac-7', courseId: 'crs-comp-prog' },
  { id: 'map-7-3', facultyId: 'fac-7', courseId: 'crs-cprog' },
  
  // 8. Mr. Naveen Kumar
  { id: 'map-8-1', facultyId: 'fac-8', courseId: 'crs-java' },
  { id: 'map-8-2', facultyId: 'fac-8', courseId: 'crs-java-lab' },
  { id: 'map-8-3', facultyId: 'fac-8', courseId: 'crs-adv-java' },
  { id: 'map-8-4', facultyId: 'fac-8', courseId: 'crs-ooad' },
  
  // 9. Dr. Pooja Sharma
  { id: 'map-9-1', facultyId: 'fac-9', courseId: 'crs-se' },
  { id: 'map-9-2', facultyId: 'fac-9', courseId: 'crs-testing' },
  { id: 'map-9-3', facultyId: 'fac-9', courseId: 'crs-sre' },
  { id: 'map-9-4', facultyId: 'fac-9', courseId: 'crs-agile' },
  
  // 10. Dr. Harish Rao
  { id: 'map-10-1', facultyId: 'fac-10', courseId: 'crs-dbms' },
  { id: 'map-10-2', facultyId: 'fac-10', courseId: 'crs-dbms-lab' },
  { id: 'map-10-3', facultyId: 'fac-10', courseId: 'crs-dba' },
  { id: 'map-10-4', facultyId: 'fac-10', courseId: 'crs-db-sec' },
  
  // 11. Ms. Deepika Rao
  { id: 'map-11-1', facultyId: 'fac-11', courseId: 'crs-sql' },
  { id: 'map-11-2', facultyId: 'fac-11', courseId: 'crs-dwm' },
  { id: 'map-11-3', facultyId: 'fac-11', courseId: 'crs-dbms-lab' },
  
  // 12. Dr. Sanjay Patel
  { id: 'map-12-1', facultyId: 'fac-12', courseId: 'crs-os' },
  { id: 'map-12-2', facultyId: 'fac-12', courseId: 'crs-os-sec' },
  { id: 'map-12-3', facultyId: 'fac-12', courseId: 'crs-unix' },
  { id: 'map-12-4', facultyId: 'fac-12', courseId: 'crs-linux' },
  
  // 13. Mr. Ashwin Rao
  { id: 'map-13-1', facultyId: 'fac-13', courseId: 'crs-unix' },
  { id: 'map-13-2', facultyId: 'fac-13', courseId: 'crs-linux-admin' },
  { id: 'map-13-3', facultyId: 'fac-13', courseId: 'crs-sys-prog' },
  
  // 14. Dr. Vivek Joshi
  { id: 'map-14-1', facultyId: 'fac-14', courseId: 'crs-coa' },
  { id: 'map-14-2', facultyId: 'fac-14', courseId: 'crs-dld' },
  { id: 'map-14-3', facultyId: 'fac-14', courseId: 'crs-embedded' },
  
  // 15. Ms. Kavya Reddy
  { id: 'map-15-1', facultyId: 'fac-15', courseId: 'crs-dld-lab' },
  { id: 'map-15-2', facultyId: 'fac-15', courseId: 'crs-uproc' },
  { id: 'map-15-3', facultyId: 'fac-15', courseId: 'crs-embedded-prog' },
  
  // 16. Dr. Suresh Babu
  { id: 'map-16-1', facultyId: 'fac-16', courseId: 'crs-cn' },
  { id: 'map-16-2', facultyId: 'fac-16', courseId: 'crs-adv-cn' },
  { id: 'map-16-3', facultyId: 'fac-16', courseId: 'crs-tcpip' },
  { id: 'map-16-4', facultyId: 'fac-16', courseId: 'crs-internet' },
  
  // 17. Mr. Rohit Singh
  { id: 'map-17-1', facultyId: 'fac-17', courseId: 'crs-net-admin' },
  { id: 'map-17-2', facultyId: 'fac-17', courseId: 'crs-net-sec' },
  { id: 'map-17-3', facultyId: 'fac-17', courseId: 'crs-devnet' },
  
  // 18. Dr. Ananya Gupta
  { id: 'map-18-1', facultyId: 'fac-18', courseId: 'crs-cyber-sec' },
  { id: 'map-18-2', facultyId: 'fac-18', courseId: 'crs-ethical' },
  { id: 'map-18-3', facultyId: 'fac-18', courseId: 'crs-info-sec' },
  { id: 'map-18-4', facultyId: 'fac-18', courseId: 'crs-crypto' },
  
  // 19. Dr. Prakash Iyer
  { id: 'map-19-1', facultyId: 'fac-19', courseId: 'crs-net-sec' },
  { id: 'map-19-2', facultyId: 'fac-19', courseId: 'crs-db-sec' },
  { id: 'map-19-3', facultyId: 'fac-19', courseId: 'crs-ids' },
  
  // 20. Mr. Aditya Varma
  { id: 'map-20-1', facultyId: 'fac-20', courseId: 'crs-cloud' },
  { id: 'map-20-2', facultyId: 'fac-20', courseId: 'crs-cloud-lab' },
  { id: 'map-20-3', facultyId: 'fac-20', courseId: 'crs-oracle-cloud' },
  { id: 'map-20-4', facultyId: 'fac-20', courseId: 'crs-aws' },
  
  // 21. Dr. Lakshmi Devi
  { id: 'map-21-1', facultyId: 'fac-21', courseId: 'crs-cloud-sec' },
  { id: 'map-21-2', facultyId: 'fac-21', courseId: 'crs-devops' },
  { id: 'map-21-3', facultyId: 'fac-21', courseId: 'crs-docker' },
  { id: 'map-21-4', facultyId: 'fac-21', courseId: 'crs-k8s' },
  { id: 'map-21-5', facultyId: 'fac-21', courseId: 'crs-cicd' },
  
  // 22. Mr. Akash Reddy
  { id: 'map-22-1', facultyId: 'fac-22', courseId: 'crs-fswd' },
  { id: 'map-22-2', facultyId: 'fac-22', courseId: 'crs-fswd-lab' },
  
  // 23. Ms. Neha Kapoor
  { id: 'map-23-1', facultyId: 'fac-23', courseId: 'crs-mern' },
  { id: 'map-23-2', facultyId: 'fac-23', courseId: 'crs-mongodb' },
  { id: 'map-23-3', facultyId: 'fac-23', courseId: 'crs-rest-apis' },
  { id: 'map-23-4', facultyId: 'fac-23', courseId: 'crs-frontend' },
  
  // 24. Dr. Bhaskar Rao
  { id: 'map-24-1', facultyId: 'fac-24', courseId: 'crs-ai' },
  { id: 'map-24-2', facultyId: 'fac-24', courseId: 'crs-intelligent-sys' },
  { id: 'map-24-3', facultyId: 'fac-24', courseId: 'crs-expert-sys' },
  
  // 25. Dr. Anil Kumar
  { id: 'map-25-1', facultyId: 'fac-25', courseId: 'crs-ml' },
  { id: 'map-25-2', facultyId: 'fac-25', courseId: 'crs-dl' },
  { id: 'map-25-3', facultyId: 'fac-25', courseId: 'crs-pattern-rec' },
  
  // 26. Dr. Divya Thomas
  { id: 'map-26-1', facultyId: 'fac-26', courseId: 'crs-dwm' },
  { id: 'map-26-2', facultyId: 'fac-26', courseId: 'crs-bda' },
  { id: 'map-26-3', facultyId: 'fac-26', courseId: 'crs-tableau' },
  
  // 27. Mr. Karthik Reddy
  { id: 'map-27-1', facultyId: 'fac-27', courseId: 'crs-r-lab' },
  { id: 'map-27-2', facultyId: 'fac-27', courseId: 'crs-power-bi' },
  { id: 'map-27-3', facultyId: 'fac-27', courseId: 'crs-tableau' },
  { id: 'map-27-4', facultyId: 'fac-27', courseId: 'crs-looker' },
  
  // 28. Dr. Monica Das
  { id: 'map-28-1', facultyId: 'fac-28', courseId: 'crs-nlp' },
  { id: 'map-28-2', facultyId: 'fac-28', courseId: 'crs-text-analytics' },
  { id: 'map-28-3', facultyId: 'fac-28', courseId: 'crs-genai' },
  
  // 29. Dr. Ramesh Gupta
  { id: 'map-29-1', facultyId: 'fac-29', courseId: 'crs-cv' },
  { id: 'map-29-2', facultyId: 'fac-29', courseId: 'crs-image-proc' },
  { id: 'map-29-3', facultyId: 'fac-29', courseId: 'crs-pattern-rec' },
  
  // 30. Dr. Ajay Menon
  { id: 'map-30-1', facultyId: 'fac-30', courseId: 'crs-iot' },
  { id: 'map-30-2', facultyId: 'fac-30', courseId: 'crs-iot-lab' },
  { id: 'map-30-3', facultyId: 'fac-30', courseId: 'crs-sensor-nets' },
  { id: 'map-30-4', facultyId: 'fac-30', courseId: 'crs-smart-sys' },
  
  // 31. Mr. Vivek Sharma
  { id: 'map-31-1', facultyId: 'fac-31', courseId: 'crs-mobile-comp' },
  { id: 'map-31-2', facultyId: 'fac-31', courseId: 'crs-android-lab' },
  { id: 'map-31-3', facultyId: 'fac-31', courseId: 'crs-flutter' },
  
  // 32. Dr. Chaitanya Rao
  { id: 'map-32-1', facultyId: 'fac-32', courseId: 'crs-blockchain' },
  { id: 'map-32-2', facultyId: 'fac-32', courseId: 'crs-blockchain-ess' },
  { id: 'map-32-3', facultyId: 'fac-32', courseId: 'crs-smart-contracts' },
  
  // 33. Dr. Nisha Verma
  { id: 'map-33-1', facultyId: 'fac-33', courseId: 'crs-compiler' },
  { id: 'map-33-2', facultyId: 'fac-33', courseId: 'crs-toc' },
  
  // 34. Mr. Arvind Kumar
  { id: 'map-34-1', facultyId: 'fac-34', courseId: 'crs-devops' },
  { id: 'map-34-2', facultyId: 'fac-34', courseId: 'crs-cicd' },
  { id: 'map-34-3', facultyId: 'fac-34', courseId: 'crs-git' },
  { id: 'map-34-4', facultyId: 'fac-34', courseId: 'crs-jenkins' },
  { id: 'map-34-5', facultyId: 'fac-34', courseId: 'crs-docker' },
  
  // 35. Dr. Ravi Shankar
  { id: 'map-35-1', facultyId: 'fac-35', courseId: 'crs-spm' },
  { id: 'map-35-2', facultyId: 'fac-35', courseId: 'crs-pm' },
  { id: 'map-35-3', facultyId: 'fac-35', courseId: 'crs-sdlc' },
  { id: 'map-35-4', facultyId: 'fac-35', courseId: 'crs-scrum' },
  
  // 36. Dr. Shalini Iyer
  { id: 'map-36-1', facultyId: 'fac-36', courseId: 'crs-hci' },
  { id: 'map-36-2', facultyId: 'fac-36', courseId: 'crs-uiux' },
  { id: 'map-36-3', facultyId: 'fac-36', courseId: 'crs-uxe' },
  
  // 37. Mr. Manoj Reddy
  { id: 'map-37-1', facultyId: 'fac-37', courseId: 'crs-ar' },
  { id: 'map-37-2', facultyId: 'fac-37', courseId: 'crs-vr' },
  { id: 'map-37-3', facultyId: 'fac-37', courseId: 'crs-game-prog' },
  { id: 'map-37-4', facultyId: 'fac-37', courseId: 'crs-unity' },
  
  // 38. Dr. Geetha Srinivas
  { id: 'map-38-1', facultyId: 'fac-38', courseId: 'crs-esm' },
  { id: 'map-38-2', facultyId: 'fac-38', courseId: 'crs-mfe' },
  
  // 39. Dr. Sunil Kumar
  { id: 'map-39-1', facultyId: 'fac-39', courseId: 'crs-eng' },
  { id: 'map-39-2', facultyId: 'fac-39', courseId: 'crs-soft-skills' },
  { id: 'map-39-3', facultyId: 'fac-39', courseId: 'crs-aptitude' },
  { id: 'map-39-4', facultyId: 'fac-39', courseId: 'crs-research-method' },
  
  // 40. Dr. Swathi Reddy
  { id: 'map-40-1', facultyId: 'fac-40', courseId: 'crs-mini-proj' },
  { id: 'map-40-2', facultyId: 'fac-40', courseId: 'crs-proj' },
  { id: 'map-40-3', facultyId: 'fac-40', courseId: 'crs-intern1' },
  { id: 'map-40-4', facultyId: 'fac-40', courseId: 'crs-intern2' },
  { id: 'map-40-5', facultyId: 'fac-40', courseId: 'crs-viva' },
  { id: 'map-40-6', facultyId: 'fac-40', courseId: 'crs-intern-coord' },
  { id: 'map-40-7', facultyId: 'fac-40', courseId: 'crs-seminar' },
  { id: 'map-40-8', facultyId: 'fac-40', courseId: 'crs-research-guidance' },

  // Program Electives & MOOCs Mappings
  { id: 'map-pe-1', facultyId: 'fac-24', courseId: 'crs-pe1' },
  { id: 'map-pe-2', facultyId: 'fac-25', courseId: 'crs-pe2' },
  { id: 'map-pe-3', facultyId: 'fac-28', courseId: 'crs-pe3' },
  { id: 'map-pe-4', facultyId: 'fac-18', courseId: 'crs-pe4' },
  { id: 'map-pe-5', facultyId: 'fac-19', courseId: 'crs-pe5' },
  { id: 'map-fe-1', facultyId: 'fac-38', courseId: 'crs-fe1' },
  { id: 'map-fe-2', facultyId: 'fac-36', courseId: 'crs-fe2' },
  { id: 'map-mooc-1', facultyId: 'fac-22', courseId: 'crs-mooc1' },
  { id: 'map-mooc-2', facultyId: 'fac-20', courseId: 'crs-mooc2' },
  { id: 'map-mooc-3', facultyId: 'fac-25', courseId: 'crs-mooc3' },

  // Activity & Value-Added Course Mappings
  { id: 'map-act-train', facultyId: 'fac-27', courseId: 'crs-act-train' },
  { id: 'map-act-crt', facultyId: 'fac-22', courseId: 'crs-act-crt' },
  { id: 'map-act-vac', facultyId: 'fac-34', courseId: 'crs-act-vac' },
  { id: 'map-act-sem', facultyId: 'fac-36', courseId: 'crs-act-sem' },
  { id: 'map-act-ment', facultyId: 'fac-39', courseId: 'crs-act-ment' },
  { id: 'map-act-lib', facultyId: 'fac-38', courseId: 'crs-act-lib' },
  { id: 'map-act-phys', facultyId: 'fac-13', courseId: 'crs-act-phys' },
  { id: 'map-act-extra', facultyId: 'fac-17', courseId: 'crs-act-extra' },
  { id: 'map-act-cocurr', facultyId: 'fac-8', courseId: 'crs-act-cocurr' },
  { id: 'map-act-self', facultyId: 'fac-15', courseId: 'crs-act-self' },
  { id: 'map-act-soft', facultyId: 'fac-39', courseId: 'crs-act-soft' },
  { id: 'map-act-cert', facultyId: 'fac-34', courseId: 'crs-act-cert' },
  { id: 'map-act-apt', facultyId: 'fac-39', courseId: 'crs-act-apt' },
  { id: 'map-act-itws', facultyId: 'fac-5', courseId: 'crs-act-itws' },
  { id: 'map-act-dt', facultyId: 'fac-4', courseId: 'crs-act-dt' },
  { id: 'map-act-ss', facultyId: 'fac-39', courseId: 'crs-act-ss' },
  { id: 'map-act-writ', facultyId: 'fac-35', courseId: 'crs-act-writ' },

  // Core Sciences, Engineering & Elective Mappings (Complete exact mappings)
  { id: 'map-beee-1', facultyId: 'fac-14', courseId: 'crs-beee' },
  { id: 'map-beee-lab-1', facultyId: 'fac-15', courseId: 'crs-beee-lab' },
  { id: 'map-evs-1', facultyId: 'fac-3', courseId: 'crs-evs' },
  { id: 'map-evs-2', facultyId: 'fac-39', courseId: 'crs-evs' },
  { id: 'map-health-1', facultyId: 'fac-13', courseId: 'crs-health' },
  { id: 'map-const-1', facultyId: 'fac-38', courseId: 'crs-constitution' },
  { id: 'map-const-2', facultyId: 'fac-39', courseId: 'crs-constitution' },
  { id: 'map-uhv-1', facultyId: 'fac-39', courseId: 'crs-uhv' },
  { id: 'map-dwm-lab-1', facultyId: 'fac-26', courseId: 'crs-dwm-lab' },
  { id: 'map-dwm-lab-2', facultyId: 'fac-11', courseId: 'crs-dwm-lab' },
  { id: 'map-bda-lab-1', facultyId: 'fac-26', courseId: 'crs-bda-lab' },
  { id: 'map-bda-lab-2', facultyId: 'fac-27', courseId: 'crs-bda-lab' },
  { id: 'map-ue1-1', facultyId: 'fac-38', courseId: 'crs-ue1' },
  { id: 'map-ue1-2', facultyId: 'fac-36', courseId: 'crs-ue1' },
  { id: 'map-ue2-1', facultyId: 'fac-32', courseId: 'crs-ue2' },
  { id: 'map-ue3-1', facultyId: 'fac-37', courseId: 'crs-ue3' },
  { id: 'map-elec1-1', facultyId: 'fac-38', courseId: 'crs-elective-i' },
  { id: 'map-elec1-2', facultyId: 'fac-36', courseId: 'crs-elective-i' },
  { id: 'map-elec2-1', facultyId: 'fac-32', courseId: 'crs-elective-ii' },
  { id: 'map-elec3-1', facultyId: 'fac-37', courseId: 'crs-elective-iii' }
];

export const DEFAULT_SEM_COURSES: Record<number, string[]> = {
  1: [
    'crs-phy', 'crs-math1', 'crs-cprog', 'crs-eng', 'crs-elective-i', 'crs-phy-lab', 'crs-c-lab',
    'crs-act-itws', 'crs-act-dt', 'crs-act-ss', 'crs-act-ment', 'crs-act-sem', 'crs-act-lib',
    'crs-act-phys', 'crs-act-extra', 'crs-act-cocurr', 'crs-act-self'
  ],
  2: [
    'crs-pns', 'crs-beee', 'crs-ds', 'crs-python', 'crs-evs', 'crs-elective-ii', 'crs-beee-lab',
    'crs-ds-lab', 'crs-python-lab', 'crs-act-ment', 'crs-act-cocurr', 'crs-act-self',
    'crs-act-phys', 'crs-act-extra', 'crs-act-lib'
  ],
  3: [
    'crs-dmgt', 'crs-daa', 'crs-java', 'crs-dld', 'crs-health', 'crs-elective-iii', 'crs-constitution',
    'crs-java-lab', 'crs-dld-lab', 'crs-act-ment', 'crs-act-cocurr', 'crs-act-self',
    'crs-act-phys', 'crs-act-extra', 'crs-act-soft', 'crs-act-cert'
  ],
  4: [
    'crs-ds-methods', 'crs-mfe', 'crs-se', 'crs-dbms', 'crs-os', 'crs-uhv', 'crs-coa',
    'crs-dbms-lab', 'crs-r-lab', 'crs-act-ment', 'crs-act-apt', 'crs-act-lib',
    'crs-act-phys', 'crs-act-extra'
  ],
  5: [
    'crs-fswd', 'crs-cn', 'crs-dwm', 'crs-fe1', 'crs-pe1', 'crs-mooc1', 'crs-esm',
    'crs-fswd-lab', 'crs-dwm-lab', 'crs-act-ment', 'crs-act-lib', 'crs-act-phys',
    'crs-act-extra', 'crs-act-sem', 'crs-act-crt'
  ],
  6: [
    'crs-compiler', 'crs-cloud', 'crs-fe2', 'crs-pe2', 'crs-pe3', 'crs-mooc2',
    'crs-cloud-lab', 'crs-android-lab', 'crs-act-ment', 'crs-act-lib', 'crs-act-phys',
    'crs-act-extra', 'crs-act-vac', 'crs-act-train', 'crs-act-self'
  ],
  7: [
    'crs-bda', 'crs-iot', 'crs-pe4', 'crs-pe5', 'crs-mooc3', 'crs-mini-proj',
    'crs-bda-lab', 'crs-iot-lab', 'crs-act-ment', 'crs-act-lib', 'crs-act-phys',
    'crs-act-extra', 'crs-act-vac', 'crs-act-sem', 'crs-act-train', 'crs-act-writ'
  ],
  8: [
    'crs-proj', 'crs-intern1', 'crs-intern2', 'crs-viva', 'crs-act-sem', 'crs-act-ment', 'crs-act-lib'
  ]
};

export function getDefaultLTP(course: Course): { L: number; T: number; P: number } {
  if (course.type === 'Lab') {
    return { L: 0, T: 0, P: course.durationSlots || 2 };
  } else if (course.type === 'Long Duration') {
    return { L: 0, T: 0, P: course.durationSlots || 4 };
  } else if (course.type === 'Non-Academic') {
    return { L: 1, T: 0, P: 0 };
  } else {
    // Theory course
    if (course.credits === 4) {
      return { L: 3, T: 1, P: 0 };
    } else if (course.credits === 3) {
      return { L: 3, T: 0, P: 0 };
    } else if (course.credits === 2) {
      return { L: 2, T: 0, P: 0 };
    } else if (course.credits === 1) {
      return { L: 1, T: 0, P: 0 };
    }
    return { L: 3, T: 0, P: 0 }; // default theory
  }
}

export const DEFAULT_SEMESTER_COURSE_MAPS: SemesterCourseMap[] = [
  ...([1, 2, 3, 4, 5, 6, 7, 8] as const).flatMap((sem) => {
    const courseIds = DEFAULT_SEM_COURSES[sem] || [];
    return courseIds.map((courseId, idx) => {
      const course = DEFAULT_COURSES.find(c => c.id === courseId);
      const ltp = course ? getDefaultLTP(course) : { L: 3, T: 0, P: 0 };
      return {
        id: `sc-map-sem${sem}-${idx}`,
        semester: sem,
        batchId: 'all',
        courseId,
        ...ltp
      };
    });
  })
];

export const DEFAULT_TIMETABLE: TimetableEntry[] = [
  // Semester VII (CSE-A) Pre-populated
  {
    id: 'tt-mon-1',
    day: 'Monday',
    slotId: 'I',
    batchId: 'batch-cse-a',
    courseId: 'crs-bda',
    facultyId: 'fac-26',
    roomId: 'room-027',
    isLocked: false,
    colSpan: 1
  },
  {
    id: 'tt-mon-2',
    day: 'Monday',
    slotId: 'II',
    batchId: 'batch-cse-a',
    courseId: 'crs-iot',
    facultyId: 'fac-30',
    roomId: 'room-027',
    isLocked: false,
    colSpan: 1
  },
  {
    id: 'tt-tue-3',
    day: 'Tuesday',
    slotId: 'III',
    batchId: 'batch-cse-a',
    courseId: 'crs-iot-lab',
    facultyId: 'fac-30',
    roomId: 'room-iot-lab-1',
    isLocked: true,
    colSpan: 2
  },
  {
    id: 'tt-wed-1',
    day: 'Wednesday',
    slotId: 'I',
    batchId: 'batch-cse-a',
    courseId: 'crs-pe4',
    facultyId: 'fac-24',
    roomId: 'room-027',
    isLocked: false,
    colSpan: 1
  },
  {
    id: 'tt-thu-1',
    day: 'Thursday',
    slotId: 'I',
    batchId: 'batch-cse-a',
    courseId: 'crs-mini-proj',
    facultyId: 'fac-40',
    roomId: 'room-027',
    isLocked: true,
    colSpan: 4
  },
  {
    id: 'tt-fri-1',
    day: 'Friday',
    slotId: 'I',
    batchId: 'batch-cse-a',
    courseId: 'crs-bda-lab',
    facultyId: 'fac-26',
    roomId: 'room-bd-lab-1',
    isLocked: true,
    colSpan: 2
  }
];

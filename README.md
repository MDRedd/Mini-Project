# 🎓 Auto Timetable Generator System
### Next-Gen University & College Schedule Optimization Engine

A comprehensive, intelligent academic timetable generator built with React, TypeScript, and a high-performance **Constraint Satisfaction Problem (CSP) Backtracking Solver**.

---

## 🌟 Key Features

### 1. ⚡ Simultaneous Multi-Section Generation
- **Year-Wise / Semester-Wise Batch Solving**: Simultaneously generates 100% conflict-free schedules for all parallel sections in an academic year/semester at once.
- **Pre-Configured Parallel Sections Across 4 Years (19 Batches Total)**:
  - **Semester VII (Year 4 - 7 Sections)**: `CSE-A`, `CSE-B`, `CSE-C`, `AI&DS-A`, `AI&DS-B`, `CSE-AIML`, `CSE-CyberSec`.
  - **Semester V (Year 3 - 4 Sections)**: `CSE-A (Sem 5)`, `CSE-B (Sem 5)`, `AI&DS (Sem 5)`, `CSE-AIML (Sem 5)`.
  - **Semester III (Year 2 - 4 Sections)**: `CSE-A (Sem 3)`, `CSE-B (Sem 3)`, `AI&DS (Sem 3)`, `CSE-AIML (Sem 3)`.
  - **Semester I (Year 1 - 4 Sections)**: `CSE-A (Sem 1)`, `CSE-B (Sem 1)`, `AI&DS (Sem 1)`, `CSE-AIML (Sem 1)`.
- **Full Campus Mode**: Generates timetables for all 19 batches across the entire university in a single click with zero collisions.

### 2. 🏛️ Dedicated Classrooms & Specialized Labs
- **Dedicated Theory Classrooms**: `Room 027 (CSE-A)`, `Room 028 (CSE-B)`, `Room 029 (CSE-C)`, `Room 030 (AI&DS-A)`, `Room 031 (AI&DS-B)`, `Room 032 (AIML)`, `Room 033 (CyberSec)`, `034`, `035`, `Seminar Hall 101`, `Seminar Hall 102`.
- **Specialized Laboratories (70-Seat Capacities)**:
  - `Big Data Lab 1 (012)` & `Big Data Lab 2 (013)`
  - `IoT Lab 1 (014)` & `IoT Lab 2 (015)`
  - `AI & Data Science Lab (016)`
  - `Cyber Security Lab (017)`
  - `Programming Lab (018)`
  - `Systems & Networks Lab (019)`

### 3. 👨‍🏫 40-Member Faculty Workload Balancer
- **Domain Specialization Mapping**: Instructors mapped to Mathematics, Programming, Systems, Networks, Cyber Security, AI/ML, Data Science, IoT, Full Stack, and Project Management.
- **Dynamic Load Distribution**: Prevents instructor double-booking, limits teaching load to $\le$ 4 hours/day, and prevents long continuous streaks (> 4 consecutive hours).

### 4. 🛡️ 24 Academic Constraints Auditing Engine
Validates all institutional hard & soft constraints:
1. Faculty Availability (Zero double-booking)
2. Student Section Isolation
3. Classroom Non-Overlap
4. Laboratory Non-Overlap
5. Faculty Qualification Matching
6. Weekly Workload Caps (12–18 hrs/week)
7. Consecutive Class Limits
8. Daily Faculty Free Periods
9. Subject Frequency Compliance (L-T-P syllabus match)
10. Multi-Slot Lab Duration Boundaries (Slots I, III, V)
11. Inter-Department Faculty Alignment
12. Semester Syllabus Adherence
13. Elective Conflict Isolation
14. Lunch Break Protection (01:00–02:00 PM)
15. Short Break Buffer (11:00–11:15 AM)
16. Monotonous Daily Subject Repetition Spreading
17. Room Seating Capacity vs. Student Batch Size
18. Faculty Leave Management
19. Faculty Time Preferences
20. Maximum Daily Teaching Limits ($\le$ 5 hrs/day)
21. Student Daily Theory/Practical Balance
22. Parallel Section Isolation
23. Shared Resource Protection (Labs & Smart Rooms)
24. Campus Completeness Verification

### 5. 🎯 Interactive Drag-and-Drop Matrix
- Real-time drag-and-drop course placement with visual collision warnings.
- **Anchor & Lock**: Lock critical sessions (e.g. 4-hour Project Work or specific Labs); the solver respects all locked periods as fixed anchors.
- **Auto-Fix Overlaps**: 1-click automatic resolution of any manual scheduling collisions.

### 6. 📊 Multi-Format Academic Exports
- **High-Resolution Vector PDF**: Clean layout matching official institutional formats.
- **PNG Snapshot**: High-DPI image export for noticeboards and digital signage.
- **Microsoft Excel (.xlsx)**: Full campus grid export with separate batch worksheets and faculty schedules.
- **Print Optimization**: Dedicated CSS print styles formatted for A4 landscape documents.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `yarn`

### Installation & Run

1. **Clone or navigate to the repository:**
   ```bash
   cd "auto-timetable-generator (2)"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Open [http://localhost:3000](http://localhost:3000) (or the port specified in terminal).

---

## 🛠️ Tech Stack
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Vanilla CSS Design System, Lucide Icons
- **Animations**: Framer Motion
- **Visuals & Charts**: Recharts, Canvas / html-to-image
- **Document Generation**: jsPDF, XLSX (SheetJS)
- **Constraint Engine**: Custom Backtracking MRV CSP Solver

---

## 📁 Directory Structure
```
├── src/
│   ├── components/
│   │   ├── AdminPanel.tsx                 # Full administration console & settings
│   │   ├── AnalyticsPanel.tsx              # Real-time room & constraint audit dashboards
│   │   ├── BackupRestoreModal.tsx          # Local snapshot & data backup manager
│   │   ├── BottomFacultyTable.tsx          # Detailed instructor schedule tables
│   │   ├── FacultyLoadDashboard.tsx        # Faculty workload distribution charts
│   │   ├── ParallelSectionDiagnostics.tsx  # Multi-batch matrix & clash diagnostics
│   │   ├── TimetableGrid.tsx               # Drag-and-drop interactive weekly grid
│   │   └── Toast.tsx                       # Animated system notifications
│   ├── data/
│   │   ├── initialData.ts                  # Default 19 batches, 40 faculty, rooms, courses
│   │   └── syllabusData.ts                 # Semester I–VIII university syllabus registry
│   ├── utils/
│   │   ├── backup.ts                       # Snapshot & backup utilities
│   │   ├── excelExport.ts                  # Excel spreadsheet exporter
│   │   └── solver.ts                       # CSP Backtracking Solver & 24 constraint auditor
│   ├── App.tsx                             # Main application controller
│   ├── main.tsx                            # React entry point
│   └── types.ts                            # TypeScript data interfaces
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License
MIT License. Built for academic institution administration.

export interface CourseDefinition {
  code: string;
  name: string;
  periodsPerWeek: number;
  type: 'Theory' | 'Lab' | 'Activity';
}

export const SEMESTER_SYLLABUS_REGISTRY: Record<number, CourseDefinition[]> = {
  1: [
    { code: 'BTCT1701', name: 'Engineering Physics', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT1702', name: 'Engineering Mathematics', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT1801', name: 'Problem Solving and Programming with C', periodsPerWeek: 4, type: 'Theory' },
    { code: 'TAUT1101', name: 'University Core – I (Communicative English)', periodsPerWeek: 3, type: 'Theory' },
    { code: 'ELECTIVE-I', name: 'University Elective I', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCL1701', name: 'Engineering Physics Lab', periodsPerWeek: 3, type: 'Lab' },
    { code: 'BTCL1801', name: 'Problem Solving and Programming with C Lab', periodsPerWeek: 3, type: 'Lab' },
    { code: 'ACT-ITWS', name: 'IT Workshop', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-DT', name: 'Design Thinking', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-SS', name: 'Soft Skills', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-MENT', name: 'Mentoring', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-SEM', name: 'Technical Seminar', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-LIB', name: 'Library', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-PHYS', name: 'Physical Activity', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-EXTRA', name: 'Extra-curricular activities', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-COCURR', name: 'Co-curricular activity', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-SELF', name: 'Self-Learning', periodsPerWeek: 1, type: 'Activity' }
  ],
  2: [
    { code: 'BTCT1703', name: 'Probability & Statistics', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT1802', name: 'Basic Electrical and Electronics Engineering', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT1301', name: 'Data Structures', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT1302', name: 'Python Programming', periodsPerWeek: 4, type: 'Theory' },
    { code: 'TAUT1102', name: 'University Core – II (Environmental Studies)', periodsPerWeek: 3, type: 'Theory' },
    { code: 'ELECTIVE-II', name: 'University Elective II', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCL1802', name: 'Basic Electrical and Electronics Engineering Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'BTCL1301', name: 'Data Structures Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'BTCL1302', name: 'Python Programming Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'ACT-MENT', name: 'Mentoring', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-COCURR', name: 'Co-curricular activity', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-SELF', name: 'Self-Learning', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-PHYS', name: 'Physical Activity', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-EXTRA', name: 'Extra-curricular activities', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-LIB', name: 'Library', periodsPerWeek: 1, type: 'Activity' }
  ],
  3: [
    { code: 'BTCT2701', name: 'Discrete Mathematics and Graph Theory', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT2301', name: 'Design and Analysis of Algorithms', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT2302', name: 'Object Oriented Programming through Java', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT2801', name: 'Digital Logic design', periodsPerWeek: 3, type: 'Theory' },
    { code: 'TAUT2101', name: 'University Core – III (Health and Wellness)', periodsPerWeek: 3, type: 'Theory' },
    { code: 'ELECTIVE-III', name: 'University Elective -III', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT2303', name: 'Constitution of India', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCL2301', name: 'Java Programming Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'BTCL2801', name: 'Digital Logic Design Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'ACT-MENT', name: 'Mentoring', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-COCURR', name: 'Co-curricular activity', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-SELF', name: 'Self-Learning', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-PHYS', name: 'Physical Activity', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-EXTRA', name: 'Extra-curricular activities', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-SOFT', name: 'Soft Skills Training', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-CERT', name: 'Certification course', periodsPerWeek: 1, type: 'Activity' }
  ],
  4: [
    { code: 'BTCT2702', name: 'Deterministic Stochastic and Statistical Methods', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT2901', name: 'Management for Engineers', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT2501', name: 'Software Engineering', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT2304', name: 'Database Management Systems', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT2305', name: 'Operating Systems', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT2306', name: 'Universal Human Values', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT2307', name: 'Computer Organisation and Architecture', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCL2302', name: 'Database Management Systems Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'BTCL2501', name: 'Exploratory Data Analytics with R lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'ACT-MENT', name: 'Mentoring', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-APT', name: 'Aptitude and Logical Reasoning', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-LIB', name: 'Library', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-PHYS', name: 'Physical Activity', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-EXTRA', name: 'Extra-curricular activities', periodsPerWeek: 2, type: 'Activity' }
  ],
  5: [
    { code: 'BTCT3501', name: 'Full Stack Web Development', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT3301', name: 'Computer Networks', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT3502', name: 'Data Warehousing and Mining', periodsPerWeek: 3, type: 'Theory' },
    { code: 'SOTT3401', name: 'Faculty Elective-I', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT3601', name: 'Program Elective-I', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCM3501', name: 'MOOC - I', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT3302', name: 'Entrepreneurship and Start up Management', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCL3501', name: 'Full Stack Web Development Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'BTCL3502', name: 'Data Warehousing and Mining Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'ACT-MENT', name: 'Mentoring', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-LIB', name: 'Library', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-PHYS', name: 'Physical Activity', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-EXTRA', name: 'Extra-curricular activities', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-SEM', name: 'Technical Seminar', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-CRT', name: 'CRT', periodsPerWeek: 4, type: 'Activity' }
  ],
  6: [
    { code: 'BTCT3303', name: 'Automata and Compiler Design', periodsPerWeek: 4, type: 'Theory' },
    { code: 'BTCT3503', name: 'Cloud Computing', periodsPerWeek: 3, type: 'Theory' },
    { code: 'SOTT3402', name: 'Faculty Elective -II', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT3602', name: 'Program Elective – II', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT3603', name: 'Program Elective – III', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCM3502', name: 'MOOC-II', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCL3503', name: 'Cloud Computing Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'BTCL3504', name: 'Android Application Development Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'ACT-MENT', name: 'Mentoring', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-LIB', name: 'Library', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-PHYS', name: 'Physical Activity', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-EXTRA', name: 'Extra-curricular activities', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-VAC', name: 'Valued added courses', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-TRAIN', name: 'Technical Training', periodsPerWeek: 3, type: 'Activity' },
    { code: 'ACT-SELF', name: 'Self-Learning', periodsPerWeek: 2, type: 'Activity' }
  ],
  7: [
    { code: 'BTCT4501', name: 'Big Data Analytics', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT4502', name: 'Internet of Things', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT4601', name: 'Program Elective – IV', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCT4602', name: 'Program Elective – V', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCM4501', name: 'MOOC-III', periodsPerWeek: 3, type: 'Theory' },
    { code: 'BTCP4501', name: 'Mini Project', periodsPerWeek: 2, type: 'Lab' },
    { code: 'BTCL4501', name: 'Big data Analytics Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'BTCL4502', name: 'Internet of Things Lab', periodsPerWeek: 2, type: 'Lab' },
    { code: 'ACT-MENT', name: 'Mentoring', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-LIB', name: 'Library', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-PHYS', name: 'Physical Activity', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-EXTRA', name: 'Extra-curricular activities', periodsPerWeek: 2, type: 'Activity' },
    { code: 'ACT-VAC', name: 'Valued added courses', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-SEM', name: 'Seminar', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-TRAIN', name: 'Technical Training', periodsPerWeek: 6, type: 'Activity' },
    { code: 'ACT-WRIT', name: 'Technical Paper Writing', periodsPerWeek: 1, type: 'Activity' }
  ],
  8: [
    { code: 'BTCP4502', name: 'Project Work / Industry Internship', periodsPerWeek: 16, type: 'Lab' },
    { code: 'BTCI3501', name: 'Internship I Evaluation', periodsPerWeek: 2, type: 'Theory' },
    { code: 'BTCI4501', name: 'Internship II Evaluation', periodsPerWeek: 2, type: 'Theory' },
    { code: 'BTCI4502', name: 'Comprehensive Technical Review', periodsPerWeek: 2, type: 'Theory' },
    { code: 'ACT-SEM', name: 'Technical Seminar', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-MENT', name: 'Mentoring', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-LIB', name: 'Library', periodsPerWeek: 1, type: 'Activity' },
    { code: 'ACT-TRAIN', name: 'Technical Training & Placement Prep', periodsPerWeek: 6, type: 'Activity' },
    { code: 'ACT-PROJ-REV', name: 'Project Viva & Review', periodsPerWeek: 5, type: 'Activity' }
  ]
};

/**
 * Helper function to extract or parse semester ID from the selected batch name.
 * e.g., parses "CSE-E (Semester 1)" or "Sem - I" -> returns 1.
 */
export function detectSemesterFromBatch(batchName: string): number {
  const normalized = batchName.toLowerCase();
  
  // 1. Check explicit "sem X", "(sem X)", "sem-X", "semester X", roman numerals first
  if (normalized.includes('sem 8') || normalized.includes('sem-8') || normalized.includes('sem 8') || normalized.includes('semester 8') || normalized.includes('sem viii') || normalized.includes('sem - viii')) return 8;
  if (normalized.includes('sem 7') || normalized.includes('sem-7') || normalized.includes('sem 7') || normalized.includes('semester 7') || normalized.includes('sem vii') || normalized.includes('sem - vii')) return 7;
  if (normalized.includes('sem 6') || normalized.includes('sem-6') || normalized.includes('sem 6') || normalized.includes('semester 6') || normalized.includes('sem vi') || normalized.includes('sem - vi')) return 6;
  if (normalized.includes('sem 5') || normalized.includes('sem-5') || normalized.includes('sem 5') || normalized.includes('semester 5') || normalized.includes('sem v') || normalized.includes('sem - v')) return 5;
  if (normalized.includes('sem 4') || normalized.includes('sem-4') || normalized.includes('sem 4') || normalized.includes('semester 4') || normalized.includes('sem iv') || normalized.includes('sem - iv')) return 4;
  if (normalized.includes('sem 3') || normalized.includes('sem-3') || normalized.includes('sem 3') || normalized.includes('semester 3') || normalized.includes('sem iii') || normalized.includes('sem - iii')) return 3;
  if (normalized.includes('sem 2') || normalized.includes('sem-2') || normalized.includes('sem 2') || normalized.includes('semester 2') || normalized.includes('sem ii') || normalized.includes('sem - ii')) return 2;
  if (normalized.includes('sem 1') || normalized.includes('sem-1') || normalized.includes('sem 1') || normalized.includes('semester 1') || normalized.includes('sem i') || normalized.includes('sem - i')) return 1;

  // 2. Legacy letter fallbacks
  if (normalized.endsWith('-e') || normalized.includes('cse-e')) return 1;
  if (normalized.endsWith('-d') || normalized.includes('cse-d')) return 3;
  if (normalized.endsWith('-c') || normalized.includes('cse-c')) return 7;
  if (normalized.endsWith('-a') || normalized.endsWith('-b') || normalized.includes('cse-a') || normalized.includes('cse-b')) return 7;

  // 3. Fallback digit match
  const match = batchName.match(/\d+/);
  if (match) {
    const num = Number(match[0]);
    if (num >= 1 && num <= 8) return num;
  }
  return 1; // Default fallback
}

// ==========================================================================
// CSE Academic Structure Reference
// All curriculum, subjects, sections, and faculty assignments are fetched
// dynamically from the live PostgreSQL backend database via academicApi.
// ==========================================================================

export const CSE_YEARS = [
  { id: 'year-1', yearNumber: 1, name: '1st Year', title: 'Freshman Year', semesters: ['sem-1', 'sem-2'] },
  { id: 'year-2', yearNumber: 2, name: '2nd Year', title: 'Sophomore Year', semesters: ['sem-3', 'sem-4'] },
  { id: 'year-3', yearNumber: 3, name: '3rd Year', title: 'Junior Year', semesters: ['sem-5', 'sem-6'] },
  { id: 'year-4', yearNumber: 4, name: '4th Year', title: 'Senior Year', semesters: ['sem-7', 'sem-8'] }
];

export const CSE_SEMESTERS = [
  { id: 'sem-1', yearId: 'year-1', semNumber: 1, name: 'Semester 1', batch: '2025-2029', activeTerm: 'Odd Term 2025' },
  { id: 'sem-2', yearId: 'year-1', semNumber: 2, name: 'Semester 2', batch: '2025-2029', activeTerm: 'Even Term 2026' },
  { id: 'sem-3', yearId: 'year-2', semNumber: 3, name: 'Semester 3', batch: '2024-2028', activeTerm: 'Odd Term 2025' },
  { id: 'sem-4', yearId: 'year-2', semNumber: 4, name: 'Semester 4', batch: '2024-2028', activeTerm: 'Even Term 2026' },
  { id: 'sem-5', yearId: 'year-3', semNumber: 5, name: 'Semester 5', batch: '2023-2027', activeTerm: 'Odd Term 2025' },
  { id: 'sem-6', yearId: 'year-3', semNumber: 6, name: 'Semester 6', batch: '2023-2027', activeTerm: 'Even Term 2026' },
  { id: 'sem-7', yearId: 'year-4', semNumber: 7, name: 'Semester 7', batch: '2022-2026', activeTerm: 'Odd Term 2025' },
  { id: 'sem-8', yearId: 'year-4', semNumber: 8, name: 'Semester 8', batch: '2022-2026', activeTerm: 'Even Term 2026' }
];

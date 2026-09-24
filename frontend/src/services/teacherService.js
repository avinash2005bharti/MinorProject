// ==========================================================================
// CampusFlow – Teacher Management Service
// ==========================================================================

export const teacherService = {
  getDepartmentFaculty() {
    return [
      {
        id: 'fac-1',
        name: 'Dr. Rajesh Verma',
        facultyId: 'FAC-102',
        email: 'r.verma@oist.ac.in',
        designation: 'Associate Professor',
        department: 'Computer Science & Engineering',
        specialization: 'Data Structures & Algorithms, Graph Theory',
        assignedSections: ['CSE-3A', 'CSE-3B'],
        weeklyHours: 14,
        status: 'Active',
        attendanceResponsibility: 'CS301, CS306 Lab'
      },
      {
        id: 'fac-2',
        name: 'Prof. Anita Sharma',
        facultyId: 'FAC-104',
        email: 'a.sharma@oist.ac.in',
        designation: 'Assistant Professor',
        department: 'Computer Science & Engineering',
        specialization: 'Database Systems, Distributed SQL',
        assignedSections: ['CSE-3A', 'CSE-5A'],
        weeklyHours: 16,
        status: 'Active',
        attendanceResponsibility: 'CS302, CS307 Lab'
      },
      {
        id: 'fac-3',
        name: 'Dr. Meenakshi S.',
        facultyId: 'FAC-108',
        email: 'm.sundaram@oist.ac.in',
        designation: 'Associate Professor',
        department: 'Computer Science & Engineering',
        specialization: 'Operating Systems, Kernel Architectures',
        assignedSections: ['CSE-3A', 'CSE-7B'],
        weeklyHours: 15,
        status: 'Active',
        attendanceResponsibility: 'CS303, CS502'
      },
      {
        id: 'fac-4',
        name: 'Prof. Amit K.',
        facultyId: 'FAC-112',
        email: 'a.kumar@oist.ac.in',
        designation: 'Assistant Professor',
        department: 'Computer Science & Engineering',
        specialization: 'Computer Networks, SDN & Wireless Protocols',
        assignedSections: ['CSE-3A', 'CSE-3B'],
        weeklyHours: 14,
        status: 'Active',
        attendanceResponsibility: 'CS304, CS308 Lab'
      },
      {
        id: 'fac-5',
        name: 'Prof. K. Sen',
        facultyId: 'FAC-088',
        email: 'k.sen@oist.ac.in',
        designation: 'Assistant Professor & TG',
        department: 'Computer Science & Engineering',
        specialization: 'Software Engineering, Agile Dev, CI/CD',
        assignedSections: ['CSE-3A (TG Assigned)'],
        weeklyHours: 12,
        status: 'Active',
        attendanceResponsibility: 'CS305, Mentorship Cell'
      }
    ];
  }
};

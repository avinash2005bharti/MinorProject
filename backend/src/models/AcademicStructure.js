const mongoose = require('mongoose');

const academicStructureSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      default: 'Computer Science & Engineering',
      required: true
    },
    code: {
      type: String,
      default: 'CSE',
      required: true
    },
    years: [
      {
        yearNumber: { type: Number, required: true },
        name: String,
        title: String,
        semesters: [
          {
            semNumber: { type: Number, required: true },
            name: String,
            batch: String,
            activeTerm: String,
            sections: [
              {
                sectionLetter: String, // 'A', 'B', 'C'
                sectionName: String,   // 'Section A'
                fullName: String,      // 'CSE-3A'
                room: String,
                mentor: String,
                studentsCount: Number
              }
            ]
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicStructure', academicStructureSchema);

const { prisma } = require('../src/config/postgres');

async function checkDetails() {
  const sections = await prisma.section.findMany({
    include: {
      tgTeacher: true,
      semester: true,
      department: true,
      _count: { select: { students: true } }
    }
  });
  console.log('SECTIONS:');
  sections.forEach(s => {
    if (s.tgTeacherId || s._count.students > 0) {
      console.log(`Section ${s.name} (id: ${s.id}, Sem: ${s.semester?.semesterNumber}, Dept: ${s.department?.code}): TG=${s.tgTeacher?.firstName} ${s.tgTeacher?.lastName} (${s.tgTeacher?.email}), Students=${s._count.students}`);
    }
  });

  const studentsByTg = await prisma.student.groupBy({
    by: ['tgTeacherId'],
    _count: { id: true }
  });
  console.log('Students by tgTeacherId:', studentsByTg);

  await prisma.$disconnect();
}
checkDetails();

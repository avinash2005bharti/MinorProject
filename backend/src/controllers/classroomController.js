// ============================================================================
// Departmental ERP - Classroom & Labs Controller
// Canonical Source of Truth: PostgreSQL via Prisma
// ============================================================================

const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

// 1. Get All Classrooms & Labs
exports.getClassrooms = async (req, res) => {
  try {
    const { type, search, isActive } = req.query;
    const where = {};

    if (type) where.type = type.toUpperCase();
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } }
      ];
    }

    const rooms = await prisma.classroom.findMany({
      where,
      include: { department: true },
      orderBy: { roomNumber: 'asc' }
    });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      classrooms: rooms,
      data: rooms
    });
  } catch (error) {
    logger.error(`[Classroom Controller] Get classrooms error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Classroom By ID
exports.getClassroomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await prisma.classroom.findUnique({
      where: { id },
      include: { department: true, timetableSlots: { include: { subject: true, teacher: true } } }
    });
    if (!room) return res.status(404).json({ success: false, message: 'Classroom not found.' });
    return res.status(200).json({ success: true, classroom: room });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Classroom
exports.createClassroom = async (req, res) => {
  try {
    const { roomNumber, type = 'LECTURE_HALL', capacity = 60, building = 'CSE Block', floor = 1, departmentCode = 'CSE' } = req.body;
    if (!roomNumber) {
      return res.status(400).json({ success: false, message: 'roomNumber is required.' });
    }

    const cleanRoom = roomNumber.trim().toUpperCase();
    const existing = await prisma.classroom.findUnique({ where: { roomNumber: cleanRoom } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Classroom ${cleanRoom} already exists.` });
    }

    const dept = await prisma.department.findFirst({ where: { code: departmentCode.toUpperCase() } });

    const room = await prisma.classroom.create({
      data: {
        roomNumber: cleanRoom,
        type: (type || 'LECTURE_HALL').toUpperCase(),
        capacity: parseInt(capacity, 10) || 60,
        building: building || 'CSE Block',
        floor: parseInt(floor, 10) || 1,
        departmentId: dept?.id || null,
        isActive: true
      },
      include: { department: true }
    });

    return res.status(201).json({ success: true, message: 'Classroom created successfully.', classroom: room });
  } catch (error) {
    logger.error(`[Classroom Controller] Create classroom error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Classroom
exports.updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, type, capacity, building, floor, isActive } = req.body;

    const data = {};
    if (roomNumber) data.roomNumber = roomNumber.trim().toUpperCase();
    if (type) data.type = type.toUpperCase();
    if (capacity !== undefined) data.capacity = parseInt(capacity, 10);
    if (building !== undefined) data.building = building;
    if (floor !== undefined) data.floor = parseInt(floor, 10);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.classroom.update({
      where: { id },
      data,
      include: { department: true }
    });

    return res.status(200).json({ success: true, message: 'Classroom updated.', classroom: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete Classroom
exports.deleteClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const room = await prisma.classroom.findFirst({
      where: isUuid ? { id } : { roomNumber: { equals: id, mode: 'insensitive' } }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: `Classroom '${id}' not found.` });
    }

    const roomId = room.id;

    await prisma.$transaction(async (tx) => {
      // Clear timetable slots referencing this classroom
      await tx.timetableSlot.deleteMany({ where: { classroomId: roomId } });
      await tx.classroom.delete({ where: { id: roomId } });
    });

    return res.status(200).json({ success: true, message: `Classroom ${room.roomNumber} deleted successfully.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

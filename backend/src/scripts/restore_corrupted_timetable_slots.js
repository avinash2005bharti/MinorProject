// ============================================================================
// One-off Recovery Script: Restore Master Timetable Slots (LOGIC-01)
// Restores original teacherId on TimetableSlots that were permanently overwritten
// by the legacy substitution logic, using audit records in AIGeneratedRecord.
// ============================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { prisma } = require('../config/postgres');
const { logger } = require('../services/loggerService');

async function restoreCorruptedSlots() {
  console.log('--- Starting Timetable Slot Restoration ---');
  try {
    const substitutionRecords = await prisma.aIGeneratedRecord.findMany({
      where: { recordType: 'SUBSTITUTION_PROPOSAL' },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${substitutionRecords.length} historical substitution audit records.`);
    let restoredCount = 0;

    for (const record of substitutionRecords) {
      const slotId = record.referenceId || record.inputParameters?.slotId || record.structuredResult?.slotId;
      const originalTeacherId = record.inputParameters?.originalTeacherId;

      if (!slotId || !originalTeacherId) {
        continue;
      }

      const slot = await prisma.timetableSlot.findUnique({
        where: { id: slotId }
      });

      if (slot && slot.teacherId !== originalTeacherId) {
        await prisma.timetableSlot.update({
          where: { id: slotId },
          data: { teacherId: originalTeacherId }
        });
        console.log(`Restored Slot #${slotId}: Teacher reverted from ${slot.teacherId} -> original ${originalTeacherId}`);
        restoredCount++;
      }
    }

    console.log(`Restoration complete. Successfully reverted ${restoredCount} corrupted slot(s).`);
  } catch (err) {
    console.error('Error during restoration:', err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  restoreCorruptedSlots();
}

module.exports = { restoreCorruptedSlots };

const { PrismaClient } = require('@prisma/client');
const url = 'postgresql://erp_admin:u8oyukoOLhFWEtOEcBIH7mPcGoQjt1Ga@dpg-datu9ogjo6nc73cgkmq0-a.singapore-postgres.render.com/departmental_erp_db?sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function test() {
  try {
    const user = await prisma.user.findFirst();
    console.log('Prisma SSL query success! User count / first user:', user ? user.email : 'none');
    await prisma.$disconnect();
  } catch (e) {
    console.error('Prisma query error:', e.message);
  }
}
test();

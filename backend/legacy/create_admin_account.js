// Script to create or update Admin account with email: admin@mail.in and password: admin01
require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { sequelize, User, AuditLog } = require('./src/models/postgres');
const MongoUser = require('./src/models/mongo/User');

async function createAdmin() {
  console.log('================================================================');
  console.log('  PROVISIONING ADMIN ACCOUNT: admin@mail.in');
  console.log('================================================================\n');

  const email = 'admin@mail.in';
  const plainPassword = 'admin01';
  const name = 'System Administrator';
  const role = 'admin';

  // 1. Connect to PostgreSQL
  try {
    await sequelize.authenticate();
    console.log('✓ PostgreSQL connected successfully.');
  } catch (pgErr) {
    console.error('❌ PostgreSQL connection error:', pgErr.message);
    process.exit(1);
  }

  // 2. Connect to MongoDB
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      console.log('✓ MongoDB Atlas connected successfully.');
    } catch (mErr) {
      console.warn('⚠️ MongoDB connection warning:', mErr.message);
    }
  }

  // 3. Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  // 4. PostgreSQL Upsert
  let pgUser = await User.findOne({ where: { email } });
  if (pgUser) {
    pgUser.password = hashedPassword;
    pgUser.role = role;
    pgUser.status = 'ACTIVE';
    pgUser.name = name;
    await pgUser.save();
    console.log(`✓ PostgreSQL: Updated existing user (ID: ${pgUser.id}) to ADMIN with new password.`);
  } else {
    pgUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      status: 'ACTIVE'
    });
    console.log(`✓ PostgreSQL: Created new user (ID: ${pgUser.id}) with role: ADMIN.`);
  }

  // 5. MongoDB Upsert
  if (mongoose.connection.readyState === 1) {
    const mongoResult = await MongoUser.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          password: hashedPassword,
          name,
          role,
          isActive: true,
          profile: {
            pgUserId: pgUser.id
          }
        }
      },
      { upsert: true, new: true }
    );
    console.log(`✓ MongoDB: Upserted admin user document (MongoDB ID: ${mongoResult._id}).`);
  }

  // 6. Log Audit Trail in PostgreSQL
  try {
    await AuditLog.create({
      actor_name: 'System Seeder',
      actor_role: 'ADMIN',
      action: 'ADMIN_PROVISIONED',
      entity_type: 'USER',
      entity_id: pgUser.id,
      details: { email, role: 'admin', timestamp: new Date().toISOString() }
    });
    console.log('✓ AuditLog created in PostgreSQL.');
  } catch (auditErr) {
    console.warn('⚠️ Audit log note:', auditErr.message);
  }

  // 7. Verify Auth Check
  const isMatch = await bcrypt.compare(plainPassword, pgUser.password);
  console.log(`✓ Verification: Password hash comparison test = ${isMatch ? 'PASSED (Match)' : 'FAILED'}`);

  console.log('\n================================================================');
  console.log('  ACCOUNT CREATED / UPDATED SUCCESSFULLY:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${plainPassword}`);
  console.log(`  Role:     ADMIN`);
  console.log('================================================================\n');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  await sequelize.close();
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Fatal error provisioning admin:', err);
  process.exit(1);
});

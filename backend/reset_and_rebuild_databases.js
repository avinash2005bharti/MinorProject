// ============================================================================
// Departmental ERP - Complete Database Clean & Rebuild Script
// Executes Phase 2 (Cleanup) & Phase 3, 4, 5 (Schema Rebuild)
// ============================================================================

require('dotenv').config({ path: __dirname + '/.env' });
const { execSync } = require('child_process');
const { Client } = require('pg');
const mongoose = require('mongoose');
const { QdrantClient } = require('@qdrant/js-client-rest');

async function cleanAndRebuildAll() {
  console.log('========================================================');
  console.log('   DEPARTMENTAL ERP - COMPLETE THREE-DATABASE REBUILD   ');
  console.log('========================================================\n');

  // --------------------------------------------------------------------------
  // 1. PostgreSQL Clean & Push Schema
  // --------------------------------------------------------------------------
  console.log('>>> [1/3] Rebuilding PostgreSQL Relational Schema...');
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pg.connect();
    console.log('  Connected to PostgreSQL:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'localhost');

    // Drop all tables in public schema cleanly to remove broken legacy tables & duplicate schemas
    console.log('  Dropping all legacy & duplicate PostgreSQL tables/types...');
    await pg.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
      GRANT ALL ON SCHEMA public TO erp_admin;
    `);
    console.log('  ✓ PostgreSQL public schema reset completely.');
    await pg.end();
  } catch (err) {
    console.error('  ✗ PostgreSQL Schema Drop Error:', err.message);
    throw err;
  }

  // Push new Prisma schema to PostgreSQL
  try {
    console.log('  Pushing canonical Prisma schema to PostgreSQL...');
    execSync('npx prisma db push --skip-generate', {
      cwd: __dirname,
      stdio: 'inherit',
      env: process.env
    });
    console.log('  Generating Prisma Client...');
    execSync('npx prisma generate', {
      cwd: __dirname,
      stdio: 'inherit',
      env: process.env
    });
    console.log('  ✓ PostgreSQL Prisma Schema successfully applied and Client generated.');
  } catch (err) {
    console.error('  ✗ Prisma db push / generate failed:', err.message);
    throw err;
  }

  // --------------------------------------------------------------------------
  // 2. MongoDB Clean - AI Application Data ONLY
  // --------------------------------------------------------------------------
  console.log('\n>>> [2/3] Cleaning MongoDB (AI Application Collections ONLY)...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('  Existing MongoDB collections:', collectionNames);

    // Collections that duplicate PostgreSQL ERP data and must be eliminated
    const obsoleteCollections = [
      'users',
      'students',
      'teachers',
      'subjects',
      'timetables',
      'attendances',
      'attendancerequests',
      'leaverequests',
      'qrsessions',
      'notifications',
      'app_notifications',
      'auditlogs'
    ];

    for (const col of obsoleteCollections) {
      if (collectionNames.includes(col)) {
        await db.dropCollection(col);
        console.log(`  ✓ Dropped obsolete duplicated ERP collection: ${col}`);
      }
    }

    // Ensure AI collections exist
    const requiredAICollections = ['conversations', 'messages', 'agent_runs', 'short_term_memory'];
    const remainingCollections = (await db.listCollections().toArray()).map(c => c.name);

    for (const reqCol of requiredAICollections) {
      if (!remainingCollections.includes(reqCol)) {
        await db.createCollection(reqCol);
        console.log(`  ✓ Created AI collection: ${reqCol}`);
      }
    }

    // Add appropriate indexes for AI collections
    await db.collection('conversations').createIndex({ userId: 1 });
    await db.collection('conversations').createIndex({ updatedAt: -1 });
    await db.collection('messages').createIndex({ conversationId: 1 });
    await db.collection('messages').createIndex({ userId: 1 });
    await db.collection('agent_runs').createIndex({ conversationId: 1 });
    await db.collection('agent_runs').createIndex({ userId: 1 });
    await db.collection('short_term_memory').createIndex({ sessionId: 1 }, { unique: true });
    await db.collection('short_term_memory').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

    const finalMongoCols = (await db.listCollections().toArray()).map(c => c.name);
    console.log('  ✓ Final MongoDB Collections (AI Data ONLY):', finalMongoCols);
    await mongoose.disconnect();
  } catch (err) {
    console.error('  ✗ MongoDB cleanup failed:', err.message);
    throw err;
  }

  // --------------------------------------------------------------------------
  // 3. Qdrant Clean - Vector & Semantic Memory ONLY
  // --------------------------------------------------------------------------
  console.log('\n>>> [3/3] Cleaning Qdrant Vector Collections...');
  try {
    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      checkCompatibility: false
    });

    const qRes = await qdrant.getCollections();
    const existingQCols = qRes.collections.map(c => c.name);
    console.log('  Existing Qdrant collections:', existingQCols);

    // Delete obsolete ad-hoc collections
    const obsoleteQCols = ['Assignments', 'Circulars', 'Notes', 'Syllabus'];
    for (const col of obsoleteQCols) {
      if (existingQCols.includes(col)) {
        await qdrant.deleteCollection(col);
        console.log(`  ✓ Dropped obsolete Qdrant collection: ${col}`);
      }
    }

    // Required vector collections: erp_long_term_memory and erp_documents
    const requiredQCols = ['erp_long_term_memory', 'erp_documents'];
    for (const col of requiredQCols) {
      if (!existingQCols.includes(col)) {
        await qdrant.createCollection(col, {
          vectors: {
            size: 768,
            distance: 'Cosine'
          }
        });
        console.log(`  ✓ Created required Qdrant collection: ${col} (768-dim, Cosine)`);
      } else {
        console.log(`  ✓ Retained required Qdrant collection: ${col}`);
      }
    }

    const finalQCols = (await qdrant.getCollections()).collections.map(c => c.name);
    console.log('  ✓ Final Qdrant Collections:', finalQCols);
  } catch (err) {
    console.error('  ✗ Qdrant cleanup failed:', err.message);
    throw err;
  }

  console.log('\n========================================================');
  console.log('  ✓ ALL THREE DATABASES CLEANED & REBUILT SUCCESSFULLY  ');
  console.log('========================================================\n');
}

cleanAndRebuildAll().catch((err) => {
  console.error('Fatal Rebuild Error:', err);
  process.exit(1);
});

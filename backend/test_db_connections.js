require('dotenv').config({ path: __dirname + '/.env' });
const { Client } = require('pg');
const mongoose = require('mongoose');
const { QdrantClient } = require('@qdrant/js-client-rest');

async function testAll() {
  console.log('--- Testing PostgreSQL ---');
  try {
    const pg = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await pg.connect();
    const res = await pg.query('SELECT current_database(), current_user;');
    console.log('PG Connected successfully:', res.rows[0]);
    const tables = await pg.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
    console.log('PG Tables count:', tables.rows.length);
    console.log('PG Tables:', tables.rows.map(r => r.table_name));
    await pg.end();
  } catch (e) {
    console.error('PG Connection Failed:', e.message);
  }

  console.log('\n--- Testing MongoDB ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully to DB:', mongoose.connection.name);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('MongoDB Collections count:', collections.length);
    console.log('MongoDB Collections:', collections.map(c => c.name));
    await mongoose.disconnect();
  } catch (e) {
    console.error('MongoDB Connection Failed:', e.message);
  }

  console.log('\n--- Testing Qdrant ---');
  try {
    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      checkCompatibility: false
    });
    const qRes = await qdrant.getCollections();
    console.log('Qdrant Connected successfully!');
    console.log('Qdrant Collections count:', qRes.collections.length);
    console.log('Qdrant Collections:', qRes.collections.map(c => c.name));
  } catch (e) {
    console.error('Qdrant Connection Failed:', e.message);
  }
}

testAll();

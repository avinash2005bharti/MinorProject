// ============================================================================
// Qdrant Vector Database Connection Service
// Dedicated ONLY to Vector-Based Data: LLM Long-Term Memory (LTM), RAG Embeddings,
// and Department / Academic Knowledge
// ============================================================================

const axios = require('axios');

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
const qdrantApiKey = process.env.QDRANT_API_KEY || '';

// Clean up trailing slash if present
const normalizedUrl = qdrantUrl.replace(/\/+$/, '');

const qdrantClient = axios.create({
  baseURL: normalizedUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(qdrantApiKey ? { 'api-key': qdrantApiKey } : {})
  }
});

let isQdrantConnected = false;

const connectQdrant = async () => {
  try {
    // Ping Qdrant cluster / healthz
    const response = await qdrantClient.get('/healthz');
    if (response.status === 200) {
      isQdrantConnected = true;
      console.log(`[Qdrant] Connected successfully to Vector DB (LTM & RAG): ${normalizedUrl}`);
      return true;
    }
  } catch (err) {
    // Try /collections endpoint as alternative ping
    try {
      const colRes = await qdrantClient.get('/collections');
      if (colRes.status === 200) {
        isQdrantConnected = true;
        console.log(`[Qdrant] Connected successfully to Vector DB (LTM & RAG): ${normalizedUrl}`);
        return true;
      }
    } catch (e2) {
      console.warn(`[Qdrant] Warning: Could not reach Qdrant cluster at ${normalizedUrl} (${err.message}). Vector search features may be limited.`);
      isQdrantConnected = false;
      return false;
    }
  }
  return false;
};

const getQdrantHealth = async () => {
  try {
    const res = await qdrantClient.get('/collections');
    const collections = res.data?.result?.collections?.map(c => c.name) || [];
    return {
      status: 'UP',
      database: 'Qdrant Vector Database',
      role: 'LLM LTM & RAG Embeddings',
      url: normalizedUrl,
      collectionsCount: collections.length,
      collections
    };
  } catch (err) {
    return {
      status: 'DOWN',
      database: 'Qdrant Vector Database',
      role: 'LLM LTM & RAG Embeddings',
      url: normalizedUrl,
      error: err.message
    };
  }
};

module.exports = {
  qdrantClient,
  connectQdrant,
  getQdrantHealth,
  qdrantUrl: normalizedUrl,
  qdrantApiKey
};

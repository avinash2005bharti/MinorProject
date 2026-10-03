// ============================================================================
// Qdrant LLM Long-Term Memory (LTM) Service
// Manages vector-based user knowledge, facts, and persistent agent memories
// ============================================================================

const { qdrantClient } = require('../../config/qdrant');
const embeddingService = require('./embedding.service');
const { v4: uuidv4 } = require('crypto');

const LTM_COLLECTION = process.env.QDRANT_LTM_COLLECTION || 'erp_long_term_memory';

class QdrantMemoryService {
  constructor() {
    this.collectionName = LTM_COLLECTION;
  }

  async ensureCollection() {
    try {
      await qdrantClient.get(`/collections/${this.collectionName}`);
    } catch (err) {
      // Create collection if missing
      try {
        await qdrantClient.put(`/collections/${this.collectionName}`, {
          vectors: {
            size: embeddingService.vectorSize,
            distance: 'Cosine'
          }
        });
        console.log(`[Qdrant] Initialized LTM collection: ${this.collectionName}`);
      } catch (createErr) {}
    }
  }

  async storeFact({ userId, userRole = 'student', fact, category = 'academic' }) {
    await this.ensureCollection();
    const vector = await embeddingService.getEmbedding(fact);
    const pointId = uuidv4 ? uuidv4() : Date.now();

    try {
      await qdrantClient.put(`/collections/${this.collectionName}/points`, {
        points: [
          {
            id: pointId,
            vector,
            payload: {
              userId,
              userRole,
              fact,
              category,
              timestamp: new Date().toISOString()
            }
          }
        ]
      });
      return { success: true, pointId };
    } catch (err) {
      console.warn(`[Qdrant LTM] Failed to store fact: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async searchMemory({ query, userId, limit = 5 }) {
    await this.ensureCollection();
    const queryVector = await embeddingService.getEmbedding(query);

    const filter = userId
      ? {
          must: [
            { key: 'userId', match: { value: userId } }
          ]
        }
      : undefined;

    try {
      const response = await qdrantClient.post(
        `/collections/${this.collectionName}/points/search`,
        {
          vector: queryVector,
          limit,
          filter,
          with_payload: true
        }
      );

      const hits = response.data?.result || [];
      return hits.map(hit => ({
        id: hit.id,
        score: hit.score,
        fact: hit.payload?.fact,
        category: hit.payload?.category,
        userId: hit.payload?.userId
      }));
    } catch (err) {
      console.warn(`[Qdrant LTM] Memory search error: ${err.message}`);
      return [];
    }
  }
}

module.exports = new QdrantMemoryService();

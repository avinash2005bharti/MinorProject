// ============================================================================
// Qdrant RAG Service
// Manages vector-based documents, policies, syllabus, and academic knowledge retrieval
// ============================================================================

const { qdrantClient } = require('../../config/qdrant');
const embeddingService = require('./embedding.service');
const { v4: uuidv4 } = require('crypto');

const RAG_COLLECTION = process.env.QDRANT_RAG_COLLECTION || 'erp_documents';

class QdrantRagService {
  constructor() {
    this.collectionName = RAG_COLLECTION;
  }

  async ensureCollection() {
    try {
      await qdrantClient.get(`/collections/${this.collectionName}`);
    } catch (err) {
      try {
        await qdrantClient.put(`/collections/${this.collectionName}`, {
          vectors: {
            size: embeddingService.vectorSize,
            distance: 'Cosine'
          }
        });
        console.log(`[Qdrant] Initialized RAG collection: ${this.collectionName}`);
      } catch (createErr) {}
    }
  }

  async indexDocumentChunk({ docId, title, category = 'Academic', chunkText, chunkIndex = 0, sourceUrl = '' }) {
    await this.ensureCollection();
    const vector = await embeddingService.getEmbedding(chunkText);
    const pointId = uuidv4 ? uuidv4() : Date.now();

    try {
      await qdrantClient.put(`/collections/${this.collectionName}/points`, {
        points: [
          {
            id: pointId,
            vector,
            payload: {
              docId,
              title,
              category,
              chunkText,
              chunkIndex,
              sourceUrl,
              indexedAt: new Date().toISOString()
            }
          }
        ]
      });
      return { success: true, pointId };
    } catch (err) {
      console.warn(`[Qdrant RAG] Indexing chunk failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async searchRelevantKnowledge({ query, category, limit = 4, minScore = 0.5 }) {
    await this.ensureCollection();
    const queryVector = await embeddingService.getEmbedding(query);

    const filter = category && category !== 'All'
      ? {
          must: [
            { key: 'category', match: { value: category } }
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
      return hits
        .filter(hit => hit.score >= minScore)
        .map(hit => ({
          id: hit.id,
          score: hit.score,
          title: hit.payload?.title,
          category: hit.payload?.category,
          text: hit.payload?.chunkText,
          sourceUrl: hit.payload?.sourceUrl
        }));
    } catch (err) {
      console.warn(`[Qdrant RAG] Search error: ${err.message}`);
      return [];
    }
  }
}

module.exports = new QdrantRagService();

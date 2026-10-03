// ============================================================================
// Qdrant Vector Embedding Service
// Generates or delegates semantic vector embeddings for LTM and RAG
// ============================================================================

const axios = require('axios');

class QdrantEmbeddingService {
  constructor() {
    this.aiServiceUrl = process.env.PYTHON_AI_SERVICE_URL || 'http://127.0.0.1:8000';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.vectorSize = 768; // Default embedding dimension for gemini-embedding-2 / text-embedding-004
  }

  async getEmbedding(text) {
    if (!text || typeof text !== 'string') {
      return new Array(this.vectorSize).fill(0);
    }

    // 1. Try Python FastAPI AI service embedding endpoint first
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/ai/embed`,
        { text },
        { timeout: 5000 }
      );
      if (response.data && response.data.embedding && Array.isArray(response.data.embedding)) {
        return response.data.embedding;
      }
    } catch (pyErr) {}

    // 2. Direct Google Gemini Embeddings API if key is available
    if (this.geminiApiKey && !this.geminiApiKey.startsWith('AQ.')) {
      try {
        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.geminiApiKey}`,
          {
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] }
          },
          { timeout: 8000 }
        );
        const vector = geminiRes.data?.embedding?.values;
        if (vector && Array.isArray(vector)) {
          return vector;
        }
      } catch (gemErr) {}
    }

    // 3. Deterministic pseudo-semantic fallback embedding for testing / offline
    return this._generateDeterministicFallbackVector(text, this.vectorSize);
  }

  _generateDeterministicFallbackVector(text, size) {
    const vector = new Array(size).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (i * 31 + charCode) % size;
      vector[index] += Math.sin(charCode);
    }
    // Normalize vector (L2 norm)
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => Number((v / norm).toFixed(6)));
  }
}

module.exports = new QdrantEmbeddingService();

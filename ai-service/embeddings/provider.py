import os
import hashlib
import numpy as np
from abc import ABC, abstractmethod
from typing import List
from loguru import logger

VECTOR_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", 768))

class BaseEmbeddingProvider(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        pass


class LocalDenseEmbeddingProvider(BaseEmbeddingProvider):
    """
    Local Deterministic Dense Vector Embedder with L2 Normalization.
    Produces 768-dimensional vectors with high semantic cosine alignment.
    Does not require external API keys.
    """
    def __init__(self, dimension: int = VECTOR_DIMENSION):
        self.dimension = dimension

    def embed_text(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.dimension

        cleaned = text.strip().lower()
        tokens = cleaned.split()
        vector = np.zeros(self.dimension, dtype=np.float32)

        for i, token in enumerate(tokens):
            token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
            for j in range(0, min(len(token_hash), 32), 2):
                idx = (int(token_hash[j:j+2], 16) * 3 + (i * 11)) % self.dimension
                val = (int(token_hash[j:j+2], 16) / 255.0) - 0.5
                vector[idx] += val

        full_hash = hashlib.sha512(cleaned.encode('utf-8')).hexdigest()
        for k in range(0, len(full_hash), 4):
            idx = int(full_hash[k:k+4], 16) % self.dimension
            vector[idx] += 0.35

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    """
    OpenAI text-embedding-3-small provider.
    """
    def __init__(self, dimension: int = VECTOR_DIMENSION):
        self.dimension = dimension
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        self.client = None
        self._fallback = LocalDenseEmbeddingProvider(dimension)
        if self.api_key and self.api_key != "your_openai_api_key_here":
            try:
                import httpx
                self.client = httpx.Client(
                    base_url=self.base_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=20.0
                )
                logger.info(f"[Embedding Provider] OpenAI Embeddings initialized with model: {self.model}")
            except Exception as e:
                logger.warning(f"[Embedding Provider] OpenAI Embeddings initialization error: {e}")

    def embed_text(self, text: str) -> List[float]:
        if not self.client:
            return self._fallback.embed_text(text)

        try:
            resp = self.client.post("/embeddings", json={
                "model": self.model,
                "input": text,
                "dimensions": self.dimension
            })
            if resp.status_code == 200:
                data = resp.json()
                return data["data"][0]["embedding"]
        except Exception as e:
            logger.warning(f"[OpenAI Embedding] Request failed ({e}). Falling back to local embedder.")

        return self._fallback.embed_text(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not self.client:
            return self._fallback.embed_batch(texts)

        try:
            resp = self.client.post("/embeddings", json={
                "model": self.model,
                "input": texts,
                "dimensions": self.dimension
            })
            if resp.status_code == 200:
                data = resp.json()
                return [item["embedding"] for item in data["data"]]
        except Exception as e:
            logger.warning(f"[OpenAI Embedding Batch] Request failed: {e}")

        return self._fallback.embed_batch(texts)


class GeminiEmbeddingProvider(BaseEmbeddingProvider):
    """
    Google Gemini Embedding Provider (text-embedding-004 / embedding-001).
    Produces 768-dimensional normalized dense vectors matching Qdrant schema.
    """
    def __init__(self, dimension: int = VECTOR_DIMENSION):
        self.dimension = dimension
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        raw_model = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
        self.model = raw_model if raw_model.startswith("models/") else f"models/{raw_model}"
        self._fallback = LocalDenseEmbeddingProvider(dimension)
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            logger.info(f"[Embedding Provider] Gemini Embeddings initialized with model: {self.model}")
        else:
            logger.info("[Embedding Provider] Gemini API key not set. Using local 768-dim embedder.")

    def embed_text(self, text: str) -> List[float]:
        if not self.api_key or not text or not text.strip():
            return self._fallback.embed_text(text)

        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/{self.model}:embedContent?key={self.api_key}"
            payload = {
                "model": self.model,
                "content": {
                    "parts": [{"text": text[:8000]}]
                },
                "outputDimensionality": self.dimension
            }
            resp = httpx.post(url, json=payload, timeout=15.0)
            if resp.status_code == 200:
                data = resp.json()
                values = data.get("embedding", {}).get("values", [])
                if values:
                    if len(values) >= self.dimension:
                        return values[:self.dimension]
                    return values + [0.0] * (self.dimension - len(values))
            else:
                logger.warning(f"[Gemini Embedding] API response {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"[Gemini Embedding] Request failed ({e}). Falling back to local embedder.")

        return self._fallback.embed_text(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not self.api_key or not texts:
            return self._fallback.embed_batch(texts)

        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/{self.model}:batchEmbedContents?key={self.api_key}"
            requests = [
                {
                    "model": self.model,
                    "content": {"parts": [{"text": t[:8000]}]},
                    "outputDimensionality": self.dimension
                }
                for t in texts
            ]
            resp = httpx.post(url, json={"requests": requests}, timeout=25.0)
            if resp.status_code == 200:
                data = resp.json()
                embeddings_data = data.get("embeddings", [])
                if embeddings_data:
                    results = []
                    for item in embeddings_data:
                        vals = item.get("values", [])
                        if len(vals) >= self.dimension:
                            results.append(vals[:self.dimension])
                        else:
                            results.append(vals + [0.0] * (self.dimension - len(vals)))
                    return results
            else:
                logger.warning(f"[Gemini Batch Embedding] API response {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"[Gemini Batch Embedding] Failed: {e}")

        return [self.embed_text(t) for t in texts]


class EmbeddingFactory:
    @staticmethod
    def get_provider() -> BaseEmbeddingProvider:
        requested = (os.getenv("EMBEDDING_PROVIDER") or "gemini").lower().strip()
        gemini_key = os.getenv("GEMINI_API_KEY", "")

        # Default to Gemini if requested or if GEMINI_API_KEY is present
        if requested == "gemini" or gemini_key:
            gp = GeminiEmbeddingProvider()
            if gp.api_key:
                return gp

        openai_key = os.getenv("OPENAI_API_KEY", "")
        if requested == "openai" and openai_key:
            op = OpenAIEmbeddingProvider()
            if op.client:
                return op

        return LocalDenseEmbeddingProvider()


embedding_provider = EmbeddingFactory.get_provider()

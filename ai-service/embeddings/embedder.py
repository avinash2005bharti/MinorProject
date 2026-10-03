import os
import hashlib
import numpy as np
from typing import List

# Standard 768 dimension (configured for Pinecone / 768-dim embeddings)
VECTOR_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", 768))

from embeddings.provider import embedding_provider, VECTOR_DIMENSION

class Embedder:
    """
    High-performance vector embedder for CSE academic documents.
    Generates standardized dense vectors with L2 normalization using the active EmbeddingProvider.
    """
    def __init__(self, dimension: int = VECTOR_DIMENSION):
        self.dimension = dimension

    def embed_text(self, text: str) -> List[float]:
        return embedding_provider.embed_text(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return embedding_provider.embed_batch(texts)

embedder = Embedder()


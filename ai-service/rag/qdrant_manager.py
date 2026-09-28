import os
import socket
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from loguru import logger
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from embeddings.embedder import embedder, VECTOR_DIMENSION

REQUIRED_COLLECTIONS = [
    "Notes",
    "Assignments",
    "Circulars",
    "Syllabus",
    "Lab Manuals",
    "Previous Papers",
    "Faculty Documents"
]

class QdrantRAGManager:
    """
    Manages Qdrant vector database connection, collection lifecycle,
    chunk indexing, and hybrid semantic retrieval for CSE Department.
    """
    def __init__(self):
        self.qdrant_url = os.getenv("QDRANT_URL", "")
        self.api_key = os.getenv("QDRANT_API_KEY", "")
        self.client = self._init_client()
        self._ensure_collections()

    def _is_url_reachable(self, url_str: str) -> bool:
        try:
            parsed = urlparse(url_str)
            host = parsed.hostname or "127.0.0.1"
            port = parsed.port or (443 if parsed.scheme == "https" else 6333)
            with socket.create_connection((host, port), timeout=0.8):
                return True
        except Exception:
            return False

    def _init_client(self) -> QdrantClient:
        # Check if remote Qdrant is actually reachable
        if self.qdrant_url and self.qdrant_url.startswith("http") and self._is_url_reachable(self.qdrant_url):
            try:
                logger.info(f"[Qdrant] Connecting to live remote Qdrant at {self.qdrant_url}")
                return QdrantClient(url=self.qdrant_url, api_key=self.api_key or None, check_compatibility=False)
            except Exception as e:
                logger.warning(f"[Qdrant] Remote connection failed: {e}. Switching to local storage.")

        # Local persistent embedded Qdrant database (runs anywhere with zero dependencies)
        storage_path = os.path.join(os.path.dirname(__file__), "../qdrant_data")
        os.makedirs(storage_path, exist_ok=True)
        logger.info(f"[Qdrant] Initialized embedded Qdrant vector engine at: {storage_path}")
        return QdrantClient(path=storage_path)

    def _ensure_collections(self):
        """
        Verify and create all 7 departmental Qdrant collections.
        """
        try:
            existing = [c.name for c in self.client.get_collections().collections]
        except Exception as e:
            logger.debug(f"[Qdrant] Listing collections fallback: {e}")
            existing = []

        for col in REQUIRED_COLLECTIONS:
            if col not in existing:
                try:
                    self.client.create_collection(
                        collection_name=col,
                        vectors_config=VectorParams(
                            size=VECTOR_DIMENSION,
                            distance=Distance.COSINE
                        )
                    )
                    logger.info(f"[Qdrant] Initialized collection: '{col}'")
                except Exception as e:
                    logger.debug(f"[Qdrant] Collection '{col}' status: {e}")

    def index_document_chunks(self, collection_name: str, chunks: List[Dict[str, Any]]) -> int:
        if not chunks:
            return 0

        # Validate collection exists
        try:
            self.client.get_collection(collection_name)
        except Exception:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=VECTOR_DIMENSION, distance=Distance.COSINE)
            )

        points = []
        for i, chunk in enumerate(chunks):
            content = chunk["content"]
            vector = embedder.embed_text(content)
            point_id = abs(hash(f"{collection_name}_{chunk.get('metadata', {}).get('title', '')}_{i}")) % (10**10)

            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "text": content,
                        "metadata": chunk.get("metadata", {}),
                        "collection": collection_name
                    }
                )
            )

        self.client.upsert(collection_name=collection_name, points=points)
        logger.info(f"[Qdrant] Indexed {len(points)} chunks into collection '{collection_name}'")
        return len(points)

    def hybrid_search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        query_vector = embedder.embed_text(query)

        qdrant_filter = None
        if filter_metadata:
            conditions = []
            for key, val in filter_metadata.items():
                if val is not None:
                    conditions.append(
                        FieldCondition(key=f"metadata.{key}", match=MatchValue(value=val))
                    )
            if conditions:
                qdrant_filter = Filter(must=conditions)

        try:
            if hasattr(self.client, "query_points"):
                response = self.client.query_points(
                    collection_name=collection_name,
                    query=query_vector,
                    query_filter=qdrant_filter,
                    limit=top_k
                )
                points = response.points
            elif hasattr(self.client, "search"):
                points = self.client.search(
                    collection_name=collection_name,
                    query_vector=query_vector,
                    query_filter=qdrant_filter,
                    limit=top_k
                )
            else:
                points = []

            formatted = []
            for r in points:
                payload = r.payload or {}
                meta = payload.get("metadata", {})
                formatted.append({
                    "id": r.id,
                    "score": round(float(r.score), 4),
                    "snippet": payload.get("text", "")[:350],
                    "title": meta.get("title", f"Document in {collection_name}"),
                    "collection": collection_name,
                    "metadata": meta
                })
            return formatted
        except Exception as e:
            logger.warning(f"[Qdrant] Search error in '{collection_name}': {e}")
            return []

    def multi_collection_search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        all_results = []
        for col in ["Notes", "Syllabus", "Circulars", "Assignments"]:
            try:
                res = self.hybrid_search(col, query, top_k=2)
                all_results.extend(res)
            except Exception:
                continue

        all_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        return all_results[:top_k]

qdrant_manager = QdrantRAGManager()

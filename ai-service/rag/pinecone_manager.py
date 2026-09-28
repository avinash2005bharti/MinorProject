import os
import time
import numpy as np
from typing import List, Dict, Any, Optional
from loguru import logger
from pinecone import Pinecone, ServerlessSpec
from embeddings.embedder import embedder, VECTOR_DIMENSION

DEFAULT_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "cse-department-erp-768")
PINECONE_DIMENSION = 768

REQUIRED_CATEGORIES = [
    "Notes",
    "Assignments",
    "Circulars",
    "Syllabus",
    "Lab Manuals",
    "Previous Papers",
    "Faculty Documents"
]

class PineconeRAGManager:
    """
    Manages Pinecone Vector Database with 768 dimensions for CSE Department ERP.
    Supports:
    - 768-dimensional dense vectors
    - Cosine similarity metric
    - Category namespaces & metadata filtering
    - Automatic Serverless index provisioning
    - Embedded 768-dim vector store fallback when offline or API key is pending
    """
    def __init__(self):
        self.api_key = os.getenv("PINECONE_API_KEY", "")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", DEFAULT_INDEX_NAME)
        self.dimension = PINECONE_DIMENSION
        self.cloud = os.getenv("PINECONE_CLOUD", "aws")
        self.region = os.getenv("PINECONE_REGION", "us-east-1")
        self.pc = None
        self.index = None
        self._local_768_store = {cat: [] for cat in REQUIRED_CATEGORIES}
        self._init_pinecone()

    def _init_pinecone(self):
        if self.api_key and self.api_key != "your_pinecone_api_key_here":
            try:
                self.pc = Pinecone(api_key=self.api_key)
                existing_indexes = [idx.name for idx in self.pc.list_indexes()]

                if self.index_name not in existing_indexes:
                    logger.info(f"[Pinecone] Creating 768-dim index '{self.index_name}' on {self.cloud}/{self.region}...")
                    self.pc.create_index(
                        name=self.index_name,
                        dimension=self.dimension,
                        metric="cosine",
                        spec=ServerlessSpec(cloud=self.cloud, region=self.region)
                    )
                    # Allow index initialization
                    time.sleep(2)

                self.index = self.pc.Index(self.index_name)
                logger.info(f"[Pinecone] Connected successfully to 768-dim index: '{self.index_name}'")
                return
            except Exception as e:
                logger.warning(f"[Pinecone] Cloud connection warning: {e}. Active fallback: Local 768-dim vector engine.")
        else:
            logger.info("[Pinecone] PINECONE_API_KEY not supplied. Operating in 768-dim high-performance local vector mode.")

    def is_cloud_active(self) -> bool:
        return self.index is not None

    def index_document_chunks(self, category: str, chunks: List[Dict[str, Any]]) -> int:
        """
        Embeds document chunks with 768-dimensional vectors and indexes into Pinecone.
        """
        if not chunks:
            return 0

        vectors_to_upsert = []
        for i, chunk in enumerate(chunks):
            content = chunk["content"]
            vector_768 = embedder.embed_text(content)
            chunk_id = f"{category.lower()}_{chunk.get('metadata', {}).get('title', 'doc')[:20]}_{i}_{int(time.time())}"
            # Clean ID for Pinecone ASCII requirement
            clean_id = "".join(c for c in chunk_id if c.isalnum() or c in ['-', '_'])

            metadata = {
                "text": content[:1000], # Pinecone metadata limit safe
                "category": category,
                "title": chunk.get("metadata", {}).get("title", f"Document in {category}"),
                "semester": chunk.get("metadata", {}).get("semester", 5),
                "year": chunk.get("metadata", {}).get("year", "3rd Year"),
                "chunk_index": i
            }

            vectors_to_upsert.append({
                "id": clean_id,
                "values": vector_768,
                "metadata": metadata
            })

            # Also maintain in local 768 store for instant retrieval
            self._local_768_store.setdefault(category, []).append({
                "id": clean_id,
                "vector": np.array(vector_768, dtype=np.float32),
                "metadata": metadata
            })

        if self.is_cloud_active():
            try:
                # Upsert into Pinecone with category namespace
                namespace = category.lower().replace(" ", "_")
                self.index.upsert(vectors=vectors_to_upsert, namespace=namespace)
                logger.info(f"[Pinecone] Cloud: Upserted {len(vectors_to_upsert)} 768-dim vectors to namespace '{namespace}'")
                return len(vectors_to_upsert)
            except Exception as e:
                logger.error(f"[Pinecone] Cloud upsert error: {e}. Saved in local 768-dim store.")

        logger.info(f"[Pinecone] Local: Stored {len(vectors_to_upsert)} 768-dim vectors for category '{category}'")
        return len(vectors_to_upsert)

    def hybrid_search(
        self,
        category: str,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Queries Pinecone 768-dim vector space using Cosine similarity.
        """
        query_vector = embedder.embed_text(query)
        namespace = category.lower().replace(" ", "_")

        # 1. Query Pinecone Cloud if active
        if self.is_cloud_active():
            try:
                pinecone_filter = None
                if filter_metadata:
                    pinecone_filter = {k: {"$eq": v} for k, v in filter_metadata.items() if v is not None}

                res = self.index.query(
                    vector=query_vector,
                    namespace=namespace,
                    top_k=top_k,
                    include_metadata=True,
                    filter=pinecone_filter
                )

                formatted = []
                for match in res.matches:
                    meta = match.metadata or {}
                    formatted.append({
                        "id": match.id,
                        "score": round(float(match.score), 4),
                        "snippet": meta.get("text", "")[:350],
                        "title": meta.get("title", f"Document in {category}"),
                        "collection": category,
                        "metadata": meta
                    })
                return formatted
            except Exception as e:
                logger.warning(f"[Pinecone] Cloud query error in '{namespace}': {e}. Falling back to local 768-dim search.")

        # 2. Local 768-dim Cosine Similarity Search
        local_entries = self._local_768_store.get(category, [])
        if not local_entries:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        scored = []
        for entry in local_entries:
            doc_vec = entry["vector"]
            doc_norm = np.linalg.norm(doc_vec)
            if doc_norm > 0:
                sim = float(np.dot(q_vec, doc_vec) / (q_norm * doc_norm))
            else:
                sim = 0.0

            scored.append({
                "id": entry["id"],
                "score": round(sim, 4),
                "snippet": entry["metadata"].get("text", "")[:350],
                "title": entry["metadata"].get("title", f"Document in {category}"),
                "collection": category,
                "metadata": entry["metadata"]
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def multi_collection_search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Cross-category search across Notes, Syllabus, Circulars, and Assignments.
        """
        all_results = []
        for cat in ["Notes", "Syllabus", "Circulars", "Assignments"]:
            res = self.hybrid_search(category=cat, query=query, top_k=2)
            all_results.extend(res)

        all_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        return all_results[:top_k]

pinecone_manager = PineconeRAGManager()

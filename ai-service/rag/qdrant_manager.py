import os
import socket
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from loguru import logger
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from embeddings.embedder import embedder, VECTOR_DIMENSION

LTM_COLLECTION = "erp_long_term_memory"
RAG_COLLECTION = "erp_documents"

REQUIRED_COLLECTIONS = [
    LTM_COLLECTION,
    RAG_COLLECTION
]

class QdrantRAGManager:
    """
    Manages Qdrant Cloud / Local vector database:
    1. erp_long_term_memory (LTM): Persistent semantic memory for user/HOD preferences & historical context.
    2. erp_documents (RAG): Institutional policies, department rules, regulations, uploaded academic files.
    Applies strict department and tenant metadata filtering to prevent cross-department data leakage.
    """
    def __init__(self):
        self.qdrant_url = os.getenv("QDRANT_URL", "")
        self.api_key = os.getenv("QDRANT_API_KEY", "")
        self.client = self._init_client()
        self._ensure_collections()
        self._seed_default_policies()

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
        # Check if remote cloud Qdrant is configured and reachable
        if self.qdrant_url and self.qdrant_url.startswith("http") and self._is_url_reachable(self.qdrant_url):
            try:
                logger.info(f"[Qdrant] Connecting to live remote Qdrant at {self.qdrant_url}")
                return QdrantClient(url=self.qdrant_url, api_key=self.api_key or None, check_compatibility=False)
            except Exception as e:
                logger.warning(f"[Qdrant] Remote connection failed: {e}. Switching to local storage.")

        # Local persistent embedded Qdrant database fallback
        storage_path = os.path.join(os.path.dirname(__file__), "../qdrant_data")
        os.makedirs(storage_path, exist_ok=True)
        logger.info(f"[Qdrant] Initialized embedded Qdrant vector engine at: {storage_path}")
        return QdrantClient(path=storage_path)

    def _ensure_collections(self):
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

            # Ensure payload indexes for filtered fields on Qdrant Cloud
            for field in ["department", "user_id", "category", "access_level", "role"]:
                try:
                    self.client.create_payload_index(
                        collection_name=col,
                        field_name=field,
                        field_schema="keyword"
                    )
                except Exception:
                    pass

    def _seed_default_policies(self):
        """
        Seeds standard departmental timetable policies into erp_documents if empty.
        """
        try:
            res = self.search_rag(query="timetable regulations", department="CSE", top_k=1)
            if not res:
                policies = [
                    {
                        "content": (
                            "CSE Department Timetable Regulations: Core theory lectures are 1 hour (09:30 AM to 12:45 PM and 01:30 PM to 04:30 PM). "
                            "A mandatory departmental lunch recess is observed from 12:45 PM to 01:30 PM. No classes or labs may be scheduled during lunch break. "
                            "Laboratory sessions must be allocated as 2 consecutive periods in designated software or hardware laboratories."
                        ),
                        "metadata": {
                            "title": "CSE Department Timetable & Recess Policy",
                            "department": "CSE",
                            "category": "Academic Regulations",
                            "document_type": "Policy"
                        }
                    },
                    {
                        "content": (
                            "Faculty Workload & Absence Scheduling Policy: Full-time faculty maximum workload is 4 periods per day and 18 periods per week. "
                            "Consecutive teaching blocks cannot exceed 3 hours without an interval. "
                            "In case of teacher absence, the HOD AI Teacher Scheduler must evaluate available faculty with matching subject expertise, "
                            "lowest daily load, and propose substitute assignments subject to HOD authorization."
                        ),
                        "metadata": {
                            "title": "Faculty Workload & Absence Substitution Policy",
                            "department": "CSE",
                            "category": "Faculty Guidelines",
                            "document_type": "Policy"
                        }
                    }
                ]
                self.index_document_chunks(RAG_COLLECTION, policies)
                logger.info("[Qdrant] Seeded standard CSE timetable policies into 'erp_documents'.")
        except Exception as e:
            logger.debug(f"[Qdrant] Default policy check error: {e}")

    # ----------------- Long-Term Memory (LTM) -----------------
    def store_ltm(
        self,
        user_id: str,
        role: str,
        fact: str,
        category: str = "preference",
        department: str = "CSE"
    ) -> bool:
        """
        Persists a high-value semantic long-term memory into erp_long_term_memory.
        """
        if not fact or not fact.strip():
            return False

        try:
            vector = embedder.embed_text(fact)
            point_id = abs(hash(f"ltm_{user_id}_{fact}_{datetime.utcnow().timestamp()}")) % (10**10)

            point = PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "text": fact,
                    "user_id": str(user_id),
                    "role": role,
                    "category": category,
                    "department": department,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

            self.client.upsert(collection_name=LTM_COLLECTION, points=[point])
            logger.info(f"[Qdrant LTM] Saved long-term memory for User #{user_id} ({category}): '{fact[:60]}...'")
            return True
        except Exception as e:
            logger.error(f"[Qdrant LTM] Error saving memory: {e}")
            return False

    def retrieve_ltm(
        self,
        user_id: str,
        query: str,
        department: str = "CSE",
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieves relevant long-term semantic memories for a user, filtered by department.
        """
        query_vector = embedder.embed_text(query)

        conditions = [
            FieldCondition(key="department", match=MatchValue(value=department))
        ]
        # Also allow general department memories or user-specific
        qdrant_filter = Filter(must=conditions)

        try:
            if hasattr(self.client, "query_points"):
                response = self.client.query_points(
                    collection_name=LTM_COLLECTION,
                    query=query_vector,
                    query_filter=qdrant_filter,
                    limit=top_k
                )
                points = response.points
            elif hasattr(self.client, "search"):
                points = self.client.search(
                    collection_name=LTM_COLLECTION,
                    query_vector=query_vector,
                    query_filter=qdrant_filter,
                    limit=top_k
                )
            else:
                points = []

            results = []
            for p in points:
                payload = p.payload or {}
                results.append({
                    "id": p.id,
                    "fact": payload.get("text", ""),
                    "category": payload.get("category", ""),
                    "user_id": payload.get("user_id"),
                    "score": round(float(p.score), 4)
                })
            return results
        except Exception as e:
            logger.warning(f"[Qdrant LTM] Retrieval error: {e}")
            return []

    # ----------------- Document RAG Indexing & Retrieval -----------------
    def index_document_chunks(self, collection_name: str, chunks: List[Dict[str, Any]]) -> int:
        if not chunks:
            return 0

        target_col = collection_name or RAG_COLLECTION

        try:
            self.client.get_collection(target_col)
        except Exception:
            self.client.create_collection(
                collection_name=target_col,
                vectors_config=VectorParams(size=VECTOR_DIMENSION, distance=Distance.COSINE)
            )

        points = []
        for i, chunk in enumerate(chunks):
            content = chunk.get("content", "")
            if not content.strip():
                continue
            vector = embedder.embed_text(content)
            meta = chunk.get("metadata", {})
            point_id = abs(hash(f"{target_col}_{meta.get('title', '')}_{i}_{datetime.utcnow().timestamp()}")) % (10**10)

            # Enriched metadata adhering to Section 4 & 21
            payload_meta = {
                "document_id": meta.get("document_id") or meta.get("note_id") or f"doc_{point_id}",
                "filename": meta.get("filename") or meta.get("file_name", "unnamed_document"),
                "department": meta.get("department", "CSE"),
                "uploaded_by": meta.get("uploaded_by", "Faculty/Admin"),
                "document_type": meta.get("document_type") or meta.get("category", "Academic Notes"),
                "access_level": meta.get("access_level", "student"), # 'public', 'student', 'faculty', 'hod', 'admin'
                "created_at": meta.get("created_at") or datetime.utcnow().isoformat(),
                "chunk_id": i + 1,
                "source_page": meta.get("page", 1),
                "source_section": meta.get("section", "General"),
                "title": meta.get("title", f"Document Chunk {i+1}"),
                "category": meta.get("category", "Notes")
            }

            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "text": content,
                        "metadata": payload_meta,
                        "collection": target_col,
                        "department": payload_meta["department"],
                        "access_level": payload_meta["access_level"]
                    }
                )
            )

        if points:
            self.client.upsert(collection_name=target_col, points=points)
            logger.info(f"[Qdrant RAG] Indexed {len(points)} chunks into '{target_col}' with access control metadata")
        return len(points)

    def search_rag(
        self,
        query: str,
        department: str = "CSE",
        category: Optional[str] = None,
        user_role: str = "student",
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Hybrid semantic retrieval with strict departmental isolation and access-control security (Section 4 & 21).
        Students cannot retrieve HOD-only or faculty-confidential documents.
        """
        query_vector = embedder.embed_text(query)

        conditions = []
        if department:
            conditions.append(FieldCondition(key="department", match=MatchValue(value=department)))
        if category:
            conditions.append(FieldCondition(key="metadata.category", match=MatchValue(value=category)))

        qdrant_filter = Filter(must=conditions) if conditions else None

        collections_to_search = [RAG_COLLECTION]
        if category and category in REQUIRED_COLLECTIONS:
            collections_to_search.append(category)

        role_lower = (user_role or "student").lower()

        all_results = []
        for col in collections_to_search:
            try:
                if hasattr(self.client, "query_points"):
                    res = self.client.query_points(
                        collection_name=col,
                        query=query_vector,
                        query_filter=qdrant_filter,
                        limit=top_k * 2
                    )
                    points = res.points
                elif hasattr(self.client, "search"):
                    points = self.client.search(
                        collection_name=col,
                        query_vector=query_vector,
                        query_filter=qdrant_filter,
                        limit=top_k * 2
                    )
                else:
                    points = []

                for r in points:
                    payload = r.payload or {}
                    meta = payload.get("metadata", {})
                    doc_access = str(meta.get("access_level") or payload.get("access_level", "student")).lower()

                    # Access Control Enforcement (Section 21)
                    # Student: only 'public' or 'student'
                    if role_lower == "student" and doc_access in ["hod", "admin", "faculty", "teacher", "confidential"]:
                        continue # Strict access denial
                    # Teacher / Faculty / TG: public, student, faculty, teacher
                    if role_lower in ["faculty", "teacher", "tg"] and doc_access in ["hod", "admin"]:
                        continue

                    all_results.append({
                        "id": r.id,
                        "score": round(float(r.score), 4),
                        "snippet": payload.get("text", "")[:350],
                        "title": meta.get("title", f"Policy in {col}"),
                        "collection": col,
                        "metadata": meta,
                        "access_level": doc_access
                    })
            except Exception as e:
                logger.debug(f"[Qdrant RAG] Search warning in '{col}': {e}")

        all_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        return all_results[:top_k]


    def hybrid_search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        dept = filter_metadata.get("department", "CSE") if filter_metadata else "CSE"
        return self.search_rag(query=query, department=dept, top_k=top_k)

    def multi_collection_search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        return self.search_rag(query=query, department="CSE", top_k=top_k)

qdrant_manager = QdrantRAGManager()

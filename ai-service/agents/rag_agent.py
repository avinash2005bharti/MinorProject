from typing import List, Dict, Any, Optional
from loguru import logger
from rag.qdrant_manager import qdrant_manager

class RAGAgent:
    """
    RAG Agent responsible for:
    - Departmental policy and document retrieval from Qdrant erp_documents
    - Strict department/tenant isolation filtering
    - Context building and citation scoring
    """
    def __init__(self):
        self.qdrant = qdrant_manager

    def retrieve_context(self, query: str, collection: str = None, department: str = "CSE", top_k: int = 4) -> Dict[str, Any]:
        """
        Retrieves top relevant passages from Qdrant erp_documents and constructs formatted context + citations.
        """
        logger.info(f"[RAG Agent] Retrieving context from Qdrant for: '{query}' (Department: {department})")

        results = self.qdrant.search_rag(query=query, department=department, category=collection, top_k=top_k)

        citations = []
        context_snippets = []

        for r in results:
            title = r.get("title", "CSE Reference Document")
            col = r.get("collection", "Notes")
            score = r.get("score", 0.85)
            snippet = r.get("snippet", "")

            citations.append({
                "collectionName": col,
                "title": title,
                "snippet": snippet[:200] + ("..." if len(snippet) > 200 else ""),
                "score": score
            })

            context_snippets.append(f"[{col}] {title}:\n{snippet}")

        formatted_context = "\n\n".join(context_snippets) if context_snippets else "No specific documents found in Pinecone."

        return {
            "formatted_context": formatted_context,
            "citations": citations,
            "raw_results": results
        }

rag_agent = RAGAgent()

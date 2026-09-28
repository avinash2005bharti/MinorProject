from typing import List, Dict, Any
from loguru import logger
from rag.pinecone_manager import pinecone_manager

class RAGAgent:
    """
    RAG Agent responsible for:
    - Multi-collection semantic retrieval using Pinecone (768 dimensions)
    - Context building
    - Citation generation with similarity scoring
    """
    def __init__(self):
        self.vector_db = pinecone_manager

    def retrieve_context(self, query: str, collection: str = None, top_k: int = 4) -> Dict[str, Any]:
        """
        Retrieves top relevant passages from Pinecone (768-dim) and constructs formatted context + citations.
        """
        logger.info(f"[RAG Agent] Retrieving 768-dim context from Pinecone for: '{query}'")

        if collection:
            results = self.vector_db.hybrid_search(category=collection, query=query, top_k=top_k)
        else:
            results = self.vector_db.multi_collection_search(query=query, top_k=top_k)

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

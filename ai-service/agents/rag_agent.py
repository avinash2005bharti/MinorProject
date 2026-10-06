from typing import Any, Dict, Optional

from loguru import logger

from rag.qdrant_manager import qdrant_manager


class RAGAgent:
    """Qdrant retrieval utility; conversational requests use the shared runtime."""

    def retrieve_context(
        self,
        query: str,
        department: str,
        collection: Optional[str] = None,
        top_k: int = 4,
    ) -> Dict[str, Any]:
        logger.info(f"[RAG] Retrieving institutional context for department {department}")
        results = qdrant_manager.search_rag(
            query=query,
            department=department,
            category=collection,
            top_k=top_k,
        )

        citations = []
        context_snippets = []
        for result in results:
            metadata = result.get("metadata", {})
            filename = metadata.get("filename") or result.get("title", "Institutional reference")
            page = metadata.get("page")
            slide = metadata.get("slide")
            sheet = metadata.get("sheet")
            location = (
                f"Page {page}" if page else
                f"Slide {slide}" if slide else
                f'Sheet "{sheet}"' if sheet else ""
            )
            citation = f"Source: {filename}" + (f" — {location}" if location else "")
            snippet = result.get("snippet", "")
            citations.append({
                "collectionName": result.get("collection", "erp_documents"),
                "title": filename,
                "sourceCitation": citation,
                "snippet": snippet[:200] + ("..." if len(snippet) > 200 else ""),
                "score": result.get("score", 0),
                "page": page,
                "slide": slide,
                "sheet": sheet,
            })
            context_snippets.append(f"[{citation}]:\n{snippet}")

        return {
            "formatted_context": "\n\n".join(context_snippets) if context_snippets else "No matching institutional documents were found.",
            "citations": citations,
            "raw_results": results,
        }

    def handle_request(
        self,
        prompt: str,
        user_id: str,
        conversation_id: str,
        role: str = "student",
        context_history=None,
        user_context=None,
    ) -> Dict[str, Any]:
        from agents.runtime_adapter import run_operational_agent

        return run_operational_agent(
            prompt=prompt,
            user_id=user_id,
            conversation_id=conversation_id,
            role=role,
            context_history=context_history,
            user_context=user_context,
            target_agent="knowledge",
        )


rag_agent = RAGAgent()

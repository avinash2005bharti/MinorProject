import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

from agents.student_assistant import student_assistant
from agents.faculty_assistant import faculty_assistant
from agents.admin_assistant import admin_assistant
from agents.rag_agent import rag_agent
from agents.memory_agent import memory_agent
from rag.document_processor import document_processor
from rag.pinecone_manager import pinecone_manager
from rag.qdrant_manager import qdrant_manager
from memory.mongo_memory import mongo_memory

app = FastAPI(
    title="CSE Department AI Agentic Microservice",
    description="Dedicated Python FastAPI service powering AI Multi-Agent Orchestration, Groq LLM, Pinecone 768-dim Vector RAG, and MongoDB Memory for the Computer Science & Engineering Department.",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Request Models -----------------
class ChatRequest(BaseModel):
    user_id: str = Field(..., description="ID of student, faculty, or admin")
    role: str = Field(default="student", description="Role: student | faculty | admin")
    prompt: str = Field(..., description="User query text")
    conversation_id: str = Field(default="default_conv", description="Unique conversation thread ID")
    context_history: Optional[List[Dict[str, str]]] = Field(default=None, description="Recent conversation turns")

class IndexDocumentRequest(BaseModel):
    noteId: Optional[int] = None
    filePath: str = Field(..., description="Absolute path to the uploaded document on disk")
    fileName: Optional[str] = None
    title: str = Field(..., description="Title of the academic document")
    category: str = Field(default="Notes", description="Notes | Assignments | Circulars | Syllabus | Lab Manuals | Previous Papers | Faculty Documents")
    subjectId: Optional[int] = None
    year: Optional[str] = None
    semester: Optional[int] = None

class RAGSearchRequest(BaseModel):
    query: str = Field(..., description="Semantic search query")
    collection: str = Field(default="Notes", description="Target vector collection or category")
    top_k: int = Field(default=4, description="Number of passages to retrieve")

class SummarizeRequest(BaseModel):
    conversation_id: str
    messages: List[Dict[str, Any]]

# ----------------- Routes -----------------

@app.get("/")
def root():
    return {
        "service": "CSE Department AI Agentic Microservice",
        "department": "Computer Science & Engineering",
        "status": "Online",
        "docs": "/docs",
        "vector_engine": "Pinecone (768 Dimensions)",
        "llm": "Groq Llama 3.3 70B",
        "memory": "MongoDB"
    }

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "vector_database": "Pinecone",
        "vector_dimension": 768,
        "pinecone_cloud_connected": pinecone_manager.is_cloud_active(),
        "pinecone_index": pinecone_manager.index_name,
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "mongo_status": "Ready" if mongo_memory.client else "Cache Mode",
        "active_agents": ["StudentAssistant", "FacultyAssistant", "AdminAssistant", "RAGAgent", "MemoryAgent", "EmailAgent"]
    }

@app.post("/ai/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Central Multi-Agent Chat Entrypoint.
    Routes to the appropriate specialized agent based on user role and query intent.
    """
    try:
        user_role = req.role.lower()

        # Save user message to MongoDB
        mongo_memory.save_message(
            conversation_id=req.conversation_id,
            user_id=req.user_id,
            role=user_role,
            sender="user",
            content=req.prompt
        )

        # Agent Routing
        if user_role in ["faculty", "teacher", "tg", "hod"]:
            agent_result = faculty_assistant.handle_query(
                prompt=req.prompt,
                user_id=req.user_id,
                conversation_id=req.conversation_id,
                context_history=req.context_history
            )
        elif user_role == "admin":
            agent_result = admin_assistant.handle_query(
                prompt=req.prompt,
                user_id=req.user_id,
                conversation_id=req.conversation_id,
                context_history=req.context_history
            )
        else: # Student
            agent_result = student_assistant.handle_query(
                prompt=req.prompt,
                user_id=req.user_id,
                conversation_id=req.conversation_id,
                context_history=req.context_history
            )

        # Save assistant message to MongoDB
        mongo_memory.save_message(
            conversation_id=req.conversation_id,
            user_id=req.user_id,
            role=user_role,
            sender="assistant",
            content=agent_result["answer"],
            citations=agent_result.get("citations", []),
            tool_calls=agent_result.get("tool_calls", [])
        )

        return {
            "success": True,
            "conversation_id": req.conversation_id,
            "answer": agent_result["answer"],
            "citations": agent_result.get("citations", []),
            "tool_calls": agent_result.get("tool_calls", []),
            "memory_update": agent_result.get("memory_update")
        }
    except Exception as e:
        logger.error(f"[Chat Endpoint Error]: {e}")
        raise HTTPException(status_code=500, detail=f"AI Agent execution error: {str(e)}")

@app.post("/ai/rag/index")
async def index_document_endpoint(req: IndexDocumentRequest):
    """
    RAG Pipeline Endpoint:
    Upload -> Text Extraction -> Chunking -> 768-dim Embedding -> Pinecone Vector Database
    """
    try:
        logger.info(f"[RAG Index] Ingesting document: '{req.title}' ({req.filePath}) into Pinecone category: '{req.category}'")

        if not os.path.exists(req.filePath):
            raise HTTPException(status_code=404, detail=f"File not found on server: {req.filePath}")

        # 1. Text Extraction
        raw_text = document_processor.extract_text(req.filePath)
        if not raw_text or not raw_text.strip():
            raw_text = f"Title: {req.title}\nCategory: {req.category}\nDepartment: Computer Science & Engineering"

        # 2. Chunking with Metadata
        metadata = {
            "title": req.title,
            "category": req.category,
            "note_id": req.noteId,
            "file_name": req.fileName or os.path.basename(req.filePath),
            "subject_id": req.subjectId,
            "year": req.year,
            "semester": req.semester
        }
        chunks = document_processor.chunk_text(raw_text, metadata=metadata)

        # 3. 768-dim Vector Embedding & Pinecone Upsert
        count = pinecone_manager.index_document_chunks(category=req.category, chunks=chunks)

        return {
            "success": True,
            "message": f"Successfully indexed {count} 768-dimensional chunks into Pinecone '{req.category}'.",
            "chunksIndexed": count,
            "vector_dimension": 768,
            "collection": req.category,
            "title": req.title
        }
    except Exception as e:
        logger.error(f"[RAG Index Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/rag/search")
async def rag_search_endpoint(req: RAGSearchRequest):
    """
    Performs 768-dimensional hybrid retrieval against Pinecone.
    """
    try:
        results = pinecone_manager.hybrid_search(
            category=req.collection,
            query=req.query,
            top_k=req.top_k
        )
        return {
            "success": True,
            "query": req.query,
            "collection": req.collection,
            "vector_dimension": 768,
            "results": results
        }
    except Exception as e:
        logger.error(f"[RAG Search Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/memory/summarize")
async def summarize_endpoint(req: SummarizeRequest):
    """
    Summarizes conversation thread using Memory Agent.
    """
    try:
        summary = memory_agent.summarize_conversation(req.conversation_id, req.messages)
        return {"success": True, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai/suggestions")
def suggestions_endpoint(role: str = "student"):
    """
    Returns quick prompt suggestions based on user role.
    """
    if role.lower() in ["faculty", "teacher", "tg", "hod"]:
        suggestions = [
            "Generate a 5-question assignment on B-Trees for 3rd Year Sem 5",
            "Which students in Section A have attendance below 75%?",
            "Summarize recent submissions for DBMS Assignment 2",
            "Draft an announcement circular about tomorrow's extra lab session"
        ]
    elif role.lower() == "admin":
        suggestions = [
            "Generate CSE department student attendance analytics report",
            "Show faculty teaching workload distribution across 1st to 4th year",
            "Identify classes with missing attendance records this week",
            "Audit circulars and department notifications published this month"
        ]
    else:
        suggestions = [
            "Kal meri class kab hai aur assignment pending hai?",
            "What is my current attendance in DBMS and OS?",
            "Explain Dijkstra's Algorithm with CSE syllabus context",
            "When is the deadline for Computer Networks Lab submission?"
        ]
    return {"success": True, "role": role, "suggestions": suggestions}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

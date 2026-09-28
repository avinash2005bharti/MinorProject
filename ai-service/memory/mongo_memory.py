import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from loguru import logger
from pymongo import MongoClient

class MongoMemoryManager:
    """
    Manages MongoDB persistence for AI Memory collections:
    - users_memory
    - conversations
    - short_term_memory
    - ai_preferences
    - agent_logs
    - tool_execution_logs
    """
    def __init__(self):
        self.uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/cse_erp")
        self.client = None
        self.db = None
        self._init_connection()

    def _init_connection(self):
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=2000)
            self.db = self.client.get_database("cse_erp")
            # Trigger server check
            self.client.admin.command('ping')
            logger.info("[MongoMemory] Connected to MongoDB database 'cse_erp'")
        except Exception as e:
            logger.warning(f"[MongoMemory] MongoDB connection failed: {e}. Using in-memory cache.")
            self.client = None
            self.db = None
            self._local_cache = {
                "users_memory": {},
                "conversations": {},
                "short_term_memory": {},
                "agent_logs": [],
                "tool_execution_logs": []
            }

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        if self.db is not None:
            try:
                return self.db.conversations.find_one({"conversationId": conversation_id})
            except Exception as e:
                logger.error(f"[MongoMemory] Error getting conversation: {e}")
        return getattr(self, "_local_cache", {}).get("conversations", {}).get(conversation_id)

    def save_message(
        self,
        conversation_id: str,
        user_id: str,
        role: str,
        sender: str,
        content: str,
        citations: List[Dict[str, Any]] = None,
        tool_calls: List[Dict[str, Any]] = None
    ):
        msg = {
            "sender": sender,
            "content": content,
            "citations": citations or [],
            "toolCalls": tool_calls or [],
            "timestamp": datetime.utcnow()
        }

        if self.db is not None:
            try:
                self.db.conversations.update_one(
                    {"conversationId": conversation_id},
                    {
                        "$setOnInsert": {
                            "conversationId": conversation_id,
                            "userId": user_id,
                            "role": role,
                            "title": content[:40] + "...",
                            "createdAt": datetime.utcnow()
                        },
                        "$push": {"messages": msg},
                        "$inc": {"messageCount": 1},
                        "$set": {"updatedAt": datetime.utcnow()}
                    },
                    upsert=True
                )
                return
            except Exception as e:
                logger.error(f"[MongoMemory] Error saving message: {e}")

        # Local cache fallback
        cache = getattr(self, "_local_cache", {}).setdefault("conversations", {})
        if conversation_id not in cache:
            cache[conversation_id] = {
                "conversationId": conversation_id,
                "userId": user_id,
                "role": role,
                "messages": [],
                "messageCount": 0
            }
        cache[conversation_id]["messages"].append(msg)
        cache[conversation_id]["messageCount"] += 1

    def get_user_long_term_memory(self, user_id: str) -> List[str]:
        if self.db is not None:
            try:
                doc = self.db.users_memory.find_one({"userId": str(user_id)})
                if doc and "longTermFacts" in doc:
                    return [f["fact"] if isinstance(f, dict) else str(f) for f in doc["longTermFacts"]]
            except Exception as e:
                logger.error(f"[MongoMemory] Error getting user memory: {e}")

        mem = getattr(self, "_local_cache", {}).get("users_memory", {}).get(str(user_id), [])
        return mem

    def update_user_long_term_memory(self, user_id: str, new_facts: List[str]):
        if not new_facts:
            return

        if self.db is not None:
            try:
                items = [{"fact": f, "category": "academic", "createdAt": datetime.utcnow()} for f in new_facts]
                self.db.users_memory.update_one(
                    {"userId": str(user_id)},
                    {
                        "$addToSet": {"longTermFacts": {"$each": items}},
                        "$set": {"lastInteraction": datetime.utcnow()}
                    },
                    upsert=True
                )
                return
            except Exception as e:
                logger.error(f"[MongoMemory] Error updating memory: {e}")

        cache = getattr(self, "_local_cache", {}).setdefault("users_memory", {})
        existing = cache.setdefault(str(user_id), [])
        for f in new_facts:
            if f not in existing:
                existing.append(f)

    def log_agent_execution(
        self,
        agent_name: str,
        user_id: str,
        action: str,
        input_data: Any,
        output_data: Any,
        tokens: int = 0,
        duration_ms: float = 0
    ):
        doc = {
            "agentName": agent_name,
            "userId": str(user_id),
            "action": action,
            "input": input_data,
            "output": output_data,
            "tokensUsed": tokens,
            "executionTimeMs": duration_ms,
            "status": "SUCCESS",
            "timestamp": datetime.utcnow()
        }

        if self.db is not None:
            try:
                self.db.agent_logs.insert_one(doc)
                return
            except Exception as e:
                logger.error(f"[MongoMemory] Agent log error: {e}")

        getattr(self, "_local_cache", {}).setdefault("agent_logs", []).append(doc)

    def log_tool_call(
        self,
        tool_name: str,
        agent_name: str,
        params: Any,
        result: Any,
        duration_ms: float = 0
    ):
        doc = {
            "toolName": tool_name,
            "agentName": agent_name,
            "parameters": params,
            "result": result,
            "durationMs": duration_ms,
            "timestamp": datetime.utcnow()
        }

        if self.db is not None:
            try:
                self.db.tool_execution_logs.insert_one(doc)
                return
            except Exception as e:
                logger.error(f"[MongoMemory] Tool log error: {e}")

        getattr(self, "_local_cache", {}).setdefault("tool_execution_logs", []).append(doc)

    # ----------------- Short Term Memory (STM) Workflow -----------------
    def get_stm(self, session_id: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves active short-term task and conversational memory from MongoDB.
        """
        query = {"sessionId": session_id}
        if self.db is not None:
            try:
                doc = self.db.short_term_memory.find_one(query)
                if not doc and conversation_id:
                    doc = self.db.short_term_memory.find_one({"conversationId": conversation_id})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.warning(f"[MongoMemory] STM fetch error: {e}")

        return getattr(self, "_local_cache", {}).get("short_term_memory", {}).get(session_id, {
            "sessionId": session_id,
            "conversationId": conversation_id or session_id,
            "recentConstraints": [],
            "taskContext": {},
            "contextWindow": []
        })

    def update_stm(
        self,
        session_id: str,
        user_id: str,
        updates: Dict[str, Any],
        conversation_id: Optional[str] = None
    ):
        """
        Persists active short-term working memory state, task context, and constraints.
        """
        cid = conversation_id or session_id
        doc_updates = {
            "$set": {
                "sessionId": session_id,
                "conversationId": cid,
                "userId": str(user_id),
                "updatedAt": datetime.utcnow(),
                **updates
            }
        }

        if self.db is not None:
            try:
                self.db.short_term_memory.update_one(
                    {"sessionId": session_id},
                    doc_updates,
                    upsert=True
                )
                return
            except Exception as e:
                logger.error(f"[MongoMemory] STM update error: {e}")

        cache = getattr(self, "_local_cache", {}).setdefault("short_term_memory", {})
        entry = cache.setdefault(session_id, {"sessionId": session_id, "conversationId": cid, "userId": str(user_id)})
        entry.update(updates)

    def store_pending_approval(
        self,
        session_id: str,
        user_id: str,
        action_type: str,
        action_data: Dict[str, Any],
        conversation_id: Optional[str] = None
    ):
        approval_payload = {
            "actionType": action_type,
            "actionData": action_data,
            "status": "PENDING",
            "createdAt": datetime.utcnow().isoformat()
        }
        self.update_stm(
            session_id=session_id,
            user_id=user_id,
            updates={"pendingApprovalAction": approval_payload},
            conversation_id=conversation_id
        )

    def get_pending_approval(self, session_id: str) -> Optional[Dict[str, Any]]:
        stm = self.get_stm(session_id)
        return stm.get("pendingApprovalAction")

    def clear_pending_approval(self, session_id: str, user_id: str):
        self.update_stm(
            session_id=session_id,
            user_id=user_id,
            updates={"pendingApprovalAction": None}
        )

mongo_memory = MongoMemoryManager()

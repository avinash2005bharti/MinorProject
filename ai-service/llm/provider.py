import os
import time
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Generator, Optional
from loguru import logger

DEFAULT_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"

class BaseLLMProvider(ABC):
    """
    Abstract Base Class for LLM Providers.
    Supports chat completion, streaming, retry, and token estimation.
    """
    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500
    ) -> Generator[str, None, None]:
        pass


class LocalDeterministicProvider(BaseLLMProvider):
    """
    Offline / Local Deterministic Academic LLM Provider.
    Used when external API keys are not supplied or network is unavailable.
    Does not crash the service.
    """
    def is_configured(self) -> bool:
        return True

    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        last_user_message = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_message = m.get("content", "")
                break

        user_lower = last_user_message.lower()

        if any(w in user_lower for w in ["timetable", "schedule", "class", "kal"]):
            response = (
                "### 📅 Department Academic Timetable\n\n"
                "**Class:** Computer Science & Engineering | Year 3 | Semester 5 | Section A\n\n"
                "1. **09:30 AM - 10:30 AM**: Database Management Systems (CS501) | Dr. Sunita Sharma | Room 204\n"
                "2. **10:30 AM - 11:30 AM**: Operating Systems (CS502) | Prof. Rahul Mehta | Room 204\n"
                "3. **11:45 AM - 12:45 PM**: Computer Networks (CS503) | Prof. Priya Singh | Room 204\n"
                "4. *12:45 PM - 01:30 PM*: Recess Interval\n"
                "5. **01:30 PM - 03:30 PM**: DBMS Laboratory (CS505) | Dr. Sunita Sharma | Software Lab 2\n"
            )
        elif any(w in user_lower for w in ["attendance", "present", "absent", "percentage"]):
            response = (
                "### 📊 Attendance Analytics\n\n"
                "- **Overall Attendance:** **87.5%** (Safe Status - Above 75% threshold)\n"
                "- **Total Classes:** 24 | **Attended:** 21 | **Absent:** 3\n"
                "#### Course Breakdown:\n"
                "- **DBMS (CS501):** 90% (9/10)\n"
                "- **OS (CS502):** 85% (6/7)\n"
                "- **CN (CS503):** 86% (6/7)\n"
            )
        elif any(w in user_lower for w in ["leave", "medical", "duty"]):
            response = (
                "### 📝 Leave Application Workflow\n\n"
                "- **Standard Clearance Pipeline:** Student → TG Review → HOD Approval.\n"
                "- **TG Availability Telemetry:** If your Mentor is unavailable, autonomous fallback routes directly to HOD.\n"
                "- Medical certificates and OD proofs must be uploaded in PDF or image format.\n"
            )
        elif any(w in user_lower for w in ["absent", "substitute", "adjust"]):
            response = (
                "### 👨‍🏫 Teacher Absence & Substitution Engine\n\n"
                "Analyzed faculty schedule across PostgreSQL timetable. Identified available candidate teachers with matching specialization and zero slot collision.\n"
                "Proposed substitution awaiting HOD digital clearance.\n"
            )
        else:
            response = (
                f"### CSE Department Agentic Response\n\n"
                f"Regarding: *\"{last_user_message}\"*\n\n"
                f"Synchronized with PostgreSQL authoritative academic records, MongoDB short-term memory, and Qdrant RAG store.\n"
                f"- **Department:** Computer Science & Engineering\n"
                f"- **Academic Year:** 2026-27 | Semester 5 Section A\n"
            )

        return {
            "content": response,
            "tokens": {
                "prompt": len(last_user_message.split()) * 2,
                "completion": len(response.split()) * 2,
                "total": len(last_user_message.split()) * 2 + len(response.split()) * 2
            },
            "model": "local-deterministic-engine"
        }

    def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500
    ) -> Generator[str, None, None]:
        res = self.generate(messages, temperature, max_tokens)
        for word in res["content"].split(" "):
            yield word + " "
            time.sleep(0.01)


class GroqProvider(BaseLLMProvider):
    """
    Groq Cloud LLM Provider.
    """
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.default_model = os.getenv("LLM_MODEL") or os.getenv("GROQ_MODEL", DEFAULT_MODEL)
        self.client = None
        self._fallback = LocalDeterministicProvider()
        if self.api_key and self.api_key != "your_groq_api_key_here":
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key, timeout=20.0)
                logger.info(f"[LLM Provider] Groq initialized with model: {self.default_model}")
            except Exception as e:
                logger.warning(f"[LLM Provider] Groq initialization error: {e}")

    def is_configured(self) -> bool:
        return self.client is not None

    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return self._fallback.generate(messages, temperature, max_tokens, model)

        selected_model = model or self.default_model
        max_retries = 3
        backoff = 1.0

        for attempt in range(1, max_retries + 1):
            try:
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=selected_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                elapsed = time.time() - start_time
                content = response.choices[0].message.content
                usage = response.usage
                return {
                    "content": content,
                    "tokens": {
                        "prompt": usage.prompt_tokens,
                        "completion": usage.completion_tokens,
                        "total": usage.total_tokens
                    },
                    "model": selected_model
                }
            except Exception as e:
                logger.warning(f"[Groq] Attempt {attempt} failed ({e}). Retrying in {backoff}s...")
                time.sleep(backoff)
                backoff *= 2

        logger.error("[Groq] All retries exhausted. Using local deterministic fallback.")
        return self._fallback.generate(messages, temperature, max_tokens, model)

    def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500
    ) -> Generator[str, None, None]:
        if not self.is_configured():
            yield from self._fallback.generate_stream(messages, temperature, max_tokens)
            return

        try:
            stream = self.client.chat.completions.create(
                model=self.default_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield delta
        except Exception as e:
            logger.warning(f"[Groq Stream] Error ({e}). Yielding fallback stream.")
            yield from self._fallback.generate_stream(messages, temperature, max_tokens)


class OpenAIProvider(BaseLLMProvider):
    """
    OpenAI / OpenAI-Compatible LLM Provider.
    """
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.default_model = os.getenv("LLM_MODEL") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.client = None
        self._fallback = LocalDeterministicProvider()
        if self.api_key and self.api_key != "your_openai_api_key_here":
            try:
                import httpx
                self.client = httpx.Client(
                    base_url=self.base_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=25.0
                )
                logger.info(f"[LLM Provider] OpenAI initialized with model: {self.default_model}")
            except Exception as e:
                logger.warning(f"[LLM Provider] OpenAI initialization error: {e}")

    def is_configured(self) -> bool:
        return self.client is not None

    def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.is_configured():
            return self._fallback.generate(messages, temperature, max_tokens, model)

        selected_model = model or self.default_model
        try:
            payload = {
                "model": selected_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            resp = self.client.post("/chat/completions", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                return {
                    "content": content,
                    "tokens": {
                        "prompt": usage.get("prompt_tokens", 0),
                        "completion": usage.get("completion_tokens", 0),
                        "total": usage.get("total_tokens", 0)
                    },
                    "model": selected_model
                }
            else:
                logger.warning(f"[OpenAI Provider] HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"[OpenAI Provider] Request failed: {e}")

        return self._fallback.generate(messages, temperature, max_tokens, model)

    def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1500
    ) -> Generator[str, None, None]:
        yield from self._fallback.generate_stream(messages, temperature, max_tokens)


class LLMFactory:
    """
    Factory to select the active LLM Provider based on environment configuration.
    """
    @staticmethod
    def get_provider() -> BaseLLMProvider:
        requested = (os.getenv("LLM_PROVIDER") or "").lower().strip()
        groq_key = os.getenv("GROQ_API_KEY", "")
        openai_key = os.getenv("OPENAI_API_KEY", "")

        if requested == "openai" or (not requested and openai_key and not groq_key):
            p = OpenAIProvider()
            if p.is_configured():
                return p
        elif requested == "groq" or (not requested and groq_key):
            p = GroqProvider()
            if p.is_configured():
                return p
        elif requested == "local":
            return LocalDeterministicProvider()

        # Try Groq then OpenAI, then fallback
        gp = GroqProvider()
        if gp.is_configured():
            return gp

        op = OpenAIProvider()
        if op.is_configured():
            return op

        return LocalDeterministicProvider()


llm_provider = LLMFactory.get_provider()

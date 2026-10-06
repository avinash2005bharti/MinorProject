"""
Unit and Integration Tests for Phase 1: LLM Provider Layer
Tests:
1. Unified LLMProvider role routing (reasoning vs vision)
2. Native tool-calling response structure & argument parsing
3. Offline / LocalDeterministicProvider graceful fallback (ARCH-01)
4. MockLLMProvider canned responses, tool call simulation, and call history
5. SentenceTransformerProvider embedding creation and dimension validation
"""

import pytest
from llm.provider import LLMProvider, LocalDeterministicProvider, BaseLLMProvider
from llm.mock_provider import MockLLMProvider
from embeddings.provider import SentenceTransformerProvider, LocalDenseEmbeddingProvider, EmbeddingFactory


def test_mock_llm_provider_basic():
    """Verify MockLLMProvider records calls and returns default responses."""
    mock = MockLLMProvider()
    assert mock.is_configured() is True

    resp = mock.chat(messages=[{"role": "user", "content": "Hello"}])
    assert "content" in resp
    assert resp["tokens"]["total"] > 0
    assert len(mock.call_history) == 1
    assert mock.call_history[0]["messages"][0]["content"] == "Hello"


def test_mock_llm_provider_canned_tool_call():
    """Verify MockLLMProvider simulates tool calls for agent loops."""
    mock = MockLLMProvider()
    canned_tc = [{
        "id": "call_123",
        "type": "function",
        "function": {
            "name": "get_student_attendance",
            "arguments": {"student_id": 42}
        }
    }]
    mock.add_canned_response(
        content="Looking up attendance...",
        tool_calls=canned_tc,
        reasoning="User asked for attendance of student 42."
    )

    resp = mock.chat(
        messages=[{"role": "user", "content": "What is attendance for student 42?"}],
        tools=[{"type": "function", "function": {"name": "get_student_attendance"}}],
        reasoning_effort="low"
    )

    assert resp["content"] == "Looking up attendance..."
    assert resp["tool_calls"] == canned_tc
    assert resp["reasoning"] == "User asked for attendance of student 42."
    assert mock.total_tokens_used > 0


def test_mock_llm_provider_error_simulation():
    """Verify MockLLMProvider can simulate API errors."""
    mock = MockLLMProvider()
    mock.simulate_error_once(RuntimeError("Rate limit 429"))

    with pytest.raises(RuntimeError) as exc_info:
        mock.chat(messages=[{"role": "user", "content": "Test error"}])
    assert "429" in str(exc_info.value)

    # Next call should succeed
    resp = mock.chat(messages=[{"role": "user", "content": "Retry"}])
    assert resp["role"] == "assistant"


def test_local_deterministic_provider():
    """Verify LocalDeterministicProvider never crashes and returns structured output."""
    local = LocalDeterministicProvider()
    assert local.is_configured() is True

    # Timetable query
    tt_resp = local.generate([{"role": "user", "content": "Give me the timetable for tomorrow"}])
    assert "Timetable" in tt_resp["content"]
    assert tt_resp["tokens"]["total"] > 0
    assert tt_resp["model"] == "local-deterministic-engine"

    # Attendance query
    att_resp = local.generate([{"role": "user", "content": "What is my attendance percentage?"}])
    assert "Attendance" in att_resp["content"]
    assert att_resp["tokens"]["total"] > 0


def test_llm_provider_roles():
    """Verify LLMProvider role routing defaults."""
    provider = LLMProvider()
    reasoning_model = provider.get_model_for_role("reasoning")
    vision_model = provider.get_model_for_role("vision")
    fallback_model = provider.get_model_for_role("fallback")

    assert reasoning_model is not None
    assert vision_model is not None
    assert fallback_model is not None
    # Vision model should be distinct or multimodal
    assert "qwen" in vision_model or "vision" in vision_model or "llama-4" in vision_model or "gpt-oss" in vision_model


def test_embeddings_provider():
    """Verify embeddings produce correct dimension vectors."""
    local_embed = LocalDenseEmbeddingProvider(dimension=768)
    vec = local_embed.embed_text("CampusFlow CSE Department Timetable")
    assert len(vec) == 768
    assert isinstance(vec[0], float)

    batch_vecs = local_embed.embed_batch(["First text", "Second text"])
    assert len(batch_vecs) == 2
    assert len(batch_vecs[0]) == 768
    assert len(batch_vecs[1]) == 768


def test_sentence_transformer_provider():
    """Verify SentenceTransformerProvider initialization and dimension handling."""
    stp = SentenceTransformerProvider(dimension=768)
    assert stp.dimension == 768
    # Test embed_text doesn't crash regardless of model download status
    vec = stp.embed_text("Computer Science Operating Systems")
    assert len(vec) == 768
    assert isinstance(vec[0], float)

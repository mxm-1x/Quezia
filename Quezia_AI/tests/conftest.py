"""Shared test fixtures."""
import pytest
from unittest.mock import MagicMock, AsyncMock


@pytest.fixture
def sample_state():
    """Minimal AIState dict for testing."""
    return {
        "task": "generate_question",
        "user_id": "test-user-1",
        "subject": "physics",
        "exam": "jee_main",
        "difficulty": "medium",
        "topic": "Mechanics",
        "question_type": "mcq",
        "retry_count": 0,
        "validation_passed": False,
        "requires_diagram": False,
        "last_error": None,
    }


@pytest.fixture
def mock_llm():
    """Mock LLMWrapper that returns a canned physics MCQ."""
    llm = MagicMock()
    canned = {
        "question_text": "A block of mass 2 kg slides on a table...",
        "options": ["10 N", "20 N", "30 N", "40 N"],
        "correct_answer": "B",
        "difficulty": "medium",
        "topic": "Mechanics",
        "requires_diagram": False,
        "question_type": "mcq",
    }
    llm.invoke.return_value = canned
    llm.ainvoke = AsyncMock(return_value=canned)
    return llm

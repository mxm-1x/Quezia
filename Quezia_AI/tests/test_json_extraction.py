"""Tests for LLMWrapper._extract_json – the robust JSON extractor."""
import pytest
from unittest.mock import MagicMock, patch


# We need to mock settings before importing LLMWrapper
@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    """Prevent LLMWrapper.__init__ from running during import."""
    pass


def _make_wrapper():
    """Create an LLMWrapper-like object with just _extract_json."""
    # Import after mocking
    with patch("app.core.llm.settings") as mock_s:
        mock_s.LLM_PROVIDER = "openai"
        mock_s.LLM_MODEL = "test"
        mock_s.LLM_TEMPERATURE = 0.7
        mock_s.LLM_MAX_TOKENS = 100
        mock_s.OPENAI_API_KEY = "sk-test"
        mock_s.LLM_MAX_CONCURRENT = 5

        from app.core.llm import LLMWrapper
        # Patch __init__ to avoid real LLM creation
        with patch.object(LLMWrapper, "__init__", lambda self: None):
            wrapper = LLMWrapper()
    return wrapper


def test_extract_plain_json():
    w = _make_wrapper()
    result = w._extract_json('{"key": "value"}')
    assert result == {"key": "value"}


def test_extract_json_from_markdown():
    w = _make_wrapper()
    text = 'Here is the answer:\n```json\n{"question": "What is 2+2?"}\n```\nDone.'
    result = w._extract_json(text)
    assert result["question"] == "What is 2+2?"


def test_extract_json_with_surrounding_text():
    w = _make_wrapper()
    text = 'Sure! Here is your question: {"q": "test", "a": "B"} Hope that helps!'
    result = w._extract_json(text)
    assert result["q"] == "test"


def test_extract_nested_json():
    w = _make_wrapper()
    text = 'Result: {"outer": {"inner": [1, 2, 3]}} end'
    result = w._extract_json(text)
    assert result["outer"]["inner"] == [1, 2, 3]


def test_extract_json_fails_gracefully():
    w = _make_wrapper()
    with pytest.raises(ValueError, match="Could not extract valid JSON"):
        w._extract_json("No JSON here at all")

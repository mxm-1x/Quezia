"""Tests for Pydantic API schemas (request validation)."""
import pytest
from pydantic import ValidationError

from app.models.api_schemas import GenerateRequest, AnalyzeRequest


# =============================================================================
# GenerateRequest tests
# =============================================================================

class TestGenerateRequest:
    def test_default_generates_test(self):
        req = GenerateRequest(user_id="u1", subject="physics")
        state = req.to_state()
        assert state["task"] == "generate_test"
        assert state["questionCount"] == 30
        assert state["testMode"] == "test"
        assert state["subject"] == "physics"

    def test_custom_question_count(self):
        req = GenerateRequest(user_id="u1", subjects=["physics", "math"], questionCount=60)
        state = req.to_state()
        assert state["task"] == "generate_test"
        assert state["questionCount"] == 60
        assert state["testMode"] == "test"

    def test_single_question_rejected(self):
        """questionCount=1 is not allowed — minimum is 2."""
        with pytest.raises(ValidationError):
            GenerateRequest(user_id="u1", subject="physics", questionCount=1)

    def test_subject_normalized_to_lowercase(self):
        req = GenerateRequest(user_id="u1", subject="PHYSICS")
        assert req.subject == "physics"

    def test_invalid_subject_rejected(self):
        with pytest.raises(ValidationError):
            GenerateRequest(user_id="u1", subject="history")

    def test_invalid_difficulty_rejected(self):
        with pytest.raises(ValidationError):
            GenerateRequest(user_id="u1", subject="physics", difficulty="impossible")

    def test_difficulty_defaults_to_mixed(self):
        req = GenerateRequest(user_id="u1", subject="physics")
        assert req.difficulty == "mixed"

    def test_question_type_defaults_to_mixed(self):
        req = GenerateRequest(user_id="u1", subject="physics")
        assert req.question_type == "mixed"

    def test_subjects_list_validation(self):
        req = GenerateRequest(user_id="u1", subjects=["PHYSICS", "MATH"])
        assert req.subjects == ["physics", "math"]

    def test_invalid_subjects_list_rejected(self):
        with pytest.raises(ValidationError):
            GenerateRequest(user_id="u1", subjects=["physics", "biology"])

    def test_question_count_alias(self):
        req = GenerateRequest(user_id="u1", subject="physics", questionCount=5)
        assert req.question_count == 5

    def test_question_count_max_limit(self):
        with pytest.raises(ValidationError):
            GenerateRequest(user_id="u1", subject="physics", questionCount=201)


# =============================================================================
# AnalyzeRequest tests
# =============================================================================

class TestAnalyzeRequest:
    def test_valid_request(self):
        req = AnalyzeRequest(
            user_id="u1",
            raw_attempt_data={"attempts": [{"question_id": "q1", "subject": "physics",
                                            "topic": "Thermo", "difficulty": "easy",
                                            "is_correct": True, "time_taken_seconds": 60}]}
        )
        state = req.to_state()
        assert state["task"] == "analyze_performance"
        assert len(state["raw_attempt_data"]["attempts"]) == 1

    def test_empty_attempts_rejected(self):
        with pytest.raises(ValidationError):
            AnalyzeRequest(user_id="u1", raw_attempt_data={"attempts": []})

    def test_missing_attempts_key_rejected(self):
        with pytest.raises(ValidationError):
            AnalyzeRequest(user_id="u1", raw_attempt_data={"data": []})

    def test_default_exam(self):
        req = AnalyzeRequest(
            user_id="u1",
            raw_attempt_data={"attempts": [{"question_id": "q1", "is_correct": True}]}
        )
        assert req.exam == "JEE_MAIN"

    def test_empty_user_id_rejected(self):
        with pytest.raises(ValidationError):
            AnalyzeRequest(user_id="", raw_attempt_data={"attempts": [{"q": 1}]})
